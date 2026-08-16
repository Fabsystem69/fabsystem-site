"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCategorieLabel,
  PRESTATIONS_CATEGORIES,
  type PrestationsCategorie,
} from "@/lib/prestations-packs";
import { prestationsUniversQuery } from "@/lib/prestations-search-params";

const STORAGE_KEY = "fabsystem.home.universe";
const STORAGE_EVENT = "fabsystem:home-universe-change";

type HomeUniverseContextValue = {
  selectedUniverse: PrestationsCategorie | undefined;
  selectedUniverseLabel: string | null;
  selectionQuery: string;
  selectUniverse: (univers: PrestationsCategorie) => void;
};

const HomeUniverseContext = createContext<HomeUniverseContextValue | null>(null);

function readStoredUniverse(): PrestationsCategorie | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  return PRESTATIONS_CATEGORIES.find((category) => category === raw);
}

function subscribeToUniverseSelection(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener(STORAGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function HomeUniverseProvider({ children }: { children: ReactNode }) {
  const selectedUniverse = useSyncExternalStore(
    subscribeToUniverseSelection,
    readStoredUniverse,
    () => undefined
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  const value = useMemo<HomeUniverseContextValue>(
    () => ({
      selectedUniverse,
      selectedUniverseLabel: selectedUniverse ? getCategorieLabel(selectedUniverse) : null,
      selectionQuery: prestationsUniversQuery(selectedUniverse),
      selectUniverse(univers) {
        window.localStorage.setItem(STORAGE_KEY, univers);
        window.dispatchEvent(new Event(STORAGE_EVENT));
        setNotice(`${getCategorieLabel(univers)} selectionne. La home s'adapte maintenant a cet univers.`);
      },
    }),
    [selectedUniverse]
  );

  return (
    <HomeUniverseContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-4 bottom-5 z-50 flex justify-center transition-all duration-200 sm:inset-x-auto sm:right-5 sm:justify-end ${
          notice ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="max-w-sm rounded-2xl border border-neutral-900/10 bg-neutral-950 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
          {notice ?? ""}
        </div>
      </div>
    </HomeUniverseContext.Provider>
  );
}

export function useHomeUniverse() {
  const context = useContext(HomeUniverseContext);

  if (!context) {
    throw new Error("useHomeUniverse must be used within HomeUniverseProvider");
  }

  return context;
}
