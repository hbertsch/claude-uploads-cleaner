// Builds dist/uploads-cleaner-<version>-chrome.zip (Chrome, Brave, Edge) and -firefox.zip.
// The zips are reproducible: file times are fixed to the commit date of HEAD, files are
// added in sorted order and the system `zip` tool writes them. Usage: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import { chmod, cp, mkdir, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import path from "node:path";

const fallbackBuildDate = "2026-01-01T00:00:00Z";

const FIREFOX_SETTINGS = {
  gecko: {
    id: "uploads-cleaner@henningbertsch.com",
    strict_min_version: "140.0",
    data_collection_permissions: { required: ["none"] },
  },
  gecko_android: { strict_min_version: "142.0" },
};

function readBuildDate() {
  try {
    const commitDate = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return new Date(commitDate);
  } catch {
    return new Date(fallbackBuildDate);
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  const filePaths = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)));
  return filePaths.sort();
}

async function setFixedModeAndTime(directory, filePaths, buildDate) {
  for (const filePath of filePaths) {
    await chmod(path.join(directory, filePath), 0o644);
    await utimes(path.join(directory, filePath), buildDate, buildDate);
  }
}

async function buildFlavour(flavour, manifest, buildDate) {
  const flavourDirectory = path.join("dist", flavour);
  await cp("src", flavourDirectory, { recursive: true });
  await writeFile(
    path.join(flavourDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const filePaths = await listFiles(flavourDirectory);
  await setFixedModeAndTime(flavourDirectory, filePaths, buildDate);

  const zipName = `uploads-cleaner-${manifest.version}-${flavour}.zip`;
  const zipPath = path.resolve("dist", zipName);
  // zip stores local file times, so the time zone is fixed; -X drops extra file attributes and
  // -D omits directory entries, which makes the archive depend only on names, content and times.
  execFileSync("zip", ["-q", "-X", "-D", zipPath, "-@"], {
    cwd: flavourDirectory,
    input: `${filePaths.join("\n")}\n`,
    env: { ...process.env, TZ: "UTC" },
  });
  console.log(`dist/${zipName}`);
}

const chromeManifest = JSON.parse(await readFile("src/manifest.json", "utf8"));
const firefoxManifest = { ...chromeManifest, browser_specific_settings: FIREFOX_SETTINGS };
const buildDate = readBuildDate();

await rm("dist", { recursive: true, force: true });
await mkdir("dist");
await buildFlavour("chrome", chromeManifest, buildDate);
await buildFlavour("firefox", firefoxManifest, buildDate);
