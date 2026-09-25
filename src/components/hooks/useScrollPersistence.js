"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const ScrollPersistence = () => {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const storedScroll = sessionStorage.getItem(`scrollPos:${pathname}`);
    if (storedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(storedScroll));
      }, 100);
    }

    const handleScroll = () => {
      sessionStorage.setItem(
        `scrollPos:${pathname}`,
        window.scrollY.toString(),
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return null;
};
