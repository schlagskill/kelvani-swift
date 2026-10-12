import test from "node:test";
import assert from "node:assert/strict";
import { saveWorkspace } from "../core.js";
let stored,
  failWrites = false,
  queue = Promise.resolve();
globalThis.chrome = {
  runtime: { id: "test-extension" },
  storage: {
    local: {
      get: async (key) => ({ [key]: structuredClone(stored) }),
      set: async (data) => {
        if (failWrites) throw new Error("quota exceeded");
        stored = structuredClone(Object.values(data)[0]);
      },
    },
  },
};
Object.defineProperty(navigator, "locks", {
  value: {
    request: (_name, action) => {
      const next = queue.then(action);
      queue = next.catch(() => {});
      return next;
    },
  },
  configurable: true,
});
const { load, update } = await import("../storage.js");
test("concurrent captures retain both workspaces", async () => {
  stored = undefined;
  const tabs = [{ url: "https://example.com", title: "Test" }];
  await Promise.all(
    ["a", "b"].map((id) =>
      update((s) => saveWorkspace(s, id, tabs, id, "2026-10-12T10:00:00Z")),
    ),
  );
  assert.equal((await load()).workspaces.length, 2);
});
test("quota errors preserve previous workspaces", async () => {
  const before = structuredClone(stored);
  failWrites = true;
  await assert.rejects(
    update((s) => ({ ...s, workspaces: [] })),
    /quota/,
  );
  failWrites = false;
  assert.deepEqual(stored, before);
});
test("corrupt saved state cannot be overwritten", async () => {
  stored = { version: 99 };
  await assert.rejects(update((s) => ({ ...s, workspaces: [] })));
  assert.deepEqual(stored, { version: 99 });
});
