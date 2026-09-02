"use client";

import { useEffect, useState } from "react";

export function ProjectSharingConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/client-auth/project-sharing-consent", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled && data?.enabled === false) setVisible(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function accept() {
    if (!checked) return;
    setSaving(true);
    const response = await fetch("/api/client-auth/project-sharing-consent", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true }),
    }).catch(() => null);
    if (response?.ok) setVisible(false);
    setSaving(false);
  }

  if (!visible) return null;

  return <aside className="mx-3 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 max-md:mx-2" aria-label="Partage du projet avec FabSystem"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Partager mon projet avec FabSystem</p><p className="mt-0.5 text-amber-900">Autorisez l&apos;accompagnant à consulter et modifier vos projets de schéma pour vous aider. Ce choix reste modifiable dans votre profil.</p></div><label className="flex items-start gap-2 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4" />J&apos;autorise ce partage</label><button type="button" disabled={!checked || saving} onClick={() => void accept()} className="rounded-lg bg-amber-500 px-3 py-2 font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Enregistrement…" : "Autoriser"}</button></div></aside>;
}
