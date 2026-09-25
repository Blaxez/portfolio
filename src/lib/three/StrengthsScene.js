import * as THREE from "three";

/**
 * Strengths in 3D: one particle cloud that re-forms into a structure per
 * chapter — a service architecture, a delivery staircase, a neural network, a
 * game world and an exploded full stack. Particles are sampled along each
 * structure's edges (so it reads as a drawing in space), morph with a burst of
 * turbulence between chapters, tilt toward the pointer and can be dragged to
 * spin. Renders only while visible; one still frame per change for reduced motion.
 */

const box = (cx, cy, cz, w, h, d) => {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([a, b]) => [v[a], v[b]]);
};
const ring = (cx, cy, cz, r, n = 28) =>
  Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    return [[cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r]];
  });
const cylinder = (cx, cy, cz, r, h) => [
  ...ring(cx, cy + h / 2, cz, r),
  ...ring(cx, cy - h / 2, cz, r),
  ...[0, 1, 2, 3].map((k) => {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    return [[cx + Math.cos(a) * r, cy + h / 2, cz + Math.sin(a) * r], [cx + Math.cos(a) * r, cy - h / 2, cz + Math.sin(a) * r]];
  }),
];
const path = (...pts) => pts.slice(1).map((p, i) => [pts[i], p]);

/** Each shape: segments (cool) + hot segments (signal colour) + node points. */
function shapes() {
  // 01 Architecture
  const arch = {
    cool: [
      ...box(0, 1.55, 0, 1.3, 0.5, 0.7),
      ...box(-1.5, 0.1, 0, 0.95, 0.5, 0.7),
      ...box(0, 0.1, 0, 0.95, 0.5, 0.7),
      ...box(1.5, 0.1, 0, 0.95, 0.5, 0.7),
      ...cylinder(-0.8, -1.5, 0, 0.38, 0.45),
      ...cylinder(0.8, -1.5, 0, 0.38, 0.45),
      ...path([0, 0.85, 0], [1.5, 0.85, 0], [1.5, 0.35, 0]),
      ...path([0, 0.85, 0], [0, 0.35, 0]),
      ...path([0, -0.15, 0], [0, -0.7, 0], [0.8, -0.7, 0], [0.8, -1.27, 0]),
      ...path([1.5, -0.15, 0], [1.5, -0.7, 0], [0.8, -0.7, 0]),
    ],
    hot: [...path([0, 1.3, 0], [0, 0.85, 0], [-1.5, 0.85, 0], [-1.5, 0.35, 0]), ...path([-1.5, -0.15, 0], [-1.5, -0.7, 0], [-0.8, -0.7, 0], [-0.8, -1.27, 0])],
    nodes: [],
  };

  // 02 Execution: a rising staircase of work blocks over a time axis, with a playhead.
  const exec = { cool: [...path([-2.4, -1.75, 0], [2.4, -1.75, 0])], hot: [], nodes: [] };
  for (let i = 0; i <= 8; i++) exec.cool.push(...path([-2.4 + i * 0.6, -1.85, 0], [-2.4 + i * 0.6, -1.65, 0]));
  [[-2.2, -0.9], [-1.4, 0.0], [-0.5, 0.7], [0.4, 1.2], [1.2, 1.6]].forEach(([x, top], i) => {
    const w = 1.1, h = top + 1.75;
    exec.cool.push(...box(x + w / 2, -1.75 + h / 2, 0, w, h, 0.55));
    if (i < 4) exec.cool.push(...path([x + w, top, 0.28], [x + w + 0.1, top, 0.28], [x + w + 0.1, top + 0.3, 0.28]));
  });
  exec.hot.push(...path([0.15, -2.0, 0.4], [0.15, 1.95, 0.4]));

  // 03 AI / ML: four layers on rings, fully connected between neighbours.
  const layers = [4, 6, 6, 3].map((n, li) => {
    const x = -1.9 + li * 1.27;
    const r = [0.75, 1.3, 1.3, 0.55][li];
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + li * 0.4;
      return [x, Math.sin(a) * r, Math.cos(a) * r * 0.8];
    });
  });
  const net = { cool: [], hot: [], nodes: layers.flat() };
  for (let l = 0; l < 3; l++) for (const a of layers[l]) for (const b of layers[l + 1]) net.cool.push([a, b]);
  net.hot.push(...path(layers[0][1], layers[1][2], layers[2][4], layers[3][1]), ...path(layers[0][3], layers[1][5], layers[2][1], layers[3][0]));

  // 04 Game dev: a rolling wireframe terrain and a floating cube.
  const game = { cool: [], hot: [], nodes: [] };
  const N = 12, S = 4.1;
  const hgt = (x, z) => -1.35 + Math.sin(x * 1.25) * Math.cos(z * 1.05) * 0.32 + Math.sin(z * 2.2 + x) * 0.08;
  for (let i = 0; i <= N; i++) {
    const t = -S / 2 + (i / N) * S;
    for (let j = 0; j < N; j++) {
      const u0 = -S / 2 + (j / N) * S, u1 = -S / 2 + ((j + 1) / N) * S;
      game.cool.push([[u0, hgt(u0, t), t], [u1, hgt(u1, t), t]]);
      game.cool.push([[t, hgt(t, u0), u0], [t, hgt(t, u1), u1]]);
    }
  }
  const c = 0.55, rot = Math.PI / 4, tilt = 0.6;
  const cube = box(0, 0, 0, c * 2, c * 2, c * 2).map((seg) =>
    seg.map(([x, y, z]) => {
      const x1 = x * Math.cos(rot) - z * Math.sin(rot), z1 = x * Math.sin(rot) + z * Math.cos(rot);
      const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt), z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
      return [x1, y2 + 0.75, z2];
    }),
  );
  game.hot.push(...cube);

  // 05 Full-stack: four exploded layers around a core.
  const stack = { cool: [], hot: [], nodes: [] };
  [1.65, 0.55, -0.55, -1.65].forEach((y, i) => {
    const sq = path([-1.35, y, -1.35], [1.35, y, -1.35], [1.35, y, 1.35], [-1.35, y, 1.35], [-1.35, y, -1.35]);
    (i === 0 ? stack.hot : stack.cool).push(...sq);
    if (i > 0) stack.cool.push(...path([-0.7, y, -1.35], [-0.7, y, 1.35]), ...path([0.7, y, -1.35], [0.7, y, 1.35]));
  });
  [[-1.35, -1.35], [1.35, -1.35], [1.35, 1.35], [-1.35, 1.35]].forEach(([x, z]) => stack.cool.push([[x, 1.65, z], [x, -1.65, z]]));
  stack.hot.push([[0, 2.1, 0], [0, -2.1, 0]]);

  return [arch, exec, net, game, stack];
}

