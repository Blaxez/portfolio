import Choreography from "@/components/motion/Choreography";
import ViewportObserver from "@/components/motion/ViewportObserver";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Craft from "@/components/sections/Craft";
import Hero from "@/components/sections/Hero";
import SiteHeader from "@/components/sections/SiteHeader";
import Work from "@/components/sections/Work";
import Stage3D from "@/components/stage/Stage3D";

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link t-label">
        Skip to content
      </a>
      <SiteHeader />
      <Stage3D />
      <main id="main" className="relative z-10">
        <Hero />
        <Craft />
        <About />
        <Work />
        <Contact />
      </main>
      <ViewportObserver />
      <Choreography />
    </>
  );
}
