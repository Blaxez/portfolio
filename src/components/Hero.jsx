import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import LaserFlow from '@/lib/LaserFlow';
import DotGridBackground from '@/lib/DotGridBackground';
import { getAssetPath } from '@/lib/assets';

export default function Hero() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !heroRef.current) return;

    const getVerticalSizing = () => {
      if (typeof window === 'undefined') return 3.0;
      const width = window.innerWidth || document.documentElement.clientWidth || 0;
      const minSize = 3.0;
      const maxSize = 8.0;
      const minWidth = 768;
      const maxWidth = 320;

      if (width >= minWidth) return minSize;
      if (width <= maxWidth) return maxSize;

      const t = (minWidth - width) / (minWidth - maxWidth);
      return minSize + t * (maxSize - minSize);
    };

    const getHorizontalSizing = () => {
        if (typeof window === 'undefined') return 1.4;
      const width = window.innerWidth || document.documentElement.clientWidth || 0;
      const minSize = 1.4;
      const maxSize = 2.2;
      const minWidth = 768;
      const maxWidth = 320;

      if (width >= minWidth) return minSize;
      if (width <= maxWidth) return maxSize;

      const t = (minWidth - width) / (minWidth - maxWidth);
      return minSize + t * (maxSize - minSize);
    };

    let laserFlow = new LaserFlow({
      container: containerRef.current,
      color: "#60a5fa",
      horizontalBeamOffset: 0.0,
      verticalBeamOffset: -0.5,
      verticalSizing: getVerticalSizing(),
      horizontalSizing: getHorizontalSizing(),
      fogIntensity: 0.65,
      wispDensity: 0.4,
      flowStrength: 0.58,
    });

    let resizeTimeout;
    const handleResize = () => {
        if (!laserFlow) return;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const nextV = getVerticalSizing();
          const nextH = getHorizontalSizing();
          if (typeof laserFlow.update === "function") {
            laserFlow.update({
              verticalSizing: nextV,
              horizontalSizing: nextH,
            });
          }
        }, 100);
      };
      
    window.addEventListener("resize", handleResize);

    // Dot Grid
    let dotGrid;
    if (heroRef.current) {
        dotGrid = new DotGridBackground({
          container: heroRef.current,
          dotSpacing: 8,
          baseRadius: 0.6,
          maxRadius: 1,
          influenceRadius: 560,
          baseOpacity: 0.0,
          maxOpacity: 0.8,
          color: "rgba(96, 165, 250, 1)", // matches #60a5fa
        });
    }

    return () => {
        window.removeEventListener("resize", handleResize);
        if (laserFlow) laserFlow.destroy();
        if (dotGrid) dotGrid.destroy();
    };
  }, []);

  const mascotRef = useRef(null);
  const letterRef = useRef(null);

      const getLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

      getLayoutEffect(() => {
          const updateMascotPosition = () => {
          const mascot = mascotRef.current;
          const letter = letterRef.current;
          if (!mascot || !letter) return;

          // Get rectangles
          const letterRect = letter.getBoundingClientRect();
          const mascotRect = mascot.getBoundingClientRect();
          
          // Calculate position relative to the offsetParent (.hero-layout-left)
          const parent = mascot.offsetParent;
          if (!parent) return;
          const parentRect = parent.getBoundingClientRect();

          // Calculate relative coordinates
          const relativeLeft = letterRect.left - parentRect.left;
          const relativeTop = letterRect.top - parentRect.top;

          // Account for letter-spacing in the Right Edge calculation
          const computedStyle = window.getComputedStyle(letter);
          const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0;

          // GSAP Positioning
          // Anchor: Top-Right edge of 'H' (minus spacing)
          // Mascot "Sit Point" is at X: 65% (width), Y: 88% (height due to 12% overlap)
          // Update: Increased sit depth to 22% (0.22) to account for square PNG whitespace
          
          const overlapY = mascotRect.height * 0.27; 
          // We want the Right Edge of the GLYPH, not the box (which has spacing)
          const anchorX = relativeLeft + letterRect.width - letterSpacing * 2; 
          
          gsap.set(mascot, {
              left: anchorX - (mascotRect.width * 0.65),
              top: relativeTop - mascotRect.height + overlapY,
              scale: 1,
              transformOrigin: "65% 88%",
              overwrite: "auto" // Ensure no conflict
          });
      };

      // Initial update
      const timeoutId = setTimeout(updateMascotPosition, 100);

      // Listeners
      window.addEventListener('resize', updateMascotPosition);
      
      const resizeObserver = new ResizeObserver(updateMascotPosition);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (mascotRef.current) resizeObserver.observe(mascotRef.current);

      return () => {
          window.removeEventListener('resize', updateMascotPosition);
          resizeObserver.disconnect();
          clearTimeout(timeoutId);
      };
  }, []);

    // ... existing scroll logic ...
    const scrollToContact = () => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    };
  
    return (
      <div className="hero-content" id="hero" ref={heroRef}>
        <div id="laser-container" ref={containerRef}></div>
        <div className="hero-layout">
          <div className="hero-layout-left">
            <div className="hero-mascot" ref={mascotRef}>
                <Image 
                  src={getAssetPath("/assets/mascott-v2.png")} 
                  alt="Mascot" 
                  width={420} 
                  height={420} 
                  priority
                  className="object-contain"
                  onLoad={(e) => {
                      // Trigger update when loaded
                      const target = e.target;
                      if(target) target.dispatchEvent(new Event('resize')); 
                  }}
                />
            </div>
            <h1>
                Santos<span ref={letterRef} style={{ display: 'inline-block' }}>h</span> Maurya
            </h1>
          </div>
          <div className="hero-layout-right">
            <p>
              Full‑Stack Developer | AI &amp; ML Innovator | Game Developer. A
            seasoned computer science professional with over four years of
            hands‑on experience in full‑stack web development, game development,
            and applied AI/ML. Adept at leading teams through rapid prototyping
            cycles, architecting scalable web applications, and designing
            intelligent systems.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary" type="button">
              <span className="btn-primary-inner-glow"></span>
              <span className="btn-primary-surface"></span>
              <span className="btn-label">Get in Touch</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={scrollToContact}
              type="button"
            >
              <span className="btn-label">Download CV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
