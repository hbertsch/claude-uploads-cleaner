// Renders store/icon.svg to src/icons/icon-<size>.png and store/icon-300.png (transparent background).
// Usage: node scripts/make-icons.mjs
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const iconSvg = await readFile("store/icon.svg", "utf8");
const outputs = [
  { size: 16, path: "src/icons/icon-16.png" },
  { size: 32, path: "src/icons/icon-32.png" },
  { size: 48, path: "src/icons/icon-48.png" },
  { size: 128, path: "src/icons/icon-128.png" },
  { size: 300, path: "store/icon-300.png" },
];

await mkdir("src/icons", { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
for (const { size, path } of outputs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg}`,
  );
  await page.screenshot({ path, omitBackground: true });
  await page.close();
}
await browser.close();
