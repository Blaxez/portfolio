"use client";

import { useEffect } from "react";
import { stageStore } from "@/gl/bridge";

interface Pose {
  x: number;
  y: number;
  scale: number;
}

/** Where the teapot sits in each beat (NDC lens shift + scale), per layout. */
const POSES: Record<"wide" | "narrow", Record<"hero" | "craft" | "contact", Pose>> = {
  wide: {
    hero: { x: 0.44, y: -0.02, scale: 1.12 },
    craft: { x: 0.36, y: 0.02, scale: 1.25 },
    contact: { x: 0.48, y: 0.1, scale: 0.95 },
  },
  narrow: {
    hero: { x: 0, y: 0.34, scale: 1.7 },
    craft: { x: 0, y: 0.44, scale: 1.35 },
    contact: { x: 0, y: 0.46, scale: 1.3 },
  },
};

const STAGES = 5;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  scale: a.scale + (b.scale - a.scale) * t,
});

/**
 * Craft progress → pipeline stage. Each fifth of the track holds its pass for
 * the first ~55%, then wipes to the next, so copy is readable between wipes.
 */
function stageFromProgress(p: number): number {
  const u = clamp01(p) * STAGES;
  const k = Math.min(STAGES - 1, Math.floor(u));
  if (k >= STAGES - 1) return STAGES - 1;
  return k + smoothstep(0.55, 0.95, u - k);
}

/**
 * Scroll choreography. GSAP + ScrollTrigger load after hydration (never on the
 * critical path); every tween animates transform/opacity only, and pinning is
 * CSS `position: sticky`, so nothing here can shift layout.
 */
export default function Choreography() {
  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const layer = document.querySelector<HTMLElement>("[data-stage-layer]");
      const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-craft-panel]"));
      const rail = Array.from(document.querySelectorAll<HTMLElement>("[data-craft-rail]"));
      const fills = rail.map((item) => item.querySelector<HTMLElement>("[data-craft-fill]"));

      const mm = gsap.matchMedia();
      mm.add(
        {
          wide: "(min-width: 768px)",
          narrow: "(max-width: 767.98px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { wide, reduce } = context.conditions as { wide: boolean; narrow: boolean; reduce: boolean };
          const poses = wide ? POSES.wide : POSES.narrow;

          // ── Scene: section progress → teapot pose, pipeline stage, layer opacity ──
          const hero = ScrollTrigger.create({ trigger: "#top", start: "top top", end: "bottom top" });
          const craft = ScrollTrigger.create({ trigger: "#craft", start: "top top", end: "bottom bottom" });
          const fadeOut = ScrollTrigger.create({ trigger: "#about", start: "top bottom", end: "top 30%" });
          const fadeIn = ScrollTrigger.create({ trigger: "#contact", start: "top 85%", end: "top 20%" });

          // Style writes are skipped when unchanged, so idle regions of the page cost no style recalc.
          const fillCache: string[] = [];
          let layerOpacity = "";
          let activePanel = -1; // forces a DOM sync on first resolve (also after a breakpoint change)
          const setPanel = (index: number) => {
            if (index === activePanel) return;
            activePanel = index;
            panels.forEach((panel, i) => {
              panel.toggleAttribute("data-active", i === index);
              panel.toggleAttribute("data-past", i < index);
            });
            rail.forEach((item, i) => item.toggleAttribute("data-active", i === index));
          };

          const resolve = () => {
            let pose: Pose;
            let stage: number;
            let spin: number;
            let opacity: number;
            if (fadeIn.progress > 0) {
              pose = poses.contact;
              stage = STAGES - 1;
              spin = 4.4 + fadeIn.progress * 0.9;
              opacity = fadeIn.progress;
            } else if (craft.progress > 0 || hero.progress >= 1) {
              pose = poses.craft;
              stage = stageFromProgress(craft.progress);
              spin = 0.9 + craft.progress * 3.5;
              opacity = 1 - fadeOut.progress;
            } else {
              pose = mix(poses.hero, poses.craft, smoothstep(0, 1, hero.progress));
              stage = 0;
              spin = hero.progress * 0.9;
              opacity = 1;
            }

            const u = clamp01(craft.progress) * STAGES;
            fills.forEach((fill, i) => {
              const v = clamp01(u - i).toFixed(3);
              if (fill && fillCache[i] !== v) {
                fillCache[i] = v;
                fill.style.transform = `scaleX(${v})`;
              }
            });
            setPanel(Math.min(STAGES - 1, Math.floor(stageFromProgress(craft.progress) + 0.5)));

            const o = opacity.toFixed(3);
            if (layer && o !== layerOpacity) {
              layerOpacity = o;
              layer.style.opacity = o;
            }
            stageStore.setTarget({ ...pose, stage, spin, visible: opacity > 0.004 });
          };

          // Created last so the section triggers above have already updated this tick.
          ScrollTrigger.create({ start: 0, end: "max", onUpdate: resolve, onRefresh: resolve });

          if (reduce) return;

          // ── Scrubbed DOM motion ──
          gsap.to("[data-hero-inner]", {
            yPercent: -10,
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: { trigger: "#top", start: "top top", end: "bottom 15%", scrub: 0.4 },
          });

          gsap.utils.toArray<HTMLElement>("[data-cover]").forEach((cover) => {
            const mask = cover.querySelector("[data-cover-mask]");
            const inner = cover.querySelector("[data-cover-inner]");
            if (mask) {
              gsap.fromTo(
                mask,
                { scaleY: 1, transformOrigin: "50% 0%" },
                { scaleY: 0, ease: "none", scrollTrigger: { trigger: cover, start: "top 90%", end: "top 45%", scrub: 0.4 } },
              );
            }
            if (inner) {
              gsap.fromTo(
                inner,
                { scale: 1.12, yPercent: -4 },
                { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: cover, start: "top bottom", end: "bottom top", scrub: 0.4 } },
              );
            }
          });

          gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((title) => {
            gsap.fromTo(
              title,
              { xPercent: 4 },
              { xPercent: -2, ease: "none", scrollTrigger: { trigger: title, start: "top bottom", end: "bottom top", scrub: 0.4 } },
            );
          });

          const words = gsap.utils.toArray<HTMLElement>("[data-statement] [data-word]");
          if (words.length) {
            gsap.fromTo(
              words,
              { yPercent: 105 },
              {
                yPercent: 0,
                ease: "none",
                stagger: 0.12,
                scrollTrigger: { trigger: "[data-statement]", start: "top 95%", end: "top 55%", scrub: 0.4 },
              },
            );
          }
        },
      );

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad, { once: true });
      teardown = () => {
        window.removeEventListener("load", onLoad);
        mm.revert();
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return null;
}
