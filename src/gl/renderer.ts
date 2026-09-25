import { damp, mat4, modelMatrix, multiply, perspective, viewAt } from "./math";
import type { LoadPhase, QualityProfile, RenderStats, SceneTarget } from "./protocol";
import { CAGE_FS, CAGE_VS, DEPTH_FS, MESH_FS, MESH_VS } from "./shaders";
import { tessellateTeapot, type TeapotMesh } from "./tessellate";

/**
 * DOM-free WebGL2 renderer. Runs unchanged inside a Web Worker (OffscreenCanvas)
 * or on the main thread (HTMLCanvasElement) as a fallback.
 */

export interface RendererHost {
  phase(phase: LoadPhase, detail?: string): void;
  stats(stats: RenderStats): void;
  requestFrame(cb: (now: number) => void): number;
  cancelFrame(id: number): void;
}

export interface RendererOptions {
  width: number;
  height: number;
  dpr: number;
  quality: QualityProfile;
  reducedMotion: boolean;
  target: SceneTarget;
  backend: RenderStats["backend"];
}

type Canvas = HTMLCanvasElement | OffscreenCanvas;

interface Programs {
  mesh: WebGLProgram;
  depth: WebGLProgram;
  cage: WebGLProgram;
}

const FOV_Y = (28 * Math.PI) / 180;
/** Fraction of the half-viewport the object's bounding radius occupies at scale 1. */
const FILL = 0.42;
const DPR_SCALE_MIN = 0.6;

