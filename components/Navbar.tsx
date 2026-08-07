"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";
import { useCartDrawer } from "@/lib/client/cart-drawer-context";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/prestations", label: "Services" },
  { href: "/formations", label: "Autodidacte" },
  { href: "/a-propos", label: "À propos" },
];

const ICON_LINK_CLASS =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 transition-colors duration-150 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h2l1.4 10.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.7L20 9H6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.3" fill="currentColor" />
      <circle cx="17" cy="21" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 7l7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-400 px-1 text-[10px] font-bold leading-none text-neutral-900"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { open: openCartDrawer } = useCartDrawer();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCartCount() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json().catch(() => null)) as
          | { cart?: { itemCount?: number } }
          | null;
        if (!cancelled) {
          setCartCount(body?.cart?.itemCount ?? 0);
        }
      } catch {
        // Le badge panier est une amélioration visuelle : une erreur reseau
        // ne doit jamais bloquer la navigation.
      }
    }

    loadCartCount();

    window.addEventListener(CART_CHANGED_EVENT, loadCartCount);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, loadCartCount);
    };
  }, [pathname]);

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

  const cartAriaLabel = cartCount > 0 ? `Panier, ${cartCount} article(s)` : "Panier";
  const mobileCartLabel = cartCount > 0 ? `Panier (${cartCount})` : "Panier";

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

          {/* Desktop actions */}
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/mon-compte" aria-label="Mon compte" className={ICON_LINK_CLASS}>
              <AccountIcon />
            </Link>
            <button
              type="button"
              aria-label={cartAriaLabel}
              className={ICON_LINK_CLASS}
              onClick={openCartDrawer}
            >
              <CartIcon />
              <CartBadge count={cartCount} />
            </button>
            <Link href="/contact" aria-label="Contact" className={ICON_LINK_CLASS}>
              <ContactIcon />
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
              {[
                ...nav,
                { href: "/mon-compte", label: "Mon compte" },
                { href: "/contact", label: "Contact" },
              ].map((item) => (
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
              <button
                type="button"
                className="rounded-lg px-3 py-3 text-left transition-colors duration-150 hover:bg-neutral-50"
                onClick={() => {
                  setOpen(false);
                  openCartDrawer();
                }}
              >
                {mobileCartLabel}
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
