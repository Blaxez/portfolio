"use client";
import { useEffect, useRef } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/scroll";
import { afterFirstPaint } from "@/lib/idle";

/**
 * Light painting: the pointer leaves a short-lived trail of laser light.
 * Two half-resolution feedback buffers (decay + a capsule brush along the
 * pointer's last segment), drawn as premultiplied light so it brightens what
 * is underneath without a page-wide blend mode. Runs only while the
 * trail still has energy; fine pointers only; off for reduced motion.
 */

const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FEED = `
precision mediump float;
uniform sampler2D uPrev;
uniform vec2 uRes;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  // A little upward drift, like warm air above the beam.
  float prev = texture2D(uPrev, uv - vec2(0.0, 1.2 / uRes.y)).r * uDecay;
  float d = seg(gl_FragCoord.xy, uA, uB);
  float brush = exp(-(d * d) / (uRadius * uRadius)) * uStrength;
  gl_FragColor = vec4(vec3(min(prev + brush, 1.0)), 1.0);
}`;

const SHOW = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec3 uColor;
void main() {
  float v = texture2D(uTex, gl_FragCoord.xy / uRes).r;
  vec3 col = uColor * v * 1.1 + vec3(1.0, 0.93, 0.86) * pow(v, 3.0) * 0.55;
  gl_FragColor = vec4(col, clamp(v * 0.5, 0.0, 1.0));
}`;

export default function LightTrail() {
  const ref = useRef(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    let teardown = () => {};
    const cancelIdle = afterFirstPaint(() => {
      teardown = start(ref.current) || (() => {});
    });
    return () => {
      cancelIdle();
      teardown();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="light-trail" />;
}

function start(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  const SCALE = 0.5;

  const program = (fs) => {
    const p = gl.createProgram();
    [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, fs],
    ].forEach(([type, src]) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    });
    gl.linkProgram(p);
    return p;
  };
  const feed = program(FEED);
  const show = program(SHOW);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  [feed, show].forEach((p) => {
    const loc = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  });
  const U = (p, n) => gl.getUniformLocation(p, n);
  const uf = { prev: U(feed, "uPrev"), res: U(feed, "uRes"), a: U(feed, "uA"), b: U(feed, "uB"), r: U(feed, "uRadius"), s: U(feed, "uStrength"), d: U(feed, "uDecay") };
  const us = { tex: U(show, "uTex"), res: U(show, "uRes"), color: U(show, "uColor") };

  let targets = [];
  let w = 0;
  let h = 0;
  const makeTarget = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb };
  };
  const resize = () => {
    w = Math.max(1, Math.round(window.innerWidth * SCALE));
    h = Math.max(1, Math.round(window.innerHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    targets.forEach((t) => {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    });
    targets = [makeTarget(), makeTarget()];
  };
  resize();

  const readColor = () => {
    const hex = getComputedStyle(document.documentElement).getPropertyValue("--beam").trim() || "#ff5b22";
    const n = parseInt(hex.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  let color = readColor();

  const ptr = { x: -1, y: -1, px: -1, py: -1, speed: 0 };
  let energy = 0;
  let raf = 0;
  let last = performance.now();

  const frame = (now) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const moved = Math.hypot(ptr.x - ptr.px, ptr.y - ptr.py);
    const strength = ptr.px < 0 ? 0 : Math.min(0.55, 0.12 + moved * 0.012);

    const [src, dst] = targets;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(feed);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(uf.prev, 0);
    gl.uniform2f(uf.res, w, h);
    gl.uniform2f(uf.a, (ptr.px < 0 ? ptr.x : ptr.px) * SCALE, h - (ptr.py < 0 ? ptr.y : ptr.py) * SCALE);
    gl.uniform2f(uf.b, ptr.x * SCALE, h - ptr.y * SCALE);
    gl.uniform1f(uf.r, 9);
    gl.uniform1f(uf.s, moved > 0.5 ? strength : 0);
    gl.uniform1f(uf.d, Math.pow(0.9, dt * 60));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(show);
    gl.bindTexture(gl.TEXTURE_2D, dst.tex);
    gl.uniform1i(us.tex, 0);
    gl.uniform2f(us.res, w, h);
    gl.uniform3fv(us.color, color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    targets = [dst, src];

    ptr.px = ptr.x;
    ptr.py = ptr.y;
    energy -= dt;
    if (energy > 0 && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    if (ptr.px < 0) {
      ptr.px = ptr.x;
      ptr.py = ptr.y;
    }
    energy = 1.2; // keep rendering until the trail has faded
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const onLeave = () => {
    ptr.px = ptr.py = -1;
  };
  const onTheme = () => (color = readColor());
  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 150);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  window.addEventListener("themechange", onTheme);
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(rt);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("themechange", onTheme);
    window.removeEventListener("resize", onResize);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
