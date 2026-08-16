"use client";

import { useEffect } from "react";

const RELOAD_MARKER_KEY = "fabsystem:chunk-reload-at";
const RELOAD_WINDOW_MS = 15_000;

function getErrorText(candidate: unknown): string {
  if (!candidate) return "";
  if (candidate instanceof Error) return `${candidate.name} ${candidate.message}`;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "object" && "message" in candidate) {
    const message = (candidate as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

function isChunkLoadError(candidate: unknown): boolean {
  const text = getErrorText(candidate);
  return (
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("/_next/static/chunks/")
  );
}

function shouldReloadNow(): boolean {
  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_MARKER_KEY) ?? "0");
    return Number.isFinite(lastReloadAt) ? Date.now() - lastReloadAt > RELOAD_WINDOW_MS : true;
  } catch {
    return true;
  }
}

function markReload(): void {
  try {
    window.sessionStorage.setItem(RELOAD_MARKER_KEY, String(Date.now()));
  } catch {
    // Pas bloquant en dev si sessionStorage est indisponible.
  }
}

export function ChunkLoadAutoReload() {
  useEffect(() => {
    function reloadIfNeeded(candidate: unknown) {
      if (!isChunkLoadError(candidate) || !shouldReloadNow()) return;
      markReload();
      window.location.reload();
    }

    function handleError(event: ErrorEvent) {
      reloadIfNeeded(event.error ?? event.message);
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      reloadIfNeeded(event.reason);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
