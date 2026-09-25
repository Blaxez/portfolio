export default class DotGridBackground {
  constructor(options = {}) {
    const {
      container = document.body,
      dotSpacing = 10,
      baseRadius = 0.4,
      maxRadius = 2.4,
      influenceRadius = 200,
      baseOpacity = 0.035,
      maxOpacity = 0.22,
      color = "rgba(148, 163, 184, 1)",
    } = options;

    this.container = container;
    this.dotSpacing = dotSpacing;
    this.baseRadius = baseRadius;
    this.maxRadius = maxRadius;
    this.influenceRadius = influenceRadius;
    this.baseOpacity = baseOpacity;
    this.maxOpacity = maxOpacity;
    this.color = color;

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "1";
    this.canvas.style.mixBlendMode = "screen";
    this.canvas.setAttribute("aria-hidden", "true");

    this.container.style.position = this.container.style.position || "relative";
    this.container.prepend(this.canvas);

    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.dots = [];

    this.pointer = { x: null, y: null, active: false };
    this.raf = null;
    this.resizeRaf = null;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.resize();
    this.bindEvents();
    // Only render while the container is on screen.
    this.inView = true;
    this.observer = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
    });
    this.observer.observe(this.container);
    this.animate();
  }

  bindEvents() {
    window.addEventListener("resize", this.handleResize, { passive: true });

    window.addEventListener("mousemove", this.handlePointerMove, {
      passive: true,
    });
    window.addEventListener("mouseleave", this.handlePointerLeave, {
      passive: true,
    });
    window.addEventListener("blur", this.handlePointerLeave, { passive: true });
  }

  handleResize() {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => this.resize());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    const dpr = this.dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.buildGrid(width, height);
  }

  buildGrid(width, height) {
    this.dots.length = 0;
    this.live = new Set();
    const spacing = this.dotSpacing;
    this.cols = Math.floor((width + spacing) / spacing) + 1;
    this.rows = Math.floor((height + spacing) / spacing) + 1;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.dots.push({ x: c * spacing, y: r * spacing, phase: Math.random() * Math.PI * 2, influence: 0 });
      }
    }
  }

  handlePointerMove(ev) {
    const rect = this.container.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this.handlePointerLeave();
      return;
    }

    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = true;
  }

  handlePointerLeave() {
    this.pointer.x = null;
    this.pointer.y = null;
    this.pointer.active = false;
  }

  animate() {
    this.raf = requestAnimationFrame(this.animate);
    if (document.hidden || !this.inView) return;
    this.render();
  }

  /**
   * Only dots near the pointer (plus their fading trail) are touched each
   * frame; with no pointer the canvas is cleared once and the frame skipped.
   */
  render() {
    const ctx = this.ctx;
    if (!ctx || !this.dots.length) return;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const { active, x: px, y: py } = this.pointer;

    if (!active) {
      if (this.dirty) {
        ctx.clearRect(0, 0, width, height);
        this.dirty = false;
        for (const i of this.live) this.dots[i].influence = 0;
        this.live.clear();
      }
      return;
    }

    ctx.clearRect(0, 0, width, height);
    this.dirty = true;

    const decay = 0.96;
    for (const i of this.live) {
      const dot = this.dots[i];
      dot.influence *= decay;
      if (dot.influence < 0.001) this.live.delete(i);
    }

    const s = this.dotSpacing;
    const R = this.influenceRadius;
    const c0 = Math.max(0, Math.floor((px - R) / s));
    const c1 = Math.min(this.cols - 1, Math.ceil((px + R) / s));
    const r0 = Math.max(0, Math.floor((py - R) / s));
    const r1 = Math.min(this.rows - 1, Math.ceil((py + R) / s));
    const maxDistSq = R * R;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * this.cols + c;
        const dot = this.dots[i];
        const dx = dot.x - px;
        const dy = dot.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 >= maxDistSq) continue;
        const t = 1 - Math.sqrt(d2) / R;
        const target = t * t;
        if (target > dot.influence) dot.influence = target;
        this.live.add(i);
      }
    }

    if (!this.rgb) this.rgb = this.parseRGB(this.color);
    const [cr, cg, cb] = this.rgb;
    const time = performance.now() * 0.001;
    const baseR = this.baseRadius;
    const maxR = this.maxRadius;
    for (const i of this.live) {
      const dot = this.dots[i];
      const inf = dot.influence;
      const alpha = Math.min(this.maxOpacity, this.maxOpacity * inf * inf);
      if (alpha <= 0.001) continue;
      const idle = 0.12 + 0.07 * Math.sin(time * 0.5 + dot.phase);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, baseR + (maxR - baseR) * (inf * 0.9 + idle * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  parseRGB(rgbStr) {
    if (!rgbStr.startsWith("rgba") && !rgbStr.startsWith("rgb")) {
      return [148, 163, 184];
    }
    const match = rgbStr.match(/rgba?\(([^)]+)\)/);
    if (!match) return [148, 163, 184];
    const parts = match[1].split(",").map((v) => parseFloat(v.trim()));
    return [parts[0] || 148, parts[1] || 163, parts[2] || 184];
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    cancelAnimationFrame(this.resizeRaf);

    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handlePointerMove);
    window.removeEventListener("mouseleave", this.handlePointerLeave);
    window.removeEventListener("blur", this.handlePointerLeave);

    if (this.canvas && this.canvas.parentElement === this.container) {
      this.container.removeChild(this.canvas);
    }

    this.dots.length = 0;
  }
}
