import { snapshot, safeUrl } from "./core.js";
export async function captureWindow(browser, windowId) {
  if (!Number.isInteger(windowId))
    throw new Error("Bitte ein Browserfenster auswählen.");
  const window = await browser.windows.get(windowId, { populate: true });
  if (window.incognito || window.type !== "normal")
    throw new Error(
      "Nur normale, nicht private Browserfenster werden unterstützt.",
    );
  const tabs = snapshot(window.tabs ?? []);
  if (!tabs.length)
    throw new Error("Das Fenster enthält keine unterstützten Web-Tabs.");
  return {
    tabs,
    omitted: (window.tabs?.length ?? 0) - tabs.length,
    source: `Fenster ${windowId}`,
  };
}
export async function listWindows(browser) {
  return (
    await browser.windows.getAll({ populate: true, windowTypes: ["normal"] })
  )
    .filter((w) => !w.incognito && w.type === "normal")
    .map((w) => ({
      ...w,
      tabs: (w.tabs ?? []).filter((t) => {
        try {
          return (
            !t.incognito && Number.isInteger(t.id) && Boolean(safeUrl(t.url))
          );
        } catch {
          return false;
        }
      }),
    }));
}
export async function focusTab(browser, tab) {
  await browser.tabs.update(tab.id, { active: true });
  await browser.windows.update(tab.windowId, { focused: true });
}
export async function openOrFocusTabs(browser, tabs, targetWindowId = null) {
  const clean = snapshot(tabs);
  if (!clean.length) throw new Error("Keine Tabs zum Öffnen ausgewählt.");
  const windows = await listWindows(browser);
  const existing = windows.flatMap((w) =>
    w.tabs.map((t) => ({ ...t, windowId: w.id })),
  );
  const missing = [],
    reused = [];
  for (const tab of clean) {
    const matches = existing.filter((t) => safeUrl(t.url) === tab.url);
    const match =
      matches.find((t) => t.windowId === targetWindowId) ?? matches[0];
    if (match) reused.push(match);
    else missing.push(tab);
  }
  let result = { windowId: null, opened: 0, failed: [], pinFailures: 0 };
  if (missing.length) {
    // Only a still-existing normal window may be a target; never fall back to an arbitrary private window.
    const target = windows.find((w) => w.id === targetWindowId)?.id ?? null;
    result = await openSavedTabs(browser, missing, () => {}, target);
    if (result.opened) {
      try {
        const failedUrls = new Set(result.failed.map((item) => item.tab.url));
        const openedUrls = new Set(
          missing
            .filter((tab) => !failedUrls.has(tab.url))
            .map((tab) => tab.url),
        );
        const first = (
          await browser.tabs.query({ windowId: result.windowId })
        ).find((t) => openedUrls.has(t.url));
        if (!first) result.focusFailed = true;
        else await focusTab(browser, { ...first, windowId: result.windowId });
      } catch {
        result.focusFailed = true;
      }
    }
  } else if (reused.length) {
    try {
      await focusTab(browser, reused[0]);
    } catch {
      result.focusFailed = true;
    }
  }
  return { ...result, reused: reused.length };
}
export async function openSavedTabs(
  browser,
  tabs,
  progress = () => {},
  existingWindow = null,
) {
  if (!tabs.length) throw new Error("Keine Tabs zum Öffnen ausgewählt.");
  let windowId = existingWindow,
    start = 0,
    opened = 0,
    pinFailures = 0;
  const failed = [];
  if (windowId === null) {
    const window = await browser.windows.create({
      url: tabs[0].url,
      focused: true,
    });
    if (!Number.isInteger(window?.id))
      throw new Error(
        "Das neue Browserfenster konnte nicht ermittelt werden. Bitte vor einem erneuten Versuch prüfen, ob es bereits geöffnet wurde.",
      );
    windowId = window.id;
    start = 1;
    opened = 1;
    if (tabs[0].pinned) {
      try {
        const first =
          window.tabs?.[0] ?? (await browser.tabs.query({ windowId }))[0];
        if (first?.id == null) throw new Error("Tab-ID nicht verfügbar.");
        await browser.tabs.update(first.id, { pinned: true });
      } catch {
        pinFailures++;
      }
    }
    progress(1, tabs.length);
  }
  for (let index = start; index < tabs.length; index++) {
    try {
      await browser.tabs.create({
        windowId,
        url: tabs[index].url,
        pinned: tabs[index].pinned,
        active: false,
      });
      opened++;
    } catch (error) {
      failed.push({ tab: tabs[index], reason: String(error.message ?? error) });
    }
    progress(index + 1, tabs.length);
  }
  return { windowId, opened, failed, pinFailures };
}
