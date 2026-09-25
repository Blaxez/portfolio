import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { getAssetPath } from "@/lib/assets";

/**
 * Particle logo morpher for the Skills section.
 *
 * - No OrbitControls: the canvas never captures wheel/touch, so the page always scrolls.
 * - Particles are repelled by the pointer and the logo tilts toward it.
 * - setScatter(0..1) lets scroll assemble/disperse the logo.
 * - Renders only while visible; destroy() releases the GL context and listeners.
 */
export class SkillsParticleSystem {
  constructor(container, data, { color = "#ece6da", hot = "#ff5b22", bg = "#0b0a09" } = {}) {
    this.container = container;
    if (!this.container) throw new Error("Container not found");
    this.data = data;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isMobile = isMobile;
    this.config = {
      maxParticles: isMobile ? 14000 : 30000,
      particleSize: isMobile ? 4.0 : 2.0,
      morphSpeed: 1.5,
      explosionForce: 0.5,
      bgColor: bg,
      color,
      hot,
      bloom: !isMobile,
      bloomStrength: 0.85,
      bloomRadius: 0.4,
      bloomThreshold: 0.0,
    };

    this.currentSkill = -1;
    this.pendingSkill = null;
    this.isMorphing = false;
    this.morphTime = 0;
    this.loadToken = 0;
    this.pointsCache = new Map();
    this.inView = false;
    this.running = false;
    this.elapsed = 0;
    this.last = performance.now();
    this.pointerNdc = new THREE.Vector2(10, 10);
    this.pointerActive = 0;
    this.tilt = { x: 0, y: 0 };
    this.onSkillChange = null;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    this.canvasCtx = canvas.getContext("2d", { willReadFrequently: true });

    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onVisibility = this.onVisibility.bind(this);

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(this.config.bgColor, 0.015);
    this.scene.background = new THREE.Color(this.config.bgColor);

    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 1.75);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    const el = this.renderer.domElement;
    el.style.display = "block";
    el.style.pointerEvents = "none";
    el.setAttribute("aria-hidden", "true");
    this.container.appendChild(el);

