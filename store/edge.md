# Microsoft Edge Add-ons listing

Texts to paste into the submission form in Partner Center. The first listing is created by hand; the release pipeline only publishes later versions. The same zip as for Chrome is used (`uploads-cleaner-<version>-chrome.zip`).

## Name

Uploads Cleaner for claude.ai

## Short description

Adds a button that deletes all uploaded files in the claude.ai privacy settings. Not affiliated with Anthropic.

## Long description

claude.ai lists all files you uploaded under Settings > Privacy > Uploaded files. Each row has a trash icon and a confirmation. There is no way to delete everything at once, so hundreds of files mean hundreds of double clicks.

Uploads Cleaner for claude.ai adds one button, "Delete all uploaded files", to that page. After a second confirmation it clicks through the list for you: trash icon, confirm, next file. When a page is empty it loads the next one.

Details:

- A live line with the number of deleted files, the elapsed time and the speed.
- A Stop button. The file that is being deleted finishes, then the run ends.
- Retries with growing pauses if a deletion fails, and a clear message if claude.ai stops accepting deletions.
- A message and no deletion at all if the page layout is not recognised.
- Independence from the interface language: the extension finds the list by the address and by the structure of the page, not by button labels.

The extension needs access to https://claude.ai/* only and no other permission. It makes no network requests of its own, collects nothing and sends nothing anywhere. It clicks the same buttons you would click.

Keep the tab visible while it runs, because browsers slow down hidden tabs. Text that claude.ai already extracted into a chat stays in that chat; delete the chat to remove it. The extension's own texts are English only. If claude.ai changes the address of the settings page, the button disappears.

Source code and issues: https://github.com/hbertsch/claude-uploads-cleaner

Not affiliated with, endorsed by or sponsored by Anthropic. Claude and claude.ai are trademarks of Anthropic, PBC.

## Single purpose

Delete all files in the "Uploaded files" list of the claude.ai privacy settings with one button instead of one file at a time.

## Permission justification

The extension declares no permissions. Its content script runs only on `https://claude.ai/*` (host access), because it adds a button to the claude.ai settings page and clicks that page's own buttons. It reads nothing outside that page and needs no other host and no browser API permission.

## Remote code

No. All code is in the package. The extension loads no script from the network and makes no network requests.

## Notes for certification

You need a claude.ai account with at least one uploaded file. In a new chat attach a small text file and send it. Then open https://claude.ai/new#settings/data-privacy-controls/uploaded-files (or Settings > Privacy > Uploaded files). The button "Delete all uploaded files" appears under the heading. Click it, then "Yes, delete everything". The file disappears and the line "Done: 1 files deleted" shows. Use an account whose uploaded files you are willing to lose: the button deletes all of them.

The extension has no sign-in, no settings page and no background script It collects no user data.

## Disclaimer for content not created by the developer

Not affiliated with, endorsed by or sponsored by Anthropic. Claude and claude.ai are trademarks of Anthropic, PBC. The extension only operates the user's own claude.ai settings page and uses no Anthropic logo or artwork.

## Search terms

- claude
- claude.ai
- uploaded files
- delete all
- bulk delete
- cleanup
- privacy

## Logo

`icon-300.png` (300 x 300 pixels)

## Screenshots

1. `screenshots/01-button.png`: the new button on the Uploaded files page.
2. `screenshots/02-confirm.png`: the inline second confirmation.
3. `screenshots/03-running.png`: the running view with progress and Stop.

The screenshots show a mock page with generic dummy file names, not a real account.
