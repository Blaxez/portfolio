"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Declarative scroll choreography. Markup opts in with data attributes:
 *   data-split            title words rise out of line masks on enter
 *   data-reveal="up"      fade/rise on enter (batched)
 *   data-scrub-words      words light up as you read (scrubbed)
 *   data-parallax="0.3"   drifts against the scroll
 *   data-count="25"       counts up on enter (server-rendered final value stays for no-JS)
 *   data-clip-reveal      rounded inset opens to full bleed while scrolling in
 * Everything is skipped for reduced motion; content is visible without JS.
 */
export default function MotionDirector() {
  // Off-screen sections pause their CSS animations (marquees, pings, orbit
  // tags, the scroll cue): browsers keep ticking infinite animations — and
  // restyling for them — even when nothing on screen shows them.
  useEffect(() => {
    const targets = document.querySelectorAll("main > section, main > div > section, footer");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)),
      { rootMargin: "100px 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let ctx;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.utils.toArray("[data-split]").forEach((el) => {
          // Words rise out of line masks; at rest the masks open up so
          // descenders and overhangs are never cut.
          const release = (self) => (self.masks || [...el.children]).forEach((m) => (m.style.overflow = "visible"));
          SplitText.create(el, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              if (el.dataset.revealed) {
                release(self);
                return;
              }
              return gsap.from(self.words, {
                yPercent: 118,
                rotate: 3,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.045,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
                onComplete: () => {
                  el.dataset.revealed = "1";
                  release(self);
                },
              });
            },
          });
        });

        ScrollTrigger.batch("[data-reveal='up']", {
          start: "top 92%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { y: 36, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true },
            ),
        });

        gsap.utils.toArray("[data-scrub-words]").forEach((el) => {
          // aria "none": a <p> can't carry aria-label, and whole words read fine as-is.
          const split = SplitText.create(el, { type: "words", aria: "none" });
          gsap.fromTo(
            split.words,
            { opacity: 0.45 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 },
            },
          );
        });

        gsap.utils.toArray("[data-parallax]").forEach((el) => {
          const s = parseFloat(el.dataset.parallax) || 0.2;
          gsap.fromTo(
            el,
            { yPercent: -s * 50 },
            {
              yPercent: s * 50,
              ease: "none",
              scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.utils.toArray("[data-count]").forEach((el) => {
          const end = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const state = { v: 0 };
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            onEnter: () =>
              gsap.to(state, {
                v: end,
                duration: 1.8,
                ease: "power3.out",
                onUpdate: () => {
                  el.textContent = `${Math.round(state.v)}${suffix}`;
                },
              }),
          });
        });

        gsap.utils.toArray("[data-clip-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(8% 6% 8% 6% round 32px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true },
            },
          );
        });
      });
      ScrollTrigger.refresh();
    };

    // After first paint (never competes with it), and after fonts load so
    // SplitText measures line breaks on the real typeface.
    const cancelIdle = afterFirstPaint(() => (document.fonts ? document.fonts.ready : Promise.resolve()).then(run));
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  return null;
}
