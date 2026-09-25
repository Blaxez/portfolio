"use client";
import { useEffect, useState } from "react";
import { fetchAllProjects } from "@/services/githubService";

/**
 * Curated GitHub projects. No invented fallback: while loading the UI shows
 * skeletons, and on failure it shows links to the GitHub profiles instead.
 */
export function useProjects() {
  const [state, setState] = useState({ projects: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    fetchAllProjects(controller.signal)
      .then((projects) => setState({ projects, loading: false, error: null }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setState({ projects: [], loading: false, error: err?.message || "Couldn't load projects." });
      });
    return () => controller.abort();
  }, []);

  return state;
}
