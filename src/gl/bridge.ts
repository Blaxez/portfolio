import type { LoadPhase, RenderStats, SceneTarget } from "./protocol";

/**
 * Main-thread store between scroll choreography, the HUD and the render backend.
 * Target writes are coalesced to one hand-off per animation frame.
 */

export interface StageSnapshot {
  phase: LoadPhase;
  detail?: string;
  stats: RenderStats | null;
}

type Listener = () => void;

// Initial pose must match Choreography's hero pose so the first frame doesn't slide.
const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;
const target: SceneTarget = narrow
  ? { stage: 0, x: 0, y: 0.34, scale: 1.7, spin: 0, px: 0, py: 0, visible: true }
  : { stage: 0, x: 0.44, y: -0.02, scale: 1.12, spin: 0, px: 0, py: 0, visible: true };
let snapshot: StageSnapshot = { phase: "boot", stats: null };
const listeners = new Set<Listener>();
let sink: ((t: SceneTarget) => void) | null = null;
let scheduled = false;

function flush(): void {
  scheduled = false;
  if (!sink) return;
  const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
  sink({ ...target, visible: target.visible && !hidden });
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(flush);
}

export const stageStore = {
  target(): Readonly<SceneTarget> {
    return target;
  },
  setTarget(partial: Partial<SceneTarget>): void {
    let changed = false;
    for (const key of Object.keys(partial) as (keyof SceneTarget)[]) {
      if (target[key] !== partial[key]) {
        (target as unknown as Record<string, unknown>)[key] = partial[key];
        changed = true;
      }
    }
    if (changed) schedule();
  },
  /** Re-send the current target (e.g. after a page-visibility change). */
  refresh: schedule,
  connect(fn: (t: SceneTarget) => void): () => void {
    sink = fn;
    schedule();
    return () => {
      if (sink === fn) sink = null;
    };
  },
  getSnapshot(): StageSnapshot {
    return snapshot;
  },
  getServerSnapshot(): StageSnapshot {
    return snapshot;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  publish(next: Partial<StageSnapshot>): void {
    snapshot = { ...snapshot, ...next };
    for (const l of listeners) l();
  },
};
