// Writes the README problem image and the store screenshots from the mock page with generic dummy file
// names. Usage: npm run screenshots (or node scripts/make-screenshots.mjs)
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { installClaudeMock, UPLOADED_FILES_URL } from "../tests/mock/claude-mock.mjs";
import { VIEWPORT, generateFileNames, launchWithExtension } from "./mock-browser.mjs";

const README_IMAGE_DIRECTORY = "docs/images";
const STORE_SCREENSHOT_DIRECTORY = "store/screenshots";
const README_IMAGE_MAX_HEIGHT = 440;
// Slow enough to catch the running view, close to the 0.115 s per file measured on the real page.
const RUNNING_DELETE_LATENCY_MS = 100;
const MOCK_OPTIONS = { fileNames: generateFileNames(120), styled: true };
const DIALOG_SELECTOR = '[role="dialog"]';
const BUTTON_SELECTOR = "#uploads-cleaner-button";
const MESSAGE_SELECTOR = "#uploads-cleaner-message";

// The dialog from its top edge, at most README_IMAGE_MAX_HEIGHT pixels tall.
async function saveDialogImage(page, fileName) {
  const box = await page.locator(DIALOG_SELECTOR).boundingBox();
  await page.screenshot({
    path: `${README_IMAGE_DIRECTORY}/${fileName}`,
    clip: { ...box, height: Math.min(box.height, README_IMAGE_MAX_HEIGHT) },
  });
}

async function saveStoreScreenshot(page, fileName) {
  await page.screenshot({ path: `${STORE_SCREENSHOT_DIRECTORY}/${fileName}` });
}

async function captureProblemList() {
  const browser = await chromium.launch({ channel: "chromium" });
  const context = await browser.newContext({ viewport: VIEWPORT });
  await installClaudeMock(context, MOCK_OPTIONS);
  const page = await context.newPage();
  await page.goto(UPLOADED_FILES_URL);
  await page.locator(DIALOG_SELECTOR).waitFor();
  await saveDialogImage(page, "problem-list.png");
  await browser.close();
}

async function captureButtonConfirmAndRunning() {
  const { context, close } = await launchWithExtension();
  await installClaudeMock(context, {
    ...MOCK_OPTIONS,
    deleteLatencyMs: RUNNING_DELETE_LATENCY_MS,
  });
  const page = await context.newPage();
  await page.goto(UPLOADED_FILES_URL);

  await page.locator(BUTTON_SELECTOR).waitFor();
  await saveStoreScreenshot(page, "01-button.png");

  await page.locator(BUTTON_SELECTOR).click();
  await page.getByRole("button", { name: "Yes, delete everything" }).waitFor();
  await saveStoreScreenshot(page, "02-confirm.png");

  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await page.waitForFunction(
    (selector) =>
      /deleted/.test(document.querySelector(selector)?.textContent) &&
      Number(document.querySelector(selector).textContent.match(/(\d+) deleted/)?.[1]) >= 8,
    MESSAGE_SELECTOR,
  );
  await saveStoreScreenshot(page, "03-running.png");
  await close();
}

await mkdir(README_IMAGE_DIRECTORY, { recursive: true });
await mkdir(STORE_SCREENSHOT_DIRECTORY, { recursive: true });
await captureProblemList();
await captureButtonConfirmAndRunning();
console.log("Screenshots written to docs/images and store/screenshots.");
