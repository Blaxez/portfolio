# Portfolio Audit — `master` @ fe76d59

Scope: the existing site as deployed from `master`. This lists what to fix; it is not a redesign. Every item was verified in code and, where marked **(verified)**, in a live browser run of the production build.

## Scorecard (measured, Lighthouse 12.8, median of 3)

| Metric | Mobile | Desktop |
| --- | --- | --- |
| Performance | **43** | **53** |
| Accessibility | **87** | **87** |
| Best Practices / SEO | 96 / 100 | 96 / 100 |
| LCP | **12.0 s** | 2.2 s (LCP element is the preloader counter) |
| Total Blocking Time | **~4.1 s** | **~3.9 s** |
| CLS | 0.007 | 0.04–0.07 |
| Initial JS (gzip) | 373 KB (three.js ships in the initial bundle) | |
| Hero image | 1.5 MB PNG (1024×1024) shown at 240 px | |

> Measured in a GPU-less container (WebGL runs on the CPU via SwiftShader). Absolute TBT runs higher than on a real device, but the always-on render loops below are real main-thread work. Unsplash images and the GitHub API were blocked by the sandbox network, so project cards rendered empty here.

---

## P0 — Broken functionality

- [ ] **Scroll trap in Skills (verified).** Mouse-wheel and touch-swipe over the full-screen Skills section scroll the page **0 px**. The cause is OrbitControls with `enableZoom = true` capturing wheel events and setting `touch-action: none` on a canvas that covers the whole section. On phones, visitors can't get past this section. `src/lib/SkillsParticleSystem.js:103-110`, `src/components/Skills.jsx:125`
- [ ] **The contact form silently discards messages.** `onSubmit={(e) => e.preventDefault()}` is all there is: no backend, no mailto, no success or error state. Visitors believe they've sent a message. `src/components/Contact.jsx:231-289`
- [ ] **Hero CTAs are wrong (verified).**
  - "Get in Touch" has no handler. `src/components/Hero.jsx:200`
  - "Download CV" scrolls to Contact instead of downloading, and there is no CV file in the repo. `Hero.jsx:161-164, 205-211`
- [ ] **Placeholder social links (verified).**
  - Menu GitHub → `https://github.com` and LinkedIn → `https://linkedin.com`. `src/components/Navbar.jsx:65-66`
  - Contact card Twitter → `https://twitter.com` and Instagram → `https://instagram.com`. `Contact.jsx:168-173`
- [ ] **Light theme is broken, and it is the default for visitors whose OS is set to light.** `ThemeProvider.jsx:36-39` picks light when the OS isn't dark.
  - Hero bio is white on a light background: `.hero-content p { color: rgba(255,255,255,.8) }`. `src/app/globals.css:240`
  - Nav brand text disappears over the (still dark) hero: `mix-blend-difference` with `--inverse: #000`. `Navbar.jsx:81`
  - Project cards render black-on-black. Tailwind v4's `dark:` variant follows the **OS setting**, not the `.dark` class, because there is no `@custom-variant dark` in `globals.css`. `Projects.jsx:18, 30`
  - The Skills canvas stays black, so the light gradient fades become grey bands. Strengths/Metrics hardcode `bg-black/40`, `border-white/10`, `text-white`, and canvases hardcode `#60a5fa`.
  - Theme flash: `<html class="dark">` is hardcoded and the real theme is applied only after hydration. `src/app/layout.js:40`
- [ ] **Projects can show fake content.**
  - When the unauthenticated GitHub API fails (limit: 60 requests/hour per visitor IP), visitors see invented projects ("AI Chat App", "3D Game Engine", …) with stock photos, next to a "temporarily unavailable" note. `src/hooks/useProjects.js:6, 65`
  - "Live demo" links are guessed as `owner.github.io/repo` for every repo without a homepage, so most of them 404. `src/services/githubService.js:37-45`
  - When the API does work, every non-fork repo is listed (no curation), and `description` is never displayed.
- [ ] **Project titles are clipped** at the bottom: `translate-y-4` inside an `overflow-hidden` wrapper. `Projects.jsx:34`

## P0 — Performance

