# Portfolio Audit — `master` @ fe76d59 → fixed

The original audit of the site as deployed from `master` is below. Every item has now been addressed on this branch **without replacing the design**: the same sections, hero laser, mascot and dark look, fixed and upgraded. Items marked ✅ are fixed; notes say how.

## Before → after (measured, Lighthouse 12.8, median of 3)

| Metric | Before (mobile / desktop) | After (mobile / desktop) |
| --- | --- | --- |
| Performance | 43 / 53 | **44 / 61** — with considerably more 3D (see note) |
| Accessibility | 87 / 87 | **100 / 100** |
| Best Practices / SEO | 96 / 100 | 96 / 100 (the only console errors are from this sandbox blocking the GitHub API) |
| CLS | 0.007 / 0.04–0.07 | **0 / 0** |
| LCP as painted (observed) | preloader counter after ~3 s | **first paint (0.8 s)** — headline text is never hidden |
| Initial JS (gzip) | 373 KB (three.js in the initial bundle) | **259 KB** (three.js lazy-loaded per section) |
| Hero image | 1.5 MB PNG | **22 KB** WebP (7 KB on phones) |
| Skills-section scroll | **0 px** (trapped) | wheel +1200 px, touch +705 px |
| DOM/motion layer scroll @ 4× CPU (WebGL off) | — | 48.6 fps (p50 16.7 ms) |

> **Measurement note:** this container has no GPU, so WebGL runs in SwiftShader on the CPU.
> - **Blocking time and Performance score:** WebGL context creation and canvas read-back land on the main thread. That inflates Lighthouse's simulated blocking time and caps the Performance score, which is why the score barely moves even though real paint is at 0.8 s and CLS is 0.
> - **What limits it on real devices:** on real hardware, GPU work is off the main thread. The main-thread cost is the DOM/motion layer: 48.6 fps at 4× CPU throttle here, before any GPU.

## P0 — Broken functionality

- [x] ✅ **Scroll trap in Skills** — OrbitControls removed; the canvas has `pointer-events: none`; pointer interaction is read from window events (particles repel from the cursor). Verified: wheel and touch scroll straight through. Mouse-wheel and touch-swipe over the full-screen Skills section scroll the page **0 px**. The cause is OrbitControls with `enableZoom = true` capturing wheel events and setting `touch-action: none` on a canvas that covers the whole section. On phones, visitors can't get past this section. `src/lib/SkillsParticleSystem.js:103-110`, `src/components/Skills.jsx:125`
- [x] ✅ **Contact form** — validates, focuses the first error, and has a spam honeypot and sending/sent/error states. It posts JSON to `NEXT_PUBLIC_FORM_ENDPOINT` (e.g. Formspree) when set; otherwise it opens a pre-filled email. Previously: the form silently discarded messages. `onSubmit={(e) => e.preventDefault()}` is all there is: no backend, no mailto, no success or error state. Visitors believe they've sent a message. `src/components/Contact.jsx:231-289`
- [x] ✅ **Hero CTAs** — "Get in Touch" scrolls to Contact. The second button is "View My Work" and becomes "Download CV" automatically once `SITE.cvPath` is set. Previously the CTAs were wrong:
  - "Get in Touch" has no handler. `src/components/Hero.jsx:200`
  - "Download CV" scrolls to Contact instead of downloading, and there is no CV file in the repo. `Hero.jsx:161-164, 205-211`
- [x] ✅ **Social links** — real GitHub/LinkedIn everywhere, placeholder Twitter/Instagram removed, all icon links labelled (`src/lib/site.js` is the single source). Previously these were placeholders:
  - Menu GitHub → `https://github.com` and LinkedIn → `https://linkedin.com`. `src/components/Navbar.jsx:65-66`
  - Contact card Twitter → `https://twitter.com` and Instagram → `https://instagram.com`. `Contact.jsx:168-173`
- [x] ✅ **Light theme** — `@custom-variant dark` follows the toggle; one set of theme tokens; the hero, Skills and Strengths are deliberate always-dark "stage" sections with correct text; a pre-paint script means no theme flash; dark is the default unless the visitor chooses light. Previously broken: `ThemeProvider.jsx:36-39` picks light when the OS isn't dark.
  - Hero bio is white on a light background: `.hero-content p { color: rgba(255,255,255,.8) }`. `src/app/globals.css:240`
  - Nav brand text disappears over the (still dark) hero: `mix-blend-difference` with `--inverse: #000`. `Navbar.jsx:81`
  - Project cards render black-on-black. Tailwind v4's `dark:` variant follows the **OS setting**, not the `.dark` class, because there is no `@custom-variant dark` in `globals.css`. `Projects.jsx:18, 30`
  - The Skills canvas stays black, so the light gradient fades become grey bands. Strengths/Metrics hardcode `bg-black/40`, `border-white/10`, `text-white`, and canvases hardcode `#60a5fa`.
  - Theme flash: `<html class="dark">` is hardcoded and the real theme is applied only after hydration. `src/app/layout.js:40`
