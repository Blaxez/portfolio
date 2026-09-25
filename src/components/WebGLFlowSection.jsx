"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "./ui/SectionHeading";
import { prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { id: "01", title: "Architecture", desc: "Designing scalable systems with clean, maintainable code that handles real-world complexity.", color: [0.4, 0.6, 1.0], speed: 0.3, density: 1.2 },
  { id: "02", title: "Execution", desc: "Rapid prototyping to production — no delays, no compromises on quality.", color: [0.0, 0.8, 1.0], speed: 0.8, density: 0.9 },
  { id: "03", title: "AI / ML", desc: "Building intelligent systems with TensorFlow, PyTorch, and modern LLM integrations.", color: [0.3, 1.0, 0.5], speed: 0.4, density: 1.1 },
  { id: "04", title: "Game Dev", desc: "Crafting immersive experiences in Unreal Engine and custom WebGL renderers.", color: [0.6, 0.3, 1.0], speed: 0.5, density: 1.0 },
  { id: "05", title: "Full-Stack", desc: "End-to-end delivery — React, Next.js, Node, databases, deployment and beyond.", color: [0.2, 0.8, 0.8], speed: 0.6, density: 1.0 },
];

const VERT = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color;
  uniform float u_speed;
  uniform float u_density;
  uniform vec2 u_mouse;
  uniform float u_pulse;

  float random(in vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123); }
  float noise(in vec2 st) {
    vec2 i = floor(st); vec2 f = fract(st);
    float a = random(i); float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(in vec2 st) {
    float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; ++i) { v += a * noise(st); st = rot * st * 2.0 + shift; a *= 0.5; }
    return v;
  }
  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= aspect;
    vec2 m = u_mouse; m.x *= aspect;
    float md = distance(st, m);
    // Smoke is pushed away from the cursor.
    st += (st - m) * 0.22 * exp(-md * 5.0);
    float t = u_time * u_speed;
    vec2 q = vec2(fbm(st), fbm(st + vec2(1.0)));
    vec2 r = vec2(fbm(st + q + vec2(1.7, 9.2) + 0.15 * t), fbm(st + q + vec2(8.3, 2.8) + 0.126 * t));
    float f = fbm(st + r);
    float smoke = f * f * u_density + 0.6 * f + u_pulse * 0.35 * exp(-md * 1.5);
    float alpha = smoothstep(0.2, 0.9, smoke);
    gl_FragColor = vec4(u_color * smoke, alpha * 0.45);
  }
