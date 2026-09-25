/** Scroll to a section through Lenis when it's running, natively otherwise. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  if (typeof window === "undefined") return;
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset, immediate, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "start" });
  }
  // Move focus for keyboard and screen-reader users without a second jump.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isFinePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
