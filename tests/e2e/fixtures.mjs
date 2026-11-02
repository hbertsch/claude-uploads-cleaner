import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test as base, chromium, expect } from "@playwright/test";

const extensionDirectory = path.resolve(process.env.EXTENSION_DIR ?? "src");

export const test = base.extend({
  // Playwright requires a destructured first argument, even when no fixture is used.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const profileDirectory = await mkdtemp(path.join(os.tmpdir(), "uploads-cleaner-profile-"));
    const context = await chromium.launchPersistentContext(profileDirectory, {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${extensionDirectory}`,
        `--load-extension=${extensionDirectory}`,
      ],
    });
    await use(context);
    await context.close();
    await rm(profileDirectory, { recursive: true, force: true });
  },
});

export { expect };
