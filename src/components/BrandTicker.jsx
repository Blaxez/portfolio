"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SiReact, SiNextdotjs, SiPython, SiTensorflow, SiNodedotjs,
  SiUnrealengine, SiBlender, SiDocker, SiAmazonwebservices,
  SiPytorch, SiGraphql, SiThreedotjs, SiWebgl, SiTailwindcss,
} from "react-icons/si";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const BRANDS = [
  { name: "React", icon: SiReact, color: "#61DAFB" },
  { name: "Next.js", icon: SiNextdotjs, color: "#ffffff" },
  { name: "Python", icon: SiPython, color: "#3776AB" },
  { name: "TensorFlow", icon: SiTensorflow, color: "#FF6F00" },
  { name: "Node.js", icon: SiNodedotjs, color: "#339933" },
  { name: "Unreal", icon: SiUnrealengine, color: "#ffffff" },
  { name: "Blender", icon: SiBlender, color: "#E87D0D" },
  { name: "Docker", icon: SiDocker, color: "#2496ED" },
  { name: "AWS", icon: SiAmazonwebservices, color: "#FF9900" },
  { name: "PyTorch", icon: SiPytorch, color: "#EE4C2C" },
  { name: "GraphQL", icon: SiGraphql, color: "#E10098" },
  { name: "Three.js", icon: SiThreedotjs, color: "#ffffff" },
  { name: "WebGL", icon: SiWebgl, color: "#990000" },
  { name: "Tailwind", icon: SiTailwindcss, color: "#06B6D4" },
];

function Row({ items, reverse = false, outline = false, duration }) {
  // Two copies side by side; the track translates -50% for a seamless loop.
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div
        className="marquee-track gap-10 md:gap-20 items-center"
        data-reverse={reverse}
        style={{ "--marquee-duration": duration }}
        data-marquee
      >
        {doubled.map((brand, i) => (
          <div
            key={i}
            className="group flex items-center gap-3 md:gap-4 text-[var(--faint)] transition-colors duration-300 hover:text-[var(--hover-color)]"
            style={{ "--hover-color": brand.color }}
          >
            <brand.icon className="text-2xl md:text-4xl shrink-0" />
            <span
              className={`text-2xl md:text-5xl font-black uppercase tracking-tighter whitespace-nowrap ${
                outline ? "text-transparent [-webkit-text-stroke:1px_var(--faint)] group-hover:[-webkit-text-stroke-color:var(--hover-color)]" : ""
              }`}
            >
              {brand.name}
            </span>
          </div>
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
      className="relative z-10 border-y border-[var(--border)] bg-[var(--bg)] py-6 md:py-10 flex flex-col gap-4 md:gap-6 overflow-hidden"
    >
      <p className="sr-only">Technologies: {BRANDS.map((b) => b.name).join(", ")}.</p>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />
      <Row items={BRANDS} duration="55s" />
      <Row items={[...BRANDS].reverse()} reverse outline duration="65s" />
    </section>
  );
}
