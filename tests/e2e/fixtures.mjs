import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test as base, chromium, expect } from "@playwright/test";

const extensionDirectory = path.resolve(process.env.EXTENSION_DIR ?? "src");
// Set to the path of an installed browser to run the tests in it instead of Playwright's Chromium.
// Installed Chrome ignores --load-extension, so there the extension is loaded over the DevTools
// protocol (Extensions.loadUnpacked).
const browserExecutable = process.env.BROWSER_EXECUTABLE;

export const test = base.extend({
  // Playwright requires a destructured first argument, even when no fixture is used.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const profileDirectory = await mkdtemp(path.join(os.tmpdir(), "uploads-cleaner-profile-"));
    const context = await chromium.launchPersistentContext(profileDirectory, {
      ...(browserExecutable ? { executablePath: browserExecutable } : { channel: "chromium" }),
      headless: true,
      ...(browserExecutable ? { ignoreDefaultArgs: ["--disable-extensions"] } : {}),
      args: browserExecutable
        ? ["--enable-unsafe-extension-debugging"]
        : [
            `--disable-extensions-except=${extensionDirectory}`,
            `--load-extension=${extensionDirectory}`,
          ],
    });
    if (browserExecutable) {
      const browserSession = await context.browser().newBrowserCDPSession();
      await browserSession.send("Extensions.loadUnpacked", { path: extensionDirectory });
    }
    await use(context);
    await context.close();
    await rm(profileDirectory, { recursive: true, force: true });
  },
});

export { expect };
