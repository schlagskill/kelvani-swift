import {
  EMPTY,
  safeUrl,
  snapshot,
  validateState,
  saveWorkspace,
  mergeBackup,
  filterWorkspaces,
  removeSavedTabs,
} from "./core.js";
import {
  COLORS,
  ICONS,
  createWorkspace,
  editWorkspace,
  duplicateWorkspace,
  reorderWorkspace,
  addTabs,
  moveTabs,
  deleteWorkspace,
} from "./workspaces.js";
import { extensionMode, load, update } from "./storage.js";
import { listWindows, captureWindow, focusTab } from "./browser.js";
import { openManager } from "./manager.js";
import { requestedWorkspace } from "./routes.js";
import { translate } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const compact = document.body.dataset.compact === "true";
let state = structuredClone(EMPTY),
  activeId = requestedWorkspace(location.href),
  mode = "saved";
let selectedUrl = null,
  checked = new Set(),
  liveChecked = new Set(),
  windows = [],
  currentWindowId = null;
let unavailable = false,
  editingId = null,
  capture = null,
  captureExpected = null,
  drag = null,
  noticeTimer;
const pending = new Set();
let deferredWorkspaceId = null;
window.addEventListener("hashchange", () => {
  const target = requestedWorkspace(location.href);
  if (!target || !state.workspaces.some((w) => w.id === target)) return;
  if (document.querySelector("dialog[open]")) {
    deferredWorkspaceId = target;
    notice(t("routeDeferred"), { duration: 6000 });
    return;
  }
  $("search").value = "";
  setActive(target);
});
const OPEN_RESULT_KEY = "kelvani-swift.last-open";
const preferences = () => state.settings ?? { language: "de", theme: "system" };
const t = (key) => translate(preferences().language, key);
const tabCount = (count) => `${count} ${t(count === 1 ? "tab" : "tabs")}`;
const workspace = () => state.workspaces.find((w) => w.id === activeId);
const uid = () => crypto.randomUUID();
const rowIds = new Map();
function tabDomId(workspaceId, url) {
  const key = JSON.stringify([workspaceId, url]);
  if (!rowIds.has(key)) rowIds.set(key, `saved-tab-${rowIds.size + 1}`);
  return rowIds.get(key);
}
const paths = {
  folder:
    "M3 7V5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18",
  book: "M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z",
  briefcase: "M8 6V4h8v2M3 6h18v14H3V6Zm0 6 9 3 9-3M10 12h4",
  spark: "m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  plus: "M12 5v14M5 12h14",
  star: "m12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9L6.4 20l1.1-6.1L3 9.5l6.2-.9L12 3Z",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  settings:
    "m10 3 4 0 .6 3 2 1 2.9-.9 2 3.5-2.2 2v2l2.2 2-2 3.5-2.9-.9-2 1-.6 3h-4l-.6-3-2-1-2.9.9-2-3.5 2.2-2v-2l-2.2-2 2-3.5 2.9.9 2-1L10 3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  expand: "M14 3h7v7m0-7-9 9M10 5H3v16h16v-7",
  edit: "m14 5 5 5M4 20l1-6L16 3l5 5-11 11-6 1Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  up: "m6 14 6-6 6 6",
  down: "m6 10 6 6 6-6",
  grip: "M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01",
};
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", name === "grip" ? "3" : "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] ?? paths.folder);
  svg.append(path);
  return svg;
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(label, action, className = "secondary", glyph) {
  const node = el("button", className, glyph ? undefined : label);
  node.type = "button";
  node.title = label;
  node.setAttribute("aria-label", label);
  if (glyph) node.append(icon(glyph));
  node.addEventListener("click", action);
  return node;
}
function symbol(w) {
  const node = el("span", "workspace-symbol");
  node.dataset.color = w?.color ?? "violet";
  node.append(icon(w?.icon ?? "folder"));
  return node;
}
function option(value, text) {
  const node = el("option", "", text);
  node.value = value;
  return node;
}
function localize() {
  document.documentElement.lang = preferences().language;
  document.documentElement.dataset.theme = preferences().theme;
  document.querySelectorAll("[data-t]").forEach((n) => {
    n.textContent = t(n.dataset.t);
  });
  document.querySelectorAll("[data-placeholder]").forEach((n) => {
    n.placeholder = t(n.dataset.placeholder);
    n.setAttribute("aria-label", n.placeholder);
  });
  document.querySelectorAll("[data-title]").forEach((n) => {
    n.title = t(n.dataset.title);
    n.setAttribute("aria-label", n.title);
  });
  $("workspace-switch").setAttribute("aria-label", t("workspaces"));
  $("move-target").setAttribute("aria-label", t("moveTo"));
  $("workspace-list").setAttribute("aria-label", t("workspaces"));
  document
    .querySelector(".mode-switch")
    .setAttribute("aria-label", t("workspaces"));
  document
    .querySelectorAll("[data-close].icon-button")
    .forEach((n) => n.setAttribute("aria-label", t("close")));
  document.querySelector("kbd").textContent = /Mac/i.test(navigator.platform)
    ? "⌘ K"
    : "Ctrl K";
}
function notice(
  message,
  { action, label, error = false, duration = action ? 8000 : 2000 } = {},
) {
  clearTimeout(noticeTimer);
  const box = $("notice");
  box.replaceChildren(el("span", "", message));
  box.classList.toggle("error", error);
  box.setAttribute("role", error ? "alert" : "status");
  box.hidden = false;
  if (action)
    box.append(
      button(
        label ?? t("undo"),
        () => {
          box.hidden = true;
          action();
        },
        "",
      ),
    );
  box.append(
    button(
      t("close"),
      () => {
        box.hidden = true;
        clearTimeout(noticeTimer);
      },
      "notice-close",
      undefined,
    ),
  );
  box.lastChild.textContent = "×";
  if (duration)
    noticeTimer = setTimeout(() => {
      box.hidden = true;
    }, duration);
}
function report(error) {
  notice(`${t("errorDetail")} ${String(error.message ?? error)}`, {
    error: true,
    duration: 0,
  });
}
async function run(key, trigger, action) {
  if (pending.has(key)) return;
  pending.add(key);
  const wasDisabled = trigger?.disabled;
  if (trigger) trigger.disabled = true;
  try {
    return await action();
  } catch (error) {
    report(error);
  } finally {
    pending.delete(key);
    if (trigger?.isConnected) trigger.disabled = wasDisabled;
    nativeControls();
  }
}
async function commit(change, message = t("done"), undo = false) {
  if (unavailable) throw new Error(t("error"));
  let before;
  state = await update((latest) => {
    before = structuredClone(latest);
    return change(latest);
  });
  const after = JSON.stringify(state);
  render();
  notice(
    message,
    undo
      ? {
          action: () =>
            run("data", null, async () => {
              state = await update((latest) => {
                if (JSON.stringify(latest) !== after)
                  throw new Error(t("undoConflict"));
                return before;
              });
              render();
              notice(t("done"));
            }),
        }
      : {},
  );
}
function nativeControls() {
  document.querySelectorAll("[data-live]").forEach((n) => {
    n.disabled = !extensionMode || unavailable || pending.has("open");
    n.title = extensionMode ? "" : t("preview");
  });
  $("capture-selected").disabled =
    !extensionMode ||
    unavailable ||
    !liveChecked.size ||
    pending.has("capture");
  $("open-all").disabled =
    !extensionMode ||
    unavailable ||
    !workspace()?.tabs.length ||
    !filterWorkspaces(state, $("search").value).length ||
    pending.has("open");
  $("open-selected").disabled =
    !extensionMode || unavailable || !checked.size || pending.has("open");
  $("preview-label").hidden = extensionMode;
  $("demo").hidden = extensionMode;
}
function setActive(id) {
  activeId = id;
  selectedUrl = null;
  checked.clear();
  mode = "saved";
  render();
}
function matchingTabs(w) {
  const q = $("search").value.trim().toLocaleLowerCase();
  return !q || w.name.toLocaleLowerCase().includes(q)
    ? w.tabs
    : w.tabs.filter((tab) =>
        `${tab.title} ${tab.url}`.toLocaleLowerCase().includes(q),
      );
}
function render() {
  const focusId = document.activeElement?.id;
  const previousActiveId = activeId;
  localize();
  const matching = filterWorkspaces(state, $("search").value);
  if (
    !workspace() ||
    (mode === "saved" &&
      matching.length &&
      !matching.some((w) => w.id === activeId))
  )
    activeId = matching[0]?.id ?? state.workspaces[0]?.id ?? null;
  if (previousActiveId !== activeId) {
    checked.clear();
    selectedUrl = null;
  }
  const w = workspace();
  checked = new Set(
    [...checked].filter((url) => w?.tabs.some((tab) => tab.url === url)),
  );
  if (!w?.tabs.some((tab) => tab.url === selectedUrl)) selectedUrl = null;
  $("saved-view").setAttribute("aria-pressed", String(mode === "saved"));
  $("live-view").setAttribute("aria-pressed", String(mode === "live"));
  $("saved-panel").hidden = mode !== "saved";
  $("live-panel").hidden = mode !== "live";
  $("workspace-list").replaceChildren();
  for (const favorite of [true, false]) {
    const group = matching.filter(
      (item) => Boolean(item.favorite) === favorite,
    );
    if (!group.length) continue;
    $("workspace-list").append(
      el("div", "nav-section", t(favorite ? "favorites" : "allWorkspaces")),
    );
    for (const item of group) {
      const node = button(item.name, () => setActive(item.id), "workspace-nav");
      node.id = `nav-${item.id}`;
      node.replaceChildren(
        symbol(item),
        el("span", "nav-name", item.name),
        el("span", "nav-count", String(item.tabs.length)),
      );
      if (item.id === activeId && mode === "saved")
        node.setAttribute("aria-current", "page");
      node.dataset.workspaceId = item.id;
      node.title = `${item.name} · ${t("workspaceDrag")}`;
      pointerDrag(node, node, () => ({ kind: "workspace", id: item.id }));
      dropOn(node, (payload) =>
        payload.kind === "workspace"
          ? run("data", node, () =>
              commit(
                (s) => reorderWorkspace(s, payload.id, item.id),
                t("done"),
                true,
              ),
            )
          : payload.kind === "tabs"
            ? performMove(payload, item.id)
            : null,
      );
      node.addEventListener("keydown", (event) => {
        if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key))
          return;
        event.preventDefault();
        const index = state.workspaces.findIndex((x) => x.id === item.id),
          next = event.key === "ArrowUp" ? index - 1 : index + 2;
        if (
          (event.key === "ArrowUp" && index === 0) ||
          (event.key === "ArrowDown" && index === state.workspaces.length - 1)
        )
          return;
        run("data", node, () =>
          commit(
            (s) =>
              reorderWorkspace(s, item.id, state.workspaces[next]?.id ?? null),
            t("done"),
            true,
          ),
        );
      });
      $("workspace-list").append(node);
    }
  }
  $("total-tabs").textContent = tabCount(
    state.workspaces.reduce((sum, item) => sum + item.tabs.length, 0),
  );
  $("workspace-switch").replaceChildren(
    ...matching.map((item) =>
      option(
        item.id,
        `${item.favorite ? "★ " : ""}${item.name} (${item.tabs.length})`,
      ),
    ),
  );
  if (!matching.length)
    $("workspace-switch").append(option("", t("noResults")));
  else $("workspace-switch").value = activeId;
  $("workspace-name").textContent = w?.name ?? t("workspaces");
  $("workspace-meta").textContent = w
    ? `${tabCount(w.tabs.length)} · ${t("saved")}`
    : t("emptyHelp");
  $("workspace-symbol").replaceWith(
    Object.assign(symbol(w), { id: "workspace-symbol" }),
  );
  $("favorite").replaceChildren(icon("star"));
  $("favorite").style.color = w?.favorite ? "var(--accent-text)" : "";
  $("favorite").title = t(w?.favorite ? "unfavorite" : "favorite");
  $("favorite").setAttribute("aria-label", $("favorite").title);
  $("favorite").setAttribute("aria-pressed", String(Boolean(w?.favorite)));
  for (const id of ["favorite", "edit-workspace", "add-link"])
    $(id).disabled = !w || unavailable;
  const tabs = w ? matchingTabs(w) : [];
  const empty = !w || !tabs.length || !matching.length;
  $("empty").hidden = !empty;
  $("empty-title").textContent = $("search").value.trim()
    ? t("noResults")
    : w
      ? t("noTabs")
      : t("empty");
  $("empty-help").textContent = $("search").value.trim()
    ? t("noResultsHelp")
    : t("emptyHelp");
  $("empty-create").hidden = Boolean(w) || Boolean($("search").value.trim());
  document.querySelector(".list-heading").hidden = !w || !matching.length;
  $("tab-count").textContent = tabCount(tabs.length);
  $("tab-list").replaceChildren();
  if (matching.length)
    for (const tab of tabs) $("tab-list").append(savedRow(tab, w));
  // Dropping below the last row appends; rows stop propagation for an exact insertion point.
  $("selection-toolbar").hidden = !checked.size || mode !== "saved";
  $("selection-count").textContent = `${checked.size} ${t("selected")}`;
  $("selection-clear").hidden = !checked.size;
  const previousTarget = $("move-target").value;
  $("move-target").replaceChildren(
    option("", t("moveTo")),
    ...state.workspaces
      .filter((item) => item.id !== activeId)
      .map((item) => option(item.id, item.name)),
  );
  if (
    state.workspaces.some(
      (item) => item.id === previousTarget && item.id !== activeId,
    )
  )
    $("move-target").value = previousTarget;
  $("move-selected").disabled = !checked.size || !$("move-target").value;
  $("select-all").checked = Boolean(
    tabs.length && tabs.every((tab) => checked.has(tab.url)),
  );
  $("select-all").indeterminate =
    tabs.some((tab) => checked.has(tab.url)) && !$("select-all").checked;
  renderDetails(w);
  renderLive();
  nativeControls();
  if (focusId) {
    const target = $(focusId);
    const focusTarget = target?.disabled
      ? target.closest(".tab-row")?.querySelector(".tab-text")
      : target;
    focusTarget?.focus({ preventScroll: true });
  }
}
function savedRow(tab, w) {
  const domId = tabDomId(w.id, tab.url);
  const row = el(
    "div",
    `tab-row${checked.has(tab.url) ? " is-selected" : ""}${selectedUrl === tab.url ? " is-detail" : ""}`,
  );
  row.dataset.url = tab.url;
  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked.has(tab.url);
  checkbox.id = `${domId}-check`;
  checkbox.setAttribute("aria-label", `${t("selected")}: ${tab.title}`);
  checkbox.addEventListener("change", () => {
    checkbox.checked ? checked.add(tab.url) : checked.delete(tab.url);
    render();
  });
  const hostname = new URL(tab.url).hostname;
  const badge = el(
    "span",
    "tab-icon",
    hostname
      .replace(/^www\./, "")
      .slice(0, 1)
      .toUpperCase(),
  );
  const title = button(
    tab.title,
    () => {
      if (compact && extensionMode) return openTabs([tab]);
      selectedUrl = tab.url;
      render();
    },
    "tab-text",
  );
  title.replaceChildren(
    el("span", "tab-name", tab.title || hostname),
    el("span", "tab-domain", hostname),
  );
  title.title = `${tab.title}\n${tab.url}`;
  title.id = `${domId}-title`;
  const status = el("span", "tab-status");
  if (isOpen(tab.url))
    status.append(
      el("span", "status-dot"),
      document.createTextNode(t("alreadyOpen")),
    );
  else status.textContent = t("stored");
  const actions = el("div", "row-actions");
  const index = w.tabs.indexOf(tab);
  for (const direction of [-1, 1]) {
    const shift = button(
      t(direction === -1 ? "shiftUp" : "shiftDown"),
      () => {
        const before =
          direction === -1
            ? w.tabs[index - 1]?.url
            : (w.tabs[index + 2]?.url ?? null);
        performMove(
          {
            kind: "tabs",
            id: w.id,
            urls: [tab.url],
            expected: { [w.id]: structuredClone(w.tabs) },
          },
          w.id,
          before,
        );
      },
      "icon-button reorder-button",
      direction === -1 ? "up" : "down",
    );
    shift.disabled =
      direction === -1 ? index === 0 : index === w.tabs.length - 1;
    shift.id = `${domId}-${direction === -1 ? "up" : "down"}`;
    actions.append(shift);
  }
  const open = button(t("open"), () => openTabs([tab]), "icon-button", "arrow");
  open.dataset.live = "";
  open.id = `${domId}-open`;
  actions.append(open);
  const handle = button(
    t("drag"),
    () => {
      checked.add(tab.url);
      render();
    },
    "drag-handle",
    "grip",
  );
  pointerDrag(handle, row, () => {
    const urls = checked.has(tab.url)
      ? w.tabs.filter((item) => checked.has(item.url)).map((item) => item.url)
      : [tab.url];
    return {
      kind: "tabs",
      id: w.id,
      urls,
      expected: Object.fromEntries(
        state.workspaces.map((item) => [item.id, structuredClone(item.tabs)]),
      ),
    };
  });
  dropOn(row, (payload) =>
    payload.kind === "tabs" ? performMove(payload, w.id, tab.url) : null,
  );
  row.append(checkbox, badge, title, status, actions, handle);
  return row;
}
function isOpen(url) {
  return windows.some((w) =>
    w.tabs.some((tab) => {
      try {
        return safeUrl(tab.url) === url;
      } catch {
        return false;
      }
    }),
  );
}
function renderDetails(w) {
  const box = $("details");
  box.replaceChildren(el("div", "detail-eyebrow", t("detail")));
  const tab = w?.tabs.find((item) => item.url === selectedUrl);
  if (tab) {
    const hostname = new URL(tab.url).hostname;
    box.append(
      el(
        "div",
        "tab-icon",
        hostname
          .replace(/^www\./, "")
          .slice(0, 1)
          .toUpperCase(),
      ),
      el("h2", "", tab.title),
      el("p", "detail-url", tab.url),
      el(
        "span",
        "detail-badge",
        t(isOpen(tab.url) ? "alreadyOpen" : "savedTab"),
      ),
    );
    const open = button(t("open"), () => openTabs([tab]), "primary");
    open.dataset.live = "";
    box.append(open);
  } else {
    box.append(
      symbol(w),
      el("h2", "", w?.name ?? "KelvaniSwift"),
      el("p", "detail-help", t("detailsHelp")),
    );
  }
  if (w) {
    const info = el("div", "detail-info");
    for (const [label, value] of [
      [
        t("updated"),
        new Intl.DateTimeFormat(preferences().language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(w.updatedAt)),
      ],
      [t("source"), w.source ?? "—"],
      [t("tabs"), String(w.tabs.length)],
    ]) {
      const line = el("div");
      line.append(el("label", "", label), el("span", "", value));
      info.append(line);
    }
    box.append(info, el("p", "detail-help", t("openHint")));
  }
}
function renderLive() {
  const box = $("live-list");
  box.replaceChildren();
  if (!extensionMode) {
    box.append(el("div", "empty-state", t("preview")));
    return;
  }
  const q = $("search").value.trim().toLocaleLowerCase();
  const ids = new Set(windows.flatMap((w) => w.tabs.map((tab) => tab.id)));
  liveChecked = new Set([...liveChecked].filter((id) => ids.has(id)));
  for (const w of windows) {
    const tabs = w.tabs.filter((tab) =>
      `${tab.title} ${tab.url}`.toLocaleLowerCase().includes(q),
    );
    if (!tabs.length) continue;
    const group = el("div", "window-group"),
      header = el("div", "window-heading");
    header.append(
      el("span", "", `${t("windowLabel")} ${w.id} · ${tabCount(tabs.length)}`),
      button(t("capture"), () => prepareCapture(w.id), ""),
    );
    group.append(header);
    for (const tab of tabs) {
      const row = el("div", "tab-row");
      const input = el("input");
      input.type = "checkbox";
      input.checked = liveChecked.has(tab.id);
      input.setAttribute("aria-label", `${t("selected")}: ${tab.title}`);
      input.addEventListener("change", () => {
        input.checked ? liveChecked.add(tab.id) : liveChecked.delete(tab.id);
        nativeControls();
      });
      const tabButton = button(
        tab.title ?? new URL(tab.url).hostname,
        () =>
          run("focus", null, () =>
            focusTab(chrome, { ...tab, windowId: w.id }),
          ),
        "tab-text",
      );
      tabButton.replaceChildren(
        el("span", "tab-name", tab.title || new URL(tab.url).hostname),
        el("span", "tab-domain", new URL(tab.url).hostname),
      );
      row.append(
        input,
        el(
          "span",
          "tab-icon",
          new URL(tab.url).hostname.slice(0, 1).toUpperCase(),
        ),
        tabButton,
        button(
          t("focus"),
          () =>
            run("focus", null, () =>
              focusTab(chrome, { ...tab, windowId: w.id }),
            ),
          "icon-button",
          "arrow",
        ),
      );
      group.append(row);
    }
    box.append(group);
  }
  if (!box.children.length)
    box.append(el("div", "empty-state", q ? t("noResults") : t("noLive")));
}
let suppressDragClick = false,
  cancelDrag = null;
