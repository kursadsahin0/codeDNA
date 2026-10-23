import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.CODEDNA_E2E === "1" ? ".next-e2e" : ".next",
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
