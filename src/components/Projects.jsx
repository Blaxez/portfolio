"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ExternalLink, Github, Star } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { GITHUB_USERS } from "@/services/githubService";
import SectionHeading from "./ui/SectionHeading";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Java: "#b07219",
  Go: "#00ADD8",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "Jupyter Notebook": "#DA5B0B",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  GLSL: "#5686a5",
};

// Width is capped by viewport height too, so the pinned gallery always fits short laptop screens.
const CARD_WIDTH = "w-[82vw] sm:w-[60vw] md:w-[min(46vw,64vh)] lg:w-[min(36vw,60vh)] xl:w-[min(30vw,58vh)]";

function tilt(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  el.style.setProperty("--gx", `${x * 100}%`);
  el.style.setProperty("--gy", `${y * 100}%`);
}
function untilt(e) {
  const el = e.currentTarget;
  el.style.setProperty("--ry", "0deg");
  el.style.setProperty("--rx", "0deg");
}

/**
 * A generated cover: no third-party image requests (GitHub's preview service
 * rate-limits bursts with 429s), always on-brand, and it carries the facts the
 * preview card would have shown. The initials layer drifts with the gallery.
 */
function ProjectCover({ project, index }) {
  const color = LANG_COLORS[project.language] || "var(--acc)";
  const initials = project.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div
      className="relative aspect-[2/1] overflow-hidden bg-[#0e0c0a]"
      style={{
        backgroundImage: `radial-gradient(circle at 78% 28%, color-mix(in srgb, ${color} 38%, transparent), transparent 55%), radial-gradient(circle at 12% 110%, rgba(var(--acc-rgb), 0.22), transparent 50%)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="project-img absolute inset-y-0 -left-[8%] w-[116%] flex items-center justify-end pr-[17%] transition-transform duration-700 group-hover:scale-105">
        <span
          className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,9vw,8.5rem)] leading-none uppercase text-transparent select-none"
          style={{ WebkitTextStroke: `1.5px color-mix(in srgb, ${color} 70%, #ffffff)`, opacity: 0.55 }}
        >
          {initials}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--surface)] to-transparent" />
      <span className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] tracking-widest text-white">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute top-4 right-4 max-w-[60%] truncate font-mono text-[10px] uppercase tracking-widest text-white/70">
        {project.owner}/{project.name}
      </span>
    </div>
  );
}

