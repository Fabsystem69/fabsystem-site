"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/visio", label: "Visio" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [open, setOpen] = useState(false);

  // Ferme le menu quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Empêche le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const headerClass = isHome
    ? "absolute inset-x-0 top-0 z-30"
    : "sticky top-0 z-30 border-b bg-white/90 backdrop-blur";

  const linkClass = isHome ? "text-white hover:text-white/70" : "text-neutral-900 hover:text-neutral-600";

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/FabSystem-Logo.svg"
            alt="FabSystem"
            className={`h-9 w-auto max-w-[160px] ${isHome ? "invert" : ""}`}
          />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden sm:flex items-center gap-3">
  <a
    href="https://cal.com/fabien-l-typ79a"
    target="_blank"
    rel="noreferrer"
    className={
      isHome
        ? "rounded-md border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        : "rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
    }
  >
    Visio
  </a>

  <Link
    href="/contact"
    className={
      isHome
        ? "rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
        : "rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
    }
  >
    Diagnostic
  </Link>
</div>

        {/* Burger mobile */}
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className={`sm:hidden rounded-md p-2 ${isHome ? "text-white" : "text-neutral-900"}`}
          onClick={() => setOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* overlay */}
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <img src="/FabSystem-Logo.svg" alt="FabSystem" className="h-9 w-auto max-w-[160px]" />
              <button
                type="button"
                aria-label="Fermer le menu"
                className="rounded-md p-2 text-neutral-900"
                onClick={() => setOpen(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-4 text-base font-medium text-neutral-900">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="py-2">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 space-y-3">
  <a
    href="https://cal.com/fabien-l-typ79a"
    target="_blank"
    rel="noreferrer"
    className="inline-block w-full rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900"
  >
    Visio
  </a>

  <Link
    href="/contact"
    className="inline-block w-full rounded-md bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white"
  >
    Diagnostic
  </Link>
</div>
          </div>
        </div>
      )}
    </header>
  );
}