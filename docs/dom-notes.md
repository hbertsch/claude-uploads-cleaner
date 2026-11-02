# claude.ai "Uploaded files" panel: verified structure and measurements

Captured on 2026-11-02 on the real page in an English interface, with Claude in Chrome, using dummy files only (`dummy-NN.txt`, 9 bytes each, 60 files in 3 chats). The fixtures in `tests/fixtures/real/en/` come from `scripts/capture-dom.js`. They contain no CSS classes, `data-*` attributes, ids or links on purpose: the code must not depend on them. The real page has long, unstable class names and `data-*` attributes; they are not recorded here.

## Route

- URL: `https://claude.ai/new#settings/data-privacy-controls/uploaded-files`. The panel is a modal "Settings" dialog (`role="dialog"`) opened over the page that is open. The route is the URL hash `#settings/data-privacy-controls/uploaded-files`.
- A hash-only change of the URL does not reload the page. Opening the hash route from another page opens the dialog.

## Structural rules (implementable without seeing the page)

1. **Panel.** The panel is the lowest common ancestor of the heading `h2` and the `table` (for the empty list: of the `h2` and the empty-state text). It contains the heading, the description, the table and the "Load more" button, and sits inside the Settings dialog. The settings navigation and the "Privacy" back button are outside it. The code treats everything outside the panel as off limits.
2. **Rows.** The list is a real `table` with one `thead` row and a `tbody`. Rows are `tbody > tr`. The first page has 50 rows. While the list is loading, `tbody` first shows 3 placeholder rows without a file name; a real row contains a `span[title]` (the title attribute is the full file name). Ignore rows without it.
3. **File name.** `row.querySelector("span[title]").title`. The name also appears as text in the same span, in the row's first button label ("Show chats for <name>") and in the trash button label ("Delete <name>"). Both labels are translated; the title attribute is not.
4. **Trash button.** Each row has exactly two buttons: the first (in the first cell, no text) opens the row's chats, the **last** one is the trash button. Use the last `button` of the row. It has no text, only an icon.
5. **Confirm dialog.** Clicking the trash button opens an element with `role="alertdialog"`. It is rendered **outside** the panel and outside the Settings dialog (a portal directly below `body`), so it must be searched in `document`, not in the panel. It **contains the file name**: its `h2` reads "Delete <name>?". It holds two buttons: **Cancel first, Delete last**. The destructive button is the **last** button of the alertdialog; on the real page it also carries the initial focus. The text of both buttons is translated, the order is not (to be confirmed in German in Phase 4). Pressing Escape closes the dialog without deleting.
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

## Not observed

- A rate limit, an error toast or a failed deletion: none could be provoked safely. Failure handling is generic and verified against the mock only.
- A toast after a deletion: none appeared in Phase 2. In Phase 3 (run by the extension) a small toast "Deleted <name>" showed at the bottom right of the page, outside the panel; the code does not use it.
- The panel in German: captured in Phase 4.

## Phase 1 assumptions checked against the real page

The hand-written Phase 1 mock matched the real page in what the old code needs (trash buttons with `aria-label` "Delete <name>", a confirm button with the text "Delete", a "Load more" button, a heading "Uploaded files"). The three start tests pass against the fixture-based mock with the unchanged extension code, so no test is marked `test.fail`. Differences the mock now reproduces: the list is a table, the confirm dialog is a portal outside the panel and contains the file name, there are two buttons per row, and "Load more" is removed when the list is complete. The English-only label matching in the old code (`Delete .+`, `Delete`, `Load more`, `Uploaded files`) stays untouched until Phase 3.
