"use client";
import { useState, useEffect, useRef } from "react";

const SCRAMBLE_CHARS = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
const DECRYPT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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

  return <span>{display}</span>;
};

export const DecryptText = ({ text }) => {
  const [displayText, setDisplayText] = useState(text);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          setInView(true);
          let iterations = 0;
          const interval = setInterval(() => {
            setDisplayText(
              text
                .split("")
                .map((letter, index) => {
                  if (index < iterations) return text[index];
                  return DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
                })
                .join("")
            );
            if (iterations >= text.length) clearInterval(interval);
            iterations += 1 / 3;
          }, 30);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [text, inView]);

  return <span ref={ref}>{displayText}</span>;
};
