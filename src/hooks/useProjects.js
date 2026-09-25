"use client";
import { useState, useEffect, useRef } from "react";
import { fetchAllProjects } from "@/services/githubService";

/** Fallback projects shown while loading or on error */
const FALLBACK_PROJECTS = [
  {
    title: "AI Chat App",
    cat: "Full-Stack",
    img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "3D Game Engine",
    cat: "WebGL",
    img: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "E-Commerce",
    cat: "Next.js",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "ML Pipeline",
    cat: "Python",
    img: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "DevStudio IDE",
    cat: "Creative",
    img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop",
  },
  {
    title: "Portfolio Site",
    cat: "Design",
    img: "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2664&auto=format&fit=crop",
  },
];

/**
 * Custom hook to fetch and provide GitHub projects.
 * Returns { projects, loading, error }.
 */
export function useProjects() {
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    let cancelled = false;

    fetchAllProjects()
      .then((data) => {
        if (cancelled) return;
        setProjects(data.length > 0 ? data : FALLBACK_PROJECTS);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch GitHub projects:", err);
        setError(err.message || "Failed to load projects.");
        setProjects(FALLBACK_PROJECTS);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading, error };
}
