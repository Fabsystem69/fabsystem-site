"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/visio", label: "Visio" },
  { href: "/audit-nautique", label: "Audit nautique" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const theme = useMemo(() => {
    if (isHome) {
      // same white banner as other pages, except we still want
      // links in light mode (white) to contrast with the background
      return {
        header: "sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur",
        link: "text-neutral-800 hover:text-neutral-500",
        linkActive: "text-neutral-950",
        burger: "text-neutral-900",
        drawerBg: "bg-white",
        drawerText: "text-neutral-900",
        overlay: "bg-black/55",
      };
    }
    return {
      header: "sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur",
      link: "text-neutral-800 hover:text-neutral-500",
      linkActive: "text-neutral-950",
      burger: "text-neutral-900",
      drawerBg: "bg-white",
      drawerText: "text-neutral-900",
      overlay: "bg-black/55",
    };
  }, [isHome]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <>
      <header className={theme.header}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/FabSystem-Logo.svg"
              alt="FabSystem"
              className="h-18 w-auto max-w-[240px] invert"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${theme.link} ${
                  isActive(item.href) ? theme.linkActive : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Burger */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className={`sm:hidden rounded-md p-2 ${theme.burger}`}
            onClick={() => setOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[999] sm:hidden">
          {/* overlay */}
          <button
            aria-label="Fermer le menu"
            className={`fixed inset-0 ${theme.overlay}`}
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className={`fixed right-0 top-0 h-full w-[85%] max-w-sm ${theme.drawerBg} p-6 shadow-xl`}>
            <div className="flex items-center justify-between">
              <img
                src="/FabSystem-Logo.svg"
                alt="FabSystem"
                className="h-10 w-auto max-w-[160px] invert"
              />
              <button
                type="button"
                aria-label="Fermer le menu"
                className="rounded-md p-2 text-neutral-900"
                onClick={() => setOpen(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className={`mt-8 flex flex-col text-base font-medium ${theme.drawerText}`}>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-3 ${
                    isActive(item.href)
                      ? "bg-neutral-100 text-neutral-950"
                      : "hover:bg-neutral-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}