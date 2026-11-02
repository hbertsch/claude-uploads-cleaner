globalThis.UploadsCleaner = globalThis.UploadsCleaner ?? {};

UploadsCleaner.config = {
  ROUTE_FRAGMENT: "#settings/data-privacy-controls/uploaded-files",
  // 3 x the measured maximum of 32 ms (docs/dom-notes.md), rounded up to the next 500.
  ROW_REMOVAL_TIMEOUT_MS: 500,
  CONFIRM_POLL_INTERVAL_MS: 150,
  CONFIRM_POLL_ATTEMPTS: 20,
  AFTER_DELETE_PAUSE_MS: 700,
  BEFORE_LOAD_MORE_PAUSE_MS: 1500,
  LOAD_MORE_WAIT_MS: 5000,
  ROWS_POLL_INTERVAL_MS: 250,
  MAX_EMPTY_LOADS: 3,
};
