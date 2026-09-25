"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { isFinePointer, prefersReducedMotion } from "@/lib/scroll";

const INTERACTIVE = "a, button, [role='button'], [data-cursor], input, textarea, select, label";

/**
 * Dot + trailing ring cursor with hover/label states, plus magnetic pull on
 * [data-magnetic] elements. Fine pointers only; off for reduced motion.
 */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const root = document.documentElement;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    root.classList.add("has-custom-cursor", "cursor-hidden");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    let magnet = null;
    const release = () => {
      if (!magnet) return;
      gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      magnet = null;
    };

    const onMove = (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      root.classList.remove("cursor-hidden");

      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest("[data-cursor-label]");
      const interactive = target?.closest(INTERACTIVE);
      if (labelled) {
        ring.dataset.state = "label";
        label.textContent = labelled.getAttribute("data-cursor-label");
      } else {
        ring.dataset.state = interactive ? "hover" : "";
      }

      const m = target?.closest("[data-magnetic]");
      if (m !== magnet) release();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const strength = Number(m.getAttribute("data-magnetic")) || 0.35;
        gsap.to(m, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      }
    };
    const onLeave = () => {
      root.classList.add("cursor-hidden");
      release();
    };
    const onDown = () => gsap.to(ring, { scale: 0.8, duration: 0.15 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3, ease: "back.out(3)" });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden [.has-custom-cursor_&]:block" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring hidden [.has-custom-cursor_&]:flex" aria-hidden="true">
        <span ref={labelRef} className="cursor-label" />
      </div>
    </>
  );
}
