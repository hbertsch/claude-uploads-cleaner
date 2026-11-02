import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const BUTTON_SELECTOR = "#uploads-cleaner-button";
const MESSAGE_SELECTOR = "#uploads-cleaner-message";
const FILE_COUNT = 6;
// A page size below the file count makes the run cross a "Load more".
const PAGE_SIZE = 4;

const LOCALES = [
  { locale: "en", heading: "Uploaded files" },
  { locale: "de", heading: "Hochgeladene Dateien" },
  { locale: "pseudo", heading: /^zz-\d+$/ },
];

for (const { locale, heading } of LOCALES) {
  test(`deletes all files when the page is in the "${locale}" locale`, async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);
    await installClaudeMock(context, { fileCount: FILE_COUNT, pageSize: PAGE_SIZE, locale });
    await page.goto(UPLOADED_FILES_URL);

    await expect(page.locator("h2").last()).toHaveText(heading);
    await page.locator(BUTTON_SELECTOR).click();
    await page.getByRole("button", { name: "Yes, delete everything" }).click();
    await expect(page.locator(MESSAGE_SELECTOR)).toHaveText(`Done: ${FILE_COUNT} files deleted`, {
      timeout: 40_000,
    });

    const deletionLog = await page.evaluate(() => window.__deletionLog);
    expect(deletionLog).toHaveLength(FILE_COUNT);
    expect(new Set(deletionLog).size).toBe(FILE_COUNT);
  });
}
