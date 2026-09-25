// Runtime exit criteria:
//   1. Scroll smoothness under 4× CPU throttling (main-thread rAF cadence + long animation frames)
//   2. INP proxy: Event Timing max interaction duration under 4× CPU throttling
//   3. 3D ready time (navigation → first rendered frame) on a 10 Mbps link
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
import { serve } from "./serve.mjs";

const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
// This host has no GPU. Chrome's own software raster + compositing is what it uses on GPU-less
// machines; WebGL still runs (SwiftShader). Forcing GPU raster through SwiftShader instead
// saturates the emulated GPU thread even for a plain text page, which measures the host, not the site.
const ARGS = ["--disable-gpu-compositing", "--disable-gpu-rasterization", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const PORT = 4178;
const URL_ = `http://127.0.0.1:${PORT}/portfolio/`;
const OUT = process.env.OUT ?? ".";
const REPS = Number(process.env.REPS ?? 5);

const PROFILES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, hints: { cores: 8, memory: 8 } },
  mobile: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, hints: null },
};

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))];

async function newPage(browser, profile) {
  const { hints, ...opts } = profile;
  const ctx = await browser.newContext({ ...opts, permissions: ["clipboard-read", "clipboard-write"] });
  if (hints) {
    // Emulate a desktop-class machine so the high LOD tier is exercised.
    await ctx.addInitScript(({ cores, memory }) => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => cores });
      Object.defineProperty(navigator, "deviceMemory", { get: () => memory });
    }, hints);
  }
  await ctx.addInitScript(() => {
    window.__frames = [];
    window.__loaf = [];
    window.__events = [];
    window.__recording = false;
    const tick = (t) => {
      if (window.__recording) window.__frames.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((l) => {
        if (window.__recording) for (const e of l.getEntries()) window.__loaf.push(e.duration);
      }).observe({ type: "long-animation-frame", buffered: false });
    } catch {}
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (e.interactionId) window.__events.push({ id: e.interactionId, name: e.name, duration: e.duration });
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp };
}

async function waitReady(page) {
  await page.waitForFunction(() => performance.getEntriesByName("stage:ready").length > 0, null, { timeout: 30000 });
  return page.evaluate(() => performance.getEntriesByName("stage:ready")[0].startTime);
}

async function scrollTest(browser, name, profile) {
  const { ctx, page, cdp } = await newPage(browser, profile);
  await page.goto(URL_, { waitUntil: "load" });
  await waitReady(page);
  await page.waitForTimeout(1500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate(() => {
    window.__frames = [];
    window.__loaf = [];
    window.__recording = true;
  });
  const t0 = Date.now();
  if (profile.hasTouch) {
    // Synthetic touch *gestures* don't scroll in headless builds; drive raw touch swipes instead.
    const x = Math.round(profile.viewport.width / 2);
    const top = Math.round(profile.viewport.height * 0.8);
    for (let guard = 0; guard < 400; guard++) {
      const y = await page.evaluate(() => scrollY);
      if (y >= height - 2) break;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: top }] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: top - i * 45 }] });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(120);
    }
  } else {
    // Realistic continuous wheel scroll through the whole page (telemetry-style gesture).
    await cdp.send("Input.synthesizeScrollGesture", {
      x: Math.round(profile.viewport.width / 2),
      y: Math.round(profile.viewport.height / 2),
      yDistance: -height,
      speed: 1400,
      gestureSourceType: "mouse",
      preventFling: true,
    });
  }
  const seconds = (Date.now() - t0) / 1000;
  const data = await page.evaluate(() => {
    window.__recording = false;
    return { frames: window.__frames, loaf: window.__loaf, y: scrollY, hud: document.querySelector("[role=status]")?.textContent };
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();

  const iv = data.frames.slice(1).map((t, i) => t - data.frames[i]);
  const span = (data.frames.at(-1) - data.frames[0]) / 1000;
  const dropped = iv.reduce((n, d) => n + Math.max(0, Math.round(d / 16.667) - 1), 0);
  return {
    profile: name,
    scrolledPx: Math.round(data.y),
    seconds: Math.round(seconds * 10) / 10,
    frames: data.frames.length,
    avgFps: Math.round((iv.length / span) * 10) / 10,
    p50Ms: Math.round(pct(iv, 0.5) * 10) / 10,
    p95Ms: Math.round(pct(iv, 0.95) * 10) / 10,
    p99Ms: Math.round(pct(iv, 0.99) * 10) / 10,
    maxMs: Math.round(Math.max(...iv) * 10) / 10,
    droppedFrames: dropped,
    droppedPct: Math.round((dropped / (iv.length + dropped)) * 1000) / 10,
    longAnimationFrames: data.loaf.length,
    hudAfter: data.hud,
  };
}

async function inpTest(browser, name, profile) {
  const { ctx, page, cdp } = await newPage(browser, profile);
  await page.goto(URL_, { waitUntil: "load" });
  await waitReady(page);
  await page.waitForTimeout(1000);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const tap = async (locator) => {
    if (profile.hasTouch) await locator.tap();
    else await locator.click();
    await page.waitForTimeout(700);
  };
  // Nav links (smooth anchor scroll), work section interactions, copy-to-clipboard, keyboard.
  await tap(page.locator('a[data-nav="work"]'));
  await page.waitForTimeout(1500);
  await tap(page.locator('a[data-nav="craft"]'));
  await page.waitForTimeout(1500);
  await tap(page.locator('a[data-nav="contact"]'));
  await page.waitForTimeout(1500);
  await tap(page.getByRole("button", { name: /copy/i }));
  await tap(page.getByRole("button", { name: /copy/i }));
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
  }
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(500);
  const events = await page.evaluate(() => window.__events);
  await ctx.close();
  const byId = new Map();
  for (const e of events) byId.set(e.id, Math.max(byId.get(e.id) ?? 0, e.duration));
  const durations = [...byId.values()];
  return { profile: name, interactions: durations.length, inpMs: durations.length ? Math.max(...durations) : 0, all: durations };
}

async function readyTest(browser, name, profile, cpu) {
  const times = [];
  for (let i = 0; i < REPS; i++) {
    const { ctx, page, cdp } = await newPage(browser, profile);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 40,
      downloadThroughput: (10 * 1024 * 1024) / 8,
      uploadThroughput: (5 * 1024 * 1024) / 8,
    });
    if (cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await page.goto(URL_, { waitUntil: "commit" });
    const ready = await waitReady(page);
    const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1);
    times.push({ ready: Math.round(ready), fcp: Math.round(fcp) });
    await ctx.close();
  }
  return {
    profile: name,
    cpuThrottle: cpu,
    network: "10 Mbps / 40 ms RTT, cache disabled",
    medianReadyMs: median(times.map((t) => t.ready)),
    maxReadyMs: Math.max(...times.map((t) => t.ready)),
    medianFcpMs: median(times.map((t) => t.fcp)),
    runs: times,
  };
}

const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: CHROME, args: ARGS });
const results = { scroll: [], inp: [], ready: [] };
for (const [name, profile] of Object.entries(PROFILES)) {
  results.ready.push(await readyTest(browser, name, profile, 1));
  results.ready.push(await readyTest(browser, name, profile, 4));
  results.scroll.push(await scrollTest(browser, name, profile));
  results.inp.push(await inpTest(browser, name, profile));
}
await browser.close();
server.close();
console.log(JSON.stringify(results, null, 2));
writeFileSync(`${OUT}/runtime-results.json`, JSON.stringify(results, null, 2));
