# Swift 0.7.0 — Neubau und Prüfung am 14.10.2026

80 automatisierte Tests bestehen. HTML-IDs sind eindeutig und sämtliche lokalen Paketressourcen vorhanden.

Browserprüfung mit isolierten Testdaten: 28 Arbeitsbereiche und 32 offene Tabs; Navigationspositionen y=96/140/184/306 bleiben nach 1440px Inhalts-Scroll unverändert. Der Ansichtswechsel startet den Inhalt oben. Geprüft wurden Englisch/Dunkel, Deutsch/Hell, 620px und 360px ohne horizontalen Überlauf, leere Startansicht, Vorlagenauswahl und Erstellen eines Arbeitsbereichs mit drei Links. Das Popup wurde bei 360px Breite vollständig angesehen.

Der echte Browser-Favicon-Cache und die installierte Edge-Erweiterung wurden nicht live geprüft. Die HTTP-Vorschau zeigt ausschließlich Ersatzsymbole; die API-Testdaten sind keine tatsächlichen Browserfenster. Keine neue Aussage zur nativen Browserinstallation wird aus diesen Prüfungen abgeleitet.

## Frühere Prüfungen

# Swift 0.6.1 — Prüfung vom 14.10.2026

80 automatisierte Tests bestehen. Neue Prüfungen decken Browser-Favicon-Adressen, ungültige URLs, Offline-Vorschau und Ladefehler ab.

Die HTTP-Oberfläche wurde mit isolierten Browser-API-Testdaten geprüft: 28 Arbeitsbereiche, 32 offene Tabs, Scrollen der Hauptliste, Wechsel zwischen Ansichten, leerer Start, Anlegen eines Arbeitsbereichs und Hilfe-Dialog. Die drei oberen Navigationskontrollen bleiben bei y=160/206/260 px an derselben Stelle, auch nach 1296 px Inhalts-Scroll. Das schmale Layout bei 620 px hat keinen horizontalen Überlauf.

Die installierte Erweiterung und der echte Browser-Favicon-Cache konnten über die verfügbaren Browser-Werkzeuge nicht geprüft werden. Der native Icon-Zugriff folgt der dokumentierten Chromium-Favicon-Schnittstelle; die HTTP-Vorschau verwendet nur Ersatzsymbole.

Design-Referenzen: https://workona.com/help/tab-manager/ und https://gettabme.com/guide.html. Browser-Schnittstelle: https://developer.chrome.com/docs/extensions/how-to/ui/favicons.

## Frühere Prüfungen

# KelvaniSwift 0.4.1 — Validation

## Automated checks

69 Node.js tests pass. Coverage includes legacy v1 data, optional metadata/settings, empty workspaces, strict URL/backup validation, 100/200 limits, immutable operations, concurrent storage writes, write failures, corruption protection, stale move/delete detection, atomic cross-workspace moves, destination deduplication, reordering, capture filters, private/popup-window exclusion, opening failures, retry/pins, existing-tab reuse, manager routing and worker request validation.

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

## Follow-up audit — 2026-10-13

Verified clearing selection directly and on search changes, a hash route retaining an unsaved link dialog, deferred switching, and dialog focus return. New API tests cover target-window preference and failures after successful tab creation. Native tab navigation remains mocked.

## 0.4.1 template and onboarding checks

- Six bilingual starters, independent selected-link creation, editable custom templates, stale-edit/delete protection, safe URLs and 50-template limits have automated coverage.
- Old backups remain valid; template conflicts retain both versions on merge.
- HTTP preview: customised 3D-printing starter, saved an own template, created an independent two-link workspace, added a fourth research link and checked German/English and light/dark rendering.
- Compact 460 × 580 popup checked visually; expansion retained the template gallery. Browser APIs remain mocked; native Edge/Chrome installation is still pending.
