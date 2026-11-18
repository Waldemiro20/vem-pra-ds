import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg e o adapter do Prisma rodam no Node da Vercel; não precisam ser empacotados.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