- [ ] **Fake preloader on every visit.** A random 0→100 % counter hides the whole page (`visibility: hidden`) for ~2.5–3.5 s. This is the main reason mobile LCP is 12 s; on desktop the LCP element *is* the counter. `src/app/page.js:17-40`, `src/components/Preloader.jsx`
- [ ] **Render loops keep running off-screen:**
  - Skills: 40,000 particles plus UnrealBloom via `setAnimationLoop`, never paused. `SkillsParticleSystem.js:18, 123`
  - Strengths: full-screen 5-octave fbm shader, never paused. `WebGLFlowSection.jsx:113-131`
  - DotGrid (hero): pauses only when the tab is hidden, not when scrolled away. `src/lib/DotGridBackground.js:127-130`
  - The terminal-log timer and the marquee also run forever.
  - Only LaserFlow pauses correctly (IntersectionObserver + visibility).
- [ ] **three.js is in the initial bundle** (373 KB gzip of initial JS). It should be lazy-loaded when the section nears the viewport.
- [ ] **Hero mascot is 1.5 MB** (1024² PNG) displayed at 120–240 px. `images.unoptimized: true` means no resizing; ~30–40 KB as WebP at 2× would be enough. `Hero.jsx:173-177`, `next.config.mjs:11`
- [ ] **Full-screen grain overlay** with `mix-blend-mode: overlay` above everything forces a full-viewport blend on every frame. `layout.js:44-52`

## P1 — Accessibility

- [ ] **Form fields have no accessible labels.** The `<label>`s aren't associated, and the inputs have no `id` or `name`. `Contact.jsx:236-277`
- [ ] **Icon-only social links have no accessible name.** `Contact.jsx:161-173`
- [ ] **Keyboard users can't open** About rows, Strengths items or Project cards. They are clickable `<div>`s (tabIndex −1, verified), and the content is revealed on hover only.
- [ ] **19–21 colour-contrast failures,** including:
  - BrandTicker text at `opacity-20` (1.57:1)
  - The "ABOUT ME" heading at 10 % opacity (1.23:1)
  - Accent text in light mode (2.94:1)
  - Counters and hints at `opacity-25`
  - The "Projects temporarily unavailable" note (2.28:1)
- [ ] **Menu:** no `aria-expanded`/`aria-controls`, no Escape to close, focus isn't moved into the overlay or trapped. `Navbar.jsx:104-116`
- [ ] **Heading order:**
  - `h4` "Get In Touch" comes before its `h2`.
  - The Skills `h2` changes text every 4 s.
  - Stat values ("4+", "24/7") are `h3`s.
  - The About heading is announced as "ABOUTME".
- [ ] **No `prefers-reduced-motion` support anywhere:** preloader, marquee, particles, laser, shader, terminal log.
- [ ] **Copy-email:** the "COPY" hint appears only on hover, so touch users never see it, and a clipboard failure is unhandled. `Contact.jsx:69-73, 143`

## P2 — UX & content

- [ ] **Navbar.**
  - No section links on desktop: primary navigation is hidden behind the hamburger.
  - No background, so content scrolls under and collides with the logo (verified `rgba(0,0,0,0)`).
- [ ] **Inconsistent identity.**
  - Monogram "SD" for Santosh Maurya, "SANTOSH.DEV" in the preloader, "SANTOSH. / DEVELOPER" in the nav.
  - Role is written three ways: "Full Stack Developer", "Full-Stack Developer | AI & ML Innovator | Game Developer", "Developer".
- [ ] **About.**
  - Rows expand on hover, so they jump under the cursor as it moves.
  - Collapsed rows are a fixed 140 px, leaving large empty gaps on mobile.
  - Background photos are unrelated Unsplash stock. `About.jsx:56-69`
- [ ] **Skills.**
  - Autoplay ignores the category filter: it cycles through all 25 skills, so the active pill vanishes from a filtered list. `Skills.jsx:60`
  - The hint "Scroll · Click" invites the trap.
  - BrandTicker repeats the same tech list.
- [ ] **Projects.**
  - The section is a fixed `300vh` whatever the project count, so horizontal speed varies wildly. `Projects.jsx:147`
  - Horizontal swipes are hijacked with `preventDefault` + `scrollBy`. `Projects.jsx:122-124`
  - The "Details" affordance opens nothing.
  - Index numbers sit at 3 % opacity and are invisible. `Projects.jsx:62`
- [ ] **Metrics section.**
  - Shows fabricated "live" data (a randomly generated always-rising growth chart, a fake terminal log) and "24/7 availability".
  - It has no heading or `id` and isn't in the nav.
  - The terminal `setInterval` runs forever.
