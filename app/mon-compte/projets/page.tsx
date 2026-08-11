import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { STANDARD_PROJECT_LIMIT, listProjectsForCustomer } from "@/lib/services/project";
import { requireCustomerActor } from "@/lib/server/project-actor";
import {
  getProjectAssetTypeLabel,
  getProjectStatusLabel,
  getProjectVoltageLabel,
} from "@/lib/project-labels";
import type { Project } from "@/lib/generated/prisma/client";

export const metadata: Metadata = {
  title: "Mes projets",
  description: "Vos projets d'installation électrique FabSystem.",
  alternates: { canonical: "/mon-compte/projets" },
  robots: { index: false, follow: false },
};

// Espace client V2 (UI-8) — Mes projets. "Établi numérique", pas de
// recherche/filtre complexe pour 3 projets maximum (MASTER-06 §11,
// MASTER-12 §103). Limite standard = STANDARD_PROJECT_LIMIT, réellement
// appliquée côté serveur (lib/services/project.ts) — comptent tous les
// projets, actifs et archivés confondus (aucune distinction
// exemple/copie n'existe dans le backend, voir rapport "Backend manquant
// éventuel").
function statusBadgeTone(status: Project["status"]) {
  if (status === "DELETE_SCHEDULED") return "danger" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "success" as const;
}

export default async function MesProjetsPage() {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";
  const projects = await listProjectsForCustomer(actor, customerId);

  const active = projects.filter((p) => p.status === "ACTIVE" || p.status === "DELETE_SCHEDULED");
  const archived = projects.filter((p) => p.status === "ARCHIVED");
  const atLimit = projects.length >= STANDARD_PROJECT_LIMIT;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mes projets</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Retrouvez et poursuivez vos installations électriques.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-neutral-700">
            {projects.length} / {STANDARD_PROJECT_LIMIT}
          </p>
          {atLimit ? (
            <p className="mt-1 max-w-xs text-xs text-neutral-500">
              Limite atteinte — supprimez définitivement un projet existant pour en créer un
              nouveau.
            </p>
          ) : null}
        </div>
      </div>

      {atLimit ? (
        <Button variant="secondary" className="cursor-not-allowed opacity-50" disabled>
          + Nouveau projet
        </Button>
      ) : (
        <Button href="/mon-compte/projets/nouveau" variant="primary">
          + Nouveau projet
        </Button>
      )}

      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-neutral-950">Vous n&apos;avez pas encore de projet.</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Un projet centralise votre installation : informations retenues, circuits, schéma.
          </p>
          <div className="mt-4">
            <Button href="/mon-compte/projets/nouveau" variant="primary">
              Créer mon premier projet
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((project) => (
            <Link
              key={project.id}
              href={`/mon-compte/projets/${project.id}`}
              className="block rounded-card border border-neutral-200 bg-white p-5 shadow-card transition-colors hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-neutral-950">{project.name}</h2>
                    <Badge tone={statusBadgeTone(project.status)}>
                      {getProjectStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {getProjectAssetTypeLabel(project.assetType)} ·{" "}
                    {getProjectVoltageLabel(project.voltage)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Modifié le {formatDate(project.updatedAt)}
                  </p>
                  {project.status === "DELETE_SCHEDULED" && project.deleteScheduledAt ? (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      Suppression programmée le {formatDate(project.deleteScheduledAt)}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-semibold text-neutral-600">
                  Ouvrir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {archived.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Archives</h2>
          <div className="mt-3 space-y-3">
            {archived.map((project) => (
              <Link
                key={project.id}
                href={`/mon-compte/projets/${project.id}`}
                className="block rounded-card border border-neutral-200 bg-neutral-50 p-5 transition-colors hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800">{project.name}</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {getProjectAssetTypeLabel(project.assetType)} · Archivé
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-500">Ouvrir →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
