// Shared by make-screenshots.mjs and make-demo-gif.mjs: a Chromium with the extension loaded and
// generic dummy file names that look like ordinary uploads.
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

export const VIEWPORT = { width: 1280, height: 800 };

const NAME_BASES = [
  "quarterly-report",
  "meeting-notes",
  "invoice",
  "site-photo",
  "budget",
  "draft",
];
const NAME_EXTENSIONS = [".pdf", ".docx", ".png", ".xlsx", ".txt"];

export function generateFileNames(count) {
  return Array.from({ length: count }, (_, index) => {
    const base = NAME_BASES[index % NAME_BASES.length];
    const extension = NAME_EXTENSIONS[index % NAME_EXTENSIONS.length];
    return `${base}-${String(index + 1).padStart(3, "0")}${extension}`;
  });
}

// Returns the browser context with the extension and a function that closes it and removes the
// temporary profile. contextOptions are passed on to Playwright (for example recordVideo).
export async function launchWithExtension(contextOptions = {}) {
  const extensionDirectory = path.resolve(process.env.EXTENSION_DIR ?? "src");
  const profileDirectory = await mkdtemp(path.join(os.tmpdir(), "uploads-cleaner-profile-"));
  const context = await chromium.launchPersistentContext(profileDirectory, {
    channel: "chromium",
    headless: true,
    viewport: VIEWPORT,
    args: [
      `--disable-extensions-except=${extensionDirectory}`,
      `--load-extension=${extensionDirectory}`,
    ],
    ...contextOptions,
  });
  async function close() {
    await context.close();
    await rm(profileDirectory, { recursive: true, force: true });
  }
  return { context, close };
}
