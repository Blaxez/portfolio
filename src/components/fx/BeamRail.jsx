"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

/**
 * The thread of the page: a hairline in the left margin that the hero's laser
 * hands off to. It is lit down to a point 62% into the viewport, so the beam's
 * head travels with the reader through every chapter.
 */
export default function BeamRail() {
  const ref = useRef(null);
  const fillRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const rail = ref.current;
    const fill = fillRef.current;
    const head = headRef.current;
    let height = rail.offsetHeight;
    let st;

    const apply = (p) => {
      fill.style.transform = `scaleY(${p})`;
      head.style.transform = `translate3d(0, ${p * height}px, 0)`;
      head.style.opacity = p > 0.001 && p < 0.999 ? "1" : "0";
    };

    const cancelIdle = afterFirstPaint(() => {
      st = ScrollTrigger.create({
        trigger: rail,
        start: "top 62%",
        end: "bottom 62%",
        onRefresh: (self) => {
          height = rail.offsetHeight;
          apply(self.progress);
        },
        onUpdate: (self) => apply(self.progress),
      });
    });
    return () => {
      cancelIdle();
      st?.kill();
    };
  }, []);

  return (
    <div ref={ref} className="beam-rail" aria-hidden="true">
      <div className="beam-rail-track" />
      <div ref={fillRef} className="beam-rail-fill" />
      <div ref={headRef} className="beam-rail-head" style={{ opacity: 0 }}>
        <span className="beam-rail-tail" />
        <span className="beam-head" />
      </div>
    </div>
  );
}