    if (this.config.bloom) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(w, h), this.config.bloomStrength, this.config.bloomRadius, this.config.bloomThreshold),
      );
    }

    this.createParticleSystem();

    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.hit = new THREE.Vector3();
    this.inverse = new THREE.Matrix4();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    document.addEventListener("pointerleave", this.onPointerLeave);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.io = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        this.updateLoop();
      },
      { rootMargin: "50px 0px" },
    );
    this.io.observe(this.container);

    this.onResize();
    this.compiled = false;
    const ready = () => {
      this.compiled = true;
      this.updateLoop();
      this.renderStill();
    };
    if (typeof this.renderer.compileAsync === "function" && this.renderer.extensions.has("KHR_parallel_shader_compile")) this.renderer.compileAsync(this.scene, this.camera).then(ready, ready);
    else ready();
  }

  createParticleSystem() {
    const n = this.config.maxParticles;
    this.geometry = new THREE.BufferGeometry();
    const posCurrent = new Float32Array(n * 3);
    const posTarget = new Float32Array(n * 3);
    const randoms = new Float32Array(n);
    const actives = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      randoms[i] = Math.random();
      // Start as a loose nebula so the first assemble has somewhere to come from.
      posCurrent[i * 3] = (Math.random() - 0.5) * 20;
      posCurrent[i * 3 + 1] = (Math.random() - 0.5) * 20;
      posCurrent[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    this.geometry.setAttribute("position", new THREE.BufferAttribute(posCurrent, 3));
    this.geometry.setAttribute("aTarget", new THREE.BufferAttribute(posTarget, 3));
    this.geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    this.geometry.setAttribute("aActive", new THREE.BufferAttribute(actives, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uMix;
        uniform float uSize;
        uniform float uExplosion;
        uniform float uScatter;
        uniform vec3 uMouse;
        uniform float uMouseStrength;
        uniform float uPixelRatio;

        attribute vec3 aTarget;
        attribute float aRandom;
        attribute float aActive;

        varying float vAlpha;
        varying float vDepth;
        varying float vHeat;
        varying float vSpark;

        vec3 swirl(vec3 p) {
          return vec3(sin(p.y * 3.0 + uTime), cos(p.z * 3.0 + uTime), sin(p.x * 3.0 + uTime)) * 0.1;
        }

        void main() {
          vec3 posA = position;
          vec3 posB = aTarget;

          float scatter = sin(uMix * 3.14159) * uExplosion;
          vec3 dir = normalize(posA + vec3(0.001));
          vec3 p = mix(posA, posB, uMix);
          p += dir * scatter * 3.0 + swirl(posA * 2.0) * scatter * 5.0;

          // Scroll-driven dispersal.
          vec3 rnd = vec3(fract(aRandom * 13.17) - 0.5, fract(aRandom * 71.71) - 0.5, fract(aRandom * 37.37) - 0.5);
          p += (normalize(p + 0.001) * 5.0 + rnd * 16.0) * uScatter * (0.35 + aRandom);

          // Pointer repulsion in the logo plane.
          vec2 away = p.xy - uMouse.xy;
          float d = length(away);
          float force = (1.0 - smoothstep(0.0, 2.6, d)) * uMouseStrength;
          p.xy += normalize(away + 0.0001) * force * 1.8;
          p.z += force * 1.4;
          vHeat = force;
          // A few particles run hot all the time: sparks from the beam.
          vSpark = step(0.972, aRandom);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uPixelRatio * (20.0 / -mv.z) * (1.0 + force * 0.8);
          vDepth = -mv.z;

          float blink = sin(uTime * 5.0 + aRandom * 10.0) * 0.5 + 0.5;
          vAlpha = aActive * (0.3 + 0.7 * blink) * (1.0 - uScatter * 0.35);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uHot;
        uniform float uBoost;
        varying float vAlpha;
        varying float vDepth;
        varying float vHeat;
        varying float vSpark;

        void main() {
          vec2 uv = gl_PointCoord.xy - 0.5;
          float r = length(uv);
          if (r > 0.5) discard;
          float glow = pow(1.0 - r * 2.0, 2.0);
          float fog = clamp((40.0 - vDepth) / 30.0, 0.0, 1.0);
          vec3 col = mix(uColor, uHot, max(vHeat * 0.9, vSpark * 0.95)) * uBoost;
          gl_FragColor = vec4(col, min(1.0, vAlpha * glow * fog * (uBoost * 0.5)));
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uSize: { value: this.config.particleSize },
        uExplosion: { value: this.config.explosionForce },
        uScatter: { value: 1 },
        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseStrength: { value: 0 },
        uPixelRatio: { value: this.pixelRatio },
        uColor: { value: new THREE.Color(this.config.color) },
        uHot: { value: new THREE.Color(this.config.hot) },
        uBoost: { value: this.config.bloom ? 2.0 : 3.2 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async getPointsFromImage(url) {
    if (this.pointsCache.has(url)) return this.pointsCache.get(url);
    const size = 512;
    const ctx = this.canvasCtx;
    ctx.clearRect(0, 0, size, size);
    try {
      const img = await this.loadImage(url);
      const aspect = img.width / img.height || 1;
      const dw = aspect > 1 ? size : size * aspect;
      const dh = aspect > 1 ? size / aspect : size;
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
      const data = ctx.getImageData(0, 0, size, size).data;
      const gap = this.isMobile ? 4 : 3;
      const points = [];
      for (let iy = 0; iy < size; iy += gap) {
        for (let ix = 0; ix < size; ix += gap) {
          if (data[(iy * size + ix) * 4 + 3] > 20) {
            points.push((ix / size - 0.5) * 10, ((size - iy) / size - 0.5) * 10, (Math.random() - 0.5) * 1.5);
          }
        }
      }
      this.pointsCache.set(url, points);
      return points;
    } catch (e) {
      console.error("Failed to load skill icon:", url, e);
      return [];
    }
  }

  /** Morph to a skill. Requests made mid-morph are queued; the latest one wins. */
  async loadSkill(index) {
    if (index === this.currentSkill && this.pendingSkill === null) return;
    if (this.isMorphing) {
      this.pendingSkill = index;
      return;
    }
    const token = ++this.loadToken;
    const skill = this.data[index];
    this.onSkillChange?.(skill, index);

    const url = getAssetPath(`/assets/skills/${skill.icon}`);
    const points = (await this.getPointsFromImage(url)).slice();
    if (token !== this.loadToken || !this.geometry) return;

    const count = points.length / 3;
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      for (let k = 0; k < 3; k++) [points[i * 3 + k], points[j * 3 + k]] = [points[j * 3 + k], points[i * 3 + k]];
    }

    const targetAttr = this.geometry.attributes.aTarget;
    const activeAttr = this.geometry.attributes.aActive;
    for (let i = 0; i < this.config.maxParticles; i++) {
      if (i < count) {
        targetAttr.setXYZ(i, points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
        activeAttr.setX(i, 1);
      } else {
        targetAttr.setXYZ(i, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        activeAttr.setX(i, 0);
      }
    }
    targetAttr.needsUpdate = true;
    activeAttr.needsUpdate = true;

    this.currentSkill = index;
    this.isMorphing = true;
    this.morphTime = this.reduced ? 1 : 0;
    this.renderStill();
  }

  /** 0 = assembled logo, 1 = dispersed nebula. Driven by scroll. */
  setScatter(v) {
    if (!this.material) return;
    this.material.uniforms.uScatter.value = v;
    this.renderStill();
  }

  onPointerMove(e) {
    const rect = this.container.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom || e.pointerType === "touch") {
      this.pointerActive = 0;
      return;
    }
    this.pointerNdc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.pointerActive = 1;
  }

  onPointerLeave() {
    this.pointerActive = 0;
  }

  onVisibility() {
    this.updateLoop();
  }

  updateLoop() {
    const shouldRun = this.compiled && this.inView && !document.hidden && !this.reduced;
    if (shouldRun && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.renderer.setAnimationLoop(this.animate);
    } else if (!shouldRun && this.running) {
      this.running = false;
      this.renderer.setAnimationLoop(null);
    }
    if (this.reduced && this.inView) this.renderStill();
  }

  renderStill() {
    if (this.running || !this.renderer || !this.compiled) return;
    if (this.isMorphing && this.reduced) this.finishMorph();
    this.draw();
  }

  finishMorph() {
    const pos = this.geometry.attributes.position;
    pos.array.set(this.geometry.attributes.aTarget.array);
    pos.needsUpdate = true;
    this.material.uniforms.uMix.value = 0;
    this.isMorphing = false;
    this.morphTime = 1;
    if (this.pendingSkill !== null) {
      const next = this.pendingSkill;
      this.pendingSkill = null;
      this.loadSkill(next);
    }
  }

  animate(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.elapsed += dt;
    const u = this.material.uniforms;

    if (this.isMorphing) {
      this.morphTime += dt * this.config.morphSpeed;
      if (this.morphTime >= 1) this.finishMorph();
      else u.uMix.value = this.morphTime * this.morphTime * (3 - 2 * this.morphTime);
    }

    // Pointer → logo plane (in the particles' local space).
    u.uMouseStrength.value += (this.pointerActive - u.uMouseStrength.value) * Math.min(1, dt * 6);
    if (this.pointerActive) {
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      if (this.raycaster.ray.intersectPlane(this.plane, this.hit)) {
        this.inverse.copy(this.particleSystem.matrixWorld).invert();
        this.hit.applyMatrix4(this.inverse);
        u.uMouse.value.lerp(this.hit, Math.min(1, dt * 10));
      }
    }

    const tx = this.pointerActive ? this.pointerNdc.x * 0.35 : Math.sin(this.elapsed * 0.3) * 0.2;
    const ty = this.pointerActive ? -this.pointerNdc.y * 0.2 : 0;
    this.tilt.x += (ty - this.tilt.x) * Math.min(1, dt * 3);
    this.tilt.y += (tx - this.tilt.y) * Math.min(1, dt * 3);
    this.particleSystem.rotation.set(this.tilt.x, this.tilt.y, 0);

    u.uTime.value = this.elapsed;
    this.draw();
  }

  draw() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
    const target = (this.isMobile ? 14 : 18) / this.camera.aspect;
    this.camera.position.z = this.isMobile ? Math.min(Math.max(target, 16), 35) : Math.max(20, Math.min(target, 60));
    this.renderStill();
  }

  destroy() {
    this.renderer?.setAnimationLoop(null);
    this.running = false;
    this.io?.disconnect();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerleave", this.onPointerLeave);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.geometry?.dispose();
    this.material?.dispose();
    this.composer?.dispose?.();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
    this.geometry = null;
    this.renderer = null;
  }
}
