"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/formations", label: "Formations" },
  { href: "/outils", label: "Outils" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/audit-nautique", label: "Audit" },
  { href: "/a-propos", label: "À propos" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open && drawerRef.current) {
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length) focusable[0].focus();

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <>
      <header
        role="navigation"
        className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5 sm:py-3">
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
          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 transition-colors duration-150 ${
                  isActive(item.href)
                    ? "bg-neutral-100 text-neutral-950 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/contact"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-150"
            >
              Contact
            </Link>
            <Link
              href="/visio"
              className="inline-flex items-center justify-center rounded-lg bg-brand-400 px-4 py-1.5 text-sm font-bold text-neutral-900 transition-colors duration-150 hover:bg-brand-300"
            >
              Réserver
            </Link>
          </div>

          {/* Burger */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="rounded-md p-1.5 text-neutral-900 sm:hidden"
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
            className="fixed inset-0 bg-black/55"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* panel */}
          <div className="fixed right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white p-6 shadow-xl">
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

            <nav className="mt-6 flex flex-col gap-1 text-base font-medium text-neutral-900">
              {[...nav, { href: "/contact", label: "Contact" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-3 transition-colors duration-150 ${
                    isActive(item.href)
                      ? "bg-neutral-100 font-semibold text-neutral-950"
                      : "hover:bg-neutral-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile CTA */}
            <div className="mt-auto pt-6">
              <Link
                href="/visio"
                className="flex w-full items-center justify-center rounded-xl bg-brand-400 py-3 text-base font-bold text-neutral-900 transition-colors duration-150 hover:bg-brand-300"
                onClick={() => setOpen(false)}
              >
                ⚡ Réserver une visio
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
