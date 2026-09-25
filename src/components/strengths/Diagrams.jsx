"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/scroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
 * One line drawing per strength, drawn by the beam when its chapter becomes
 * active. Geometry is hand-set on a 480×480 grid; every stroked element marked
 * data-draw is traced in, and a spark of light travels the path marked
 * data-flow.
 */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" };
const HOT = { ...S, style: { stroke: "var(--beam)" } };
const T = { fontSize: 11, letterSpacing: "0.12em", style: { fill: "var(--muted)", fontFamily: "var(--font-sans)" } };

function Spark({ path, dur = 3.2, delay = 0, reduced }) {
  if (reduced) return null;
  return (
    <g>
      <circle r="7" style={{ fill: "var(--beam)" }} opacity="0.18">
        <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={path} rotate="auto" />
      </circle>
      <circle r="2.6" style={{ fill: "var(--beam-core)" }}>
        <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={path} rotate="auto" />
      </circle>
    </g>
  );
}

function Architecture({ reduced }) {
  const flow = "M240 112 V156 H105 V200 M105 250 V296 H160 V340";
  return (
    <>
      <rect data-draw x="180" y="62" width="120" height="50" {...S} />
      <text x="240" y="92" textAnchor="middle" {...T}>CLIENT</text>
      {[60, 195, 330].map((x, i) => (
        <g key={x}>
          <rect data-draw x={x} y="200" width="90" height="50" {...S} />
          <text x={x + 45} y="230" textAnchor="middle" {...T}>
            {["API", "AUTH", "JOBS"][i]}
          </text>
        </g>
      ))}
      <path data-draw d="M240 112 V156 H105 V200 M240 156 V200 M240 156 H375 V200" {...S} />
      <path data-draw d="M105 250 V296 H160 V340 M240 250 V296 H160 M375 250 V296 H330 V340" {...S} />
      <rect data-draw x="110" y="340" width="100" height="50" rx="25" {...S} />
      <text x="160" y="370" textAnchor="middle" {...T}>DATA</text>
      <rect data-draw x="280" y="340" width="100" height="50" rx="25" {...S} />
      <text x="330" y="370" textAnchor="middle" {...T}>QUEUE</text>
      <path data-draw d={flow} {...HOT} opacity="0.9" />
      <Spark path={flow} reduced={reduced} />
    </>
  );
}

function Execution({ reduced }) {
  const rows = [
    { y: 92, x0: 40, x1: 170, label: "PROTOTYPE" },
    { y: 152, x0: 120, x1: 270, label: "BUILD" },
    { y: 212, x0: 210, x1: 340, label: "TEST" },
    { y: 272, x0: 290, x1: 400, label: "SHIP" },
    { y: 332, x0: 360, x1: 440, label: "ITERATE" },
  ];
  return (
    <>
      <path data-draw d="M40 400 H440" {...S} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} data-draw d={`M${40 + i * 50} 396 V404`} {...S} />
      ))}
      {rows.map((r) => (
        <g key={r.label}>
          <rect data-draw x={r.x0} y={r.y} width={r.x1 - r.x0} height="22" {...S} />
          <text x={r.x0} y={r.y - 8} {...T}>
            {r.label}
          </text>
        </g>
      ))}
      <path data-draw d="M170 103 H180 V163 M270 163 H280 V223 M340 223 H350 V283 M400 283 H410 V343" {...S} strokeDasharray="3 4" />
      <line x1="40" y1="60" x2="40" y2="410" {...HOT}>
        {reduced ? null : (
          <>
            <animate attributeName="x1" values="40;440" dur="4.5s" repeatCount="indefinite" />
            <animate attributeName="x2" values="40;440" dur="4.5s" repeatCount="indefinite" />
          </>
        )}
      </line>
    </>
  );
}

const NET = [4, 6, 6, 3].map((n, li) =>
  Array.from({ length: n }, (_, i) => ({ x: 80 + li * 107, y: 240 + (i - (n - 1) / 2) * 56 })),
);
const NET_PATH = `M${NET[0][1].x} ${NET[0][1].y} L${NET[1][2].x} ${NET[1][2].y} L${NET[2][4].x} ${NET[2][4].y} L${NET[3][1].x} ${NET[3][1].y}`;
const NET_PATH_2 = `M${NET[0][3].x} ${NET[0][3].y} L${NET[1][4].x} ${NET[1][4].y} L${NET[2][1].x} ${NET[2][1].y} L${NET[3][0].x} ${NET[3][0].y}`;

