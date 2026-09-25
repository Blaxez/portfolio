/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: isProd ? "export" : undefined,
  basePath: isProd ? "/portfolio" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/portfolio" : "",
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
