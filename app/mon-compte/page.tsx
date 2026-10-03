import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/format";
import { getCustomerAccountOverview } from "@/lib/services/customer-account";
import { getDossierForCustomer } from "@/lib/services/dossier-client";
import {
  getCustomerDashboardContext,
  resolveLinkedCoaching,
  resolveSelectedCoaching,
  resolveSelectedProject,
} from "@/lib/services/customer-dashboard";
import { getCoachingNextSteps } from "@/lib/services/coaching-next-steps";
import { getProjectValues } from "@/lib/services/project-values";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getProjectAssetTypeLabel, getProjectStatusLabel, getProjectVoltageLabel } from "@/lib/project-labels";
import { getCoachingProjectStatusLabel } from "@/lib/dashboard-status-labels";
import { PendingImportBanner } from "@/components/customer/dashboard/PendingImportBanner";
import { listRegisteredEngineIds } from "@/lib/engines/index";
import type { RegisteredEngineId } from "@/lib/engine-payload";
import { moduleStatus } from "@/lib/project-module-status";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { VOLTA_MESSAGES } from "@/lib/volta/messages";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Votre espace client FabSystem.",
  alternates: { canonical: "/mon-compte" },
  robots: { index: false, follow: false },
};

// Lot 2 (PROMPT_CLAUDE_DASHBOARD_CLIENT_V1.md, 02/10/2026 — corrigé après
// revue du 02/10/2026) : accueil lisible et orienté action, construit sur
// le contexte commun du Lot 1 (lib/services/customer-dashboard.ts). Ordre
// imposé par le prompt : 1. projet sélectionné, 2. prochaine action réelle,
// 3. aperçu du schéma, 4. prochain rendez-vous, 5. ressources déjà
// disponibles, 6. aide/contact.
export default async function MonComptePage() {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";

  const [context, overview, legacyDossier] = await Promise.all([
    getCustomerDashboardContext(customerId),
    getCustomerAccountOverview(customerId),
    getDossierForCustomer(customerId),
  ]);

  const selectedProject = resolveSelectedProject(context);
  // L'accompagnement lié au projet affiché prime (histoire cohérente) ;
  // à défaut, l'accompagnement actif le plus récent est quand même affiché
  // — revue du 02/10/2026 : un CoachingProject sans schéma rattaché ne doit
  // jamais devenir invisible sur cet accueil, et ne doit jamais se voir
  // attribuer un projet auquel il n'est pas explicitement lié.
  const linkedCoaching = selectedProject ? resolveLinkedCoaching(context, selectedProject.id) : null;
  const selectedCoaching = linkedCoaching ?? resolveSelectedCoaching(context);
  const nextSteps = selectedCoaching ? await getCoachingNextSteps(selectedCoaching.id) : null;

  // UI-14 §18 — Volta n'apparaît que si elle a une info réelle à donner.
  // Revue du 02/10/2026 : l'incitation "modules à compléter" ne doit
  // s'afficher QUE pour un projet autonome (pas de coaching actif) — un
  // client accompagné n'a pas à être relancé pour compléter tous les
  // calculateurs lui-même, c'est le rôle du coach pendant l'appel (Lot 2 :
  // "ne pas l'envoyer compléter tous les calculateurs par défaut"). L'alerte
  // de valeurs obsolètes, elle, reste toujours affichée : c'est un vrai
  // problème de cohérence, jamais une relance de travail.
  const selectedProjectValues = selectedProject ? await getProjectValues(selectedProject.id) : [];
  const selectedProjectObsoleteCount = selectedProjectValues.filter((rv) => rv.status === "OBSOLETE").length;
  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];
  const selectedProjectUncompletedCount =
    selectedProject && !linkedCoaching
      ? engineIds.filter((id) => moduleStatus(id, selectedProjectValues) === "À compléter").length
      : 0;

  // N'affiche l'ancien écran "Mon accompagnement" que lorsque rien ne prouve
  // qu'il a déjà été repris dans CoachingProject (orderId partagé) — jamais
  // caché par défaut (un ancien dossier non repris ne doit jamais
  // disparaître), mais jamais dupliqué quand la reprise est prouvée.
  const showLegacyDossierCard =
    legacyDossier !== null && (context.legacyDossier.kind === "none" || !context.legacyDossier.absorbedByMatchingOrderId);

  // 5. Ressources déjà disponibles — revue du 02/10/2026 : un intitulé par
  // ressource avec une action de téléchargement réelle, jamais un simple
  // compteur avec un badge générique. Réutilise les routes de téléchargement
  // déjà existantes (app/mon-compte/achats/page.tsx), aucune nouvelle route.
  const resourceItems = [
    ...overview.offeredResources.map((resource) => ({
      key: resource.grantId,
      name: resource.productName,
      href: `/api/customer-resources/${resource.grantId}`,
    })),
    ...overview.orders.flatMap((order) =>
      order.downloads.map((download) => ({
        key: download.grantId,
        name: download.productName,
        href: `/api/downloads/${download.grantId}`,
      }))
    ),
  ];
  const VISIBLE_RESOURCE_COUNT = 3;
  const visibleResources = resourceItems.slice(0, VISIBLE_RESOURCE_COUNT);
  const hiddenResourceCount = resourceItems.length - visibleResources.length;

  // "Un client qui possède uniquement un ebook ne doit pas créer de projet
  // pour le lire" — si le client n'a ni projet ni accompagnement mais a des
  // ressources, on ne pousse pas la création d'un projet en avant.
  const hasNoProjectContext = !selectedProject && !selectedCoaching;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Accueil</h1>
        <p className="mt-1 text-sm text-neutral-600">Retrouvez votre projet, votre schéma et votre prochaine étape.</p>
      </div>

      <PendingImportBanner />

      {/* 1. Projet/support sélectionné et état compréhensible */}
      {selectedProject ? (
        <section>
          <Card className="border-2 border-neutral-900 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Votre projet</p>
              <Badge tone="neutral">{getProjectStatusLabel(selectedProject.status)}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-neutral-950">{selectedProject.name}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {getProjectAssetTypeLabel(selectedProject.assetType)} · {getProjectVoltageLabel(selectedProject.voltage)} · Modifié le{" "}
              {formatDate(selectedProject.updatedAt)}
            </p>
            {linkedCoaching ? (
              <p className="mt-3 text-sm text-neutral-700">
                Accompagnement « {linkedCoaching.title} » — {getCoachingProjectStatusLabel(linkedCoaching.status)}.
              </p>
            ) : null}
            {selectedProjectObsoleteCount > 0 ? (
              <VoltaGuide variant="warning" pose="perplexe" className="mt-3">
                {VOLTA_MESSAGES.dashboardObsolete(selectedProjectObsoleteCount)}
              </VoltaGuide>
            ) : selectedProjectUncompletedCount > 0 ? (
              <VoltaGuide variant="next" pose="confiante" className="mt-3">
                {VOLTA_MESSAGES.dashboardTodo(selectedProjectUncompletedCount)}
              </VoltaGuide>
            ) : null}
            {context.projects.length > 1 ? (
              <Link href="/mon-compte/projets" className="mt-3 inline-block text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950">
                Voir mes autres projets ({context.projects.length}) →
              </Link>
            ) : null}
          </Card>
        </section>
      ) : selectedCoaching ? (
        // Accompagnement en cours mais aucun schéma encore rattaché (cas
        // réel, pas une erreur) — affiché honnêtement plutôt que masqué.
        <section>
          <Card className="border-2 border-neutral-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Votre accompagnement</p>
            <h2 className="mt-2 text-lg font-semibold text-neutral-950">{selectedCoaching.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{getCoachingProjectStatusLabel(selectedCoaching.status)}</p>
            <p className="mt-3 text-sm text-neutral-600">Aucun schéma n&apos;est encore rattaché à cet accompagnement.</p>
          </Card>
        </section>
      ) : hasNoProjectContext && resourceItems.length === 0 ? (
        <section>
          <Card className="p-6 text-center">
            <p className="text-sm font-semibold text-neutral-950">Vous n&apos;avez pas encore de projet.</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Un projet centralise votre installation : ce que vous avez renseigné, ce que vous avez retenu, et ce qui reste à compléter.
            </p>
            <div className="mt-4">
              <Button href="/mon-compte/projets/nouveau" variant="primary">
                Créer mon premier projet
              </Button>
            </div>
          </Card>
        </section>
      ) : null}

      {/* 2. Prochaine action réelle (actions CLIENT ouvertes uniquement) */}
      {selectedCoaching ? (
        <section>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">À faire de votre côté</p>
            {nextSteps?.nextClientAction ? (
              <>
                <p className="mt-2 text-base font-semibold text-neutral-950">{nextSteps.nextClientAction.label}</p>
                {nextSteps.nextClientAction.dueDate ? (
                  <p className="mt-1 text-sm text-neutral-600">Échéance : {formatDate(nextSteps.nextClientAction.dueDate)}</p>
                ) : null}
                <div className="mt-4">
                  <Button href={`/mon-compte/mon-van/${selectedCoaching.id}`} variant="primary">
                    Continuer →
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">Rien à faire de votre côté pour l&apos;instant.</p>
            )}
          </Card>
        </section>
      ) : null}

      {/* 3. Aperçu du schéma courant et accès direct */}
      {selectedProject ? (
        <section>
          <Card className="p-5">
            {selectedProject.hasSchema ? (
              <div className="flex flex-wrap items-start gap-4">
                {selectedProject.schemaThumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProject.schemaThumbnail}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center text-[11px] leading-tight text-neutral-400">
                    Aperçu indisponible
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Votre schéma</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {selectedProject.schemaUpdatedAt ? `Enregistré le ${formatDate(selectedProject.schemaUpdatedAt)}` : "Statut inconnu"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* /suivi affiche un résumé du dossier (statut, miniature) — pas
                        encore une consultation zoomable du dessin lui-même (Lot 3,
                        pas construit à ce stade) : libellé honnête sur ce qui existe
                        aujourd'hui. L'éditeur reste le seul accès réel au dessin. */}
                    <Button href={`/mon-compte/projets/${selectedProject.id}/suivi`} variant="secondary">
                      Voir le dossier du projet →
                    </Button>
                    <Button href={`/outils/schema?projectId=${selectedProject.id}`} variant="secondary">
                      Ouvrir le schéma dans l&apos;éditeur →
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Votre schéma</p>
                <p className="mt-2 text-sm text-neutral-600">Aucun schéma n&apos;a encore été enregistré pour ce projet.</p>
                <div className="mt-4">
                  <Button href={`/outils/schema?projectId=${selectedProject.id}`} variant="secondary">
                    Commencer mon schéma →
                  </Button>
                </div>
              </>
            )}
          </Card>
        </section>
      ) : null}

      {/* 4. Prochain rendez-vous non annulé */}
      {selectedCoaching ? (
        <section>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Prochain rendez-vous</p>
            {nextSteps?.nextAppointment ? (
              <>
                <p className="mt-2 text-base font-semibold text-neutral-950">{formatDateTime(nextSteps.nextAppointment.scheduledAt)}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Durée prévue : {nextSteps.nextAppointment.durationMinutes} min
                  {nextSteps.nextAppointment.channel ? ` · ${nextSteps.nextAppointment.channel}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">Aucun rendez-vous prévu pour l&apos;instant.</p>
            )}
          </Card>
        </section>
      ) : null}

      {showLegacyDossierCard ? (
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-950">Mon accompagnement</h2>
            <Link href="/mon-compte/mon-accompagnement" className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950">
              Voir le détail →
            </Link>
          </div>
          <Card className="mt-4 p-5">
            <p className="text-sm text-neutral-700">Un dossier d&apos;accompagnement est en cours de suivi.</p>
            <div className="mt-4">
              <Button href="/mon-compte/mon-accompagnement" variant="primary">
                Voir mon dossier →
              </Button>
            </div>
          </Card>
        </section>
      ) : null}

      {/* 5. Ressources déjà disponibles */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">Mes ressources</h2>
          <Link href="/mon-compte/achats" className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950">
            Voir tous mes achats →
          </Link>
        </div>

        <Card className="mt-4 p-5">
          {resourceItems.length === 0 ? (
            <p className="text-sm text-neutral-600">
              {hasNoProjectContext
                ? "Aucune ressource disponible pour le moment."
                : "Aucune ressource disponible pour le moment — vos ebooks et guides apparaîtront ici."}
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleResources.map((resource) => (
                <li key={resource.key} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-700">{resource.name}</p>
                  <Button href={resource.href} variant="secondary">
                    Télécharger →
                  </Button>
                </li>
              ))}
              {hiddenResourceCount > 0 ? (
                <li>
                  <Link href="/mon-compte/achats" className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950">
                    Voir les {hiddenResourceCount} autre{hiddenResourceCount > 1 ? "s" : ""} ressource{hiddenResourceCount > 1 ? "s" : ""} →
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </Card>
      </section>

      {/* 6. Aide/contact */}
      <p className="text-center text-sm text-neutral-500">
        Une question ? <Link href="/contact" className="font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950">Contactez Fabien</Link>.
      </p>
    </div>
  );
}
