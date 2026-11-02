// Writes tests/fixtures/pseudo/ from the English fixtures: every text and every aria-label becomes
// a meaningless token (zz-<number>), except file names. A code path that still works on this
// markup cannot depend on any language. Usage: node scripts/make-pseudo-fixture.mjs
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_DIRECTORY = "tests/fixtures/real/en";
const TARGET_DIRECTORY = "tests/fixtures/pseudo";
const DUMMY_NAME = /dummy-\d+\.txt/;

export function pseudoLocalise(html) {
  let tokenNumber = 0;
  const nextToken = () => `zz-${++tokenNumber}`;
  // A text that names a file keeps the name: the code finds the confirm dialog by it.
  const replaceLabel = (label) => {
    const fileName = label.match(DUMMY_NAME)?.[0];
    return fileName ? `${nextToken()} ${fileName}` : nextToken();
  };

  return html
    .replace(/aria-label="([^"]*)"/g, (_, label) => `aria-label="${replaceLabel(label)}"`)
    .replace(/>([^<]+)</g, (match, text) => {
      if (!text.trim()) return match;
      if (DUMMY_NAME.test(text) && text.trim() === text.match(DUMMY_NAME)[0]) return match;
      return `>${replaceLabel(text)}<`;
    });
}

async function main() {
  await mkdir(TARGET_DIRECTORY, { recursive: true });
  for (const fileName of await readdir(SOURCE_DIRECTORY)) {
    const html = await readFile(path.join(SOURCE_DIRECTORY, fileName), "utf8");
    await writeFile(path.join(TARGET_DIRECTORY, fileName), pseudoLocalise(html));
  }
}

await main();
