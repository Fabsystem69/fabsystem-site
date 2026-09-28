"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_GROUPS, resolveActiveNavHref } from "@/components/dashboard/shell/nav-data";
import { CloseIcon, LogoutIcon, MenuIcon } from "@/components/dashboard/shell/icons";

export function MobileMenuButton({ onOpen, open }: { onOpen: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ouvrir la navigation"
      aria-expanded={open}
      aria-controls="dashboard-mobile-navigation"
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-200 lg:hidden"
    >
      <MenuIcon className="h-5 w-5" />
    </button>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const activeHref = resolveActiveNavHref(pathname);

  // Ferme le tiroir automatiquement apres un changement de route.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) {
      onClose();
      return;
    }
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      id="dashboard-mobile-navigation"
      aria-label="Navigation du tableau de bord"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-white backdrop:bg-black/60"
    >
      <button
        type="button"
        aria-label="Fermer la navigation"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0"
      />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-[300px] flex-col border-r border-neutral-800 bg-[#111113] shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800/80 px-5">
          <div className="flex items-center gap-2.5">
            <Image src="/FabSystem-Logo.svg" alt="FabSystem" width={28} height={28} className="h-7 w-7 invert" />
            <span className="text-sm font-semibold tracking-tight text-white">
              FabSystem
              <span className="ml-1.5 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                Admin
              </span>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-6">
            {NAV_GROUPS.map((group, groupIndex) => (
              <li key={group.title ?? `group-${groupIndex}`}>
                {group.title ? (
                  <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {group.title}
                  </p>
                ) : null}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.href === activeHref;
                    const Icon = item.icon;

                    return (
                      <li key={item.href} className="relative">
                        {active ? (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-400" />
                        ) : null}
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150 ${
                            active
                              ? "bg-neutral-800/70 text-white"
                              : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${active ? "text-brand-400" : "text-neutral-500"}`}>
                            <Icon className="h-full w-full" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="shrink-0 rounded-full border border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-neutral-800/80 p-3">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

export function useMobileDrawer() {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  return { open, onOpen, onClose };
}
