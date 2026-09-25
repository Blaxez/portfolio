"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ArrowDown, Download } from "lucide-react";
import DotGridBackground from "@/lib/DotGridBackground";
import { getAssetPath } from "@/lib/assets";
import { SITE } from "@/lib/site";
import { prefersReducedMotion, scrollToTarget } from "@/lib/scroll";
import { INTRO_DONE } from "./Preloader";
import Rule from "./ui/Rule";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const lerpBySize = (min, max) => {
  const width = window.innerWidth || 1024;
  if (width >= 768) return min;
  if (width <= 320) return max;
  return min + ((768 - width) / (768 - 320)) * (max - min);
};

/** Beam x as a fraction of the stage width from centre (LaserFlow's horizontalBeamOffset). */
const beamHome = () => (window.innerWidth >= 1024 ? 0.16 : 0);
/** On desktop the beam lands exactly on the hero's hairline rule; on phones it hits the bottom edge. */
const beamFloor = (section) => {
  const rule = section?.querySelector(".rule");
  if (!rule || window.innerWidth < 1024) return -0.5;
  const s = section.getBoundingClientRect();
  return 0.5 - (rule.getBoundingClientRect().top - s.top) / s.height;
};
const beamRail = () => {
  const rail = document.querySelector(".beam-rail");
  if (!rail || getComputedStyle(rail).display === "none") return null;
  return rail.getBoundingClientRect().left / window.innerWidth - 0.5;
};

export default function Hero() {
  const sectionRef = useRef(null);
  const laserRef = useRef(null);
  const contentRef = useRef(null);
  const mascotRef = useRef(null);
  const letterRef = useRef(null);
  const laserApiRef = useRef(null);

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
        horizontalBeamOffset: beamHome(),
        verticalBeamOffset: beamFloor(sectionRef.current),
        verticalSizing: lerpBySize(3.0, 8.0),
        horizontalSizing: lerpBySize(1.4, 2.2),
        fogIntensity: mobile ? 0.7 : 0.9,
        wispDensity: mobile ? 0.25 : 0.4,
        flowStrength: 0.58,
        dpr: mobile ? 1 : undefined,
      });
      laserApiRef.current = laser;
    });

    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        laser?.update({
          verticalSizing: lerpBySize(3.0, 8.0),
          horizontalSizing: lerpBySize(1.4, 2.2),
          verticalBeamOffset: window.scrollY < 10 ? beamFloor(sectionRef.current) : laser.options.verticalBeamOffset,
        });
      }, 150);
    };
    window.addEventListener("resize", onResize);

    // Cursor-reactive dots only make sense with a hovering pointer.
    const dotGrid = sectionRef.current && window.matchMedia("(pointer: fine)").matches
      ? new DotGridBackground({
          container: sectionRef.current,
          dotSpacing: 8,
          baseRadius: 0.6,
          maxRadius: 1,
          influenceRadius: 560,
          baseOpacity: 0.0,
          maxOpacity: 0.32,
          color: "rgba(236, 230, 218, 1)",
        })
      : null;

    return () => {
      cancelled = true;
      cancelIdle();
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      laser?.destroy();
      laserApiRef.current = null;
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

    // Scroll out (set up after first paint): the name recedes, the mascot hops off,
    // and the laser slides into the margin where the page's beam rail picks it up.
    const cancelIdle = reduced
      ? () => {}
      : afterFirstPaint(() =>
          ctx.add(() => {
            const beam = { p: 0 };
            let from = beamHome();
            let to = beamRail();
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.6,
                  onRefresh: () => {
                    from = beamHome();
                    to = beamRail();
                  },
                },
              })
              .to(
                beam,
                {
                  p: 1,
                  ease: "power2.inOut",
                  onUpdate: () =>
                    laserApiRef.current?.update({ horizontalBeamOffset: to === null ? from : from + (to - from) * beam.p }),
                },
                0,
              )
              .to(laserRef.current, { opacity: 0.35, ease: "none" }, 0)
              .to(contentRef.current, { yPercent: -14, opacity: 0, ease: "none" }, 0)
              .to(".hero-name-mask", { yPercent: -12, ease: "none", stagger: 0.04 }, 0)
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
    : { label: "See the work", href: "#projects", icon: <ArrowDown size={16} className="btn-arrow" />, target: "#projects" };

  return (
    <section id="hero" ref={sectionRef} aria-labelledby="hero-title" className="hero-content stage-dark">
      <div id="laser-container" ref={laserRef} aria-hidden="true" />
      <div ref={contentRef} className="hero-layout max-w-screen-container layout-padding">
        <div className="relative">
          <div className="hero-mascot" ref={mascotRef} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetPath("/assets/mascot-480.webp")}
              srcSet={`${getAssetPath("/assets/mascot-256.webp")} 256w, ${getAssetPath("/assets/mascot-480.webp")} 480w`}
              sizes="(max-width: 768px) 110px, 220px"
              alt=""
              width={220}
              height={220}
              fetchPriority="high"
              className="w-full h-auto object-contain select-none"
              draggable={false}
            />
          </div>
          <h1 id="hero-title" className="display" aria-label={SITE.name}>
            <span className="hero-name-mask block pb-[0.08em]" aria-hidden="true">
              <span className="hero-name-line">
                Santos
                <span ref={letterRef} className="inline-block">
                  h
                </span>
              </span>
            </span>
            <span className="hero-name-mask block pb-[0.1em] pl-[0.55em] md:pl-[1.35em]" aria-hidden="true">
              <em className="hero-name-line">Maurya</em>
            </span>
          </h1>
        </div>

        <div className="hero-scrim hero-meta pt-8 md:pt-10">
          <Rule />
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6 lg:items-end">
            <div className="lg:col-span-4 flex flex-col gap-3" data-hero-fade>
              <p className="label">Full-stack developer</p>
              <p className="label">Applied AI &amp; ML · Game dev</p>
              <p className="label">{SITE.location}</p>
            </div>
            <div className="lg:col-span-3 flex flex-col gap-6" data-hero-fade>
              <p className="label flex items-center gap-2.5 text-[var(--fg)]">
                <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-[var(--beam)] motion-safe:animate-ping opacity-60" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--beam)]" />
                </span>
                Open to freelance &amp; collaboration
              </p>
              <a
                href="#about"
                className="scroll-cue label hidden lg:inline-flex"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget("#about");
                }}
                aria-label="Scroll to About"
              >
                <span className="scroll-cue-line" aria-hidden="true" />
                <span aria-hidden="true">Scroll</span>
              </a>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-7">
              <p className="hero-bio" data-hero-fade>
                I&apos;ve spent four-plus years building for the web, for games and with machine learning — usually leading a
                small team from a rough prototype to something people can actually use.
              </p>
              <div className="flex flex-wrap gap-3" data-hero-fade>
                <a
                  href="#contact"
                  className="btn btn-solid"
                  data-magnetic="0.25"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget("#contact");
                  }}
                >
                  Get in touch <ArrowUpRight size={16} className="btn-arrow" />
                </a>
                <a
                  href={secondary.href}
                  className="btn btn-line"
                  data-magnetic="0.25"
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
        </div>
      </div>
    </section>
  );
}