function Network({ reduced }) {
  return (
    <>
      <g opacity="0.28">
        {NET.slice(0, -1).flatMap((layer, li) =>
          layer.flatMap((a, ai) => NET[li + 1].map((b, bi) => <path key={`${li}-${ai}-${bi}`} data-draw d={`M${a.x} ${a.y} L${b.x} ${b.y}`} {...S} />)),
        )}
      </g>
      <path data-draw d={NET_PATH} {...HOT} />
      <path data-draw d={NET_PATH_2} {...HOT} opacity="0.6" />
      {NET.flat().map((n, i) => (
        <circle key={i} data-draw cx={n.x} cy={n.y} r="7" {...S} style={{ fill: "var(--bg)" }} />
      ))}
      {["INPUT", "HIDDEN", "HIDDEN", "OUTPUT"].map((l, i) => (
        <text key={i} x={80 + i * 107} y="436" textAnchor="middle" {...T}>
          {l}
        </text>
      ))}
      <Spark path={NET_PATH} dur={2.4} reduced={reduced} />
      <Spark path={NET_PATH_2} dur={2.4} delay={1.2} reduced={reduced} />
    </>
  );
}

function World({ reduced }) {
  const vp = { x: 240, y: 190 };
  const floorY = 250;
  const verticals = Array.from({ length: 13 }, (_, i) => -300 + i * 50);
  const horizontals = [258, 270, 288, 314, 352, 410];
  const cube = "M240 92 L292 120 L292 178 L240 206 L188 178 L188 120 Z M188 120 L240 148 L292 120 M240 148 V206";
  return (
    <>
      <defs>
        <clipPath id="floor-clip">
          <rect x="0" y={floorY} width="480" height="230" />
        </clipPath>
      </defs>
      <g clipPath="url(#floor-clip)" opacity="0.6">
        {verticals.map((x) => (
          <path key={x} data-draw d={`M${vp.x} ${vp.y} L${240 + x * 2.4} 480`} {...S} />
        ))}
        {horizontals.map((y) => (
          <path key={y} data-draw d={`M0 ${y} H480`} {...S} />
        ))}
      </g>
      <path data-draw d={`M0 ${floorY} H480`} {...S} />
      <g>
        {reduced ? null : <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="4s" repeatCount="indefinite" />}
        <path data-draw d={cube} {...S} />
        <path data-draw d="M240 148 L292 120" {...HOT} />
      </g>
      <ellipse cx="240" cy="236" rx="46" ry="7" style={{ fill: "var(--beam)" }} opacity="0.12" />
      <path data-draw d="M332 330 l14 -14 l14 14 l-14 14 z" {...HOT} />
      <text x="240" y="40" textAnchor="middle" {...T}>
        WORLD · 60 FPS
      </text>
    </>
  );
}

const PLANES = [
  { y: 120, label: "INTERFACE" },
  { y: 200, label: "API" },
  { y: 280, label: "DATA" },
  { y: 360, label: "INFRA" },
];

function Stack({ reduced }) {
  const core = "M240 60 V420";
  return (
    <>
      {PLANES.map((p, i) => (
        <g key={p.label}>
          <path
            data-draw
            d={`M240 ${p.y - 50} L380 ${p.y} L240 ${p.y + 50} L100 ${p.y} Z`}
            {...S}
            style={{ fill: "var(--bg)", fillOpacity: 0.6, stroke: i === 0 ? "var(--beam)" : "currentColor" }}
          />
          <text x="400" y={p.y + 4} {...T}>
            {p.label}
          </text>
        </g>
      ))}
      <path data-draw d="M100 120 V360 M380 120 V360" {...S} strokeDasharray="3 5" opacity="0.6" />
      <path data-draw d={core} {...HOT} opacity="0.5" />
      <Spark path={core} dur={2.8} reduced={reduced} />
    </>
  );
}

const FIGS = [Architecture, Execution, Network, World, Stack];

export default function Diagrams({ active }) {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const figs = [...root.querySelectorAll("[data-fig]")];
    const ctx = gsap.context(() => {
      figs.forEach((fig, i) => {
        const on = i === active;
        gsap.to(fig, { autoAlpha: on ? 1 : 0, duration: on ? 0.4 : 0.3, ease: "power1.out" });
        if (!on || prefersReducedMotion()) return;
        const strokes = [...fig.querySelectorAll("[data-draw]")];
        strokes.forEach((el) => {
          const len = typeof el.getTotalLength === "function" ? el.getTotalLength() : 600;
          el.style.strokeDasharray = el.getAttribute("stroke-dasharray") || `${len} ${len}`;
          if (!el.getAttribute("stroke-dasharray")) {
            gsap.fromTo(el, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", delay: Math.random() * 0.35 });
          } else {
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.5 });
          }
        });
        gsap.fromTo(fig.querySelectorAll("text"), { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6, stagger: 0.04 });
      });
    }, root);
    return () => ctx.revert();
  }, [active]);

  return (
    <div ref={rootRef} className="relative aspect-square w-full text-[var(--fg)]">
      {FIGS.map((Fig, i) => (
        <svg
          key={i}
          data-fig
          viewBox="0 0 480 480"
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ opacity: i === active ? 1 : 0, visibility: i === active ? "visible" : "hidden" }}
          aria-hidden="true"
        >
          <g opacity="0.85">
            <Fig reduced={reduced} />
          </g>
        </svg>
      ))}
    </div>
  );
}
