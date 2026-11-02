(function () {
  if (UploadsCleaner.started) return;
  UploadsCleaner.started = true;

  const { page, ui, runner } = UploadsCleaner;

  async function deleteAllFiles() {
    const deletedCount = await runner.deleteAllFiles({ onProgress: ui.showProgress });
    ui.showDone(deletedCount);
  }

  function insertButtonIfUploadedFilesPageIsOpen() {
    if (ui.hasButton() || !page.isUploadedFilesRoute()) return;
    const panel = page.findPanel();
    if (!panel) return;
    ui.insertButton(page.findHeading(panel), deleteAllFiles);
  }

  new MutationObserver(insertButtonIfUploadedFilesPageIsOpen).observe(document.body, {
    childList: true,
    subtree: true,
  });
  insertButtonIfUploadedFilesPageIsOpen();
})();
