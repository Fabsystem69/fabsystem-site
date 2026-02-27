import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/*": ["./lib/generated/prisma/**/*"],
  },
};

export default nextConfig;
