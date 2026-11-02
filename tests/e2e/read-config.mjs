import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

// The extension's constants live in a plain content script; run it in a sandbox to read them.
export function readExtensionConfig() {
  const sandbox = {};
  vm.runInNewContext(readFileSync(path.resolve("src/content/config.js"), "utf8"), sandbox);
  return sandbox.UploadsCleaner.config;
}
