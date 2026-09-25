"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./providers/ThemeProvider";
import LocalTime from "./ui/LocalTime";
import { SITE } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

const NAV_LINKS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Stack" },
  { id: "strengths", label: "Practice" },
  { id: "projects", label: "Work" },
  { id: "contact", label: "Contact" },
];

const ease = [0.76, 0, 0.24, 1];
const easeOut = [0.16, 1, 0.3, 1];

function ThemeGlyph({ dark }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="transition-transform duration-700" style={{ transform: `rotate(${dark ? 0 : 180}deg)` }}>
      <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M7 1a6 6 0 0 1 0 12z" fill="currentColor" />
    </svg>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  // Solid background once scrolled; hide on scroll-down, reveal on scroll-up.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden(y > 400 && y > lastY + 4);
        if (y < lastY - 4) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section for the desktop links.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Menu: lock scroll, Escape closes, focus moves in and is restored on close.
  useEffect(() => {
    if (!isOpen) return;
    const lenis = window.__lenis;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const toggle = toggleRef.current;
    const first = menuRef.current?.querySelector("a, button");
    first?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key !== "Tab" || !menuRef.current) return;
      const focusables = [...menuRef.current.querySelectorAll("a, button"), toggle].filter(Boolean);
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
      toggle?.focus();
    };
  }, [isOpen]);

  const go = (e, id) => {
    e.preventDefault();
    setIsOpen(false);
    // Wait for the menu to release the scroll lock before scrolling.
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  const overHero = !scrolled || isOpen;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="site-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)", transition: { duration: 0.85, ease } }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.6, ease } }}
            className="stage-dark fixed inset-0 z-[40] flex flex-col overflow-y-auto"
            data-lenis-prevent
          >
            <div className="max-w-screen-container layout-padding flex min-h-full flex-col pt-28 pb-10">
              <motion.div
                aria-hidden="true"
                className="h-px origin-left bg-[var(--beam)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1, transition: { delay: 0.25, duration: 1.1, ease } }}
              />
              <nav aria-label="Menu" className="flex flex-1 flex-col justify-center py-10">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((item, i) => (
                    <li key={item.id} className="overflow-hidden border-b border-[var(--line)]">
                      <motion.a
                        href={`#${item.id}`}
                        onClick={(e) => go(e, item.id)}
                        initial={{ y: "105%" }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.9, ease: easeOut }}
                        className="group flex items-baseline justify-between gap-6 py-3 md:py-4"
                      >
                        <span className="serif text-[3.2rem] leading-[1] tracking-[-0.03em] md:text-8xl transition-[color,transform] duration-500 group-hover:translate-x-3 group-hover:italic group-hover:text-[var(--signal)] group-focus-visible:italic">
                          {item.label}
                        </span>
                        <span className="index text-[var(--muted)]">({String(i + 1).padStart(2, "0")})</span>
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </nav>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.7 } }}
                className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
              >
                <a href={`mailto:${SITE.email}`} className="link-u is-static w-fit break-all text-[var(--fg)]">
                  {SITE.email}
                </a>
                <ul className="flex flex-wrap gap-x-7 gap-y-2">
                  {SITE.socials.map((s) => (
                    <li key={s.id}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="label link-u inline-flex min-h-11 items-center hover:text-[var(--fg)]">
                        {s.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: hidden && !isOpen ? -110 : 0 }}
        transition={{ duration: 0.7, ease }}
        className={`fixed top-0 inset-x-0 z-50 border-b transition-[background-color,border-color] duration-500 ${
          overHero ? "stage-dark !bg-transparent border-transparent" : "bg-[var(--bg)]/95 border-[var(--line)]"
        }`}
      >
        <div className="max-w-screen-container layout-padding flex h-[72px] items-center justify-between gap-6 md:h-20">
          <div className="flex items-baseline gap-6">
            <a href="#hero" onClick={(e) => go(e, "hero")} className="serif text-[1.4rem] leading-none tracking-[-0.01em] text-[var(--fg)]" data-magnetic="0.15">
              Santosh <em>Maurya</em>
            </a>
            <span className="label hidden xl:inline">
              {SITE.location.split(",")[0]} · <LocalTime withLabel={false} />
            </span>
          </div>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => go(e, item.id)}
                    aria-current={active === item.id ? "location" : undefined}
                    className="group relative inline-flex min-h-11 items-center text-[0.92rem] text-[var(--muted)] transition-colors hover:text-[var(--fg)] aria-[current]:text-[var(--fg)]"
                  >
                    {item.label}
                    <sup className="ml-0.5 -top-2 text-[0.6rem] tabular text-[var(--faint)] group-aria-[current]:text-[var(--signal)]">
                      {String(i + 1).padStart(2, "0")}
                    </sup>
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-3 bottom-2 h-px origin-left bg-[var(--beam)] transition-transform duration-700 ${
                        active === item.id ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="relative z-[60] inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[0.85rem] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              <ThemeGlyph dark={theme === "dark"} />
              <span className="hidden sm:inline" aria-hidden="true">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="site-menu"
              className="relative z-[60] inline-flex min-h-11 items-center gap-3 rounded-full border border-[var(--line-strong)] pl-4 pr-3.5 text-[0.85rem] text-[var(--fg)] transition-colors hover:border-[var(--fg)] lg:hidden"
            >
              <span aria-hidden="true">{isOpen ? "Close" : "Menu"}</span>
              <span aria-hidden="true" className="relative block h-2.5 w-4">
                <span className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ${isOpen ? "top-1/2 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 right-0 h-px bg-current transition-transform duration-500 ${isOpen ? "top-1/2 -rotate-45" : "bottom-0"}`} />
              </span>
            </button>
          </div>
        </div>
      </motion.header>
    </>
  );
}
