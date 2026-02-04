import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FabSystem – Électricité embarquée",
  description:
    "Conseil et accompagnement en électricité embarquée pour bateaux, vans et camping-cars.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "FabSystem – Électricité embarquée fiable et sécurisée",
    description:
      "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars.",
    url: "https://fabsystem.fr",
    siteName: "FabSystem",
    images: [
      {
        url: "/hero-fabsystem.png",
        width: 1200,
        height: 630,
        alt: "FabSystem - Électricité embarquée",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FabSystem – Électricité embarquée",
    description: "Diagnostic et conseil pour installations électriques embarquées",
    images: ["/hero-fabsystem.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white text-neutral-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}