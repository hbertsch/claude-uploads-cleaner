import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const BUTTON_SELECTOR = "#uploads-cleaner-button";
const CONFIRM_SELECTOR = "#uploads-cleaner-confirm";
const LAYOUT_MESSAGE_SELECTOR = "#uploads-cleaner-layout-message";
// The extension waits LAYOUT_GRACE_MS (5 s) for the list to render before it reports the layout.
const LAYOUT_REPORT_TIMEOUT_MS = 15_000;
const ISSUE_URL =
  "https://github.com/hbertsch/claude-uploads-cleaner/issues/new?template=layout_changed.yml";

for (const breakLayout of ["remove-trash-buttons", "rename-table"]) {
  test(`unknown layout (${breakLayout}) shows the report message and offers no deletion`, async ({
    context,
    page,
  }) => {
    await installClaudeMock(context, { fileCount: 3, breakLayout });
    await page.goto(UPLOADED_FILES_URL);

    const message = page.locator(LAYOUT_MESSAGE_SELECTOR);
    await expect(message).toContainText("Layout not recognised. Nothing was deleted.", {
      timeout: LAYOUT_REPORT_TIMEOUT_MS,
    });
    await expect(message.locator("a")).toHaveAttribute("href", ISSUE_URL);
    await expect(page.locator(BUTTON_SELECTOR)).toHaveCount(0);
    await expect(page.locator(CONFIRM_SELECTOR)).toHaveCount(0);
    expect(await page.evaluate(() => window.__deletionLog)).toEqual([]);
  });
}

test("no button and no message when the page has no settings route", async ({ context, page }) => {
  await installClaudeMock(context, { fileCount: 3 });
  await page.goto("https://claude.ai/new");
  await expect(page.locator("tbody > tr").first()).toBeVisible();
  await expect(page.locator(BUTTON_SELECTOR)).toHaveCount(0);
  await expect(page.locator(LAYOUT_MESSAGE_SELECTOR)).toHaveCount(0);

  // The extension is alive: once the route matches and the page changes, the button appears.
  await page.evaluate(() => {
    location.hash = "#settings/data-privacy-controls/uploaded-files";
    document.body.append(document.createElement("div"));
  });
  await expect(page.locator(BUTTON_SELECTOR)).toBeVisible();
});

test("an empty list is a known layout: the button appears and no message is shown", async ({
  context,
  page,
}) => {
  await installClaudeMock(context, { fileCount: 0 });
  await page.goto(UPLOADED_FILES_URL);

  await expect(page.locator(BUTTON_SELECTOR)).toBeVisible();
  await expect(page.locator(LAYOUT_MESSAGE_SELECTOR)).toHaveCount(0);
});
