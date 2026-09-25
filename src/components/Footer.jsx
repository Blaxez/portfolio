"use client";
import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { SITE } from "@/lib/site";
import { prefersReducedMotion, scrollToTarget } from "@/lib/scroll";

/** Closing frame: the beam sweeps across and signs the name at full width. */
export default function Footer() {
  const sigRef = useRef(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const el = sigRef.current;
    if (prefersReducedMotion()) {
      el.classList.add("is-signed");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-signed");
        io.disconnect();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="relative overflow-hidden bg-[var(--bg)] border-t border-[var(--line)]">
      <div className="max-w-screen-container layout-padding pt-10 md:pt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <p className="label">
            © {year} {SITE.name}
          </p>
          <ul className="flex flex-wrap gap-x-7 gap-y-2 md:justify-center">
            {SITE.socials.map((s) => (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="label link-u inline-flex min-h-11 items-center hover:text-[var(--fg)]">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#hero");
            }}
            className="group label inline-flex min-h-11 items-center gap-2 md:justify-self-end text-[var(--fg)]"
            data-magnetic="0.25"
          >
            <span className="link-u">Back to the top</span>
            <ArrowUp size={13} aria-hidden="true" className="transition-transform duration-500 group-hover:-translate-y-1" />
          </a>
        </div>
      </div>

      <div ref={sigRef} className="sig relative mt-10 md:mt-6 select-none" aria-hidden="true">
        <p className="sig-text serif whitespace-nowrap text-center leading-[0.8] tracking-[-0.045em] text-[var(--fg)]">
          Santosh <em>Maurya</em>
        </p>
        <span className="sig-line" />
      </div>
      <p className="max-w-screen-container layout-padding pb-10 pt-8 md:pt-10 text-center serif italic text-[var(--muted)] text-lg">
        “What falls, comes up even better.”
      </p>
    </footer>
  );
}
