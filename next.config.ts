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
      {
        source: "/schemas-electriques/schema-victron-leger-van",
        destination: "/schemas-electriques/schema-vito-280ah-van",
        permanent: true,
      },
      {
        source: "/schemas-electriques/schema-electrique-van-complet",
        destination: "/schemas-electriques/schema-vito-280ah-van",
        permanent: true,
      },
      {
        source: "/schemas-electriques/schema-station-electrique-van",
        destination: "/schemas-electriques/schema-aferiy-p280-van",
        permanent: true,
      },
      {
        source: "/schemas-electriques/schema-bateau-complet-lynx",
        destination: "/schemas-electriques/schema-voilier-autonome-12v-230v",
        permanent: true,
      },
      {
        // Relocalisation sous /blog (nouvelle IA "Blog" — les guides longs
        // vivaient à la racine, ce qui entrait en conflit avec l'espace de
        // noms plat du site et les rendait indiscernables des pages
        // commerciales) — redirection permanente acceptée malgré le
        // risque SEO de court terme.
        source: "/installation-electrique-van",
        destination: "/blog/installation-electrique-van",
        permanent: true,
      },
      {
        source: "/installation-electrique-van-victron-legere",
        destination: "/blog/installation-electrique-van-victron-legere",
        permanent: true,
      },
      {
        source: "/installation-van-batterie-tout-en-un-aferiy-p280",
        destination: "/blog/installation-van-batterie-tout-en-un-aferiy-p280",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
