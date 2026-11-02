import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const UPLOADED_FILES_URL =
  "https://claude.ai/new#settings/data-privacy-controls/uploaded-files";
export const TEST_DELETE_LATENCY_MS = 5;
// Measured on the real page, see docs/dom-notes.md.
export const REAL_PAGE_SIZE = 50;
// Time after the last deletion of a page until "Load more" yields rows again (one measurement).
// The mock starts to simulate it in Phase 5.
export const REAL_LOAD_MORE_SETTLE_MS = 2283;

const FIXTURE_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/real/en",
);

function readFixture(fileName) {
  return readFileSync(path.join(FIXTURE_DIRECTORY, fileName), "utf8");
}

// Serves a stand-in for claude.ai's "Uploaded files" settings panel. Its markup is the DOM
// captured from the real page (tests/fixtures/real/en): the first row of panel-with-rows.html is
// the template of every row, confirm-dialog.html is the template of the confirm dialog.
export async function installClaudeMock(
  context,
  {
    fileCount = 120,
    pageSize = REAL_PAGE_SIZE,
    deleteLatencyMs = TEST_DELETE_LATENCY_MS,
    panelRenderDelayMs = 0,
  } = {},
) {
  const settings = JSON.stringify({
    fileCount,
    pageSize,
    deleteLatencyMs,
    panelRenderDelayMs,
    panelHtml: readFixture("panel-with-rows.html"),
    confirmDialogHtml: readFixture("confirm-dialog.html"),
  });
  await context.route("https://claude.ai/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: MOCK_PAGE.replace("__SETTINGS__", () => settings.replaceAll("</", "<\\/")),
    }),
  );
}

const MOCK_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>mock</title>
<style>
  body { font-family: sans-serif; background: #1f1e1d; color: #eee }
  [role="dialog"] { padding: 16px }
  [role="alertdialog"] { position: fixed; top: 40%; left: 40%; padding: 16px; background: #333 }
  td, th { text-align: left; padding: 4px 12px }
</style>
</head>
<body>
<script>
  const settings = __SETTINGS__;
  const TEMPLATE_NAME = "dummy-001.txt";
  const pendingNames = Array.from(
    { length: settings.fileCount },
    (_, index) => "dummy-" + String(index + 1).padStart(3, "0") + ".txt",
  );
  window.__deletionLog = [];

  function parseHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstElementChild;
  }

  function renderPanel() {
    const panel = parseHtml(settings.panelHtml);
    const tbody = panel.querySelector("tbody");
    const rowHtml = tbody.querySelector("tr").outerHTML;
    tbody.replaceChildren();
    const loadMoreButton = [...panel.querySelectorAll("button")].find(
      (button) => !panel.querySelector("table").contains(button),
    );
    loadMoreButton.addEventListener("click", () => appendNextPage());

    function appendNextPage() {
      for (const name of pendingNames.splice(0, settings.pageSize)) {
        const row = parseHtml("<table><tbody>" + rowHtml.replaceAll(TEMPLATE_NAME, name) + "</tbody></table>")
          .querySelector("tr");
        const trashButton = [...row.querySelectorAll("button")].pop();
        trashButton.addEventListener("click", () => openConfirmDialog(row, name));
        tbody.append(row);
      }
      if (pendingNames.length === 0) loadMoreButton.remove();
    }

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.append(panel);
    document.body.append(dialog);
    appendNextPage();
  }

  function openConfirmDialog(row, name) {
    const confirmDialog = parseHtml(settings.confirmDialogHtml.replaceAll(TEMPLATE_NAME, name));
    const [cancelButton, deleteButton] = confirmDialog.querySelectorAll("button");
    cancelButton.addEventListener("click", () => confirmDialog.remove());
    deleteButton.addEventListener("click", () => {
      confirmDialog.remove();
      setTimeout(() => {
        row.remove();
        window.__deletionLog.push(name);
      }, settings.deleteLatencyMs);
    });
    document.body.append(confirmDialog);
  }

  setTimeout(renderPanel, settings.panelRenderDelayMs);
</script>
</body>
</html>`;
