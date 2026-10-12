import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY, validateState, safeUrl, saveWorkspace } from "../core.js";
import {
  createWorkspace,
  editWorkspace,
  duplicateWorkspace,
  reorderWorkspace,
  addTabs,
  moveTabs,
  deleteWorkspace,
} from "../workspaces.js";
const tab = (i) => ({
  url: `https://example.com/${i}`,
  title: `Tab ${i}`,
  pinned: false,
});
const state = createWorkspace(
  createWorkspace(EMPTY, {
    id: "a",
    name: "A",
    tabs: [tab(1), tab(2), tab(3)],
    favorite: true,
    color: "mint",
    icon: "code",
  }),
  { id: "b", name: "B", tabs: [tab(4)] },
);
test("old v1 backups stay valid; optional metadata and settings round-trip", () => {
  const old = {
    version: 1,
    workspaces: [
      {
        id: "old",
        name: "Old",
        tabs: [tab(1)],
        updatedAt: "2026-10-12T10:00:00Z",
      },
    ],
  };
  assert.deepEqual(validateState(old), old);
  const newer = { ...state, settings: { language: "en", theme: "dark" } };
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(newer))), newer);
});
test("empty workspace creation and limits do not mutate previous state", () => {
  assert.equal(
    createWorkspace(EMPTY, { id: "new", name: "Empty" }).workspaces[0].tabs
      .length,
    0,
  );
  assert.equal(EMPTY.workspaces.length, 0);
  const full = {
    version: 1,
    workspaces: Array.from({ length: 100 }, (_, i) => ({
      ...state.workspaces[0],
      id: String(i),
    })),
  };
  assert.throws(() => createWorkspace(full, { id: "last", name: "Limit" }));
});
test("metadata edits cannot overwrite tabs or IDs; recaptures preserve settings and metadata", () => {
  const edited = editWorkspace(state, "a", {
    name: "Renamed",
    id: "intruder",
    tabs: [],
    color: "rose",
  });
  assert.equal(edited.workspaces[0].name, "Renamed");
  assert.equal(edited.workspaces[0].id, "a");
  assert.equal(edited.workspaces[0].tabs.length, 3);
  const s = { ...edited, settings: { language: "en", theme: "light" } };
  const captured = saveWorkspace(
    s,
    "Renamed",
    [tab(5)],
    "a",
    "2026-10-13T12:00:00Z",
  );
  assert.equal(captured.workspaces[0].color, "rose");
  assert.equal(captured.workspaces[0].favorite, true);
  assert.deepEqual(captured.settings, s.settings);
});
test("duplicate has its own ID and changes leave source untouched", () => {
  const copy = duplicateWorkspace(state, "a", "c", "A copy");
  assert.equal(copy.workspaces.length, 3);
  assert.equal(copy.workspaces[2].favorite, false);
  copy.workspaces[2].tabs[0].title = "Changed";
  assert.equal(state.workspaces[0].tabs[0].title, "Tab 1");
  assert.throws(() => duplicateWorkspace(state, "a", "a", "Duplicate ID"));
});
test("workspace reorder works before another workspace or at the end", () => {
  assert.deepEqual(
    reorderWorkspace(state, "b", "a").workspaces.map((w) => w.id),
    ["b", "a"],
  );
  assert.deepEqual(
    reorderWorkspace(state, "a", null).workspaces.map((w) => w.id),
    ["b", "a"],
  );
  assert.deepEqual(
    state.workspaces.map((w) => w.id),
    ["a", "b"],
  );
});
test("saved tabs reorder in the same workspace while retaining order of multi-selection", () => {
  const next = moveTabs(state, "a", "a", [tab(3).url], tab(1).url, {
    a: state.workspaces[0].tabs,
  });
  assert.deepEqual(
    next.workspaces[0].tabs.map((t) => t.title),
    ["Tab 3", "Tab 1", "Tab 2"],
  );
  const multi = moveTabs(state, "a", "a", [tab(1).url, tab(2).url], null);
  assert.deepEqual(
    multi.workspaces[0].tabs.map((t) => t.title),
    ["Tab 3", "Tab 1", "Tab 2"],
  );
});
test("cross-workspace move is atomic, deduplicates destination, and permits an empty source", () => {
  const withDuplicate = addTabs(state, "b", [tab(1)]);
  const next = moveTabs(
    withDuplicate,
    "a",
    "b",
    state.workspaces[0].tabs.map((t) => t.url),
  );
  assert.equal(next.workspaces[0].tabs.length, 0);
  assert.equal(next.workspaces[1].tabs.length, 4);
  assert.equal(state.workspaces[0].tabs.length, 3);
});
test("overfull destination, stale source/target, vanished insertion points never lose data", () => {
  const full = addTabs(
    state,
    "b",
    Array.from({ length: 199 }, (_, i) => tab(100 + i)),
  );
  const before = JSON.stringify(full);
  assert.throws(() => moveTabs(full, "a", "b", [tab(1).url]));
  assert.equal(JSON.stringify(full), before);
  assert.throws(
    () => moveTabs(state, "a", "b", [tab(1).url], null, { a: [] }),
    /anderen Fenster/,
  );
  assert.throws(
    () => moveTabs(state, "a", "b", [tab(1).url], null, { b: [] }),
    /anderen Fenster/,
  );
  assert.throws(() => moveTabs(state, "a", "b", [tab(1).url], tab(99).url));
});
test("delete detects stale workspace and retains unrelated workspace", () => {
  const next = deleteWorkspace(state, "a", state.workspaces[0]);
  assert.equal(next.workspaces[0].id, "b");
  assert.throws(
    () =>
      deleteWorkspace(state, "a", { ...state.workspaces[0], name: "Changed" }),
    /anderen Fenster/,
  );
});
test("unsafe, oversized, duplicate canonical URLs and unsupported settings are rejected", () => {
  assert.throws(() => safeUrl(`https://example.com/${"€".repeat(1500)}`));
  assert.throws(() =>
    createWorkspace(EMPTY, { id: "a", name: "A", tabs: [tab(1), tab(1)] }),
  );
  assert.throws(() =>
    validateState({ ...state, settings: { language: "xx", theme: "dark" } }),
  );
  assert.throws(() => editWorkspace(state, "a", { color: "#javascript" }));
});
