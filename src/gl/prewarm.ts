import { stageStore } from "./bridge";
import type { FromRenderer, QualityProfile, ToRenderer } from "./protocol";
import { detectQuality } from "./quality";

/**
 * Starts the render worker as soon as this module is evaluated — before React
 * hydrates — so worker fetch, context creation, tessellation and shader
 * compilation overlap hydration instead of following it. <Stage3D/> adopts the
 * worker on mount and replays any messages that arrived in between.
 */

export interface PrewarmedStage {
  worker: Worker;
  canvas: HTMLCanvasElement;
  quality: QualityProfile;
  /** Messages received before adoption, in order. */
  backlog: FromRenderer[];
}

let prewarmed: PrewarmedStage | null = null;

function start(): PrewarmedStage | null {
  const canvas = document.createElement("canvas");
  if (typeof Worker === "undefined" || typeof canvas.transferControlToOffscreen !== "function") return null;
  try {
    const quality = detectQuality();
    const worker = new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module", name: "render" });
    const backlog: FromRenderer[] = [];
    worker.onmessage = (event: MessageEvent<FromRenderer>) => backlog.push(event.data);
    const offscreen = canvas.transferControlToOffscreen();
    const init: ToRenderer = {
      type: "init",
      canvas: offscreen,
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      quality,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      target: { ...stageStore.target() },
    };
    worker.postMessage(init, [offscreen]);
    return { worker, canvas, quality, backlog };
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") prewarmed = start();

/** Hand over the prewarmed worker (once). Returns null if unavailable or already taken. */
export function takePrewarmedStage(): PrewarmedStage | null {
  const p = prewarmed;
  prewarmed = null;
  return p;
}
