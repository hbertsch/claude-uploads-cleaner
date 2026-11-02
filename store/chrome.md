# Chrome Web Store listing

Texts to paste into the developer dashboard (https://chrome.google.com/webstore/devconsole). The first listing is created by hand; the release pipeline does not upload to the Chrome Web Store. Upload `dist/uploads-cleaner-<version>-chrome.zip` from the GitHub release.

## Store listing tab

### Name

Uploads Cleaner for claude.ai

### Summary (limit 132 characters)

Deletes all your uploaded files on claude.ai with one button, a second confirmation, live progress and a Stop button.

### Description

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

### Category and language

Category: Productivity. Language: English.

### Graphics

- Store icon 128 x 128: `src/icons/icon-128.png`
- Screenshots 1280 x 800: `store/screenshots/01-button.png`, `02-confirm.png`, `03-running.png`. They show a mock page with generic dummy file names, not a real account.

### Links

- Official URL / homepage: https://github.com/hbertsch/claude-uploads-cleaner
- Support URL: https://github.com/hbertsch/claude-uploads-cleaner/issues

## Privacy tab

### Single purpose

Add one button to the Uploaded files page of claude.ai's privacy settings that deletes all uploaded files, one file at a time, after a confirmation.

### Permission justification

The extension requests no permissions. If the dashboard asks for a host permission justification: the content script runs only on https://claude.ai/* because that is the only site where the Uploaded files page exists. It reads the list of rows and clicks the page's own trash and confirm buttons. Nothing is sent anywhere.

### Remote code

No, the extension does not use remote code. All code ships inside the package.

### Data usage

Tick no data type under "What user data do you plan to collect". Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

https://github.com/hbertsch/claude-uploads-cleaner/blob/main/PRIVACY.md

## Test instructions tab

No login is needed for a quick look, but the button only appears on the logged-in page. You need a claude.ai account with at least one uploaded file. In a new chat attach a small text file and send it. Then open Settings > Privacy > Uploaded files. The button "Delete all uploaded files" appears under the heading. Click it, then "Yes, delete everything". The file disappears and the line "Done: 1 files deleted" shows. Use only an account whose uploaded files you are willing to lose: the button deletes all of them.

## Distribution tab

Visibility: Public. Regions: all regions. Price: free.
