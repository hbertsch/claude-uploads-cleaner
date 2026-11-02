import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const BUTTON_SELECTOR = "#uploads-cleaner-button";
const CONFIRM_QUESTION = "Delete ALL uploaded files? This cannot be undone.";

test("button appears when the panel is already in the page at load", async ({ context, page }) => {
  await installClaudeMock(context, { fileCount: 3 });
  await page.goto(UPLOADED_FILES_URL);

  await expect(page.locator(BUTTON_SELECTOR)).toHaveText("Delete all uploaded files");
});

test("button appears when the panel renders 800 ms later", async ({ context, page }) => {
  await installClaudeMock(context, { fileCount: 3, panelRenderDelayMs: 800 });
  await page.goto(UPLOADED_FILES_URL);

  await expect(page.locator(BUTTON_SELECTOR)).toHaveText("Delete all uploaded files");
});

test("button and inline confirm delete all files of a 120-file mock across pages", async ({
  context,
  page,
}) => {
  test.setTimeout(240_000);
  const fileCount = 120;
  await installClaudeMock(context, { fileCount, pageSize: 50 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator(BUTTON_SELECTOR).click();
  await expect(page.getByText(CONFIRM_QUESTION)).toBeVisible();
  await page.screenshot({ path: "test-results/phase1-confirm.png" });

  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator(BUTTON_SELECTOR)).toHaveText(`Done: ${fileCount} files deleted`, {
    timeout: 200_000,
  });

  const deletionLog = await page.evaluate(() => window.__deletionLog);
  expect(deletionLog).toHaveLength(fileCount);
  expect(new Set(deletionLog).size).toBe(fileCount);
});
