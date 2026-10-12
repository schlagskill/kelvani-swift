import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY,
  saveWorkspace,
  validateState,
  removeSavedTabs,
} from "../core.js";
const tabs = [
  { url: "https://example.com/a", title: "A", pinned: false },
  { url: "https://example.com/b", title: "B", pinned: true },
];
const state = saveWorkspace(
  EMPTY,
  "Work",
  tabs,
  "work",
  "2026-10-12T10:00:00Z",
  "Fenster 2",
);
test("capture source survives export and import", () => {
  assert.equal(
    validateState(JSON.parse(JSON.stringify(state))).workspaces[0].source,
    "Fenster 2",
  );
});
test("removing saved tab keeps original snapshot date and does not mutate input", () => {
  const next = removeSavedTabs(
    state,
    "work",
    [tabs[0].url],
    state.workspaces[0].tabs,
  );
  assert.equal(next.workspaces[0].tabs.length, 1);
  assert.equal(next.workspaces[0].updatedAt, state.workspaces[0].updatedAt);
  assert.equal(state.workspaces[0].tabs.length, 2);
});
test("removing all saved tabs retains the empty workspace and metadata", () => {
  const next = removeSavedTabs(
    state,
    "work",
    tabs.map((tab) => tab.url),
    state.workspaces[0].tabs,
  );
  assert.equal(next.workspaces[0].tabs.length, 0);
  assert.equal(next.workspaces[0].name, "Work");
  assert.equal(next.workspaces[0].source, "Fenster 2");
  assert.equal(state.workspaces[0].tabs.length, 2);
});
test("stale selections are rejected instead of modifying another snapshot", () => {
  assert.throws(
    () => removeSavedTabs(state, "work", [tabs[0].url], [tabs[0]]),
    /anderen Fenster/,
  );
});