- [x] ✅ **Projects** — no invented fallback (loading skeletons, or GitHub links on error). Repos are curated by stars, description and recency; "Live" links only come from `homepage` or real GitHub Pages; each card shows the repo's own GitHub social preview image, its description, language, stars and topics. Previously it could show fake content:
  - When the unauthenticated GitHub API fails (limit: 60 requests/hour per visitor IP), visitors see invented projects ("AI Chat App", "3D Game Engine", …) with stock photos, next to a "temporarily unavailable" note. `src/hooks/useProjects.js:6, 65`
  - "Live demo" links are guessed as `owner.github.io/repo` for every repo without a homepage, so most of them 404. `src/services/githubService.js:37-45`
  - When the API does work, every non-fork repo is listed (no curation), and `description` is never displayed.
- [x] ✅ **Project titles are no longer clipped** — the card was rebuilt. Previously: at the bottom: `translate-y-4` inside an `overflow-hidden` wrapper. `Projects.jsx:34`

## P0 — Performance

- [x] ✅ **Intro** — a CSS-only brand curtain, once per session, skipped for reduced motion. The page renders and paints beneath it, so it never delays LCP. Previously a fake preloader ran on every visit: A random 0→100 % counter hides the whole page (`visibility: hidden`) for ~2.5–3.5 s. This is the main reason mobile LCP is 12 s; on desktop the LCP element *is* the counter. `src/app/page.js:17-40`, `src/components/Preloader.jsx`
- [x] ✅ **Render loops pause off-screen.** Every scene uses IntersectionObserver + visibility pause and async shader compile. DotGrid now touches only the dots near the pointer and isn't created on touch devices. The terminal timer runs only in view. Previously:
  - Skills: 40,000 particles plus UnrealBloom via `setAnimationLoop`, never paused. `SkillsParticleSystem.js:18, 123`
  - Strengths: full-screen 5-octave fbm shader, never paused. `WebGLFlowSection.jsx:113-131`
  - DotGrid (hero): pauses only when the tab is hidden, not when scrolled away. `src/lib/DotGridBackground.js:127-130`
  - The terminal-log timer and the marquee also run forever.
  - Only LaserFlow pauses correctly (IntersectionObserver + visibility).
- [x] ✅ **three.js lazy-loaded** per section; the hero laser starts after first paint. Previously three.js was in the initial bundle (373 KB gzip of initial JS). It should be lazy-loaded when the section nears the viewport.
- [x] ✅ **Mascot served as WebP at 22 KB / 7 KB** via `srcset`. Previously 1.5 MB (1024² PNG) displayed at 120–240 px. `images.unoptimized: true` means no resizing; ~30–40 KB as WebP at 2× would be enough. `Hero.jsx:173-177`, `next.config.mjs:11`
- [x] ✅ **Grain** — static, plain opacity, no blend mode. Previously a full-screen grain overlay with `mix-blend-mode: overlay` above everything forces a full-viewport blend on every frame. `layout.js:44-52`

## P1 — Accessibility

- [x] ✅ **Form fields have associated labels,** with `aria-invalid` and error messages. Previously they had no accessible labels. The `<label>`s aren't associated, and the inputs have no `id` or `name`. `Contact.jsx:236-277`
- [x] ✅ **Icon links have accessible names.** Previously icon-only social links had none. `Contact.jsx:161-173`
- [x] ✅ **Keyboard-operable** — About rows are real `<button>`s with `aria-expanded`/`aria-controls`; Strengths items are buttons; project cards are links. Previously keyboard users couldn't open About rows, Strengths items or Project cards. They are clickable `<div>`s (tabIndex −1, verified), and the content is revealed on hover only.
- [x] ✅ **Contrast** — AA-checked tokens (Lighthouse a11y 100). Previously 19–21 colour-contrast failures, including:
  - BrandTicker text at `opacity-20` (1.57:1)
  - The "ABOUT ME" heading at 10 % opacity (1.23:1)
  - Accent text in light mode (2.94:1)
  - Counters and hints at `opacity-25`
  - The "Projects temporarily unavailable" note (2.28:1)