document.addEventListener(
  "click",
  (event) => {
    if (suppressDragClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);
function pointerDrag(handle, source, payload) {
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.isPrimary === false || pending.has("data"))
      return;
    const startX = event.clientX,
      startY = event.clientY,
      data = payload();
    let moved = false,
      target = null,
      ghost;
    drag = data;
    handle.setPointerCapture(event.pointerId);
    const resolveTarget = (e) => {
      const found = document.elementFromPoint(e.clientX, e.clientY);
      const node =
        data.kind === "workspace"
          ? found?.closest(".workspace-nav, #workspace-list")
          : found?.closest(".workspace-nav, #tab-list .tab-row, #tab-list");
      if (target !== node) {
        target?.classList.remove("drop-target");
        target = node;
        target?.classList.add("drop-target");
      }
    };
    const move = (e) => {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 6)
        return;
      e.preventDefault();
      if (!moved) {
        moved = true;
        source.classList.add("is-dragging");
        ghost = el(
          "div",
          "drag-ghost",
          data.kind === "tabs"
            ? `${data.urls.length} ${t("tabs")}`
            : state.workspaces.find((w) => w.id === data.id)?.name,
        );
        document.body.append(ghost);
      }
      ghost.style.left = `${e.clientX + 12}px`;
      ghost.style.top = `${e.clientY + 12}px`;
      resolveTarget(e);
      const main = document.querySelector("main"),
        bounds = main.getBoundingClientRect();
      if (e.clientY > bounds.bottom - 40) main.scrollTop += 12;
      else if (e.clientY < bounds.top + 40) main.scrollTop -= 12;
    };
    const finish = (e) => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", cancel);
      handle.removeEventListener("lostpointercapture", cancel);
      cancelDrag = null;
      if (handle.hasPointerCapture(event.pointerId))
        handle.releasePointerCapture(event.pointerId);
      ghost?.remove();
      source.classList.remove("is-dragging");
      target?.classList.remove("drop-target");
      drag = null;
      if (!moved || ["pointercancel", "lostpointercapture"].includes(e.type))
        return;
      suppressDragClick = true;
      setTimeout(() => {
        suppressDragClick = false;
      }, 0);
      const destination = target?.dataset.workspaceId;
      if (data.kind === "workspace") {
        if (target)
          run("data", null, () =>
            commit(
              (s) => reorderWorkspace(s, data.id, destination ?? null),
              t("done"),
              true,
            ),
          );
      } else if (target)
        performMove(
          data,
          destination ?? activeId,
          destination ? null : (target.dataset.url ?? null),
        );
    };
    const cancel = (e) => finish(e);
    cancelDrag = () => finish({ type: "pointercancel" });
    handle.addEventListener("pointermove", move, { passive: false });
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", cancel);
    handle.addEventListener("lostpointercapture", cancel);
  });
}
function dropOn(node, action) {
  node.addEventListener("dragover", (event) => {
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    node.classList.add("drop-target");
  });
  node.addEventListener("dragleave", (event) => {
    if (!node.contains(event.relatedTarget))
      node.classList.remove("drop-target");
  });
  node.addEventListener("drop", (event) => {
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    node.classList.remove("drop-target");
    const payload = drag;
    drag = null;
    action(payload);
  });
}
function performMove(payload, toId, before = null) {
  const target = state.workspaces.find((w) => w.id === toId);
  if (!target) return;
  const expected = {
    ...payload.expected,
    [toId]: payload.expected[toId] ?? structuredClone(target.tabs),
  };
  return run("data", null, async () => {
    await commit(
      (s) => moveTabs(s, payload.id, toId, payload.urls, before, expected),
      t("moved"),
      true,
    );
    checked.clear();
    render();
  });
}
async function refreshWindows(renderAfter = true) {
  if (!extensionMode) return;
  windows = await listWindows(chrome);
  if (!windows.some((w) => w.id === currentWindowId))
    currentWindowId =
      windows.find((w) => w.focused)?.id ?? windows[0]?.id ?? null;
  if (renderAfter && !drag) render();
}
function openTabs(tabs) {
  if (!extensionMode) return;
  return run("open", $("open-all"), async () => {
    const result = await requestOpen(tabs, currentWindowId);
    await refreshWindows();
    showOpenResult(result);
  });
}
async function requestOpen(tabs, targetWindowId) {
  const response = await chrome.runtime.sendMessage({
    type: "swift.open-tabs",
    requestId: uid(),
    tabs,
    targetWindowId,
  });
  if (!response?.ok) throw new Error(response?.error ?? t("error"));
  return response.result;
}
function showOpenResult(result) {
  const message = `${result.opened} ${t("opened")} · ${result.reused ?? 0} ${t("reused")}${result.failed.length ? ` · ${result.failed.length} ${t("failed")}` : ""}${result.pinFailures ? ` · ${t("pinFailed")}` : ""}${result.focusFailed ? ` · ${t("focusFailed")}` : ""}`;
  notice(
    message,
    result.failed.length
      ? {
          error: true,
          duration: 0,
          label: t("retry"),
          action: () =>
            run("open", null, async () => {
              // Recheck open URLs on retry. Another popup may have opened them since the failure.
              const next = await requestOpen(
                result.failed.map((item) => item.tab),
                result.windowId,
              );
              await refreshWindows();
              showOpenResult(next);
            }),
        }
      : { duration: result.pinFailures || result.focusFailed ? 8000 : 3500 },
  );
}
function showDialog(id) {
  const dialog = $(id),
    trigger = document.activeElement;
  dialog.addEventListener(
    "close",
    () => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      if (deferredWorkspaceId && !document.querySelector("dialog[open]")) {
        const target = deferredWorkspaceId;
        deferredWorkspaceId = null;
        if (state.workspaces.some((w) => w.id === target)) {
          $("search").value = "";
          setActive(target);
        }
      }
    },
    { once: true },
  );
  dialog.showModal();
}
function editDialog(id = null) {
  editingId = id;
  const w = state.workspaces.find((item) => item.id === id);
  $("workspace-dialog-title").textContent = t(w ? "edit" : "newWorkspace");
  $("edit-name").value = w?.name ?? "";
  $("edit-color").replaceChildren(
    ...COLORS.map((color) => option(color, t(`color_${color}`))),
  );
  $("edit-color").value = w?.color ?? "violet";
  $("edit-icon").replaceChildren(
    ...ICONS.map((name) => option(name, t(`icon_${name}`))),
  );
  $("edit-icon").value = w?.icon ?? "folder";
  $("edit-favorite").checked = Boolean(w?.favorite);
  $("workspace-manage").hidden = !w;
  showDialog("workspace-dialog");
  $("edit-name").focus();
}
function ask(title, text, label, action) {
  $("confirm-title").textContent = title;
  $("confirm-text").textContent = text;
  $("confirm-ok").textContent = label;
  $("confirm-ok").onclick = () =>
    run("data", $("confirm-ok"), async () => {
      await action();
      $("confirm-dialog").close();
    });
  showDialog("confirm-dialog");
}
async function prepareCapture(windowId = null, selected = false) {
  if (!extensionMode) return;
  return run("capture", $("capture"), async () => {
    await refreshWindows(false);
    if (!windows.length) throw new Error(t("noLive"));
    $("capture-window").replaceChildren(
      ...windows.map((w) =>
        option(
          String(w.id),
          `${t("windowLabel")} ${w.id} · ${w.tabs.length} ${t("tabs")}`,
        ),
      ),
    );
    $("capture-window").value = String(
      windowId ?? currentWindowId ?? windows[0].id,
    );
    $("capture-window-label").hidden = selected;
    if (selected) {
      const selectedTabs = windows
        .flatMap((w) => w.tabs)
        .filter((tab) => liveChecked.has(tab.id));
      const tabs = snapshot(selectedTabs);
      if (!tabs.length) throw new Error(t("noLive"));
      capture = {
        tabs,
        omitted: selectedTabs.length - tabs.length,
        source: t("selected"),
      };
    } else
      capture = await captureWindow(chrome, Number($("capture-window").value));
    captureExpected = structuredClone(state.workspaces);
    $("capture-name").value =
      `${t("windowLabel")} · ${new Intl.DateTimeFormat(preferences().language, { dateStyle: "medium" }).format(new Date())}`;
    $("capture-target").replaceChildren(
      ...state.workspaces.map((w) => option(w.id, w.name)),
    );
    $("capture-target").value = activeId ?? "";
    $("capture-mode").value = "new";
    $("capture-mode").options[1].disabled = !state.workspaces.length;
    $("capture-mode").options[2].disabled = !state.workspaces.length;
    updateCaptureForm();
    showDialog("capture-dialog");
  });
}
function updateCaptureForm() {
  const isNew = $("capture-mode").value === "new";
  $("capture-name-label").hidden = !isNew;
  $("capture-name").required = isNew;
  $("capture-target-label").hidden = isNew;
  $("capture-preview").replaceChildren(
    el("strong", "", `${capture?.tabs.length ?? 0} ${t("captureCount")}`),
    el("small", "", `${capture?.omitted ?? 0} ${t("omitted")}`),
  );
}
dropOn($("tab-list"), (payload) =>
  payload.kind === "tabs" && workspace()
    ? performMove(payload, activeId)
    : null,
);
dropOn($("workspace-list"), (payload) =>
  payload.kind === "workspace"
    ? run("data", null, () =>
        commit((s) => reorderWorkspace(s, payload.id, null), t("done"), true),
      )
    : null,
);
$("search-icon").append(icon("search"));
$("expand").append(icon("expand"));
$("settings").append(icon("settings"));
for (const id of ["new-sidebar", "new-popup"]) $(id).append(icon("plus"));
$("edit-workspace").append(icon("edit"));
$("search").addEventListener("input", () => {
  checked.clear();
  liveChecked.clear();
  selectedUrl = null;
  render();
});
$("workspace-switch").onchange = () => setActive($("workspace-switch").value);
for (const id of ["new-sidebar", "new-popup", "new-workspace", "empty-create"])
  $(id).onclick = () => editDialog();
