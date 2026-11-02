// All texts the user sees live here.
(function () {
  const BUTTON_ID = "uploads-cleaner-button";
  const CONFIRM_ID = "uploads-cleaner-confirm";
  const MESSAGE_ID = "uploads-cleaner-message";
  const PROGRESS_CONTROLS_ID = "uploads-cleaner-progress-controls";
  const LAYOUT_MESSAGE_ID = "uploads-cleaner-layout-message";

  // The text takes the colour of the page, so it is readable in the light and the dark theme.
  // The red border (#d93025) keeps at least 3:1 against both white and near-black.
  function createStyledButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText =
      "align-self: flex-start; width: fit-content; margin: 8px 8px 8px 0; padding: 8px 14px; border-radius: 8px; border: 1px solid #d93025; " +
      "background: transparent; color: inherit; cursor: pointer; font-size: 14px;";
    return button;
  }

  function hasButton() {
    return Boolean(document.getElementById(BUTTON_ID));
  }

  function showMessage(text) {
    let message = document.getElementById(MESSAGE_ID);
    if (!message) {
      const button = document.getElementById(BUTTON_ID);
      if (!button) return;
      message = document.createElement("p");
      message.id = MESSAGE_ID;
      button.insertAdjacentElement("afterend", message);
    }
    message.textContent = text;
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  let progress = null;

  function renderProgress() {
    const elapsedMilliseconds = Date.now() - progress.startTime;
    const filesPerSecond =
      elapsedMilliseconds > 0 ? (progress.deletedCount / elapsedMilliseconds) * 1000 : 0;
    showMessage(
      `Deleting uploaded files... ${progress.deletedCount} deleted · ` +
        `${formatDuration(elapsedMilliseconds)} · ${filesPerSecond.toFixed(1)} files/s`,
    );
  }

  // Shows the running view: the progress line (refreshed at most every
  // PROGRESS_UPDATE_INTERVAL_MS), a hint about hidden tabs and the Stop button.
  function startProgress(onStopRequested) {
    progress = { startTime: Date.now(), deletedCount: 0, timer: null, controls: null };
    renderProgress();
    document.getElementById(MESSAGE_ID).setAttribute("aria-live", "polite");

    const controls = document.createElement("div");
    controls.id = PROGRESS_CONTROLS_ID;
    const hint = document.createElement("p");
    hint.textContent = "Keep this tab visible. Browsers slow down hidden tabs.";
    const stopButton = createStyledButton("Stop");
    stopButton.addEventListener("click", () => {
      stopButton.disabled = true;
      onStopRequested();
    });
    controls.append(hint, stopButton);
    document.getElementById(MESSAGE_ID).insertAdjacentElement("afterend", controls);
    progress.controls = controls;
    progress.timer = setInterval(renderProgress, UploadsCleaner.config.PROGRESS_UPDATE_INTERVAL_MS);
  }

  function updateProgress(deletedCount) {
    progress.deletedCount = deletedCount;
  }

  // Ends the running view and returns how long the run took.
  function endProgress() {
    clearInterval(progress.timer);
    progress.controls.remove();
    const elapsedMilliseconds = Date.now() - progress.startTime;
    progress = null;
    return elapsedMilliseconds;
  }

  function showDone(deletedCount, elapsedMilliseconds) {
    showMessage(`Done: ${deletedCount} files deleted in ${formatDuration(elapsedMilliseconds)}.`);
  }

  function showStopped(deletedCount) {
    showMessage(`Stopped: ${deletedCount} files deleted.`);
  }

  function showRefused(deletedCount) {
    showMessage(
      `Stopped after ${deletedCount} files: claude.ai did not accept further deletions. ` +
        "Wait a few minutes and run again.",
    );
  }

  function showConfirmStep(button, onConfirmed) {
    button.hidden = true;

    const confirmBox = document.createElement("div");
    confirmBox.id = CONFIRM_ID;
    const question = document.createElement("p");
    question.textContent = "Delete ALL uploaded files? This cannot be undone.";
    const yesButton = createStyledButton("Yes, delete everything");
    const cancelButton = createStyledButton("Cancel");
    confirmBox.append(question, yesButton, cancelButton);
    button.insertAdjacentElement("afterend", confirmBox);

    cancelButton.addEventListener("click", () => {
      confirmBox.remove();
      button.hidden = false;
    });
    yesButton.addEventListener("click", async () => {
      confirmBox.remove();
      button.hidden = false;
      button.disabled = true;
      await onConfirmed();
      button.disabled = false;
    });
  }

  function insertButton(anchor, onConfirmed) {
    const button = createStyledButton("Delete all uploaded files");
    button.id = BUTTON_ID;
    button.addEventListener("click", () => showConfirmStep(button, onConfirmed));
    anchor.insertAdjacentElement("afterend", button);
  }

  function hasLayoutMessage() {
    return Boolean(document.getElementById(LAYOUT_MESSAGE_ID));
  }

  function showLayoutNotRecognised(container) {
    if (hasLayoutMessage()) return;
    const message = document.createElement("p");
    message.id = LAYOUT_MESSAGE_ID;
    message.textContent = "Layout not recognised. Nothing was deleted. Please report it: ";
    const link = document.createElement("a");
    link.href = UploadsCleaner.config.LAYOUT_ISSUE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = UploadsCleaner.config.LAYOUT_ISSUE_URL;
    message.append(link);
    container.prepend(message);
  }

  function removeLayoutMessage() {
    document.getElementById(LAYOUT_MESSAGE_ID)?.remove();
  }

  UploadsCleaner.ui = {
    hasButton,
    insertButton,
    startProgress,
    updateProgress,
    endProgress,
    showDone,
    showStopped,
    showRefused,
    hasLayoutMessage,
    showLayoutNotRecognised,
    removeLayoutMessage,
  };
})();