export class TeapotRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private programs: Programs | null = null;
  private uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  private meshVao: WebGLVertexArrayObject | null = null;
  private cageVao: WebGLVertexArrayObject | null = null;
  private pointVao: WebGLVertexArrayObject | null = null;
  private buffers: WebGLBuffer[] = [];
  private mesh: TeapotMesh | null = null;

  private width: number;
  private height: number;
  private dpr: number;
  private dprScale = 1;
  private reducedMotion: boolean;
  private target: SceneTarget;
  private current: SceneTarget;
  private autoYaw = 0.6;

  private frameId = 0;
  private running = false;
  private ready = false;
  private destroyed = false;
  private lastTime = 0;

  private windowStart = 0;
  private windowFrames = 0;
  private windowDt = 0;
  private slowSeconds = 0;
  private fastSeconds = 0;

  private readonly model = mat4();
  private readonly view = mat4();
  private readonly proj = mat4();
  private readonly viewProj = mat4();

  constructor(
    private readonly canvas: Canvas,
    private readonly options: RendererOptions,
    private readonly host: RendererHost,
  ) {
    this.width = options.width;
    this.height = options.height;
    this.dpr = options.dpr;
    this.reducedMotion = options.reducedMotion;
    this.target = { ...options.target };
    this.current = { ...options.target };
    this.onLost = this.onLost.bind(this);
    this.onRestored = this.onRestored.bind(this);
    this.frame = this.frame.bind(this);
  }

  async start(): Promise<void> {
    this.host.phase("boot");
    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: this.options.quality.antialias,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: this.options.quality.tier === "high" ? "high-performance" : "default",
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      this.host.phase("unsupported", "WebGL2 unavailable");
      return;
    }
    this.gl = gl;
    (this.canvas as EventTarget).addEventListener("webglcontextlost", this.onLost as EventListener);
    (this.canvas as EventTarget).addEventListener("webglcontextrestored", this.onRestored as EventListener);

    // Kick off shader compilation first; the driver compiles while the CPU tessellates.
    const pending = this.beginPrograms(gl);
    this.host.phase("tessellate", `${this.options.quality.tessellation}×${this.options.quality.tessellation}`);
    this.mesh = tessellateTeapot(this.options.quality.tessellation);
    this.host.phase("compile");
    this.programs = await this.finishPrograms(gl, pending);
    if (this.destroyed) return;
    this.host.phase("upload", `${this.mesh.triangles}`);
    this.upload(gl, this.mesh);
    this.applySize();
    this.ready = true;
    this.lastTime = 0;
    this.render(0);
    this.host.phase("ready", `${this.mesh.triangles}`);
    this.emitStats(0);
    this.loop();
  }

  setTarget(target: SceneTarget): void {
    const wasVisible = this.target.visible;
    this.target = target;
    if (target.visible && !wasVisible) this.loop();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    if (this.ready) this.applySize();
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    const gl = this.gl;
    if (!gl) return;
    this.releaseResources(gl);
    (this.canvas as EventTarget).removeEventListener("webglcontextlost", this.onLost as EventListener);
    (this.canvas as EventTarget).removeEventListener("webglcontextrestored", this.onRestored as EventListener);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.gl = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  private loop(): void {
    if (this.running || !this.ready || this.destroyed) return;
    this.running = true;
    this.lastTime = 0;
    this.windowStart = 0;
    this.windowFrames = 0;
    this.windowDt = 0;
    this.frameId = this.host.requestFrame(this.frame);
  }

  private stop(): void {
    if (!this.running) return;
    this.running = false;
    this.host.cancelFrame(this.frameId);
  }

  private frame(now: number): void {
    if (!this.running) return;
    if (!this.target.visible) {
      this.running = false;
      return;
    }
    const dt = this.lastTime === 0 ? 1 / 60 : Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.render(dt);
    this.track(now, dt);
    this.frameId = this.host.requestFrame(this.frame);
  }

  private onLost(event: Event): void {
    event.preventDefault();
    this.stop();
    this.ready = false;
    this.host.phase("lost");
  }

  private async onRestored(): Promise<void> {
    const gl = this.gl;
    if (!gl || !this.mesh || this.destroyed) return;
    this.uniforms.clear();
    this.programs = await this.finishPrograms(gl, this.beginPrograms(gl));
    this.upload(gl, this.mesh);
    this.applySize();
    this.ready = true;
    this.host.phase("ready", `${this.mesh.triangles}`);
    this.loop();
  }

  // ── Adaptive resolution & stats ──────────────────────────────

  private track(now: number, dt: number): void {
    if (this.windowStart === 0) this.windowStart = now;
    this.windowFrames++;
    this.windowDt += dt;
    const elapsed = now - this.windowStart;
    if (elapsed < 1000) return;

    const avgMs = (this.windowDt / this.windowFrames) * 1000;
    if (avgMs > 20) {
      this.slowSeconds++;
      this.fastSeconds = 0;
    } else if (avgMs < 17.5) {
      this.fastSeconds++;
      this.slowSeconds = 0;
    }
    // Two slow seconds in a row → shed pixels; five fast seconds → claw some back.
    if (this.slowSeconds >= 2 && this.dprScale > DPR_SCALE_MIN) {
      this.dprScale = Math.max(DPR_SCALE_MIN, this.dprScale * 0.85);
      this.slowSeconds = 0;
      this.applySize();
    } else if (this.fastSeconds >= 5 && this.dprScale < 1) {
      this.dprScale = Math.min(1, this.dprScale * 1.1);
      this.fastSeconds = 0;
      this.applySize();
    }
    this.emitStats(this.windowFrames / (elapsed / 1000), avgMs);
    this.windowStart = now;
    this.windowFrames = 0;
    this.windowDt = 0;
  }

  private emitStats(fps: number, frameMs = 0): void {
    this.host.stats({
      fps: Math.round(fps),
      frameMs: Math.round(frameMs * 10) / 10,
      dpr: Math.round(this.effectiveDpr() * 100) / 100,
      triangles: this.mesh?.triangles ?? 0,
      backend: this.options.backend,
      tier: this.options.quality.tier,
    });
  }

  private effectiveDpr(): number {
    const q = this.options.quality;
    let dpr = Math.min(this.dpr, q.maxDpr) * this.dprScale;
    const pixels = this.width * this.height * dpr * dpr;
    if (pixels > q.pixelBudget) dpr *= Math.sqrt(q.pixelBudget / pixels);
    return Math.max(0.5, dpr);
  }

  private applySize(): void {
    const dpr = this.effectiveDpr();
    const w = Math.max(1, Math.round(this.width * dpr));
    const h = Math.max(1, Math.round(this.height * dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    if (!this.running && this.ready) this.render(0);
  }

  // ── GL resources ─────────────────────────────────────────────

  private beginPrograms(gl: WebGL2RenderingContext) {
    const compile = (type: number, src: string): WebGLShader => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const link = (vs: WebGLShader, fs: WebGLShader): WebGLProgram => {
      const p = gl.createProgram()!;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      return p;
    };
    const meshVs = compile(gl.VERTEX_SHADER, MESH_VS);
    const cageVs = compile(gl.VERTEX_SHADER, CAGE_VS);
    const shaders = [meshVs, cageVs, compile(gl.FRAGMENT_SHADER, MESH_FS), compile(gl.FRAGMENT_SHADER, DEPTH_FS), compile(gl.FRAGMENT_SHADER, CAGE_FS)];
    const programs: Programs = {
      mesh: link(meshVs, shaders[2]!),
      depth: link(meshVs, shaders[3]!),
      cage: link(cageVs, shaders[4]!),
    };
    return { programs, shaders };
  }

  /** Waits on KHR_parallel_shader_compile when present so linking never stalls a frame. */
  private async finishPrograms(
    gl: WebGL2RenderingContext,
    pending: { programs: Programs; shaders: WebGLShader[] },
  ): Promise<Programs> {
    const ext = gl.getExtension("KHR_parallel_shader_compile");
    const list = Object.values(pending.programs) as WebGLProgram[];
    if (ext) {
      await new Promise<void>((resolve) => {
        const poll = () => {
          if (list.every((p) => gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR))) resolve();
          else this.host.requestFrame(poll);
        };
        poll();
      });
    }
    for (const p of list) {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
        const log = pending.shaders.map((s) => gl.getShaderInfoLog(s)).filter(Boolean).join("\n");
        throw new Error(`Program link failed: ${gl.getProgramInfoLog(p) ?? ""}\n${log}`);
      }
    }
    for (const s of pending.shaders) gl.deleteShader(s);
    return pending.programs;
  }

  private u(program: WebGLProgram, name: string): WebGLUniformLocation | null {
    let table = this.uniforms.get(program);
    if (!table) {
      table = new Map();
      this.uniforms.set(program, table);
    }
    if (!table.has(name)) table.set(name, this.gl!.getUniformLocation(program, name));
    return table.get(name)!;
  }

  private upload(gl: WebGL2RenderingContext, mesh: TeapotMesh): void {
    this.releaseResources(gl, false);
    const makeVao = (data: Float32Array, stride: number, withNormal: boolean) => {
      const vao = gl.createVertexArray()!;
      const buf = gl.createBuffer()!;
      this.buffers.push(buf);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      if (withNormal) {
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
      }
      gl.bindVertexArray(null);
      return vao;
    };
    this.meshVao = makeVao(mesh.vertices, 24, true);
    this.cageVao = makeVao(mesh.cage, 12, false);
    this.pointVao = makeVao(mesh.points, 12, false);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private releaseResources(gl: WebGL2RenderingContext, programs = true): void {
    for (const b of this.buffers) gl.deleteBuffer(b);
    this.buffers = [];
    for (const v of [this.meshVao, this.cageVao, this.pointVao]) if (v) gl.deleteVertexArray(v);
    this.meshVao = this.cageVao = this.pointVao = null;
    if (programs && this.programs) {
      for (const p of Object.values(this.programs) as WebGLProgram[]) gl.deleteProgram(p);
      this.programs = null;
    }
  }

  // ── Frame ────────────────────────────────────────────────────

  private render(dt: number): void {
    const gl = this.gl;
    const mesh = this.mesh;
    const programs = this.programs;
    if (!gl || !mesh || !programs || !this.meshVao) return;

    const t = this.target;
    const c = this.current;
    const reduced = this.reducedMotion;
    if (dt === 0) {
      Object.assign(c, t);
    } else {
      c.stage = reduced ? Math.round(t.stage) : damp(c.stage, t.stage, 7, dt);
      c.x = damp(c.x, t.x, 4, dt);
      c.y = damp(c.y, t.y, 4, dt);
      c.scale = damp(c.scale, t.scale, 4, dt);
      c.spin = damp(c.spin, t.spin, 5, dt);
      c.px = damp(c.px, t.px, 3, dt);
      c.py = damp(c.py, t.py, 3, dt);
      if (!reduced) this.autoYaw += dt * 0.22;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const aspect = w / h;
    const halfTan = Math.tan(FOV_Y / 2);
    // Portrait: fit to width instead of height.
    const fovY = aspect >= 1 ? FOV_Y : Math.min(2 * Math.atan(halfTan / aspect), 1.4);
    const distance = 1 / (halfTan * FILL);
    const scale = c.scale / mesh.radius;
    const reach = c.scale;

    modelMatrix(this.model, this.autoYaw + c.spin + c.px * 0.35, 0.3 - c.py * 0.12, scale);
    viewAt(this.view, distance);
    perspective(this.proj, fovY, aspect, Math.max(0.05, distance - reach * 2), distance + reach * 2);
    multiply(this.viewProj, this.proj, this.view);

    const lx = 0.55 + c.px * 1.1;
    const ly = 0.8 + c.py * 0.6;
    const lz = 0.65;
    const ll = Math.hypot(lx, ly, lz);
    const lineWidth = Math.max(1, this.effectiveDpr() * 0.9);

    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // 1 — depth pre-pass: hidden-line removal for the wireframe pass, early-z for the rest.
    gl.bindVertexArray(this.meshVao);
    gl.useProgram(programs.depth);
    this.setTransform(programs.depth, c);
    gl.colorMask(false, false, false, false);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);

    // 2 — shading pass.
    const p = programs.mesh;
    gl.useProgram(p);
    this.setTransform(p, c);
    gl.uniformMatrix4fv(this.u(p, "uView"), false, this.view);
    gl.uniform1f(this.u(p, "uStage"), c.stage);
    gl.uniform3f(this.u(p, "uCamPos"), 0, 0, distance);
    gl.uniform3f(this.u(p, "uLightDir"), lx / ll, ly / ll, lz / ll);
    gl.uniform2f(this.u(p, "uDepthRange"), distance - reach, distance + reach);
    gl.uniform2f(this.u(p, "uLocalYRange"), mesh.minY, mesh.maxY);
    gl.uniform1f(this.u(p, "uLineWidth"), lineWidth);
    gl.uniform1f(this.u(p, "uQuality"), this.options.quality.tier === "low" ? 0 : 1);
    gl.colorMask(true, true, true, true);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);

    // 3 — Bézier control cage, fades out as the normals pass takes over.
    const cageAlpha = 1 - Math.min(1, Math.max(0, c.stage));
    if (cageAlpha > 0.01 && this.cageVao && this.pointVao) {
      const cp = programs.cage;
      gl.useProgram(cp);
      this.setTransform(cp, c);
      gl.disable(gl.DEPTH_TEST);
      gl.uniform1f(this.u(cp, "uPointSize"), Math.max(2, 2.25 * this.effectiveDpr()));
      gl.bindVertexArray(this.cageVao);
      gl.uniform4f(this.u(cp, "uColor"), 0.541, 0.541, 0.565, 0.32 * cageAlpha);
      gl.drawArrays(gl.LINES, 0, mesh.cageVertexCount);
      gl.bindVertexArray(this.pointVao);
      gl.uniform4f(this.u(cp, "uColor"), 0.776, 1.0, 0.239, 0.6 * cageAlpha);
      gl.drawArrays(gl.POINTS, 0, mesh.pointCount);
    }
    gl.bindVertexArray(null);
  }

  private setTransform(program: WebGLProgram, c: SceneTarget): void {
    const gl = this.gl!;
    gl.uniformMatrix4fv(this.u(program, "uModel"), false, this.model);
    gl.uniformMatrix4fv(this.u(program, "uViewProj"), false, this.viewProj);
    gl.uniform2f(this.u(program, "uShift"), c.x, c.y);
  }
}
