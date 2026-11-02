# Privacy

Uploads Cleaner for claude.ai collects, sends and stores nothing.

- **No data leaves your browser.** The extension makes no network requests of its own. The source contains no `fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket` calls.
- **No storage.** It does not use cookies, local storage or any browser storage API. When you close the tab, nothing is left.
- **No account, no tracking, no analytics, no remote code.** All code ships inside the package.
- **No permissions.** `manifest.json` has no `permissions` and no `host_permissions` key. The only access is the content script, which runs on `https://claude.ai/*`.

## What the content script reads

It reads the page structure of Settings > Privacy > Uploaded files: the list of rows, the buttons and the file names in the rows. It needs the file names to check that the file it is deleting is the one that disappears from the list. File names stay in the page and are not copied anywhere.

## What it does on the page

It clicks the same buttons you would click, one file at a time, and shows its own button, progress line and messages. Deleting a file is done by claude.ai itself, under your account, as if you had clicked.

## Changes

If this ever changes, the change is listed in [CHANGELOG.md](CHANGELOG.md) before it ships.

Questions: open an issue at https://github.com/hbertsch/claude-uploads-cleaner/issues.
