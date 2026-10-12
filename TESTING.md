# KelvaniSwift 0.3.0 — Validation

## Automated checks

54 Node.js tests pass. Coverage includes legacy v1 data, optional metadata/settings, empty workspaces, strict URL/backup validation, 100/200 limits, immutable operations, concurrent storage writes, write failures, corruption protection, stale move/delete detection, atomic cross-workspace moves, destination deduplication, reordering, capture filters, private/popup-window exclusion, opening failures, retry/pins, existing-tab reuse, manager routing and worker request validation.

Worker tests verify that tab restoration completes independently of a popup receiver, concurrent popup/manager requests do not create duplicate tabs, failed requests do not block the queue, and full report storage does not make a successful restoration fail. Browser APIs are test doubles; they do not prove browser installation compatibility.

Package checks: local HTML/CSS/module resources exist, HTML IDs are unique, manifest popup/worker are packaged, permissions remain storage/tabs, all icon sizes exist, ZIP CRC is valid and packaged file bytes match source. JavaScript syntax checks and whitespace checks pass.

## HTTP UI checks performed on 2026-10-13

- Loaded full manager and compact popup; checked light and dark layouts and German/English labels.
- Created an empty workspace in the popup with color/icon/favorite; added links in popup and manager. Both views showed shared preview storage.
- Duplicated the test workspace independently.
- Initial native HTML drag failed in the preview. Replaced it with Pointer Events; dragging reordered tabs in both full and compact views and moved a tab onto another workspace. Verified destination deduplication and undo.
- Verified selection/dropdown move and arrow-button reorder with undo.
- Verified search by title, no-results state, Esc reset, dialogs, deleting only test workspaces, and retention of the original four-tab preview workspace.
- Verified the popup expansion control routes to the full preview with its selected workspace. In an installed extension this uses chrome.tabs and a separate tab; preview routing stays in the same tab.
- Checked console for startup errors. Preview uses fictional data and disabled browser controls. Settings were restored to German/System after checks.

## Remaining native Chrome / Edge release gate

1. Reload the unpacked extension in each browser. Toolbar must show the original icon and open a 460 × 580 CSS-pixel popup over the page. Expanding must open/focus index.html in a separate tab and preserve the selected workspace.
2. Check packaged fonts, icons, CSP and absence of remote startup requests.
3. Capture several normal windows, pinned/duplicate/internal tabs and selected live tabs. Ensure private windows are excluded. Test add versus explicit replace, including a target changed by another manager.
4. Restore mixed existing/missing tabs. Verify existing matches are reused, new pins retained, no old tabs closed, and a foreground window change cannot interrupt the background operation. Test partial failure and reopening the popup to retry.
5. Close the popup during a multi-tab restore, issue a simultaneous restore from the manager, and verify the worker queue and locally cached result.
6. Test import/export downloads, invalid/oversized/old backups, quota errors and extension reload with existing saved data.
7. Verify pointer/touch drag, long lists and scrolling, keyboard navigation, dialog return focus, screenreader labels and 200% text scaling. A full screenreader/accessibility audit remains pending.

Native installation, real browser tabs API behavior, store review and WCAG conformance are not claimed as passed.
