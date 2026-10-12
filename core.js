export const EMPTY = { version: 1, workspaces: [] };
export function safeUrl(input) {
  if (typeof input !== "string" || input.length > 8192)
    throw new Error("Ungültige Webadresse.");
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error(
      "Nur Webadressen ohne eingebettete Zugangsdaten werden unterstützt.",
    );
  if (url.href.length > 8192) throw new Error("Webadresse zu lang.");
  return url.href;
}
export function snapshot(tabs) {
  const seen = new Set(),
    result = [];
  for (const tab of tabs) {
    if (tab.incognito) continue;
    try {
      const url = safeUrl(tab.url);
      if (seen.has(url)) continue;
      if (result.length >= 200)
        throw new RangeError(
          "Ein Arbeitsbereich unterstützt höchstens 200 unterschiedliche Web-Tabs.",
        );
      seen.add(url);
      result.push({
        url,
        title: String(tab.title || new URL(url).hostname).slice(0, 300),
        pinned: Boolean(tab.pinned),
      });
    } catch (error) {
      if (error instanceof RangeError) throw error;
    }
  }
  return result;
}
export function validateState(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.workspaces) ||
    value.workspaces.length > 100
  )
    throw new Error("Ungültiges KelvaniSwift-Backup.");
  const ids = new Set();
  const workspaces = value.workspaces.map((w) => {
    if (
      !w ||
      typeof w.id !== "string" ||
      !w.id ||
      w.id.length > 100 ||
      ids.has(w.id) ||
      typeof w.name !== "string" ||
      !w.name.trim() ||
      w.name.length > 80 ||
      typeof w.updatedAt !== "string" ||
      w.updatedAt.length > 40 ||
      !Number.isFinite(Date.parse(w.updatedAt)) ||
      !Array.isArray(w.tabs) ||
      w.tabs.length > 200
    )
      throw new Error("Ungültiger Arbeitsbereich.");
    ids.add(w.id);
    const tabs = w.tabs.map((t) => {
      if (
        !t ||
        typeof t.title !== "string" ||
        t.title.length > 300 ||
        typeof t.url !== "string" ||
        t.url.length > 8192 ||
        typeof t.pinned !== "boolean"
      )
        throw new Error("Ungültiger Tab.");
      return { title: t.title, url: safeUrl(t.url), pinned: t.pinned };
    });
    if (
      w.source !== undefined &&
      (typeof w.source !== "string" || w.source.length > 100)
    )
      throw new Error("Ungültige Fensterquelle.");
    if (new Set(tabs.map((t) => t.url)).size !== tabs.length)
      throw new Error("Doppelte Tabs im Arbeitsbereich.");
    const metadata = {};
    if (w.favorite !== undefined) {
      if (typeof w.favorite !== "boolean")
        throw new Error("Ungültiger Favorit.");
      metadata.favorite = w.favorite;
    }
    if (w.color !== undefined) {
      if (
        !["violet", "blue", "mint", "rose", "amber", "slate"].includes(w.color)
      )
        throw new Error("Ungültige Farbe.");
      metadata.color = w.color;
    }
    if (w.icon !== undefined) {
      if (
        !["folder", "code", "book", "briefcase", "spark", "globe"].includes(
          w.icon,
        )
      )
        throw new Error("Ungültiges Symbol.");
      metadata.icon = w.icon;
    }
    return {
      id: w.id,
      name: w.name.trim(),
      updatedAt: w.updatedAt,
      tabs,
      ...metadata,
      ...(w.source !== undefined ? { source: w.source } : {}),
    };
  });
  const result = { version: 1, workspaces };
  if (value.settings !== undefined) {
    const s = value.settings;
    if (
      !s ||
      !["de", "en"].includes(s.language) ||
      !["system", "light", "dark"].includes(s.theme)
    )
      throw new Error("Ungültige Einstellungen.");
    result.settings = { language: s.language, theme: s.theme };
  }
  return result;
}
export function saveWorkspace(state, name, tabs, id, date, source) {
  const clean = snapshot(tabs);
  if (!clean.length)
    throw new Error("Keine unterstützten Web-Tabs im ausgewählten Fenster.");
  const old = state.workspaces.find((w) => w.id === id);
  const workspace = {
    ...old,
    id,
    name,
    tabs: clean,
    updatedAt: date,
    ...(source !== undefined ? { source } : {}),
  };
  const exists = state.workspaces.some((w) => w.id === id);
  return validateState({
    ...state,
    workspaces: exists
      ? state.workspaces.map((w) => (w.id === id ? workspace : w))
      : [...state.workspaces, workspace],
  });
}
export function mergeBackup(state, incoming, newId) {
  const result = structuredClone(validateState(state));
  for (const workspace of validateState(incoming).workspaces) {
    const existing = result.workspaces.find((w) => w.id === workspace.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(workspace))
      continue;
    result.workspaces.push({
      ...workspace,
      id: existing ? newId() : workspace.id,
    });
  }
  return validateState(result);
}
export function filterWorkspaces(state, query) {
  const q = query.trim().toLocaleLowerCase();
  return state.workspaces.filter((w) =>
    [w.name, ...w.tabs.flatMap((t) => [t.title, t.url])].some((text) =>
      text.toLocaleLowerCase().includes(q),
    ),
  );
}

export function removeSavedTabs(state, id, urls, expectedTabs) {
  const current = validateState(state),
    workspace = current.workspaces.find((w) => w.id === id);
  if (
    !workspace ||
    JSON.stringify(workspace.tabs) !== JSON.stringify(expectedTabs)
  )
    throw new Error(
      "Die Sicherung wurde in einem anderen Fenster geändert. Bitte neu auswählen.",
    );
  const tabs = workspace.tabs.filter((tab) => !urls.includes(tab.url));
  return validateState({
    ...current,
    workspaces: current.workspaces.map((w) =>
      w.id === id ? { ...w, tabs } : w,
    ),
  });
}
