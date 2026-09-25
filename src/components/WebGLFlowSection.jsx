"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const ITEM_CONFIG = [
  { colors: { dark: [0.4, 0.6, 1.0], light: [0.2, 0.4, 0.9] }, speed: 0.3, density: 1.2 },
  { colors: { dark: [0.0, 0.8, 1.0], light: [0.0, 0.4, 0.8] }, speed: 0.8, density: 0.9 },
  { colors: { dark: [0.3, 1.0, 0.5], light: [0.1, 0.7, 0.3] }, speed: 0.4, density: 1.1 },
  { colors: { dark: [0.6, 0.3, 1.0], light: [0.4, 0.1, 0.8] }, speed: 0.5, density: 1.0 },
  { colors: { dark: [0.2, 0.8, 0.8], light: [0.0, 0.5, 0.6] }, speed: 0.6, density: 1.0 },
];
export default function WebGLFlowSection() {
  const canvasRef = useRef(null);
  const [activeItem, setActiveItem] = useState(0);
  const activeItemRef = useRef(0);

  const items = [
    { id: "01", title: "Architecture", desc: "Designing scalable systems with clean, maintainable code that handles real-world complexity." },
    { id: "02", title: "Execution", desc: "Rapid prototyping to production — no delays, no compromises on quality." },
    { id: "03", title: "AI / ML", desc: "Building intelligent systems with TensorFlow, PyTorch, and modern LLM integrations." },
    { id: "04", title: "Game Dev", desc: "Crafting immersive experiences in Unreal Engine and custom WebGL renderers." },
    { id: "05", title: "Full-Stack", desc: "End-to-end delivery — React, Next.js, Node, databases, deployment and beyond." },
  ];


  useEffect(() => { activeItemRef.current = activeItem; }, [activeItem]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertSrc = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    const fragSrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec3 u_color;
      uniform float u_speed;
      uniform float u_density;

      float random(in vec2 _st) {
        return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))* 43758.5453123);
      }
      float noise(in vec2 _st) {
        vec2 i = floor(_st); vec2 f = fract(_st);
        float a = random(i); float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      #define NUM_OCTAVES 5
      float fbm(in vec2 _st) {
        float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < NUM_OCTAVES; ++i) { v += a * noise(_st); _st = rot * _st * 2.0 + shift; a *= 0.5; }
        return v;
      }
      void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy; st.x *= u_resolution.x/u_resolution.y;
        float t = u_time * u_speed;
        vec2 q = vec2(fbm(st + 0.00 * t), fbm(st + vec2(1.0)));
        vec2 r = vec2(fbm(st + 1.0*q + vec2(1.7,9.2)+ 0.15*t), fbm(st + 1.0*q + vec2(8.3,2.8)+ 0.126*t));
        float f = fbm(st+r);
        float smokeDensity = f * f * u_density + 0.6 * f;
        float alpha = smoothstep(0.2, 0.9, smokeDensity);
        gl_FragColor = vec4(u_color * smokeDensity, alpha * 0.4);
      }
    `;

    const compile = (src, type) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    };
    const vert = compile(vertSrc, gl.VERTEX_SHADER);
    const frag = compile(fragSrc, gl.FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert); gl.attachShader(program, frag);
    gl.linkProgram(program); gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uColor = gl.getUniformLocation(program, "u_color");
    const uSpeed = gl.getUniformLocation(program, "u_speed");
    const uDensity = gl.getUniformLocation(program, "u_density");

    let w, h;
    const resize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h);
    };
    window.addEventListener("resize", resize); resize();

    const startTime = Date.now();
    let animId;
    let curColor = [0.4, 0.6, 1.0], curSpeed = 0.3, curDensity = 1.0;

    const render = () => {
      gl.uniform1f(uTime, (Date.now() - startTime) / 1000);
      const isDark = document.documentElement.classList.contains("dark");
      const idx = activeItemRef.current !== null ? activeItemRef.current : 0;
      const config = ITEM_CONFIG[idx] || ITEM_CONFIG[0];
      const hovered = activeItemRef.current !== null;
      let targetColor = !hovered ? (isDark ? [0.4, 0.6, 1.0] : [0.2, 0.2, 0.2]) : (isDark ? config.colors.dark : config.colors.light);
      const targetSpeed = hovered ? config.speed : 0.2;
      const targetDensity = hovered ? config.density : 0.8;
      curColor[0] += (targetColor[0] - curColor[0]) * 0.05;
      curColor[1] += (targetColor[1] - curColor[1]) * 0.05;
      curColor[2] += (targetColor[2] - curColor[2]) * 0.05;
      curSpeed += (targetSpeed - curSpeed) * 0.05;
      curDensity += (targetDensity - curDensity) * 0.05;
      gl.uniform3f(uColor, curColor[0], curColor[1], curColor[2]);
      gl.uniform1f(uSpeed, curSpeed); gl.uniform1f(uDensity, curDensity);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };
    render();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);

  return (
    <section id="strengths" className="relative min-h-[100svh] bg-[var(--surface)] overflow-hidden flex items-center justify-center border-y border-[var(--border)] transition-colors duration-700">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 max-w-screen-container layout-padding grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 py-10 md:py-16">
        <div className="flex flex-col justify-center pointer-events-none text-[var(--fg)] pl-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[var(--acc)] font-mono text-[10px] md:text-xs uppercase tracking-widest mb-6">What I Bring</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[0.9] tracking-tighter">
              CORE<br />STRENGTHS
            </h2>
            <p className="opacity-80 max-w-md text-base md:text-lg leading-relaxed font-light">
              I combine deep technical knowledge with creative problem-solving to deliver real-world solutions that scale.
            </p>
          </motion.div>
        </div>
        <div className="flex flex-col justify-center gap-4 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onMouseEnter={() => setActiveItem(i)}
              onMouseLeave={() => setActiveItem(null)}
              onClick={() => setActiveItem(activeItem === i ? null : i)}
              className={`group relative p-5 md:p-8 border-l-2 transition-all duration-500 cursor-pointer ${
                activeItem === i
                  ? "border-[var(--acc)] bg-black/40 backdrop-blur-md pl-8 md:pl-12 shadow-lg"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-baseline gap-4 md:gap-6 mb-2">
                <span className={`font-mono text-xs md:text-sm transition-colors ${activeItem === i ? "text-[var(--acc)]" : "text-neutral-500"}`}>
                  {item.id}
                </span>
                <h3 className={`text-xl md:text-3xl font-black uppercase tracking-tighter transition-colors ${activeItem === i ? "text-[var(--fg)]" : "text-neutral-500"}`}>
                  {item.title}
                </h3>
              </div>
              <motion.div 
                initial={false}
                animate={{ height: activeItem === i ? "auto" : 0, opacity: activeItem === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-sm md:text-base mt-2 text-[var(--fg)] opacity-80 max-w-sm">
                  {item.desc}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
