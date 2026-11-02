// Runs in the real claude.ai page (Claude in Chrome javascript_tool), never in the extension.
// Loads every page of the "Uploaded files" list and reports counts only, never file names.
// ok is true only if every listed file is a dummy file (dummy-<number>.txt) or the list is empty.
(async () => {
  const DUMMY_NAME = /^dummy-\d+\.txt$/;
  const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const findTable = () => document.querySelector("table[aria-label]");
  const findRows = () => [...(findTable()?.querySelectorAll("tbody > tr") ?? [])];
  const findLoadMoreButton = () => {
    const table = findTable();
    if (!table) return null;
    const scrollArea = table.closest("div[class*='overflow']");
    return [...scrollArea.querySelectorAll("button")].find((button) => !table.contains(button));
  };

  let loadMoreClicks = 0;
  for (let guard = 0; guard < 200; guard++) {
    const loadMoreButton = findLoadMoreButton();
    if (!loadMoreButton) break;
    const rowCountBefore = findRows().length;
    loadMoreButton.click();
    loadMoreClicks++;
    for (let waited = 0; waited < 5000 && findRows().length === rowCountBefore; waited += 100) {
      await pause(100);
    }
    if (findRows().length === rowCountBefore) break;
  }

  const rowNames = findRows().map(
    (row) => row.querySelector("span[title]")?.getAttribute("title") ?? "",
  );
  const nonDummyCount = rowNames.filter((name) => !DUMMY_NAME.test(name)).length;
  return {
    ok: nonDummyCount === 0,
    rowCount: rowNames.length,
    nonDummyCount,
    loadMoreClicks,
    loadMoreStillShown: Boolean(findLoadMoreButton()),
  };
})();