- [x] ✅ **Menu** — `aria-expanded`/`aria-controls`, a dialog role, Escape closes, focus moves in and is trapped, then returns to the toggle. Previously: no `aria-expanded`/`aria-controls`, no Escape to close, focus isn't moved into the overlay or trapped. `Navbar.jsx:104-116`
- [x] ✅ **Heading order** — one consistent `SectionHeading`; stats are no longer headings; the Skills heading is static. Previously:
  - `h4` "Get In Touch" comes before its `h2`.
  - The Skills `h2` changes text every 4 s.
  - Stat values ("4+", "24/7") are `h3`s.
  - The About heading is announced as "ABOUTME".
- [x] ✅ **Reduced motion honoured** everywhere: no curtain, scrubs, autoplay or smooth scroll, and WebGL renders a still frame. Previously no `prefers-reduced-motion` support anywhere: preloader, marquee, particles, laser, shader, terminal log.
- [x] ✅ **Copy button always visible,** with a live-region result and a failure message. Previously the copy-email control: the "COPY" hint appears only on hover, so touch users never see it, and a clipboard failure is unhandled. `Contact.jsx:69-73, 143`

## P2 — UX & content

- [x] ✅ **Navbar** — desktop links with active state; a background once scrolled; hides on scroll-down. Previously:
  - No section links on desktop: primary navigation is hidden behind the hamburger.
  - No background, so content scrolls under and collides with the logo (verified `rgba(0,0,0,0)`).
- [x] ✅ **Identity** — SM monogram and one role line, both from `src/lib/site.js`. Previously the identity was inconsistent:
  - Monogram "SD" for Santosh Maurya, "SANTOSH.DEV" in the preloader, "SANTOSH. / DEVELOPER" in the nav.
  - Role is written three ways: "Full Stack Developer", "Full-Stack Developer | AI & ML Innovator | Game Developer", "Developer".
- [x] ✅ **About** — click-to-open accordion (hover only highlights), no fixed heights, no stock photos. Added a scroll-lit manifesto and the 3D holographic orb. Previously:
  - Rows expand on hover, so they jump under the cursor as it moves.
  - Collapsed rows are a fixed 140 px, leaving large empty gaps on mobile.
  - Background photos are unrelated Unsplash stock. `About.jsx:56-69`
- [x] ✅ **Skills** — autoplay stays within the chosen filter, pauses on hover/focus/off-screen and has a pause button (WCAG 2.2.2); the logo assembles and disperses with scroll. Previously:
  - Autoplay ignores the category filter: it cycles through all 25 skills, so the active pill vanishes from a filtered list. `Skills.jsx:60`
  - The hint "Scroll · Click" invites the trap.
  - BrandTicker repeats the same tech list.
- [x] ✅ **Projects** — the pinned gallery's height is derived from the card count; phones get a native swipe carousel (no hijack); cards are real links. Previously:
  - The section is a fixed `300vh` whatever the project count, so horizontal speed varies wildly. `Projects.jsx:147`
  - Horizontal swipes are hijacked with `preventDefault` + `scrollBy`. `Projects.jsx:122-124`
  - The "Details" affordance opens nothing.
  - Index numbers sit at 3 % opacity and are invisible. `Projects.jsx:62`
- [x] ✅ **Metrics** — honest figures (4+ years, 48 h prototype and 2nd place, 25+ technologies, Mumbai/IST); count-ups; section id + heading; timers only run in view. Previously:
  - Shows fabricated "live" data (a randomly generated always-rising growth chart, a fake terminal log) and "24/7 availability".
  - It has no heading or `id` and isn't in the nav.
  - The terminal `setInterval` runs forever.
- [x] ✅ **Contact** — the clock shows real IST; the accent variable is defined; filler removed; phone is optional; the year is dynamic; a real `<footer>`; aligned layout. Previously:
  - The clock shows the *visitor's* local time labelled "IST" (verified with a UTC visitor). `Contact.jsx:52-60, 123`
  - `rgba(var(--acc-rgb), …)` uses an undefined variable, so the hologram glow never renders. `Contact.jsx:102`
  - Filler: "ID: 884-299".
  - The phone field adds friction.
  - `© 2025` is hardcoded. `Contact.jsx:296`
  - The whole section is a `<footer>`.
  - The card floats misaligned under the text column.
