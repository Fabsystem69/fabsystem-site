"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/formations", label: "Formations" },
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
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // focus trap + escape key
    if (open && drawerRef.current) {
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length) focusable[0].focus();

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
        if (e.key === "Tab" && focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
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
      <header role="navigation" className={theme.header}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 sm:py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="relative block h-9 w-[180px] overflow-hidden">
              <Image
                src="/FabSystem-Logo.svg"
                alt="FabSystem"
                fill
                priority
                sizes="180px"
                className="origin-center scale-[1.05] object-cover object-center"
              />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 text-xs font-medium sm:flex sm:text-sm sm:gap-6">
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
            className={`sm:hidden rounded-md p-1.5 ${theme.burger}`}
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
        <div ref={drawerRef} id="mobile-menu" className="fixed inset-0 z-[999] sm:hidden">
          {/* overlay */}
          <button
            aria-label="Fermer le menu"
            className={`fixed inset-0 ${theme.overlay}`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* panel */}
          <div className={`fixed right-0 top-0 h-full w-[85%] max-w-sm ${theme.drawerBg} p-6 shadow-xl`}>
            <div className="flex items-center justify-between">
              <span className="relative block h-9 w-[160px] overflow-hidden">
                <Image
                  src="/FabSystem-Logo.svg"
                  alt="FabSystem"
                  fill
                  sizes="160px"
                  className="origin-center scale-[1.05] object-cover object-center"
                />
              </span>
              <button
                type="button"
                aria-label="Fermer le menu"
                className="rounded-md p-1.5 text-neutral-900"
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
