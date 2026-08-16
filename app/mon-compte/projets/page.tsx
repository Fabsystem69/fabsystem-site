import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { STANDARD_PROJECT_LIMIT, listProjectsForCustomer } from "@/lib/services/project";
import { getProjectValues } from "@/lib/services/project-values";
import { listProjectSchemaSummaries } from "@/lib/services/project-schema";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { listRegisteredEngineIds } from "@/lib/engines/index";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { moduleStatus } from "@/lib/project-module-status";
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

  // Repère rapide pour jongler entre plusieurs projets sans ouvrir chacun —
  // limite à STANDARD_PROJECT_LIMIT projets, donc peu coûteux même en N+1.
  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];
  const progressByProjectId = new Map(
    await Promise.all(
      active.map(async (project) => {
        const values = await getProjectValues(project.id);
        const retainedCount = engineIds.filter(
          (id) => moduleStatus(id, values) === "Retenu"
        ).length;
        return [project.id, { retainedCount, total: engineIds.length }] as const;
      })
    )
  );

  // Miniature + statut du schéma sur chaque carte (retour utilisateur : "je
  // n'arrive même pas à retrouver mon schéma directement dans dashboard") —
  // une seule requête groupée, pas de N+1.
  const schemaSummaries = await listProjectSchemaSummaries(projects.map((p) => p.id));

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
          {active.map((project) => {
            const schema = schemaSummaries.get(project.id);
            const canOpenSchemaDirectly = project.status === "ACTIVE";
            return (
              <Card key={project.id} className="p-5 transition-colors hover:border-neutral-300">
                <div className="flex flex-wrap items-start gap-4">
                {schema?.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={schema.thumbnail}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center text-[11px] leading-tight text-neutral-400">
                    Pas encore de schéma
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/mon-compte/projets/${project.id}`}
                          className="text-base font-semibold text-neutral-950 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        >
                          {project.name}
                        </Link>
                        <Badge tone={statusBadgeTone(project.status)}>
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                        {schema ? <Badge tone="success">Schéma</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-neutral-600">
                        {getProjectAssetTypeLabel(project.assetType)} ·{" "}
                        {getProjectVoltageLabel(project.voltage)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Modifié le {formatDate(project.updatedAt)}
                      </p>
                      {schema ? (
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                          Schéma enregistré le {formatDate(schema.updatedAt)}
                        </p>
                      ) : null}
                      {project.status === "DELETE_SCHEDULED" && project.deleteScheduledAt ? (
                        <p className="mt-2 text-xs font-semibold text-red-700">
                          Suppression programmée le {formatDate(project.deleteScheduledAt)}
                        </p>
                      ) : null}
                      {progressByProjectId.has(project.id) ? (
                        <p className="mt-2 text-xs font-medium text-neutral-500">
                          {progressByProjectId.get(project.id)!.retainedCount}/
                          {progressByProjectId.get(project.id)!.total} modules retenus
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canOpenSchemaDirectly ? (
                        <Button
                          href={`/outils/schema?projectId=${project.id}`}
                          variant={schema ? "primary" : "secondary"}
                          className="h-9 min-h-9 px-3 text-xs"
                        >
                          {schema ? "Ouvrir le schéma" : "Créer le schéma"}
                        </Button>
                      ) : null}
                      <Button
                        href={`/mon-compte/projets/${project.id}`}
                        variant={canOpenSchemaDirectly ? "secondary" : "primary"}
                        className="h-9 min-h-9 px-3 text-xs"
                      >
                        Voir le projet
                      </Button>
                    </div>
                  </div>
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {archived.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Archives</h2>
          <div className="mt-3 space-y-3">
            {archived.map((project) => {
              const schema = schemaSummaries.get(project.id);
              return (
              <Card
                key={project.id}
                className="bg-neutral-50 p-5 transition-colors hover:border-neutral-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/mon-compte/projets/${project.id}`}
                      className="text-sm font-semibold text-neutral-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500">
                      {getProjectAssetTypeLabel(project.assetType)} · Archivé
                    </p>
                    {schema ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        Schéma enregistré le {formatDate(schema.updatedAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schema ? (
                      <Button
                        href={`/outils/schema?projectId=${project.id}`}
                        variant="secondary"
                        className="h-9 min-h-9 px-3 text-xs"
                      >
                        Ouvrir le schéma
                      </Button>
                    ) : null}
                    <Button
                      href={`/mon-compte/projets/${project.id}`}
                      variant={schema ? "tertiary" : "secondary"}
                      className="h-9 min-h-9 px-3 text-xs"
                    >
                      Voir le projet
                    </Button>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        </div>
      ) : null}
    </div>
  );
}
