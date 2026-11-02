// Prints the CHANGELOG.md section of one version (used as release notes); exits 1 if it is missing.
// Usage: node scripts/changelog-section.mjs <version>
import { readFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/changelog-section.mjs <version>");
  process.exit(1);
}

const lines = readFileSync("CHANGELOG.md", "utf8").split("\n");
const headingStart = `## [${version}]`;
const startIndex = lines.findIndex((line) => line.startsWith(headingStart));
if (startIndex === -1) {
  console.error(`CHANGELOG.md has no section for version ${version}.`);
  process.exit(1);
}

const sectionLines = [];
for (const line of lines.slice(startIndex + 1)) {
  if (line.startsWith("## [")) {
    break;
  }
  sectionLines.push(line);
}
console.log(sectionLines.join("\n").trim());
