"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Download } from "lucide-react";
import DotGridBackground from "@/lib/DotGridBackground";
import { getAssetPath } from "@/lib/assets";
import { SITE } from "@/lib/site";
import { prefersReducedMotion, scrollToTarget } from "@/lib/scroll";
import { INTRO_DONE } from "./Preloader";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const lerpBySize = (min, max) => {
  const width = window.innerWidth || 1024;
  if (width >= 768) return min;
  if (width <= 320) return max;
  return min + ((768 - width) / (768 - 320)) * (max - min);
};

export default function Hero() {
  const sectionRef = useRef(null);
  const laserRef = useRef(null);
  const contentRef = useRef(null);
  const mascotRef = useRef(null);
  const letterRef = useRef(null);

  // WebGL laser (three.js loaded on demand, not in the initial bundle) + dot grid.
  useEffect(() => {
    let laser;
    let cancelled = false;
    let resizeTimeout;
    const mobile = window.innerWidth < 768;

    // Decorative WebGL starts after the headline has painted and the main thread is idle.
    const cancelIdle = afterFirstPaint(async () => {
      const { default: LaserFlow } = await import("@/lib/LaserFlow");
      if (cancelled || !laserRef.current) return;
      laser = new LaserFlow({
        container: laserRef.current,
        color: "#FF5B22",
        horizontalBeamOffset: 0.0,
        verticalBeamOffset: -0.5,
        verticalSizing: lerpBySize(3.0, 8.0),
        horizontalSizing: lerpBySize(1.4, 2.2),
        fogIntensity: 0.65,
        wispDensity: mobile ? 0.25 : 0.4,
        flowStrength: 0.58,
        // The fog is soft: 1× (0.8× on phones) looks the same and is 2–4× cheaper on high-DPI screens.
        dpr: mobile ? 0.8 : 1,
      });
    });

    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        laser?.update({ verticalSizing: lerpBySize(3.0, 8.0), horizontalSizing: lerpBySize(1.4, 2.2) });
      }, 150);
    };
    window.addEventListener("resize", onResize);

    // Cursor-reactive dots only make sense with a hovering pointer.
    const dotGrid = sectionRef.current && window.matchMedia("(pointer: fine)").matches
      ? new DotGridBackground({
          container: sectionRef.current,
          dotSpacing: 11,
          baseRadius: 0.6,
          maxRadius: 1.1,
          influenceRadius: 360,
          maxOpacity: 0.55,
          color: "rgba(255, 91, 34, 1)",
        })
      : null;

    return () => {
      cancelled = true;
      cancelIdle();
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      laser?.destroy();
      dotGrid?.destroy();
    };
  }, []);

  // Seat the mascot on the "h" of "Santosh"; it stays invisible until placed.
  useIsomorphicLayoutEffect(() => {
    const mascot = mascotRef.current;
    const letter = letterRef.current;
    if (!mascot || !letter) return;

    // Layout offsets, not getBoundingClientRect: the name lines are translated
    // during the intro and the mascot must be seated on the final position.
    const place = () => {
      const parent = mascot.offsetParent;
      if (!parent) return;
      let x = 0;
      let y = 0;
      for (let el = letter; el && el !== parent; el = el.offsetParent) {
        x += el.offsetLeft;
        y += el.offsetTop;
      }
      const letterSpacing = parseFloat(window.getComputedStyle(letter).letterSpacing) || 0;
      const w = mascot.offsetWidth;
      const h = mascot.offsetHeight;
      gsap.set(mascot, {
        left: x + letter.offsetWidth - letterSpacing * 2 - w * 0.65,
        top: y - h + h * 0.27,
        transformOrigin: "65% 88%",
      });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(mascot);
    ro.observe(letter);
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  // Intro + scroll choreography.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const section = sectionRef.current;
    const mascot = mascotRef.current;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray(".hero-name-line");
      const fades = gsap.utils.toArray("[data-hero-fade]");

      if (reduced) {
        gsap.set(mascot, { opacity: 1 });
        return;
      }

      const curtain = !window.__introDone && !document.documentElement.classList.contains("intro-seen");
      if (curtain) {
        // Offset (never hidden) while the curtain covers the page, so the
        // text is painted at first paint and LCP isn't held back by the intro.
        gsap.set(lines, { yPercent: 55, scale: 1.06, filter: "blur(10px)" });
        gsap.set(fades, { y: 28 });
      }
      gsap.set(mascot, { y: -window.innerHeight * 0.6, rotate: -25, opacity: 1 });

      const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      if (curtain) intro.to(lines, { yPercent: 0, scale: 1, filter: "blur(0px)", duration: 1.3, stagger: 0.12 }, 0);
      intro.to(mascot, { y: 0, rotate: 0, duration: 1.1, ease: "bounce.out" }, curtain ? 0.45 : 0);
      if (curtain) intro.to(fades, { y: 0, duration: 1, stagger: 0.09 }, 0.35);

      const play = () => intro.play();
      if (window.__introDone || !curtain) play();
      else window.addEventListener(INTRO_DONE, play, { once: true });

      return () => window.removeEventListener(INTRO_DONE, play);
    }, section);

    // Scroll out (set up after first paint): the stage recedes, the name scales away, the mascot hops off.
    const cancelIdle = reduced
      ? () => {}
      : afterFirstPaint(() =>
          ctx.add(() => {
            gsap
              .timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 } })
              .to(laserRef.current, { scale: 1.15, opacity: 0.25, ease: "none" }, 0)
              .to(contentRef.current, { yPercent: -18, opacity: 0, ease: "none" }, 0)
              .to(".hero-name-mask", { scale: 0.92, ease: "none" }, 0)
              .to(".scroll-cue", { opacity: 0, ease: "none", duration: 0.2 }, 0)
              .fromTo(
                mascot,
                { yPercent: 0, rotate: 0 },
                { yPercent: -160, rotate: 18, ease: "power1.in", immediateRender: false },
                0,
              );
          }),
        );
    return () => {
      cancelIdle();
      ctx.revert();
    };
  }, []);

  const secondary = SITE.cvPath
    ? { label: "Download CV", href: getAssetPath(SITE.cvPath), icon: <Download size={16} className="btn-arrow" />, download: true }
    : { label: "View My Work", href: "#projects", icon: <ArrowUpRight size={16} className="btn-arrow" />, target: "#projects" };

  return (
    <section id="hero" ref={sectionRef} aria-labelledby="hero-title" className="hero-content stage-dark">
      <div id="laser-container" ref={laserRef} aria-hidden="true" />
      <div ref={contentRef} className="hero-layout max-w-screen-container">
        <div className="hero-layout-left">
          <div className="hero-mascot" ref={mascotRef} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetPath("/assets/mascot-480.webp")}
              srcSet={`${getAssetPath("/assets/mascot-256.webp")} 256w, ${getAssetPath("/assets/mascot-480.webp")} 480w`}
              sizes="(max-width: 768px) 130px, 240px"
              alt=""
              width={240}
              height={240}
              fetchPriority="high"
              className="w-full h-auto object-contain select-none"
              draggable={false}
            />
          </div>
          <h1 id="hero-title" className="hero-name" aria-label={SITE.name}>
            <span className="hero-name-mask block pb-[0.06em]" aria-hidden="true">
              <span className="hero-name-line block">
                Santos
                <span ref={letterRef} className="inline-block">
                  h
                </span>
              </span>
            </span>
            <span className="hero-name-mask block pb-[0.06em]" aria-hidden="true">
              <span className="hero-name-line block">Maurya</span>
            </span>
          </h1>
        </div>
        <div className="hero-layout-right">
          <p className="hero-role" data-hero-fade>
            Full-Stack Developer · AI &amp; ML · Game Dev
          </p>
          <p className="hero-bio" data-hero-fade>
            Four-plus years of hands-on work across full-stack web development, game development and applied AI/ML —
            leading teams through rapid prototyping, architecting scalable web apps and designing intelligent systems.
          </p>
          <div className="cta-buttons" data-hero-fade>
            <a
              href="#contact"
              className="btn btn-signal"
              data-magnetic="0.3"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#contact");
              }}
            >
              Get in Touch <ArrowUpRight size={16} className="btn-arrow" />
            </a>
            <a
              href={secondary.href}
              className="btn btn-line"
              data-magnetic="0.3"
              download={secondary.download || undefined}
              onClick={
                secondary.target
                  ? (e) => {
                      e.preventDefault();
                      scrollToTarget(secondary.target);
                    }
                  : undefined
              }
            >
              {secondary.label} {secondary.icon}
            </a>
          </div>
        </div>
      </div>
      <a
        href="#about"
        className="scroll-cue label"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget("#about");
        }}
        aria-label="Scroll to About"
      >
        <span aria-hidden="true">Scroll</span>
        <span className="scroll-cue-line" aria-hidden="true" />
      </a>
    </section>
  );
}