/** Stratified samples along segments; a share of points clustered on nodes. */
function sample(shape, count, rand) {
  const out = new Float32Array(count * 3);
  const hot = new Float32Array(count);
  const groups = [
    { segs: shape.cool, isHot: 0 },
    { segs: shape.hot, isHot: 1 },
  ].filter((g) => g.segs.length);
  const len = (s) => Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1], s[1][2] - s[0][2]);
  const nodeShare = shape.nodes.length ? 0.16 : 0;
  const nodeCount = Math.floor(count * nodeShare);
  const lineCount = count - nodeCount;
  // Hot lines get a denser share so they read as the lit path.
  const weight = groups.map((g) => g.segs.reduce((a, s) => a + len(s), 0) * (g.isHot ? 2.2 : 1));
  const total = weight.reduce((a, b) => a + b, 0);
  let k = 0;
  groups.forEach((g, gi) => {
    const n = gi === groups.length - 1 ? lineCount - k : Math.round((weight[gi] / total) * lineCount);
    const lens = g.segs.map(len);
    const cum = [];
    lens.reduce((a, l, i) => (cum[i] = a + l), 0);
    const L = cum[cum.length - 1];
    for (let i = 0; i < n; i++, k++) {
      const d = ((i + rand()) / n) * L;
      let s = 0;
      while (cum[s] < d && s < cum.length - 1) s++;
      const t = (d - (s ? cum[s - 1] : 0)) / (lens[s] || 1);
      const [a, b] = g.segs[s];
      const j = 0.012;
      out[k * 3] = a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * j;
      out[k * 3 + 1] = a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * j;
      out[k * 3 + 2] = a[2] + (b[2] - a[2]) * t + (rand() - 0.5) * j;
      hot[k] = g.isHot;
    }
  });
  for (let i = 0; k < count; i++, k++) {
    const p = shape.nodes[i % shape.nodes.length];
    const r = 0.09 * Math.cbrt(rand());
    const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
    out[k * 3] = p[0] + r * Math.sin(ph) * Math.cos(th);
    out[k * 3 + 1] = p[1] + r * Math.sin(ph) * Math.sin(th);
    out[k * 3 + 2] = p[2] + r * Math.cos(ph);
    hot[k] = 0.35;
  }
  return { pos: out, hot };
}

const hex = (h) => new THREE.Color(h.trim());

