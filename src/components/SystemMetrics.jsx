"use client";
import { useEffect, useRef, useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import Rule from "./ui/Rule";
import LocalTime from "./ui/LocalTime";
import { SITE } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/scroll";

const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/** Theme colours as "r, g, b" for canvas drawing; follows the theme toggle. */
function usePalette(ref) {
  const [pal, setPal] = useState({ fg: "236, 230, 218", beam: "255, 91, 34" });
  useEffect(() => {
    const read = () => {
      const css = getComputedStyle(ref.current || document.documentElement);
      setPal({ fg: hexToRgb(css.getPropertyValue("--fg") || "#ece6da"), beam: hexToRgb(css.getPropertyValue("--beam") || "#ff5b22") });
    };
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, [ref]);
  return pal;
}

/* ── Globe: a dot sphere; a beam of light rises from Mumbai ── */
const N = 900;
const DOTS = Array.from({ length: N }, (_, i) => {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)];
});
const LAT = (19.07 * Math.PI) / 180;
const LON = (72.88 * Math.PI) / 180;
const HOME = [Math.cos(LAT) * Math.cos(LON), Math.sin(LAT), Math.cos(LAT) * Math.sin(LON)];

function Globe({ pal }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();
    let raf = 0;
    let visible = false;
    let w = 0;
    let h = 0;
    // Start with Mumbai facing the viewer, a little off-centre.
    const rot0 = -LON + Math.PI / 2 - 0.5;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = ([x, y, z], rot, tilt) => {
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const x1 = x * cr - z * sr;
      const z1 = x * sr + z * cr;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const y1 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [x1, y1, z2];
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const rot = rot0 + (reduced ? 0 : Math.sin(t * 0.00018) * 0.55);
      const tilt = -0.32;
      const r = Math.min(w, h) * 0.4;
      const cx = w / 2;
      const cy = h * 0.56;

      for (const d of DOTS) {
        const [x, y, z] = project(d, rot, tilt);
        if (z < -0.1) continue;
        const a = 0.12 + Math.max(0, z) * 0.55;
        ctx.fillStyle = `rgba(${pal.fg}, ${a})`;
        ctx.fillRect(cx + x * r - 0.8, cy - y * r - 0.8, 1.6, 1.6);
      }

      const [hx, hy, hz] = project(HOME, rot, tilt);
      if (hz > 0) {
        const px = cx + hx * r;
        const py = cy - hy * r;
        const len = r * 0.95;
        const tx = px + hx * len * 0.35;
        const ty = py - len;
        const grad = ctx.createLinearGradient(px, py, tx, ty);
        grad.addColorStop(0, `rgba(${pal.beam}, 1)`);
        grad.addColorStop(1, `rgba(${pal.beam}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const pulse = reduced ? 0.5 : (Math.sin(t * 0.004) + 1) / 2;
        ctx.strokeStyle = `rgba(${pal.beam}, ${0.7 - pulse * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, py, 4 + pulse * 16, (4 + pulse * 16) * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(${pal.beam}, 1)`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t) => {
      draw(t);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(() => {
      size();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [pal]);
  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

const STATS = [
  { value: 4, suffix: "+", label: "Years building", note: "Full-stack web, real-time games and applied machine learning." },
  { value: 48, suffix: "h", label: "Hackathon prototype", note: "Hack-Shastra — 2nd place in the IEEE Software category, among 15+ teams." },
  { value: 25, suffix: "+", label: "Technologies", note: "From C and Go to PyTorch, Unreal Engine and AWS." },
];

export default function SystemMetrics() {
  const ref = useRef(null);
  const pal = usePalette(ref);
  return (
    <section ref={ref} id="metrics" aria-labelledby="metrics-title" className="section-y relative bg-[var(--bg)]">
      <div className="max-w-screen-container layout-padding">
        <SectionHeading
          index="05"
          label="In numbers"
          aside="Small, and all true"
          id="metrics-title"
          title={
            <>
              The short <em>version.</em>
            </>
          }
        />

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-10 gap-y-16">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col">
              <Rule />
              <p className="serif mt-8 text-[5.5rem] md:text-[7rem] leading-[0.85] tracking-[-0.04em] text-[var(--fg)] tabular">
                <span data-count={s.value} data-suffix={s.suffix}>
                  {s.value}
                  {s.suffix}
                </span>
              </p>
              <h3 className="label mt-6 !text-[var(--fg)]">{s.label}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--muted)] max-w-xs" data-reveal="up">
                {s.note}
              </p>
            </div>
          ))}

          <div className="flex flex-col">
            <Rule />
            <div className="relative mt-4 aspect-square w-full max-w-[340px] -mb-6">
              <Globe pal={pal} />
            </div>
            <h3 className="label !text-[var(--fg)]">Based in</h3>
            <p className="serif mt-2 text-4xl tracking-[-0.02em] text-[var(--fg)]">
              {SITE.location.split(",")[0]}, <em>India</em>
            </p>
            <p className="mt-3 text-[0.98rem] text-[var(--muted)]">
              <LocalTime /> · remote-ready
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
