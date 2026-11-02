import { test, expect } from "./fixtures.mjs";
import { installClaudeMock, UPLOADED_FILES_URL } from "../mock/claude-mock.mjs";

const MINIMUM_TEXT_CONTRAST = 4.5;
const MINIMUM_BORDER_CONTRAST = 3;

const THEMES = [
  { name: "light", background: "#ffffff", text: "#1a1a1a" },
  { name: "dark", background: "#1f1e1d", text: "#f0eee6" },
];

// Runs in the page: for each of our elements, the text colour, the border colour and the
// background colour that is really visible behind it (first non-transparent ancestor).
function measureColors(selectors) {
  const toChannels = (cssColor) => {
    const [red, green, blue, alpha = 1] = cssColor.match(/[\d.]+/g).map(Number);
    return { red, green, blue, alpha };
  };
  const blend = (top, bottom) => ({
    red: top.red * top.alpha + bottom.red * (1 - top.alpha),
    green: top.green * top.alpha + bottom.green * (1 - top.alpha),
    blue: top.blue * top.alpha + bottom.blue * (1 - top.alpha),
    alpha: 1,
  });
  const effectiveBackground = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      layers.push(toChannels(getComputedStyle(node).backgroundColor));
    }
    let result = { red: 255, green: 255, blue: 255, alpha: 1 };
    for (const layer of layers.reverse()) result = blend(layer, result);
    return result;
  };
  return selectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    const style = getComputedStyle(element);
    const background = effectiveBackground(element);
    return {
      selector,
      text: blend(toChannels(style.color), background),
      border: style.borderTopStyle === "none" ? null : toChannels(style.borderTopColor),
      background,
    };
  });
}

function relativeLuminance({ red, green, blue }) {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function expectReadable(measurements, theme) {
  for (const { selector, text, border, background } of measurements) {
    const textContrast = contrastRatio(text, background);
    expect(
      textContrast,
      `${selector} text in the ${theme.name} theme: ${textContrast.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
    if (border) {
      const borderContrast = contrastRatio(border, background);
      expect(
        borderContrast,
        `${selector} border in the ${theme.name} theme: ${borderContrast.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(MINIMUM_BORDER_CONTRAST);
    }
  }
}

for (const theme of THEMES) {
  test(`our texts and borders are readable on a ${theme.name} page`, async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    await installClaudeMock(context, { fileCount: 300, deleteLatencyMs: 100 });
    await page.goto(UPLOADED_FILES_URL);
    await page.addStyleTag({
      content: `body { background: ${theme.background} !important; color: ${theme.text} !important }`,
    });
    const screenshotOptions = (state) => ({
      path: testInfo.outputPath(`${theme.name}-${state}.png`),
      clip: { x: 0, y: 0, width: 900, height: 360 },
    });

    await page.locator("#uploads-cleaner-button").scrollIntoViewIfNeeded();
    expectReadable(await page.evaluate(measureColors, ["#uploads-cleaner-button"]), theme);
    await page.screenshot(screenshotOptions("button"));

    await page.locator("#uploads-cleaner-button").click();
    const confirmSelectors = [
      "#uploads-cleaner-confirm p",
      "#uploads-cleaner-confirm button:nth-of-type(1)",
      "#uploads-cleaner-confirm button:nth-of-type(2)",
    ];
    expectReadable(await page.evaluate(measureColors, confirmSelectors), theme);
    await page.screenshot(screenshotOptions("confirm"));

    await page.getByRole("button", { name: "Yes, delete everything" }).click();
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    const runningSelectors = [
      "#uploads-cleaner-message",
      "#uploads-cleaner-progress-controls p",
      "#uploads-cleaner-progress-controls button",
    ];
    expectReadable(await page.evaluate(measureColors, runningSelectors), theme);
    await page.screenshot(screenshotOptions("running"));

    await page.getByRole("button", { name: "Stop" }).click();
    await expect(page.locator("#uploads-cleaner-message")).toHaveText(/^Stopped/);
  });
}
