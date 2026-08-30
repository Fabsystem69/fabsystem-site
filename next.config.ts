import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Autorise les essais de l'éditeur sur un téléphone du même réseau Wi-Fi.
  // Cette origine n'est prise en compte que par `next dev`, jamais en production.
  allowedDevOrigins: ["192.168.1.23"],
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@react-pdf/renderer",
    "nodemailer",
    "pg",
    "qrcode",
  ],
  outputFileTracingIncludes: {
    "/*": ["./lib/generated/prisma/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
      {
        // Fusionné dans le bilan de consommation (retour utilisateur :
        // "autonomie batterie sera fusionner avec bilan conso") — la
        // banque de batteries, les sources de charge et l'autonomie sont
        // désormais dans le même écran.
        source: "/outils/autonomie-batterie",
        destination: "/outils/bilan-consommation",
        permanent: true,
      },
      {
        // Fusionné dans la section de câble (retour utilisateur : "je
        // pense qu'on peux fusionner mm awg aussi avec") — la table AWG↔mm²
        // et les exemples marine sont désormais un onglet de ce calculateur.
        source: "/outils/awg",
        destination: "/outils/section-cable",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
