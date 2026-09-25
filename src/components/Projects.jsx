"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { GITHUB_USERS } from "@/services/githubService";
import SectionHeading from "./ui/SectionHeading";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const CARD_WIDTH = "w-[84vw] sm:w-[58vw] md:w-[44vw] lg:w-[34vw] xl:w-[29vw]";

/** Replays the beam scan across a card's image (grayscale → colour). */
function scan(el) {
  if (!el || (el.classList.contains("is-lit") && !el.classList.contains("is-done"))) return;
  el.style.setProperty("--scan-w", `${el.offsetWidth}px`);
  el.classList.add("is-reset");
  el.classList.remove("is-lit", "is-done");
  void el.offsetWidth; // commit the reset before sweeping again
  el.classList.remove("is-reset");
  el.classList.add("is-lit");
  window.clearTimeout(el._scanDone);
  el._scanDone = window.setTimeout(() => el.classList.add("is-done"), 1150);
}

function ProjectCard({ project, index }) {
  const scanRef = useRef(null);
  const year = project.updatedAt ? new Date(project.updatedAt).getFullYear() : null;
  return (
    <article className={`project-card relative flex-shrink-0 snap-start ${CARD_WIDTH}`} aria-labelledby={`project-${project.id}`}>
      <div className="group relative flex h-full flex-col" data-cursor-label="Open" onPointerEnter={(e) => e.pointerType !== "touch" && scan(scanRef.current)}>
        <div ref={scanRef} className="scan aspect-[16/10] w-full" data-scan>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="scan-base project-img"
            onError={(e) => {
              e.currentTarget.parentElement.classList.add("is-missing");
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image} alt="" loading="lazy" decoding="async" className="scan-lit" />
          <span className="scan-line" aria-hidden="true" />
          <span className="absolute left-3 top-3 bg-[var(--bg)] px-2 py-0.5 index text-[0.95rem]">({String(index + 1).padStart(2, "0")})</span>
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4 label">
          <span>{project.language || "Code"}</span>
          <span className="tabular">
            {project.stars > 0 ? <span aria-label={`${project.stars} stars`}>★ {project.stars} · </span> : null}
            {year}
          </span>
        </div>
        <h3 id={`project-${project.id}`} className="serif mt-3 text-[2rem] md:text-[2.4rem] leading-[1] tracking-[-0.02em] text-[var(--fg)]">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline decoration-[var(--signal)] decoration-1 underline-offset-[6px]"
          >
            {project.title}
            <span className="sr-only"> — view source on GitHub (opens in a new tab)</span>
          </a>
        </h3>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--muted)] line-clamp-3">
          {project.description || "Source code and notes on GitHub."}
        </p>
        {project.topics?.length ? (
          <p className="mt-3 label !normal-case !tracking-normal !text-[0.8rem] text-[var(--faint)]">{project.topics.map((t) => `#${t}`).join("  ")}</p>
        ) : null}
        <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4 mt-6">
          <span className="label inline-flex items-center gap-1.5 text-[var(--fg)]" aria-hidden="true">
            Source <ArrowUpRight size={12} className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="label link-u is-static inline-flex min-h-11 items-center gap-1.5 !text-[var(--signal)]" data-cursor-label="Live">
              Live site <ArrowUpRight size={12} aria-hidden="true" />
              <span className="sr-only"> for {project.title} (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MoreCard({ message }) {
  return (
    <article className={`project-card relative flex-shrink-0 snap-start ${CARD_WIDTH}`}>
      <div className="flex h-full min-h-[420px] flex-col justify-between border-t border-[var(--line-strong)] pt-6">
        <div>
          <p className="label">Archive</p>
          <p className="serif mt-5 text-[2.4rem] md:text-[3.2rem] leading-[1] tracking-[-0.025em] text-[var(--fg)]">
            {message || (
              <>
                Everything else lives on <em>GitHub.</em>
              </>
            )}
          </p>
        </div>
        <ul className="flex flex-col">
          {GITHUB_USERS.map((u) => (
            <li key={u} className="border-t border-[var(--line)] last:border-b">
              <a
                href={`https://github.com/${u}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-14 items-center justify-between text-[var(--fg)]"
              >
                <span className="serif text-2xl transition-[color] group-hover:italic group-hover:text-[var(--signal)]">@{u}</span>
                <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                <span className="sr-only"> on GitHub (opens in a new tab)</span>
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
      <div className="animate-pulse">
        <div className="aspect-[16/10] bg-[var(--surface)]" />
        <div className="mt-5 h-3 w-24 bg-[var(--surface)]" />
        <div className="mt-4 h-8 w-3/4 bg-[var(--surface)]" />
        <div className="mt-4 h-3 w-full bg-[var(--surface)]" />
        <div className="mt-2 h-3 w-2/3 bg-[var(--surface)]" />
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
    const measure = () => setHeight(distance() + window.innerHeight);
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
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            skewTo(gsap.utils.clamp(-5, 5, self.getVelocity() / -450));
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            setCurrent(Math.min(count, Math.max(1, Math.round(self.progress * (count - 1)) + 1)));
          },
          onScrubComplete: () => skewTo(0),
        },
      });

      gsap.utils.toArray(".project-card", track).forEach((card) => {
        const img = card.querySelector(".scan");
        if (img) {
          gsap.fromTo(
            img.querySelectorAll("img"),
            { xPercent: -4, scale: 1.12 },
            { xPercent: 4, scale: 1.12, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "right left", scrub: true } },
          );
          ScrollTrigger.create({ trigger: card, containerAnimation: slide, start: "left 72%", once: true, onEnter: () => scan(img) });
        }
        gsap.from(card, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: slide, start: "left 110%", end: "left 60%", scrub: true },
        });
      });
    }, sectionRef);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [mode, loading, count]);

  // Swipe mode: scan each card once it is mostly on screen.
  useEffect(() => {
    if (mode !== "swipe" || loading) return;
    if (prefersReducedMotion()) {
      trackRef.current?.querySelectorAll("[data-scan]").forEach((el) => el.classList.add("is-lit", "is-done"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          scan(e.target);
          io.unobserve(e.target);
        }),
      { threshold: 0.6 },
    );
    trackRef.current?.querySelectorAll("[data-scan]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mode, loading, projects]);

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
      className="relative bg-[var(--bg)]"
      style={pinned && height ? { height } : undefined}
    >
      <div className={pinned ? "sticky top-0 z-[31] h-[100svh] overflow-hidden flex flex-col justify-center" : "section-y"}>
        <div className="max-w-screen-container layout-padding w-full mb-10 md:mb-12">
          <SectionHeading
            index="04"
            label="Selected work"
            aside={!loading && !error ? `${projects.length} projects · live from GitHub` : "Live from GitHub"}
            id="projects-title"
            compact
            title={
              <>
                Things I&apos;ve <em>built.</em>
              </>
            }
          />
        </div>

        <div
          ref={trackRef}
          className={`flex gap-8 md:gap-12 items-stretch will-change-transform ${
            pinned
              ? "w-max px-[max(1.25rem,calc((100vw-1440px)/2+4.5rem))]"
              : "overflow-x-auto snap-x snap-mandatory scrollbar-none px-5 md:px-14 pb-4 scroll-px-5"
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

        <div className="max-w-screen-container layout-padding w-full mt-8 md:mt-10 flex items-center gap-6" aria-hidden="true">
          {pinned ? (
            <>
              <div className="flex-1 h-px bg-[var(--line)] overflow-hidden">
                <div ref={barRef} className="h-full bg-[var(--beam)] origin-left" style={{ transform: "scaleX(0)" }} />
              </div>
              <span className="label tabular">
                {String(current).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </>
          ) : (
            <span className="label">Swipe to explore →</span>
          )}
        </div>
      </div>
    </section>
  );
}
