import { managerRoute } from "./routes.js";
export async function openManager(browser, workspaceId = "", view = "saved") {
  const base = browser.runtime.getURL("index.html");
  if (view !== "saved") {
    if (!["home", "templates", "live"].includes(view)) throw new Error("Invalid view");
    return (await browser.tabs.create({ url: `${base}#view=${view}`, active: true })).id;
  }
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
