import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const version = JSON.parse(readFileSync("src/manifest.json", "utf8")).version;

function readManifestFromZip(flavour) {
  const zipPath = `dist/uploads-cleaner-${version}-${flavour}.zip`;
  return JSON.parse(execFileSync("unzip", ["-p", zipPath, "manifest.json"], { encoding: "utf8" }));
}

execFileSync("node", ["scripts/build.mjs"], { stdio: "ignore" });

test("the Firefox zip manifest has the gecko and gecko_android keys", () => {
  const settings = readManifestFromZip("firefox").browser_specific_settings;
  assert.equal(settings.gecko.id, "uploads-cleaner@henningbertsch.com");
  assert.equal(settings.gecko.strict_min_version, "140.0");
  assert.deepEqual(settings.gecko.data_collection_permissions, { required: ["none"] });
  assert.equal(settings.gecko_android.strict_min_version, "142.0");
});

test("the Chrome zip manifest has no browser_specific_settings", () => {
  assert.equal(readManifestFromZip("chrome").browser_specific_settings, undefined);
});