$("edit-workspace").onclick = () => editDialog(activeId);
$("saved-view").onclick = () => {
  mode = "saved";
  render();
};
$("live-view").onclick = () =>
  run("live", $("live-view"), async () => {
    mode = "live";
    await refreshWindows(false);
    render();
  });
$("expand").onclick = () =>
  run("manager", $("expand"), async () => {
    if (extensionMode) {
      await openManager(chrome, activeId ?? "");
      window.close();
    } else
      location.assign(
        `index.html${activeId ? `?workspace=${encodeURIComponent(activeId)}` : ""}`,
      );
  });
if (compact)
  document.querySelector(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    $("expand").click();
  });
$("favorite").onclick = () => {
  const w = workspace();
  if (w)
    run("data", $("favorite"), () =>
      commit((s) => editWorkspace(s, w.id, { favorite: !w.favorite })),
    );
};
$("workspace-form").onsubmit = (event) => {
  event.preventDefault();
  const id = editingId ?? uid(),
    values = {
      name: $("edit-name").value.trim(),
      color: $("edit-color").value,
      icon: $("edit-icon").value,
      favorite: $("edit-favorite").checked,
    };
  run("data", event.submitter, async () => {
    await commit((s) =>
      editingId
        ? editWorkspace(s, id, values)
        : createWorkspace(s, { id, ...values }),
    );
    activeId = id;
    checked.clear();
    $("search").value = "";
    $("workspace-dialog").close();
    render();
  });
};
$("duplicate-workspace").onclick = () =>
  run("data", $("duplicate-workspace"), async () => {
    const w = state.workspaces.find((item) => item.id === editingId),
      id = uid();
    if (!w) throw new Error(t("error"));
    await commit(
      (s) =>
        duplicateWorkspace(
          s,
          w.id,
          id,
          `${w.name.slice(0, 72)} (${preferences().language === "de" ? "Kopie" : "Copy"})`,
        ),
      t("copied"),
      true,
    );
    activeId = id;
    $("workspace-dialog").close();
    render();
  });
