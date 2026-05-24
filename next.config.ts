import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  distDir: isProd ? "docs" : ".next",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
