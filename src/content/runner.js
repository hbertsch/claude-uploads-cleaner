// The delete loop: clicks through the page like a user would.
(function () {
  const { page, config } = UploadsCleaner;

  // Resolves with the first truthy result of condition(), or null after timeoutMilliseconds. The
  // condition is checked right away and after every change of the page, so nothing is polled.
  function waitFor(condition, timeoutMilliseconds) {
    return new Promise((resolve) => {
      const immediateResult = condition();
      if (immediateResult) {
        resolve(immediateResult);
        return;
      }
      const observer = new MutationObserver(() => {
        const result = condition();
        if (result) finish(result);
      });
      const timer = setTimeout(() => finish(null), timeoutMilliseconds);
      function finish(result) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(result);
      }
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  function findCurrentRows() {
    const panel = page.findPanel();
    return panel ? page.findRows(panel) : [];
  }

  function findCurrentLoadMoreButton() {
    const panel = page.findPanel();
    return panel ? page.findLoadMoreButton(panel) : null;
  }

  async function deleteRow(row) {
    const trashButton = page.findTrashButton(row);
    if (!trashButton) return false;
    trashButton.click();
    const confirmButton = await waitFor(
      () => page.findConfirmButton(row),
      config.CONFIRM_DIALOG_TIMEOUT_MS,
    );
    if (!confirmButton) return false;
    confirmButton.click();
    return Boolean(await waitFor(() => !row.isConnected, config.ROW_REMOVAL_TIMEOUT_MS));
  }

  // Right after the last row of a page was deleted, the page may answer the load-more click with nothing
  // for a while, so the click is repeated after LOAD_MORE_PAUSE_MS. The list is finished only when the button is gone.
  async function loadNextPage(shouldStop) {
    for (let attempt = 0; attempt <= config.MAX_RETRIES_PER_FILE; attempt++) {
      if (shouldStop()) return "stopped";
      const loadMoreButton = findCurrentLoadMoreButton();
      if (!loadMoreButton) return "finished";
      loadMoreButton.click();
      await waitFor(
        () => findCurrentRows().length > 0 || !findCurrentLoadMoreButton(),
        config.LOAD_MORE_PAUSE_MS,
      );
      if (findCurrentRows().length > 0) return "loaded";
      if (!findCurrentLoadMoreButton()) return "finished";
    }
    return "failed";
  }

  // Returns the number of deleted files and why the loop ended: "finished", "stopped" or "failed".
  async function deleteAllFiles({ onProgress, shouldStop }) {
    let deletedCount = 0;

    while (true) {
      if (shouldStop()) return { deletedCount, outcome: "stopped" };

      const rows = findCurrentRows();
      if (rows.length === 0) {
        const outcome = await loadNextPage(shouldStop);
        if (outcome === "loaded") continue;
        return { deletedCount, outcome };
      }

      const wasDeleted = await deleteRow(rows[0]);
      if (!wasDeleted) return { deletedCount, outcome: "failed" };
      deletedCount++;
      onProgress(deletedCount);
    }
  }

  UploadsCleaner.runner = { deleteAllFiles };
})();
