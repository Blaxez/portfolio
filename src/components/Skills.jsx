'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SkillsParticleSystem } from '@/lib/SkillsParticleSystem';
import { getAssetPath } from '@/lib/assets';

const SKILLS_DATA = [
    { id: "js", label: "JavaScript", slug: "javascript", icon: "javascript.svg", color: "#F7DF1E", category: "Languages", details: "Advanced ES6+, React, Node.js" },
    { id: "py", label: "Python", slug: "python", icon: "python.svg", color: "#3776AB", category: "Languages", details: "AI/ML, Data Science" },
    { id: "c", label: "C", slug: "c", icon: "c.svg", color: "#A8B9CC", category: "Languages", details: "System Programming" },
    { id: "cs", label: "C#", slug: "dotnet", icon: "dotnet.svg", color: "#239120", category: "Languages", details: "Game Dev, .NET" },
    { id: "cpp", label: "C++", slug: "cplusplus", icon: "cplusplus.svg", color: "#00599C", category: "Languages", details: "Game Dev, Systems" },
    { id: "java", label: "Java", slug: "java", icon: "java.svg", color: "#5382a1", category: "Languages", details: "Enterprise, Android" },
    { id: "go", label: "Go", slug: "go", icon: "go.svg", color: "#00ADD8", category: "Languages", details: "Concurrent Programming" },
    { id: "react", label: "React", slug: "react", icon: "react.svg", color: "#61DAFB", category: "Web", details: "SPAs, State Management" },
    { id: "next", label: "Next.js", slug: "nextdotjs", icon: "nextdotjs.svg", color: "#ffffff", category: "Web", details: "SSR, Static Generation" },
    { id: "node", label: "Node.js", slug: "nodedotjs", icon: "nodedotjs.svg", color: "#339933", category: "Web", details: "APIs, Microservices" },
    { id: "tailwind", label: "Tailwind", slug: "tailwindcss", icon: "tailwindcss.svg", color: "#06B6D4", category: "Web", details: "Responsive Design" },
    { id: "graphql", label: "GraphQL", slug: "graphql", icon: "graphql.svg", color: "#E10098", category: "Web", details: "API Design" },
    { id: "tf", label: "TensorFlow", slug: "tensorflow", icon: "tensorflow.svg", color: "#FF6F00", category: "AI/ML", details: "Deep Learning" },
    { id: "pytorch", label: "PyTorch", slug: "pytorch", icon: "pytorch.svg", color: "#EE4C2C", category: "AI/ML", details: "Computer Vision, NLP" },
    { id: "sklearn", label: "Scikit-learn", slug: "scikitlearn", icon: "scikitlearn.svg", color: "#F7931E", category: "AI/ML", details: "ML Algorithms" },
    { id: "ollama", label: "Ollama", slug: "ollama", icon: "ollama.svg", color: "#FFFFFF", category: "AI/ML", details: "Local LLMs" },
    { id: "prompt", label: "Prompt Eng.", slug: "openai", icon: "openai.svg", color: "#412991", category: "AI/ML", details: "LLM Optimization" },
    { id: "aitools", label: "AI Tools", slug: "huggingface", icon: "huggingface.svg", color: "#FFD21E", category: "AI/ML", details: "Models & Integration" },
    { id: "unreal", label: "Unreal", slug: "unrealengine", icon: "unrealengine.svg", color: "#ffffff", category: "Creative", details: "Game Development" },
    { id: "blender", label: "Blender", slug: "blender", icon: "blender.svg", color: "#F5792A", category: "Creative", details: "3D Modeling" },
    { id: "git", label: "Git", slug: "git", icon: "git.svg", color: "#F05032", category: "DevOps", details: "Version Control" },
    { id: "docker", label: "Docker", slug: "docker", icon: "docker.svg", color: "#2496ED", category: "DevOps", details: "Containerization" },
    { id: "aws", label: "AWS", slug: "amazonwebservices", icon: "amazonwebservices.svg", color: "#FF9900", category: "DevOps", details: "Cloud Infrastructure" },
    { id: "vscode", label: "VS Code", slug: "vscodium", icon: "vscode.svg", color: "#007ACC", category: "DevOps", details: "Advanced IDE" },
    { id: "figma", label: "Figma", slug: "figma", icon: "figma.svg", color: "#F24E1E", category: "DevOps", details: "UI/UX Design" },
];

const CATEGORIES = [...new Set(SKILLS_DATA.map(s => s.category))];

