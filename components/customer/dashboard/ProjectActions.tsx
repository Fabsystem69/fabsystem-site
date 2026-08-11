"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

// Espace client V2 (UI-8) — actions Project réelles, branchées sur les
// routes existantes (app/api/projects/[projectId]/**). Aucune action non
// supportée par le backend n'est proposée : pas de "Dupliquer" (aucune
// fonction de duplication n'existe côté serveur), pas de "Restaurer" pour
// un projet archivé (aucun endpoint un-archive n'existe) — voir
// docs/audits/UI-8-SAAS-CLIENT.md, "Backend manquant éventuel".

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Une erreur est survenue.");
  }

  return response.json();
}

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setPending(true);
    setError(null);
    try {
      await postJson(`/api/projects/${projectId}/archive`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={handleArchive} disabled={pending}>
        {pending ? "Archivage..." : "Archiver"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function CancelDeletionButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setPending(true);
    setError(null);
    try {
      await postJson(`/api/projects/${projectId}/cancel-deletion`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button variant="primary" onClick={handleCancel} disabled={pending}>
        {pending ? "Annulation..." : "Annuler la suppression"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function DeleteProjectControls({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      if (deferred) {
        await postJson(`/api/projects/${projectId}/schedule-deletion`, { confirm: true });
      } else {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Une erreur est survenue.");
        }
      }
      router.push("/mon-compte/projets");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inattendue.");
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Supprimer définitivement
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmer la suppression du projet"
      className="rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <p className="text-sm font-semibold text-red-900">Supprimer ce projet ?</p>
      <p className="mt-2 text-sm leading-relaxed text-red-800">
        Cette action supprime définitivement le projet et ses données. Elle ne peut pas être
        annulée une fois exécutée.
      </p>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-red-900">
        <input
          type="checkbox"
          checked={deferred}
          onChange={(e) => setDeferred(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-red-300"
        />
        <span>
          Suppression différée de 72 h (vous pourrez annuler pendant ce délai). Décochée, la
          suppression est immédiate et définitive.
        </span>
      </label>

      {error ? (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
          {pending ? "Suppression..." : deferred ? "Programmer la suppression" : "Supprimer définitivement"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export function RenameProjectForm({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Le nom du projet est obligatoire.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Impossible de renommer ce projet.");
      }
      setEditing(false);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <Button variant="tertiary" onClick={() => setEditing(true)}>
        Renommer
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="sr-only" htmlFor={`rename-${projectId}`}>
        Nom du projet
      </label>
      <input
        id={`rename-${projectId}`}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
      />
      <div className="flex gap-2">
        <Button variant="primary" onClick={handleSave} disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          variant="tertiary"
          onClick={() => {
            setEditing(false);
            setName(currentName);
            setError(null);
          }}
          disabled={pending}
        >
          Annuler
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
