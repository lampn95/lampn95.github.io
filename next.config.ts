import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Deployed at https://lamthao1995.github.io/lampham/ — project page needs basePath.
// If you ever switch to a personal page (<username>.github.io) or a custom domain,
// set BASE_PATH="" (or remove the env var) before running `make github`.
const basePath = process.env.BASE_PATH ?? (isProd ? "/lampham" : "");

const nextConfig: NextConfig = {
  output: "export",
  distDir: isProd ? "docs" : ".next",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
