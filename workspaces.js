import { validateState, snapshot } from "./core.js";

export const COLORS = ["violet", "blue", "mint", "rose", "amber", "slate"];
export const ICONS = ["folder", "code", "book", "briefcase", "spark", "globe"];
export function createWorkspace(state, workspace) {
  return validateState({
    ...state,
    workspaces: [
      ...state.workspaces,
      { tabs: [], updatedAt: new Date().toISOString(), ...workspace },
    ],
  });
}
export function editWorkspace(state, id, changes) {
  if (!state.workspaces.some((w) => w.id === id))
    throw new Error("Der Arbeitsbereich existiert nicht mehr.");
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([key]) =>
      ["name", "favorite", "color", "icon"].includes(key),
    ),
  );
  return validateState({
    ...state,
    workspaces: state.workspaces.map((w) =>
      w.id === id ? { ...w, ...allowed } : w,
    ),
  });
}
export function duplicateWorkspace(state, id, newId, name) {
  const current = state.workspaces.find((w) => w.id === id);
  if (!current) throw new Error("Der Arbeitsbereich existiert nicht mehr.");
  return createWorkspace(state, {
    ...structuredClone(current),
    id: newId,
    name,
    favorite: false,
  });
}
export function reorderWorkspace(state, id, beforeId) {
  const workspace = state.workspaces.find((w) => w.id === id);
  if (
    !workspace ||
    (beforeId !== null && !state.workspaces.some((w) => w.id === beforeId))
  )
    throw new Error("Der Arbeitsbereich existiert nicht mehr.");
  if (id === beforeId) return state;
  const workspaces = state.workspaces.filter((w) => w.id !== id);
  workspaces.splice(
    beforeId === null
      ? workspaces.length
      : workspaces.findIndex((w) => w.id === beforeId),
    0,
    workspace,
  );
  return validateState({ ...state, workspaces });
}
export function addTabs(state, id, tabs, date = new Date().toISOString()) {
  const workspace = state.workspaces.find((w) => w.id === id);
  if (!workspace) throw new Error("Der Arbeitsbereich existiert nicht mehr.");
  const combined = snapshot([...workspace.tabs, ...tabs]);
  return validateState({
    ...state,
    workspaces: state.workspaces.map((w) =>
      w.id === id ? { ...w, tabs: combined, updatedAt: date } : w,
    ),
  });
}
export function moveTabs(
  state,
  fromId,
  toId,
  urls,
  beforeUrl = null,
  expected = {},
) {
  const current = validateState(state);
  const from = current.workspaces.find((w) => w.id === fromId),
    to = current.workspaces.find((w) => w.id === toId);
  if (!from || !to) throw new Error("Der Arbeitsbereich existiert nicht mehr.");
  for (const w of [from, to]) {
    if (
      expected[w.id] &&
      JSON.stringify(w.tabs) !== JSON.stringify(expected[w.id])
    )
      throw new Error(
        "Die Sicherung wurde in einem anderen Fenster geändert. Bitte neu auswählen.",
      );
  }
  const chosen = new Set(urls),
    moving = from.tabs.filter((t) => chosen.has(t.url));
  if (moving.length !== chosen.size)
    throw new Error("Ein ausgewählter Tab wurde bereits geändert.");
  if (fromId === toId && chosen.has(beforeUrl)) return current;
  const destination = to.tabs.filter((t) => !chosen.has(t.url));
  const position =
    beforeUrl === null
      ? destination.length
      : destination.findIndex((t) => t.url === beforeUrl);
  if (position < 0) throw new Error("Das Ziel wurde bereits geändert.");
  destination.splice(position, 0, ...moving);
  // Validate the complete transaction before any storage write. An overfull target never loses source tabs.
  return validateState({
    ...current,
    workspaces: current.workspaces.map((w) =>
      w.id === toId
        ? { ...w, tabs: destination }
        : w.id === fromId
          ? { ...w, tabs: w.tabs.filter((t) => !chosen.has(t.url)) }
          : w,
    ),
  });
}
export function deleteWorkspace(state, id, expected) {
  const found = state.workspaces.find((w) => w.id === id);
  if (
    !found ||
    (expected && JSON.stringify(found) !== JSON.stringify(expected))
  )
    throw new Error(
      "Die Sicherung wurde in einem anderen Fenster geändert. Bitte neu auswählen.",
    );
  return validateState({
    ...state,
    workspaces: state.workspaces.filter((w) => w.id !== id),
  });
}
