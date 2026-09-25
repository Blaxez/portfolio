/**
 * Cursor-reactive dot matrix for the hero. Only dots near the pointer (and
 * their fading trail) are drawn, as tiny squares batched by opacity level —
 * a handful of fillStyle changes per frame instead of one per dot. The pointer
 * position is resolved once per frame (no layout reads in the event handler),
 * and drawing stops entirely once the pointer is still and the trail has faded.
 */
const LEVELS = 6;

export default class DotGridBackground {
  constructor(options = {}) {
    const {
      container = document.body,
      dotSpacing = 11,
      baseRadius = 0.6,
      maxRadius = 1.1,
      influenceRadius = 340,
      maxOpacity = 0.55,
      color = "rgba(148, 163, 184, 1)",
    } = options;

    this.container = container;
    this.dotSpacing = dotSpacing;
    this.baseRadius = baseRadius;
    this.maxRadius = maxRadius;
    this.influenceRadius = influenceRadius;
    this.maxOpacity = maxOpacity;
    this.rgb = parseRGB(color);

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "1" });
    this.canvas.setAttribute("aria-hidden", "true");
    this.container.style.position = this.container.style.position || "relative";
    this.container.prepend(this.canvas);

    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.pointer = { cx: 0, cy: 0, active: false };
    this.idleFrames = Infinity;
    this.live = new Set();
    this.influence = new Float32Array(0);
    this.buckets = Array.from({ length: LEVELS }, () => []);
    this.styles = Array.from({ length: LEVELS }, (_, i) => {
      const a = ((i + 0.5) / LEVELS) * this.maxOpacity;
      return `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, ${a.toFixed(3)})`;
    });

    this.onMove = (e) => {
      this.pointer.cx = e.clientX;
      this.pointer.cy = e.clientY;
      this.pointer.active = true;
      this.idleFrames = 0;
    };
    this.onLeave = () => {
      this.pointer.active = false;
    };
    this.onResize = () => {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.resize());
    };
    this.animate = this.animate.bind(this);

    this.resize();
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pointermove", this.onMove, { passive: true });
    document.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("blur", this.onLeave);
    this.inView = true;
    this.observer = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
    });
    this.observer.observe(this.container);
    this.raf = requestAnimationFrame(this.animate);
  }

  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.canvas.width = Math.max(1, Math.round(width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.w = width;
    this.h = height;
    const s = this.dotSpacing;
    this.cols = Math.floor(width / s) + 1;
    this.rows = Math.floor(height / s) + 1;
    this.influence = new Float32Array(this.cols * this.rows);
    this.live.clear();
    this.idleFrames = 0;
  }

  animate() {
    this.raf = requestAnimationFrame(this.animate);
    if (document.hidden || !this.inView) return;
    // Pointer still for ~2.5s: the trail has faded and the canvas already shows the final frame.
    if (this.idleFrames > 150) return;
    this.idleFrames++;
    this.render();
  }

  render() {
    const { ctx, dotSpacing: s, influenceRadius: R } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const i of this.live) {
      this.influence[i] *= 0.95;
      if (this.influence[i] < 0.004) {
        this.influence[i] = 0;
        this.live.delete(i);
      }
    }

    if (this.pointer.active) {
      const rect = this.container.getBoundingClientRect();
      const px = this.pointer.cx - rect.left;
      const py = this.pointer.cy - rect.top;
      if (px >= -R && py >= -R && px <= rect.width + R && py <= rect.height + R) {
        const c0 = Math.max(0, Math.floor((px - R) / s));
        const c1 = Math.min(this.cols - 1, Math.ceil((px + R) / s));
        const r0 = Math.max(0, Math.floor((py - R) / s));
        const r1 = Math.min(this.rows - 1, Math.ceil((py + R) / s));
        const R2 = R * R;
        for (let r = r0; r <= r1; r++) {
          const dy = r * s - py;
          for (let c = c0; c <= c1; c++) {
            const dx = c * s - px;
            const d2 = dx * dx + dy * dy;
            if (d2 >= R2) continue;
            const t = 1 - Math.sqrt(d2) / R;
            const target = t * t;
            const i = r * this.cols + c;
            if (target > this.influence[i]) this.influence[i] = target;
            this.live.add(i);
          }
        }
      }
    }

    const buckets = this.buckets;
    for (const b of buckets) b.length = 0;
    for (const i of this.live) {
      const inf = this.influence[i];
      const a = inf * inf; // 0..1 of maxOpacity
      if (a < 0.01) continue;
      buckets[Math.min(LEVELS - 1, Math.floor(a * LEVELS))].push(i);
    }
    const { baseRadius: br, maxRadius: mr, cols } = this;
    for (let l = 0; l < LEVELS; l++) {
      const list = buckets[l];
      if (!list.length) continue;
      ctx.fillStyle = this.styles[l];
      const size = 2 * (br + (mr - br) * ((l + 0.5) / LEVELS));
      const half = size / 2;
      for (let k = 0; k < list.length; k++) {
        const i = list[k];
        ctx.fillRect((i % cols) * s - half, ((i / cols) | 0) * s - half, size, size);
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.resizeRaf);
    this.observer?.disconnect();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onMove);
    document.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("blur", this.onLeave);
    this.canvas.remove();
  }
}

function parseRGB(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || "");
  if (!m) return [148, 163, 184];
  const [r, g, b] = m[1].split(",").map((v) => parseFloat(v));
  return [r || 0, g || 0, b || 0];
}
