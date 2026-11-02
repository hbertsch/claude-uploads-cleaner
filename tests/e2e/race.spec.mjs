import { test, expect } from "./fixtures.mjs";
import {
  installClaudeMock,
  REAL_LOAD_MORE_SETTLE_MS,
  UPLOADED_FILES_URL,
} from "../mock/claude-mock.mjs";

const FILE_COUNT = 120;
const PAGE_SIZE = 50;

test("a 'Load more' right after a page end that yields nothing does not end the run early", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, {
    fileCount: FILE_COUNT,
    pageSize: PAGE_SIZE,
    loadMoreSettleMs: REAL_LOAD_MORE_SETTLE_MS,
  });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#uploads-cleaner-message")).toHaveText(
    new RegExp(`^Done: ${FILE_COUNT} files deleted in \\d\\d:\\d\\d\\.$`),
    { timeout: 30_000 },
  );

  const deletionLog = await page.evaluate(() => window.__deletionLog);
  expect(deletionLog).toHaveLength(FILE_COUNT);
  expect(new Set(deletionLog).size).toBe(FILE_COUNT);
});
