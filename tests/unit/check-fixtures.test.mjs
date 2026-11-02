import assert from "node:assert/strict";
import test from "node:test";
import { findViolations } from "../../scripts/check-fixtures.mjs";

test("dummy data passes", () => {
  const html = '<span title="dummy-001.txt">dummy-001.txt</span><span>9 B</span>';
  assert.deepEqual(findViolations(html), []);
});

test("real-looking file name, UUID, mail address, URL and data attribute fail", () => {
  const html =
    '<span title="Annual report.pdf">x</span> notes.docx 123e4567-e89b-12d3-a456-426614174000 ' +
    'me@example.com https://example.com <i data-id="1"></i>';
  assert.equal(findViolations(html).length, 7);
});
