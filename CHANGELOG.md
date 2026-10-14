## 0.7.0

- Neuer, zusammenhängender Produktstil nach einer dokumentierten Recherche mit 52 Quellen.
- Einmalige Navigation und zentrale Suche; feste Scrollbereiche.
- Arbeitsbereiche als kompakte Liste mit Website-Kontext, Tab-Anzahl und Datum.
- Abgestimmtes Popup, neutralere Hell-/Dunkel-Palette und responsive Navigation.
- Datenmodell, Browser-Aktionen, Vorlagen und Backup-Funktionen erhalten.

## 0.6.1

- Feste Navigation; Inhalt und Arbeitsbereich-Liste scrollen getrennt.
- Übersicht ohne dauerhafte Einführung, mit kompakten Zahlen und Hilfe-Button.
- Vorlagen in eigener Ansicht; Mehr-Menü und bedarfsabhängige Tab-Details.
- Browser-Favicons für offene/gesicherte Tabs mit sauberem Ersatz bei Ladefehlern.
- Lesbare Fenster-Nummern und Tab-Zähler in der offenen Liste.
- Ansicht bleibt beim Neuladen über die Adresse erhalten.

## 0.6.0

Eigenständiges 360px-Popup: Fenster sichern, suchen, wieder öffnen und große Ansicht aufrufen. Große Übersicht mit echten Bestandszahlen, Favoritenfilter und drei Sortierungen. K-Logo in Lila.

# UI release 0.5.0

Gemeinsames Designsystem, klare Überschriften und überarbeitetes Popup.

Gemeinsame Quelle: work/kelvani-ui. Siehe assets/ui/README.md.

# Changelog

## 0.4.1 — 2026-10-13

- Remove redundant brand/category captions above the home, gallery and template editor headings.


## 0.4.0 — 2026-10-13

- Add a project overview, three-step first-run introduction and always-available guide.
- Add six bilingual editable starter templates and up to 50 locally saved user templates.
- Preview and edit selected links before creating independent workspaces; save existing workspaces as templates.
- Include user templates in compatible backups with conflict-safe merging and stale-edit protection.
- Refine compact/full layouts, project cards and saved-tab surfaces; preserve the selected view when expanding.
- 69 automated tests plus HTTP interface checks.


## 0.3.1 — 2026-10-13

- Focus an existing manager without reloading it; switch workspaces using a same-document route. Defer switches while an input dialog is open.
- Reset hidden selections when search or workspace context changes; add a clear-selection control.
- Preserve keyboard focus on reordered tab controls and restore focus after dialogs.
- Prefer matching tabs in the target window. Preserve successful restoration results if querying/focusing later fails, and focus a later successful tab after an earlier failure.
- Error notices use alert semantics; opening controls stay disabled when saved data are unavailable.
- 60 automated tests and HTTP UI checks; native Chrome/Edge installation remains pending.

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
