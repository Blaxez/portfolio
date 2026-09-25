"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pause, Play } from "lucide-react";
import Rule from "./ui/Rule";
import { prefersReducedMotion } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const SKILLS_DATA = [
  { id: "js", label: "JavaScript", icon: "javascript.svg", color: "#F7DF1E", category: "Languages", details: "Advanced ES6+, React, Node.js" },
  { id: "py", label: "Python", icon: "python.svg", color: "#3776AB", category: "Languages", details: "AI/ML, Data Science" },
  { id: "c", label: "C", icon: "c.svg", color: "#A8B9CC", category: "Languages", details: "System Programming" },
  { id: "cs", label: "C#", icon: "dotnet.svg", color: "#239120", category: "Languages", details: "Game Dev, .NET" },
  { id: "cpp", label: "C++", icon: "cplusplus.svg", color: "#00599C", category: "Languages", details: "Game Dev, Systems" },
  { id: "java", label: "Java", icon: "java.svg", color: "#5382a1", category: "Languages", details: "Enterprise, Android" },
  { id: "go", label: "Go", icon: "go.svg", color: "#00ADD8", category: "Languages", details: "Concurrent Programming" },
  { id: "react", label: "React", icon: "react.svg", color: "#61DAFB", category: "Web", details: "SPAs, State Management" },
  { id: "next", label: "Next.js", icon: "nextdotjs.svg", color: "#ffffff", category: "Web", details: "SSR, Static Generation" },
  { id: "node", label: "Node.js", icon: "nodedotjs.svg", color: "#339933", category: "Web", details: "APIs, Microservices" },
  { id: "tailwind", label: "Tailwind", icon: "tailwindcss.svg", color: "#06B6D4", category: "Web", details: "Responsive Design" },
  { id: "graphql", label: "GraphQL", icon: "graphql.svg", color: "#E10098", category: "Web", details: "API Design" },
  { id: "tf", label: "TensorFlow", icon: "tensorflow.svg", color: "#FF6F00", category: "AI/ML", details: "Deep Learning" },
  { id: "pytorch", label: "PyTorch", icon: "pytorch.svg", color: "#EE4C2C", category: "AI/ML", details: "Computer Vision, NLP" },
  { id: "sklearn", label: "Scikit-learn", icon: "scikitlearn.svg", color: "#F7931E", category: "AI/ML", details: "ML Algorithms" },
  { id: "ollama", label: "Ollama", icon: "ollama.svg", color: "#FFFFFF", category: "AI/ML", details: "Local LLMs" },
  { id: "prompt", label: "Prompt Eng.", icon: "openai.svg", color: "#8b7cf6", category: "AI/ML", details: "LLM Optimization" },
  { id: "aitools", label: "AI Tools", icon: "huggingface.svg", color: "#FFD21E", category: "AI/ML", details: "Models & Integration" },
  { id: "unreal", label: "Unreal", icon: "unrealengine.svg", color: "#ffffff", category: "Creative", details: "Game Development" },
  { id: "blender", label: "Blender", icon: "blender.svg", color: "#F5792A", category: "Creative", details: "3D Modeling" },
  { id: "git", label: "Git", icon: "git.svg", color: "#F05032", category: "DevOps", details: "Version Control" },
  { id: "docker", label: "Docker", icon: "docker.svg", color: "#2496ED", category: "DevOps", details: "Containerization" },
  { id: "aws", label: "AWS", icon: "amazonwebservices.svg", color: "#FF9900", category: "DevOps", details: "Cloud Infrastructure" },
  { id: "vscode", label: "VS Code", icon: "vscode.svg", color: "#007ACC", category: "DevOps", details: "Advanced IDE" },
  { id: "figma", label: "Figma", icon: "figma.svg", color: "#F24E1E", category: "DevOps", details: "UI/UX Design" },
];

