"use client";
import { warmup } from "@/lib/warmup";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus } from "lucide-react";
import { ScrambleText } from "./TextEffects";
import SectionHeading from "./ui/SectionHeading";
import { getAssetPath } from "@/lib/assets";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = [
  {
    id: "01",
    title: "Education",
    desc: "Diploma in Computer Science & Engineering from Maharishi University of Information Technology (2023–2025). Prior background in Electrical & Electronics Engineering from Ismail Yusuf College (2018).",
    tags: ["CS Engineering", "University"],
  },
  {
    id: "02",
    title: "Experience",
    desc: "Led a cross-functional team to create a complete software prototype in a 48-hour hackathon. Achieved 2nd place in the IEEE Software Category Competition among 15+ teams. Managed sprint-style workflows and delegated tasks for timely delivery.",
    tags: ["Team Lead", "Hack-Shastra"],
  },
  {
    id: "03",
    title: "Approach",
    desc: "Skilled in rapid prototyping, scalable system architecture, and building intelligent applications. I believe in clean code, modular design, and shipping fast without sacrificing quality.",
    tags: ["Architecture", "Clean Code"],
  },
  {
    id: "04",
    title: "Philosophy",
    desc: "Engineering is about solving real human problems. I bring curiosity, deep technical skills, and a maker mindset to every project — whether it's a web app, an AI model, or an immersive game experience.",
    tags: ["Innovation", "Impact"],
  },
];

const ORBIT_TAGS = [
  { label: "Full-Stack", pos: "top-[5%] left-[3%] md:-left-[6%]", delay: "0s" },
  { label: "AI / ML", pos: "top-[20%] right-[3%] md:-right-[7%]", delay: "-1.5s" },
  { label: "Game Dev", pos: "bottom-[18%] left-[3%] md:-left-[8%]", delay: "-3s" },
  { label: "4+ Years", pos: "bottom-[5%] right-[3%] md:-right-[5%]", delay: "-4.5s" },
];

function Portrait() {
  const ref = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    let scan;
    let st;
    let cancelled = false;
    // Mounted in idle time right after load (see lib/warmup), or when the section
    // approaches if the visitor gets there first — never mid-scroll when avoidable.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
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
          start: "top 85%",
          end: "bottom 80%",
          onUpdate: (self) => scan.setScan(self.progress),
          onRefresh: (self) => scan.setScan(self.progress),
        });
      });
    };
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { rootMargin: "200px 0px" });
    io.observe(el);
    const cancelWarm = warmup(start);
    return () => {
      cancelled = true;
      cancelWarm();
      io.disconnect();
      st?.kill();
      scan?.destroy();
    };
  }, []);

  return (
    <figure ref={frameRef} className="relative mx-auto w-full max-w-[420px]">
      <div aria-hidden="true" className="absolute -inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(var(--signal-rgb),0.22),transparent_65%)] blur-2xl" />
      <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b0a09]" data-cursor-label="Scan">
        {/* Fallback (no WebGL / before load): the graded photo itself. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetPath("/assets/portrait.webp")}
          alt="Santosh Maurya"
          width={640}
          height={800}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05] opacity-85"
        />
      </div>
      {ORBIT_TAGS.map((t) => (
        <span
          key={t.label}
          aria-hidden="true"
          className={`orbit-tag absolute ${t.pos} rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 font-mono text-[10px] md:text-xs uppercase tracking-widest text-[var(--fg)]`}
          style={{ animationDelay: t.delay }}
        >
          {t.label}
        </span>
      ))}
    </figure>
  );
}

export default function About() {
  const [open, setOpen] = useState(0);
  const [hovered, setHovered] = useState(null);

  const spot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section id="about" aria-labelledby="about-title" className="section-y relative overflow-clip bg-[var(--bg)]">
      <div className="max-w-screen-container layout-padding">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <SectionHeading index="01" eyebrow="About" title={["About", "Me"]} id="about-title" />
            <p
              data-scrub-words
              className="mt-10 md:mt-14 text-2xl md:text-4xl lg:text-[2.6rem] font-medium leading-[1.2] tracking-tight text-[var(--fg)] max-w-3xl"
            >
              Engineering, for me, is about solving real human problems — with curiosity, deep technical skill and a
              maker&apos;s mindset, whether it ships as a web app, an AI model or an immersive game.
            </p>
          </div>
          <div className="lg:col-span-5">
            <Portrait />
          </div>
        </div>

        <div className="mt-16 md:mt-24 border-t border-[var(--border)]">
          {CAPABILITIES.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.id}
                className="spotlight relative border-b border-[var(--border)] overflow-hidden"
                onPointerMove={spot}
                data-reveal="up"
              >
                <h3>
                  <button
                    type="button"
                    id={`about-trigger-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`about-panel-${item.id}`}
                    onClick={() => setOpen(isOpen ? null : index)}
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    className="group w-full flex items-center justify-between gap-6 py-6 md:py-9 px-2 md:px-6 text-left"
                  >
                    <span className="flex items-baseline gap-4 md:gap-8">
                      <span className="font-mono text-xs md:text-sm text-[var(--acc)]">{item.id}</span>
                      <span
                        className={`text-3xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter transition-[color,transform] duration-500 group-hover:translate-x-3 ${
                          isOpen ? "text-[var(--acc)]" : "text-[var(--fg)]"
                        }`}
                      >
                        <ScrambleText text={item.title} active={hovered === index} />
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-full border border-[var(--border)] flex items-center justify-center transition-all duration-500 group-hover:border-[var(--acc)] ${
                        isOpen ? "rotate-45 bg-[var(--acc)] text-white border-[var(--acc)]" : "text-[var(--fg)]"
                      }`}
                    >
                      <Plus size={20} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`about-panel-${item.id}`}
                      role="region"
                      aria-labelledby={`about-trigger-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8 md:pb-10 px-2 md:px-6">
                        <p className="md:col-start-2 md:col-span-7 text-base md:text-xl text-[var(--muted)] leading-relaxed">
                          {item.desc}
                        </p>
                        <div className="md:col-span-4 flex flex-wrap md:justify-end items-start gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 border border-[var(--border)] rounded-full text-[10px] md:text-xs font-mono uppercase tracking-widest text-[var(--fg)] bg-[var(--surface)]/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
