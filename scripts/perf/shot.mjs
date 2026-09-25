// Screenshots at key scroll positions + console/page errors.
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";

const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = process.env.OUT ?? "/tmp";
const server = await serve(4174);
const browser = await chromium.launch({ executablePath: CHROME, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const viewports = (process.env.ONLY_DESKTOP ? [0] : [0, 1]).map((i) => [
  { name: "desktop", width: 1440, height: 900, dpr: 1 },
  { name: "mobile", width: 390, height: 844, dpr: 2, mobile: true },
][i]);
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference", javaScriptEnabled: !process.env.NOJS });
  const page = await ctx.newPage();
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.log(`[${vp.name}] console.${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[${vp.name}] pageerror: ${e.message}`));
  await page.goto("http://127.0.0.1:4174/portfolio/", { waitUntil: "load" });
  if (!process.env.NOJS) await page.waitForFunction(() => performance.getEntriesByName("stage:ready").length > 0, null, { timeout: 20000 }).catch(() => console.log(`[${vp.name}] stage not ready`));
  await page.waitForTimeout(1200);
  const marks = process.env.NOJS ? {} : await page.evaluate(() => ({ ready: performance.getEntriesByName("stage:ready")[0]?.startTime, hud: document.querySelector('[role=status]')?.textContent }));
  console.log(vp.name, JSON.stringify(marks));
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const stops = (process.env.STOPS ?? "0,0.08,0.13,0.18,0.23,0.28,0.4,0.6,0.97").split(",").map(Number);
  for (const s of stops) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(s * (H - vp.height)));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/${vp.name}-${String(Math.round(s * 100)).padStart(3, "0")}.png` });
  }
  await ctx.close();
}
await browser.close();
server.close();
