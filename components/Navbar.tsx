"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/prestations", label: "Prestations" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/visio", label: "Visio" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Empêche le scroll derrière quand le menu est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Ferme avec la touche ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/FabSystem-Logo.png"
              alt="FabSystem"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-neutral-900">
              FabSystem
            </div>
            <div className="text-xs text-neutral-600">
              Électricité & systèmes embarqués
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-800 sm:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-neutral-900 underline underline-offset-8"
                    : "hover:text-neutral-900"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Burger */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden">
          {/* Overlay */}
          <button
            aria-label="Fermer le menu"
            className="fixed inset-0 z-[90] bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed left-0 right-0 top-0 z-[100] bg-white shadow-lg">
            <div className="mx-auto max-w-6xl px-6 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-3"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-9 w-9">
                    <Image
                      src="/FabSystem-Logo.png"
                      alt="FabSystem"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <span className="font-semibold">FabSystem</span>
                </Link>

                <button
                  type="button"
                  className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2 pb-4">
                {NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "rounded-md px-3 py-3 text-base font-medium " +
                        (active
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-900 hover:bg-neutral-100")
                      }
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-neutral-200 py-4 text-sm text-neutral-600">
                <a
                  href="mailto:fabien.lages@fabsystem.fr"
                  className="block py-2 underline"
                  onClick={() => setOpen(false)}
                >
                  fabien.lages@fabsystem.fr
                </a>
                <a
                  href="tel:+33698247722"
                  className="block py-2 underline"
                  onClick={() => setOpen(false)}
                >
                  06 98 24 77 22
                </a>
              </div>
            </div>
          </div>

          {/* espace pour éviter que le contenu "saute" sous le header sticky */}
          <div className="h-0" />
        </div>
      )}
    </header>
  );
}