$("delete-workspace").onclick = () => {
  const w = state.workspaces.find((item) => item.id === editingId);
  if (!w) return;
  $("workspace-dialog").close();
  ask(t("delete"), `${w.name}: ${t("confirmDelete")}`, t("delete"), () =>
    commit((s) => deleteWorkspace(s, w.id, w), t("removed"), true),
  );
};
$("add-link").onclick = () => {
  $("link-form").reset();
  showDialog("link-dialog");
  $("link-url").focus();
};
$("link-form").onsubmit = (event) => {
  event.preventDefault();
  const id = activeId;
  run("data", event.submitter, async () => {
    const url = safeUrl($("link-url").value.trim()),
      title = $("link-title").value.trim() || new URL(url).hostname;
    await commit(
      (s) => addTabs(s, id, [{ url, title, pinned: false }]),
      t("done"),
      true,
    );
    $("link-dialog").close();
  });
};
$("open-all").onclick = () => workspace() && openTabs(workspace().tabs);
$("open-selected").onclick = () =>
  workspace() &&
  openTabs(workspace().tabs.filter((tab) => checked.has(tab.url)));
$("select-all").onchange = () => {
  if (!workspace()) return;
  for (const tab of matchingTabs(workspace()))
    $("select-all").checked ? checked.add(tab.url) : checked.delete(tab.url);
  render();
};
$("move-target").onchange = () => {
  $("move-selected").disabled = !$("move-target").value;
};
$("selection-clear").onclick = () => {
  checked.clear();
  render();
};
$("move-selected").onclick = () => {
  const w = workspace();
  if (w && $("move-target").value)
    performMove(
      {
        id: w.id,
        urls: [...checked],
        expected: { [w.id]: structuredClone(w.tabs) },
      },
      $("move-target").value,
    );
};
$("remove-selected").onclick = () => {
  const w = workspace();
  if (!w) return;
  const urls = [...checked],
    expected = structuredClone(w.tabs);
  run("data", $("remove-selected"), async () => {
    await commit(
      (s) => removeSavedTabs(s, w.id, urls, expected),
      t("removed"),
      true,
    );
    checked.clear();
    render();
  });
};
$("capture").onclick = () => prepareCapture();
$("capture-selected").onclick = () => prepareCapture(null, true);
$("capture-window").onchange = async () => {
  const submit = $("capture-form").querySelector("[type=submit]");
  submit.disabled = true;
  await run("capture", $("capture-window"), async () => {
    capture = null;
    updateCaptureForm();
    capture = await captureWindow(chrome, Number($("capture-window").value));
    updateCaptureForm();
  });
  submit.disabled = !capture?.tabs.length;
};
$("capture-mode").onchange = updateCaptureForm;
$("capture-form").onsubmit = (event) => {
  event.preventDefault();
  const targetId =
      $("capture-mode").value === "new" ? uid() : $("capture-target").value,
    name = $("capture-name").value.trim(),
    method = $("capture-mode").value,
    savedCapture = structuredClone(capture);
  run("data", event.submitter, async () => {
    await commit(
      (s) => {
        if (!savedCapture?.tabs.length) throw new Error(t("noLive"));
        if (method === "new")
          return saveWorkspace(
            s,
            name,
            savedCapture.tabs,
            targetId,
            new Date().toISOString(),
            savedCapture.source,
          );
        const target = s.workspaces.find((w) => w.id === targetId);
        if (!target) throw new Error(t("error"));
        if (method === "append") return addTabs(s, targetId, savedCapture.tabs);
        const expected = captureExpected.find((w) => w.id === targetId);
        if (
          !expected ||
          JSON.stringify(target.tabs) !== JSON.stringify(expected.tabs)
        )
          throw new Error(t("undoConflict"));
        return saveWorkspace(
          s,
          target.name,
          savedCapture.tabs,
          targetId,
          new Date().toISOString(),
          savedCapture.source,
        );
      },
      t("done"),
      true,
    );
    activeId = targetId;
    mode = "saved";
    checked.clear();
    liveChecked.clear();
    $("search").value = "";
    $("capture-dialog").close();
    render();
  });
};
$("settings").onclick = () => {
  $("language").value = preferences().language;
  $("theme").value = preferences().theme;
  showDialog("settings-dialog");
};
$("settings-form").onsubmit = (event) => {
  event.preventDefault();
  const settings = { language: $("language").value, theme: $("theme").value };
  run("data", event.submitter, async () => {
    await commit((s) => ({ ...s, settings }));
    $("settings-dialog").close();
    render();
    notice(t("done"));
  });
};
$("export").onclick = () =>
  run("export", $("export"), async () => {
    const latest = await load(),
      blob = new Blob([JSON.stringify(latest, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob);
    const link = el("a");
    link.href = url;
    link.download = `kelvani-swift-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
$("import").onchange = () =>
  run("import", null, async () => {
    const file = $("import").files[0];
    $("import").value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) throw new Error("Maximum: 2 MB");
    const incoming = validateState(JSON.parse(await file.text()));
    const count = incoming.workspaces.length;
    $("settings-dialog").close();
    ask(
      t("confirmImport"),
      `${count} ${t("workspaces")}. ${t("importHelp")}`,
      t("import"),
      () => commit((s) => mergeBackup(s, incoming, uid), t("done"), true),
    );
  });
$("demo").onclick = () =>
  run("data", $("demo"), async () => {
    const id = uid();
    await commit((s) =>
      saveWorkspace(
        s,
        t("demoName"),
        [
          {
            url: "https://github.com/schlagskill/kelvani-swift",
            title: "KelvaniSwift · GitHub",
          },
          {
            url: "https://developer.chrome.com/docs/extensions",
            title: "Chrome Extensions · Documentation",
          },
          {
            url: "https://github.com/schlagskill/kelvani-tab",
            title: "KelvaniTab · GitHub",
          },
          { url: "https://kelvani.net/", title: "Kelvani" },
        ],
        id,
        new Date().toISOString(),
        t("previewShort"),
      ),
    );
    activeId = id;
    $("settings-dialog").close();
    render();
  });
$("confirm-cancel").onclick = () => $("confirm-dialog").close();
document.querySelectorAll("[data-close]").forEach((n) => {
  n.onclick = () => n.closest("dialog").close();
});
document.addEventListener("keydown", (event) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "k" &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    $("search").focus();
  }
  if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
    cancelDrag?.();
    checked.clear();
    liveChecked.clear();
    $("search").value = "";
    selectedUrl = null;
    render();
  }
});
async function refreshState() {
  if (pending.has("data") || drag || unavailable) return;
  try {
    state = await load();
    render();
  } catch (error) {
    unavailable = true;
    report(error);
    nativeControls();
  }
}
window.addEventListener("storage", (event) => {
  if (event.key === "kelvani-swift.v1") refreshState();
});
let windowRefreshTimer;
if (extensionMode) {
  chrome.storage.onChanged?.addListener((changes, area) => {
    if (area === "local" && changes["kelvani-swift.v1"]) refreshState();
  });
  const refresh = () => {
    clearTimeout(windowRefreshTimer);
    windowRefreshTimer = setTimeout(() => refreshWindows().catch(report), 160);
  };
  for (const name of [
    "onCreated",
    "onRemoved",
    "onUpdated",
    "onMoved",
    "onActivated",
    "onAttached",
    "onDetached",
  ])
    chrome.tabs[name]?.addListener(refresh);
  for (const name of ["onCreated", "onRemoved", "onFocusChanged"])
    chrome.windows[name]?.addListener(refresh);
}
window.addEventListener("focus", () => {
  refreshState();
  if (extensionMode) refreshWindows().catch(report);
});
try {
  state = await load();
  // Old versions stored appearance separately; migrate it once without overwriting the v1 workspace data.
  if (!state.settings) {
    const old = extensionMode
      ? (await chrome.storage.local.get("kelvani-swift.theme"))[
          "kelvani-swift.theme"
        ]
      : localStorage.getItem("kelvani-swift.theme");
    if (["light", "dark", "system"].includes(old))
      state = await update((s) => ({
        ...s,
        settings: { language: "de", theme: old },
      }));
  }
  if (extensionMode) {
    try {
      const current = await chrome.windows.getLastFocused({
        windowTypes: ["normal"],
      });
      currentWindowId = current?.incognito ? null : current?.id;
      await refreshWindows(false);
    } catch (error) {
      report(error);
    }
  }
  render();
  if (extensionMode) {
    const result = (await chrome.storage.local.get(OPEN_RESULT_KEY))[
      OPEN_RESULT_KEY
    ];
    if (
      result &&
      Array.isArray(result.failed) &&
      result.finishedAt > Date.now() - 24 * 60 * 60 * 1000 &&
      (result.failed.length || result.pinFailures || result.focusFailed)
    )
      showOpenResult(result);
  }
} catch (error) {
  unavailable = true;
  render();
  report(error);
}
