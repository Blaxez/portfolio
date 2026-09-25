import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";
const server = await serve(4183);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--disable-gpu-compositing", "--disable-gpu-rasterization", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (let i = 0; i < 4; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 }));
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1310720, uploadThroughput: 655360 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("http://127.0.0.1:4183/portfolio/", { waitUntil: "commit" });
  await page.waitForFunction(() => performance.getEntriesByName("stage:ready").length > 0, null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const m = Object.fromEntries(performance.getEntriesByType("mark").filter((e) => e.name.startsWith("stage:")).map((e) => [e.name.slice(6), Math.round(e.startTime)]));
    m.fcp = Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1);
    const res = performance.getEntriesByType("resource");
    const w = res.find((x) => /render\.worker|\.js$/.test(x.name) && x.initiatorType === "other");
    m.lastScriptEnd = Math.round(Math.max(...res.filter((x) => x.initiatorType === "script").map((x) => x.responseEnd)));
    m.worker = w ? `${Math.round(w.startTime)}→${Math.round(w.responseEnd)}` : "?";
    return m;
  });
  console.log(JSON.stringify(r));
  await ctx.close();
}
await browser.close(); server.close();
