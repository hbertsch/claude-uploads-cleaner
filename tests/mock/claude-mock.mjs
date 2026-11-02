export const UPLOADED_FILES_URL =
  "https://claude.ai/new#settings/data-privacy-controls/uploaded-files";
export const TEST_DELETE_LATENCY_MS = 5;

// Serves a hand-written stand-in for claude.ai's "Uploaded files" settings panel.
// Phase 2 replaces its markup by DOM captured from the real page.
export async function installClaudeMock(
  context,
  {
    fileCount = 120,
    pageSize = 50,
    deleteLatencyMs = TEST_DELETE_LATENCY_MS,
    panelRenderDelayMs = 0,
  } = {},
) {
  const settings = JSON.stringify({ fileCount, pageSize, deleteLatencyMs, panelRenderDelayMs });
  await context.route("https://claude.ai/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: MOCK_PAGE.replace("__SETTINGS__", settings),
    }),
  );
}

const MOCK_PAGE = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>mock</title></head>
<body style="font-family: sans-serif; background: #1f1e1d; color: #eee">
<script>
  const settings = __SETTINGS__;
  const pendingNames = Array.from(
    { length: settings.fileCount },
    (_, index) => "dummy-" + String(index + 1).padStart(3, "0") + ".txt",
  );
  window.__deletionLog = [];

  function renderPanel() {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.style.cssText = "display: flex; flex-direction: column; padding: 16px";

    const heading = document.createElement("h2");
    heading.textContent = "Uploaded files";
    const list = document.createElement("div");
    const loadMoreButton = document.createElement("button");
    loadMoreButton.textContent = "Load more";
    loadMoreButton.addEventListener("click", () => appendNextPage(list, loadMoreButton));

    dialog.append(heading, list, loadMoreButton);
    document.body.append(dialog);
    appendNextPage(list, loadMoreButton);
  }

  function appendNextPage(list, loadMoreButton) {
    for (const name of pendingNames.splice(0, settings.pageSize)) {
      list.append(createRow(name));
    }
    if (pendingNames.length === 0) loadMoreButton.remove();
  }

  function createRow(name) {
    const row = document.createElement("div");
    row.textContent = name;
    const trashButton = document.createElement("button");
    trashButton.setAttribute("aria-label", "Delete " + name);
    trashButton.textContent = "trash";
    trashButton.addEventListener("click", () => openConfirmDialog(row, name));
    row.append(trashButton);
    return row;
  }

  function openConfirmDialog(row, name) {
    const confirmDialog = document.createElement("div");
    confirmDialog.setAttribute("role", "alertdialog");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      confirmDialog.remove();
      setTimeout(() => {
        row.remove();
        window.__deletionLog.push(name);
      }, settings.deleteLatencyMs);
    });
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => confirmDialog.remove());
    confirmDialog.append("Delete " + name + "?", deleteButton, cancelButton);
    document.body.append(confirmDialog);
  }

  setTimeout(renderPanel, settings.panelRenderDelayMs);
</script>
</body>
</html>`;
