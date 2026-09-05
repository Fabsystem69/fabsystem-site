import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PlansComparisonTable } from "@/components/public/PlansComparisonTable";
import { SchemaEditorPlusCheckoutButton } from "@/components/schema-editor/SchemaEditorPlusCheckoutButton";
import { SchemaEditorPlusPortalButton } from "@/components/schema-editor/SchemaEditorPlusPortalButton";
import { formatDate } from "@/lib/format";
import { forbidden } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { SCHEMA_EDITOR_PLUS_PLANS, getSchemaEditorPlusSummary } from "@/lib/services/schema-editor-plus";

export const metadata: Metadata = {
  title: "Éditeur Plus",
  description: "Votre accès Éditeur Plus FabSystem.",
  robots: { index: false, follow: false },
};

export default async function EditeurPlusPage({ searchParams }: { searchParams?: Promise<{ subscription?: string }> }) {
  const actor = await requireCustomerActor();
  if (actor.role !== "customer") throw forbidden("Customer account required");
  const [summary, params] = await Promise.all([getSchemaEditorPlusSummary(actor.customerId), searchParams]);
  const subscription = summary.subscription;
  const activeLabel = summary.includedWithAccompaniment
    ? "Inclus avec votre accompagnement"
    : subscription?.status === "TRIALING" ? "Période d'essai" : "Éditeur Plus actif";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Éditeur de schéma</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Éditeur Plus</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600">Plus de place pour vos installations, vos versions et vos partages, sans toucher à vos schémas existants.</p>
        </div>
        <Link href="/outils/schema/editeur" className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-300">Ouvrir l&apos;éditeur</Link>
      </div>

      {params?.subscription === "success" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Paiement confirmé par Stripe. Votre accès est activé dans quelques instants.</div> : null}
      {params?.subscription === "cancelled" ? <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">Le paiement a été annulé. Votre espace reste accessible en gratuit.</div> : null}

      {!summary.active ? <PlansComparisonTable /> : null}

      {summary.active ? (
        <Card className="border-emerald-200 bg-emerald-50/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{activeLabel}</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-950">Vos projets avancés sont couverts.</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">Projets et consommateurs illimités, historique des versions, exports complets et partage de vos schémas.</p>
          {subscription?.currentPeriodEndsAt ? <p className="mt-3 text-sm text-neutral-600">{subscription.cancelAtPeriodEnd ? "Fin d'accès prévue le" : "Prochain renouvellement le"} {formatDate(subscription.currentPeriodEndsAt)}.</p> : null}
          {subscription ? <div className="mt-5"><SchemaEditorPlusPortalButton /></div> : null}
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Hebdomadaire</p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">{SCHEMA_EDITOR_PLUS_PLANS.weekly.label}</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">2,90 € <span className="text-base font-medium text-neutral-500">/ semaine</span></p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">Pour tester sur un projet ponctuel, sans engagement.</p>
            <div className="mt-5"><SchemaEditorPlusCheckoutButton plan="weekly" className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50">Choisir l&apos;hebdomadaire</SchemaEditorPlusCheckoutButton></div>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Mensuel</p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">{SCHEMA_EDITOR_PLUS_PLANS.monthly.label}</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">6,90 € <span className="text-base font-medium text-neutral-500">/ mois</span></p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">Pour avancer sans engagement sur votre installation.</p>
            <div className="mt-5"><SchemaEditorPlusCheckoutButton plan="monthly" className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50">Choisir le mensuel</SchemaEditorPlusCheckoutButton></div>
          </Card>
          <Card className="border-amber-300 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Le plus choisi</p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-950">{SCHEMA_EDITOR_PLUS_PLANS.yearly.label}</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">59 € <span className="text-base font-medium text-neutral-600">/ an</span></p>
            <p className="mt-1 text-sm font-medium text-amber-900">4,92 € par mois · près de 4 mois offerts</p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">Le bon rythme pour concevoir, installer et ajuster sans pression.</p>
            <div className="mt-5"><SchemaEditorPlusCheckoutButton plan="yearly" className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800">Choisir l&apos;annuel</SchemaEditorPlusCheckoutButton></div>
          </Card>
        </section>
      )}

      <Card className="p-6">
        <h2 className="text-base font-semibold text-neutral-950">À la fin d&apos;Éditeur Plus</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">Vous gardez tous vos schémas. Un projet compatible avec les limites gratuites (1 projet, 3 consommateurs) redevient modifiable ; les autres restent consultables.</p>
      </Card>
    </div>
  );
}
