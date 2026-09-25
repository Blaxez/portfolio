"use client";
import { useState, useEffect, useRef } from "react";
import { Globe, Activity, Cpu, Zap } from "lucide-react";
import SectionHeading from "./ui/SectionHeading";
import { prefersReducedMotion } from "@/lib/scroll";

/** Current accent as "r, g, b" — canvases follow the theme. */
function useAccentRgb() {
  const [rgb, setRgb] = useState("96, 165, 250");
  useEffect(() => {
    const read = () => setRgb(getComputedStyle(document.documentElement).getPropertyValue("--acc-rgb").trim() || "96, 165, 250");
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);
  return rgb;
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

/* --- Globe: Mumbai pulses, arcs reach out --- */
const GLOBE_N = 220;
const GLOBE_DOTS = Array.from({ length: GLOBE_N }, (_, i) => {
  const n = GLOBE_N;
  const phi = Math.acos(-1 + (2 * i) / n);
  const theta = Math.sqrt(n * Math.PI) * phi;
  return { x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi) };
});

const Globe3D = ({ rgb }) => {
  const canvasRef = useRef(null);
  useCanvasLoop(
    canvasRef,
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const rot = t * 0.00025;
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.36;
      for (const d of GLOBE_DOTS) {
        const x = d.x * Math.cos(rot) - d.z * Math.sin(rot);
        const z = d.z * Math.cos(rot) + d.x * Math.sin(rot);
        if (z < -0.4) continue;
        const a = (z + 1) / 2;
        ctx.fillStyle = `rgba(${rgb}, ${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(cx + x * scale, cy + d.y * scale, 0.8 + a * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // "Home" pulse on the front face.
      const pulse = (Math.sin(t * 0.004) + 1) / 2;
      ctx.strokeStyle = `rgba(${rgb}, ${1 - pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + scale * 0.35, cy - scale * 0.15, 4 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath();
      ctx.arc(cx + scale * 0.35, cy - scale * 0.15, 3.5, 0, Math.PI * 2);
      ctx.fill();
    },
    [rgb],
  );
  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />;
};

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
    <div ref={ref} className="font-mono text-[10px] md:text-[11px] space-y-1 h-full flex flex-col justify-end text-[var(--muted)]" aria-hidden="true">
      {lines.map((l) => (
        <div key={l.id} className="flex gap-2 animate-[fade-in_0.4s_ease]">
          <span className="truncate">{l.text}</span>
          {l.status ? <span className="text-[var(--acc)] flex-shrink-0">{l.status}</span> : null}
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
  return <p className="font-mono text-[11px] text-[var(--acc)] mt-3 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>;
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
      className={`spotlight min-h-[360px] relative overflow-hidden rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[rgba(var(--acc-rgb),0.5)] transition-[border-color,transform] duration-500 hover:-translate-y-1 flex flex-col ${className}`}
    >
      <div className="relative z-10 flex justify-between items-start p-6">
        <Icon className="text-[var(--acc)]" size={20} aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] bg-[var(--bg)]/80 px-2.5 py-1 rounded-full border border-[var(--border)]">
          {tag}
        </span>
      </div>
      {children}
    </article>
  );
}

export default function SystemMetrics() {
  const rgb = useAccentRgb();
  return (
    <section id="metrics" aria-labelledby="metrics-title" className="section-y bg-[var(--bg)] border-t border-[var(--border)]">
      <div className="max-w-screen-container layout-padding">
        <SectionHeading index="05" eyebrow="By the numbers" title={["In", "Numbers"]} id="metrics-title" className="mb-12 md:mb-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <Card icon={Globe} tag="Location">
            <div className="absolute inset-0 pointer-events-none">
              <Globe3D rgb={rgb} />
            </div>
            <div className="relative z-10 mt-auto p-6">
              <h3 className="text-3xl font-black text-[var(--fg)] leading-tight tracking-tight uppercase">Mumbai</h3>
              <p className="font-mono text-xs text-[var(--muted)] mt-2">Remote-ready · IST (UTC+5:30)</p>
            </div>
          </Card>

          <Card icon={Activity} tag="Experience">
            <div className="absolute inset-x-0 top-10 bottom-24 pointer-events-none opacity-80">
              <GrowthCurve rgb={rgb} />
            </div>
            <div className="relative z-10 mt-auto p-6 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/90 to-transparent">
              <p className="text-5xl font-black text-[var(--fg)] leading-none tabular-nums">
                <span data-count="4" data-suffix="+">
                  4+
                </span>
              </p>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] mt-2">Years building</h3>
              <RotatingQuote />
            </div>
          </Card>

          <Card icon={Cpu} tag="Execution">
            <div className="h-32 px-6 overflow-hidden">
              <TerminalLog />
            </div>
            <div className="relative z-10 mt-auto p-6 border-t border-[var(--border)]">
              <p className="text-5xl font-black text-[var(--fg)] leading-none tabular-nums">
                <span data-count="48" data-suffix="h">
                  48h
                </span>
              </p>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] mt-2">Hackathon prototype</h3>
              <p className="text-sm text-[var(--muted)] mt-2">2nd place · IEEE Software category, 15+ teams</p>
            </div>
          </Card>

          <Card icon={Zap} tag="Status">
            <div className="relative z-10 mt-auto p-6 text-right">
              <p className="text-[5rem] lg:text-[6rem] leading-none font-black text-gradient tracking-tighter tabular-nums">
                <span data-count="25" data-suffix="+">
                  25+
                </span>
              </p>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] mt-2">Technologies in the stack</h3>
              <p className="mt-4 flex items-center justify-end gap-2 font-mono text-xs text-[var(--fg)]">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--acc)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--acc)]" />
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
