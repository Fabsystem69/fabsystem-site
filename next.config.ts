import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@react-pdf/renderer",
    "@simplewebauthn/server",
    "nodemailer",
    "pg",
    "qrcode",
  ],
  outputFileTracingIncludes: {
    "/*": ["./lib/generated/prisma/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/contacst",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/ebook",
        destination: "/boutique",
        permanent: true,
      },
      {
        source: "/ebook/cabler-son-van",
        destination: "/boutique/ebook-electricite-van",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
