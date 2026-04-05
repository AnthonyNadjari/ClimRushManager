import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo : remonter le tracing d'un cran pour inclure les dépendances parentes.
  outputFileTracingRoot: path.join(__dirname, "../"),
  ...(process.env.VERCEL
    ? {}
    : {
        turbopack: {
          root: path.join(__dirname),
        },
      }),
};

export default nextConfig;
