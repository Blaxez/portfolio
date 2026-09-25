/** Shared types between the main thread and the render backend (worker or main-thread fallback). */

export type Tier = "high" | "medium" | "low";

export interface QualityProfile {
  tier: Tier;
  /** Bézier patch subdivisions per edge. */
  tessellation: number;
  /** Upper bound for devicePixelRatio. */
  maxDpr: number;
  /** Upper bound for drawing-buffer pixels (w × h). */
  pixelBudget: number;
  antialias: boolean;
}

/** Scene parameters driven by scroll + pointer. The renderer damps toward these. */
export interface SceneTarget {
  /** Pipeline stage, 0 (geometry) … 4 (composite); fractional values wipe between passes. */
  stage: number;
  /** Lens shift in NDC, positions the object without changing perspective. */
  x: number;
  y: number;
  scale: number;
  /** Additional yaw in radians contributed by scroll. */
  spin: number;
  /** Pointer in [-1, 1]. */
  px: number;
  py: number;
  /** Render loop runs only while visible. */
  visible: boolean;
}

export type LoadPhase = "boot" | "tessellate" | "compile" | "upload" | "ready" | "unsupported" | "lost";

export interface RenderStats {
  fps: number;
  frameMs: number;
  dpr: number;
  triangles: number;
  backend: "worker" | "main";
  tier: Tier;
}

export type ToRenderer =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      dpr: number;
      quality: QualityProfile;
      reducedMotion: boolean;
      target: SceneTarget;
    }
  | { type: "resize"; width: number; height: number; dpr: number }
  | { type: "target"; target: SceneTarget }
  | { type: "motion"; reducedMotion: boolean };

export type FromRenderer =
  | { type: "phase"; phase: LoadPhase; detail?: string }
  | { type: "stats"; stats: RenderStats };
