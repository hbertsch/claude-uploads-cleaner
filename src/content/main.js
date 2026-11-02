(function () {
  if (UploadsCleaner.started) return;
  UploadsCleaner.started = true;

  const { page, ui, runner } = UploadsCleaner;

  async function deleteAllFiles() {
    const deletedCount = await runner.deleteAllFiles({ onProgress: ui.showProgress });
    ui.showDone(deletedCount);
  }

  let layoutTimer = null;

  function stopLayoutTimer() {
    clearTimeout(layoutTimer);
    layoutTimer = null;
  }

  // The list may still be rendering, so an unknown layout is reported only after a grace period.
  function reportLayoutIfStillUnrecognised() {
    layoutTimer = null;
    if (ui.hasButton() || !page.isUploadedFilesRoute()) return;
    const { state, dialog, panel } = page.inspectLayout();
    if (state === "unrecognised") ui.showLayoutNotRecognised(panel ?? dialog);
  }

  function insertButtonIfUploadedFilesPageIsOpen() {
    if (ui.hasButton() || !page.isUploadedFilesRoute()) return;
    const { state, panel } = page.inspectLayout();
    if (state === "recognised") {
      stopLayoutTimer();
      ui.removeLayoutMessage();
      ui.insertButton(page.findHeading(panel), deleteAllFiles);
    } else if (state === "absent") {
      stopLayoutTimer();
    } else if (!layoutTimer && !ui.hasLayoutMessage()) {
      layoutTimer = setTimeout(
        reportLayoutIfStillUnrecognised,
        UploadsCleaner.config.LAYOUT_GRACE_MS,
      );
    }
  }

  new MutationObserver(insertButtonIfUploadedFilesPageIsOpen).observe(document.body, {
    childList: true,
    subtree: true,
  });
  insertButtonIfUploadedFilesPageIsOpen();
})();
