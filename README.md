# Santosh Maurya — Portfolio

A scroll-driven portfolio: an intro with a WebGL laser stage, a holographic 3D orb, a particle logo morpher, a pinned "strengths" sequence over a smoke shader, a horizontal project gallery, and a particle-wave contact section.

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
| About accordion | `src/components/About.jsx` (`CAPABILITIES`) |
| Skills | `src/components/Skills.jsx` (`SKILLS_DATA`); icons in `public/assets/skills/` |
| Strengths | `src/components/WebGLFlowSection.jsx` (`ITEMS`) |
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
  app/                 layout (fonts, metadata, pre-paint theme script), page, globals.css (design tokens)
  components/          one file per section + Navbar, Preloader (intro curtain)
    fx/                MotionDirector (declarative scroll choreography), Cursor, ScrollHUD
    providers/         ThemeProvider, SmoothScroll (Lenis ↔ GSAP ticker)
    ui/                SectionHeading (the one header pattern)
  lib/
    three/stage.js     shared three.js scaffold: lazy, pause off-screen, async shader compile, DPR caps
    three/HoloOrb.js   About orb · three/ParticleWave.js Contact terrain
    LaserFlow.js       hero laser · SkillsParticleSystem.js skills morpher · DotGridBackground.js
    site.js · scroll.js · idle.js · assets.js
```

**Motion system:**
- Sections opt into scroll effects with data attributes, run by `MotionDirector`:
  - `data-split`: title words rise
  - `data-reveal="up"`
  - `data-scrub-words`: words light up as you read
  - `data-parallax`
  - `data-count`: count-up numbers
  - `data-clip-reveal`
- Pinned sections (Strengths, Projects) use CSS `position: sticky` driven by ScrollTrigger, so there are no pin spacers and no layout shift.

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
