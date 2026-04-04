import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sur Vercel, `outputFileTracingRoot` est défini par la plateforme : ne pas
  // fixer `turbopack.root` à une autre valeur (warning build + risque de tracing).
  ...(process.env.VERCEL
    ? {}
    : {
        turbopack: {
          root: path.join(__dirname),
        },
      }),
};

export default nextConfig;
