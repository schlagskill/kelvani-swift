import { managerRoute } from "./routes.js";
export async function openManager(browser, workspaceId = "") {
  const base = browser.runtime.getURL("index.html");
  const url = workspaceId
    ? `${base}?workspace=${encodeURIComponent(workspaceId)}`
    : base;
  const existing = (await browser.tabs.query({})).find(
    (t) =>
      !t.incognito &&
      (t.url === base ||
        t.url?.startsWith(`${base}?`) ||
        t.url?.startsWith(`${base}#`)),
  );
  if (existing && Number.isInteger(existing.id)) {
    const destination = managerRoute(existing.url, workspaceId);
    await browser.tabs.update(existing.id, {
      ...(destination !== existing.url ? { url: destination } : {}),
      active: true,
    });
    await browser.windows.update(existing.windowId, { focused: true });
    return existing.id;
  }
  return (await browser.tabs.create({ url, active: true })).id;
}
