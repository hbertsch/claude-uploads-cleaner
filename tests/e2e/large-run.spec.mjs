import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const FILE_COUNT = 1000;

test("deletes 1000 files across 20 pages", async ({ context, page }) => {
  test.setTimeout(120_000);
  await installClaudeMock(context, { fileCount: FILE_COUNT });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#uploads-cleaner-message")).toHaveText(
    new RegExp(`^Done: ${FILE_COUNT} files deleted in \\d\\d:\\d\\d\\.$`),
    { timeout: 100_000 },
  );

  const deletionLog = await page.evaluate(() => window.__deletionLog);
  expect(deletionLog).toHaveLength(FILE_COUNT);
  expect(new Set(deletionLog).size).toBe(FILE_COUNT);
});
