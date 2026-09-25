"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { ScrambleText } from "./TextEffects";

export default function About() {
  const [activeItem, setActiveItem] = useState(null);

  const capabilities = [
    {
      id: "01",
      title: "EDUCATION",
      desc: "Diploma in Computer Science & Engineering from Maharishi University of Information Technology (2023–2025). Prior background in Electrical & Electronics Engineering from Ismail Yusuf College (2018).",
      tags: ["CS Engineering", "University"],
      img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop",
    },
    {
      id: "02",
      title: "EXPERIENCE",
      desc: "Led a cross-functional team to create a complete software prototype in a 48-hour hackathon. Achieved 2nd place in the IEEE Software Category Competition among 15+ teams. Managed sprint-style workflows and delegated tasks for timely delivery.",
      tags: ["Team Lead", "Hack-Shastra"],
      img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop",
    },
    {
      id: "03",
      title: "APPROACH",
      desc: "Skilled in rapid prototyping, scalable system architecture, and building intelligent applications. I believe in clean code, modular design, and shipping fast without sacrificing quality.",
      tags: ["Architecture", "Clean Code"],
      img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2669&auto=format&fit=crop",
    },
    {
      id: "04",
      title: "PHILOSOPHY",
      desc: "Engineering is about solving real human problems. I bring curiosity, deep technical skills, and a maker mindset to every project — whether it's a web app, an AI model, or an immersive game experience.",
      tags: ["Innovation", "Impact"],
      img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop",
    },
  ];

  return (
    <section id="about" className="py-10 md:py-16 px-4 md:px-12 bg-[var(--bg)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-20 flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border)] pb-6 md:pb-8 gap-4">
          <h2 className="text-[12vw] md:text-[10vw] font-black uppercase tracking-tighter leading-[0.85] text-[var(--fg)] opacity-10">
            ABOUT<br />ME
          </h2>
          <span className="font-mono text-xs md:text-sm text-[var(--acc)]">[ BACKGROUND ]</span>
        </div>

        <div className="flex flex-col">
          {capabilities.map((item, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{ height: activeItem === index ? "auto" : "140px" }}
              className="relative border-b border-[var(--border)] overflow-hidden transition-all duration-700 ease-[0.16,1,0.3,1] group cursor-pointer"
              onMouseEnter={() => setActiveItem(index)}
              onMouseLeave={() => setActiveItem(null)}
              onClick={() => setActiveItem(activeItem === index ? null : index)}
            >
              <motion.div
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: activeItem === index ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt="bg" className="w-full h-full object-cover opacity-40 grayscale" />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent" />
              </motion.div>

              <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-baseline gap-3 md:gap-8">
                    <span className="font-mono text-xs md:text-sm text-[var(--acc)]">{item.id}</span>
                    <h3 className={`text-2xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter transition-colors duration-300 ${
                      activeItem === index ? "text-[var(--acc)]" : "text-[var(--fg)]"
                    }`}>
                      <ScrambleText text={item.title} active={activeItem === index} />
                    </h3>
                  </div>
                  <motion.div animate={{ rotate: activeItem === index ? 90 : 0 }} className="text-[var(--fg)] flex-shrink-0">
                    {activeItem === index ? <Minus size={24} /> : <Plus size={24} />}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: activeItem === index ? 1 : 0,
                    y: activeItem === index ? 0 : 20,
                  }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8 mt-4"
                >
                  <p className="max-w-xl text-base md:text-xl text-[var(--fg)] opacity-80 leading-relaxed" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {item.desc}
                  </p>
                  <div className="flex flex-wrap gap-2 md:gap-4 flex-shrink-0">
                    {item.tags.map((tag, t) => (
                      <span key={t} className="px-3 py-1.5 md:px-4 md:py-2 border border-[var(--border)] rounded-full text-[10px] md:text-xs font-mono uppercase tracking-widest text-[var(--fg)] bg-[var(--bg)]/50 backdrop-blur-md whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
