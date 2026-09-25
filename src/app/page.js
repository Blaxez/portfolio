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
import ScrollHUD from "@/components/fx/ScrollHUD";
import MotionDirector from "@/components/fx/MotionDirector";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-[var(--acc)] px-5 py-3 font-mono text-xs uppercase tracking-widest text-white"
      >
        Skip to content
      </a>
      <Preloader />
      <Navbar />
      <ScrollHUD />
      <main id="main">
        <Hero />
        <BrandTicker />
        <About />
        <Skills />
        <WebGLFlowSection />
        <Projects />
        <SystemMetrics />
        <Contact />
      </main>
      <MotionDirector />
    </>
  );
}
