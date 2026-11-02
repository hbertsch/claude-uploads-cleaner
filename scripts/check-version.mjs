// Fails unless package.json, src/manifest.json and the first versioned CHANGELOG.md heading agree,
// and, when GITHUB_REF_NAME is a version tag, unless the tag equals v<version>.
// Usage: node scripts/check-version.mjs
import { readFileSync } from "node:fs";

const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const manifestVersion = JSON.parse(readFileSync("src/manifest.json", "utf8")).version;
const changelogHeading = readFileSync("CHANGELOG.md", "utf8").match(/^## \[(\d+\.\d+\.\d+)\]/m);
const changelogVersion = changelogHeading ? changelogHeading[1] : undefined;

const problems = [];
if (manifestVersion !== packageVersion) {
  problems.push(`src/manifest.json has ${manifestVersion}, package.json has ${packageVersion}`);
}
if (changelogVersion !== packageVersion) {
  problems.push(
    `CHANGELOG.md has ${changelogVersion ?? "no versioned heading"}, package.json has ${packageVersion}`,
  );
}
const referenceName = process.env.GITHUB_REF_NAME;
if (referenceName?.startsWith("v") && referenceName !== `v${packageVersion}`) {
  problems.push(`tag ${referenceName} does not match version ${packageVersion}`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Version ${packageVersion} is consistent.`);
