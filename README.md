# KelvaniSwift

A free, local-first, open-source workspace manager for Chrome and Edge. Save a window's web tabs into named workspaces, search saved titles and URLs, and reopen a workspace in a new window. Includes rename, delete, JSON export and validated backup import that preserves existing workspaces.

## Install for development

Download the repository ZIP and extract it. Open `chrome://extensions` or `edge://extensions`, enable Developer mode and choose **Load unpacked** / **Entpackt laden**. Select the folder containing manifest.json. Pin KelvaniSwift's toolbar action and click it to open the manager.

This is an unpacked development release, not a published store extension. No accounts or build step are required.

## Use

Choose a normal browser window, enter a workspace name and save. Saving reads the current HTTP(S) tab URLs, titles and pinned states. Duplicate URLs are collapsed (the first occurrence wins); private windows and internal browser pages are excluded. Reopening always creates a new window and leaves existing tabs alone. Stored pinned tabs are re-pinned when possible. Rename or remove a saved workspace without affecting live tabs. Search matches workspace names, tab titles and URLs.

## Privacy and permissions

`storage` stores workspaces on this device. `tabs` is needed to read tab titles/URLs and restore pinned states. There are no content scripts, all-sites host permissions, analytics, remote scripts or cloud services. The toolbar action opens a packaged local page. The branding link visits kelvani.net only when clicked; no live website is required.

Workspaces contain browsing information. Protect exported backups. Removing the extension removes local data, so export first. Restoring opens saved URLs, which makes normal requests to those websites. Page contents, form entries, scroll positions, login sessions and browser history are not saved. Non-HTTP(S) URLs and embedded credentials are rejected.

## Backups

Import merges into existing data. Identical workspaces are skipped; an ID collision with different content retains both versions using a new ID. Import never overwrites existing workspaces. Limit: 2 MB per import, 100 workspaces, 200 unique web tabs per workspace. Quota failures are reported instead of displaying a successful save. Use Web Locks for serialized read-modify-write storage operations.

## Development and tests

No dependencies or build step. With Node.js 22+: `npm test`.

The static HTTP preview uses separate localStorage and cannot read or reopen live browser tabs. It explicitly labels that mode and disables extension-only actions. For native Chrome/Edge QA, follow TESTING.md. Tests cover private/internal tab filtering, safe URLs, immutable snapshots, limits, backups, merge conflicts and search.

## Scope of 0.1

This is an independently implemented workspace tool inspired by the general concept of project-based tab organization. It is not affiliated with Workona and does not copy Workona's code or artwork. It is not a full feature-equivalent replacement: automatic session updates, switching by closing other tabs, tab suspension, browser tab-group restoration and cross-device sync are not included. Current workspaces are manually saved snapshots.

## Contributing and license

Report bugs with reproduction steps and fictional URLs. Run tests before opening a pull request. Follow-up priorities are native extension QA, snapshot updates from a selected live window, reliable restore ordering and explicit restore progress for large workspaces.

Newly written for schlagskill's Kelvani project with OpenAI coding assistance. MIT license, see LICENSE. No foreign donation links or repository history.
