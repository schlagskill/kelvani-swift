import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { openManager } from "../manager.js";
const base = "chrome-extension://test/index.html";
test("toolbar opens a local popup with a background worker for resilient multi-tab restoration", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../manifest.json", import.meta.url), "utf8"),
  );
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.deepEqual(manifest.background, {
    service_worker: "background.js",
    type: "module",
  });
  assert.deepEqual(manifest.permissions, ["storage", "tabs"]);
  for (const path of ["popup.html", "index.html"]) {
    const html = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(html, /src="controller.js"/);
    assert.doesNotMatch(html, /(?:src|href)="https?:\/\//);
  }
});
test("expanding preserves selected workspace and opens only the packaged full manager", async () => {
  let created;
  const browser = {
    runtime: { getURL: () => base },
    tabs: {
      query: async () => [],
      create: async (args) => {
        created = args;
        return { id: 8 };
      },
    },
  };
  assert.equal(await openManager(browser, "work & home"), 8);
  assert.deepEqual(created, {
    url: `${base}?workspace=work%20%26%20home`,
    active: true,
  });
});
test("expanding reuses an existing full manager and focuses its window", async () => {
  const calls = [];
  const browser = {
    runtime: { getURL: () => base },
    tabs: {
      query: async () => [{ id: 4, windowId: 9, url: `${base}?workspace=old` }],
      update: async (...args) => calls.push(args),
      create: async () => assert.fail("must reuse"),
    },
    windows: { update: async (...args) => calls.push(args) },
  };
  await openManager(browser, "new");
  assert.deepEqual(calls, [
    [4, { url: `${base}?workspace=old#workspace=new`, active: true }],
    [9, { focused: true }],
  ]);
});
test("same workspace only focuses the manager; it never reloads an existing draft", async () => {
  const calls = [],
    browser = {
      runtime: { getURL: () => base },
      tabs: {
        query: async () => [
          { id: 1, windowId: 2, url: `${base}?workspace=current` },
        ],
        update: async (...args) => calls.push(args),
      },
      windows: { update: async () => {} },
    };
  await openManager(browser, "current");
  assert.deepEqual(calls, [[1, { active: true }]]);
});
test("manager creation failures reach the UI without falling back to external websites", async () => {
  const browser = {
    runtime: { getURL: () => base },
    tabs: {
      query: async () => [],
      create: async () => {
        throw new Error("denied");
      },
    },
  };
  await assert.rejects(openManager(browser), /denied/);
});
