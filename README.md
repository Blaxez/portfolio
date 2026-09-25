# Santosh Maurya — Portfolio

A scroll-driven, editorial portfolio built around one idea — **One Beam**: the hero's laser is the thread of the whole page. It cuts open the intro, lands on the hero's hairline, slides into the margin as you scroll and becomes a rail whose glowing head travels with the reader. From there it draws every section rule, lights up the journey timeline, scans the portrait and the project images, traces the strengths diagrams, rises from Mumbai on the globe and finally signs the name in the footer.

**Art direction:** warm ink and bone, one signal colour (the laser), Instrument Serif for display and Instrument Sans for text. No gradients on type, no glass, no glow blobs.

**Stack:** Next.js 16 (App Router, static export → GitHub Pages under `/portfolio`) · React 19 · Tailwind CSS v4 · three.js / raw WebGL · GSAP (ScrollTrigger, SplitText) · Lenis · Framer Motion.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/` (deployed by `.github/workflows/deploy.yml` on push to `master`) |
| `npm run lint` | ESLint |

## Editing content

| What | Where |
| --- | --- |
| Name, role, email, location, socials, CV | `src/lib/site.js` |
| About: journey timeline, principles, portrait | `src/components/About.jsx` (`JOURNEY`, `PRINCIPLES`); portrait at `public/assets/portrait.webp` |
| Skills | `src/components/Skills.jsx` (`SKILLS_DATA`); icons in `public/assets/skills/` |
| Strengths | `src/components/WebGLFlowSection.jsx` (`ITEMS`); 3D structures in `src/lib/three/StrengthsScene.js` (`shapes()`) |
| Numbers | `src/components/SystemMetrics.jsx` (`STATS`) |
| Projects | Pulled live from GitHub (`src/services/githubService.js`, accounts in `GITHUB_USERS`): curated by stars, description and recency |

**CV button:** put the file at `public/cv.pdf` and set `cvPath: "/cv.pdf"` in `src/lib/site.js`. The hero's second button becomes "Download CV".

**Contact form:** without configuration it opens the visitor's email app with the message pre-filled. To receive messages directly, create a form endpoint that accepts JSON POSTs (e.g. Formspree) and set it at build time:

```bash
NEXT_PUBLIC_FORM_ENDPOINT=https://formspree.io/f/xxxxxxx npm run build
```

For the GitHub Pages deploy, add it as a repository variable and pass it as `env:` on the build step.

## How it's put together

```
src/
  app/                 layout (fonts, metadata, pre-paint theme script), page, globals.css (design tokens, beam styles)
  components/          one file per section + Navbar, Preloader (the laser cut), Footer (the signature)
    fx/                BeamRail (the page thread), MotionDirector (declarative scroll choreography), Cursor, LightTrail, ScrollHUD
    providers/         ThemeProvider, SmoothScroll (Lenis ↔ GSAP ticker)
    ui/                SectionHeading, Rule (beam-drawn hairline), LocalTime
  hooks/               useProjects
  lib/
    LaserFlow.js       hero laser · PortraitScan.js portrait scan shader (raw WebGL)
    three/             StrengthsScene.js (3D particle structures) · ParticleWave.js (contact terrain) · stage.js
    SkillsParticleSystem.js skills morpher · DotGridBackground.js
    site.js · scroll.js · idle.js · assets.js
```

**Motion system:**
- Sections opt into scroll effects with data attributes, run by `MotionDirector`:
  - `data-split`: title lines rise out of masks
  - `data-rule`: the beam draws a hairline rule (use `ui/Rule`)
  - `data-reveal="up"`
  - `data-scrub-words`: words light up as you read
  - `data-parallax`
  - `data-count`: count-up numbers
- The beam rail is lit down to 62% of the viewport; anything that should "light up when the beam reaches it" triggers at `top 62%` (see the journey rows).
- Pinned sections (Strengths, Projects) use CSS `position: sticky` driven by ScrollTrigger, so there are no pin spacers and no layout shift. Beam heads move with transforms only, never `left`, so they can't register as layout shift.

**Performance guardrails:**
- Every WebGL scene loads only when its section approaches and renders only while visible. Shaders compile asynchronously.
- The hero laser and all scroll triggers start after first paint, so headline text always paints first.
- Phones get fewer particles, lower DPR and no bloom; touch devices skip the cursor-only effects.

**Accessibility:**
- AA-checked colour tokens.
- Semantic buttons and links, labelled form, and a menu dialog with focus trap and Escape.
- A pause control for the Skills autoplay.
- `prefers-reduced-motion` turns off the intro curtain, smooth scroll, scrubs and autoplay, and WebGL renders still frames.

The audit this work was based on, with before/after measurements, is in [`docs/AUDIT.md`](docs/AUDIT.md).
