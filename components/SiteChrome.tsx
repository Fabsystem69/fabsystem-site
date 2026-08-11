"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Le dashboard admin (/dashboard) a sa propre identite visuelle (sidebar +
// theme sombre plein ecran, deja protege par requireSession) : le
// navbar/footer publics n'y ont pas leur place — un vrai produit SaaS
// n'affiche pas la navigation marketing du site public autour de son
// panneau d'administration. Sur toutes les autres routes, le comportement
// reste strictement identique a avant (Navbar + contenu + Footer).
const ISOLATED_CHROME_PREFIXES = ["/dashboard"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIsolated = ISOLATED_CHROME_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (isIsolated) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
