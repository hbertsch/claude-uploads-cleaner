// Runs in the real claude.ai page (Claude in Chrome javascript_tool), never in the extension.
// Run with a leading "await". The two arguments at the end are the kind ("panel" or "confirm")
// and the number of rows to keep in a panel capture (the mock clones the first row anyway).
// Captures a scrubbed copy of the "Uploaded files" panel (kind "panel") or of the confirm dialog
// that is open after one trash click (kind "confirm"). The sidebar and settings navigation are
// never part of the capture. The result stays in window.__capture; read it chunk by chunk.
await (async (kind = "panel", rowLimit = 3) => {
  const MAX_CHUNK_LENGTH = 8000;
  const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  // Classes are removed on purpose: they are 90% of the size and must never be relied on.
  const REMOVED_ATTRIBUTES = [
    "class",
    "href",
    "src",
    "srcset",
    "id",
    "style",
    "for",
    "name",
    "value",
  ];

  const table = document.querySelector("table[aria-label]");
  const realNames = [...(table?.querySelectorAll("tbody > tr") ?? [])].map(
    (row) => row.querySelector("span[title]")?.getAttribute("title") ?? "",
  );
  const dummyNameFor = (index) => `dummy-${String(index + 1).padStart(3, "0")}.txt`;
  const scrubText = (text) => {
    let scrubbed = text.replace(UUID_PATTERN, "");
    realNames.forEach((realName, index) => {
      if (realName) scrubbed = scrubbed.split(realName).join(dummyNameFor(index));
    });
    return scrubbed;
  };

  let root;
  if (kind === "panel") {
    // Without a table (empty list) the panel is the innermost scroll area that holds the heading.
    root = table
      ? table.closest("div[class*='overflow']")
      : [...document.querySelectorAll("[role='dialog'] div[class*='overflow']")]
          .filter((area) => area.querySelector("h2"))
          .pop();
  } else {
    root = [...document.querySelectorAll("[role='dialog'], [role='alertdialog']")]
      .filter((dialog) => !table || !dialog.contains(table))
      .pop();
  }
  if (!root) return { error: `no element found for kind ${kind}` };

  const clone = root.cloneNode(true);
  if (kind === "panel") {
    clone.querySelectorAll("tbody > tr").forEach((row, index) => {
      if (index >= rowLimit) row.remove();
    });
  }
  for (const element of [clone, ...clone.querySelectorAll("*")]) {
    for (const attribute of [...element.attributes]) {
      const mustRemove =
        attribute.name.startsWith("data-") ||
        REMOVED_ATTRIBUTES.includes(attribute.name) ||
        attribute.name.startsWith("aria-labelledby") ||
        attribute.name.startsWith("aria-describedby") ||
        attribute.name.startsWith("aria-controls");
      if (mustRemove) element.removeAttribute(attribute.name);
      else element.setAttribute(attribute.name, scrubText(attribute.value));
    }
  }
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  while (walker.nextNode())
    walker.currentNode.textContent = scrubText(walker.currentNode.textContent);

  const html = clone.outerHTML;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(html));
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const chunks = [];
  for (let start = 0; start < html.length; start += MAX_CHUNK_LENGTH) {
    chunks.push(html.slice(start, start + MAX_CHUNK_LENGTH));
  }
  window.__capture = { chunks, hash };
  // The tool output filter blocks long hex strings, so the hash is returned in groups of 8.
  return {
    kind,
    hashGroups: hash.match(/.{8}/g).join(" "),
    characterCount: html.length,
    chunkCount: chunks.length,
  };
})("panel", 2);
