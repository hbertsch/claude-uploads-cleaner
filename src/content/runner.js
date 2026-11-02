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

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function findRowByName(fileName) {
    return findCurrentRows().find((row) => page.readFileName(row) === fileName) ?? null;
  }

  // One try: click trash, click confirm, wait until the row leaves the page.
  async function tryDeleteRow(row) {
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

  // After a failed try the dialog is closed, the run waits (the wait doubles with every failed
  // try) and checks by file name whether the file went away after all. That counts as deleted.
  // The file is tried MAX_RETRIES_PER_FILE + 1 times in total.
  async function deleteRow(row) {
    const fileName = page.readFileName(row);
    let currentRow = row;
    let backoffMilliseconds = config.ROW_REMOVAL_TIMEOUT_MS;
    for (let attempt = 0; attempt <= config.MAX_RETRIES_PER_FILE; attempt++) {
      if (await tryDeleteRow(currentRow)) return true;
      page.findCancelButton(currentRow)?.click();
      await sleep(backoffMilliseconds);
      backoffMilliseconds *= 2;
      currentRow = findRowByName(fileName);
      if (!currentRow) return true;
    }
    return false;
  }

  // Right after the last row of a page was deleted, the page may answer the load-more click with nothing
  // for a while, so the click is repeated after LOAD_MORE_PAUSE_MS. The list is finished only when the button is gone.
  async function loadNextPage(shouldStop) {
    for (let attempt = 0; attempt <= config.MAX_RETRIES_PER_FILE; attempt++) {
      if (shouldStop() || hasLeftTheList()) return "stopped";
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

  // The user also ends the run by leaving the route or closing the settings dialog.
  function hasLeftTheList() {
    return !page.isUploadedFilesRoute() || !page.findPanel();
  }

  // Returns the number of deleted files and why the loop ended: "finished", "stopped" or "failed".
  async function deleteAllFiles({ onProgress, shouldStop }) {
    let deletedCount = 0;

    while (true) {
      if (shouldStop() || hasLeftTheList()) return { deletedCount, outcome: "stopped" };

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
