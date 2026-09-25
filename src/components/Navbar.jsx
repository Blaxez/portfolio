"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "./providers/ThemeProvider";
import { SITE } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

const NAV_LINKS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "strengths", label: "Strengths" },
  { id: "projects", label: "Work" },
  { id: "contact", label: "Contact" },
];

const ease = [0.76, 0, 0.24, 1];

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

  const overHero = !scrolled && !isOpen;

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
            animate={{ clipPath: "inset(0 0 0% 0)", transition: { duration: 0.8, ease } }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.6, ease } }}
            className="fixed inset-0 z-[40] flex flex-col justify-center px-6 md:px-20 overflow-y-auto"
            style={{ background: "linear-gradient(135deg, #ff9a5c, #ff5b22 50%, #d9381a)" }}
            data-lenis-prevent
          >
            <nav aria-label="Menu" className="flex flex-col gap-1 min-h-full justify-center py-24">
              {NAV_LINKS.map((item, i) => (
                <div key={item.id} className="overflow-hidden">
                  <motion.a
                    href={`#${item.id}`}
                    onClick={(e) => go(e, item.id)}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease }}
                    className="group flex items-baseline gap-4 w-fit text-5xl md:text-8xl font-black text-black uppercase tracking-tighter"
                  >
                    <span className="font-mono text-xs md:text-sm tracking-widest text-black/60">0{i + 1}</span>
                    <span className="transition-transform duration-500 group-hover:translate-x-4 group-hover:text-white group-focus-visible:text-white">
                      {item.label}
                    </span>
                  </motion.a>
                </div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.7 } }}
              className="absolute bottom-10 left-6 md:left-20 right-6 flex flex-wrap gap-x-8 gap-y-3 text-black font-mono text-sm uppercase tracking-widest"
            >
              {SITE.socials.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 inline-flex items-center hover:text-white transition-colors"
                >
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: hidden && !isOpen ? -110 : 0 }}
        transition={{ duration: 0.6, ease }}
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color] duration-500 border-b ${
          overHero ? "stage-dark !bg-transparent border-transparent" : "border-[var(--border)]"
        } ${scrolled && !isOpen ? "bg-[var(--bg)]/95" : ""}`}
      >
        <div className="max-w-screen-container nav-bar-spacing flex justify-between items-center gap-6">
          <a
            href="#hero"
            onClick={(e) => go(e, "hero")}
            className={`flex items-center gap-3 ${isOpen ? "text-black" : "text-[var(--fg)]"}`}
            data-magnetic="0.2"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[#ff9a5c] to-[#d9381a] flex items-center justify-center text-xs font-bold text-[#0b0a09] shadow-[0_10px_30px_-10px_rgba(255,91,34,0.7)] flex-shrink-0"
            >
              {SITE.monogram}
            </span>
            <span className="flex flex-col">
              <span className="text-base md:text-lg font-black tracking-tight leading-none uppercase">{SITE.name}</span>
              <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest opacity-70 leading-none mt-1">
                Full-Stack · AI/ML · Games
              </span>
            </span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => go(e, item.id)}
                    aria-current={active === item.id ? "location" : undefined}
                    className="relative px-4 py-3 font-mono text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--fg)] aria-[current]:text-[var(--fg)] transition-colors"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute left-4 right-4 bottom-1.5 h-px bg-[var(--acc)] origin-left transition-transform duration-500 ${
                        active === item.id ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-11 h-11 border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors relative z-[60] bg-[var(--bg)]/80 text-[var(--fg)]"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="site-menu"
              className={`lg:hidden w-11 h-11 border rounded-full flex items-center justify-center transition-colors relative z-[60] ${
                isOpen
                  ? "border-black text-black bg-transparent"
                  : "border-[var(--border)] text-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] bg-[var(--bg)]/80"
              }`}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>
    </>
  );
}
