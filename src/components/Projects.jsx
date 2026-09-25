"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, ExternalLink, Github, ChevronsDown } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

const ServiceCard = ({ service, i, progress, active, onClick }) => {
  const offset = Math.max(-10, Math.min(10, ((i % 5) - 2) * 5));
  const parallax = useTransform(progress, [0, 1], ["0%", `${offset}%`]);

  return (
    <motion.div
      className="relative h-[50vh] md:h-[60vh] w-[80vw] md:w-[45vw] flex-shrink-0 group cursor-pointer"
      whileHover={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full h-full bg-white dark:bg-black relative overflow-hidden rounded-sm border-l border-[var(--border)]">
        <motion.div className="absolute inset-0 w-[120%] h-full -left-[10%]" style={{ x: parallax }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={service.img}
            alt={service.title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              active ? "opacity-80 grayscale-0" : "opacity-60 grayscale group-hover:opacity-80 group-hover:grayscale-0"
            }`}
          />
        </motion.div>
        <div className={`absolute inset-0 flex flex-col justify-end p-5 md:p-8 lg:p-12 z-10 bg-gradient-to-t transition-all duration-500 ${
          active ? "from-black/90" : "from-white/90 dark:from-black/80 group-hover:from-black/90"
        } to-transparent`}>
          <div className="overflow-hidden">
            <h3 className={`text-[8vw] md:text-[5vw] font-black uppercase leading-[0.85] tracking-tighter transition-all duration-500 ${
              active ? "text-white translate-y-0" : "text-[var(--fg)] group-hover:text-white transform translate-y-4 group-hover:translate-y-0"
            }`}>
              {service.title}
            </h3>
          </div>
          <div className={`flex justify-between items-end mt-3 md:mt-4 border-t pt-3 md:pt-4 transition-colors duration-500 ${
            active ? "border-white/20" : "border-[var(--fg)]/20 group-hover:border-white/20"
          }`}>
            <span className="font-mono text-xs md:text-sm text-[var(--acc)]">{service.cat}</span>
            <div className={`flex items-center gap-3 font-mono text-[10px] md:text-xs uppercase transition-colors duration-500 ${
              active ? "text-white/60" : "text-[var(--fg)]/60 group-hover:text-white/60"
            }`}>
              {service.repoUrl && (
                <a href={service.repoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="pointer-events-auto hover:text-[var(--acc)] transition-colors" title="View Source">
                  <Github size={14} />
                </a>
              )}
              {service.liveUrl && (
                <a href={service.liveUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="pointer-events-auto hover:text-[var(--acc)] transition-colors" title="Live Demo">
                  <ExternalLink size={14} />
                </a>
              )}
              <span>Details</span>
              <ArrowUpRight size={12} />
            </div>
          </div>
        </div>
      </div>
      <span className="absolute -top-8 md:-top-12 -left-2 text-[5rem] md:text-[8rem] font-black text-[var(--fg)] opacity-[0.03] pointer-events-none select-none z-0">
        0{i + 1}
      </span>
    </motion.div>
  );
};

export default function Projects() {
  const targetRef = useRef(null);
  const [activeCard, setActiveCard] = useState(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.1, damping: 15, stiffness: 100, restDelta: 0.001,
  });

  const { projects, loading, error } = useProjects();

  const contentRef = useRef(null);
  const [scrollRange, setScrollRange] = useState(0);

  useEffect(() => {
    const calculateWidth = () => {
      if (contentRef.current) {
        const range = contentRef.current.scrollWidth - window.innerWidth;
        setScrollRange(range > 0 ? range : 0);
      }
    };
    calculateWidth();
    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, [projects]);

  const x = useTransform(smoothProgress, [0, 1], [0, -scrollRange]);

  // Touch-swipe support: convert horizontal swipes into vertical scroll
  // so the existing scroll-driven horizontal animation works on mobile
  const stickyRef = useRef(null);
  const touchState = useRef({ startX: 0, startY: 0, isHorizontal: null });

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchState.current = { startX: t.clientX, startY: t.clientY, isHorizontal: null };
    };

    const onTouchMove = (e) => {
      const t = e.touches[0];
      const dx = t.clientX - touchState.current.startX;
      const dy = t.clientY - touchState.current.startY;

      // Determine swipe direction on first significant movement
      if (touchState.current.isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        touchState.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (touchState.current.isHorizontal) {
        e.preventDefault();
        // Convert horizontal swipe into vertical scroll (multiplied for natural feel)
        window.scrollBy(0, -dx * 1.5);
        touchState.current.startX = t.clientX;
        touchState.current.startY = t.clientY;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const scrollToEnd = () => {
    if (targetRef.current) {
      const sectionBottom = targetRef.current.offsetTop + targetRef.current.offsetHeight;
      window.scrollTo({ top: sectionBottom, behavior: "smooth" });
    }
  };

  return (
    <section ref={targetRef} id="projects" className="relative h-[300vh] bg-[var(--surface)]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] flex flex-col justify-center overflow-hidden border-t border-[var(--border)]">
        <div className="absolute top-20 md:top-28 left-0 right-0 z-10 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex justify-between items-end">
            <div className="flex items-center gap-3 md:gap-4 text-[var(--fg)]">
              <div className="w-2 h-2 bg-[var(--acc)] rounded-full animate-pulse" />
              <h2 className="text-[10px] md:text-sm font-mono uppercase tracking-widest opacity-80">
                Featured Projects // Scroll to Explore
              </h2>
            </div>
          </div>
        </div>

        {error && (
          <div className="absolute top-32 md:top-40 left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
              <p className="font-mono text-xs text-[var(--acc)] opacity-70 pointer-events-auto">
                Projects temporarily unavailable.{" "}
                <a href="https://github.com/blaxezcode" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100">blaxezcode</a>{" / "}
                <a href="https://github.com/Blaxez" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100">Blaxez</a>
              </p>
            </div>
          </div>
        )}

        <motion.div ref={contentRef} style={{ x }} className="flex gap-4 md:gap-8 lg:gap-16 px-4 md:px-12 will-change-transform w-max">
          {projects.map((project, i) => (
            <ServiceCard
              key={project.id || i}
              service={project}
              i={i}
              progress={smoothProgress}
              active={activeCard === i}
              onClick={() => setActiveCard(activeCard === i ? null : i)}
            />
          ))}
        </motion.div>

        <div className="absolute bottom-6 md:bottom-12 left-0 right-0 z-10 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center gap-4 md:gap-6 pointer-events-auto">
            <div className="flex-1 h-[1px] bg-[var(--border)] overflow-hidden">
              <motion.div style={{ scaleX: smoothProgress, originX: 0 }} className="h-full bg-[var(--acc)]" />
            </div>
            <div className="font-mono text-[10px] md:text-xs text-[var(--fg)] opacity-50 whitespace-nowrap">
              {projects.length} Projects
            </div>
            <button
              onClick={scrollToEnd}
              className="flex items-center gap-1.5 font-mono text-[10px] md:text-xs text-[var(--acc)] opacity-70 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border border-[var(--acc)]/30 hover:border-[var(--acc)] rounded-full px-3 py-1.5 whitespace-nowrap"
              title="Skip to end of projects"
            >
              <span>Skip to End</span>
              <ChevronsDown size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
