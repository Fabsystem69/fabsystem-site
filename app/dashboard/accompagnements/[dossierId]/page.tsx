import {
  DashboardPageShell,
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPageHeader,
} from "@/components/dashboard/ui";
import Link from "next/link";
import { formatCustomerDisplayName, formatDate, formatDateTime, formatDateTimeForInput } from "@/lib/format";
import {
  getDossierOffreLabel,
  getDossierStatutSimpleLabel,
  getDossierStatutSimpleTone,
} from "@/lib/dashboard-status-labels";
import { buildWhatsAppLink, getDossierStepStatuses, isTimelineOffre } from "@/lib/dossier-client";
import { PRESTATIONS_NEEDS_PROGRESS_LABELS } from "@/lib/prestations-needs";
import { getDossierForDetail, listDossierDocuments } from "@/lib/services/dossier-client";
import { getProjectAssetTypeLabel, getProjectStatusLabel } from "@/lib/project-labels";
import { listProjectsForCustomer } from "@/lib/services/project";
import { adminActor } from "@/lib/server/project-actor";
import { getSchemaTemplatesByVehicleGroup } from "@/features/schemas/templates";
import {
  addDossierIterationAction,
  advanceDossierStepAction,
  createDossierAppointmentAction,
  createProjectForDossierAction,
  deleteDossierAppointmentAction,
  deleteDossierDocumentAction,
  setDossierAppointmentSummaryAction,
  setDossierDeliveredAction,
  setDossierWhatsappAction,
  updateDossierAppointmentAction,
  updateDossierNotesInternesAction,
  updateDossierSimpleStatusAction,
  uploadDossierDocumentAction,
} from "../actions";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const dynamic = "force-dynamic";

function stepTone(status: "done" | "current" | "upcoming") {
  if (status === "done") return "success" as const;
  if (status === "current") return "info" as const;
  return "neutral" as const;
}

function eventLabel(type: string) {
  if (type === "STEP_CHANGE") return "Changement d'étape";
  if (type === "ITERATION") return "Itération";
  return "Note";
}

