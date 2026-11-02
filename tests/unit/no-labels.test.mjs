import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const FIXTURE_DIRECTORY = "tests/fixtures/real/en";
const LOGIC_FILES = ["src/content/page.js", "src/content/runner.js"];
// Shorter labels such as "B" or "Name" would match unrelated literals by accident.
const MIN_LABEL_LENGTH_FOR_CONTAINS_CHECK = 5;

function extractVisibleTexts(html) {
  return html
    .split(/<[^>]*>/)
    .map((text) => text.trim())
    .filter(Boolean);
}

function extractAriaLabels(html) {
  return [...html.matchAll(/aria-label="([^"]*)"/g)].map((match) => match[1]).filter(Boolean);
}

function extractLabelsFromFixtures() {
  const labels = new Set();
  for (const fileName of readdirSync(FIXTURE_DIRECTORY)) {
    const html = readFileSync(path.join(FIXTURE_DIRECTORY, fileName), "utf8");
    for (const label of [...extractVisibleTexts(html), ...extractAriaLabels(html)]) {
      labels.add(label);
    }
  }
  return [...labels];
}

function extractStringLiterals(source) {
  return [
    ...source.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g),
  ].map((match) => match[1] ?? match[2] ?? match[3]);
}

test("the captured page yields labels to check against", () => {
  const labels = extractLabelsFromFixtures();
  assert.ok(labels.includes("Load more"));
  assert.ok(labels.includes("Cancel"));
  assert.ok(labels.includes("Uploaded files"));
});

for (const logicFile of LOGIC_FILES) {
  test(`${logicFile} contains no claude.ai label as a string literal`, () => {
    const labels = extractLabelsFromFixtures().map((label) => label.toLowerCase());
    const literals = extractStringLiterals(readFileSync(logicFile, "utf8")).map((literal) =>
      literal.toLowerCase(),
    );
    for (const literal of literals) {
      for (const label of labels) {
        const isSame = literal === label;
        const containsLabel =
          label.length >= MIN_LABEL_LENGTH_FOR_CONTAINS_CHECK && literal.includes(label);
        assert.ok(
          !isSame && !containsLabel,
          `${logicFile}: literal "${literal}" matches "${label}"`,
        );
      }
    }
  });
}
