import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FabSystem – Électricité embarquée",
  description:
    "Conseil et accompagnement en électricité embarquée pour bateaux, vans et camping-cars.",

  icons: {
    icon: "/favicon.png", // ou favicon.ico si tu préfères
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* iOS Home Screen */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-white text-neutral-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}