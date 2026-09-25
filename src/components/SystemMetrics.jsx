"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Globe, Activity, Cpu, Zap } from "lucide-react";

/* --- Globe3D --- */
const Globe3D = () => {
  const canvasRef = useRef(null);
  const observerRef = useRef(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.offsetWidth || 300);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 300);
    let rotation = 0;
    const dots = [];
    const numDots = 150;
    for (let i = 0; i < numDots; i++) {
      const phi = Math.acos(-1 + (2 * i) / numDots);
      const theta = Math.sqrt(numDots * Math.PI) * phi;
      dots.push({ x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi) });
    }

    let animId;
    const render = () => {
      if (!isVisibleRef.current) return;
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 120);
      grad.addColorStop(0, "rgba(96, 165, 250, 0.05)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      rotation += 0.005;
      const cx = width/2, cy = height/2, scale = Math.min(width, height) * 0.35;
      const projected = dots.map(d => {
        const x = d.x * Math.cos(rotation) - d.z * Math.sin(rotation);
        const z = d.z * Math.cos(rotation) + d.x * Math.sin(rotation);
        return { x, y: d.y, z };
      });
      projected.forEach(p => {
        const alpha = (p.z + 1) / 2;
        if (p.z > -0.5) {
          const size = 1 + alpha * 1.5;
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha * 0.8})`;
          ctx.beginPath(); ctx.arc(cx + p.x * scale, cy + p.y * scale, size, 0, Math.PI * 2); ctx.fill();
        }
      });
      animId = requestAnimationFrame(render);
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) { cancelAnimationFrame(animId); render(); }
      else cancelAnimationFrame(animId);
    }, { threshold: 0.1 });
    if (canvas) observerRef.current.observe(canvas);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || 300;
      height = canvas.height = canvas.parentElement?.offsetHeight || 300;
    };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); cancelAnimationFrame(animId); observerRef.current?.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="w-full h-full" />;
};

/* --- GrowthGraph (Live Ticker) --- */
const GrowthGraph = () => {
  const canvasRef = useRef(null);
  const observerRef = useRef(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.offsetWidth || 300);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 300);

    // Config
    const HISTORY_SIZE = 30; // Number of points visible
    const UPDATE_INTERVAL = 2000; // ms between new points
    
    // State — start low and always trend upward
    let data = [];
    for (let i = 0; i < HISTORY_SIZE; i++) {
        const t = i / (HISTORY_SIZE - 1);
        const base = 0.15 + t * 0.3; 
        const noise = (Math.random() - 0.5) * 0.08;
        data.push(Math.max(0.1, Math.min(0.5, base + noise)));
    }
    
    // "Live" point that interpolates
    let currentVal = data[data.length - 1];
    let targetVal = currentVal;
    let lastUpdateTime = 0;

    let animId;
    const render = (timestamp) => {
      if (!isVisibleRef.current) return;
      if (!lastUpdateTime) lastUpdateTime = timestamp;

      // Update Logic: Every interval, shift and add new target
      if (timestamp - lastUpdateTime > UPDATE_INTERVAL) {
        lastUpdateTime = timestamp;
        // Shift history
        data.push(currentVal); 
        if (data.length > HISTORY_SIZE) data.shift();
        
        // Always-upward growth with small jitter
        const upwardBias = 0.03;
        const jitter = (Math.random() - 0.35) * 0.08; // slightly biased positive
        let next = currentVal + upwardBias + jitter;

        // When near the top, smoothly reset to create a new growth cycle
        if (next > 0.9) {
          next = 0.15 + Math.random() * 0.1;
          // Reset history to start a fresh climb
          for (let i = 0; i < data.length; i++) {
            const t = i / (data.length - 1);
            data[i] = next + t * 0.05 + (Math.random() - 0.5) * 0.04;
          }
        }

        next = Math.max(0.1, Math.min(0.95, next));
        targetVal = next;
      }

      // Interpolate currentVal towards targetVal (smooth ease)
      currentVal += (targetVal - currentVal) * 0.05;

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Centering config
      const paddingX = width * 0.15; // 15% padding L/R
      const paddingY = height * 0.2; // 20% padding T/B
      const graphW = width - paddingX * 2;
      const graphH = height - paddingY * 2;
      
      const getY = (v) => (height - paddingY) - (v * graphH);
      const getX = (i) => paddingX + (i / (HISTORY_SIZE - 1)) * graphW;

      // 1. Def gradient area
      ctx.beginPath();
      ctx.moveTo(getX(0), height);
      
      // Draw history
      for (let i = 0; i < data.length; i++) {
         ctx.lineTo(getX(i), getY(data[i]));
      }
      // Draw live tip (extended slightly beyond last history point? No, replace last?)
      // Actually, let's say 'data' is the committed history. 
      // We render data[0]..data[last] AND a "live" point at index length? 
      // Simpler: 'data' is points 0..N-1. 'currentVal' is point N.
      // So total points N+1. 
      // But we want fixed width. Let's make data[last] be the live one.
      // So we overwrite last point with currentVal for rendering.
      
      // Let's go with: data has HISTORY_SIZE points. The LAST point is the live one.
      // In update logic above, we pushed `currentVal` (the finalized value of prev step) and shifted.
      // Then `data[last]` is the one we are modifying? 
      // Actually simpler: Just render `data` points 0..N-2, and use `currentVal` as point N-1.
      

      
      // Construct render points
      const points = [...data];
      points[points.length - 1] = currentVal; // overwrite last with live value
      
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i < points.length; i++) {
          ctx.lineTo(getX(i), getY(points[i]));
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(96, 165, 250, 0.25)");
      grad.addColorStop(1, "rgba(96, 165, 250, 0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Stroke
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
          const px = getX(i);
          const py = getY(points[i]);
          
          if (i === 0) ctx.moveTo(px, py);
          else {
              // Smooth curve? or straight lines?
              // Stock charts usually straight lines or slight curve. 
              // Straight is sharper/more "tech".
              ctx.lineTo(px, py);
          }
      }
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#60a5fa"; // var(--acc) likely blue/cyan
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Tip Dot (Pulsing)
      const tipX = getX(points.length - 1);
      const tipY = getY(points[points.length - 1]);
      
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      
      // Ping
      const pulse = (Math.sin(timestamp * 0.008) + 1) * 0.5; // 0..1
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - pulse * 0.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
         if (!animId) animId = requestAnimationFrame(render);
      } else {
         cancelAnimationFrame(animId);
         animId = null;
      }
    }, { threshold: 0.1 });
    
    if (canvas) observerRef.current.observe(canvas);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || 300;
      height = canvas.height = canvas.parentElement?.offsetHeight || 300;
    };
    window.addEventListener("resize", handleResize);
    
    return () => { 
        window.removeEventListener("resize", handleResize); 
        cancelAnimationFrame(animId); 
        observerRef.current?.disconnect(); 
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

/* --- RotatingQuote --- */
const QUOTES = [
  "What falls, comes up even better.",
  "Code is poetry written in logic.",
  "Ship it, then iterate.",
  "Every bug is a lesson in disguise.",
  "Stay hungry, stay foolish.",
  "Build things that matter.",
  "Simplicity is the ultimate sophistication.",
  "First, solve the problem. Then, write the code.",
  "Progress, not perfection.",
  "The best error message is the one that never shows up.",
  "Dream big. Start small. Act now.",
  "Make it work, make it right, make it fast.",
  "Your only limit is your imagination.",
  "Consistency beats intensity.",
  "Turn setbacks into comebacks.",
  "Learn, build, break, repeat.",
  "Great things never come from comfort zones.",
  "Think twice, code once.",
  "Fall seven times, stand up eight.",
  "The future belongs to the curious.",
];

const RotatingQuote = () => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const pickQuote = () => {
      const now = new Date();
      const index = (now.getHours() + now.getDate()) % QUOTES.length;
      setQuote(QUOTES[index]);
    };
    pickQuote();

    // Check for hour change every minute
    const interval = setInterval(pickQuote, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.p
      key={quote}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="font-mono text-[10px] text-[var(--acc)] opacity-70 mt-2 italic leading-relaxed"
    >
      &ldquo;{quote}&rdquo;
    </motion.p>
  );
};

/* --- TerminalLog --- */
const TerminalLog = () => {
  const [lines, setLines] = useState([{ text: "> init_portfolio", status: "", id: 0 }]);
  useEffect(() => {
    const sequence = [
      { text: "> loading_skills...", status: "OK" },
      { text: "> compiling_projects...", status: "..." },
      { text: "> optimizing_perf...", status: "OK" },
      { text: "> deploying_v2.0", status: "" },
      { text: "> running_ai_models...", status: "..." },
      { text: "> status: all_go", status: "100%" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLines((prev) => {
        const newLines = [...prev, { ...sequence[i % sequence.length], id: Date.now() }];
        if (newLines.length > 7) newLines.shift();
        return newLines;
      });
      i++;
    }, 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="font-mono text-[9px] md:text-[10px] space-y-1 h-full flex flex-col justify-end text-[var(--fg)] opacity-80">
      {lines.map((l) => (
        <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
          <span className="truncate">{l.text}</span>
          {l.status && <span className="text-[var(--acc)] flex-shrink-0">{l.status}</span>}
        </motion.div>
      ))}
    </div>
  );
};

/* --- SystemMetrics Main --- */
export default function SystemMetrics() {
  return (
    <section className="py-10 md:py-16 border-y border-[var(--border)] bg-[var(--bg)] transition-colors duration-500">
      <div className="max-w-screen-container layout-padding grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* GLOBAL */}
        <div className="min-h-[350px] relative overflow-hidden group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--acc)] transition-all duration-300 flex flex-col justify-between">
          <div className="absolute inset-0 z-0 pointer-events-none"><Globe3D /></div>
          <div className="relative z-10 p-6 h-full flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start">
              <Globe className="text-[var(--acc)] animate-pulse" size={20} />
              <span className="font-mono text-xs text-[var(--fg)] opacity-50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">NETWORK</span>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-[var(--fg)] leading-tight tracking-tight">GLOBAL</h3>
              <p className="font-mono text-[10px] text-[var(--fg)] opacity-70 bg-black/40 inline-block backdrop-blur-sm p-2 rounded border border-white/10 leading-relaxed">
                Reach: Worldwide<br />Impact: Open Source
              </p>
            </div>
          </div>
        </div>

        {/* GROWTH */}
        <div className="min-h-[350px] p-6 relative overflow-hidden group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--acc)] transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start relative z-10">
            <Activity className="text-[var(--acc)]" size={20} />
            <span className="font-mono text-xs text-[var(--fg)] opacity-50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">GROWTH</span>
          </div>
          <div className="absolute inset-0 z-0 opacity-60 pointer-events-none"><GrowthGraph /></div>
          <div className="relative z-10 pt-4 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/80 to-transparent p-4 -mx-4 -mb-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-3xl font-black text-[var(--fg)] leading-tight">4+</h3>
                <p className="font-mono text-xs text-[var(--fg)] opacity-60 mt-2">Years Experience</p>
              </div>
              <div className="w-2 h-2 bg-[var(--acc)] rounded-full animate-ping mb-2" />
            </div>
            <RotatingQuote />
          </div>
        </div>

        {/* EXECUTION */}
        <div className="min-h-[350px] p-6 relative overflow-hidden group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--acc)] transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <Cpu className="text-[var(--acc)]" size={20} />
            <span className="font-mono text-xs text-[var(--fg)] opacity-50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">EXECUTION</span>
          </div>
          <div className="h-32 overflow-hidden mb-4 relative font-mono text-[10px] opacity-70"><TerminalLog /></div>
          <div className="relative z-10 border-t border-[var(--border)] pt-4">
            <h3 className="text-3xl font-black text-[var(--fg)] mb-3 leading-tight">Fast</h3>
            <p className="font-mono text-xs text-[var(--fg)] opacity-60 leading-relaxed">Rapid Prototyping<br />Ship It Quick</p>
          </div>
        </div>

        {/* AVAILABLE */}
        <div className="min-h-[350px] p-6 relative overflow-hidden group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--acc)] transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Zap className="text-[var(--acc)]" size={20} />
            <span className="font-mono text-xs text-[var(--fg)] opacity-50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/10">STATUS</span>
          </div>
          <div className="text-right mt-auto">
            <h3 className="text-[5rem] lg:text-[6rem] leading-none font-black text-[var(--acc)] tracking-tighter">
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                24/7
              </motion.span>
            </h3>
            <p className="font-mono text-xs text-[var(--fg)] opacity-60 mt-4 leading-relaxed">
              Available for Freelance<br />& Collaboration
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
