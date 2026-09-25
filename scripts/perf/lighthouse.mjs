// Lighthouse (mobile + desktop presets) against the static export. Median of N runs.
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";
import { writeFileSync } from "node:fs";
import { serve } from "./serve.mjs";

const RUNS = Number(process.env.RUNS ?? 3);
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const URL_ = "http://127.0.0.1:4175/portfolio/";
const OUT = process.env.OUT ?? ".";
const server = await serve(4175);

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function run(formFactor) {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME,
    chromeFlags: ["--headless=new", "--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const flags = { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] };
    const result = await lighthouse(URL_, flags, formFactor === "desktop" ? desktopConfig : undefined);
    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

const summary = {};
for (const ff of ["mobile", "desktop"]) {
  const rows = [];
  for (let i = 0; i < RUNS; i++) {
    const lhr = await run(ff);
    const a = lhr.audits;
    rows.push({
      perf: Math.round(lhr.categories.performance.score * 100),
      a11y: Math.round(lhr.categories.accessibility.score * 100),
      bp: Math.round(lhr.categories["best-practices"].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      fcp: a["first-contentful-paint"].numericValue,
      lcp: a["largest-contentful-paint"].numericValue,
      cls: a["cumulative-layout-shift"].numericValue,
      tbt: a["total-blocking-time"].numericValue,
      si: a["speed-index"].numericValue,
    });
    if (i === 0) {
      writeFileSync(`${OUT}/lh-${ff}.json`, JSON.stringify(lhr));
      const failing = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "manual" && x.scoreDisplayMode !== "notApplicable");
      console.log(`[${ff}] audits < 0.9:`, failing.map((x) => `${x.id}(${x.score})${x.displayValue ? " " + x.displayValue : ""}`).join(", ") || "none");
    }
    console.log(`[${ff}] run ${i + 1}:`, JSON.stringify(rows.at(-1), (k, v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v)));
  }
  const med = Object.fromEntries(Object.keys(rows[0]).map((k) => [k, median(rows.map((r) => r[k]))]));
  summary[ff] = med;
}
console.log("MEDIAN", JSON.stringify(summary, null, 2));
writeFileSync(`${OUT}/lighthouse-summary.json`, JSON.stringify(summary, null, 2));
server.close();