export default async function DashboardDossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ dossierId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { dossierId } = await params;
  const { error, success } = await searchParams;
  const [dossier, documents] = await Promise.all([
    getDossierForDetail(dossierId),
    listDossierDocuments(dossierId),
  ]);
  const projects = await listProjectsForCustomer(adminActor(), dossier.customerId);
  const templateGroups = getSchemaTemplatesByVehicleGroup();

  const whatsappMessage = `Bonjour ${dossier.customer.name ?? ""}, ici Fabien de FabSystem au sujet de votre ${getDossierOffreLabel(dossier.offre).toLowerCase()}.`.trim();

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title={formatCustomerDisplayName(dossier.customer)}
        backHref="/dashboard/accompagnements"
        backLabel="Retour aux accompagnements"
        description={
          dossier.dateLivraison
            ? `${getDossierOffreLabel(dossier.offre)} · Livré le ${formatDate(dossier.dateLivraison)}`
            : `${getDossierOffreLabel(dossier.offre)} · Dernière activité le ${formatDate(dossier.derniereActivite)}`
        }
        actions={
          <>
            {dossier.whatsapp ? (
              <AdminButton href={buildWhatsAppLink(dossier.whatsapp, whatsappMessage)} variant="primary">
                Discuter sur WhatsApp
              </AdminButton>
            ) : null}
            <form action={setDossierDeliveredAction}>
              <input type="hidden" name="dossierId" value={dossier.id} />
              <input type="hidden" name="delivered" value={dossier.dateLivraison ? "false" : "true"} />
              <AdminButton type="submit" variant="secondary">
                {dossier.dateLivraison ? "Annuler le marquage \"livré\"" : "Marquer comme livré"}
              </AdminButton>
            </form>
          </>
        }
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <AdminCard title="Contact">
          <div className="space-y-1 text-sm text-neutral-300">
            <p>{dossier.customer.email}</p>
            <p>{dossier.whatsapp ?? "Aucun numéro WhatsApp renseigné"}</p>
          </div>
          <form action={setDossierWhatsappAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Numéro WhatsApp
              <input
                name="whatsapp"
                type="tel"
                defaultValue={dossier.whatsapp ?? ""}
                placeholder="+33612345678"
                className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
              />
            </label>
            <AdminButton type="submit" variant="secondary" size="sm">Enregistrer</AdminButton>
          </form>
        </AdminCard>

        <AdminCard title="Besoin exprimé à l'achat">
          {dossier.besoinVehicule || dossier.besoinDescription ? (
            <div className="space-y-2 text-sm text-neutral-300">
              <p><span className="text-neutral-500">Véhicule / bateau :</span> {dossier.besoinVehicule ?? "—"}</p>
              <p><span className="text-neutral-500">Description :</span> {dossier.besoinDescription ?? "—"}</p>
              <p>
                <span className="text-neutral-500">Avancement :</span>{" "}
                {dossier.besoinProgress
                  ? PRESTATIONS_NEEDS_PROGRESS_LABELS[dossier.besoinProgress as keyof typeof PRESTATIONS_NEEDS_PROGRESS_LABELS] ?? dossier.besoinProgress
                  : "—"}
              </p>
              <p><span className="text-neutral-500">Délai :</span> {dossier.besoinDeadline ?? "—"}</p>
              <p><span className="text-neutral-500">Autre :</span> {dossier.besoinAutre ?? "—"}</p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Aucune réponse enregistrée (dossier créé manuellement).</p>
          )}
        </AdminCard>
      </section>

      <AdminCard title="Schéma électrique" description="Créez le schéma directement sur le compte du client pendant la prestation.">
        {projects.length > 0 ? (
          <ul className="divide-y divide-neutral-800/80">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-100">{project.name}</p>
                  <p className="truncate text-neutral-500">
                    {getProjectAssetTypeLabel(project.assetType)} · {getProjectStatusLabel(project.status)}
                  </p>
                </div>
                <Link
                  href={`/outils/schema/editeur?projectId=${project.id}`}
                  className="shrink-0 rounded-md border border-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:border-brand-400 hover:text-white"
                >
                  Ouvrir le schéma
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Aucun schéma pour l&apos;instant.</p>
        )}
        <form action={createProjectForDossierAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Nom du schéma
            <input
              name="name"
              required
              defaultValue={`Schéma ${dossier.customer.name ?? ""}`.trim()}
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-brand-400"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Type
            <select
              name="assetType"
              defaultValue="VAN"
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
            >
              <option value="VAN">Van</option>
              <option value="MOTORHOME">Camping-car</option>
              <option value="BOAT">Bateau</option>
              <option value="OTHER">Autre</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Tension
            <select
              name="voltage"
              defaultValue="V12"
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
            >
              <option value="V12">12V</option>
              <option value="V24">24V</option>
              <option value="UNKNOWN">Je ne sais pas</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Pré-remplissage
            <select
              name="templateId"
              defaultValue=""
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
            >
              <option value="">Aucun (schéma vide)</option>
              {templateGroups.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <AdminButton type="submit" variant="primary" size="sm">Créer et ouvrir l&apos;éditeur</AdminButton>
        </form>
      </AdminCard>

      {dossier.offre === "DECOUVERTE" || dossier.offre === "CONSEIL" ? (
        <AdminCard title="Statut" description="Suivi simple — pas de timeline pour cette offre.">
          <form action={updateDossierSimpleStatusAction} className="grid gap-3 lg:grid-cols-[200px_1fr_auto] lg:items-end">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Statut
              <select
                name="statutSimple"
                defaultValue={dossier.statutSimple ?? "A_VENIR"}
                className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
              >
                <option value="A_VENIR">À venir</option>
                <option value="FAIT">Fait</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Compte-rendu
              <textarea
                name="compteRendu"
                rows={2}
                defaultValue={dossier.compteRendu ?? ""}
                placeholder="Ex. Appel réalisé, client rassuré sur le dimensionnement batterie."
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
              />
            </label>
            <AdminButton type="submit" variant="primary" size="sm">Enregistrer</AdminButton>
          </form>
          {dossier.statutSimple ? (
            <div className="mt-3">
              <AdminBadge tone={getDossierStatutSimpleTone(dossier.statutSimple)}>
                {getDossierStatutSimpleLabel(dossier.statutSimple)}
              </AdminBadge>
            </div>
          ) : null}
        </AdminCard>
      ) : isTimelineOffre(dossier.offre) ? (
        <AdminCard title="Parcours" description="Étape actuelle et itérations — l'étape reste 'en cours' tant qu'elle n'est pas explicitement avancée.">
          <div className="space-y-3">
            {getDossierStepStatuses(dossier.offre, dossier.etapeOverride ?? dossier.etapeActuelle).map((step) => (
              <div key={step.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{step.title}</span>
                  {step.isIterative && step.status === "current" ? (
                    <span className="text-xs text-neutral-500">({dossier.iterationCount} itération{dossier.iterationCount > 1 ? "s" : ""})</span>
                  ) : null}
                </div>
                <AdminBadge tone={stepTone(step.status)}>
                  {step.status === "done" ? "Fait" : step.status === "current" ? "En cours" : "À venir"}
                </AdminBadge>
              </div>
            ))}
          </div>

          <form action={advanceDossierStepAction} className="mt-5 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Faire avancer à l&apos;étape
              <select
                name="stepKey"
                defaultValue={dossier.etapeActuelle ?? ""}
                className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
              >
                {getDossierStepStatuses(dossier.offre, dossier.etapeActuelle).map((step) => (
                  <option key={step.key} value={step.key}>{step.title}</option>
                ))}
              </select>
            </label>
            <AdminButton type="submit" variant="primary" size="sm">Appliquer</AdminButton>
          </form>

          <form action={addDossierIterationAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <label className="grid flex-1 gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Nouvelle itération (note courte)
              <input
                name="note"
                type="text"
                required
                placeholder="Ex. ajout protection surintensité + révision section câble"
                className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
              />
            </label>
            <AdminButton type="submit" variant="secondary" size="sm">Ajouter</AdminButton>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard title="Rendez-vous" description="Visio ou téléphone — synchronisés automatiquement sur le calendrier iPhone (voir /dashboard/calendrier).">
        {dossier.appointments.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun rendez-vous pour l&apos;instant.</p>
        ) : (
          <div className="space-y-3">
            {dossier.appointments.map((appointment) => {
              const isPast = appointment.scheduledAt.getTime() < Date.now();
              return (
                <div key={appointment.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                  <form action={updateDossierAppointmentAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="dossierId" value={dossier.id} />
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Date et heure
                      <input
                        name="scheduledAt"
                        type="datetime-local"
                        required
                        defaultValue={formatDateTimeForInput(appointment.scheduledAt)}
                        className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-brand-400"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Durée
                      <select
                        name="durationMinutes"
                        defaultValue={appointment.durationMinutes}
                        className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 h</option>
                        <option value={90}>1 h 30</option>
                      </select>
                    </label>
                    <AdminButton type="submit" variant="secondary" size="sm">Mettre à jour</AdminButton>
                    <AdminBadge tone={isPast ? "neutral" : "info"}>{isPast ? "Passé" : "À venir"}</AdminBadge>
                  </form>

                  <form action={setDossierAppointmentSummaryAction} className="mt-3 grid gap-2 border-t border-neutral-800 pt-3">
                    <input type="hidden" name="dossierId" value={dossier.id} />
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Compte-rendu {formatDateTime(appointment.scheduledAt)}
                      <textarea
                        name="compteRendu"
                        rows={2}
                        defaultValue={appointment.compteRendu ?? ""}
                        placeholder="Ex. Point fait sur le dimensionnement batterie, prochaine étape : câblage."
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400"
                      />
                    </label>
                    <div className="flex items-center justify-between gap-3">
                      <AdminButton type="submit" variant="secondary" size="sm">Enregistrer le compte-rendu</AdminButton>
                    </div>
                  </form>

                  <form action={deleteDossierAppointmentAction} className="mt-2">
                    <input type="hidden" name="dossierId" value={dossier.id} />
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <button type="submit" className="text-xs font-medium text-red-400 underline underline-offset-2 hover:text-red-300">
                      Supprimer ce rendez-vous
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <form action={createDossierAppointmentAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Nouveau rendez-vous
            <input
              name="scheduledAt"
              type="datetime-local"
              required
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-brand-400"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Durée
            <select
              name="durationMinutes"
              defaultValue={30}
              className="h-10 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-brand-400"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 h</option>
              <option value={90}>1 h 30</option>
            </select>
          </label>
          <AdminButton type="submit" variant="primary" size="sm">Ajouter</AdminButton>
        </form>
      </AdminCard>

      <AdminCard title="Documents" description="Partagés avec le client — visibles sur sa page de suivi.">
        {documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun document pour l&apos;instant.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-100">{document.filename}</p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(document.sizeBytes)} · {document.uploadedBy} · {formatDate(document.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={`/api/internal/dossiers/documents/${document.id}`} className="text-sm font-semibold text-brand-300 underline underline-offset-2 hover:text-brand-200">
                    Télécharger
                  </a>
                  <form action={deleteDossierDocumentAction}>
                    <input type="hidden" name="dossierId" value={dossier.id} />
                    <input type="hidden" name="documentId" value={document.id} />
                    <AdminButton type="submit" variant="danger" size="sm">Retirer</AdminButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={uploadDossierDocumentAction} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-800 pt-4">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Ajouter un document <span className="normal-case tracking-normal text-neutral-600">(PDF/PNG/JPEG/WEBP, 2 Mo max, 8 Mo cumulés par dossier)</span>
            <input
              name="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              required
              className="text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-neutral-200 hover:file:bg-neutral-700"
            />
          </label>
          <AdminButton type="submit" variant="secondary" size="sm">Envoyer</AdminButton>
        </form>
      </AdminCard>

      <AdminCard title="Notes internes" description="Jamais visibles côté client.">
        <form action={updateDossierNotesInternesAction} className="grid gap-3">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <textarea
            name="notesInternes"
            rows={4}
            defaultValue={dossier.notesInternes ?? ""}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
          />
          <div>
            <AdminButton type="submit" variant="secondary" size="sm">Enregistrer</AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Historique">
        {dossier.events.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun événement enregistré.</p>
        ) : (
          <div className="space-y-3">
            {dossier.events.map((event) => (
              <div key={event.id} className="border-l border-neutral-700 pl-3">
                <p className="text-sm font-medium text-neutral-200">
                  {eventLabel(event.type)}
                  {event.toEtape ? ` → ${event.toEtape}` : ""}
                </p>
                {event.note ? <p className="mt-1 text-sm text-neutral-400">{event.note}</p> : null}
                <p className="mt-1 text-xs text-neutral-500">{formatDate(event.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </DashboardPageShell>
  );
}
