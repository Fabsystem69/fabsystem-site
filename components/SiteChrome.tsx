"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// La preview isolee du dashboard admin (/dashboard-preview) a sa propre
// identite visuelle (theme sombre plein ecran) : le navbar/footer publics
// n'y ont pas leur place. Sur toutes les autres routes, le comportement
// reste strictement identique a avant (Navbar + contenu + Footer).
const ISOLATED_CHROME_PREFIXES = ["/dashboard-preview"];

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
