import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@prisma/client"],
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
  turbopack: {
    root: path.join(__dirname),
  },
  agentRules: false,
};

export default nextConfig;
