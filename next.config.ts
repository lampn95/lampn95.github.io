import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Deployed at https://lampn95.github.io/ — a personal page, so no basePath.
// If you later move to a project page (e.g. lampn95.github.io/some-repo/), set
// BASE_PATH="/some-repo" before running `make github`.
const basePath = process.env.BASE_PATH ?? "";

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
