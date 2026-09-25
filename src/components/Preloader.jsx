"use client";
import { useEffect } from "react";
import { SITE } from "@/lib/site";

export const INTRO_DONE = "intro:done";

/**
 * Intro: the laser cuts a line across the screen and the page opens along it.
 * Pure CSS so it runs before hydration; the page beneath is painted the whole
 * time, so it never holds back LCP. Once per session; skipped for reduced motion.
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
    const t = window.setTimeout(done, 1300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-half is-top" />
      <div className="intro-half is-bottom" />
      <span className="intro-name">
        {SITE.name.split("").map((ch, i) => (
          <span key={i} style={{ animationDelay: `${0.1 + i * 0.028}s` }}>
            {ch}
          </span>
        ))}
      </span>
      <span className="intro-cut" />
      <span className="intro-head beam-head" />
      <span className="intro-meta">{SITE.location}</span>
    </div>
  );
}
