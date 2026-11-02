# Firefox Add-ons listing (addons.mozilla.org)

Texts to paste into the submission form. The first listing is created by hand in the developer hub; the release pipeline only uploads later versions.

## Name

Uploads Cleaner for claude.ai

## Summary

Adds one button to the Uploaded files page on claude.ai that deletes all your uploaded files, with a second confirmation, live progress and a Stop button. No permissions, no data collection.

## Description

claude.ai lists all files you uploaded under Settings > Privacy > Uploaded files. Each row has a trash icon and a confirmation. There is no way to delete everything at once, so hundreds of files mean hundreds of double clicks.

Uploads Cleaner adds one button, "Delete all uploaded files", to that page. After a second confirmation it clicks through the list for you: trash icon, confirm, next file. When a page is empty it loads the next one.

Details:

- A live line with the number of deleted files, the elapsed time and the speed.
- A Stop button. The file that is being deleted finishes, then the run ends.
- Retries with growing pauses if a deletion fails, and a clear message if claude.ai stops accepting deletions.
- A message and no deletion at all if the page layout is not recognised.
- Independence from the interface language: the extension finds the list by the address and by the structure of the page, not by button labels.

The extension has no permissions apart from running on https://claude.ai/*. It makes no network requests of its own, collects nothing and sends nothing anywhere. It clicks the same buttons you would click.

Keep the tab visible while it runs, because browsers slow down hidden tabs. Text that claude.ai already extracted into a chat stays in that chat; delete the chat to remove it. The extension's own texts are English only. If claude.ai changes the address of the settings page, the button disappears.

Not affiliated with, endorsed by or sponsored by Anthropic. Claude and claude.ai are trademarks of Anthropic, PBC.

Source code and issues: https://github.com/hbertsch/claude-uploads-cleaner

## Categories

Privacy & Security, Other

## Support

- Support website: https://github.com/hbertsch/claude-uploads-cleaner/issues
- Homepage: https://github.com/hbertsch/claude-uploads-cleaner

## Licence

MIT

## Notes for reviewers

What it does: on https://claude.ai/ the content script waits for the page Settings > Privacy > Uploaded files (URL hash `#settings/data-privacy-controls/uploaded-files`), adds one button and, after a second confirmation, clicks the page's own trash and confirm buttons one file at a time.

Data: no data collection (`data_collection_permissions` is `required: ["none"]`). The extension has no `permissions` and no background script, makes no `fetch`, `XMLHttpRequest`, `WebSocket` or beacon calls, and uses no remote code. The source is plain JavaScript in five files under `src/content/`; the zip is built reproducibly from the tagged source with `npm ci && npm run build`.

How to test: you need a claude.ai account with at least one uploaded file. In a new chat attach a small text file and send it. Then open Settings > Privacy > Uploaded files. The button "Delete all uploaded files" appears under the heading. Click it, then "Yes, delete everything". The file disappears and the line "Done: 1 files deleted" shows. Use only an account whose uploaded files you are willing to lose: the button deletes all of them.

## Screenshots

1. `screenshots/01-button.png`: the new button on the Uploaded files page.
2. `screenshots/02-confirm.png`: the inline second confirmation.
3. `screenshots/03-running.png`: the running view with progress and Stop.

The screenshots show a mock page with generic dummy file names, not a real account.
