globalThis.UploadsCleaner = globalThis.UploadsCleaner ?? {};

UploadsCleaner.config = {
  ROUTE_FRAGMENT: "#settings/data-privacy-controls/uploaded-files",
  // 3 x the measured maximum of 32 ms (docs/dom-notes.md), rounded up to the next 500.
  ROW_REMOVAL_TIMEOUT_MS: 500,
  // Same bound as the old loop (20 polls of 150 ms); the real dialog opening time was not measured.
  CONFIRM_DIALOG_TIMEOUT_MS: 3000,
  // Measured settle time of "Load more" after a page end: 2283 ms, one measurement (docs/dom-notes.md).
  LOAD_MORE_PAUSE_MS: 2283,
  // Policy choices, not measurements.
  MAX_RETRIES_PER_FILE: 3,
  PROGRESS_UPDATE_INTERVAL_MS: 250,
  // Time the page gets to render the list before the layout counts as not recognised. A policy
  // choice, not a measurement.
  LAYOUT_GRACE_MS: 5000,
  LAYOUT_ISSUE_URL:
    "https://github.com/hbertsch/claude-uploads-cleaner/issues/new?template=layout_changed.yml",
};
