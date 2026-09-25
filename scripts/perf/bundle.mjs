// Initial-route JS budget: gzip size of every script the page loads on its own
// (the post-paint hydration list + any <script src> left in the HTML), excluding
// noModule legacy polyfills that modern browsers never download.
import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const OUT = new URL("../../out/", import.meta.url).pathname;
const html = readFileSync(join(OUT, "index.html"), "utf8");
const local = (src) => join(OUT, src.replace(/^\/portfolio\//, ""));
const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;

const deferred = JSON.parse(html.match(/var s=(\[\[.*?\]\]),done=/)?.[1] ?? "[]").map(([src]) => src);
const tags = [...html.matchAll(/<script(?![^>]*noModule)[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
const initial = [...new Set([...deferred, ...tags])];
let total = 0;
for (const src of initial) {
  const size = gz(local(src));
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(6)} KB  ${src}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(6)} KB  TOTAL initial JS (gzip)`);
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].reduce((s, m) => s + m[1].length, 0);
console.log(`${(gzipSync(html).length / 1024).toFixed(1).padStart(6)} KB  index.html (gzip, includes ${(inline / 1024).toFixed(1)} KB raw inline RSC/bootstrap)`);

const chunks = join(OUT, "_next/static/chunks");
const lazy = readdirSync(chunks).filter((f) => f.endsWith(".js") && !initial.some((s) => s.endsWith(f)) && !html.includes(`${f}" noModule`));
const lazyTotal = lazy.reduce((s, f) => s + gz(join(chunks, f)), 0);
console.log(`${(lazyTotal / 1024).toFixed(1).padStart(6)} KB  lazy chunks (GSAP, render worker, main-thread fallback): ${lazy.length} files`);
