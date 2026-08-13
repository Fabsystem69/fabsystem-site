import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { STANDARD_PROJECT_LIMIT, listProjectsForCustomer } from "@/lib/services/project";
import { getProjectValues } from "@/lib/services/project-values";
import { getCustomerAccountOverview } from "@/lib/services/customer-account";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getProjectAssetTypeLabel, getProjectVoltageLabel } from "@/lib/project-labels";
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

// Espace client V2 (UI-8) — Accueil. Écran d'orientation (MASTER-12 §102),
// pas un cockpit de KPI : projet récent + résumé achats réels, aucun faux
// score ni statistique décorative (MASTER-06 §22).
export default async function MonComptePage() {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";

  const [projects, overview] = await Promise.all([
    listProjectsForCustomer(actor, customerId),
    getCustomerAccountOverview(customerId),
  ]);

  const recentProject = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  // UI-14 §18 — Volta n'apparaît ici que si elle a une info réelle à
  // donner (dérivée des valeurs retenues), jamais un message générique.
  const recentProjectValues = recentProject ? await getProjectValues(recentProject.id) : [];
  const recentObsoleteCount = recentProjectValues.filter((rv) => rv.status === "OBSOLETE").length;
  const engineIds = listRegisteredEngineIds() as RegisteredEngineId[];
  const recentUncompletedCount = recentProject
    ? engineIds.filter((id) => moduleStatus(id, recentProjectValues) === "À compléter").length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Accueil</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Retrouvez vos projets et vos achats FabSystem.
        </p>
      </div>

      <PendingImportBanner />

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">Mes projets</h2>
          <Link
            href="/mon-compte/projets"
            className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
          >
            Voir tous mes projets ({projects.length}/{STANDARD_PROJECT_LIMIT}) →
          </Link>
        </div>

        {recentProject ? (
          <Card className="mt-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Reprendre votre projet
            </p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-950">{recentProject.name}</h3>
            <p className="mt-1 text-sm text-neutral-600">
              {getProjectAssetTypeLabel(recentProject.assetType)} ·{" "}
              {getProjectVoltageLabel(recentProject.voltage)} · Modifié le{" "}
              {formatDate(recentProject.updatedAt)}
            </p>
            {recentObsoleteCount > 0 ? (
              <VoltaGuide variant="warning" pose="perplexe" className="mt-3">
                {VOLTA_MESSAGES.dashboardObsolete(recentObsoleteCount)}
              </VoltaGuide>
            ) : recentUncompletedCount > 0 ? (
              <VoltaGuide variant="next" pose="confiante" className="mt-3">
                {VOLTA_MESSAGES.dashboardTodo(recentUncompletedCount)}
              </VoltaGuide>
            ) : null}
            <div className="mt-4">
              <Button href={`/mon-compte/projets/${recentProject.id}`} variant="primary">
                Continuer →
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mt-4 p-6 text-center">
            <Image
              src="/volta/volta-accueillant-bras-ouverts.png"
              alt=""
              width={72}
              height={72}
              className="mx-auto h-[72px] w-[72px] object-contain"
            />
            <p className="mt-2 text-sm font-semibold text-neutral-950">
              Vous n&apos;avez pas encore de projet.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Un projet centralise votre installation : ce que vous avez renseigné, ce que vous
              avez retenu, et ce qui reste à compléter.
            </p>
            <div className="mt-4">
              <Button href="/mon-compte/projets/nouveau" variant="primary">
                Créer mon premier projet
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">Mes achats</h2>
          <Link
            href="/mon-compte/achats"
            className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
          >
            Voir tous mes achats →
          </Link>
        </div>

        <Card className="mt-4 p-5">
          {overview.orders.length === 0 ? (
            <p className="text-sm text-neutral-600">Aucun achat pour le moment.</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-700">
                {overview.orders.length} commande{overview.orders.length > 1 ? "s" : ""}
              </p>
              <Badge tone="neutral">
                {overview.orders.reduce((sum, o) => sum + o.downloads.length, 0)} téléchargement
                {overview.orders.reduce((sum, o) => sum + o.downloads.length, 0) > 1 ? "s" : ""}{" "}
                disponible
                {overview.orders.reduce((sum, o) => sum + o.downloads.length, 0) > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