`;

function useSmokeShader(canvasRef, activeRef, pulseRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;
    const reduced = prefersReducedMotion();
    const scale = window.innerWidth < 768 ? 0.4 : 0.5;

    const compile = (src, type) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vert = compile(VERT, gl.VERTEX_SHADER);
    const frag = compile(FRAG, gl.FRAGMENT_SHADER);
    if (!vert || !frag) return;
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u = Object.fromEntries(
      ["u_time", "u_resolution", "u_color", "u_speed", "u_density", "u_mouse", "u_pulse"].map((n) => [n, gl.getUniformLocation(program, n)]),
    );

    const resize = () => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const cur = { color: [...ITEMS[0].color], speed: ITEMS[0].speed, density: ITEMS[0].density };
    let raf = 0;
    let running = false;
    let time = 0;
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const item = ITEMS[activeRef.current] || ITEMS[0];
      const k = Math.min(1, dt * 3);
      for (let i = 0; i < 3; i++) cur.color[i] += (item.color[i] - cur.color[i]) * k;
      cur.speed += (item.speed - cur.speed) * k;
      cur.density += (item.density - cur.density) * k;
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      pulseRef.current *= Math.exp(-dt * 2.5);
      gl.uniform1f(u.u_time, time);
      gl.uniform3f(u.u_color, cur.color[0], cur.color[1], cur.color[2]);
      gl.uniform1f(u.u_speed, cur.speed);
      gl.uniform1f(u.u_density, cur.density);
      gl.uniform2f(u.u_mouse, mouse.x, mouse.y);
      gl.uniform1f(u.u_pulse, pulseRef.current);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden) return;
      if (reduced) {
        frame(performance.now());
        return;
      }
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [canvasRef, activeRef, pulseRef]);
}

export default function WebGLFlowSection() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const triggerRef = useRef(null);
  const activeRef = useRef(0);
  const pulseRef = useRef(0);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(true);

  useSmokeShader(canvasRef, activeRef, pulseRef);

  // Scroll steps through the strengths while the stage is pinned (CSS sticky).
  useEffect(() => {
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- media query is client-only
      setPinned(false);
      return;
    }
    const cancelIdle = afterFirstPaint(() => {
      triggerRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          const idx = Math.min(ITEMS.length - 1, Math.floor(progress * ITEMS.length));
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            pulseRef.current = 1;
            setActive(idx);
          }
          if (barRef.current) barRef.current.style.transform = `scaleY(${progress})`;
        },
      });
    });
    return () => {
      cancelIdle();
      triggerRef.current?.kill();
    };
  }, []);

  const choose = (i) => {
    const st = triggerRef.current;
    if (!pinned || !st) {
      activeRef.current = i;
      pulseRef.current = 1;
      setActive(i);
      return;
    }
    const y = st.start + (st.end - st.start) * ((i + 0.5) / ITEMS.length);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section
      id="strengths"
      ref={sectionRef}
      aria-labelledby="strengths-title"
      className="stage-dark relative border-y border-[var(--border)]"
      style={{ height: pinned ? `${ITEMS.length * 70 + 100}svh` : undefined }}
    >
      <div className={`${pinned ? "sticky top-0 h-[100svh]" : "relative py-24"} overflow-hidden flex items-center`}>
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={active}
            aria-hidden="true"
            initial={{ y: "30%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-30%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[-2vw] bottom-[-6vw] font-black leading-none tracking-tighter text-[38vw] md:text-[26vw] text-white/[0.04] pointer-events-none select-none"
          >
            {ITEMS[active].id}
          </motion.span>
        </AnimatePresence>

        <div className="relative z-10 max-w-screen-container layout-padding w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <div className="flex flex-col justify-center">
            <SectionHeading index="03" eyebrow="What I bring" title={["Core", "Strengths"]} id="strengths-title">
              I combine deep technical knowledge with creative problem-solving to deliver real-world solutions that scale.
            </SectionHeading>
            {pinned ? (
              <p className="mt-8 font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-[var(--muted)]" aria-hidden="true">
                {ITEMS[active].id} / {String(ITEMS.length).padStart(2, "0")} — keep scrolling
              </p>
            ) : null}
          </div>

          <div className="relative flex">
            <div aria-hidden="true" className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-[var(--border)]">
              <div ref={barRef} className="absolute inset-0 origin-top bg-[var(--acc)]" style={{ transform: "scaleY(0)" }} />
            </div>
            <ol className="flex flex-col gap-1 md:gap-2 w-full md:pl-8">
              {ITEMS.map((item, i) => {
                const isActive = active === i;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => choose(i)}
                      aria-current={isActive ? "step" : undefined}
                      aria-expanded={isActive}
                      className={`group w-full text-left rounded-2xl px-4 md:px-6 py-3 md:py-5 transition-[background-color,transform] duration-500 ${
                        isActive ? "bg-white/[0.07] translate-x-2" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="flex items-baseline gap-4 md:gap-6">
                        <span className={`font-mono text-xs md:text-sm transition-colors ${isActive ? "text-[var(--acc)]" : "text-[var(--muted)]"}`}>
                          {item.id}
                        </span>
                        <span
                          className={`text-2xl md:text-4xl font-black uppercase tracking-tighter transition-colors duration-500 ${
                            isActive ? "text-[var(--fg)]" : "text-[var(--faint)] group-hover:text-[var(--muted)]"
                          }`}
                        >
                          {item.title}
                        </span>
                      </span>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="block overflow-hidden"
                          >
                            <span className="block pt-3 pl-9 md:pl-12 text-sm md:text-base text-[var(--muted)] max-w-md leading-relaxed">
                              {item.desc}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
