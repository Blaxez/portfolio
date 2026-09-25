"use client";
import { useState, useEffect } from "react";

const SCRAMBLE_CHARS = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

export const ScrambleText = ({ text, active }) => {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) {
      // Use a microtask to avoid the "synchronous setState in effect" lint
      const id = requestAnimationFrame(() => setDisplay(text));
      return () => cancelAnimationFrame(id);
    }
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) return text[index];
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 0.5;
    }, 30);
    return () => clearInterval(interval);
  }, [active, text]);

  // Scrambled glyphs are visual only; assistive tech gets the real word.
  return (
    <>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </>
  );
};
