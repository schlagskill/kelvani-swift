import { openOrFocusTabs } from "./browser.js";
import { snapshot } from "./core.js";

export const OPEN_RESULT_KEY = "kelvani-swift.last-open";
let queue = Promise.resolve();

export function handleOpenRequest(browser, message, sender) {
  if (
    sender.id !== browser.runtime.id ||
    message?.type !== "swift.open-tabs" ||
    typeof message.requestId !== "string" ||
    message.requestId.length > 100 ||
    !Array.isArray(message.tabs) ||
    message.tabs.length > 200
  )
    throw new Error("Ungültige Browser-Aktion.");
  const tabs = snapshot(message.tabs);
  if (!tabs.length || tabs.length !== message.tabs.length)
    throw new Error("Ungültige Tab-Auswahl.");
  if (
    message.targetWindowId !== null &&
    !Number.isInteger(message.targetWindowId)
  )
    throw new Error("Ungültiges Browserfenster.");
  const requestId = message.requestId,
    targetWindowId = message.targetWindowId;
  // Keep restoration alive when opening a window closes the action popup. Serializing
  // requests also lets a second view see the tabs created by the first before restoring.
  const task = queue.then(async () => {
    try {
      const result = await openOrFocusTabs(browser, tabs, targetWindowId);
      const finished = { ...result, requestId, finishedAt: Date.now() };
      // Caching a report is best effort; a full storage quota must not turn opened tabs into a failed restore.
      try {
        await browser.storage.local.set({ [OPEN_RESULT_KEY]: finished });
      } catch {
        result.reportNotSaved = true;
      }
      return result;
    } catch (error) {
      const failed = {
        requestId,
        finishedAt: Date.now(),
        windowId: targetWindowId,
        opened: 0,
        reused: 0,
        pinFailures: 0,
        failed: tabs.map((tab) => ({
          tab,
          reason: String(error.message ?? error),
        })),
      };
      try {
        await browser.storage.local.set({ [OPEN_RESULT_KEY]: failed });
      } catch {
        /* The original workspaces are never overwritten by a report. */
      }
      throw error;
    }
  });
  queue = task.catch(() => {});
  return task;
}

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "swift.open-tabs") return false;
    try {
      handleOpenRequest(chrome, message, sender).then(
        (result) => respond({ ok: true, result }),
        (error) =>
          respond({ ok: false, error: String(error.message ?? error) }),
      );
    } catch (error) {
      respond({ ok: false, error: String(error.message ?? error) });
    }
    return true;
  });
}
