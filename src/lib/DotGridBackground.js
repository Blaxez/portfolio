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
    this.canvas.style.zIndex = "0";
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
    const spacing = this.dotSpacing;

    for (let y = 0; y <= height + spacing; y += spacing) {
      for (let x = 0; x <= width + spacing; x += spacing) {
        this.dots.push({
          x,
          y,
          phase: Math.random() * Math.PI * 2,
          influence: 0,
        });
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
    if (document.hidden) return;
    this.render();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    ctx.clearRect(0, 0, width, height);

    if (!this.dots.length) return;

    const pointerActive = this.pointer.active;
    const px = this.pointer.x;
    const py = this.pointer.y;
    const influenceRadius = this.influenceRadius;
    const maxDistSq = influenceRadius * influenceRadius;

    const baseR = this.baseRadius;
    const maxR = this.maxRadius;
    const baseOpacity = this.baseOpacity;
    const maxOpacity = this.maxOpacity;

    const [r, g, b] = this.parseRGB(this.color);

    const time = performance.now() * 0.001;

    ctx.save();
    ctx.fillStyle = "transparent";

    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      let targetInfluence = 0;

      if (pointerActive && px != null && py != null) {
        const dx = dot.x - px;
        const dy = dot.y - py;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const t = 1 - dist / influenceRadius;
          targetInfluence = t * t;
        }
      }

      const prevInfluence = dot.influence || 0;
      const decay = 0.96; // smoother, longer trail
      const grown = Math.max(targetInfluence, prevInfluence * decay);
      dot.influence = grown;

      const influence = dot.influence;

      const idleWave = 0.12 + 0.07 * Math.sin(time * 0.5 + dot.phase);
      const radius =
        baseR + (maxR - baseR) * (influence * 0.9 + idleWave * 0.08);
      const alphaBase = baseOpacity + idleWave * 0.0;
      const glowStrength = influence * influence;
      const alpha = Math.min(maxOpacity, maxOpacity * glowStrength);

      // When there is no active pointer inside the hero, keep the grid fully transparent
      if (!pointerActive || alpha <= 0.001) continue;

      ctx.beginPath();
      // Optimization: No shadows (extremely expensive). Just draw the dot with alpha.
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      // ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 2.1})`;
      // ctx.shadowBlur = 7 * (0.3 + glowStrength);
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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
