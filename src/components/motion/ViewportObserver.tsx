"use client";

import { useEffect } from "react";

/**
 * One-shot viewport reveals (IntersectionObserver + CSS transitions, compositor-only)
 * and active-section tracking for the primary nav.
 */
export default function ViewportObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    // Anything already on screen is marked visible before arming, so nothing flashes out.
    const vh = window.innerHeight;
    const pending = items.filter((el) => {
      const r = el.getBoundingClientRect();
      const inView = r.top < vh && r.bottom > 0;
      if (inView) el.classList.add("is-in");
      return !inView;
    });
    root.classList.add("reveal-armed");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const el of pending) reveal.observe(el);

    const links = new Map<string, HTMLAnchorElement>();
    document.querySelectorAll<HTMLAnchorElement>("[data-nav]").forEach((a) => links.set(a.dataset.nav!, a));
    const setCurrent = (id: string | null) => {
      links.forEach((a, key) => {
        if (key === id) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
          else if (entry.target.id === "craft" && entry.boundingClientRect.top > 0) setCurrent(null);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });

    return () => {
      reveal.disconnect();
      spy.disconnect();
      root.classList.remove("reveal-armed");
    };
  }, []);

  return null;
}
