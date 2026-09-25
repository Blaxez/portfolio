"use client";

import { useEffect, useRef } from "react";
import { stageStore } from "@/gl/bridge";
import { takePrewarmedStage } from "@/gl/prewarm";
import type { FromRenderer, LoadPhase, QualityProfile, SceneTarget, ToRenderer } from "@/gl/protocol";
import { detectQuality } from "@/gl/quality";

interface Backend {
  resize(width: number, height: number, dpr: number): void;
  target(target: SceneTarget): void;
  motion(reduced: boolean): void;
  destroy(): void;
}

/**
 * Fixed full-viewport WebGL2 layer. Rendering runs in a Web Worker through
 * OffscreenCanvas (started before hydration, see gl/prewarm); browsers without
 * it get the same renderer on the main thread.
 */
export default function Stage3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    performance.mark("stage:mount");

    let disposed = false;
    let backend: Backend | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let fellBack = false;
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => ({
      width: host.clientWidth,
      height: host.clientHeight,
      dpr: window.devicePixelRatio || 1,
    });

    const mountCanvas = (c: HTMLCanvasElement): HTMLCanvasElement => {
      host.replaceChildren(c);
      canvas = c;
      return c;
    };

    const onPhase = (phase: LoadPhase, detail?: string): void => {
      if (disposed) return;
      if (phase === "unsupported" && !fellBack) {
        fellBack = true;
        backend?.destroy();
        void startMainThread(detectQuality());
        return;
      }
      stageStore.publish({ phase, detail });
      performance.mark(`stage:${phase}`);
      if (phase === "ready" && canvas) canvas.dataset.ready = "";
    };

    const onMessage = (message: FromRenderer): void => {
      if (message.type === "phase") onPhase(message.phase, message.detail);
      else stageStore.publish({ stats: message.stats });
    };

    const startMainThread = async (quality: QualityProfile): Promise<void> => {
      const c = mountCanvas(document.createElement("canvas"));
      const { TeapotRenderer } = await import("@/gl/renderer");
      if (disposed) return;
      const { width, height, dpr } = measure();
      const renderer = new TeapotRenderer(
        c,
        { width, height, dpr, quality, reducedMotion: motionQuery.matches, target: { ...stageStore.target() }, backend: "main" },
        {
          phase: (phase, detail) => {
            if (phase === "unsupported") stageStore.publish({ phase, detail });
            else onPhase(phase, detail);
          },
          stats: (stats) => stageStore.publish({ stats }),
          requestFrame: (cb) => requestAnimationFrame(cb),
          cancelFrame: (id) => cancelAnimationFrame(id),
        },
      );
      backend = {
        resize: (w, h, d) => renderer.resize(w, h, d),
        target: (t) => renderer.setTarget(t),
        motion: (r) => renderer.setReducedMotion(r),
        destroy: () => renderer.destroy(),
      };
      renderer.start().catch((error: unknown) => {
        stageStore.publish({ phase: "unsupported", detail: error instanceof Error ? error.message : String(error) });
      });
    };

    const attachWorker = (worker: Worker): void => {
      const send = (message: ToRenderer) => worker.postMessage(message);
      worker.onmessage = (event: MessageEvent<FromRenderer>) => onMessage(event.data);
      worker.onerror = () => onPhase("unsupported", "worker error");
      backend = {
        resize: (width, height, dpr) => send({ type: "resize", width, height, dpr }),
        target: (target) => send({ type: "target", target }),
        motion: (reducedMotion) => send({ type: "motion", reducedMotion }),
        destroy: () => worker.terminate(),
      };
    };

    const startWorker = (): boolean => {
      const prewarmed = takePrewarmedStage();
      if (prewarmed) {
        mountCanvas(prewarmed.canvas);
        attachWorker(prewarmed.worker);
        for (const message of prewarmed.backlog) onMessage(message);
        const { width, height, dpr } = measure();
        backend?.resize(width, height, dpr);
        backend?.motion(motionQuery.matches);
        return true;
      }
      const c = mountCanvas(document.createElement("canvas"));
      if (typeof Worker === "undefined" || typeof c.transferControlToOffscreen !== "function") return false;
      const offscreen = c.transferControlToOffscreen();
      const worker = new Worker(new URL("../../gl/render.worker.ts", import.meta.url), { type: "module", name: "render" });
      attachWorker(worker);
      const { width, height, dpr } = measure();
      worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          width,
          height,
          dpr,
          quality: detectQuality(),
          reducedMotion: motionQuery.matches,
          target: { ...stageStore.target() },
        } satisfies ToRenderer,
        [offscreen],
      );
      return true;
    };

    if (!startWorker()) void startMainThread(detectQuality());

    const disconnect = stageStore.connect((t) => backend?.target(t));

    let resizeTimer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const { width, height, dpr } = measure();
        backend?.resize(width, height, dpr);
      }, 120);
    });
    observer.observe(host);

    const onPointer = (event: PointerEvent) => {
      // Touch "pointers" are scroll drags, not a hovering light source.
      if (event.pointerType === "touch") return;
      stageStore.setTarget({
        px: (event.clientX / window.innerWidth) * 2 - 1,
        py: -((event.clientY / window.innerHeight) * 2 - 1),
      });
    };
    const onVisibility = () => stageStore.refresh();
    const onMotion = () => backend?.motion(motionQuery.matches);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotion);

    return () => {
      disposed = true;
      disconnect();
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotion);
      backend?.destroy();
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="stage-layer" aria-hidden="true" data-stage-layer />;
}
