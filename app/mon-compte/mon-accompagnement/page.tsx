import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { buildWhatsAppLink, getDossierStepStatuses, isTimelineOffre } from "@/lib/dossier-client";
import {
  getDossierForCustomer,
  getIncludedAccessForCustomer,
  listDossierDocuments,
} from "@/lib/services/dossier-client";
import { prisma } from "@/lib/prisma";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { uploadOwnDossierDocumentAction } from "./actions";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const metadata: Metadata = {
  title: "Mon accompagnement",
  description: "Suivi de votre prestation d'accompagnement FabSystem.",
  robots: { index: false, follow: false },
};

const OFFER_LABELS: Record<string, string> = {
  DECOUVERTE: "Appel découverte",
  CONSEIL: "Appel conseil",
  GUIDE: "Accompagnement guidé",
  CONCEPTION: "Conception complète",
};

function stepTone(status: "done" | "current" | "upcoming") {
  if (status === "done") return "success" as const;
  if (status === "current") return "info" as const;
  return "neutral" as const;
}

export default async function MonAccompagnementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Compte introuvable.</p>
      </Card>
    );
  }

  const [dossier, includedAccess] = await Promise.all([
    getDossierForCustomer(customer.id),
    getIncludedAccessForCustomer(customer.id, customer.email),
  ]);

  const documents = dossier ? await listDossierDocuments(dossier.id) : [];

  if (!dossier) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Accompagnement</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Mon accompagnement</h1>
        </div>
        <Card className="p-6">
          <p className="text-sm leading-relaxed text-neutral-700">
            Vous n&apos;avez pas encore de dossier d&apos;accompagnement en cours. Découvrez nos prestations sur la page{" "}
            <Link href="/prestations/accompagnement" className="underline underline-offset-4">
              accompagnement
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  const offerLabel = OFFER_LABELS[dossier.offre] ?? dossier.offre;
  const whatsappMessage = `Bonjour, j'ai une question sur mon projet ${offerLabel.toLowerCase()}.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Accompagnement</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{offerLabel}</h1>
        </div>
        {dossier.whatsapp ? (
          <Button href={buildWhatsAppLink(dossier.whatsapp, whatsappMessage)} variant="secondary">
            Discuter sur WhatsApp
          </Button>
        ) : null}
      </div>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {isTimelineOffre(dossier.offre) ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Où en est votre dossier</h2>
          <div className="mt-4 space-y-3">
            {getDossierStepStatuses(dossier.offre, dossier.etapeOverride ?? dossier.etapeActuelle).map((step) => (
              <div key={step.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-neutral-950">{step.title}</p>
                  <Badge tone={stepTone(step.status)}>
                    {step.status === "done" ? "Fait" : step.status === "current" ? "En cours" : "À venir"}
                  </Badge>
                </div>
                {step.isIterative && step.status === "current" ? (
                  <p className="mt-2 text-sm text-neutral-600">
                    En général 2 à 4 allers-retours avant validation — c&apos;est normal de ne pas être fixé dès le premier
                    échange.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Statut</h2>
          <div className="mt-3">
            <Badge tone={dossier.statutSimple === "FAIT" ? "success" : "warning"}>
              {dossier.statutSimple === "FAIT" ? "Fait" : "À venir"}
            </Badge>
          </div>
          {dossier.compteRendu ? <p className="mt-3 text-sm leading-relaxed text-neutral-700">{dossier.compteRendu}</p> : null}
        </Card>
      )}

      {includedAccess.hasEditorAccess || includedAccess.hasEbookOffer ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Vos accès inclus</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {includedAccess.hasEditorAccess ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-950">Éditeur de schéma — accès complet</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {includedAccess.editorExpiresAt
                    ? `Jusqu'au ${formatDate(includedAccess.editorExpiresAt)}`
                    : "Accès actif"}
                </p>
                <Link href="/outils/schema" className="mt-2 inline-block text-sm underline underline-offset-4">
                  Ouvrir l&apos;éditeur
                </Link>
              </div>
            ) : null}
            {includedAccess.hasEbookOffer ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-950">Ebook offert</p>
                <p className="mt-1 text-sm text-neutral-600">Disponible dans vos achats.</p>
                <Link href="/mon-compte/achats" className="mt-2 inline-block text-sm underline underline-offset-4">
                  Voir mes achats
                </Link>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Documents partagés</h2>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">Aucun document pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-950">{document.filename}</p>
                  <p className="text-xs text-neutral-500">{formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}</p>
                </div>
                <a href={`/api/dossiers/documents/${document.id}`} className="shrink-0 text-sm font-semibold underline underline-offset-2">
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        )}

        <form action={uploadOwnDossierDocumentAction} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-900">Envoyer un document ou une photo</span>
            <input
              name="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              required
              className="block text-sm text-neutral-700"
            />
            <span className="block text-xs text-neutral-500">PDF, PNG, JPEG ou WEBP — 2 Mo max par fichier.</span>
          </label>
          <Button type="submit" variant="secondary">Envoyer</Button>
        </form>
      </Card>

      {dossier.dateLivraison ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Dossier livré</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Livré le {formatDate(dossier.dateLivraison)}. Un grand merci pour votre confiance — si vous avez deux minutes,
            votre témoignage aide d&apos;autres personnes à se lancer.
          </p>
          <Link href="/temoignage" className="mt-3 inline-block">
            <Button variant="secondary">Laisser mon témoignage</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
