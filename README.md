# Santosh Maurya — Portfolio

A scroll-driven narrative portfolio. The hero is a hand-written WebGL2 renderer, running in a Web Worker, that deconstructs the Utah teapot into its render passes as you scroll: geometry → normals → depth → lighting → composite.

**Stack:** Next.js 16 (App Router, static export) · TypeScript · Tailwind CSS v4 · raw WebGL2 / GLSL ES 3.00 · GSAP ScrollTrigger. Deployed to GitHub Pages under `/portfolio`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/` + `scripts/paint-first.mjs` post-step |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |

Performance harness (isolated deps, never shipped):

```bash
cd scripts/perf && npm install
node bundle.mjs       # initial-route JS budget
node lighthouse.mjs   # Lighthouse mobile + desktop, median of RUNS (default 3)
node runtime.mjs      # 4× CPU scroll fps, INP, 3D-ready @ 10 Mbps
node shot.mjs         # screenshots at scroll stops (OUT=dir STOPS=0,0.2,…)
```

Set `CHROME=/path/to/chrome` if Chromium isn't at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Editing content

| File | Contents |
| --- | --- |
| `src/content/site.ts` | Name, headline, email, links, CV path |
| `src/content/stages.ts` | The five render-pass beats in the Craft section |
| `src/content/about.ts` | Toolchains and record |
| `src/content/projects.ts` | Case studies. Entries with `seed: true` are placeholders: replace them, then set `seed: false`. Dev builds show a SEED badge, and production builds log a warning while any remain |

Project covers default to an inline architecture schematic (`schematic` field). To use an image instead, add `public/work/<slug>.avif` (1600×1000) and set `cover: "/work/<slug>.avif"`.

## Architecture

```
src/
  app/            layout (fonts, metadata), page (beat order), globals.css (design tokens)
  content/        typed copy and data
  components/
    sections/     Hero · Craft · About · Work · Contact (server components)
    stage/        Stage3D (worker host), RenderHud (live stats + loading state)
    motion/       Choreography (GSAP, lazy-loaded), ViewportObserver (reveals, nav spy)
    ui/           SectionHeader, CopyEmail, LocalTime, icons
  gl/
    teapot-data   Newell's 32 Bézier patches
    tessellate    patch → triangle list (quad-diagonal aware) + control cage
    shaders       one program covers all five passes; a model-space scan plane wipes between them
    renderer      DOM-free WebGL2 renderer (worker or main thread), adaptive DPR
    prewarm       starts the worker before hydration
    quality       LOD tiers (tessellation, DPR cap, MSAA, shader lobes)
    bridge        main-thread store: scroll/pointer → renderer, stats → HUD
```

Performance decisions:

- **All content is server-rendered.** Seven small client islands handle interactivity.
- **Rendering runs off the main thread.** The worker uses `OffscreenCanvas` and is started at module evaluation, so it boots in parallel with hydration. Browsers without worker support fall back to the main thread automatically.
- **Hydration waits for first paint.** `scripts/paint-first.mjs` requests Next's chunks once the `first-contentful-paint` entry is observed, so LCP (the hero headline) never waits on framework JS.
- **GSAP loads after hydration.** Pinning uses CSS `position: sticky` (no pin-spacers, no CLS). Only `transform` and `opacity` animate, and scrubbed elements are promoted to their own compositor layers.
- **LOD tiers are picked from device hints,** and the renderer adapts DPR to frame time at runtime. Mobile gets lower tessellation; 3D is not switched off.
- **Degraded modes stay complete.** `prefers-reduced-motion` switches passes discretely, with no scrubs or auto-rotation. With JS off, all content remains readable.

Design system, narrative and measured results: [`docs/REDESIGN_PLAN.md`](docs/REDESIGN_PLAN.md).
