import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Guides are read from data/ at runtime, so ship those files with every server route.
  outputFileTracingIncludes: { "/**": ["./data/guides/**", "./data/verification/**"] },
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
