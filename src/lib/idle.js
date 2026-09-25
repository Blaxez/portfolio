/**
 * Run non-critical work (WebGL scenes, scroll choreography) only after the
 * first contentful paint has been presented and the main thread is idle,
 * so headline text always paints first. Returns a cancel function.
 */
export function afterFirstPaint(cb, { timeout = 2500 } = {}) {
  let done = false;
  let observer;
  const fallback = window.setTimeout(() => run(), timeout);

  function run() {
    if (done) return;
    done = true;
    window.clearTimeout(fallback);
    observer?.disconnect();
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => cb(), { timeout: 1200 });
    else window.setTimeout(cb, 1);
  }

  const P = window.PerformanceObserver;
  if (P?.supportedEntryTypes?.includes("paint")) {
    observer = new P((list) => {
      if (list.getEntriesByName("first-contentful-paint").length) run();
    });
    observer.observe({ type: "paint", buffered: true });
  } else {
    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  return () => {
    done = true;
    window.clearTimeout(fallback);
    observer?.disconnect();
  };
}
