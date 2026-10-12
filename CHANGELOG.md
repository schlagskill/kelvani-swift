# Changelog

## 0.3.0 — 2026-10-13

- Compact action popup with a button for the full manager; both views share stored workspaces.
- Rebuilt purple UI, original branding, light/dark/system appearance and German/English interface.
- Workspace creation, metadata, favorites, duplication and pointer/keyboard ordering.
- Saved-tab pointer drag, selection-based moves, ordering, removal/undo and manual links.
- Empty workspaces and optional metadata/settings remain compatible with the existing v1 data key.
- Separate live-window view, selected-tab capture, explicit append/replace and existing-tab reuse.
- Serialized background restoration survives popup closure; retry reports remain local.
- 54 automated tests and repeated HTTP UI checks; native Chrome/Edge installation still pending.

## 0.2.1 - 2026-10-12

- Add the owner-provided blue K symbol as square PNG extension/action icons in 16, 24, 32, 48 and 128 px, plus a page favicon.
- Preserve the original proportions and white background; no dashboard logo is reintroduced.

## 0.2.0 - 2026-10-12

- Implement Kelvani brandbook v3 with original logo and local Inter fonts.
- Add workspace cards, list/detail view, explicit live-window view, selection actions, accessible capture/rename dialogs and partial restore retry.
- Add backup preview, light/dark/system themes and preserve v0.1 data.
- Add domain and storage regression tests; document remaining native release checks.

## 0.1.0

Initial standalone extension prototype.
