import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

// Runs only through `npm run test:packaged`, which points EXTENSION_DIR at the unzipped Chrome zip.
const packagedDirectory = process.env.EXTENSION_DIR;
test.skip(!packagedDirectory, "EXTENSION_DIR is not set: not testing a packaged extension");

test("the unzipped Chrome zip has the manifest, the icons and no Firefox keys", () => {
  const manifest = JSON.parse(readFileSync(path.join(packagedDirectory, "manifest.json"), "utf8"));
  expect(manifest.browser_specific_settings).toBeUndefined();
  expect(manifest.permissions).toBeUndefined();
  for (const iconPath of Object.values(manifest.icons)) {
    expect(existsSync(path.join(packagedDirectory, iconPath))).toBe(true);
  }
});

test("the packaged extension deletes all files of a 120-file mock", async ({ context, page }) => {
  test.setTimeout(60_000);
  const fileCount = 120;
  await installClaudeMock(context, { fileCount, pageSize: 50 });
  await page.goto(UPLOADED_FILES_URL);

  await page.locator("#uploads-cleaner-button").click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#uploads-cleaner-message")).toHaveText(/^Done: 120 files deleted/, {
    timeout: 30_000,
  });
});
