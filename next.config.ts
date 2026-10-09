import type { NextConfig } from "next";

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // a lockfile also exists one directory above this project, which makes Next
  // infer the wrong root and nest .next/standalone; pin it to this directory
  turbopack: {
    root: import.meta.dirname,
  },
  // emits .next/standalone, used by the `web` image in the Dockerfile
  output: "standalone",
  // type-check only the frontend; src/ is the NestJS app built by tsc
  typescript: {
    tsconfigPath: "tsconfig.web.json",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
