# KelvaniSwift 0.2.0 - Validation

## Verified automatically

Node.js unit tests: 30 tests. Domain validation, unsafe URLs, JSON backups, failed writes, concurrent transactions, workspace edit conflicts, capture filters, private-window rejection, partial restore and retry/pins with mocked browser APIs.

## HTTP browser preview

Verified: startup without console errors, load explicit example data, rename workspace, remove/undo workspace, select/remove/undo saved tab. Narrow layouts are visually checked. Preview data are fictional. No native extension result is inferred from this.

## Native Chrome / Edge release gate (still pending)

1. Load unpacked in each browser and check toolbar action opens the local manager.
2. Check CSP/resource loading and no third-party startup requests.
3. Capture two normal windows with pinned, duplicate and internal tabs. Reject private windows. Check snapshot source and count.
4. Restore into a new window, preserving existing windows and pins. Simulate partial errors; retry only failures. Focus an existing live tab.
5. Import invalid, oversized and old-version backups. Cancel preview; ensure no changes. Test quota errors without false success.
6. Full keyboard navigation, dialog return focus, screenreader labels, 200% text and 320 CSS px.

Not yet validated: native Chrome/Edge installation, real tabs API behavior, a full screenreader audit, store review or WCAG conformance. No cloud sync or full Workona feature parity is claimed.
