import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProjectPrintButton } from "@/components/project-follow-up/ProjectPrintButton";
import { isHttpError } from "@/lib/http-errors";
import { buildProjectFollowUpDossier } from "@/lib/project-follow-up";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import {
  getProjectAssetTypeLabel,
  getProjectStatusLabel,
  getProjectVoltageLabel,
} from "@/lib/project-labels";
import { listRegisteredEngineIds } from "@/lib/engines/index";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { prisma } from "@/lib/prisma";
import { getProject } from "@/lib/services/project";
import { getProjectSchema } from "@/lib/services/project-schema";
import { getProjectValues } from "@/lib/services/project-values";
import { requireCustomerActor } from "@/lib/server/project-actor";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export const dynamic = "force-dynamic";

function stepTone(status: "done" | "current" | "upcoming") {
  if (status === "done") return "success" as const;
  if (status === "current") return "info" as const;
  return "neutral" as const;
}

function engineTone(status: "Retenu" | "À recalculer" | "À compléter") {
  if (status === "Retenu") return "success" as const;
  if (status === "À recalculer") return "warning" as const;
  return "neutral" as const;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await getProject(actor, projectId);
    return {
      title: `Suivi projet · ${project.name}`,
      description: `Suivi projet SaaS imprimable pour ${project.name}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Suivi projet",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProjectFollowUpPage({ params }: PageProps) {
  const { projectId } = await params;
  const actor = await requireCustomerActor();

  let project;
  try {
    project = await getProject(actor, projectId);
  } catch (error) {
    if (isHttpError(error) && (error.status === 403 || error.status === 404)) {
      notFound();
    }
    throw error;
  }

  const [retainedValues, schema, kit] = await Promise.all([
    getProjectValues(project.id),
    getProjectSchema(actor, project.id),
    project.kitId
      ? prisma.kit.findUnique({ where: { id: project.kitId }, include: { items: true } })
      : Promise.resolve(null),
  ]);
  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];
  const dossier = buildProjectFollowUpDossier({
    project,
    retainedValues,
    engineIds,
    hasSchema: Boolean(schema),
    stepOverride: project.followUpStepOverride,
    kit: kit
      ? {
          name: kit.name,
          items: kit.items,
          photoControls: Array.isArray(kit.photoControls) ? (kit.photoControls as string[]) : [],
          powerControls: Array.isArray(kit.powerControls) ? (kit.powerControls as string[]) : [],
          checklist: Array.isArray(kit.checklist) ? (kit.checklist as string[]) : [],
        }
      : null,
  });

  return (
    <div className="space-y-8 print:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/mon-compte/projets/${project.id}`}
            className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            ← Retour au projet
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Suivi projet
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ProjectPrintButton label="Imprimer le dossier" />
          <Button
            href={`/outils/schema?projectId=${project.id}`}
            variant="secondary"
            className="print:hidden"
          >
            Ouvrir le schéma
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-neutral-950 text-white print:rounded-none print:border print:bg-white print:text-neutral-950">
        <div className="grid gap-0 lg:grid-cols-[1.9fr_1fr]">
          <div className="p-6 sm:p-8 print:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
              Couche SaaS du projet
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {project.name}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base print:text-neutral-700">
              Un dossier centralisé dans le cloud pour suivre le projet, garder le schéma, cadrer
              les achats, contrôler les branchements et sortir une version imprimable propre à la
              fin du chantier.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="info">Projet client</Badge>
              <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
                {getProjectStatusLabel(project.status)}
              </Badge>
              <Badge tone={dossier.hasSchema ? "success" : "warning"}>
                {dossier.hasSchema ? "Schéma lié" : "Schéma à enregistrer"}
              </Badge>
              <Badge tone={dossier.obsoleteCount > 0 ? "warning" : "success"}>
                {dossier.readinessLabel}
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-white/10 bg-white/5 p-4 print:border-neutral-200 print:bg-white print:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Étape active
                </p>
                <p className="mt-2 text-base font-semibold text-white print:text-neutral-950">
                  {dossier.currentStepTitle}
                </p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-4 print:border-neutral-200 print:bg-white print:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Données retenues
                </p>
                <p className="mt-2 text-2xl font-semibold text-white print:text-neutral-950">
                  {dossier.activeRetainedCount}
                </p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-4 print:border-neutral-200 print:bg-white print:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Moteurs retenus
                </p>
                <p className="mt-2 text-2xl font-semibold text-white print:text-neutral-950">
                  {dossier.retainedModuleCount}/{dossier.totalModuleCount}
                </p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-4 print:border-neutral-200 print:bg-white print:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Schéma
                </p>
                <p className="mt-2 text-base font-semibold text-white print:text-neutral-950">
                  {schema ? `Mis à jour le ${formatDate(schema.updatedAt)}` : "Pas encore enregistré"}
                </p>
              </Card>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 print:border-l-0 print:border-t print:border-neutral-200 print:bg-neutral-50 print:p-6">
            {schema?.thumbnail ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={schema.thumbnail}
                  alt="Aperçu du schéma du projet"
                  className="h-44 w-full rounded-[24px] border border-white/10 object-cover print:border-neutral-200"
                />
                <p className="mt-3 text-sm leading-relaxed text-neutral-300 print:text-neutral-600">
                  Le schéma sauvegardé dans le projet devient la référence du dossier client et du
                  dossier imprimé.
                </p>
              </>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/15 p-6 text-sm leading-relaxed text-neutral-300 print:border-neutral-300 print:text-neutral-600">
                Aucun aperçu de schéma pour l&apos;instant. La couche SaaS est déjà prête : dès que le
                schéma est enregistré dans le projet, il apparaît ici et suit tout le dossier.
              </div>
            )}
            <div className="mt-5 grid gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Projet
                </p>
                <p className="mt-1 text-sm font-medium text-white print:text-neutral-950">
                  {getProjectAssetTypeLabel(project.assetType)} · {getProjectVoltageLabel(project.voltage)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Créé le
                </p>
                <p className="mt-1 text-sm font-medium text-white print:text-neutral-950">
                  {formatDate(project.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 print:text-neutral-500">
                  Mis à jour le
                </p>
                <p className="mt-1 text-sm font-medium text-white print:text-neutral-950">
                  {formatDate(project.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Feuille de route
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Parcours client étape par étape
          </h2>
          <div className="mt-5 grid gap-4">
            {dossier.steps.map((step) => (
              <div key={step.title} className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-neutral-950">{step.title}</h3>
                  <Badge tone={stepTone(step.status)}>
                    {step.status === "done"
                      ? "Validé"
                      : step.status === "current"
                        ? "En cours"
                        : "À venir"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">{step.objective}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Vous faites
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">{step.customerAction}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      FabSystem valide
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                      {step.fabsystemValidation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      À fournir
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">{step.deliverable}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Noyau technique cloud
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Décisions et moteurs du projet
          </h2>

          <div className="mt-5 grid gap-3">
            {dossier.decisionHighlights.length > 0 ? (
              dossier.decisionHighlights.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">{item.label}</p>
                  <p className="mt-1 text-sm text-neutral-700">{item.value}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-600">
                Les décisions techniques retenues apparaîtront ici à mesure que le projet se
                remplit dans le mode guidé, le mode avancé ou l&apos;éditeur de schéma.
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Moteurs suivis
            </p>
            <div className="mt-3 grid gap-3">
              {dossier.engineSnapshots.map((engine) => (
                <div
                  key={engine.label}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-neutral-200 px-4 py-3"
                >
                  <p className="text-sm font-medium text-neutral-800">{engine.label}</p>
                  <Badge tone={engineTone(engine.status)}>{engine.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {dossier.hasKit ? (
        <>
          <section className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Achats centralisés — kit {dossier.kitName}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Liste d&apos;achat pilotée depuis le projet
              </h2>
            </div>

            <Card className="overflow-hidden print:shadow-none">
              <div className="border-b border-neutral-200 px-5 py-4">
                <h3 className="text-base font-semibold text-neutral-950">Base indispensable</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Bloc</th>
                      <th className="px-5 py-3 font-semibold">Article</th>
                      <th className="px-5 py-3 font-semibold">Budget</th>
                      <th className="px-5 py-3 font-semibold print:hidden">Lien</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.purchases
                      .filter((item) => item.priority === "Indispensable")
                      .map((item) => (
                        <tr key={item.name} className="border-t border-neutral-200 align-top">
                          <td className="px-5 py-4 text-neutral-600">{item.block}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-neutral-950">{item.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.why}</p>
                            <p className="mt-2 hidden text-[11px] leading-relaxed text-neutral-500 print:block">
                              {item.href}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-medium text-neutral-900">
                            {formatEuroFromCents(item.budgetCents)}
                          </td>
                          <td className="px-5 py-4 print:hidden">
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-neutral-900 underline underline-offset-4"
                            >
                              Ouvrir
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {dossier.purchases.some((item) => item.priority === "Option officielle") ? (
              <Card className="overflow-hidden print:shadow-none">
                <div className="border-b border-neutral-200 px-5 py-4">
                  <h3 className="text-base font-semibold text-neutral-950">Options officielles</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Bloc</th>
                        <th className="px-5 py-3 font-semibold">Option</th>
                        <th className="px-5 py-3 font-semibold">Budget</th>
                        <th className="px-5 py-3 font-semibold print:hidden">Lien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.purchases
                        .filter((item) => item.priority === "Option officielle")
                        .map((item) => (
                          <tr key={item.name} className="border-t border-neutral-200 align-top">
                            <td className="px-5 py-4">
                              <Badge tone="info">{item.block}</Badge>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-neutral-950">{item.name}</p>
                              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.why}</p>
                              <p className="mt-2 hidden text-[11px] leading-relaxed text-neutral-500 print:block">
                                {item.href}
                              </p>
                            </td>
                            <td className="px-5 py-4 font-medium text-neutral-900">
                              {formatEuroFromCents(item.budgetCents)}
                            </td>
                            <td className="px-5 py-4 print:hidden">
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-neutral-900 underline underline-offset-4"
                              >
                                Ouvrir
                              </a>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}
          </section>

          {dossier.photoControls.length > 0 || dossier.powerControls.length > 0 ? (
            <section className="grid gap-6 xl:grid-cols-2">
              {dossier.photoControls.length > 0 ? (
                <Card className="p-5 print:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Contrôles photos
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                    Avant branchement
                  </h2>
                  <div className="mt-5 grid gap-3">
                    {dossier.photoControls.map((item) => (
                      <div key={item.title} className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                          <Badge tone="warning">{item.statusLabel}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {dossier.powerControls.length > 0 ? (
                <Card className="p-5 print:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Checklist sécurité
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                    Mise sous tension
                  </h2>
                  <div className="mt-5 grid gap-3">
                    {dossier.powerControls.map((item) => (
                      <div key={item.title} className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                          <Badge tone="neutral">{item.statusLabel}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-5 print:shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Budget repère
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Base et version complète
              </h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Base indispensable
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">
                    {formatEuroFromCents(dossier.budgetBaseCents)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Avec options
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">
                    {formatEuroFromCents(dossier.budgetWithOptionsCents)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden print:shadow-none">
              <div className="border-b border-neutral-200 px-5 py-4">
                <h3 className="text-base font-semibold text-neutral-950">Répartition par bloc</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Bloc</th>
                      <th className="px-5 py-3 font-semibold">Budget indicatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.budgetLines.map((line) => (
                      <tr key={line.block} className="border-t border-neutral-200">
                        <td className="px-5 py-4 font-medium text-neutral-800">{line.block}</td>
                        <td className="px-5 py-4 font-semibold text-neutral-950">
                          {formatEuroFromCents(line.budgetCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {dossier.dossierChecklist.length > 0 ? (
            <section className="rounded-[32px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6 print:rounded-none print:border print:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Dossier final
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Checklist avant impression
              </h2>
              <div className="mt-5 grid gap-3">
                {dossier.dossierChecklist.map((item) => (
                  <div key={item} className="rounded-[20px] border border-neutral-200 bg-white px-4 py-3">
                    <p className="text-sm leading-relaxed text-neutral-800">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
