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
