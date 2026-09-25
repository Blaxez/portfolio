"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Preloader({ onComplete }) {
  const [count, setCount] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    let frame;
    let current = 0;

    const tick = () => {
      current = Math.min(current + Math.floor(Math.random() * 8) + 2, 100);
      setCount(current);

      if (current >= 100) {
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(() => {
            onComplete();
          }, 600);
        }
        return;
      }
      frame = setTimeout(tick, 80 + Math.random() * 60);
    };

    frame = setTimeout(tick, 200);
    return () => clearTimeout(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{
        y: "-100%",
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
      }}
      className="fixed inset-0 z-[99999] flex flex-col justify-between p-8 md:p-12 font-bold"
      style={{ background: "linear-gradient(135deg, #38bdf8, #3b82f6, #4f46e5)" }}
    >
      <div className="flex justify-between items-start w-full text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold backdrop-blur-sm">
            SD
          </div>
          <span className="tracking-tighter font-black text-lg">SANTOSH.DEV</span>
        </div>
        <span className="font-mono text-sm uppercase tracking-widest opacity-80">
          INITIALIZING...
        </span>
      </div>
      <div className="text-[20vw] leading-none tracking-tighter text-white">
        {count}%
      </div>
    </motion.div>
  );
}
