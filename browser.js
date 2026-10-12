import { snapshot } from './core.js';
export async function captureWindow(browser, windowId) {
  if (!Number.isInteger(windowId)) throw new Error('Bitte ein Browserfenster auswählen.');
  const window = await browser.windows.get(windowId, { populate: true });
  if (window.incognito || window.type !== 'normal') throw new Error('Nur normale, nicht private Browserfenster werden unterstützt.');
  const tabs = snapshot(window.tabs ?? []);
  if (!tabs.length) throw new Error('Das Fenster enthält keine unterstützten Web-Tabs.');
  return { tabs, omitted: (window.tabs?.length ?? 0) - tabs.length, source: `Fenster ${windowId}` };
}
export async function openSavedTabs(browser, tabs, progress = () => {}, existingWindow = null) {
  if (!tabs.length) throw new Error('Keine Tabs zum Öffnen ausgewählt.');
  let windowId = existingWindow, start = 0, opened = 0, pinFailures = 0;
  const failed = [];
  if (windowId === null) {
    const window = await browser.windows.create({ url: tabs[0].url, focused: true });
    if (!Number.isInteger(window?.id)) throw new Error('Das neue Browserfenster konnte nicht ermittelt werden. Bitte vor einem erneuten Versuch prüfen, ob es bereits geöffnet wurde.');
    windowId = window.id; start = 1; opened = 1;
    if (tabs[0].pinned) {
      try { const first = window.tabs?.[0] ?? (await browser.tabs.query({ windowId }))[0]; if (first?.id == null) throw new Error('Tab-ID nicht verfügbar.'); await browser.tabs.update(first.id, { pinned: true }); } catch { pinFailures++; }
    }
    progress(1, tabs.length);
  }
  for (let index = start; index < tabs.length; index++) {
    try { await browser.tabs.create({ windowId, url: tabs[index].url, pinned: tabs[index].pinned, active: false }); opened++; } catch (error) { failed.push({ tab: tabs[index], reason: String(error.message ?? error) }); }
    progress(index + 1, tabs.length);
  }
  return { windowId, opened, failed, pinFailures };
}
