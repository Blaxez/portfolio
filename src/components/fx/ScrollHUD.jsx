"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SECTIONS } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

/** Top progress bar + right-edge chapter rail ("where am I in the story"). */
export default function ScrollHUD() {
  const barRef = useRef(null);
  const [active, setActive] = useState("hero");

  useEffect(() => {
    let tween;
    const cancelIdle = afterFirstPaint(() => {
      tween = gsap.to(barRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });
    });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      cancelIdle();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      observer.disconnect();
    };
  }, []);

  const activeIndex = Math.max(0, SECTIONS.findIndex((s) => s.id === active));

  return (
    <>
      <div ref={barRef} className="scroll-progress" aria-hidden="true" />
      <nav
        aria-label="Chapters"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden min-[1600px]:flex flex-col items-end gap-3 mix-blend-difference text-white"
      >
        {SECTIONS.map((s, i) => {
          const isActive = s.id === active;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget(`#${s.id}`);
              }}
              aria-current={isActive ? "step" : undefined}
              className="group flex items-center gap-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.16em]"
            >
              <span
                className={`transition-all duration-500 ${
                  isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-70 group-hover:translate-x-0"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {s.label}
              </span>
              <span
                aria-hidden="true"
                className={`block h-px bg-white transition-all duration-500 ${isActive ? "w-10" : "w-4 opacity-50 group-hover:w-6"}`}
              />
            </a>
          );
        })}
        <span aria-hidden="true" className="mt-2 tabular text-[0.66rem] tracking-[0.16em] opacity-60">
          {String(activeIndex + 1).padStart(2, "0")}/{String(SECTIONS.length).padStart(2, "0")}
        </span>
      </nav>
    </>
  );
}
