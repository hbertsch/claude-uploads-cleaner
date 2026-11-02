import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const OBSERVATION_WINDOW_MS = 500;

test("Stop ends the run after the current file and deletes nothing more", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, { fileCount: 1000 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await page.waitForFunction(() => window.__deletionLog.length >= 50);
  await page.getByRole("button", { name: "Stop" }).click();

  const message = page.locator("#uploads-cleaner-message");
  await expect(message).toHaveText(/^Stopped: \d+ files deleted\.$/);
  const shownCount = Number((await message.textContent()).match(/\d+/)[0]);
  const logLengthAtStop = await page.evaluate(() => window.__deletionLog.length);
  expect(logLengthAtStop).toBe(shownCount);
  expect(shownCount).toBeLessThan(1000);

  await page.waitForTimeout(OBSERVATION_WINDOW_MS);
  expect(await page.evaluate(() => window.__deletionLog.length)).toBe(shownCount);
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
});

test("the running view shows count, time, speed and the hint about hidden tabs", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, { fileCount: 1000 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();

  await expect(page.locator("#uploads-cleaner-message")).toHaveText(
    /^Deleting uploaded files\.\.\. \d+ deleted · \d\d:\d\d · \d+\.\d files\/s$/,
  );
  await expect(page.locator("#uploads-cleaner-message")).toHaveAttribute("aria-live", "polite");
  await expect(
    page.getByText("Keep this tab visible. Browsers slow down hidden tabs."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("#uploads-cleaner-message")).toHaveText(/^Stopped:/);
});
