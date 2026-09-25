# Portfolio Redesign — Plan & Design System

Status: **implemented** on `claude/magical-rubin-ailsw8` (full rewrite; nothing from the previous component tree retained). Measured results are in §5; content still to supply is in §6.

## 1. Decisions (confirmed)

| Area | Decision |
| --- | --- |
| Palette | Graphite + single signal accent, dark-only |
| Hero 3D | Render-pipeline deconstruction of the Utah teapot, tessellated at runtime from Newell's 32 bicubic Bézier patches (no model download) |
| Type | Geist (display + body) · Geist Mono (labels, metadata, HUD) |
| Projects | Typed seed data in `src/content/projects.ts`, flagged `seed: true` until replaced |
| Stack | Next.js 16 App Router (static export → GitHub Pages), TypeScript, Tailwind v4 tokens, raw WebGL2 in a Web Worker, GSAP ScrollTrigger |

## 2. Narrative (scroll beats)

| # | Beat | Purpose | Scroll / interaction |
| --- | --- | --- | --- |
| 00 | **Intro** | Name, one-line positioning, live render HUD (doubles as 3D loading state) | Line-mask reveal on load (CSS); scrubbed exit: headline drifts up, teapot slides to center |
| 01 | **Craft** — "How a frame gets made" | Identity through the pipeline: Geometry → Normals → Depth → Lighting → Composite, each paired with how I build software | Sticky 5×100vh; scroll scrubs pass-to-pass wipe (signal scanline cuts the mesh); pointer steers key light + tilt |
| 02 | **Toolchain & record** | Graphics stack vs product stack, education, hackathon result | Viewport-entry staggered reveals; row hover states |
| 03 | **Work** | 3 case studies: problem → approach → outcome, stack, links | Per-chapter sticky meta column; cover reveal + inner parallax scrubbed |
| 04 | **Contact** | Closing CTA; teapot returns in final composite as bookend | Copy-to-clipboard email with live feedback; scrubbed headline; live Mumbai clock |

## 3. Design system

### Color tokens
| Token | Hex | Use | Contrast on `bg` |
| --- | --- | --- | --- |
| `bg` | `#0B0B0C` | Page | — |
| `surface` | `#141416` | Raised panels, covers | — |
| `line` | `#26262A` | 1px hairlines only | decorative |
| `ink` | `#EDEDEA` | Primary text | 16.8 : 1 |
| `muted` | `#8A8A90` | Secondary text, metadata | 5.7 : 1 |
| `signal` | `#C6FF3D` | State only: focus, active, progress, scanline, primary CTA fill | 16.7 : 1 |

Rule: `signal` never colors body copy or decoration; if it's lime, it's interactive or live.

### Type scale (fluid)
| Role | Spec |
| --- | --- |
| Display | Geist 600 · `clamp(3rem, 11vw, 10rem)` · lh 0.9 · −0.045em |
| Statement | Geist 600 · `clamp(2.75rem, 7.5vw, 7.5rem)` · lh 0.95 · −0.04em |
| Title | Geist 500 · `clamp(2.25rem, 5.5vw, 5rem)` · lh 1 · −0.03em |
| Heading | Geist 500 · `clamp(1.5rem, 2.4vw, 2.25rem)` · −0.02em |
| Lead | Geist 400 · `clamp(1.125rem, 1.6vw, 1.5rem)` · lh 1.45 |
| Body | Geist 400 · 1.0625rem · lh 1.6 |
| Label | Geist Mono 400 · 0.75rem · +0.08em · uppercase |

### Layout & spacing
- 4px base scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- 12-col grid ≥ 1024px, 6-col tablet, 4-col phone. Gutter `clamp(16px, 2vw, 32px)`, page margin `clamp(16px, 4vw, 64px)`, max width 1440px.
- Section rhythm: `clamp(6rem, 12vw, 12rem)` block padding.
- Sharp corners; pills (999px) only for status chips. No shadows, no gradients in chrome.

### Motion tokens
| Token | Value | Use |
| --- | --- | --- |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State changes |
| `dur-micro` | 150ms | Hover, press |
| `dur-state` | 300ms | Toggles, copy feedback |
| `dur-reveal` | 800ms | Viewport entry |
| scrub lag | 0.4s | All ScrollTrigger scrubs |

Motion grammar — applied everywhere, no exceptions:
- **Scroll → scrub** (reversible, tied to position).
- **Viewport entry → one-shot reveal** (IntersectionObserver + CSS, compositor-only).
- **Hover → ≤150ms** state change. **Click → immediate** feedback + `aria-live` message.
- Only `transform` / `opacity` animate. `prefers-reduced-motion` → final states, no scrubs, 3D stops auto-rotating and passes switch discretely.

### Components
`SectionHeader` (mono index + title, used by every beat) · `Button` (primary = signal fill, ghost = hairline) · `TextLink` (signal underline sweep) · `Chip` · `Stat` · `StageRail` · `RenderHud`. Hit targets ≥ 44px; focus ring 2px `signal`, 3px offset.

