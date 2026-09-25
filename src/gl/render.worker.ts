/// <reference lib="webworker" />
import type { FromRenderer, ToRenderer } from "./protocol";
import { TeapotRenderer } from "./renderer";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: FromRenderer): void => scope.postMessage(message);
let renderer: TeapotRenderer | null = null;

scope.onmessage = (event: MessageEvent<ToRenderer>) => {
  const message = event.data;
  switch (message.type) {
    case "init": {
      if (typeof scope.requestAnimationFrame !== "function") {
        post({ type: "phase", phase: "unsupported", detail: "worker rAF unavailable" });
        return;
      }
      renderer = new TeapotRenderer(
        message.canvas,
        {
          width: message.width,
          height: message.height,
          dpr: message.dpr,
          quality: message.quality,
          reducedMotion: message.reducedMotion,
          target: message.target,
          backend: "worker",
        },
        {
          phase: (phase, detail) => post({ type: "phase", phase, detail }),
          stats: (stats) => post({ type: "stats", stats }),
          requestFrame: (cb) => scope.requestAnimationFrame(cb),
          cancelFrame: (id) => scope.cancelAnimationFrame(id),
        },
      );
      renderer.start().catch((error: unknown) => {
        post({ type: "phase", phase: "unsupported", detail: error instanceof Error ? error.message : String(error) });
      });
      break;
    }
    case "resize":
      renderer?.resize(message.width, message.height, message.dpr);
      break;
    case "target":
      renderer?.setTarget(message.target);
      break;
    case "motion":
      renderer?.setReducedMotion(message.reducedMotion);
      break;
  }
};
