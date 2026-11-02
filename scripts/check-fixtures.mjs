// Allow-list check for captured page fixtures: only dummy data may be committed.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DUMMY_NAME = /^dummy-\d+\.txt$/;
const FILE_NAME_LIKE =
  /[\w-]+\.(?:txt|pdf|png|jpe?g|gif|docx?|xlsx?|pptx?|csv|md|zip|json|html?)\b/gi;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const TITLE_ATTRIBUTE = /\btitle="([^"]*)"/g;

export function findViolations(html) {
  const violations = [];
  for (const [, title] of html.matchAll(TITLE_ATTRIBUTE)) {
    if (!DUMMY_NAME.test(title)) violations.push(`title is not a dummy name: ${title}`);
  }
  for (const [fileName] of html.matchAll(FILE_NAME_LIKE)) {
    if (!DUMMY_NAME.test(fileName)) violations.push(`file name is not a dummy name: ${fileName}`);
  }
  if (UUID.test(html)) violations.push("contains a UUID");
  if (html.includes("@")) violations.push("contains an @ sign");
  if (/https?:\/\//i.test(html)) violations.push("contains an http URL");
  if (/\bdata-[\w-]+/.test(html)) violations.push("contains a data- attribute");
  return violations;
}

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listHtmlFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
}

async function main() {
  const directory = process.argv[2] ?? "tests/fixtures";
  const files = await listHtmlFiles(directory);
  let failed = false;
  for (const file of files) {
    const violations = findViolations(await readFile(file, "utf8"));
    for (const violation of violations) console.error(`${file}: ${violation}`);
    if (violations.length > 0) failed = true;
  }
  console.log(`checked ${files.length} fixture files`);
  if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
