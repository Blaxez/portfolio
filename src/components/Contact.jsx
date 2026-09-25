"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, ArrowUpRight, Github, Linkedin, Twitter, Instagram } from "lucide-react";

const SOCIALS = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    detail: "santoshmaurya0606200@gmail.com",
    action: "Send Mail",
    href: "mailto:santoshmaurya0606200@gmail.com",
    external: false,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    detail: "Santosh Maurya",
    action: "Open Profile",
    href: "https://www.linkedin.com/in/santosh-maurya-a92988258",
    external: true,
  },
  {
    id: "github",
    label: "GitHub",
    icon: Github,
    detail: "@blaxezcode",
    action: "View Repos",
    href: "https://github.com/blaxezcode",
    external: true,
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    detail: "Mumbai, India",
    action: null,
    href: null,
    external: false,
  },
];

const HolographicCard = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live Local Time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("santoshmaurya0606200@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full max-w-md mx-auto mt-12 lg:mt-0 lg:ml-auto"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition({ x: 0, y: 0 });
        }}
        animate={{
          rotateY: isHovered ? mousePosition.x * 20 : 0,
          rotateX: isHovered ? -mousePosition.y * 20 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Holographic Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: `radial-gradient(circle at ${50 + mousePosition.x * 100}% ${50 + mousePosition.y * 100}%, rgba(var(--acc-rgb), 0.15), transparent 60%)`
          }}
        />

        {/* Card Content */}
        <div className="relative z-10 h-full p-8 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
          
          {/* Header: Identity & Status */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-[var(--fg)] tracking-tight">SANTOSH MAURYA</h3>
              <p className="text-sm font-mono text-[var(--acc)] opacity-80 mt-1">Full Stack Developer</p>
            </div>
            <div className="flex flex-col items-end gap-1">
               <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-[var(--acc)]/10 border border-[var(--acc)]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-mono text-[var(--fg)] uppercase tracking-wider">Available</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--fg)] opacity-50">{currentTime} IST</span>
            </div>
          </div>

          {/* Middle: Connection Details */}
          <div className="space-y-4">
            {/* Email - Click to Copy */}
            <button 
              onClick={copyEmail}
              className="group w-full flex items-center justify-between p-3 rounded-lg bg-[var(--bg)]/50 border border-[var(--border)] hover:border-[var(--acc)] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--acc)]/10 text-[var(--acc)]">
                  <Mail size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-[var(--fg)] opacity-50 uppercase tracking-widest">Email</p>
                  <p className="text-xs font-mono text-[var(--fg)]">santoshmaurya0606200@gmail.com</p>
                </div>
              </div>
              <span className="text-[10px] text-[var(--acc)] opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? "COPIED!" : "COPY"}
              </span>
            </button>

            {/* Location */}
            <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--bg)]/50 border border-[var(--border)]">
              <div className="p-2 rounded bg-[var(--acc)]/10 text-[var(--acc)]">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[var(--fg)] opacity-50 uppercase tracking-widest">Base</p>
                <p className="text-xs font-mono text-[var(--fg)]">Mumbai, India</p>
              </div>
            </div>
          </div>

          {/* Footer: Social Dock */}
          <div className="flex items-center gap-4 pt-4 border-t border-[var(--border)]/50">
             <a href="https://github.com/blaxezcode" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--acc)] hover:text-white transition-all hover:scale-110">
              <Github size={18} />
            </a>
            <a href="https://www.linkedin.com/in/santosh-maurya-a92988258" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--acc)] hover:text-white transition-all hover:scale-110">
              <Linkedin size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--acc)] hover:text-white transition-all hover:scale-110">
              <Twitter size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[var(--bg)] hover:bg-[var(--acc)] hover:text-white transition-all hover:scale-110">
              <Instagram size={18} />
            </a>
            <div className="ml-auto text-[10px] font-mono text-[var(--fg)] opacity-40">
              ID: 884-299
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Contact() {
  return (
    <footer
      id="contact"
      className="min-h-screen flex flex-col justify-between pt-10 md:pt-16 pb-12 px-6 md:px-12 bg-[var(--surface)] relative z-10 w-full overflow-hidden border-t border-[var(--border)] transition-colors duration-700"
    >
      <div className="z-10 relative mb-12 md:mb-20 w-full max-w-[95vw] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 lg:gap-32">
          {/* Left Column: Info */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-3xl"
          >
            <div className="mb-16">
              <h4 className="font-mono text-sm text-[var(--acc)] uppercase tracking-widest mb-6">
                Get In Touch
              </h4>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-[var(--fg)] mb-8 leading-[0.9] tracking-tighter uppercase transition-colors">
                Let&apos;s build
                <br />
                <span className="text-[var(--acc)]">the future.</span>
              </h2>
              <p className="text-xl md:text-2xl text-[var(--fg)] opacity-60 leading-relaxed font-light max-w-xl transition-colors">
                From concept to code, I engineer digital experiences that
                matter. Have a project in mind? Drop me a line.
              </p>
            </div>

            <div className="mt-16 lg:mt-0 w-full flex justify-center lg:justify-end">
              <HolographicCard />
            </div>
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex-1 w-full max-w-xl"
          >
            <form
              className="space-y-12"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="space-y-8">
                <div className="group relative">
                  <input
                    type="text"
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-[var(--border)] py-4 text-xl text-[var(--fg)] focus:outline-none focus:border-[var(--acc)] transition-colors"
                  />
                  <label className="absolute left-0 top-4 text-[var(--fg)] opacity-40 font-mono text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:opacity-100 peer-focus:text-[var(--acc)] peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:opacity-100">
                    Your Name
                  </label>
                </div>

                <div className="group relative">
                  <input
                    type="email"
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-[var(--border)] py-4 text-xl text-[var(--fg)] focus:outline-none focus:border-[var(--acc)] transition-colors"
                  />
                  <label className="absolute left-0 top-4 text-[var(--fg)] opacity-40 font-mono text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:opacity-100 peer-focus:text-[var(--acc)] peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:opacity-100">
                    Email Address
                  </label>
                </div>

                <div className="group relative">
                  <input
                    type="tel"
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-[var(--border)] py-4 text-xl text-[var(--fg)] focus:outline-none focus:border-[var(--acc)] transition-colors"
                  />
                  <label className="absolute left-0 top-4 text-[var(--fg)] opacity-40 font-mono text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:opacity-100 peer-focus:text-[var(--acc)] peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:opacity-100">
                    Phone Number
                  </label>
                </div>

                <div className="group relative">
                  <textarea
                    rows={4}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-[var(--border)] py-4 text-xl text-[var(--fg)] focus:outline-none focus:border-[var(--acc)] transition-colors resize-none"
                  ></textarea>
                  <label className="absolute left-0 top-4 text-[var(--fg)] opacity-40 font-mono text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:opacity-100 peer-focus:text-[var(--acc)] peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:opacity-100">
                    Your Message
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-12 py-5 bg-[var(--acc)] text-black font-black uppercase tracking-widest hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors duration-300 transform hover:-translate-y-1"
                >
                  Send Message
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center items-center pt-10 border-t border-[var(--border)]">
        <p className="font-mono text-xs uppercase tracking-widest opacity-40 text-[var(--fg)] text-center">
          © 2025 Santosh Maurya.
          <br />
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}
