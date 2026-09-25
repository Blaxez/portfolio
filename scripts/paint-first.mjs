// Post-export step: request hydration scripts after the first frame is painted.
//
// The HTML is fully server-rendered and readable without JS, so the first paint
// (and LCP, the hero headline) should never wait on ~130 KB of framework code.
// Next.js emits its chunks as <script async> in <head>; on slow devices they
// download and execute before the first frame. This defers them until the
// first-contentful-paint entry is observed.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "_next" ? [] : htmlFiles(p);
    return name.endsWith(".html") ? [p] : [];
  });

const SCRIPT = /<script src="([^"]+\.js)"(?: id="([^"]+)")? async=""><\/script>/g;
const SCRIPT_PRELOAD = /<link rel="preload" as="script"[^>]*>/g;

let touched = 0;
for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, "utf8");
  const scripts = [];
  let next = html.replace(SCRIPT, (_, src, id) => {
    scripts.push(id ? [src, id] : [src]);
    return "";
  });
  if (scripts.length === 0) throw new Error(`paint-first: no async scripts found in ${file} — Next.js output format changed?`);
  next = next.replace(SCRIPT_PRELOAD, "");

  // Load once the first contentful paint has been *presented* (paint timing), not merely
  // scheduled: on a cold start the GPU process can present frames well after rAF fires.
  // Fallbacks: hidden documents load immediately; no paint entry within 2.5s loads anyway.
  const loader =
    `<script>(function(){var s=${JSON.stringify(scripts)},done=false;function go(){if(done)return;done=true;for(var i=0;i<s.length;i++){var e=document.createElement("script");e.src=s[i][0];e.async=true;if(s[i][1])e.id=s[i][1];document.body.appendChild(e)}}` +
    `if(document.visibilityState==="hidden"){go();return}setTimeout(go,2500);` +
    `var P=window.PerformanceObserver;if(P&&P.supportedEntryTypes&&P.supportedEntryTypes.indexOf("paint")>-1){` +
    `new P(function(l){if(l.getEntriesByName("first-contentful-paint").length)setTimeout(go,0)}).observe({type:"paint",buffered:true})}` +
    `else{requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}})()</script>`;
  if (!next.includes("</body>")) throw new Error(`paint-first: no </body> in ${file}`);
  next = next.replace("</body>", `${loader}</body>`);
  writeFileSync(file, next);
  touched++;
  console.log(`paint-first: ${file.replace(OUT, "out/")} — ${scripts.length} scripts deferred to post-paint`);
}
if (touched === 0) throw new Error("paint-first: no HTML files processed");
