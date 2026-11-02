// Prints the manifest's content scripts as one script that can be pasted into the real page
// (Claude in Chrome javascript_tool). Usage: node scripts/make-inject.mjs > /tmp/inject.js
import { readFileSync } from "node:fs";
import path from "node:path";

const sourceDirectory = "src";
const manifest = JSON.parse(readFileSync(path.join(sourceDirectory, "manifest.json"), "utf8"));
const scriptPaths = manifest.content_scripts.flatMap((entry) => entry.js);
const scriptSources = scriptPaths.map((scriptPath) =>
  readFileSync(path.join(sourceDirectory, scriptPath), "utf8"),
);

console.log(
  [
    "(function () {",
    "if (window.__uploadsCleanerInjected) return;",
    "window.__uploadsCleanerInjected = true;",
    ...scriptSources,
    "})();",
  ].join("\n"),
);
