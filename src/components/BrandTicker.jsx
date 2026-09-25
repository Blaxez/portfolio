"use client";
import { motion } from "framer-motion";
import { 
  SiReact, SiNextdotjs, SiPython, SiTensorflow, SiNodedotjs, 
  SiUnrealengine, SiBlender, SiDocker, SiAmazonwebservices, 
  SiPytorch, SiGraphql, SiThreedotjs, SiWebgl, SiTailwindcss 
} from "react-icons/si";

const BRANDS = [
  { name: "REACT", icon: SiReact, color: "#61DAFB" },
  { name: "NEXT.JS", icon: SiNextdotjs, color: "#ffffff" },
  { name: "PYTHON", icon: SiPython, color: "#3776AB" },
  { name: "TENSORFLOW", icon: SiTensorflow, color: "#FF6F00" },
  { name: "NODE.JS", icon: SiNodedotjs, color: "#339933" },
  { name: "UNREAL", icon: SiUnrealengine, color: "#ffffff" },
  { name: "BLENDER", icon: SiBlender, color: "#E87D0D" },
  { name: "DOCKER", icon: SiDocker, color: "#2496ED" },
  { name: "AWS", icon: SiAmazonwebservices, color: "#FF9900" },
  { name: "PYTORCH", icon: SiPytorch, color: "#EE4C2C" },
  { name: "GRAPHQL", icon: SiGraphql, color: "#E10098" },
  { name: "THREE.JS", icon: SiThreedotjs, color: "#ffffff" },
  { name: "WEBGL", icon: SiWebgl, color: "#990000" },
  { name: "TAILWIND", icon: SiTailwindcss, color: "#06B6D4" },
];

export default function BrandTicker() {
  const allBrands = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section 
      className="border-y border-[var(--border)] bg-[var(--bg)] overflow-hidden flex items-center relative z-10"
      style={{ paddingBlock: "1rem" }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />

      <motion.div
        className="flex gap-16 md:gap-32 w-max items-center"
        animate={{ x: "-33%" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        {allBrands.map((brand, i) => (
          <div
            key={i}
            className="flex items-center gap-3 md:gap-4 text-[var(--fg)] opacity-20 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-pointer group"
            style={{ "--hover-color": brand.color }}
          >
            <brand.icon className="text-3xl md:text-5xl group-hover:text-[var(--hover-color)] transition-colors" />
            <span className="text-2xl md:text-4xl font-black uppercase tracking-tighter whitespace-nowrap group-hover:text-[var(--hover-color)] transition-colors">
              {brand.name}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