function ProjectCard({ project, index }) {
  const color = LANG_COLORS[project.language] || "var(--acc)";
  return (
    <article className={`project-card relative flex-shrink-0 snap-center ${CARD_WIDTH}`} aria-labelledby={`project-${project.id}`}>
      <div
        className="project-tilt spotlight group relative h-full flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
        onPointerMove={tilt}
        onPointerLeave={untilt}
        data-cursor-label="View"
      >
        <ProjectCover project={project} index={index} />

        <div className="relative flex flex-1 flex-col gap-[clamp(0.6rem,1.6vh,1rem)] p-[clamp(1.1rem,2.6vh,2rem)]">
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {project.language || "Code"}
            </span>
            {project.stars > 0 ? (
              <span className="flex items-center gap-1" aria-label={`${project.stars} stars`}>
                <Star size={12} aria-hidden="true" /> {project.stars}
              </span>
            ) : null}
          </div>
          <h3 id={`project-${project.id}`} className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-[1.05] text-[var(--fg)]">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline decoration-[var(--acc)] underline-offset-4"
            >
              {project.title}
              <span className="sr-only"> — view source on GitHub (opens in a new tab)</span>
            </a>
          </h3>
          <p className="text-sm md:text-base text-[var(--muted)] leading-relaxed line-clamp-3 [@media(max-height:820px)]:line-clamp-2">
            {project.description || "Source code and notes on GitHub."}
          </p>
          {project.topics?.length ? (
            <ul className="flex flex-wrap gap-2 [@media(max-height:820px)]:hidden" aria-label="Topics">
              {project.topics.map((t) => (
                <li key={t} className="rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-2">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--fg)]" aria-hidden="true">
              <Github size={14} /> Source <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary !min-h-10 !py-2 !px-4 text-xs"
                data-cursor-label="Live"
              >
                Live demo <ExternalLink size={14} />
                <span className="sr-only"> for {project.title} (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </div>
        <div aria-hidden="true" className="project-glare pointer-events-none absolute inset-0" />
      </div>
    </article>
  );
}

function MoreCard({ message }) {
  return (
    <article className={`project-card relative flex-shrink-0 snap-center ${CARD_WIDTH}`}>
      <div className="h-full min-h-[420px] rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-8 flex flex-col justify-between">
        <div>
          <p className="eyebrow">Keep exploring</p>
          <p className="mt-4 text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--fg)]">
            {message || "Everything else lives on GitHub."}
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {GITHUB_USERS.map((u) => (
            <li key={u}>
              <a
                href={`https://github.com/${u}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost w-full justify-between"
                data-magnetic="0.15"
              >
                <span className="flex items-center gap-2">
                  <Github size={16} /> @{u}
                </span>
                <ArrowUpRight size={16} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className={`flex-shrink-0 ${CARD_WIDTH}`} aria-hidden="true">
      <div className="h-full min-h-[420px] rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden animate-pulse">
        <div className="aspect-[2/1] bg-[var(--border)]" />
        <div className="p-8 space-y-4">
          <div className="h-3 w-24 rounded bg-[var(--border)]" />
          <div className="h-7 w-3/4 rounded bg-[var(--border)]" />
          <div className="h-3 w-full rounded bg-[var(--border)]" />
          <div className="h-3 w-2/3 rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects, loading, error } = useProjects();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const [mode, setMode] = useState("swipe");
  const [height, setHeight] = useState(null);
  const [current, setCurrent] = useState(1);

  // Pinned horizontal gallery on wide screens with motion; native swipe otherwise.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const decide = () => setMode(mq.matches && !prefersReducedMotion() ? "pin" : "swipe");
    decide();
    mq.addEventListener("change", decide);
    return () => mq.removeEventListener("change", decide);
  }, []);

  const count = projects.length + 1;

  useEffect(() => {
    if (mode !== "pin" || loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the pin height when leaving pin mode
      setHeight(null);
      return;
    }
    const track = trackRef.current;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    // A short hold once pinned lets the heading settle; the row then travels faster than the page scrolls.
    const hold = () => Math.round(window.innerHeight * 0.22);
    const RATIO = 0.74;
    const measure = () => setHeight(Math.round(distance() * RATIO) + window.innerHeight + hold());
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const ctx = gsap.context(() => {
      const skewTo = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3" });
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: () => `top+=${hold()} top`,
          end: "bottom bottom",
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            skewTo(gsap.utils.clamp(-6, 6, self.getVelocity() / -400));
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            setCurrent(Math.min(count, Math.max(1, Math.round(self.progress * (count - 1)) + 1)));
          },
          onScrubComplete: () => skewTo(0),
        },
      });

      gsap.utils.toArray(".project-card", track).forEach((card) => {
        const img = card.querySelector(".project-img");
        if (img) {
          gsap.fromTo(
            img,
            { xPercent: -6 },
            { xPercent: 6, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "right left", scrub: true } },
          );
        }
        gsap.from(card, {
          rotateY: -24,
          scale: 0.88,
          transformPerspective: 1200,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: slide, start: "left 105%", end: "left 55%", scrub: true },
        });
      });
    }, sectionRef);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [mode, loading, count]);

  // ScrollTrigger positions depend on the section height we just set.
  useEffect(() => {
    if (height) ScrollTrigger.refresh();
  }, [height]);

  const pinned = mode === "pin";

  return (
    <section
      id="projects"
      ref={sectionRef}
      aria-labelledby="projects-title"
      className="relative bg-[var(--bg)] border-t border-[var(--border)]"
      style={pinned && height ? { height } : undefined}
    >
      <div
        className={
          pinned
            ? "sticky top-0 h-[100svh] overflow-hidden flex flex-col justify-center pt-[clamp(4.5rem,10vh,6rem)] pb-[clamp(0.75rem,2.5vh,2rem)]"
            : "section-y"
        }
      >
        <div className="max-w-screen-container layout-padding w-full flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-[clamp(1.25rem,4vh,2.5rem)]">
          <SectionHeading index="04" eyebrow="Selected work" title={["Featured", "Projects"]} id="projects-title" compact />
          <div className="flex flex-col md:items-end gap-3 font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]" data-reveal="up">
            {!loading && !error ? <span>{projects.length} projects · live from GitHub</span> : null}
            <span className="hidden md:inline">{pinned ? "Scroll to explore" : "Swipe to explore"}</span>
            <span className="md:hidden">Swipe to explore</span>
          </div>
        </div>

        <div
          ref={trackRef}
          className={`flex gap-5 md:gap-8 items-stretch will-change-transform ${
            pinned
              ? "w-max px-[max(var(--pad),calc((100vw-1440px)/2+var(--pad)))]"
              : "overflow-x-auto snap-x snap-mandatory scrollbar-none px-[var(--pad)] pb-4 scroll-px-[var(--pad)]"
          }`}
          role="list"
          aria-label="Projects"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {projects.map((project, i) => (
                <div role="listitem" key={project.id} className="contents">
                  <ProjectCard project={project} index={i} />
                </div>
              ))}
              <div role="listitem" className="contents">
                <MoreCard message={error ? "Projects couldn't load from GitHub right now — browse them directly." : null} />
              </div>
            </>
          )}
        </div>

        {pinned ? (
          <div className="max-w-screen-container layout-padding w-full mt-[clamp(1rem,3vh,2.5rem)] flex items-center gap-6" aria-hidden="true">
            <div className="flex-1 h-px bg-[var(--border)] overflow-hidden">
              <div ref={barRef} className="h-full bg-[var(--acc)] origin-left" style={{ transform: "scaleX(0)" }} />
            </div>
            <span className="font-mono text-[11px] tracking-widest text-[var(--muted)] tabular-nums">
              {String(current).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
