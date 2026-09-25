"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus } from "lucide-react";
import { ScrambleText } from "./TextEffects";
import SectionHeading from "./ui/SectionHeading";

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
  { label: "Full-Stack", pos: "top-[8%] left-[4%]", delay: "0s" },
  { label: "AI / ML", pos: "top-[18%] right-[2%]", delay: "-1.5s" },
  { label: "Game Dev", pos: "bottom-[14%] left-[8%]", delay: "-3s" },
  { label: "4+ Years", pos: "bottom-[6%] right-[10%]", delay: "-4.5s" },
];

function HoloOrb() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let orb;
    let st;
    let cancelled = false;
    // Load three.js only when the section is about to be seen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import("@/lib/three/HoloOrb").then(({ mountHoloOrb }) => {
          if (cancelled) return;
          const css = getComputedStyle(document.documentElement);
          orb = mountHoloOrb(el, {
            colorA: css.getPropertyValue("--acc").trim() || "#60a5fa",
            colorB: css.getPropertyValue("--acc-2").trim() || "#818cf8",
          });
          st = ScrollTrigger.create({
            trigger: el.closest("section"),
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => orb.setProgress(Math.sin(self.progress * Math.PI)),
          });
        });
      },
      { rootMargin: "150px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      st?.kill();
      orb?.destroy();
    };
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto" aria-hidden="true">
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(var(--acc-rgb),0.28),transparent_65%)] blur-2xl" />
      <div ref={ref} className="absolute inset-0" />
      {ORBIT_TAGS.map((t) => (
        <span
          key={t.label}
          className={`orbit-tag absolute ${t.pos} rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 font-mono text-[10px] md:text-xs uppercase tracking-widest text-[var(--fg)]`}
          style={{ animationDelay: t.delay }}
        >
          {t.label}
        </span>
      ))}
    </div>
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
            <HoloOrb />
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
