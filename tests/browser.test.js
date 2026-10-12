import test from "node:test";
import assert from "node:assert/strict";
import { captureWindow, openSavedTabs } from "../browser.js";
const tabs = [
  { url: "https://example.com/first", title: "First", pinned: true },
  { url: "https://example.com/second", title: "Second", pinned: false },
  { url: "https://example.com/third", title: "Third", pinned: true },
];
function browser(failUrl = null) {
  const calls = [];
  return {
    calls,
    windows: {
      get: async () => ({
        type: "normal",
        incognito: false,
        tabs: [...tabs, tabs[0], { url: "chrome://settings" }],
      }),
      create: async (options) => {
        calls.push(["window", options]);
        return { id: 42, tabs: [{ id: 1 }] };
      },
    },
    tabs: {
      create: async (options) => {
        calls.push(["tab", options]);
        if (options.url === failUrl) throw new Error("Failed");
        return { id: 2 };
      },
      update: async (id, options) => {
        calls.push(["pin", id, options]);
      },
      query: async () => [{ id: 1 }],
    },
  };
}
test("capture excludes internal and duplicate tabs and reports omitted count", async () => {
  const result = await captureWindow(browser(), 1);
  assert.equal(result.tabs.length, 3);
  assert.equal(result.omitted, 2);
  assert.equal(result.source, "Fenster 1");
});
test("capture rejects private windows even if caller provides their ID", async () => {
  const api = browser();
  api.windows.get = async () => ({ type: "normal", incognito: true, tabs });
  await assert.rejects(captureWindow(api, 1), /private/);
});
test("capture rejects non-normal windows and invalid ID", async () => {
  const api = browser();
  api.windows.get = async () => ({ type: "popup", incognito: false, tabs });
  await assert.rejects(captureWindow(api, 1));
  await assert.rejects(captureWindow(api, NaN));
});
test("restore creates one new window, preserves URLs and pins, never closes tabs", async () => {
  const api = browser(),
    progress = [];
  const result = await openSavedTabs(api, tabs, (done, total) =>
    progress.push([done, total]),
  );
  assert.equal(result.opened, 3);
  assert.deepEqual(api.calls[0], [
    "window",
    { url: tabs[0].url, focused: true },
  ]);
  assert.deepEqual(api.calls[1], ["pin", 1, { pinned: true }]);
  assert.equal(api.calls.filter((call) => call[0] === "window").length, 1);
  assert.equal(api.calls[3][1].pinned, true);
  assert.deepEqual(progress, [
    [1, 3],
    [2, 3],
    [3, 3],
  ]);
});
test("partial failure returns only failed tabs and continues remaining URLs", async () => {
  const result = await openSavedTabs(browser(tabs[1].url), tabs);
  assert.equal(result.opened, 2);
  assert.equal(result.failed.length, 1);
  assert.deepEqual(result.failed[0].tab, tabs[1]);
});
test("retry reuses window and opens only failed tabs", async () => {
  const api = browser();
  const result = await openSavedTabs(api, [tabs[1]], () => {}, 42);
  assert.equal(result.opened, 1);
  assert.equal(api.calls.filter((call) => call[0] === "window").length, 0);
  assert.deepEqual(api.calls[0], [
    "tab",
    { windowId: 42, url: tabs[1].url, pinned: false, active: false },
  ]);
});
test("pin failure is separate from failed URL so retry cannot duplicate it", async () => {
  const api = browser();
  api.tabs.update = async () => {
    throw new Error("pin failed");
  };
  const result = await openSavedTabs(api, [tabs[0]]);
  assert.equal(result.opened, 1);
  assert.equal(result.pinFailures, 1);
  assert.deepEqual(result.failed, []);
});
test("new-window failure is propagated and no extra tabs opened", async () => {
  const api = browser();
  api.windows.create = async () => {
    throw new Error("window failed");
  };
  await assert.rejects(openSavedTabs(api, tabs), /window failed/);
  assert.equal(api.calls.length, 0);
});
test("empty restore request cannot create a blank window", async () => {
  const api = browser();
  await assert.rejects(openSavedTabs(api, []));
  assert.equal(api.calls.length, 0);
});
test("missing new-window ID cannot redirect saved tabs to current window", async () => {
  const api = browser();
  api.windows.create = async () => ({});
  await assert.rejects(openSavedTabs(api, tabs), /ermittelt/);
  assert.equal(api.calls.length, 0);
});
