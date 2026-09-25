"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Preloader from "@/components/Preloader";
import BrandTicker from "@/components/BrandTicker";
import WebGLFlowSection from "@/components/WebGLFlowSection";
import SystemMetrics from "@/components/SystemMetrics";

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      {/* Preloader — always rendered, animates itself out */}
      <AnimatePresence>
        {showPreloader && (
          <Preloader
            key="preloader"
            onComplete={() => setShowPreloader(false)}
          />
        )}
      </AnimatePresence>

      {/* Site content — always mounted, hidden behind preloader initially */}
      <div style={{ visibility: showPreloader ? "hidden" : "visible" }}>
        <Navbar />
        <main>
          <Hero />
          <BrandTicker />
          <About />
          <Skills />
          <WebGLFlowSection />
          <Projects />
          <SystemMetrics />
          <Contact />
        </main>
      </div>
    </>
  );
}
