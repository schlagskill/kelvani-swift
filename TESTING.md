# Testing KelvaniSwift

Automated: `npm test` using Node.js 22+. Test data uses example.com.

Native extension release checks in Chrome and Edge:

1. Load unpacked; click the toolbar action; verify a local manager tab opens.
2. Create two normal windows with fictional web URLs. Select each window and confirm its snapshot is correct.
3. Include pinned tabs, duplicate URLs and an internal browser page. Verify duplicates collapse, the internal page is omitted and pinned state is saved.
4. Reopen in a new window. Existing windows must remain open, and supported saved URLs/pins must be restored.
5. Private windows must not be captured.
6. Rename, remove, search and import/export a workspace. Identical imports must not duplicate it; conflicting backups must retain both versions.
7. Reject executable URLs, invalid timestamps/schema, duplicate IDs and oversized backups.
8. Simulate a storage quota failure; confirm the UI reports it and does not claim a save.
9. Test restore errors and browser console/CSP errors. No telemetry or third-party startup requests should occur.

Static HTTP preview validates layout and backup UI only; it does not validate live Chrome APIs, toolbar activation or unpacked extension installation.
