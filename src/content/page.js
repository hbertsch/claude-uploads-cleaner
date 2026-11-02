// All knowledge of claude.ai's DOM lives here (see docs/dom-notes.md). No label texts.
(function () {
  const { ROUTE_FRAGMENT } = UploadsCleaner.config;

  function isUploadedFilesRoute() {
    return location.hash.startsWith(ROUTE_FRAGMENT);
  }

  // The panel is the smallest element around the heading and the table. For an empty list there
  // is no table: it is the element around the heading block and the empty-state text.
  function findPanel() {
    const settingsDialog = document.querySelector('[role="dialog"]');
    if (!settingsDialog) return null;

    const table = settingsDialog.querySelector("table");
    if (table) {
      let ancestor = table.parentElement;
      while (ancestor && ancestor !== settingsDialog && !ancestor.querySelector("h2")) {
        ancestor = ancestor.parentElement;
      }
      return ancestor === settingsDialog ? null : ancestor;
    }

    // The dialog's own title is an h2 too and comes first; the panel's heading is the last one.
    const heading = [...settingsDialog.querySelectorAll("h2")].at(-1);
    if (!heading) return null;
    let headingBlock = heading.parentElement;
    while (headingBlock.parentElement?.children.length === 1) {
      headingBlock = headingBlock.parentElement;
    }
    return headingBlock.parentElement === settingsDialog ? null : headingBlock.parentElement;
  }

  function findHeading(panel) {
    return panel.querySelector("h2");
  }

  // Loading placeholder rows have no span[title] and are skipped.
  function findRows(panel) {
    return [...panel.querySelectorAll("tbody > tr")].filter((row) => readFileName(row));
  }

  function readFileName(row) {
    return row.querySelector("span[title]")?.title ?? "";
  }

  // The first button of a row opens the row's chats, the last one is the trash button.
  function findTrashButton(row) {
    return [...row.querySelectorAll("button")].at(-1) ?? null;
  }

  // The confirm dialog is a portal outside the panel. It is the one that names the row's file;
  // its last button is the destructive one.
  function findConfirmButton(row) {
    const fileName = readFileName(row);
    const dialog = [...document.querySelectorAll('[role="alertdialog"]')].find((candidate) =>
      candidate.textContent.includes(fileName),
    );
    return dialog ? ([...dialog.querySelectorAll("button")].at(-1) ?? null) : null;
  }

  // The only button after the table that is not part of it.
  function findLoadMoreButton(panel) {
    const table = panel.querySelector("table");
    if (!table) return null;
    return (
      [...panel.querySelectorAll("button")].find(
        (button) =>
          !table.contains(button) &&
          Boolean(table.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING),
      ) ?? null
    );
  }

  UploadsCleaner.page = {
    isUploadedFilesRoute,
    findPanel,
    findHeading,
    findRows,
    readFileName,
    findTrashButton,
    findConfirmButton,
    findLoadMoreButton,
  };
})();
