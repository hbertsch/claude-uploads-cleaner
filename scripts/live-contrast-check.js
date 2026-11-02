// Runs in the real claude.ai page (Claude in Chrome javascript_tool), never in the extension.
// Prints the WCAG contrast ratio of every element of the extension that is currently shown:
// text against the colour really visible behind it, and the border of the buttons.
// Needs 4.5:1 for text and 3:1 for borders. Reports the theme claude.ai marks on <html>.
(() => {
  const SELECTORS = [
    "#uploads-cleaner-button",
    "#uploads-cleaner-confirm p",
    "#uploads-cleaner-confirm button:nth-of-type(1)",
    "#uploads-cleaner-confirm button:nth-of-type(2)",
    "#uploads-cleaner-message",
    "#uploads-cleaner-progress-controls p",
    "#uploads-cleaner-progress-controls button",
  ];
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
  const luminance = ({ red, green, blue }) => {
    const [r, g, b] = [red, green, blue].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (first, second) => {
    const lighter = Math.max(luminance(first), luminance(second));
    const darker = Math.min(luminance(first), luminance(second));
    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  };

  const results = [];
  for (const selector of SELECTORS) {
    const element = document.querySelector(selector);
    if (!element) continue;
    const style = getComputedStyle(element);
    const background = effectiveBackground(element);
    const border = style.borderTopStyle === "none" ? null : toChannels(style.borderTopColor);
    results.push({
      selector,
      textContrast: contrast(blend(toChannels(style.color), background), background),
      borderContrast: border ? contrast(border, background) : null,
    });
  }
  const ok = results.every(
    (result) =>
      result.textContrast >= 4.5 && (result.borderContrast === null || result.borderContrast >= 3),
  );
  return JSON.stringify({ theme: document.documentElement.dataset.mode, ok, results });
})();
