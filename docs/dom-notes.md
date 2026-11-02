# claude.ai "Uploaded files" panel: verified structure and measurements

Captured on 2026-11-02 on the real page in an English interface, with Claude in Chrome, using dummy files only (`dummy-NN.txt`, 9 bytes each, 60 files in 3 chats). The fixtures in `tests/fixtures/real/en/` come from `scripts/capture-dom.js`. They contain no CSS classes, `data-*` attributes, ids or links on purpose: the code must not depend on them. The real page has long, unstable class names and `data-*` attributes; they are not recorded here.

## Route

- URL: `https://claude.ai/new#settings/data-privacy-controls/uploaded-files`. The panel is a modal "Settings" dialog (`role="dialog"`) opened over the page that is open. The route is the URL hash `#settings/data-privacy-controls/uploaded-files`.
- A hash-only change of the URL does not reload the page. Opening the hash route from another page opens the dialog.

## Structural rules (implementable without seeing the page)

1. **Panel.** The panel is the lowest common ancestor of the heading `h2` and the `table` (for the empty list: of the `h2` and the empty-state text). It contains the heading, the description, the table and the "Load more" button, and sits inside the Settings dialog. The settings navigation and the "Privacy" back button are outside it. The code treats everything outside the panel as off limits.
2. **Rows.** The list is a real `table` with one `thead` row and a `tbody`. Rows are `tbody > tr`. The first page has 50 rows. While the list is loading, `tbody` first shows 3 placeholder rows without a file name; a real row contains a `span[title]` (the title attribute is the full file name). Ignore rows without it.
3. **File name.** `row.querySelector("span[title]").title`. The name also appears as text in the same span, in the row's first button label ("Show chats for <name>") and in the trash button label ("Delete <name>"). Both labels are translated; the title attribute is not.
4. **Trash button.** Each row has exactly two buttons: the first (in the first cell, no text) opens the row's chats, the **last** one is the trash button. It has no text, only an icon. The code uses the last button only if the row has exactly two; any other count counts as an unknown layout (see "Layout guard").
5. **Confirm dialog.** Clicking the trash button opens an element with `role="alertdialog"`. It is rendered **outside** the panel and outside the Settings dialog (a portal directly below `body`), so it must be searched in `document`, not in the panel. It **contains the file name**: its `h2` reads "Delete <name>?". It holds two buttons: **Cancel first, Delete last**. The destructive button is the **last** button of the alertdialog; on the real page it also carries the initial focus. The text of both buttons is translated, the order is assumed not to be (confirmed in English only, no German page was available). Pressing Escape closes the dialog without deleting.
6. **After confirming.** The alertdialog closes and the row leaves `tbody` almost at once (see measurements). No toast element was seen. After a fresh reload the deleted files are gone, so the removal reached the server.
7. **Load more.** The panel holds one `button` that is not inside the `table`: a sibling of the table's wrapper `div`, after it. Its text is "Load more" (translated). It is present only while more files exist; when all files are loaded it is removed. A click appends the next rows to the same `tbody`; the rows are not replaced.
8. **Empty list.** The `table` is gone. The panel shows the heading, the description paragraph and a `div` with the text "No uploaded files found". Nothing else. The Settings dialog has its own title as a first `h2` ("Settings"); the panel's heading is the **last** `h2` of the dialog. Without a table, `findPanel` takes the last `h2`, climbs while the parent has only one child, and uses the parent of that block as the panel (checked on the real empty list in Phase 3).
9. **Icons.** The icon spans hold characters from the Unicode private use area (icon font). They carry no meaning and no text.

## Measurements (real page, 2026-11-02, English UI, 60 dummy files)

Method: `scripts/measure-live.js` run in the page with Claude in Chrome. Times come from `performance.now()` and a `MutationObserver`, not from estimates.

| What                                                                                   | Result                                                                             |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Rows on the first page after a fresh load                                              | 50 (counted in a poll of `tbody > tr` after load; 3 placeholder rows come first)   |
| Rows added by one "Load more" click                                                    | 10 (only 10 files were left; the page size is read from the first page)            |
| Confirm click until the row has left the DOM, 40 deletions                             | median 18 ms, maximum 32 ms (first deletions 20 to 30 ms, last ones 12 to 14 ms)   |
| Page end: time from the last deleted row of a page until "Load more" yields rows again | 2283 ms (one measurement; the click was repeated every 100 ms until rows appeared) |

Consequences: the old loop waited 700 ms plus up to 150 ms per file although the page needs about 20 ms. The old fixed pause of 1500 ms before "Load more" is shorter than the measured 2283 ms settle time, so a "Load more" right after a page end can return nothing for about 2 s. Only one page end could be measured because the budget allows 60 files per session; the number is a single measurement, not a distribution.

## Performance