const CATEGORIES = ["All", ...new Set(SKILLS_DATA.map((s) => s.category))];
const COUNTS = Object.fromEntries(CATEGORIES.map((c) => [c, c === "All" ? SKILLS_DATA.length : SKILLS_DATA.filter((s) => s.category === c).length]));
const AUTO_PLAY_DELAY = 4000;
const indexOf = (id) => SKILLS_DATA.findIndex((s) => s.id === id);

export default function Skills() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const pillsRef = useRef(null);
  // Opens on a strong silhouette; autoplay continues through the list from there.
  const [activeId, setActiveId] = useState("react");
  const [category, setCategory] = useState("All");
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);

  const filtered = useMemo(
    () => (category === "All" ? SKILLS_DATA : SKILLS_DATA.filter((s) => s.category === category)),
    [category],
  );
  const current = SKILLS_DATA[indexOf(activeId)];
  const position = filtered.findIndex((s) => s.id === activeId);

  const select = useCallback((id) => {
    setActiveId(id);
    engineRef.current?.loadSkill(indexOf(id));
  }, []);

  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Reduced motion: no autoplay.
  useEffect(() => {
    if (prefersReducedMotion()) setPlaying(false);
  }, []);

  // Engine: loaded when the section approaches, scroll assembles/disperses the logo.
  useEffect(() => {
    const section = sectionRef.current;
    let engine;
    let st;
    let cancelled = false;
    const load = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        load.disconnect();
        import("@/lib/SkillsParticleSystem").then(({ SkillsParticleSystem }) => {
          if (cancelled || !canvasRef.current) return;
          try {
            const css = getComputedStyle(section);
            engine = new SkillsParticleSystem(canvasRef.current, SKILLS_DATA, {
              color: css.getPropertyValue("--fg").trim() || "#ece6da",
              hot: css.getPropertyValue("--beam").trim() || "#ff5b22",
              bg: css.getPropertyValue("--bg").trim() || "#0b0a09",
            });
          } catch (e) {
            console.error("Skills engine failed to start:", e);
            return;
          }
          engineRef.current = engine;
          engine.onSkillChange = (skill) => setActiveId(skill.id);
          engine.loadSkill(indexOf(activeIdRef.current));
          const apply = ({ progress: p }) => {
            const enter = gsap.utils.clamp(0, 1, (p - 0.08) / 0.34);
            const leave = gsap.utils.clamp(0, 1, (p - 0.78) / 0.22);
            engine.setScatter(1 - enter * enter * (3 - 2 * enter) + leave * leave);
          };
          st = ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", onUpdate: apply, onRefresh: apply });
          // Arriving by a jump (menu link, reload mid-page) must not leave the logo scattered.
          apply(st);
        });
      },
      { rootMargin: "300px 0px" },
    );
    load.observe(section);

    const vis = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    vis.observe(section);

    return () => {
      cancelled = true;
      load.disconnect();
      vis.disconnect();
      st?.kill();
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Autoplay through the *filtered* list; pauses on hover/focus, off-screen, or when toggled off.
  useEffect(() => {
    if (!playing || held || !inView || filtered.length < 2) return;
    const t = window.setTimeout(() => {
      const i = filtered.findIndex((s) => s.id === activeId);
      select(filtered[(i + 1) % filtered.length].id);
    }, AUTO_PLAY_DELAY);
    return () => window.clearTimeout(t);
  }, [playing, held, inView, filtered, activeId, select]);

  // Switching category jumps to that category's first skill if the current one isn't in it.
  const chooseCategory = (cat) => {
    setCategory(cat);
    const list = cat === "All" ? SKILLS_DATA : SKILLS_DATA.filter((s) => s.category === cat);
    if (!list.some((s) => s.id === activeId)) select(list[0].id);
  };

  // Keep the active pill in view (horizontal only, never scrolls the page).
  useEffect(() => {
    const container = pillsRef.current;
    const btn = container?.querySelector('[aria-pressed="true"]');
    if (!container || !btn) return;
    container.scrollTo({ left: btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2, behavior: "smooth" });
  }, [activeId, category]);

  return (
    <section
      id="skills"
      ref={sectionRef}
      aria-labelledby="skills-title"
      className="stage-dark relative h-[100svh] min-h-[680px] overflow-hidden select-none"
    >
      <div ref={canvasRef} className="absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 z-[2] bg-gradient-to-b from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] z-[2] bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/85 to-transparent" />

      <div className="absolute inset-0 z-[5] pointer-events-none flex flex-col justify-between">
        <div className="max-w-screen-container layout-padding w-full pt-24 md:pt-28">
          <Rule />
          <div className="mt-4 flex items-baseline justify-between gap-6" data-reveal="up">
            <span className="flex items-baseline gap-4">
              <span className="index">(02)</span>
              <h2 id="skills-title" className="label">
                Stack
              </h2>
            </span>
            <span className="label hidden md:block">
              {SKILLS_DATA.length} tools · {CATEGORIES.length - 1} disciplines
            </span>
          </div>

          <div className="mt-8 md:mt-12 h-[150px] md:h-[210px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="label !text-[var(--signal)]">{current.category}</p>
                <p className="serif mt-3 text-[3.6rem] md:text-[7.5rem] leading-[0.9] tracking-[-0.035em] text-[var(--fg)]">
                  {current.label}
                </p>
                <p className="mt-4 text-[0.98rem] md:text-[1.05rem] text-[var(--muted)]">{current.details}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div
          className="pointer-events-auto max-w-screen-container layout-padding w-full pb-7 md:pb-10"
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
          }}
        >
          <div className="flex items-center justify-between gap-6 border-t border-[var(--line)] pt-3">
            <div role="group" aria-label="Filter skills by category" className="flex gap-5 md:gap-8 overflow-x-auto scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => chooseCategory(cat)}
                  className="group relative inline-flex min-h-11 items-center whitespace-nowrap text-[0.92rem] text-[var(--muted)] transition-colors hover:text-[var(--fg)] aria-pressed:text-[var(--fg)]"
                >
                  {cat}
                  <sup className="ml-0.5 -top-2 text-[0.6rem] tabular text-[var(--faint)] group-aria-pressed:text-[var(--signal)]">{COUNTS[cat]}</sup>
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-2 bottom-2 h-px origin-left scale-x-0 bg-[var(--beam)] transition-transform duration-500 group-aria-pressed:scale-x-100"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause skill slideshow" : "Play skill slideshow"}
              className="label inline-flex min-h-11 flex-shrink-0 items-center gap-2 transition-colors hover:text-[var(--fg)]"
            >
              {playing ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
              <span aria-hidden="true">{playing ? "Pause" : "Play"}</span>
            </button>
          </div>

          <div
            ref={pillsRef}
            role="group"
            aria-label="Skills"
            className="mt-2 flex md:flex-wrap gap-x-0 overflow-x-auto md:overflow-visible scrollbar-none"
          >
            {filtered.map((item, i) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => select(item.id)}
                  className="group relative inline-flex min-h-11 flex-shrink-0 items-center whitespace-nowrap pr-3 text-[1rem] md:text-[1.06rem]"
                >
                  <span
                    className={`transition-colors duration-300 ${
                      isActive ? "text-[var(--signal)]" : "text-[var(--muted)] group-hover:text-[var(--fg)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {i < filtered.length - 1 ? (
                    <span aria-hidden="true" className="pl-3 text-[var(--faint)]">
                      /
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between label">
            <span aria-hidden="true" className="tabular">
              {String(Math.max(position, 0) + 1).padStart(2, "0")} / {String(filtered.length).padStart(2, "0")}
            </span>
            <span className="hidden md:block">Move through the particles — pick a skill</span>
            <span className="md:hidden">Tap a skill</span>
          </div>
        </div>
      </div>
    </section>
  );
}
