import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/portfolio" : "";

const nextConfig: NextConfig = {
  output: isProd ? "export" : undefined,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  reactCompiler: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["gsap"],
  },
};

export default nextConfig;
