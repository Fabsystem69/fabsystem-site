"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_GROUPS, resolveActiveNavHref } from "@/components/dashboard/shell/nav-data";
import { ChevronLeftIcon, LogoutIcon } from "@/components/dashboard-preview/icons";

const COLLAPSE_STORAGE_KEY = "fabsystem-dashboard-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const activeHref = resolveActiveNavHref(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "1") {
      setCollapsed(true);
    }
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-neutral-800/80 bg-[#111113] transition-[width] duration-300 ease-in-out lg:flex ${
        collapsed ? "w-[72px]" : "w-[260px]"
      } ${hydrated ? "" : "duration-0"}`}
    >
      {/* Identite */}
      <div className={`flex h-16 shrink-0 items-center border-b border-neutral-800/80 ${collapsed ? "justify-center px-0" : "px-5"}`}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/FabSystem-Logo.svg"
            alt="FabSystem"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 invert"
          />
          <span
            className={`overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight text-white transition-all duration-200 ${
              collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
            }`}
          >
            FabSystem
            <span className="ml-1.5 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Admin
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible px-3 py-4">
        <ul className="space-y-6">
          {NAV_GROUPS.map((group, groupIndex) => (
            <li key={group.title ?? `group-${groupIndex}`}>
              {group.title && !collapsed ? (
                <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {group.title}
                </p>
              ) : null}
              {group.title && collapsed ? (
                <div className="mx-2.5 mb-2 border-t border-neutral-800/80" />
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  const Icon = item.icon;

                  return (
                    <li key={item.href} className="group/item relative">
                      {/* Indicateur actif — ancre sur le bord gauche de la ligne elle-meme
                          (pas sur l'icone) : reste identique et jamais rogne, ouvert ou reduit. */}
                      {active ? (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-400" />
                      ) : null}

                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-150 ${
                          collapsed ? "justify-center px-0" : "px-2.5"
                        } ${
                          active
                            ? "bg-neutral-800/70 text-white"
                            : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span
                          className={`relative flex h-5 w-5 shrink-0 items-center justify-center ${
                            active ? "text-brand-400" : "text-neutral-500 group-hover/item:text-neutral-300"
                          }`}
                        >
                          <Icon className="h-full w-full" />
                          {item.badge && collapsed ? (
                            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-neutral-600" />
                          ) : null}
                        </span>
                        <span
                          className={`flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                            collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="shrink-0 rounded-full border border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                              {item.badge}
                            </span>
                          ) : null}
                        </span>
                      </Link>

                      {/* Tooltip — visible uniquement en mode reduit */}
                      {collapsed ? (
                        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl shadow-black/60 transition-opacity duration-150 group-hover/item:opacity-100">
                          {item.label}
                          {item.badge ? <span className="ml-1.5 text-neutral-400">· {item.badge}</span> : null}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Deconnexion + reduction */}
      <div className="shrink-0 space-y-0.5 border-t border-neutral-800/80 p-3">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            aria-label="Se déconnecter"
            className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-neutral-400 transition-colors duration-150 hover:bg-neutral-900 hover:text-neutral-100 ${
              collapsed ? "justify-center px-0" : "px-2.5"
            }`}
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              }`}
            >
              Se déconnecter
            </span>
          </button>
        </form>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Agrandir la navigation" : "Réduire la navigation"}
          className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-neutral-400 transition-colors duration-150 hover:bg-neutral-900 hover:text-neutral-100 ${
            collapsed ? "justify-center px-0" : "px-2.5"
          }`}
        >
          <ChevronLeftIcon
            className={`h-5 w-5 shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
              collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
            }`}
          >
            Réduire
          </span>
        </button>
      </div>
    </aside>
  );
}
