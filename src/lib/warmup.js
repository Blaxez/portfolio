import { afterFirstPaint } from "./idle";

/**
 * Idle-time warm-up for heavy scenes (WebGL contexts, geometry, shader
 * compiles). Creating them while the visitor is still reading the hero means
 * scrolling never pays for it; each task gets its own idle slot. Callers keep
 * an IntersectionObserver as a fallback in case the visitor gets there first.
 * Returns a cancel function.
 */
const queue = [];
let started = false;

const idle = (cb) => (window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 200));

function pump() {
  const task = queue.shift();
  if (!task) return;
  if (!task.cancelled) task.run();
  // Leave a gap so one scene's compile can finish before the next starts.
  window.setTimeout(() => idle(pump), 350);
}

export function warmup(run) {
  const task = { run, cancelled: false };
  queue.push(task);
  if (!started) {
    started = true;
    afterFirstPaint(() => window.setTimeout(() => idle(pump), 1200), { timeout: 4000 });
  }
  return () => {
    task.cancelled = true;
  };
}
