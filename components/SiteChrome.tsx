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
// /outils/schema suit la meme logique : l'editeur de schema occupe tout le
// viewport (CDC §6, 4 zones plein ecran) et gere son propre retour vers
// /outils dans sa Toolbar — un header/footer marketing par-dessus casserait
// la mise en page desktop.
const ISOLATED_CHROME_PREFIXES = ["/dashboard", "/outils/schema", "/outils/ebook-schema-fabsystem"];

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
