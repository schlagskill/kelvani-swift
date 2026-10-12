import test from "node:test";
import assert from "node:assert/strict";
import { openOrFocusTabs, listWindows } from "../browser.js";
const tab = (n) => ({
  url: `https://example.com/${n}`,
  title: String(n),
  pinned: false,
});
function mock({ fail = false, focusFail = false } = {}) {
  const calls = [],
    live = [{ ...tab(1), id: 11 }];
  const browser = {
    windows: {
      getAll: async () => [
        { id: 1, type: "normal", tabs: live },
        {
          id: 2,
          type: "normal",
          incognito: true,
          tabs: [{ ...tab(2), id: 22 }],
        },
        { id: 3, type: "popup", tabs: [{ ...tab(3), id: 33 }] },
      ],
      create: async (args) => {
        calls.push(["window", args]);
        return { id: 4, tabs: [{ ...tab(2), id: 42 }] };
      },
      update: async (...args) => {
        calls.push(["focus", ...args]);
        if (focusFail) throw new Error("gone");
      },
    },
    tabs: {
      create: async (args) => {
        calls.push(["create", args]);
        if (fail) throw new Error("denied");
        live.push({ ...args, id: 12 });
        return { id: 12 };
      },
      update: async (...args) => calls.push(["activate", ...args]),
      query: async () => live,
      remove: () => assert.fail("existing tabs must never close"),
    },
  };
  return { browser, calls };
}
test("all already open: focuses existing tab and creates nothing", async () => {
  const { browser, calls } = mock();
  const result = await openOrFocusTabs(browser, [tab(1)], 1);
  assert.equal(result.reused, 1);
  assert.equal(result.opened, 0);
  assert.deepEqual(calls, [
    ["activate", 11, { active: true }],
    ["focus", 1, { focused: true }],
  ]);
});
test("mixed restoration creates only missing URLs in a verified normal window", async () => {
  const { browser, calls } = mock();
  const result = await openOrFocusTabs(browser, [tab(1), tab(2)], 1);
  assert.equal(result.reused, 1);
  assert.equal(result.opened, 1);
  assert.equal(calls.filter((c) => c[0] === "create").length, 1);
  assert.equal(calls.find((c) => c[0] === "create")[1].windowId, 1);
  assert.equal(
    calls.some((c) => c[0] === "window"),
    false,
  );
});
test("private/popup window tabs do not count as reusable; unsafe target creates normal window", async () => {
  const { browser, calls } = mock();
  const result = await openOrFocusTabs(browser, [tab(2)], 2);
  assert.equal(result.reused, 0);
  assert.equal(result.opened, 1);
  assert.equal(calls[0][0], "window");
  assert.equal((await listWindows(browser)).length, 1);
});
test("partial failures are available for retry; no tab is closed", async () => {
  const { browser } = mock({ fail: true });
  const result = await openOrFocusTabs(browser, [tab(1), tab(2)], 1);
  assert.equal(result.reused, 1);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].tab.url, tab(2).url);
});
test("focus failure does not retry already open URLs as new tabs", async () => {
  const { browser, calls } = mock({ focusFail: true });
  const result = await openOrFocusTabs(browser, [tab(1)]);
  assert.equal(result.focusFailed, true);
  assert.equal(result.reused, 1);
  assert.equal(
    calls.some((c) => ["window", "create"].includes(c[0])),
    false,
  );
});
