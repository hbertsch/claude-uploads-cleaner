import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runScript(scriptPath, argumentsList, extraEnvironment = {}) {
  return spawnSync("node", [scriptPath, ...argumentsList], {
    encoding: "utf8",
    env: { ...process.env, ...extraEnvironment },
  });
}

test("changelog-section prints the section of an existing version", () => {
  const result = runScript("scripts/changelog-section.mjs", ["1.0.0"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^### Added/);
  assert.doesNotMatch(result.stdout, /^## \[/m);
});

test("changelog-section exits 1 for a version without a section", () => {
  const result = runScript("scripts/changelog-section.mjs", ["9.9.9"]);
  assert.equal(result.status, 1);
});

test("changelog-section exits 1 without a version argument", () => {
  const result = runScript("scripts/changelog-section.mjs", []);
  assert.equal(result.status, 1);
});

test("check-version exits 1 when the tag does not match the version", () => {
  const result = runScript("scripts/check-version.mjs", [], { GITHUB_REF_NAME: "v9.9.9" });
  assert.equal(result.status, 1);
});
