// Records a 300-file run on the mock page and converts the video to docs/images/demo.gif.
// Needs ffmpeg. Usage: npm run demo (or node scripts/make-demo-gif.mjs)
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installClaudeMock, UPLOADED_FILES_URL } from "../tests/mock/claude-mock.mjs";
import { VIEWPORT, generateFileNames, launchWithExtension } from "./mock-browser.mjs";

const FILE_COUNT = 300;
const DELETE_LATENCY_MS = 30;
const PAUSE_BETWEEN_STEPS_MS = 1500;
const GIF_PATH = "docs/images/demo.gif";
const GIF_WIDTH = 800;
const GIF_FRAMES_PER_SECOND = 8;
const GIF_MAX_BYTES = 5 * 1024 * 1024;

const videoDirectory = await mkdtemp(path.join(os.tmpdir(), "uploads-cleaner-video-"));
const { context, close } = await launchWithExtension({
  recordVideo: { dir: videoDirectory, size: VIEWPORT },
});
await installClaudeMock(context, {
  fileNames: generateFileNames(FILE_COUNT),
  styled: true,
  deleteLatencyMs: DELETE_LATENCY_MS,
});
const page = await context.newPage();
await page.goto(UPLOADED_FILES_URL);
await page.locator("#uploads-cleaner-button").click();
await page.waitForTimeout(PAUSE_BETWEEN_STEPS_MS);
await page.getByRole("button", { name: "Yes, delete everything" }).click();
await page.waitForFunction(() =>
  document.querySelector("#uploads-cleaner-message")?.textContent.startsWith("Done:"),
);
await page.waitForTimeout(PAUSE_BETWEEN_STEPS_MS);
const videoPath = await page.video().path();
await close();

const filter =
  `fps=${GIF_FRAMES_PER_SECOND},scale=${GIF_WIDTH}:-1:flags=lanczos,split[a][b];` +
  "[a]palettegen=max_colors=64[palette];[b][palette]paletteuse=dither=bayer:bayer_scale=4";
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", videoPath, "-vf", filter, GIF_PATH]);
await rm(videoDirectory, { recursive: true, force: true });

const { size } = statSync(GIF_PATH);
console.log(`${GIF_PATH}: ${(size / 1024 / 1024).toFixed(2)} MB`);
if (size > GIF_MAX_BYTES) {
  console.error("The GIF is larger than 5 MB.");
  process.exit(1);
}
