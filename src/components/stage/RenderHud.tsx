"use client";

import { useSyncExternalStore } from "react";
import { stageStore } from "@/gl/bridge";
import type { LoadPhase } from "@/gl/protocol";

const PHASES: Record<LoadPhase, { label: string; progress: number }> = {
  boot: { label: "Creating context", progress: 0.12 },
  tessellate: { label: "Tessellating patches", progress: 0.38 },
  compile: { label: "Compiling shaders", progress: 0.66 },
  upload: { label: "Uploading buffers", progress: 0.88 },
  ready: { label: "Rendering", progress: 1 },
  unsupported: { label: "WebGL2 unavailable", progress: 1 },
  lost: { label: "Context lost — restoring", progress: 0.5 },
};

const nf = new Intl.NumberFormat("en-US");

/** Live render readout; doubles as the 3D loading state. */
export default function RenderHud() {
  const { phase, stats } = useSyncExternalStore(stageStore.subscribe, stageStore.getSnapshot, stageStore.getServerSnapshot);
  const info = PHASES[phase];
  const loading = phase !== "ready" && phase !== "unsupported";

  return (
    <div className="t-label w-full text-muted md:max-w-[280px]" role="status" aria-live="polite" aria-atomic="false">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block size-1.5 rounded-full ${phase === "ready" ? "bg-signal" : "bg-muted"} ${loading ? "motion-safe:animate-pulse" : ""}`}
            aria-hidden="true"
          />
          <span className="text-ink">{info.label}</span>
        </span>
        <span aria-hidden="true">{loading ? `${Math.round(info.progress * 100)}%` : stats?.backend === "worker" ? "Worker" : "Main"}</span>
      </div>
      <div className="relative mt-2 h-px w-full overflow-hidden bg-line" aria-hidden="true">
        <div
          className="absolute inset-0 origin-left bg-signal transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${info.progress})` }}
        />
      </div>
      <dl className="mt-3 hidden grid-cols-[auto_1fr] gap-x-4 gap-y-1 md:grid">
        <dt>API</dt>
        <dd className="text-right text-ink">WebGL2 · GLSL 300 es</dd>
        <dt>Mesh</dt>
        <dd className="text-right text-ink">{stats?.triangles ? `${nf.format(stats.triangles)} tris` : "—"}</dd>
        <dt>Frame</dt>
        <dd className="text-right text-ink tabular-nums">{stats && stats.fps > 0 ? `${stats.frameMs.toFixed(1)} ms · ${stats.fps} fps` : "—"}</dd>
        <dt>LOD</dt>
        <dd className="text-right text-ink">{stats ? `${stats.tier} · ${stats.dpr}×` : "—"}</dd>
      </dl>
    </div>
  );
}
