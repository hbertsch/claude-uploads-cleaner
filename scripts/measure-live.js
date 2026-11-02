// Runs in the real claude.ai page (Claude in Chrome javascript_tool) after live-safety-check.js
// returned ok: true. Run with a leading "await". Start from a freshly loaded page (first page of
// rows plus a "Load more" button), so that the page end can be measured.
// Deletes dummy files: only run it when the Preflight consent for live steps is ticked.
// Measures with MutationObserver and performance.now(); returns numbers only, never file names.
await (async (deletionsToMeasure = 40) => {
  const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const findTable = () => document.querySelector("table[aria-label]");
  const findRows = () => [...(findTable()?.querySelectorAll("tbody > tr") ?? [])];
  const findLoadMoreButton = () => {
    const table = findTable();
    if (!table) return null;
    const scrollArea = table.closest("div[class*='overflow']");
    return [...scrollArea.querySelectorAll("button")].find((button) => !table.contains(button));
  };
  const findConfirmDialog = () =>
    [...document.querySelectorAll("[role='alertdialog']")].find(
      (dialog) => !findTable() || !dialog.contains(findTable()),
    );
  const waitFor = async (condition, timeoutMilliseconds) => {
    const start = performance.now();
    while (performance.now() - start < timeoutMilliseconds) {
      const result = condition();
      if (result) return result;
      await pause(10);
    }
    return null;
  };
  const median = (numbers) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const firstPageRowCount = findRows().length;
  const hasLoadMoreAtStart = Boolean(findLoadMoreButton());

  // (b) time from the confirm click until the row has left the DOM
  const removalMilliseconds = [];
  for (let count = 0; count < deletionsToMeasure && findRows().length > 0; count++) {
    const row = findRows()[0];
    const trashButton = [...row.querySelectorAll("button")].pop();
    trashButton.click();
    const dialog = await waitFor(findConfirmDialog, 3000);
    if (!dialog) return { error: "no confirm dialog after trash click", removalMilliseconds };
    const rowGone = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (!row.isConnected) {
          observer.disconnect();
          resolve(performance.now());
        }
      });
      observer.observe(findTable().querySelector("tbody"), { childList: true });
    });
    const confirmButton = [...dialog.querySelectorAll("button")].pop();
    const clickedAt = performance.now();
    confirmButton.click();
    const removedAt = await Promise.race([rowGone, pause(10000).then(() => null)]);
    if (removedAt === null)
      return { error: "row did not leave the DOM in 10 s", removalMilliseconds };
    removalMilliseconds.push(Math.round(removedAt - clickedAt));
    await waitFor(() => !findConfirmDialog(), 3000);
  }

  // (c) delete the rest of the first page, then see how long "Load more" needs to yield rows
  let loadMoreSettleMilliseconds = null;
  let rowsAfterPageEnd = null;
  while (hasLoadMoreAtStart && findRows().length > 0 && findLoadMoreButton()) {
    const row = findRows()[0];
    [...row.querySelectorAll("button")].pop().click();
    const dialog = await waitFor(findConfirmDialog, 3000);
    [...dialog.querySelectorAll("button")].pop().click();
    await waitFor(() => !row.isConnected, 10000);
    await waitFor(() => !findConfirmDialog(), 3000);
  }
  if (hasLoadMoreAtStart && findRows().length === 0) {
    const pageEndAt = performance.now();
    for (let attempt = 0; attempt < 100; attempt++) {
      const loadMoreButton = findLoadMoreButton();
      if (loadMoreButton) loadMoreButton.click();
      await pause(100);
      if (findRows().length > 0) {
        loadMoreSettleMilliseconds = Math.round(performance.now() - pageEndAt);
        rowsAfterPageEnd = findRows().length;
        break;
      }
    }
  }

  return {
    firstPageRowCount,
    hasLoadMoreAtStart,
    deletionsMeasured: removalMilliseconds.length,
    removalMedianMilliseconds: median(removalMilliseconds),
    removalMaxMilliseconds: Math.max(...removalMilliseconds),
    loadMoreSettleMilliseconds,
    rowsAfterPageEnd,
  };
})();
