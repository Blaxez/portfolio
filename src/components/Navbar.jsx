'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from './providers/ThemeProvider';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#skills", label: "Skills" },
    { href: "#strengths", label: "Strengths" },
    { href: "#projects", label: "Projects" },
    { href: "#contact", label: "Contact" },
  ];

  const menuVariants = {
    closed: { y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
    open: { y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  };

  return (
    <>
      {/* Fullscreen Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 z-[40] flex flex-col justify-center px-6 md:px-20 overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #38bdf8, #3b82f6, #4f46e5)' }}
          >
            <div className="flex flex-col gap-2 min-h-full justify-center py-20">
              {navLinks.map((item, i) => (
                <div key={i} className="overflow-hidden group">
                  <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-4xl md:text-7xl font-black text-black uppercase tracking-tighter group-hover:text-white transition-colors block w-fit"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-10 left-6 md:left-20 flex gap-8 text-black font-mono text-sm uppercase tracking-widest pointer-events-none md:pointer-events-auto">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">GitHub</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">LinkedIn</a>
              <a href="https://wa.me/916394806825" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">WhatsApp</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Bar — exact FeeliFy layout */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        className="fixed top-0 w-full z-50 px-6 py-6 md:px-10 md:py-8 flex justify-between items-start pointer-events-none nav-bar-spacing"
      >
        {/* Left: Logo + Brand — mix-blend-difference for contrast */}
        <div className="flex items-center mix-blend-difference text-[var(--inverse)] pointer-events-auto" style={{ gap: '12px' }}>
          <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#3b82f6] flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
            SD
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none">
              SANTOSH.
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 leading-none">
              Developer
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle + Hamburger — exact FeeliFy sizing */}
        <div className="flex items-center pointer-events-auto" style={{ gap: '16px' }}>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors relative z-[60] bg-[var(--bg)] text-[var(--fg)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group flex items-center gap-4 cursor-pointer relative z-[60]"
            aria-label="Toggle menu"
          >
            <div className={`w-10 h-10 border rounded-full flex items-center justify-center transition-all ${
              isOpen
                ? "border-black text-black !bg-transparent"
                : "border-[var(--border)] text-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] bg-[var(--bg)]"
            }`}>
              {isOpen ? <X size={16} /> : <Menu size={16} />}
            </div>
          </button>
        </div>
      </motion.nav>
    </>
  );
}
