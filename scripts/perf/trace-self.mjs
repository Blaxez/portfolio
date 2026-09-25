// Self-time by event name on the renderer main thread during a 4x-throttled scroll.
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";
const server = await serve(4184);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--disable-gpu-compositing", "--disable-gpu-rasterization", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto("http://127.0.0.1:4184/portfolio/", { waitUntil: "load" });
await page.waitForTimeout(2500);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const ev = [];
cdp.on("Tracing.dataCollected", (e) => ev.push(...e.value));
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "toplevel", "v8", "blink", "cc"] }, transferMode: "ReportEvents" });
await cdp.send("Input.synthesizeScrollGesture", { x: 720, y: 450, yDistance: -H, speed: 1400, gestureSourceType: "mouse", preventFling: true });
await cdp.send("Tracing.end"); await done;
const names = new Map(ev.filter((e) => e.ph === "M" && e.name === "thread_name").map((e) => [`${e.pid}:${e.tid}`, e.args.name]));
const xs = ev.filter((e) => e.ph === "X" && e.dur);
const busy = new Map();
for (const e of xs) if (e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask") busy.set(`${e.pid}:${e.tid}`, (busy.get(`${e.pid}:${e.tid}`) ?? 0) + e.dur);
const main = [...busy.entries()].filter(([k]) => names.get(k) === "CrRendererMain").sort((a, b) => b[1] - a[1])[0][0];
const mx = xs.filter((e) => `${e.pid}:${e.tid}` === main).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
// self time = dur - sum(direct children dur)
const stack = []; const self = new Map();
for (const e of mx) {
  while (stack.length && stack.at(-1).ts + stack.at(-1).dur <= e.ts) stack.pop();
  if (stack.length) stack.at(-1).child += e.dur;
  e.child = 0; stack.push(e);
}
for (const e of mx) self.set(e.name, (self.get(e.name) ?? 0) + Math.max(0, e.dur - e.child));
const total = [...self.values()].reduce((a, b) => a + b, 0);
for (const [n, d] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22)) console.log(((d / total) * 100).toFixed(1).padStart(5), "%", (d / 1000).toFixed(0).padStart(6), "ms", n);
await browser.close(); server.close();
