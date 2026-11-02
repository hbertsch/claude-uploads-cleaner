const BUTTON_ID = "uploads-cleaner-button";
const CONFIRM_ID = "uploads-cleaner-confirm";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function findDeleteButtons() {
  return [...document.querySelectorAll("button")].filter((button) =>
    /^Delete .+/.test(button.getAttribute("aria-label") || ""),
  );
}

function findButtonByText(text) {
  return [...document.querySelectorAll("button")].find(
    (button) => button.textContent.trim() === text,
  );
}

async function waitForDeleteButtons(maxWaitMilliseconds) {
  for (let waited = 0; waited < maxWaitMilliseconds; waited += 250) {
    if (findDeleteButtons().length > 0) return true;
    await sleep(250);
  }
  return false;
}

async function deleteFirstFile() {
  findDeleteButtons()[0].click();
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(150);
    const confirmButton = findButtonByText("Delete");
    if (confirmButton) {
      confirmButton.click();
      await sleep(700);
      return true;
    }
  }
  return false;
}

async function deleteAllFiles(button) {
  let deletedCount = 0;
  let emptyLoads = 0;

  while (true) {
    if (findDeleteButtons().length === 0) {
      await sleep(1500);
      const loadMoreButton = findButtonByText("Load more");
      if (!loadMoreButton) break;
      loadMoreButton.click();
      const hasNewFiles = await waitForDeleteButtons(5000);
      emptyLoads = hasNewFiles ? 0 : emptyLoads + 1;
      if (emptyLoads >= 3) break;
      continue;
    }

    const wasDeleted = await deleteFirstFile();
    if (!wasDeleted) break;
    deletedCount++;
    button.textContent = `Deleting... ${deletedCount} done`;
  }

  button.textContent = `Done: ${deletedCount} files deleted`;
  button.disabled = false;
}

function createStyledButton(text) {
  const button = document.createElement("button");
  button.textContent = text;
  button.style.cssText =
    "align-self: flex-start; width: fit-content; margin: 8px 8px 8px 0; padding: 8px 14px; border-radius: 8px; border: 1px solid #b3261e; " +
    "background: transparent; color: #f2b8b5; cursor: pointer; font-size: 14px;";
  return button;
}

function showConfirmStep(button) {
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
    await deleteAllFiles(button);
  });
}

function createButton() {
  const button = createStyledButton("Delete all uploaded files");
  button.id = BUTTON_ID;
  button.addEventListener("click", () => showConfirmStep(button));
  return button;
}

function insertButtonIfUploadedFilesPageIsOpen() {
  if (document.getElementById(BUTTON_ID)) return;
  const heading = [...document.querySelectorAll("h1, h2, h3, h4, div, p, span")].find(
    (element) => element.children.length === 0 && element.textContent.trim() === "Uploaded files",
  );
  if (!heading) return;
  heading.insertAdjacentElement("afterend", createButton());
}

new MutationObserver(insertButtonIfUploadedFilesPageIsOpen).observe(document.body, {
  childList: true,
  subtree: true,
});
insertButtonIfUploadedFilesPageIsOpen();
