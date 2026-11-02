// Checks the documentation and the store texts:
// - every relative link and image in README.md, CONTRIBUTING.md, docs/ and store/ points to a file,
// - the manifest description has at most 132 characters and equals the Edge short description,
// - the Firefox summary has at most 250 characters, the Edge long description 250 to 10,000,
// - the store screenshots are exactly 1280 x 800 pixels,
// - the README contains the phrases that must not get lost.
// Usage: node scripts/check-docs.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MANIFEST_DESCRIPTION_MAX_LENGTH = 132;
const FIREFOX_SUMMARY_MAX_LENGTH = 250;
const EDGE_LONG_DESCRIPTION_MIN_LENGTH = 250;
const EDGE_LONG_DESCRIPTION_MAX_LENGTH = 10_000;
const STORE_SCREENSHOT_SIZE = { width: 1280, height: 800 };
const REQUIRED_README_PHRASES = ["Keep this tab visible", "Not affiliated", "Load unpacked"];
// docs/agents holds private planning files that are not published.
const PRIVATE_DIRECTORY = path.join("docs", "agents");

const problems = [];

function listMarkdownFiles(directory) {
  const markdownFiles = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entryPath === PRIVATE_DIRECTORY) continue;
    if (entry.isDirectory()) markdownFiles.push(...listMarkdownFiles(entryPath));
    else if (entry.name.endsWith(".md")) markdownFiles.push(entryPath);
  }
  return markdownFiles;
}

function checkRelativeLinks(markdownPath) {
  const text = readFileSync(markdownPath, "utf8").replace(/^```[\s\S]*?^```/gm, "");
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
    const target = match[1];
    if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    const targetPath = path.join(path.dirname(markdownPath), target.split(/[#?]/)[0]);
    if (!existsSync(targetPath)) problems.push(`${markdownPath}: link target ${target} not found`);
  }
}

// The text under a "## <heading>" line up to the next "## " line.
function readSection(markdownPath, heading) {
  const text = readFileSync(markdownPath, "utf8");
  const match = text.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  if (!match) {
    problems.push(`${markdownPath}: section "${heading}" not found`);
    return "";
  }
  return match[1].trim();
}

function checkLength(label, text, minimum, maximum) {
  const length = [...text].length;
  if (length < minimum || length > maximum) {
    problems.push(`${label} has ${length} characters, expected ${minimum} to ${maximum}`);
  }
}

function readPngSize(pngPath) {
  const header = readFileSync(pngPath);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

const markdownFiles = [
  "README.md",
  "CONTRIBUTING.md",
  ...listMarkdownFiles("docs"),
  ...listMarkdownFiles("store"),
].filter((markdownPath) => existsSync(markdownPath));
for (const markdownPath of markdownFiles) checkRelativeLinks(markdownPath);

const manifestDescription = JSON.parse(readFileSync("src/manifest.json", "utf8")).description;
checkLength("manifest description", manifestDescription, 1, MANIFEST_DESCRIPTION_MAX_LENGTH);
if (readSection("store/edge.md", "Short description") !== manifestDescription) {
  problems.push("store/edge.md: short description differs from the manifest description");
}
checkLength(
  "Firefox summary",
  readSection("store/firefox.md", "Summary"),
  1,
  FIREFOX_SUMMARY_MAX_LENGTH,
);
checkLength(
  "Edge long description",
  readSection("store/edge.md", "Long description"),
  EDGE_LONG_DESCRIPTION_MIN_LENGTH,
  EDGE_LONG_DESCRIPTION_MAX_LENGTH,
);

const screenshotDirectory = path.join("store", "screenshots");
const screenshotNames = readdirSync(screenshotDirectory).filter((name) => name.endsWith(".png"));
if (screenshotNames.length === 0) problems.push(`${screenshotDirectory}: no screenshots`);
for (const name of screenshotNames) {
  const { width, height } = readPngSize(path.join(screenshotDirectory, name));
  if (width !== STORE_SCREENSHOT_SIZE.width || height !== STORE_SCREENSHOT_SIZE.height) {
    problems.push(`${screenshotDirectory}/${name} is ${width}x${height}, expected 1280x800`);
  }
}

const readme = readFileSync("README.md", "utf8");
for (const phrase of REQUIRED_README_PHRASES) {
  if (!readme.includes(phrase)) problems.push(`README.md does not contain "${phrase}"`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Docs check passed (${markdownFiles.length} markdown files).`);
