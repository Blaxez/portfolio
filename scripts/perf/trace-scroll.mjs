// Main-thread cost per frame during a scroll gesture (Chrome trace), 4x CPU throttle.
// Separates what our code costs from what the (software) GPU process can present.
import { chromium } from "playwright-core";
import { serve } from "./serve.mjs";

const server = await serve(4180);
const EXTRA = (process.env.EXTRA_ARGS ?? "").split(" ").filter(Boolean);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", ...EXTRA] });
console.log("chrome args:", EXTRA.join(" ") || "(default)");
const CONTROL = `<!doctype html><meta name=viewport content="width=device-width"><body style="margin:0;background:#0b0b0c;color:#ededea;font:18px/1.6 system-ui">${"<p style='padding:0 48px'>Static control paragraph for calibrating the environment's scroll ceiling. ".repeat(1) + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(40) + "</p>".repeat(1)}`.repeat(1);

async function run(label, { url, html, init, tier } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (tier) await ctx.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 }));
  if (init) await ctx.addInitScript(init);
  await ctx.addInitScript(() => { window.__f = []; window.__rec = false; const t = (x) => { if (window.__rec) window.__f.push(x); requestAnimationFrame(t); }; requestAnimationFrame(t); });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (html) await page.setContent(html.repeat(1) + "<div style='height:11000px'></div>");
  else await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "toplevel"] }, transferMode: "ReportEvents" });
  await page.evaluate(() => { window.__rec = true; });
  await cdp.send("Input.synthesizeScrollGesture", { x: 720, y: 450, yDistance: -Math.min(H, 11000), speed: 1400, gestureSourceType: "mouse", preventFling: true });
  const f = await page.evaluate(() => { window.__rec = false; return window.__f; });
  await cdp.send("Tracing.end");
  await done;
  await ctx.close();

  const names = new Map(events.filter((e) => e.ph === "M" && e.name === "thread_name").map((e) => [`${e.pid}:${e.tid}`, e.args.name]));
  const xs = events.filter((e) => e.ph === "X" && e.dur);
  const byThread = new Map();
  for (const e of xs) {
    const k = `${e.pid}:${e.tid}`;
    if (e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask") byThread.set(k, (byThread.get(k) ?? 0) + e.dur);
  }
  const mainKey = [...byThread.entries()].filter(([k]) => names.get(k) === "CrRendererMain").sort((a, b) => b[1] - a[1])[0]?.[0];
  const span_us = (Math.max(...xs.map((e) => e.ts + e.dur)) - Math.min(...xs.map((e) => e.ts)));
  const agg = (pred) => {
    const m = new Map();
    for (const e of xs) if (pred(e)) m.set(e.name, (m.get(e.name) ?? 0) + e.dur);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, d]) => `${n}:${(d / 1000).toFixed(0)}`).join(" ");
  };
  const threadBusy = [...byThread.entries()].map(([k, d]) => `${names.get(k) ?? k}=${((d / span_us) * 100).toFixed(0)}%`).sort().join(" ");
  const longTasks = xs.filter((e) => `${e.pid}:${e.tid}` === mainKey && e.name === "RunTask" && e.dur > 50000).length;
  const iv = f.slice(1).map((t, i) => t - f[i]).sort((a, b) => a - b);
  const span = (f.at(-1) - f[0]) / 1000;
  const mainBusy = byThread.get(mainKey) ?? 0;
  console.log(`${label.padEnd(26)} rAF fps ${(iv.length / span).toFixed(1)} | main ms/frame (4x) ${(mainBusy / 1000 / Math.max(1, iv.length)).toFixed(2)} | long tasks ${longTasks}\n   threads: ${threadBusy}\n   main: ${agg((e) => `${e.pid}:${e.tid}` === mainKey && e.name !== "RunTask" && e.name !== "ThreadControllerImpl::RunTask")}`);
}

const URL_ = "http://127.0.0.1:4180/portfolio/";
const ONLY = process.env.ONLY;
if (!ONLY) await run("control: static text", { html: CONTROL });
if (!ONLY) await run("site, 3D off", { url: URL_, init: () => { window.Worker = undefined; HTMLCanvasElement.prototype.getContext = () => null; } });
if (ONLY === "nowc") await run("site, 3D on, no will-change", { url: URL_, init: () => document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = "*{will-change:auto!important}"; document.head.appendChild(st); }) });
if (ONLY) { await run("site, 3D on (medium)", { url: URL_ }); await browser.close(); server.close(); process.exit(0); }
await run("site, 3D on (medium)", { url: URL_ });
await run("site, 3D on (high)", { url: URL_, tier: true });
await browser.close();
server.close();
