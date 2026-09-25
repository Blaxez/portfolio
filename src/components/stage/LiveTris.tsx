"use client";

import { useSyncExternalStore } from "react";
import { stageStore } from "@/gl/bridge";

const nf = new Intl.NumberFormat("en-US");

export default function LiveTris() {
  const { stats } = useSyncExternalStore(stageStore.subscribe, stageStore.getSnapshot, stageStore.getServerSnapshot);
  return <span className="text-ink tabular-nums">{stats?.triangles ? nf.format(stats.triangles) : "thousands of"}</span>;
}