Measured on the real page on 2026-11-02 (English UI, 60 dummy files in 3 chats, one session, same tab and list). Method: removals of table rows were recorded with a `MutationObserver` and `performance.now()`; "per file" is the time from the click on "Yes, delete everything" to the last row removal, divided by the number of files. The Phase 1 build (`git show phase-1:src/content/main.js`, fixed sleeps of 700 ms and 150 ms polls) was injected with one added line that ends its loop after 20 files; the new build was stopped after 20 files by clicking its Stop button from the page.

| Loop                                 | Files | Total  | Per file |
| ------------------------------------ | ----- | ------ | -------- |
| Phase 1 (fixed sleeps)               | 20    | 17.1 s | 0.857 s  |
| Phase 5 (waits for the row to leave) | 20    | 2.3 s  | 0.115 s  |

The new loop is about 7.4 times faster on the same page. Retries: 0. No wait ran into its timeout (a timeout would have ended the run with the "claude.ai did not accept further deletions" message, which never appeared). The 0.115 s per file is more than the 20 ms the page needs to remove a row; the rest is the time between the trash click, the opening of the dialog and the confirm click (not measured separately).

Not measured: a page end with the new loop. The session held 60 files, so the run never reached the second page; the "Load more" retry is verified against the mock only (single measured settle time: 2283 ms).

Stop: the run was stopped three times (after 20 files by script, after 5, after 12 files with a deliberate 1.5 s delay per file). Each time the message showed "Stopped: N files deleted." and the list held exactly 60 minus all files deleted so far (after the first two stops 20 and 15 rows, after the third 3 rows). A final full run of the last 3 files ended with "Done: 3 files deleted in 00:00." and an empty list.

`docs/images/real-running.png` shows the running view on the real page, cut to the panel. It was taken during a run with a deliberate 1.5 s delay before every trash click (to have time for the screenshot), so its "0.6 files/s" is not the real speed. Do not quote that figure.

## Interface language

- claude.ai has no interface language setting for this account. The only "Language" entry (Settings > General > Voice) is the voice language: switching it to German and back (done once in Phase 4) changed nothing on the page and only reset the neighbouring voice "Style" entry to a default. So no real German capture exists.
- `tests/fixtures/real/de/` is therefore the English fixture with only the visible labels and `aria-label` texts translated by hand (`scripts/make-german-fixture.mjs`). The German wording is a plausible guess, not claude.ai's. The structure is identical on purpose. Replace the files with a real capture (`scripts/capture-dom.js`) as soon as a German page is available.
- What is language independent (verified in English, assumed for other languages): the URL hash, the `table`/`tbody`/`tr` structure, the `span[title]` with the file name, the two buttons per row and their order, the `role="alertdialog"` that contains the file name, the order of its two buttons (Cancel first, Delete last: confirmed in English only, not in German), the `button` after the table. What changes with the language: the heading, description, column headings, `aria-label` of the table, the expand column, "Show chats for <name>" and "Delete <name>", the dialog title and both dialog buttons, "Load more", the empty-state text, the date format.
- `tests/fixtures/pseudo/` (`scripts/make-pseudo-fixture.mjs`) replaces every text and `aria-label` by `zz-<number>` and keeps only file names. The delete test runs on it for every code change; code that depended on any label fails there.

## Layout guard

- With the route in the URL and a dialog open, the extension expects either a table whose rows all have a trash button, or an empty state without any button. Anything else (also a list that does not finish loading) is reported after 5 seconds (`LAYOUT_GRACE_MS`, a policy choice) as "Layout not recognised. Nothing was deleted." with a link to the issue form, and no button is offered. If the list renders later, the message is removed and the button appears.
- Not detectable without labels: if claude.ai ever changes the route hash (`#settings/data-privacy-controls/uploaded-files`), the extension does not see the page at all. The button then disappears without any message. The bug report form covers this case ("the button is missing").
- While the button exists (also during a run) the guard does not run, so the changing list during a run cannot trigger the message.

## Not observed

- A rate limit, an error toast or a failed deletion: none could be provoked safely. Failure handling is generic and verified against the mock only.
- A toast after a deletion: none appeared in Phase 2. In Phase 3 (run by the extension) a small toast "Deleted <name>" showed at the bottom right of the page, outside the panel; the code does not use it.
- The panel in German: could not be captured (see "Interface language" below). Its fixtures are a translation of the English ones, not a capture.

## Phase 1 assumptions checked against the real page

The hand-written Phase 1 mock matched the real page in what the old code needs (trash buttons with `aria-label` "Delete <name>", a confirm button with the text "Delete", a "Load more" button, a heading "Uploaded files"). The three start tests pass against the fixture-based mock with the unchanged extension code, so no test is marked `test.fail`. Differences the mock now reproduces: the list is a table, the confirm dialog is a portal outside the panel and contains the file name, there are two buttons per row, and "Load more" is removed when the list is complete. The English-only label matching in the old code (`Delete .+`, `Delete`, `Load more`, `Uploaded files`) stays untouched until Phase 3.
