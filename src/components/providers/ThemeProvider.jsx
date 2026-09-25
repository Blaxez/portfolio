"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const ThemeContext = createContext(undefined);

const THEMES = {
  dark: {
    "--bg": "#050505",
    "--fg": "#E1E1E1",
    "--acc": "#60a5fa",
    "--surface": "#000000",
    "--border": "rgba(255,255,255,0.15)",
    "--inverse": "#ffffff",
  },
  light: {
    "--bg": "#E6E6E6",
    "--fg": "#050505",
    "--acc": "#3b82f6",
    "--surface": "#F5F5F5",
    "--border": "rgba(0,0,0,0.1)",
    "--inverse": "#000000",
  },
};

export const ThemeProvider = ({ children }) => {
  // Initialize state lazily to avoid hydration mismatch and effect warnings
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    } else {
      setThemeState("light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    const currentTheme = THEMES[theme];
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
