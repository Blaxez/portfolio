import type { QualityProfile } from "./protocol";

const PROFILES: Record<QualityProfile["tier"], QualityProfile> = {
  high: { tier: "high", tessellation: 14, maxDpr: 2, pixelBudget: 2560 * 1600, antialias: true },
  medium: { tier: "medium", tessellation: 10, maxDpr: 1.75, pixelBudget: 1440 * 1800, antialias: false },
  low: { tier: "low", tessellation: 7, maxDpr: 1.25, pixelBudget: 1280 * 900, antialias: false },
};

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** Level-of-detail tier from device hints: fewer patches, pixels and shader lobes on weaker hardware. */
export function detectQuality(): QualityProfile {
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData === true;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const compact = Math.min(screen.width, screen.height) < 768;

  if (saveData || cores <= 2 || memory <= 2) return PROFILES.low;
  if (coarse || compact || cores <= 4 || memory <= 4) return PROFILES.medium;
  return PROFILES.high;
}
