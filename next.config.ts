import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Log which backend this build/dev server targets — printed once at startup
// (next dev) or build time (next build), regardless of NODE_ENV.
console.log(
  `\n[airsoft-tactic-admin] NODE_ENV=${process.env.NODE_ENV ?? "unknown"} ` +
    `API_BASE_URL=${process.env.NEXT_PUBLIC_API_BASE_URL ?? "(unset → defaults to http://localhost:8080)"}\n`,
);

const nextConfig: NextConfig = {
  ...(isProd && {
    output: "export",
    trailingSlash: true,
  }),
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: false },
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
