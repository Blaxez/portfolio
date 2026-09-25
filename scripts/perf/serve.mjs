// Static server for the export: serves ../../out under /portfolio with gzip, like GitHub Pages.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../out/", import.meta.url));
const BASE = "/portfolio";
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".avif": "image/avif",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".svg", ".txt", ".json"]);
const cache = new Map();

export function serve(port = PORT) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (url.pathname === "/" || url.pathname === BASE) {
        res.writeHead(302, { location: `${BASE}/` }).end();
        return;
      }
      if (!url.pathname.startsWith(`${BASE}/`)) {
        res.writeHead(404).end();
        return;
      }
      let rel = normalize(decodeURIComponent(url.pathname.slice(BASE.length))).replace(/^(\.\.[/\\])+/, "");
      if (rel.endsWith("/")) rel += "index.html";
      let file = join(ROOT, rel);
      try {
        if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      } catch {
        file = `${file}.html`;
      }
      const ext = extname(file);
      let body = await readFile(file);
      const headers = {
        "content-type": TYPES[ext] ?? "application/octet-stream",
        "cache-control": rel.includes("/_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=600",
      };
      if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) {
        if (!cache.has(file)) cache.set(file, gzipSync(body, { level: 9 }));
        body = cache.get(file);
        headers["content-encoding"] = "gzip";
        headers.vary = "accept-encoding";
      }
      res.writeHead(200, headers).end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await serve();
  console.log(`http://127.0.0.1:${PORT}${BASE}/`);
}
