# Contributing

Thank you for helping. The most useful contribution is a fixed or new page capture when claude.ai changes its layout. Code changes are welcome too. Please open an issue first for anything bigger than a small fix.

## Setup

You need Node.js (the version in `.nvmrc`) and the `zip` and `unzip` tools.

```
npm ci
npx playwright install chromium
```

## Tests

| Command                  | What it does                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `npm test`               | End-to-end tests in Chromium against a mock page built from captured claude.ai markup |
| `npm run test:unit`      | Unit tests, including the check that no claude.ai label is used in the logic          |
| `npm run lint`           | ESLint                                                                                |
| `npm run format:check`   | Prettier (`npm run format` fixes it)                                                  |
| `npm run check:fixtures` | Allow-list check for the captured page fixtures                                       |
| `npm run check:docs`     | Links, store text lengths and screenshot sizes                                        |
| `npm run check:version`  | `package.json`, `src/manifest.json` and `CHANGELOG.md` have the same version          |
| `npm run build`          | Writes the Chrome and Firefox zips into `dist/`                                       |
| `npm run lint:ext`       | Mozilla's `web-ext lint` on the Firefox build (0 errors, 0 warnings)                  |
| `npm run test:packaged`  | Builds, unzips the Chrome zip and runs the start tests against the unzipped folder    |

The same steps run in CI, in this order. Run them all before you open a pull request.

Firefox cannot be driven by the end-to-end tests, because Playwright cannot load an extension into Firefox. The Firefox build is linted with `web-ext`, and its behaviour on the real page is checked by hand before a release: `npx web-ext run --source-dir dist/firefox`.

## Code style

- Source code, tests, comments and commit messages are in English.
- Names say what a thing does. No abbreviations.
- Time values are in milliseconds, and constants end in `_MS`.
- Knowledge about the claude.ai page lives only in `src/content/page.js`. Visible texts live only in `src/content/ui.js`. The delete loop lives in `src/content/runner.js`. Constants live in `src/content/config.js`.
- Never compare against claude.ai texts such as "Delete" or "Load more". Use the URL, element roles, the structure and the file name in the row. `npm run test:unit` fails if a label sneaks in.
- Do not use `innerHTML`. Build elements with `createElement` and `textContent`.
- Do not add network access or permissions. The privacy promise in [PRIVACY.md](PRIVACY.md) depends on it.
- Keep it simple. A change should do what it says and nothing more.

## When claude.ai changes its layout

If the button disappears or the extension says "Layout not recognised", the page structure changed. To update the extension, capture the new structure and compare it with the one in [docs/dom-notes.md](docs/dom-notes.md).

1. Use a test account, or an account where you can lose the files. Upload a few small text files, so the list has rows. Names do not matter, the script replaces them.
2. Open claude.ai, then Settings > Privacy > Uploaded files.
3. Open the browser's developer console. Paste the content of `scripts/capture-dom.js` and run it (it ends with `("panel", 2)`: the kind of capture and the number of rows to keep). It copies the panel (not the sidebar and not the settings menu) into `window.__capture`, removes classes, ids, links and `data-` attributes, and replaces file names with `dummy-001.txt` and so on.
4. Read the result with `window.__capture.chunks.join("")` and save it as `tests/fixtures/real/en/panel-with-rows.html`. For `confirm-dialog.html`, change the arguments on the last line of the script to `("confirm")`, click one trash icon (do not confirm) and run it again. The other two files, `panel-empty.html` and `panel-after-load-more.html`, are captured the same way with an empty list and after a click on "Load more". The script prints a SHA-256 hash; compare it with the hash of your saved file.
5. Run `npm run check:fixtures`. It fails if a fixture contains a file name that is not `dummy-NNN.txt`, a UUID, an `@` sign, a URL or a `data-` attribute.
6. Scrub checklist before you commit a fixture or paste markup into an issue:
   - No real file names, chat titles, names or e-mail addresses. Search the file for your own name and your company.
   - No account or organisation names, no URLs, no IDs.
   - Only the panel or the dialog, nothing from the sidebar.
7. Run `npm test`. Fix `src/content/page.js` until the tests pass, and add a note to `docs/dom-notes.md` that says what changed.

Please do not paste real page markup into an issue. Use the script and check its output.

## Adding a language

The code does not read labels, so a new interface language should work as is. To check it:

1. Capture the four fixtures as above, with claude.ai set to that language. Save them in `tests/fixtures/real/<language code>/`.
2. In `tests/mock/claude-mock.mjs`, add the code to `FIXTURE_DIRECTORY_BY_LOCALE`.
3. In `tests/e2e/languages.spec.mjs`, add the code and the translated heading of the list to `LOCALES`.
4. Run `npm test` and `npm run check:fixtures`.

## Packaged build

`npm run build` writes `dist/uploads-cleaner-<version>-chrome.zip` and `-firefox.zip`. The build is reproducible: building twice from the same commit gives identical files (`npm run check:build-reproducible`). `npm run test:packaged` runs the start tests against the unzipped Chrome zip, so the release package is tested, not only the source.

## Commits and pull requests

- One logical change per commit.
- Start the message with a short summary in the imperative, for example `Stop the run when the user leaves the page`. Add a line about why, if it is not obvious.
- Add or update tests for what you change. A bug fix starts with a test that fails.
- Add a line to the `[Unreleased]` section of [CHANGELOG.md](CHANGELOG.md).
- Fill in the pull request template.

## Release

Only the maintainer releases. In short:

1. Set the new version in `package.json` and `src/manifest.json`, and move the `[Unreleased]` entries in `CHANGELOG.md` under a heading for the version with its date.
2. Run `npm run check:version` and the other checks above.
3. Tag the commit `v<version>` and push the tag.
4. Approve the store upload jobs when GitHub asks.

The steps for the store accounts are in [docs/maintainers.md](docs/maintainers.md).
