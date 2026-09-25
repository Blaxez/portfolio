// Tile screenshots side by side (uses the headless browser as the compositor).
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const [out, width, ...files] = process.argv.slice(2);
const w = Number(width);
const imgs = files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString("base64")}" style="width:${w}px;display:block">`).join("");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: (w + 8) * files.length, height: 100 } });
await page.setContent(`<body style="margin:0;background:#333;display:flex;gap:8px;align-items:flex-start">${imgs}</body>`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
