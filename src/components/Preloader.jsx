"use client";
import { useEffect } from "react";
import { SITE } from "@/lib/site";

export const INTRO_DONE = "intro:done";

/**
 * Brand intro curtain. Pure CSS so it runs before hydration, and the page
 * beneath is rendered (and painted) the whole time — it never blocks LCP.
 * Shown once per session; skipped for reduced motion.
 */
export default function Preloader() {
  useEffect(() => {
    const root = document.documentElement;
    const seen = root.classList.contains("intro-seen") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      sessionStorage.setItem("intro", "1");
    } catch {
      /* ignore */
    }
    const done = () => {
      window.__introDone = true;
      window.dispatchEvent(new Event(INTRO_DONE));
    };
    if (seen) {
      done();
      return;
    }
    const t = window.setTimeout(done, 1250);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-inner">
        <span className="intro-mono">{SITE.monogram}</span>
        <span className="intro-name">
          {SITE.name.split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.15 + i * 0.03}s` }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
        <span className="intro-bar" />
      </div>
    </div>
  );
}
