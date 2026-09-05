import Link from "next/link";
import { formatCustomerDisplayName, formatDate } from "@/lib/format";
import {
  getDossierActivityTone,
  getDossierOffreLabel,
  getDossierStatutSimpleLabel,
} from "@/lib/dashboard-status-labels";
import { getDossierSteps, isTimelineOffre } from "@/lib/dossier-client";
import { listDossiers } from "@/lib/services/dossier-client";
import {
  DashboardPageShell,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  adminTableBodyClass,
  adminTableCellClass,
  adminTableCellStrongClass,
  adminTableHeadCellClass,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

function currentStepTitle(offre: string, etapeActuelle: string | null) {
  if (!isTimelineOffre(offre)) return null;
  if (!etapeActuelle) return "Non démarré";
  const step = getDossierSteps(offre).find((s) => s.key === etapeActuelle);
  return step?.title ?? etapeActuelle;
}

export default async function DashboardAccompagnementsPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre: offreFilter } = await searchParams;
  const allDossiers = await listDossiers();
  const dossiers = offreFilter ? allDossiers.filter((d) => d.offre === offreFilter) : allDossiers;
  const now = new Date();

  const counts = {
    DECOUVERTE: allDossiers.filter((d) => d.offre === "DECOUVERTE").length,
    CONSEIL: allDossiers.filter((d) => d.offre === "CONSEIL").length,
    GUIDE: allDossiers.filter((d) => d.offre === "GUIDE").length,
    CONCEPTION: allDossiers.filter((d) => d.offre === "CONCEPTION").length,
  };

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title="Accompagnements"
        backHref="/dashboard"
        backLabel="Retour au dashboard"
        description="Suivi des prestations d'accompagnement achetées — indépendant des projets de l'éditeur de schéma."
        actions={
          <AdminButton variant="primary" href="/dashboard/accompagnements/new">
            Créer un dossier
          </AdminButton>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {(["DECOUVERTE", "CONSEIL", "GUIDE", "CONCEPTION"] as const).map((key) => (
          <Link
            key={key}
            href={offreFilter === key ? "/dashboard/accompagnements" : `/dashboard/accompagnements?offre=${key}`}
            className={`rounded-2xl border p-4 transition-colors ${
              offreFilter === key ? "border-brand-400 bg-brand-400/10" : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{getDossierOffreLabel(key)}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{counts[key]}</p>
          </Link>
        ))}
      </div>

      {dossiers.length === 0 ? (
        <AdminEmptyState title="Aucun dossier pour l'instant." description="Les dossiers se créent automatiquement à l'achat d'une prestation, ou manuellement pour l'appel découverte." />
      ) : (
        <AdminTable>
          <thead className={adminTableHeadClass}>
            <tr>
              <th className={adminTableHeadCellClass}>Client</th>
              <th className={adminTableHeadCellClass}>Offre</th>
              <th className={adminTableHeadCellClass}>Étape / statut</th>
              <th className={adminTableHeadCellClass}>Dernière activité</th>
              <th className={adminTableHeadCellClass}>Action</th>
            </tr>
          </thead>
          <tbody className={adminTableBodyClass}>
            {dossiers.map((dossier) => (
              <tr key={dossier.id} className={adminTableRowClass}>
                <td className={adminTableCellStrongClass}>
                  <div>{formatCustomerDisplayName(dossier.customer)}</div>
                  <div className="text-xs font-normal text-neutral-500">{dossier.customer.email}</div>
                </td>
                <td className={adminTableCellClass}>{getDossierOffreLabel(dossier.offre)}</td>
                <td className={adminTableCellClass}>
                  {isTimelineOffre(dossier.offre)
                    ? currentStepTitle(dossier.offre, dossier.etapeOverride ?? dossier.etapeActuelle)
                    : dossier.statutSimple
                      ? getDossierStatutSimpleLabel(dossier.statutSimple)
                      : "—"}
                </td>
                <td className={adminTableCellClass}>
                  <AdminBadge tone={getDossierActivityTone(dossier.derniereActivite, now)}>
                    {formatDate(dossier.derniereActivite)}
                  </AdminBadge>
                </td>
                <td className={adminTableCellClass}>
                  <AdminButton href={`/dashboard/accompagnements/${dossier.id}`} variant="secondary" size="sm">
                    Ouvrir
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </DashboardPageShell>
  );
}