export default function Skills() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const autoPlayTimerRef = useRef(null);
  const AUTO_PLAY_DELAY = 4000;
  const scrollContainerRef = useRef(null);

  const filteredSkills = activeCategory === "All"
    ? SKILLS_DATA
    : SKILLS_DATA.filter(s => s.category === activeCategory);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    autoPlayTimerRef.current = setInterval(() => {
      if (engineRef.current) {
        const next = (engineRef.current.currentSkill + 1) % SKILLS_DATA.length;
        engineRef.current.loadSkill(next);
      }
    }, AUTO_PLAY_DELAY);
  }, [stopAutoPlay]);

  const resetAutoPlay = useCallback(() => {
    stopAutoPlay();
    startAutoPlay();
  }, [stopAutoPlay, startAutoPlay]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const skillsEngine = new SkillsParticleSystem(
        containerRef.current,
        SKILLS_DATA
      );
      engineRef.current = skillsEngine;

      skillsEngine.onSkillChange = (skill, index) => {
        setActiveIndex(index);
      };

      skillsEngine.loadSkill(0);
      startAutoPlay();
    } catch (e) {
      console.error("Skills Engine Init Failed:", e);
    }

    return () => {
      stopAutoPlay();
    };
  }, [startAutoPlay, stopAutoPlay]);

  const handleSkillClick = useCallback((index) => {
    if (engineRef.current) {
      engineRef.current.loadSkill(index);
      resetAutoPlay();
    }
  }, [resetAutoPlay]);

  // Auto-scroll active pill into view (manual scrollLeft to avoid page scroll)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const activeBtn = container.querySelector('[data-active="true"]');
    if (activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const scrollTarget = activeBtn.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
      container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [activeIndex, activeCategory]);

  const currentSkill = SKILLS_DATA[activeIndex];


  return (
    <section
      id="skills"
      className="relative h-screen bg-[var(--surface)] overflow-hidden border-y border-[var(--border)] transition-colors duration-700 select-none"
    >
      {/* 3D Canvas — OrbitControls work directly on this */}
      <div
        id="skills-canvas-container"
        ref={containerRef}
        className="absolute inset-0 z-[1]"
      />

      {/* Top gradient fade */}
      <div
        className="absolute top-0 left-0 w-full h-20 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--surface), transparent)" }}
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 w-full h-40 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to top, var(--surface), transparent)" }}
      />

      {/* UI Overlay — pointer-events-none so OrbitControls work through it */}
      <div className="absolute inset-0 z-[5] pointer-events-none flex flex-col justify-between">

        {/* Top: Skill Info — fixed height container to prevent layout shift */}
        <div
          className="pointer-events-none pt-28 md:pt-32 px-6 md:px-12 pb-10"
          style={{ background: "linear-gradient(to bottom, var(--surface) 0%, var(--surface) 30%, transparent 100%)" }}
        >
          <div className="font-mono text-[10px] md:text-xs text-[var(--acc)] uppercase tracking-widest mb-4">
            [ {currentSkill?.category || "TECHNOLOGIES"} ]
          </div>

          {/* Fixed height wrapper — prevents layout shift during AnimatePresence */}
          <div className="h-[70px] md:h-[90px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSkill?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white mb-2"
                  style={{
                    textShadow: currentSkill
                      ? `0 0 30px ${currentSkill.color}40, 0 2px 10px rgba(0,0,0,0.8)`
                      : "0 2px 10px rgba(0,0,0,0.8)",
                  }}
                >
                  {currentSkill?.label || "SYNAPSE"}
                </h2>
                <p className="text-sm md:text-base text-white/60 font-light max-w-md">
                  {currentSkill?.details || "Initialize sequence..."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: Skill Selector — pointer-events-auto only here for clicks */}
        <div className="pointer-events-auto pb-6 md:pb-8 px-4 md:px-10">
          {/* Category Filters */}
          <div className="flex gap-1.5 md:gap-2 mb-3 overflow-x-auto scrollbar-none pb-1">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-mono text-[9px] md:text-[10px] uppercase tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 border rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? "border-[var(--acc)] text-[var(--acc)] bg-[var(--acc)]/10"
                    : "border-[var(--border)] text-[var(--fg)] opacity-40 hover:opacity-70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Skill Pills — py-3 + -my-3 gives breathing room for glow without changing layout */}
          <div
            ref={scrollContainerRef}
            className="flex gap-1.5 md:gap-2 overflow-x-auto py-3 -my-3 px-1 scrollbar-none scroll-smooth"
          >
            {filteredSkills.map((item) => {
              const globalIndex = SKILLS_DATA.findIndex(s => s.id === item.id);
              const isActive = globalIndex === activeIndex;

              return (
                <button
                  key={item.id}
                  data-active={isActive}
                  onClick={() => handleSkillClick(globalIndex)}
                  className={`group relative flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 border rounded-lg whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? "shadow-lg scale-105"
                      : "border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm hover:border-[var(--fg)]/30 hover:bg-white/5"
                  }`}
                  style={
                    isActive
                      ? {
                          borderColor: item.color,
                          boxShadow: `0 0 24px ${item.color}30`,
                          background: `${item.color}12`,
                        }
                      : {}
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAssetPath(`/assets/skills/${item.icon}`)}
                    width="16"
                    height="16"
                    alt={item.label}
                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{
                      filter: isActive ? "none" : "grayscale(0.6) brightness(0.7)",
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span
                    className={`font-mono text-[10px] md:text-[11px] uppercase tracking-wider transition-colors ${
                      isActive ? "text-[var(--fg)] font-bold" : "text-[var(--fg)] opacity-40 group-hover:opacity-70"
                    }`}
                    style={isActive ? { color: item.color } : {}}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer: Counter + Hint */}
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="font-mono text-[9px] md:text-[10px] text-[var(--fg)] opacity-25 uppercase tracking-widest">
              {String(activeIndex + 1).padStart(2, "0")} / {String(SKILLS_DATA.length).padStart(2, "0")}
            </span>
            <span className="font-mono text-[9px] md:text-[10px] text-[var(--fg)] opacity-25 uppercase tracking-widest hidden md:block">
              Scroll · Click
            </span>
            <span className="font-mono text-[9px] text-[var(--fg)] opacity-25 uppercase tracking-widest md:hidden">
              Scroll · Tap
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
