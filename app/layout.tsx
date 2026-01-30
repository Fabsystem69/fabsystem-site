import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FabSystem – Électricité embarquée",
  description:
    "Conseil et accompagnement en électricité embarquée pour bateaux, vans et camping-cars.",
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