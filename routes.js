export function requestedWorkspace(url) {
  const location = new URL(url);
  return (
    new URLSearchParams(location.hash.slice(1)).get("workspace") ??
    location.searchParams.get("workspace")
  );
}
export function managerRoute(currentUrl, workspaceId) {
  if (!workspaceId || requestedWorkspace(currentUrl) === workspaceId)
    return currentUrl;
  const location = new URL(currentUrl);
  location.hash = new URLSearchParams({ workspace: workspaceId }).toString();
  return location.href;
}
