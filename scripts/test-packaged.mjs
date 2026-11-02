// Builds the zips, unzips the Chrome zip into a fresh temporary directory and runs the start and
// 120-file delete tests against that directory. Usage: node scripts/test-packaged.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

execFileSync("node", ["scripts/build.mjs"], { stdio: "inherit" });

const version = JSON.parse(readFileSync("src/manifest.json", "utf8")).version;
const unzipDirectory = await mkdtemp(path.join(os.tmpdir(), "uploads-cleaner-packaged-"));
try {
  execFileSync("unzip", ["-q", `dist/uploads-cleaner-${version}-chrome.zip`, "-d", unzipDirectory]);
  execFileSync("npx", ["playwright", "test", "start.spec.mjs", "packaged.spec.mjs"], {
    stdio: "inherit",
    env: { ...process.env, EXTENSION_DIR: unzipDirectory },
  });
} finally {
  await rm(unzipDirectory, { recursive: true, force: true });
}