- [x] ✅ **Hero** — a scrim keeps the bio readable over the laser on small screens; tighter copy; the mascot is seated before it becomes visible, then drops in. Previously:
  - The laser beam runs through the bio text on mobile and tablet.
  - The bio is a single 60-word block.
  - The mascot is positioned by JS after load, so it pops in (CLS 0.04–0.07).
- [x] ✅ **Privacy:** the WhatsApp number was public in the menu and contact card. → Removed from `SITE.socials` (menu, contact card and footer all read from it).
- [x] ✅ **ScrollPersistence removed** (native restoration + Lenis). Previously ScrollPersistence restores the previous scroll position 100 ms after load, which fights hash links and the preloader. It also writes `sessionStorage` on every scroll event. `src/components/hooks/useScrollPersistence.js`

## P3 — Visual consistency

- [x] ✅ **Type:** Anton (display), Space Grotesk (UI/body), JetBrains Mono (labels); Playfair dropped. Previously four voices: four voices. Anton (hero only), Space Grotesk (body), Playfair Display (About descriptions only), and the OS default monospace (differs per platform).
- [x] ✅ **Accent colour:** `--acc`/`--acc-2`/`--acc-rgb` tokens; canvases read them. Previously several blues were used interchangeably: `#38bdf8`, `#3b82f6`, `#4f46e5`, `#60a5fa`, `rgba(96,165,250)` and a green status colour are used interchangeably. There is no single token, and canvases hardcode the dark-mode blue.
- [x] ✅ **Section headers:** one `SectionHeading` everywhere (index · eyebrow · split title). Previously five different patterns: a giant ghost "ABOUT ME" + `[ BACKGROUND ]`; `[ LANGUAGES ]`; "WHAT I BRING"; "• FEATURED PROJECTS // SCROLL TO EXPLORE"; and an `h4` "GET IN TOUCH".
- [x] ✅ **Containers:** one container (1440 px) in every section. Previously: `max-w-7xl` (About), 1600 px (Strengths/Metrics), `95vw` (Contact), full-bleed `px-4/12` (Projects). Section left edges don't line up.
- [x] ✅ **Vertical rhythm:** a shared `section-y`. Previously many heights and paddings were in use: `py-10/16`, `h-screen`, `min-h-[100svh]`, `300vh` and `min-h-screen` are all in use.
- [x] ✅ **Buttons:** two variants (`btn-primary`, `btn-ghost`). Previously: four styles (glowing gradient pills, a flat square "Send", outline pills, `rounded-lg` chips). Corner radii mix full, xl, lg, sm and 0.

## P4 — Code health

- [x] ✅ **Dead files removed.** Kept: `pfp.png`, `ndlogo.svg` and the source `mascott-v2.png`, in case you want them. Previously 19 unused files in `public/` (~3.2 MB), including a duplicate `mascott.png` (1.5 MB), `pfp.png` (928 KB), `ndlogo.svg` (428 KB), html2canvas, liquidGL, jquery.ripples, duplicated laser/particle scripts and the Next template SVGs.
- [x] ✅ Also removed: `src/lib/html2canvas.min.js`, `jquery.ripples-min.js`, `image.png`, `src/app/page.module.css`, and the dependencies `html2canvas` and `@gsap/react`.
- [x] ✅ **Favicon** — moved to `src/app/favicon.ico`, so the basePath is applied (`/portfolio/favicon.ico`). Previously `/favicon.ico` ignored `basePath`, so it 404s on GitHub Pages under `/portfolio`. `layout.js:32`
- [x] ✅ **OpenGraph/Twitter metadata added.** Previously there was none, so shared links get bare previews.
- [x] ✅ **Skills engine `destroy()`** releases the context and listeners. Previously the Skills engine was never destroyed on unmount (WebGL context and resize listener leak). `Skills.jsx:71-94`
- [x] ✅ **Hook-rule workarounds replaced** with a module-level isomorphic layout effect. Previously: a `getLayoutEffect` alias (`Hero.jsx:100`) and `eslint-disable` for exhaustive-deps / set-state-in-effect.
- [x] ✅ **Easing is now a real token** (`--ease-out`). Previously `ease-[0.16,1,0.3,1]` generated no CSS (it is missing `cubic-bezier()`), so the intended easing is ignored. `About.jsx:57`
- [x] ✅ **README** rewritten. Previously the README is still the create-next-app default.

---
