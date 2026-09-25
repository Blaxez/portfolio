"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);

/** The pre-paint script in layout.js sets the initial class; this keeps React in sync with it. */
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the class the pre-paint script chose
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = useCallback((next) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
    setThemeState(next);
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