## 4. Performance architecture

1. **Server components by default**; 7 small client islands (3D stage, render HUD, live triangle count, choreography, reveal observer, email copy, clock).
2. **WebGL2 renderer runs in a Web Worker** via `OffscreenCanvas` — zero GL work on the main thread; automatic main-thread fallback where unsupported.
3. **Quality tiers** (tessellation / DPR / shader path) chosen from cores, memory, pointer type, Save-Data; runtime **adaptive DPR** from frame time. Mobile gets lower tessellation, not a disabled scene.
4. **GSAP lazy-loaded** after hydration; pinning via CSS `position: sticky` (no JS pin-spacers → no CLS).
5. **LCP = hero headline text**, no preloader, no above-the-fold images. Fonts self-hosted, variable, `swap` with metric-matched fallbacks.
6. Render loop pauses when canvas is off-screen or tab hidden.

## 5. Exit criteria — measured results

Final build, measured with the harness in `scripts/perf/` (Chromium 141 headless). Medians, with worst run where it matters.

| Criterion | Target | Measured | Pass |
| --- | --- | --- | --- |
| Lighthouse Performance, mobile | ≥ 90 | **99** (5 runs: 98–100) | ✅ |
| Lighthouse Performance, desktop | ≥ 95 | **100** (5 runs: 100) | ✅ |
| LCP | < 2.5 s | **1.36 s** mobile · **0.33 s** desktop | ✅ |
| CLS | < 0.1 | **0** (both) | ✅ |
| INP | < 200 ms | **72 ms** mobile · **56 ms** desktop (worst interaction, 4× CPU) · TBT 103 ms / 0 ms | ✅ |
| Scroll fps, 4× CPU throttle | sustained 60 | **60.0 fps** mobile (0 % dropped) · **59.1 fps** desktop (p95 16.8 ms, 1.4 % dropped) | ✅ |
| 3D initial load @ 10 Mbps | < 1.5 s | **0.57 s** mobile · **0.59 s** desktop (worst 0.72 s) | ✅ |
| ↳ same, with 4× CPU on top | (stress) | 1.22 s mobile · 1.20 s desktop (worst 1.51 s) | ✅ median |
| Initial JS (gzip) | < 250 KB | **130.8 KB** (+65.5 KB lazy: GSAP, worker, fallback) | ✅ |
| Lighthouse Accessibility | ≥ 95 | **100** (both) | ✅ |

**Method**
- Lighthouse 12.8 (default mobile + desktop presets, simulated throttling) against the static export, served gzipped under `/portfolio`.
- INP is not reported by Lighthouse navigation runs. It was measured with the Event Timing API: worst interaction across nav clicks, copy-to-clipboard ×2 and keyboard tabbing, at 4× CPU.
- Scroll fps is the main-thread rAF cadence during a continuous full-page scroll (wheel gesture on desktop, raw touch swipes on mobile) at 4× CPU, with the teapot rendering live. The desktop run is forced onto the high LOD tier.
- 3D ready runs from navigation start to the first rendered frame (`stage:ready` mark), cache disabled, 10 Mbps / 40 ms RTT.

**Environment caveat: GPU.** The measurement host has no GPU. Two results follow from that:
1. **Compositing mode.** Scroll and INP were measured with Chrome's software raster and compositing, which is what Chrome uses on GPU-less machines. Forcing GPU raster through SwiftShader instead saturates the emulated-GPU thread even for a static text page (site with 3D off: 33 fps; static control: 60 fps). That run measures the host, not the page. `scripts/perf/trace-scroll.mjs` reproduces both modes.
2. **WebGL frame rate.** The teapot's own frame rate cannot be validated here, because WebGL runs in SwiftShader on the CPU: 12 fps on the desktop high tier, 52 fps on the mobile medium tier. It stays off the main thread either way, which is why page scrolling holds 60 fps regardless. On real hardware, 12k triangles with one pass is far below any mid-tier GPU budget, and adaptive DPR sheds resolution if frames exceed 20 ms.

**What it took**
- *Hydration after paint.* LCP was 2.9 s at first. On a cold start the first frame is presented at ~300 ms, after all hydration JS had run, so Lighthouse's simulation charged that JS to LCP. `scripts/paint-first.mjs` now requests the chunks after the `first-contentful-paint` entry, which brought mobile LCP to 1.36 s.
- *Worker prewarm.* The worker starts at module evaluation instead of on mount, so its fetch, context creation and shader compile overlap hydration. This took ~130 ms off 3D-ready at 4× CPU.

## 6. Content you need to supply

- [ ] Replace the 3 seed case studies in `src/content/projects.ts` (title, year, role, problem / approach / outcome, stack, metrics, links).
- [ ] Project cover images → `public/work/<slug>.avif` (1600×1000, set `cover` in the data file).
- [ ] CV PDF → `public/cv.pdf` (the CV link renders only once `site.cvPath` is set).
- [ ] Confirm headline copy in `src/content/site.ts`.
