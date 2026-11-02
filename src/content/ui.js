// All texts the user sees live here.
(function () {
  const BUTTON_ID = "uploads-cleaner-button";
  const CONFIRM_ID = "uploads-cleaner-confirm";
  const MESSAGE_ID = "uploads-cleaner-message";
  const LAYOUT_MESSAGE_ID = "uploads-cleaner-layout-message";

  function createStyledButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText =
      "align-self: flex-start; width: fit-content; margin: 8px 8px 8px 0; padding: 8px 14px; border-radius: 8px; border: 1px solid #b3261e; " +
      "background: transparent; color: #f2b8b5; cursor: pointer; font-size: 14px;";
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

  function showProgress(deletedCount) {
    showMessage(`Deleting... ${deletedCount} done`);
  }

  function showDone(deletedCount) {
    showMessage(`Done: ${deletedCount} files deleted`);
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
    showProgress,
    showDone,
    hasLayoutMessage,
    showLayoutNotRecognised,
    removeLayoutMessage,
  };
})();
