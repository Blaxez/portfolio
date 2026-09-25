"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const STACK = ["React", "Next.js", "Python", "TensorFlow", "Node.js", "Unreal", "Blender", "Docker", "AWS", "PyTorch", "GraphQL", "Three.js", "WebGL", "Tailwind"];

function Row({ items, duration }) {
  // Two copies side by side; the track translates -50% for a seamless loop.
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div className="marquee-track items-baseline" style={{ "--marquee-duration": duration }} data-marquee>
        {doubled.map((name, i) => (
          <span key={i} className="flex items-baseline">
            <span
              className={`px-6 md:px-10 whitespace-nowrap leading-none tracking-[-0.02em] transition-colors duration-500 hover:text-[var(--fg)] ${
                i % 2 ? "serif italic text-[var(--faint)]" : "serif text-[var(--muted)]"
              } text-[2.6rem] md:text-[5.2rem]`}
            >
              {name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--beam)] opacity-80" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Scroll velocity drives marquee speed, direction and skew. Returns a cleanup. */
function bindVelocity(root) {
  const tracks = [...root.querySelectorAll("[data-marquee]")];
  const anims = tracks.map((t) => t.getAnimations()[0]).filter(Boolean);
  // Skew the row wrappers: the tracks' own transform belongs to the CSS animation.
  const skewTo = gsap.quickTo(tracks.map((t) => t.parentElement), "skewX", { duration: 0.5, ease: "power3" });
  const state = { rate: 1 };
  let settle;

  const apply = () => anims.forEach((a) => (a.playbackRate = state.rate));
  const st = ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity();
      const boost = Math.min(Math.abs(v) / 350, 6);
      state.rate = (1 + boost) * (self.direction < 0 ? -1 : 1);
      apply();
      skewTo(gsap.utils.clamp(-12, 12, v / -220));
      settle?.kill();
      settle = gsap.to(state, {
        rate: self.direction < 0 ? -1 : 1,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: apply,
        onComplete: () => skewTo(0),
      });
    },
  });
  return () => {
    st.kill();
    settle?.kill();
  };
}

export default function BrandTicker() {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cleanup;
    const cancelIdle = afterFirstPaint(() => {
      if (ref.current) cleanup = bindVelocity(ref.current);
    });
    return () => {
      cancelIdle();
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-label="Technologies I work with"
      className="relative z-10 border-y border-[var(--line)] bg-[var(--bg)] py-8 md:py-14 overflow-hidden edge-fade"
    >
      <p className="sr-only">Technologies: {STACK.join(", ")}.</p>
      <Row items={STACK} duration="70s" />
    </section>
  );
}
