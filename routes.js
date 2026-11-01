export function requestedWorkspace(url) {
  const location = new URL(url);
  return (
    new URLSearchParams(location.hash.slice(1)).get("workspace") ??
    location.searchParams.get("workspace")
  );
}
export function managerRoute(currentUrl, workspaceId) {
  if (!workspaceId) return currentUrl;
  const location = new URL(currentUrl);
  const view = new URLSearchParams(location.hash.slice(1)).get("view");
  if (requestedWorkspace(currentUrl) === workspaceId &&
      !["home", "templates", "live"].includes(view)) return currentUrl;
  location.hash = new URLSearchParams({ workspace: workspaceId }).toString();
  return location.href;
}