export function mountStrengthsScene(container, { bone = "#ece6da", hot = "#ff5b22" } = {}) {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const COUNT = isMobile ? 5200 : 9000;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const targets = shapes().map((s) => sample(s, COUNT, rand));

  const geo = new THREE.BufferGeometry();
  const aA = new Float32Array(targets[0].pos);
  const aB = new Float32Array(targets[0].pos);
  const hA = new Float32Array(targets[0].hot);
  const hB = new Float32Array(targets[0].hot);
  const rnd = new Float32Array(COUNT).map(() => rand());
  geo.setAttribute("position", new THREE.BufferAttribute(aA, 3));
  geo.setAttribute("aB", new THREE.BufferAttribute(aB, 3));
  geo.setAttribute("aHotA", new THREE.BufferAttribute(hA, 1));
  geo.setAttribute("aHotB", new THREE.BufferAttribute(hB, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));

  const uniforms = {
    uMix: { value: 1 },
    uTime: { value: 0 },
    uPx: { value: renderer.getPixelRatio() },
    uBone: { value: hex(bone) },
    uHot: { value: hex(hot) },
    uSize: { value: isMobile ? 2.3 : 1.9 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uMix; uniform float uTime; uniform float uPx; uniform float uSize;
      attribute vec3 aB; attribute float aHotA; attribute float aHotB; attribute float aRand;
      varying float vHot; varying float vAlpha;
      void main() {
        float m = uMix * uMix * (3.0 - 2.0 * uMix);
        vec3 p = mix(position, aB, m);
        float burst = sin(m * 3.14159);
        p += vec3(sin(aRand * 43.0 + uTime * 1.7), cos(aRand * 71.0 + uTime * 1.3), sin(aRand * 19.0 + uTime * 1.1)) * burst * (0.45 + aRand * 0.6);
        p += vec3(sin(uTime * 0.9 + aRand * 20.0), cos(uTime * 0.8 + aRand * 30.0), sin(uTime * 0.7 + aRand * 11.0)) * 0.012;
        vHot = mix(aHotA, aHotB, m);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * uSize * (0.75 + vHot * 0.9 + aRand * 0.5) * (11.0 / -mv.z);
        float tw = 0.55 + 0.45 * sin(uTime * 2.2 + aRand * 60.0);
        vAlpha = mix(0.5 + 0.5 * tw, 1.0, vHot) * (1.0 - burst * 0.35);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBone; uniform vec3 uHot;
      varying float vHot; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        vec3 col = mix(uBone * 0.85, uHot * 1.25, clamp(vHot, 0.0, 1.0));
        gl_FragColor = vec4(col, core * vAlpha * 0.9);
      }`,
  });
  const points = new THREE.Points(geo, material);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // Pointer tilt + mouse-drag spin with inertia (never captures touch: the page must scroll).
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const spin = { v: 0, angle: 0, dragging: false, lastX: 0 };
  const onMove = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    if (spin.dragging) {
      const dx = e.clientX - spin.lastX;
      spin.lastX = e.clientX;
      spin.v = dx * 0.006;
      spin.angle += spin.v;
      kick();
    }
  };
  const onDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    spin.dragging = true;
    spin.lastX = e.clientX;
    container.style.cursor = "grabbing";
  };
  const onUp = () => {
    spin.dragging = false;
    container.style.cursor = "";
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  if (fine) {
    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
  }

  let morph = null; // { from: 0..1 progress, start }
  let current = 0;
  let raf = 0;
  let running = false;
  let inView = false;
  let last = performance.now();

  const render = (dt) => {
    uniforms.uTime.value += dt;
    const k = Math.min(1, dt * 3);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    if (!spin.dragging) {
      spin.v *= Math.exp(-dt * 2.2);
      spin.angle += spin.v + dt * 0.12;
    }
    group.rotation.y = spin.angle + pointer.x * 0.45;
    group.rotation.x = 0.32 - pointer.y * 0.22;
    if (morph) {
      morph.t = Math.min(1, morph.t + dt / 1.5);
      uniforms.uMix.value = morph.t;
      if (morph.t >= 1) morph = null;
    }
    renderer.render(scene, camera);
  };

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    render(dt);
  };
  const start = () => {
    if (running || reduced || !inView || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  function kick() {
    if (reduced) render(0);
  }

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the structures framed in narrow containers.
    camera.position.z = w / h < 1 ? 11 / Math.max(0.62, w / h) : 11;
    camera.updateProjectionMatrix();
    if (!running) render(0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) start();
    else stop();
  });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVis);
  resize();

  return {
    /** Re-form the cloud into chapter i's structure. */
    setChapter(i) {
      if (i === current || !targets[i]) return;
      // Freeze the in-flight blend as the new starting point.
      const m0 = uniforms.uMix.value;
      const m = m0 * m0 * (3 - 2 * m0);
      for (let j = 0; j < COUNT * 3; j++) aA[j] += (aB[j] - aA[j]) * m;
      for (let j = 0; j < COUNT; j++) hA[j] += (hB[j] - hA[j]) * m;
      aB.set(targets[i].pos);
      hB.set(targets[i].hot);
      ["position", "aB", "aHotA", "aHotB"].forEach((n) => (geo.attributes[n].needsUpdate = true));
      current = i;
      uniforms.uMix.value = reduced ? 1 : 0;
      morph = reduced ? null : { t: 0 };
      if (reduced) render(0);
    },
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      geo.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
