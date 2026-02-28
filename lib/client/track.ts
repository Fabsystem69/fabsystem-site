"use client";

declare global {
  interface Window {
    gtag?: (command: "event", event: string, params?: Record<string, unknown>) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", event, props ?? {});
    return;
  }

  if (typeof window.plausible === "function") {
    window.plausible(event, { props: props ?? {} });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[track]", event, props);
  }
}
