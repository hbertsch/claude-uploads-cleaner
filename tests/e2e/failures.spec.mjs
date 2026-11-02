import { test, expect } from "./fixtures.mjs";
import { readExtensionConfig } from "./read-config.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const { MAX_RETRIES_PER_FILE } = readExtensionConfig();
const FILE_COUNT = 40;

async function startDeleteAll(page) {
  await page.goto(UPLOADED_FILES_URL);
  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
}

function readDeletionLog(page) {
  return page.evaluate(() => window.__deletionLog);
}

test("a transient failure of 3 attempts is retried and the run completes", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, {
    fileCount: FILE_COUNT,
    failure: { afterDeletes: 10, mode: "ignore", failedAttempts: 3 },
  });
  await startDeleteAll(page);

  await expect(page.locator("#uploads-cleaner-message")).toHaveText(
    new RegExp(`^Done: ${FILE_COUNT} files deleted in \\d\\d:\\d\\d\\.$`),
    { timeout: 30_000 },
  );
  const deletionLog = await readDeletionLog(page);
  expect(deletionLog).toHaveLength(FILE_COUNT);
  expect(new Set(deletionLog).size).toBe(FILE_COUNT);
});

for (const mode of ["ignore", "error-toast"]) {
  test(`a permanent failure (${mode}) stops the run with a message and tries the file ${MAX_RETRIES_PER_FILE + 1} times`, async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);
    const deletionsBeforeFailure = 30;
    await installClaudeMock(context, {
      fileCount: FILE_COUNT,
      failure: { afterDeletes: deletionsBeforeFailure, mode },
    });
    await startDeleteAll(page);

    await expect(page.locator("#uploads-cleaner-message")).toHaveText(
      `Stopped after ${deletionsBeforeFailure} files: claude.ai did not accept further deletions. Wait a few minutes and run again.`,
      { timeout: 30_000 },
    );
    expect(await readDeletionLog(page)).toHaveLength(deletionsBeforeFailure);
    const failingFile = "dummy-" + String(deletionsBeforeFailure + 1).padStart(3, "0") + ".txt";
    const confirmAttempts = await page.evaluate(() => window.__confirmAttempts);
    expect(confirmAttempts[failingFile]).toBe(MAX_RETRIES_PER_FILE + 1);
    await expect(page.locator("#uploads-cleaner-button")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  });
}

test("a file that leaves late is counted once and nothing is skipped or deleted twice", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, {
    fileCount: FILE_COUNT,
    failure: { afterDeletes: 10, mode: "late", failedAttempts: 2 },
  });
  await startDeleteAll(page);

  const message = page.locator("#uploads-cleaner-message");
  await expect(message).toHaveText(
    new RegExp(`^Done: ${FILE_COUNT} files deleted in \\d\\d:\\d\\d\\.$`),
    { timeout: 30_000 },
  );
  const deletionLog = await readDeletionLog(page);
  expect(deletionLog).toHaveLength(FILE_COUNT);
  expect(new Set(deletionLog).size).toBe(FILE_COUNT);
  const confirmAttempts = await page.evaluate(() => window.__confirmAttempts);
  expect(Object.values(confirmAttempts).every((attempts) => attempts === 1)).toBe(true);
});

test("leaving the route mid-run ends the run with the Stopped summary", async ({
  context,
  page,
}) => {
  test.setTimeout(60_000);
  await installClaudeMock(context, { fileCount: 1000 });
  await startDeleteAll(page);

  await page.waitForFunction(() => window.__deletionLog.length >= 20);
  await page.evaluate(() => {
    location.hash = "#";
  });

  const message = page.locator("#uploads-cleaner-message");
  await expect(message).toHaveText(/^Stopped: \d+ files deleted\.$/);
  const shownCount = Number((await message.textContent()).match(/\d+/)[0]);
  await page.waitForTimeout(500);
  expect(await readDeletionLog(page)).toHaveLength(shownCount);
  expect(shownCount).toBeLessThan(1000);
});
