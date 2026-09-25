"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "./ui/SectionHeading";
import Rule from "./ui/Rule";
import { getAssetPath } from "@/lib/assets";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const JOURNEY = [
  {
    when: "2018",
    title: "Electrical & Electronics Engineering",
    where: "Ismail Yusuf College",
    body: "Where it started: circuits, signals and systems — the habit of understanding how a thing works all the way down.",
  },
  {
    when: "2023—25",
    title: "Diploma, Computer Science & Engineering",
    where: "Maharishi University of Information Technology",
    body: "Formal grounding in computer science alongside a steady stream of side projects across the web, games and ML.",
  },
  {
    when: "48h",
    title: "Hack-Shastra — 2nd place",
    where: "IEEE Software category · 15+ teams",
    body: "Led a cross-functional team to a complete software prototype in 48 hours: sprint-style workflow, clear delegation, delivered on time.",
  },
  {
    when: "Now",
    title: "Full-stack, applied AI & games",
    where: "Mumbai · open to freelance & collaboration",
    body: "Building web platforms, intelligent applications and real-time experiences — from rough prototype to something people use.",
  },
];

const PRINCIPLES = [
  {
    label: "Approach",
    text: "Rapid prototyping, scalable system architecture and intelligent applications. Clean code and modular design — shipping fast without sacrificing quality.",
  },
  {
    label: "Philosophy",
    text: "Engineering is about solving real human problems. Curiosity and a maker's mindset come first; the stack is chosen to fit the problem, not the other way round.",
  },
];

function Portrait() {
  const ref = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    let scan;
    let st;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import("@/lib/PortraitScan").then(({ mountPortraitScan }) => {
          if (cancelled) return;
          const css = getComputedStyle(el);
          scan = mountPortraitScan(el, {
            src: getAssetPath("/assets/portrait.webp"),
            beam: css.getPropertyValue("--beam").trim() || "#ff5b22",
          });
          if (!scan || prefersReducedMotion()) return;
          st = ScrollTrigger.create({
            trigger: frameRef.current,
            start: "top 78%",
            end: "bottom 55%",
            onUpdate: (self) => scan.setScan(self.progress),
            onRefresh: (self) => scan.setScan(self.progress),
          });
        });
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      st?.kill();
      scan?.destroy();
    };
  }, []);

  return (
    <figure ref={frameRef} className="relative">
      <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden bg-[#0b0a09]" data-cursor-label="Scan">
        {/* Fallback (no WebGL / before load): the graded photo itself. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetPath("/assets/portrait.webp")}
          alt="Santosh Maurya"
          width={600}
          height={735}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="index">Fig. 1</span>
        <span className="label">Santosh, Mumbai</span>
      </figcaption>
    </figure>
  );
}

/** Rows light up when the page beam's head (62% down the viewport) reaches them. */
function useJourneyIgnition(listRef) {
  useEffect(() => {
    const rows = [...listRef.current.querySelectorAll("[data-journey]")];
    if (prefersReducedMotion()) {
      rows.forEach((r) => r.classList.add("is-lit"));
      return;
    }
    let triggers = [];
    const cancelIdle = afterFirstPaint(() => {
      triggers = rows.map((row) =>
        ScrollTrigger.create({
          trigger: row,
          start: "top 62%",
          onEnter: () => row.classList.add("is-lit"),
          onLeaveBack: () => row.classList.remove("is-lit"),
        }),
      );
    });
    return () => {
      cancelIdle();
      triggers.forEach((t) => t.kill());
    };
  }, [listRef]);
}

export default function About() {
  const listRef = useRef(null);
  useJourneyIgnition(listRef);

  return (
    <section id="about" aria-labelledby="about-title" className="section-y relative bg-[var(--bg)]">
      <div className="max-w-screen-container layout-padding">
        <SectionHeading
          index="01"
          label="About"
          aside="Mumbai, India"
          id="about-title"
          title={
            <>
              A maker who <em>ships.</em>
            </>
          }
        />

        <div className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10">
          <div className="lg:col-span-7 flex flex-col gap-14 md:gap-20">
            <p
              data-scrub-words
              className="serif text-[1.85rem] md:text-[2.7rem] lg:text-[3.05rem] leading-[1.12] tracking-[-0.018em] text-[var(--fg)] max-w-[22ch] md:max-w-[24ch]"
            >
              Engineering, for me, is about solving real human problems — with curiosity, deep technical skill and a maker&apos;s
              mindset, whether it ships as a web app, an AI model or an <em>immersive game.</em>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-2xl">
              {PRINCIPLES.map((p) => (
                <div key={p.label} data-reveal="up">
                  <p className="label">{p.label}</p>
                  <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--muted)]">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-28">
              <Portrait />
            </div>
          </div>
        </div>

        <div className="mt-28 md:mt-40">
          <div className="flex items-baseline justify-between gap-6" data-reveal="up">
            <h3 className="serif text-4xl md:text-6xl tracking-[-0.025em]">
              The <em>journey</em>
            </h3>
            <span className="label">So far</span>
          </div>
          <ol ref={listRef} className="mt-10 md:mt-14">
            {JOURNEY.map((item) => (
              <li key={item.title} data-journey className="journey-row group">
                <Rule />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-8 md:py-12">
                  <p className="md:col-span-3 flex items-center gap-3">
                    <span aria-hidden="true" className="journey-dot" />
                    <span className="journey-when serif text-5xl md:text-7xl leading-none tracking-[-0.03em]">{item.when}</span>
                  </p>
                  <div className="md:col-span-4" data-reveal="up">
                    <h4 className="text-xl md:text-2xl font-medium tracking-[-0.01em] text-[var(--fg)]">{item.title}</h4>
                    <p className="label mt-3">{item.where}</p>
                  </div>
                  <p className="md:col-span-5 text-[1.02rem] leading-relaxed text-[var(--muted)]" data-reveal="up">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
