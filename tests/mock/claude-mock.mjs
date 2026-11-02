import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const UPLOADED_FILES_URL =
  "https://claude.ai/new#settings/data-privacy-controls/uploaded-files";
export const TEST_DELETE_LATENCY_MS = 5;
// Measured on the real page, see docs/dom-notes.md.
export const REAL_PAGE_SIZE = 50;
// Time after the last deletion of a page until "Load more" yields rows again (one measurement).
// Pass it as loadMoreSettleMs to simulate the race.
export const REAL_LOAD_MORE_SETTLE_MS = 2283;

const FIXTURES_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");
const FIXTURE_DIRECTORY_BY_LOCALE = {
  en: "real/en",
  de: "real/de",
  pseudo: "pseudo",
};

function readFixture(locale, fileName) {
  return readFileSync(
    path.join(FIXTURES_ROOT, FIXTURE_DIRECTORY_BY_LOCALE[locale], fileName),
    "utf8",
  );
}

// Serves a stand-in for claude.ai's "Uploaded files" settings panel. Its markup is the DOM
// captured from the real page (tests/fixtures/real/en, see docs/dom-notes.md for the other
// locales): the first row of panel-with-rows.html is the template of every row,
// confirm-dialog.html is the template of the confirm dialog.
// locale: "en" | "de" | "pseudo" selects the fixture set.
// fileCount 0 renders the empty-state panel.
// loadMoreSettleMs: a "Load more" click less than this long after a deletion adds no rows (the
// real page does that after a page end). 0 switches the race off.
// failure: { afterDeletes, mode, failedAttempts } makes the next failedAttempts confirm clicks fail
// once afterDeletes files are gone (invented behaviour, no real error response was ever observed):
//   "ignore": the dialog stays open and nothing happens;
//   "error-toast": the dialog closes, an error toast appears and the row stays;
//   "late": the dialog closes and the row leaves only after lateRemovalMs.
// window.__confirmAttempts counts the confirm clicks per file name.
// breakLayout: "remove-trash-buttons" | "rename-table" makes the panel look like an unknown layout.
export async function installClaudeMock(
  context,
  {
    fileCount = 120,
    pageSize = REAL_PAGE_SIZE,
    deleteLatencyMs = TEST_DELETE_LATENCY_MS,
    panelRenderDelayMs = 0,
    loadMoreSettleMs = 0,
    locale = "en",
    breakLayout = null,
    failure = null,
    lateRemovalMs = 700,
  } = {},
) {
  const settings = JSON.stringify({
    fileCount,
    pageSize,
    deleteLatencyMs,
    panelRenderDelayMs,
    loadMoreSettleMs,
    breakLayout,
    failure,
    lateRemovalMs,
    panelHtml: readFixture(locale, fileCount === 0 ? "panel-empty.html" : "panel-with-rows.html"),
    confirmDialogHtml: readFixture(locale, "confirm-dialog.html"),
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
  window.__confirmAttempts = {};
  let injectedFailureCount = 0;
  let lastDeletionTime = -Infinity;

  function parseHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstElementChild;
  }

  function renderPanel() {
    const panel = parseHtml(settings.panelHtml);
    if (settings.fileCount === 0) return showPanel(panel);
    const tbody = panel.querySelector("tbody");
    const rowHtml = tbody.querySelector("tr").outerHTML;
    tbody.replaceChildren();
    const loadMoreButton = [...panel.querySelectorAll("button")].find(
      (button) => !panel.querySelector("table").contains(button),
    );
    loadMoreButton.addEventListener("click", () => {
      if (Date.now() - lastDeletionTime < settings.loadMoreSettleMs) return;
      appendNextPage();
    });

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

    showPanel(panel);
    appendNextPage();
    if (settings.breakLayout) breakLayout(panel);
  }

  function showPanel(panel) {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.append(panel);
    document.body.append(dialog);
  }

  function breakLayout(panel) {
    if (settings.breakLayout === "remove-trash-buttons") {
      for (const row of panel.querySelectorAll("tbody > tr")) [...row.querySelectorAll("button")].pop().remove();
    } else if (settings.breakLayout === "rename-table") {
      for (const element of panel.querySelectorAll("table, thead, tbody, tr, td, th")) {
        const replacement = document.createElement("div");
        replacement.append(...element.childNodes);
        element.replaceWith(replacement);
      }
    }
  }

  function showErrorToast() {
    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.textContent = "Something went wrong";
    document.body.append(toast);
    setTimeout(() => toast.remove(), 1000);
  }

  function openConfirmDialog(row, name) {
    const confirmDialog = parseHtml(settings.confirmDialogHtml.replaceAll(TEMPLATE_NAME, name));
    const [cancelButton, deleteButton] = confirmDialog.querySelectorAll("button");
    cancelButton.addEventListener("click", () => confirmDialog.remove());
    deleteButton.addEventListener("click", () => {
      window.__confirmAttempts[name] = (window.__confirmAttempts[name] ?? 0) + 1;
      const failure = settings.failure;
      const shouldFail =
        failure &&
        window.__deletionLog.length >= failure.afterDeletes &&
        injectedFailureCount < (failure.failedAttempts ?? Infinity);
      if (shouldFail) injectedFailureCount++;
      if (shouldFail && failure.mode === "ignore") return;
      confirmDialog.remove();
      if (shouldFail && failure.mode === "error-toast") {
        showErrorToast();
        return;
      }
      const delay = shouldFail && failure.mode === "late" ? settings.lateRemovalMs : settings.deleteLatencyMs;
      setTimeout(() => {
        row.remove();
        window.__deletionLog.push(name);
        lastDeletionTime = Date.now();
      }, delay);
    });
    document.body.append(confirmDialog);
  }

  setTimeout(renderPanel, settings.panelRenderDelayMs);
</script>
</body>
</html>`;
