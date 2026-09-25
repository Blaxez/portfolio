import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import BrandTicker from "@/components/BrandTicker";
import WebGLFlowSection from "@/components/WebGLFlowSection";
import SystemMetrics from "@/components/SystemMetrics";
import ScrollHUD from "@/components/fx/ScrollHUD";
import MotionDirector from "@/components/fx/MotionDirector";
import BeamRail from "@/components/fx/BeamRail";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-[var(--fg)] px-5 py-3 text-sm text-[var(--bg)]"
      >
        Skip to content
      </a>
      <Preloader />
      <Navbar />
      <ScrollHUD />
      <main id="main">
        <Hero />
        {/* The laser hands off to this rail; everything after the hero hangs from it. */}
        <div className="relative">
          <BeamRail />
          <BrandTicker />
          <About />
          <Skills />
          <WebGLFlowSection />
          <Projects />
          <SystemMetrics />
          <Contact />
        </div>
      </main>
      <Footer />
      <MotionDirector />
    </>
  );
}
