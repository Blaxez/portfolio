"use client";
import { useState, useEffect, useRef } from "react";
import { Globe, Activity, Cpu, Zap } from "lucide-react";
import SectionHeading from "./ui/SectionHeading";
import LocalTime from "./ui/LocalTime";
import { prefersReducedMotion } from "@/lib/scroll";

const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/** Signal + text colours as "r, g, b" for canvases; follows the theme toggle. */
function usePalette() {
  const [pal, setPal] = useState({ fg: "236, 230, 218", beam: "255, 91, 34" });
  useEffect(() => {
    const read = () => {
      const css = getComputedStyle(document.documentElement);
      setPal({ fg: hexToRgb(css.getPropertyValue("--fg") || "#ece6da"), beam: hexToRgb(css.getPropertyValue("--beam") || "#ff5b22") });
    };
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);
  return pal;
}

/** rAF loop that only runs while the canvas is on screen (and never for reduced motion). */
function useCanvasLoop(canvasRef, draw, deps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let visible = false;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const loop = (t) => {
      draw(ctx, canvas.clientWidth, canvas.clientHeight, t);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(() => {
      size();
      draw(ctx, canvas.clientWidth, canvas.clientHeight, performance.now());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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

function GlobeCanvas({ pal }) {
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

/* --- Growth curve: draws itself in, tip pulses (illustrative, not data) --- */
const GrowthCurve = ({ rgb }) => {
  const canvasRef = useRef(null);
  const startRef = useRef(null);
  useCanvasLoop(
    canvasRef,
    (ctx, w, h, t) => {
      // Start the draw-in the first time the canvas is actually on screen.
      if (startRef.current === null) {
        const r = ctx.canvas.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) startRef.current = t;
      }
      const progress = prefersReducedMotion() ? 1 : startRef.current === null ? 0 : Math.min(1, (t - startRef.current) / 1800);
      const eased = 1 - Math.pow(1 - progress, 3);
      ctx.clearRect(0, 0, w, h);
      const px = w * 0.08;
      const py = h * 0.22;
      const pts = 40;
      const f = (i) => {
        const x = i / (pts - 1);
        return { x: px + x * (w - px * 2), y: h - py - (Math.pow(x, 1.6) * 0.8 + Math.sin(x * 9) * 0.03) * (h - py * 2) };
      };
      const last = Math.max(1, Math.floor((pts - 1) * eased));
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(${rgb}, 0.28)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.beginPath();
      ctx.moveTo(f(0).x, h);
      for (let i = 0; i <= last; i++) ctx.lineTo(f(i).x, f(i).y);
      ctx.lineTo(f(last).x, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= last; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, f(i).x, f(i).y);
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgb(${rgb})`;
      ctx.stroke();
      const tip = f(last);
      const pulse = (Math.sin(t * 0.006) + 1) / 2;
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb}, ${0.8 - pulse * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
    },
    [rgb],
  );
  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />;
};

/* --- Terminal: this site's own build log, typed out while visible --- */
const LOG = [
  { text: "$ git push origin main", status: "" },
  { text: "> next build", status: "OK" },
  { text: "> compiling shaders", status: "OK" },
  { text: "> optimizing images", status: "OK" },
  { text: "> deploying to pages", status: "..." },
  { text: "> live", status: "200" },
];
const TerminalLog = () => {
  const ref = useRef(null);
  const [lines, setLines] = useState(() => LOG.slice(0, 3).map((l, i) => ({ ...l, id: i })));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let i = 3;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (!e.isIntersecting) return;
      timer = setInterval(() => {
        setLines((prev) => [...prev, { ...LOG[i % LOG.length], id: i }].slice(-6));
        i++;
      }, 900);
    });
    io.observe(ref.current);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="font-mono text-[0.68rem] md:text-[0.72rem] space-y-1 h-full flex flex-col justify-end text-[var(--muted)]" aria-hidden="true">
      {lines.map((l) => (
        <div key={l.id} className="flex gap-2 animate-[fade-in_0.4s_ease]">
          <span className="truncate">{l.text}</span>
          {l.status ? <span className="text-[var(--signal)] flex-shrink-0">{l.status}</span> : null}
        </div>
      ))}
    </div>
  );
};

const QUOTES = [
  "What falls, comes up even better.",
  "Ship it, then iterate.",
  "Build things that matter.",
  "First, solve the problem. Then, write the code.",
  "Make it work, make it right, make it fast.",
  "Learn, build, break, repeat.",
  "The future belongs to the curious.",
];

function RotatingQuote() {
  const [quote, setQuote] = useState(QUOTES[0]);
  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- date-based pick is client-only
    setQuote(QUOTES[(now.getHours() + now.getDate()) % QUOTES.length]);
  }, []);
  return <p className="serif italic text-[0.95rem] text-[var(--signal)] mt-3 leading-snug">&ldquo;{quote}&rdquo;</p>;
}

const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

function Card({ icon: Icon, tag, children, className = "" }) {
  return (
    <article
      onPointerMove={spot}
      data-reveal="up"
      className={`spotlight min-h-[360px] relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[rgba(var(--signal-rgb),0.45)] transition-[border-color,transform] duration-500 hover:-translate-y-1 flex flex-col ${className}`}
    >
      <div className="relative z-10 flex justify-between items-start p-6">
        <Icon className="text-[var(--signal)]" size={20} aria-hidden="true" />
        <span className="label !text-[0.64rem] bg-[var(--bg)]/80 px-2.5 py-1 rounded-full border border-[var(--line)]">{tag}</span>
      </div>
      {children}
    </article>
  );
}

export default function SystemMetrics() {
  const pal = usePalette();
  return (
    <section id="metrics" aria-labelledby="metrics-title" className="section-y relative bg-[var(--bg)]">
      <div className="max-w-screen-container layout-padding">
        <SectionHeading
          index="05"
          label="By the numbers"
          aside="Small, and all true"
          id="metrics-title"
          className="mb-12 md:mb-16"
          title={
            <>
              In <em>numbers.</em>
            </>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
          <Card icon={Globe} tag="Location">
            <div className="absolute inset-x-0 top-6 bottom-20 pointer-events-none">
              <GlobeCanvas pal={pal} />
            </div>
            <div className="relative z-10 mt-auto p-6">
              <h3 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-[0.04em] text-[var(--fg)] leading-none">Mumbai</h3>
              <p className="text-sm text-[var(--muted)] mt-2">
                <LocalTime /> · remote-ready
              </p>
            </div>
          </Card>

          <Card icon={Activity} tag="Experience">
            <div className="absolute inset-x-0 top-12 bottom-32 pointer-events-none opacity-90">
              <GrowthCurve rgb={pal.beam} />
            </div>
            <div className="relative z-10 mt-auto p-6 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/90 to-transparent">
              <p className="font-[family-name:var(--font-display)] text-6xl text-[var(--fg)] leading-none tabular">
                <span data-count="4" data-suffix="+">
                  4+
                </span>
              </p>
              <h3 className="label mt-3">Years building</h3>
              <RotatingQuote />
            </div>
          </Card>

          <Card icon={Cpu} tag="Execution">
            <div className="h-32 px-6 overflow-hidden">
              <TerminalLog />
            </div>
            <div className="relative z-10 mt-auto p-6 border-t border-[var(--line)]">
              <p className="font-[family-name:var(--font-display)] text-6xl text-[var(--fg)] leading-none tabular">
                <span data-count="48" data-suffix="h">
                  48h
                </span>
              </p>
              <h3 className="label mt-3">Hackathon prototype</h3>
              <p className="text-sm text-[var(--muted)] mt-2">2nd place · IEEE Software category, 15+ teams</p>
            </div>
          </Card>

          <Card icon={Zap} tag="Status">
            <div className="relative z-10 mt-auto p-6 text-right">
              <p className="font-[family-name:var(--font-display)] text-[5.5rem] lg:text-[6.5rem] leading-none text-gradient tabular">
                <span data-count="25" data-suffix="+">
                  25+
                </span>
              </p>
              <h3 className="label mt-3">Technologies in the stack</h3>
              <p className="mt-4 flex items-center justify-end gap-2 text-sm text-[var(--fg)]">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--beam)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--beam)]" />
                </span>
                Available for freelance &amp; collaboration
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
