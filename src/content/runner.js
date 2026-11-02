// The delete loop: clicks through the page like a user would.
(function () {
  const { page, config } = UploadsCleaner;

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function findCurrentRows() {
    const panel = page.findPanel();
    return panel ? page.findRows(panel) : [];
  }

  function findCurrentLoadMoreButton() {
    const panel = page.findPanel();
    return panel ? page.findLoadMoreButton(panel) : null;
  }

  async function waitForRows(maxWaitMilliseconds) {
    for (let waited = 0; waited < maxWaitMilliseconds; waited += config.ROWS_POLL_INTERVAL_MS) {
      if (findCurrentRows().length > 0) return true;
      await sleep(config.ROWS_POLL_INTERVAL_MS);
    }
    return false;
  }

  async function deleteRow(row) {
    const trashButton = page.findTrashButton(row);
    if (!trashButton) return false;
    trashButton.click();
    for (let attempt = 0; attempt < config.CONFIRM_POLL_ATTEMPTS; attempt++) {
      await sleep(config.CONFIRM_POLL_INTERVAL_MS);
      const confirmButton = page.findConfirmButton(row);
      if (confirmButton) {
        confirmButton.click();
        await sleep(config.AFTER_DELETE_PAUSE_MS);
        return true;
      }
    }
    return false;
  }

  async function deleteAllFiles({ onProgress }) {
    let deletedCount = 0;
    let emptyLoads = 0;

    while (true) {
      const rows = findCurrentRows();
      if (rows.length === 0) {
        await sleep(config.BEFORE_LOAD_MORE_PAUSE_MS);
        const loadMoreButton = findCurrentLoadMoreButton();
        if (!loadMoreButton) break;
        loadMoreButton.click();
        const hasNewRows = await waitForRows(config.LOAD_MORE_WAIT_MS);
        emptyLoads = hasNewRows ? 0 : emptyLoads + 1;
        if (emptyLoads >= config.MAX_EMPTY_LOADS) break;
        continue;
      }

      const wasDeleted = await deleteRow(rows[0]);
      if (!wasDeleted) break;
      deletedCount++;
      onProgress(deletedCount);
    }

    return deletedCount;
  }

  UploadsCleaner.runner = { deleteAllFiles };
})();