- [ ] **Contact.**
  - The clock shows the *visitor's* local time labelled "IST" (verified with a UTC visitor). `Contact.jsx:52-60, 123`
  - `rgba(var(--acc-rgb), …)` uses an undefined variable, so the hologram glow never renders. `Contact.jsx:102`
  - Filler: "ID: 884-299".
  - The phone field adds friction.
  - `© 2025` is hardcoded. `Contact.jsx:296`
  - The whole section is a `<footer>`.
  - The card floats misaligned under the text column.
- [ ] **Hero.**
  - The laser beam runs through the bio text on mobile and tablet.
  - The bio is a single 60-word block.
  - The mascot is positioned by JS after load, so it pops in (CLS 0.04–0.07).
- [ ] **Privacy:** the WhatsApp number is public in the menu. Intentional?
- [ ] **ScrollPersistence** restores the previous scroll position 100 ms after load, which fights hash links and the preloader. It also writes `sessionStorage` on every scroll event. `src/components/hooks/useScrollPersistence.js`

## P3 — Visual consistency

- [ ] **Type:** four voices. Anton (hero only), Space Grotesk (body), Playfair Display (About descriptions only), and the OS default monospace (differs per platform).
- [ ] **Accent colour:** `#38bdf8`, `#3b82f6`, `#4f46e5`, `#60a5fa`, `rgba(96,165,250)` and a green status colour are used interchangeably. There is no single token, and canvases hardcode the dark-mode blue.
- [ ] **Section headers use five different patterns:** a giant ghost "ABOUT ME" + `[ BACKGROUND ]`; `[ LANGUAGES ]`; "WHAT I BRING"; "• FEATURED PROJECTS // SCROLL TO EXPLORE"; and an `h4` "GET IN TOUCH".
- [ ] **Containers:** `max-w-7xl` (About), 1600 px (Strengths/Metrics), `95vw` (Contact), full-bleed `px-4/12` (Projects). Section left edges don't line up.
- [ ] **Vertical rhythm:** `py-10/16`, `h-screen`, `min-h-[100svh]`, `300vh` and `min-h-screen` are all in use.
- [ ] **Buttons:** four styles (glowing gradient pills, a flat square "Send", outline pills, `rounded-lg` chips). Corner radii mix full, xl, lg, sm and 0.

## P4 — Code health

- [ ] **19 unused files in `public/` (~3.2 MB),** including a duplicate `mascott.png` (1.5 MB), `pfp.png` (928 KB), `ndlogo.svg` (428 KB), html2canvas, liquidGL, jquery.ripples, duplicated laser/particle scripts and the Next template SVGs.
- [ ] Also unused: `src/lib/html2canvas.min.js`, `jquery.ripples-min.js`, `image.png`, `src/app/page.module.css`, and the dependencies `html2canvas` and `@gsap/react`.
- [ ] **Favicon `/favicon.ico` ignores `basePath`,** so it 404s on GitHub Pages under `/portfolio`. `layout.js:32`
- [ ] **No OpenGraph/Twitter metadata,** so shared links get bare previews.
- [ ] **Skills engine is never destroyed on unmount** (WebGL context and resize listener leak). `Skills.jsx:71-94`
- [ ] **Hook-rule workarounds:** a `getLayoutEffect` alias (`Hero.jsx:100`) and `eslint-disable` for exhaustive-deps / set-state-in-effect.
- [ ] **`ease-[0.16,1,0.3,1]` generates no CSS** (it is missing `cubic-bezier()`), so the intended easing is ignored. `About.jsx:57`
- [ ] **README** is still the create-next-app default.

---

## Suggested fix order (keeps the current design)

1. **Unbreak:** release scroll in Skills, wire the hero CTAs, make the form deliver (a form service or mailto fallback, with success/error states), and fix the placeholder links and title clipping.
2. **Theme:** add `@custom-variant dark`, replace hardcoded colours with the existing CSS variables, and apply the theme before paint. Alternatively, drop light mode.
3. **Speed:** remove or shorten the preloader, convert the mascot to WebP, pause off-screen loops, and lazy-load the three.js scenes.
4. **Accessibility:** labels, names, keyboard-operable rows, contrast, menu semantics, reduced motion.
5. **Consistency:** one accent token, one section-header component, one container width, two button variants.
6. **Projects:** a curated list with real descriptions and images, and no fake fallback.
