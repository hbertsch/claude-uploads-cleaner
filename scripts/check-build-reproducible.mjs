// Builds twice and fails if any zip differs between the two builds.
// Usage: node scripts/check-build-reproducible.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function buildAndHashZips() {
  execFileSync("node", ["scripts/build.mjs"], { stdio: "ignore" });
  const zipNames = readdirSync("dist")
    .filter((name) => name.endsWith(".zip"))
    .sort();
  return zipNames.map((zipName) => {
    const content = readFileSync(path.join("dist", zipName));
    return `${createHash("sha256").update(content).digest("hex")}  ${zipName}`;
  });
}

const firstBuild = buildAndHashZips();
const secondBuild = buildAndHashZips();

console.log(firstBuild.join("\n"));
if (firstBuild.length !== 2 || firstBuild.join("\n") !== secondBuild.join("\n")) {
  console.error("The two builds differ:\n" + secondBuild.join("\n"));
  process.exit(1);
}
console.log("Both builds are identical.");
