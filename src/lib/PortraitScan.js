/**
 * Portrait "scanned" by the laser. Above the scan line the photo is developed
 * (warm duotone); below it the raw signal shows as a 1-bit ordered dither. The
 * line itself glows and shears the image slightly. A lens under the pointer
 * shows the raw dither. Raw WebGL1, one draw call; renders only when something
 * changes (scan moving, lens active) and only while on screen.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uScan;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLens;
uniform float uCell;
uniform vec3 uInk;
uniform vec3 uBone;
uniform vec3 uBeam;

float hash(float n) { return fract(sin(n) * 43758.5453); }

float bayer4(vec2 p) {
  p = mod(p, 4.0);
  float x = p.x, y = p.y;
  float v =
    (y < 1.0) ? ((x < 1.0) ? 0.0 : (x < 2.0) ? 8.0 : (x < 3.0) ? 2.0 : 10.0) :
    (y < 2.0) ? ((x < 1.0) ? 12.0 : (x < 2.0) ? 4.0 : (x < 3.0) ? 14.0 : 6.0) :
    (y < 3.0) ? ((x < 1.0) ? 3.0 : (x < 2.0) ? 11.0 : (x < 3.0) ? 1.0 : 9.0) :
                ((x < 1.0) ? 15.0 : (x < 2.0) ? 7.0 : (x < 3.0) ? 13.0 : 5.0);
  return (v + 0.5) / 16.0;
}

void main() {
  // object-fit: cover
  float boxAspect = uRes.x / uRes.y;
  vec2 uv = vUv;
  if (boxAspect > uImgAspect) {
    float s = uImgAspect / boxAspect;
    uv.y = (uv.y - 0.5) * s + 0.5;
  } else {
    float s = boxAspect / uImgAspect;
    uv.x = (uv.x - 0.5) * s + 0.5;
  }

  float scanY = 1.0 - uScan;          // the line travels top -> bottom
  float d = vUv.y - scanY;            // > 0: already scanned
  float band = exp(-abs(d) * 34.0);
  float row = floor(vUv.y * uRes.y / 3.0);
  uv.x += (hash(row + floor(uTime * 24.0)) - 0.5) * 0.035 * band;

  vec2 tuv = vec2(uv.x, 1.0 - uv.y);
  float L = texture2D(uTex, tuv).r;
  L = smoothstep(0.03, 0.97, L);
  float vig = 1.0 - smoothstep(0.3, 0.95, length((vUv - vec2(0.5, 0.56)) * vec2(1.05, 0.95)) * 1.25);
  L *= mix(0.35, 1.0, vig);

  vec2 cell = floor(gl_FragCoord.xy / uCell);
  float dith = step(bayer4(cell), L * 0.96);
  vec3 raw = mix(uInk, uBone * 0.9, dith);

  float g = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 0.05 - 0.025;
  vec3 dev = mix(uInk, uBone, pow(L, 1.15)) + g;
  // Freshly scanned rows are still warm from the beam.
  dev = mix(dev, dev * (0.6 + uBeam * 0.9), exp(-max(d, 0.0) * 9.0) * step(0.0, d) * 0.55 * step(uScan, 0.999));

  vec2 px = vUv * uRes;
  float lens = uLens * (1.0 - smoothstep(uRes.x * 0.12, uRes.x * 0.2, distance(px, uMouse * uRes)));
  float developed = smoothstep(-0.0015, 0.0015, d) * (1.0 - lens);
  vec3 col = mix(raw, dev, developed);

  float active = step(0.0005, uScan) * step(uScan, 0.9995);
  float core = exp(-abs(d) * uRes.y * 0.75);
  float glow = exp(-abs(d) * 16.0) * 0.28;
  col += uBeam * (core * 1.4 + glow) * active;

  gl_FragColor = vec4(col, 1.0);
}`;

const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function mountPortraitScan(container, { src, ink = "#0b0a09", bone = "#ece6da", beam = "#ff5b22", onReady } = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s ease;";
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  container.appendChild(canvas);

  const compile = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.remove();
    return null;
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  ["uTex", "uRes", "uImgAspect", "uScan", "uTime", "uMouse", "uLens", "uCell", "uInk", "uBone", "uBeam"].forEach((n) => {
    u[n] = gl.getUniformLocation(program, n);
  });
  gl.uniform1i(u.uTex, 0);
  gl.uniform3fv(u.uInk, hexToRgb(ink));
  gl.uniform3fv(u.uBone, hexToRgb(bone));
  gl.uniform3fv(u.uBeam, hexToRgb(beam));

  const state = { scan: reduced ? 1 : 0, targetScan: reduced ? 1 : 0, lens: 0, targetLens: 0, mx: 0.5, my: 0.5, time: 0 };
  let ready = false;
  let inView = false;
  let raf = 0;
  let last = performance.now();

  const tex = gl.createTexture();
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1f(u.uImgAspect, img.naturalWidth / img.naturalHeight);
    ready = true;
    resize();
    draw();
    canvas.style.opacity = "1";
    onReady?.();
    kick();
  };
  img.src = src;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(container.clientWidth * dpr));
    const h = Math.max(1, Math.round(container.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uCell, Math.max(2, Math.round(2 * dpr)));
    if (ready) draw();
  };

  const draw = () => {
    gl.uniform1f(u.uScan, state.scan);
    gl.uniform1f(u.uTime, state.time);
    gl.uniform2f(u.uMouse, state.mx, state.my);
    gl.uniform1f(u.uLens, state.lens);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const busy = () =>
    Math.abs(state.targetScan - state.scan) > 0.0005 ||
    Math.abs(state.targetLens - state.lens) > 0.002 ||
    state.lens > 0.002 ||
    (state.scan > 0.0005 && state.scan < 0.9995);

  const frame = (now) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.time += dt;
    const k = 1 - Math.exp(-dt * 7);
    state.scan += (state.targetScan - state.scan) * k;
    state.lens += (state.targetLens - state.lens) * (1 - Math.exp(-dt * 10));
    draw();
    if (inView && busy()) raf = requestAnimationFrame(frame);
  };

  function kick() {
    if (!ready || !inView || raf || reduced) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) kick();
  });
  io.observe(container);

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const r = container.getBoundingClientRect();
    state.mx = (e.clientX - r.left) / r.width;
    state.my = 1 - (e.clientY - r.top) / r.height;
    state.targetLens = 1;
    kick();
  };
  const onLeave = () => {
    state.targetLens = 0;
    kick();
  };
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);

  return {
    /** 0 → nothing scanned, 1 → fully developed. */
    setScan(p) {
      if (reduced) return;
      state.targetScan = Math.min(1, Math.max(0, p));
      kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}
