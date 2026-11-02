import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

// Runs through `npm run test:browsers`: the packaged extension in an installed browser
// (BROWSER_EXECUTABLE) with the unzipped Chrome zip (EXTENSION_DIR).
test.skip(
  !process.env.BROWSER_EXECUTABLE || !process.env.EXTENSION_DIR,
  "BROWSER_EXECUTABLE and EXTENSION_DIR are not set",
);

test("the button appears when the page is already open", async ({ context, page }) => {
  await installClaudeMock(context, { fileCount: 120, pageSize: 50 });
  await page.goto(UPLOADED_FILES_URL);
  await expect(page.locator("#uploads-cleaner-button")).toBeVisible();
});

test("a 120-file run deletes every file", async ({ context, page }) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, { fileCount: 120, pageSize: 50 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#uploads-cleaner-message")).toHaveText(/^Done: 120 files deleted/, {
    timeout: 30_000,
  });
  expect(await page.evaluate(() => window.__deletionLog.length)).toBe(120);
});

test("Stop ends a run after the current file", async ({ context, page }) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, { fileCount: 1000 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await page.waitForFunction(() => window.__deletionLog.length >= 20);
  await page.getByRole("button", { name: "Stop" }).click();

  const message = page.locator("#uploads-cleaner-message");
  await expect(message).toHaveText(/^Stopped: \d+ files deleted\.$/);
  const shownCount = Number((await message.textContent()).match(/\d+/)[0]);
  expect(await page.evaluate(() => window.__deletionLog.length)).toBe(shownCount);
  expect(shownCount).toBeLessThan(1000);
});
