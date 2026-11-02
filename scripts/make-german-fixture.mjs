// Writes tests/fixtures/real/de/ from the English fixtures by translating only the visible
// labels. The claude.ai account has no interface language setting (the only "Language" setting is
// the voice language), so the German page could not be captured. Replace the output with a real
// capture as soon as one is possible. Usage: node scripts/make-german-fixture.mjs
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_DIRECTORY = "tests/fixtures/real/en";
const TARGET_DIRECTORY = "tests/fixtures/real/de";

const TEXT_TRANSLATIONS = new Map([
  ["Uploaded files", "Hochgeladene Dateien"],
  [
    "Deleting a file removes it from storage. Text already extracted into a chat isn’t removed. To fully remove it, delete the chat.",
    "Beim Löschen einer Datei wird sie aus dem Speicher entfernt. Bereits in einen Chat übernommener Text bleibt erhalten. Lösche den Chat, um ihn vollständig zu entfernen.",
  ],
  ["Name", "Name"],
  ["Uploaded", "Hochgeladen"],
  ["Surface", "Oberfläche"],
  ["Location", "Ort"],
  ["Delete", "Löschen"],
  ["Chat", "Chat"],
  ["1 chat", "1 Chat"],
  ["Nov 2, 2026", "02.11.2026"],
  ["Load more", "Mehr laden"],
  ["No uploaded files found", "Keine hochgeladenen Dateien gefunden"],
  ["Cancel", "Abbrechen"],
]);

function translateText(text) {
  const fileName = text.match(/dummy-\d+\.txt/)?.[0];
  if (text.startsWith("Delete ") && text.endsWith("?")) return `${fileName} löschen?`;
  return TEXT_TRANSLATIONS.get(text) ?? text;
}

function translateAriaLabel(label) {
  const fileName = label.match(/dummy-\d+\.txt/)?.[0];
  if (label.startsWith("Show chats for ")) return `Chats für ${fileName} anzeigen`;
  if (label.startsWith("Delete ")) return `${fileName} löschen`;
  if (label === "Uploaded files") return "Hochgeladene Dateien";
  if (label === "Expand") return "Erweitern";
  return label;
}

async function main() {
  await mkdir(TARGET_DIRECTORY, { recursive: true });
  for (const fileName of await readdir(SOURCE_DIRECTORY)) {
    const html = await readFile(path.join(SOURCE_DIRECTORY, fileName), "utf8");
    const translated = html
      .replace(/aria-label="([^"]*)"/g, (_, label) => `aria-label="${translateAriaLabel(label)}"`)
      .replace(/>([^<]+)</g, (_, text) => `>${translateText(text)}<`);
    await writeFile(path.join(TARGET_DIRECTORY, fileName), translated);
  }
}

await main();
