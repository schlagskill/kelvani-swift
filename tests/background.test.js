import test from "node:test";
import assert from "node:assert/strict";
import { handleOpenRequest, OPEN_RESULT_KEY } from "../background.js";
const tab = (n) => ({
  url: `https://example.com/${n}`,
  title: String(n),
  pinned: false,
});
function mock() {
  const live = [],
    stored = [],
    calls = [];
  const browser = {
    runtime: { id: "swift" },
    storage: { local: { set: async (data) => stored.push(data) } },
    windows: {
      getAll: async () => [{ id: 1, type: "normal", tabs: live }],
      update: async () => {},
    },
    tabs: {
      create: async (args) => {
        await Promise.resolve();
        calls.push(args);
        live.push({ ...args, id: live.length + 1 });
      },
      query: async () => live,
      update: async () => {},
    },
  };
  return { browser, live, stored, calls };
}
const request = (id, tabs = [tab(1), tab(2)]) => ({
  type: "swift.open-tabs",
  requestId: id,
  tabs,
  targetWindowId: 1,
});
test("background finishes all tabs and persists failures after the popup client disappears", async () => {
  const { browser, stored, calls } = mock();
  const task = handleOpenRequest(browser, request("closed-popup"), {
    id: "swift",
  });
  // No popup response receiver participates in the operation.
  const result = await task;
  assert.equal(result.opened, 2);
  assert.equal(calls.length, 2);
  assert.equal(stored[0][OPEN_RESULT_KEY].requestId, "closed-popup");
  assert.equal(stored[0][OPEN_RESULT_KEY].opened, 2);
});
test("concurrent popup/full-manager requests are serialized and reuse newly opened tabs", async () => {
  const { browser, calls } = mock();
  const results = await Promise.all(
    ["popup", "manager"].map((id) =>
      handleOpenRequest(browser, request(id), { id: "swift" }),
    ),
  );
  assert.equal(calls.length, 2);
  assert.equal(results[0].opened, 2);
  assert.equal(results[1].reused, 2);
  assert.equal(results[1].opened, 0);
});
test("foreign senders and unsafe payloads cannot ask the worker to open tabs", () => {
  const { browser, calls } = mock();
  assert.throws(() =>
    handleOpenRequest(browser, request("x"), { id: "foreign" }),
  );
  assert.throws(() =>
    handleOpenRequest(browser, request("x", [{ url: "javascript:alert(1)" }]), {
      id: "swift",
    }),
  );
  assert.throws(() =>
    handleOpenRequest(
      browser,
      { ...request("x"), targetWindowId: "1" },
      { id: "swift" },
    ),
  );
  assert.equal(calls.length, 0);
});
test("a failed queued request does not block the following restoration", async () => {
  const first = mock();
  first.browser.windows.getAll = async () => {
    throw new Error("unavailable");
  };
  await assert.rejects(
    handleOpenRequest(first.browser, request("first"), { id: "swift" }),
    /unavailable/,
  );
  const second = mock();
  assert.equal(
    (
      await handleOpenRequest(second.browser, request("second"), {
        id: "swift",
      })
    ).opened,
    2,
  );
});
test("full report storage does not turn successful browser operations into a failed restore", async () => {
  const { browser, calls } = mock();
  browser.storage.local.set = async () => {
    throw new Error("quota exceeded");
  };
  const result = await handleOpenRequest(browser, request("quota"), {
    id: "swift",
  });
  assert.equal(result.opened, 2);
  assert.equal(result.reportNotSaved, true);
  assert.equal(calls.length, 2);
});
test("failure report retains retry URLs even without a popup response receiver", async () => {
  const { browser, stored } = mock();
  browser.tabs.create = async () => {
    throw new Error("tab creation denied");
  };
  const result = await handleOpenRequest(browser, request("partial"), {
    id: "swift",
  });
  assert.equal(result.failed.length, 2);
  assert.equal(stored[0][OPEN_RESULT_KEY].failed.length, 2);
  assert.deepEqual(
    stored[0][OPEN_RESULT_KEY].failed.map((item) => item.tab.url),
    [tab(1).url, tab(2).url],
  );
});
