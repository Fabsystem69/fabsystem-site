import { CoachingInvitation } from "@/components/dashboard/crm/CoachingInvitation";
import { EntretienSection } from "@/components/dashboard/crm/EntretienSection";
import { ClotureCard, HistoriqueCard } from "@/components/dashboard/crm/ProjectStatusPanel";
import { SchemaLinkCard } from "@/components/dashboard/crm/SchemaLinkCard";
import Link from "next/link";
import { formatCustomerDisplayName, formatDate, formatDateTime, formatEuroFromCents } from "@/lib/format";
import {
  getClientLevelLabel,
  getCoachingActionStatusLabel,
  getCoachingCircuitReviewStatusLabel,
  getCoachingCircuitReviewStatusTone,
  getCoachingMaterialCategoryLabel,
  getCoachingPaymentStatusLabel,
  getCoachingPaymentStatusTone,
  getCoachingPowerSupplyLabel,
  getCoachingProjectStatusLabel,
  getCoachingProjectStatusTone,
  getCoachingProposalStatusLabel,
  getCoachingProposalStatusTone,
  getCoachingSchemaStatusLabel,
  getCoachingSchemaStatusTone,
  getCoachingSessionStatusLabel,
  getCoachingSessionStatusTone,
} from "@/lib/dashboard-status-labels";
import { getCoachingProjectForDetail, getCoachingProjectTimeBalance } from "@/lib/services/coaching-project";
import { listProjectsForCustomer } from "@/lib/services/project";
import { PROJECT_ASSET_TYPE_LABELS } from "@/lib/project-labels";
import { ensureDefaultScenario, getScenarioBilan, listDevicesForProject, listScenarios } from "@/lib/services/coaching-van-dossier";
import { listMaterialsForProject } from "@/lib/services/coaching-material";
import { listCircuitsForProject } from "@/lib/services/coaching-circuit";
import { listSchemaRevisions, projectNeedsSchemaReview } from "@/lib/services/coaching-schema-revision";
import { AdminAlert, AdminBadge, AdminButton, AdminCard, AdminPageHeader, DashboardPageShell } from "@/components/dashboard/ui";
import {
  createCircuitAction,
  createCoachingActionItemAction,
  createCoachingProposalAction,
  createCoachingSessionAction,
  createDeviceAdminAction,
  createMaterialAdminAction,
  createScenarioAction,
  createSchemaRevisionAction,
  deleteCircuitAction,
  deleteCoachingActionItemAction,
  deleteCoachingProjectDocumentAction,
  deleteCoachingSessionAction,
  deleteDeviceAdminAction,
  deleteMaterialAdminAction,
  deleteSchemaRevisionAction,
  generateInviteLinkAction,
  markProjectReviewedAction,
  updateCircuitReviewStatusAction,
  updateCoachingActionStatusAction,
  updateCoachingProposalAction,
  updateCoachingSessionReportAction,
  updateImplantationInfoAdminAction,
  updateSchemaRevisionStatusAction,
  updateUsagesInfoAdminAction,
  updateVehicleInfoAdminAction,
  uploadCoachingProjectDocumentAction,
} from "../../actions";
import {
  addQuickCoachingNoteAction,
  closeCoachingProjectAction,
  linkCoachingProjectSchemaAction,
  reopenCoachingProjectAction,
  unlinkCoachingProjectSchemaAction,
  updateCoachingProjectAction,
  updateEntretienInfoAction,
} from "../../project-lifecycle-actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 min-w-0 max-w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-base normal-case tracking-normal text-white placeholder:text-neutral-500 outline-none focus:border-brand-400";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500";

function minutesLabel(minutes: number) {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  const label = hours > 0 ? `${hours} h${rest > 0 ? ` ${rest.toString().padStart(2, "0")}` : ""}` : `${rest} min`;
  return minutes < 0 ? `-${label}` : label;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default async function DashboardCrmProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; success?: string; scenario?: string; entretienDraft?: string; noteDraft?: string }>;
}) {
  const { projectId } = await params;
  const { error, success, scenario: scenarioIdParam, entretienDraft, noteDraft } = await searchParams;
  const [project, balance] = await Promise.all([
    getCoachingProjectForDetail(projectId),
    getCoachingProjectTimeBalance(projectId),
  ]);

  await ensureDefaultScenario(projectId);
  const scenarios = await listScenarios(projectId);
  const activeScenario = scenarios.find((s) => s.id === scenarioIdParam) ?? scenarios[0];
  const [{ bilan }, devices, materials, circuits, schemaRevisions, needsSchemaReview, linkableSchemaProjects] = await Promise.all([
    getScenarioBilan(activeScenario.id),
    listDevicesForProject(projectId),
    listMaterialsForProject(projectId),
    listCircuitsForProject(projectId),
    listSchemaRevisions(projectId),
    projectNeedsSchemaReview(projectId),
    // Éditeur de schéma existant (docs/03-DATABASE.md §4) — propose de
    // rattacher un Project déjà présent chez ce client plutôt que d'en
    // créer un second sans le savoir.
    listProjectsForCustomer({ role: "admin" }, project.customerId),
  ]);

  return (
    <DashboardPageShell>
      <AdminPageHeader
        title={project.title}
        backHref={`/dashboard/crm/clients/${project.customerId}`}
        backLabel={formatCustomerDisplayName(project.customer)}
        description={`Dernière activité le ${formatDate(project.derniereActivite)}`}
        actions={<AdminBadge tone={getCoachingProjectStatusTone(project.status)}>{getCoachingProjectStatusLabel(project.status)}</AdminBadge>}
      />

      {error ? <AdminAlert tone="danger">{error}</AdminAlert> : null}
      {success ? <AdminAlert tone="success">{success}</AdminAlert> : null}

      <ClotureCard
        project={project}
        closeCoachingProjectAction={closeCoachingProjectAction}
        reopenCoachingProjectAction={reopenCoachingProjectAction}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Temps acheté</p>
          <p className="mt-2 text-2xl font-semibold text-white">{minutesLabel(balance.purchasedMinutes)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Temps consommé</p>
          <p className="mt-2 text-2xl font-semibold text-white">{minutesLabel(balance.consumedMinutes)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Temps restant</p>
          <p className={`mt-2 text-2xl font-semibold ${balance.remainingMinutes <= 0 ? "text-red-400" : "text-white"}`}>
            {minutesLabel(balance.remainingMinutes)}
          </p>
        </AdminCard>
      </div>

      <HistoriqueCard project={project} />

      <AdminCard title="Fiche projet">
        <form action={updateCoachingProjectAction} className="grid gap-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Titre
              <input name="title" defaultValue={project.title} required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Statut
              <select name="status" defaultValue={project.status} className={fieldClass}>
                <option value="A_DEMARRER">À démarrer</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Description
            <textarea name="description" rows={3} defaultValue={project.description ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Questions en attente
            <textarea name="questionsEnAttente" rows={2} defaultValue={project.questionsEnAttente ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Actions à préparer avant la prochaine séance
            <textarea name="actionsAPreparer" rows={2} defaultValue={project.actionsAPreparer ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <label className={labelClass}>
            Notes internes
            <textarea name="notesInternes" rows={2} defaultValue={project.notesInternes ?? ""} className={`${fieldClass} h-auto py-2.5`} />
          </label>
          <AdminButton type="submit" variant="primary" className="h-11 self-start px-6">Enregistrer</AdminButton>
        </form>
        {project.niveauClient ? (
          <p className="mt-3 text-xs text-neutral-500">Niveau renseigné : {getClientLevelLabel(project.niveauClient)}</p>
        ) : null}
      </AdminCard>

      <EntretienSection
        project={project}
        draft={entretienDraft}
        noteDraft={noteDraft}
        updateEntretienInfoAction={updateEntretienInfoAction}
        addQuickCoachingNoteAction={addQuickCoachingNoteAction}
      />

      <AdminCard title="Dossier client van" description="Espace partagé — le client peut aussi compléter ces sections depuis son compte.">
        <div className="flex flex-wrap items-center gap-2">
          {project.readyForReviewAt ? <AdminBadge tone="info">En attente de relecture</AdminBadge> : null}
          {project.hasChangesSinceReview ? <AdminBadge tone="warning">Modifié depuis la dernière relecture</AdminBadge> : null}
          {project.lastReviewedAt ? <span className="text-xs text-neutral-500">Dernière relecture le {formatDate(project.lastReviewedAt)}</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.readyForReviewAt || project.hasChangesSinceReview ? (
            <form action={markProjectReviewedAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <AdminButton type="submit" variant="secondary" size="sm">Marquer comme revu</AdminButton>
            </form>
          ) : null}
        </div>
        <CoachingInvitation projectId={project.id} action={generateInviteLinkAction} />
      </AdminCard>

      <AdminCard title="Véhicule & projet" description="Étape 1 — modifiable par vous ou par le client.">
        <form action={updateVehicleInfoAdminAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedVehicleInfoUpdatedAt" value={project.vehicleInfoUpdatedAt.toISOString()} />
          <label className={labelClass}>Support
            <select name="assetType" defaultValue={project.assetType ?? ""} className={fieldClass}>
              <option value="">Je ne sais pas encore</option>
              {Object.entries(PROJECT_ASSET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>Marque<input name="vehicleBrand" defaultValue={project.vehicleBrand ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Modèle<input name="vehicleModel" defaultValue={project.vehicleModel ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Année<input name="vehicleYear" defaultValue={project.vehicleYear ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Motorisation<input name="vehicleEngine" defaultValue={project.vehicleEngine ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Gabarit<input name="vehicleFormat" defaultValue={project.vehicleFormat ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Dimensions utiles<input name="vehicleDimensions" defaultValue={project.vehicleDimensions ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Pays d&apos;immatriculation<input name="registrationCountry" defaultValue={project.registrationCountry ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Pays d&apos;usage<input name="usageCountry" defaultValue={project.usageCountry ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Avancement
            <select name="projectStage" defaultValue={project.projectStage ?? ""} className={fieldClass}>
              <option value="">Non précisé</option>
              <option value="Idée">Idée</option>
              <option value="Véhicule acheté">Véhicule acheté</option>
              <option value="Aménagement en cours">Aménagement en cours</option>
              <option value="Installation partielle">Installation partielle</option>
              <option value="Installation existante à modifier">Installation existante à modifier</option>
            </select>
          </label>
          <label className={labelClass}>Qui réalise les travaux<input name="whoDoesTheWork" defaultValue={project.whoDoesTheWork ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Échéance de départ<input name="startDeadline" defaultValue={project.startDeadline ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Niveau du client
            <select name="niveauClient" defaultValue={project.niveauClient ?? ""} className={fieldClass}>
              <option value="">Non précisé</option>
              <option value="DEBUTANT">Débutant</option>
              <option value="INTERMEDIAIRE">Intermédiaire</option>
              <option value="AVANCE">Avancé</option>
            </select>
          </label>
          <label className={labelClass}>Budget matériel (€)<input name="materialBudgetEuros" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={project.materialBudgetCents != null ? project.materialBudgetCents / 100 : ""} className={fieldClass} /></label>
          <label className={labelClass}>Budget pose (€)<input name="laborBudgetEuros" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={project.laborBudgetCents != null ? project.laborBudgetCents / 100 : ""} className={fieldClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Homologation<textarea name="homologationNotes" rows={2} defaultValue={project.homologationNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Sujets d&apos;accompagnement<textarea name="coachingTopics" rows={2} defaultValue={project.coachingTopics ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Trois priorités<textarea name="threePriorities" rows={2} defaultValue={project.threePriorities ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Objectifs<textarea name="objectifs" rows={2} defaultValue={project.objectifs ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <div className="sm:col-span-2"><AdminButton type="submit" variant="primary" className="h-11 px-6">Enregistrer</AdminButton></div>
        </form>
      </AdminCard>

      <AdminCard title="Usages & recharge" description="Étape 2 — modifiable par vous ou par le client.">
        <form action={updateUsagesInfoAdminAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedUsagesUpdatedAt" value={project.usagesUpdatedAt.toISOString()} />
          <label className={labelClass}>Voyageurs<input name="travelerCount" defaultValue={project.travelerCount ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Utilisation<input name="usagePattern" defaultValue={project.usagePattern ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Stationnement<input name="parkingExposure" defaultValue={project.parkingExposure ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Jours sans recharge<input name="daysWithoutRecharge" defaultValue={project.daysWithoutRecharge ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Autonomie minimale<input name="minAutonomyNoRecharge" defaultValue={project.minAutonomyNoRecharge ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Disponibilité secteur<input name="shorePowerAvailability" defaultValue={project.shorePowerAvailability ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Solaire envisagé<input name="solarPreference" defaultValue={project.solarPreference ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Fixe ou portable<input name="solarMounting" defaultValue={project.solarMounting ?? ""} className={fieldClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Télétravail<textarea name="remoteWorkNotes" rows={2} defaultValue={project.remoteWorkNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Saisons / régions / températures<textarea name="seasonsRegionsNotes" rows={2} defaultValue={project.seasonsRegionsNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Appareils indispensables si énergie limitée<textarea name="criticalDevicesWhenLow" rows={2} defaultValue={project.criticalDevicesWhenLow ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Conduite<textarea name="drivingHabits" rows={2} defaultValue={project.drivingHabits ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Espace toit solaire<textarea name="solarRoofSpaceNotes" rows={2} defaultValue={project.solarRoofSpaceNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Autres sources d&apos;énergie<textarea name="otherEnergySources" rows={2} defaultValue={project.otherEnergySources ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Évolutions futures<textarea name="plannedEquipmentNotes" rows={2} defaultValue={project.plannedEquipmentNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <div className="sm:col-span-2"><AdminButton type="submit" variant="primary" className="h-11 px-6">Enregistrer</AdminButton></div>
        </form>
      </AdminCard>

      <AdminCard title="Appareils & bilan de consommation" description="Étape 3 — un scénario par onglet (été/hiver...), le même appareil peut avoir un usage différent selon le scénario.">
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((s) => (
            <Link key={s.id} href={`/dashboard/crm/projects/${projectId}?scenario=${s.id}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${s.id === activeScenario.id ? "bg-brand-400 text-neutral-950" : "border border-neutral-700 bg-neutral-950 text-neutral-200"}`}>
              {s.name}
            </Link>
          ))}
        </div>
        <form action={createScenarioAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>Nouveau scénario<input name="name" placeholder="Hiver" className={fieldClass} /></label>
          <AdminButton type="submit" variant="secondary" size="sm">Ajouter</AdminButton>
        </form>

        <form action={createDeviceAdminAction} className="mt-5 grid gap-3 border-t border-neutral-800/80 pt-5 sm:grid-cols-3">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="scenarioId" value={activeScenario.id} />
          <label className={labelClass}>Nom<input name="name" required className={fieldClass} /></label>
          <label className={labelClass}>Catégorie<input name="category" required className={fieldClass} /></label>
          <label className={labelClass}>Quantité<input name="quantity" type="number" min={1} defaultValue={1} className={fieldClass} /></label>
          <label className={labelClass}>Alimentation
            <select name="powerSupply" defaultValue="INCONNU" className={fieldClass}>
              <option value="DC12">DC 12 V</option><option value="DC24">DC 24 V</option><option value="DC_AUTRE">DC autre</option>
              <option value="USB">USB</option><option value="AC230">AC 230 V</option><option value="INCONNU">Inconnu</option>
            </select>
          </label>
          <label className={labelClass}>Méthode de calcul
            <select name="calcMethod" defaultValue="PUISSANCE_TEMPS" className={fieldClass}>
              <option value="PUISSANCE_TEMPS">Puissance × temps</option>
              <option value="ENERGIE_JOUR">Énergie/jour connue</option>
              <option value="RECHARGE_CYCLE">Recharge/cycle</option>
            </select>
          </label>
          <label className={labelClass}>Puissance (W)<input name="continuousPowerW" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Durée effective (h/j)<input name="effectiveHoursPerDay" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Énergie/jour (Wh)<input name="dailyEnergyWhPerUnit" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Wh/cycle × cycles/j
            <div className="flex gap-2">
              <input name="energyPerCycleWh" type="number" step="any" className={fieldClass} />
              <input name="cyclesPerDay" type="number" step="any" className={fieldClass} />
            </div>
          </label>
          <div className="sm:col-span-3"><AdminButton type="submit" variant="secondary">＋ Ajouter l&apos;appareil</AdminButton></div>
        </form>

        {devices.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Aucun appareil pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {devices.map((device) => {
              const deviceBilan = bilan.perDevice.find((p) => p.deviceId === device.id);
              return (
                <li key={device.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">{device.name}</span>
                    <span className="text-xs text-neutral-500">{device.category} · {getCoachingPowerSupplyLabel(device.powerSupply)} · {device.quantity} ×</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {deviceBilan?.energyWh != null ? `${Math.round(deviceBilan.energyWh)} Wh/j` : deviceBilan ? "Incomplet" : "Pas dans ce scénario"}
                    </span>
                    <form action={deleteDeviceAdminAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="deviceId" value={device.id} />
                      <AdminButton type="submit" variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Supprimer cet appareil">✕</AdminButton>
                    </form>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className={`mt-5 rounded-xl border p-4 ${bilan.isIncomplete ? "border-orange-500/30 bg-orange-500/10" : "border-neutral-700 bg-neutral-950"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{bilan.isIncomplete ? "Bilan incomplet" : "Besoin quotidien"} · {activeScenario.name}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{Math.round(bilan.totalWhPerDay)} Wh / jour</p>
          {bilan.isIncomplete ? <p className="mt-1 text-xs text-orange-300">{bilan.incompleteCount} appareil(s) avec des données manquantes — exclus du total.</p> : null}
        </div>
      </AdminCard>

      <AdminCard title="Matériel" description="Batterie, BMS, panneaux, régulateur, chargeurs — distinct des appareils consommateurs. Espace partagé.">
        <form action={createMaterialAdminAction} className="mb-5 grid gap-3 border-b border-neutral-800/80 pb-5 sm:grid-cols-3">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>Catégorie
            <select name="category" defaultValue="BATTERIE" className={fieldClass}>
              <option value="BATTERIE">Batterie</option><option value="BMS">BMS</option><option value="PANNEAU_SOLAIRE">Panneau solaire</option>
              <option value="REGULATEUR">Régulateur</option><option value="CHARGEUR_MOTEUR">Chargeur moteur</option><option value="CHARGEUR_SECTEUR">Chargeur secteur</option>
              <option value="CONVERTISSEUR">Convertisseur</option><option value="DISTRIBUTION">Distribution</option><option value="PROTECTION">Protection</option><option value="AUTRE">Autre</option>
            </select>
          </label>
          <label className={labelClass}>Marque<input name="brand" className={fieldClass} /></label>
          <label className={labelClass}>Référence<input name="reference" className={fieldClass} /></label>
          <label className={labelClass}>Quantité<input name="quantity" type="number" min={1} defaultValue={1} className={fieldClass} /></label>
          <label className={labelClass}>Tension nominale (V)<input name="ratedVoltage" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Courant nominal (A)<input name="ratedCurrentA" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Puissance nominale (W)<input name="ratedPowerW" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Capacité (Ah)<input name="capacityAh" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>État
            <select name="state" defaultValue="ENVISAGE" className={fieldClass}>
              <option value="ENVISAGE">Envisagé</option><option value="CHOISI">Choisi</option><option value="ACHETE">Acheté</option><option value="INSTALLE">Installé</option>
            </select>
          </label>
          <div className="sm:col-span-3"><AdminButton type="submit" variant="secondary">＋ Ajouter</AdminButton></div>
        </form>

        {materials.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun matériel pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((material) => (
              <li key={material.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <span>
                  <span className="block text-sm font-semibold text-white">{getCoachingMaterialCategoryLabel(material.category)}</span>
                  <span className="text-xs text-neutral-500">
                    {material.brand ?? "—"} {material.reference ?? ""} · {material.quantity} ×
                    {material.ratedVoltage ? ` · ${material.ratedVoltage} V` : ""}
                    {material.ratedCurrentA ? ` · ${material.ratedCurrentA} A` : ""}
                    {material.capacityAh ? ` · ${material.capacityAh} Ah` : ""}
                  </span>
                </span>
                <form action={deleteMaterialAdminAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="materialId" value={material.id} />
                  <AdminButton type="submit" variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Supprimer ce matériel">✕</AdminButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Implantation" description="Étape 5 — contexte général partagé ; le registre de circuits détaillé ci-dessous reste réservé au coach.">
        <form action={updateImplantationInfoAdminAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedImplantationUpdatedAt" value={project.implantationUpdatedAt.toISOString()} />
          <label className={`${labelClass} sm:col-span-2`}>Croquis, emplacements et volumes disponibles<textarea name="implantationNotes" rows={2} defaultValue={project.implantationNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Contraintes ventilation/température/eau/accessibilité<textarea name="ventilationConstraints" rows={2} defaultValue={project.ventilationConstraints ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Position des prises, éclairages et commandes<textarea name="outletsLightingNotes" rows={2} defaultValue={project.outletsLightingNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Tension, alternateur, contraintes constructeur<textarea name="vehicleElectricalNotes" rows={2} defaultValue={project.vehicleElectricalNotes ?? ""} className={`${fieldClass} h-auto py-2.5`} /></label>
          <label className={labelClass}>Source de cette information<input name="vehicleElectricalSource" defaultValue={project.vehicleElectricalSource ?? ""} className={fieldClass} /></label>
          <div className="sm:col-span-2"><AdminButton type="submit" variant="primary" className="h-11 px-6">Enregistrer</AdminButton></div>
        </form>
      </AdminCard>

      <AdminCard title="Registre de circuits" description="Réservé au coach — ne transforme jamais une longueur aller en hypothèse de retour silencieuse.">
        <form action={createCircuitAction} className="mb-5 grid gap-3 border-b border-neutral-800/80 pb-5 sm:grid-cols-3">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>Identifiant<input name="label" required placeholder="C1 - Frigo" className={fieldClass} /></label>
          <label className={labelClass}>Appareil relié
            <select name="deviceId" defaultValue="" className={fieldClass}>
              <option value="">Aucun</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Section retenue<input name="section" placeholder="2,5 mm²" className={fieldClass} /></label>
          <label className={labelClass}>Source<input name="source" className={fieldClass} /></label>
          <label className={labelClass}>Destination<input name="destination" className={fieldClass} /></label>
          <label className={labelClass}>Longueur aller (m)<input name="outboundLengthM" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Trajet de retour prévu<input name="returnPathPlanned" className={fieldClass} /></label>
          <label className={labelClass}>Longueur retour (m)<input name="returnLengthM" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Protection (type/réf.)<input name="protectionType" className={fieldClass} /></label>
          <label className={labelClass}>Calibre protection (A)<input name="protectionRatingA" type="number" step="any" className={fieldClass} /></label>
          <label className={labelClass}>Emplacement protection<input name="protectionLocation" className={fieldClass} /></label>
          <label className={`${labelClass} sm:col-span-3`}>Justification<textarea name="justification" rows={2} className={`${fieldClass} h-auto py-2.5`} /></label>
          <div className="sm:col-span-3"><AdminButton type="submit" variant="secondary">＋ Ajouter le circuit</AdminButton></div>
        </form>

        {circuits.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun circuit pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {circuits.map((circuit) => (
              <li key={circuit.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{circuit.label}</span>
                  <AdminBadge tone={getCoachingCircuitReviewStatusTone(circuit.reviewStatus)}>{getCoachingCircuitReviewStatusLabel(circuit.reviewStatus)}</AdminBadge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {circuit.source ?? "—"} → {circuit.destination ?? "—"} · {circuit.section ?? "section non retenue"}
                  {circuit.outboundLengthM ? ` · ${circuit.outboundLengthM} m aller` : ""}
                  {circuit.returnLengthM ? ` · ${circuit.returnLengthM} m retour` : " · retour non renseigné"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={updateCircuitReviewStatusAction} className="flex min-w-0 flex-wrap items-center gap-2">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="circuitId" value={circuit.id} />
                    <select name="reviewStatus" aria-label={`État de relecture de ${circuit.label}`} defaultValue={circuit.reviewStatus} className={fieldClass}>
                      <option value="A_FAIRE">À faire</option>
                      <option value="A_REVOIR">À revoir</option>
                      <option value="VALIDE">Validé</option>
                    </select>
                    <AdminButton type="submit" className="min-h-11">Enregistrer</AdminButton>
                  </form>
                  <form action={deleteCircuitAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="circuitId" value={circuit.id} />
                    <AdminButton type="submit" variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Supprimer ce circuit">✕</AdminButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <SchemaLinkCard
        project={project}
        linkableProjects={linkableSchemaProjects}
        linkCoachingProjectSchemaAction={linkCoachingProjectSchemaAction}
        unlinkCoachingProjectSchemaAction={unlinkCoachingProjectSchemaAction}
      />

      <AdminCard title="Révisions de schéma" description="Fige un instantané du dossier et du bilan — la version de travail continue d'évoluer séparément. Le statut ne vaut pas certification réglementaire.">
        {needsSchemaReview ? (
          <AdminAlert tone="warning">Le dossier a changé depuis la dernière révision « revue pour réalisation » — le schéma est peut-être à revoir.</AdminAlert>
        ) : null}
        <form action={createSchemaRevisionAction} className="mt-4">
          <input type="hidden" name="projectId" value={project.id} />
          <AdminButton type="submit" variant="secondary">Figer une nouvelle révision</AdminButton>
        </form>

        {schemaRevisions.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Aucune révision figée pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {schemaRevisions.map((revision) => (
              <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <span>
                  <span className="block text-sm font-semibold text-white">Révision #{revision.revisionNumber}</span>
                  <span className="text-xs text-neutral-500">Figée le {formatDate(revision.createdAt)}</span>
                </span>
                <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto">
                  <form action={updateSchemaRevisionStatusAction} className="flex min-w-0 flex-wrap items-center gap-2">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="revisionId" value={revision.id} />
                    <select name="status" aria-label={`Statut de la révision ${revision.revisionNumber}`} defaultValue={revision.status} className={`${fieldClass} w-full sm:w-auto`}>
                      <option value="BROUILLON">Brouillon</option>
                      <option value="A_REVOIR">À revoir</option>
                      <option value="REVU_POUR_REALISATION">Revu pour réalisation</option>
                      <option value="MIS_A_JOUR_SELON_INSTALLATION">Mis à jour selon installation</option>
                    </select>
                    <AdminButton type="submit" className="min-h-11">Enregistrer</AdminButton>
                  </form>
                  <AdminBadge tone={getCoachingSchemaStatusTone(revision.status)}>{getCoachingSchemaStatusLabel(revision.status)}</AdminBadge>
                  <form action={deleteSchemaRevisionAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="revisionId" value={revision.id} />
                    <AdminButton type="submit" variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Supprimer cette révision">✕</AdminButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Exports">
        <div className="flex flex-wrap gap-2">
          <a href={`/api/internal/coaching-projects/${projectId}/bilan-csv`} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800">Exporter le bilan (CSV)</a>
          <a href={`/api/internal/coaching-projects/${projectId}/dossier-print`} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800">Version à partager (imprimable)</a>
          <a href={`/api/internal/coaching-projects/${projectId}/dossier-print?private=1`} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800">Version complète (avec notes internes)</a>
        </div>
      </AdminCard>

      <AdminCard title="Séances">
        <form action={createCoachingSessionAction} className="mb-5 grid gap-3 border-b border-neutral-800/80 pb-5 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>
            Date et heure
            <input name="scheduledAt" type="datetime-local" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Durée (min)
            <input name="durationMinutes" type="number" min={1} defaultValue={60} className={fieldClass} />
          </label>
          <AdminButton type="submit" variant="secondary">Programmer</AdminButton>
        </form>

        {project.sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune séance pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-4">
            {project.sessions.map((session) => (
              <li key={session.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-white">
                    {session.channel ? `${session.channel} · ` : ""}
                    {formatDateTime(session.scheduledAt)} · {session.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-2">
                    {session.sharedWithClient ? <AdminBadge tone="info">Partagé au client</AdminBadge> : null}
                    <AdminBadge tone={getCoachingSessionStatusTone(session.status)}>{getCoachingSessionStatusLabel(session.status)}</AdminBadge>
                  </span>
                </div>
                <form action={updateCoachingSessionReportAction} className="mt-3 grid gap-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <label className={labelClass}>
                    Statut
                    <select name="status" defaultValue={session.status} className={fieldClass}>
                      <option value="PREVUE">Prévue</option>
                      <option value="REALISEE">Réalisée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Sujets abordés
                    <textarea name="sujetsAbordes" rows={2} defaultValue={session.sujetsAbordes ?? ""} className={`${fieldClass} h-auto py-2`} />
                  </label>
                  <label className={labelClass}>
                    Explications données
                    <textarea name="explicationsDonnees" rows={2} defaultValue={session.explicationsDonnees ?? ""} className={`${fieldClass} h-auto py-2`} />
                  </label>
                  <label className={labelClass}>
                    Difficultés rencontrées
                    <textarea name="difficultes" rows={2} defaultValue={session.difficultes ?? ""} className={`${fieldClass} h-auto py-2`} />
                  </label>
                  <label className={labelClass}>
                    Prochaine étape
                    <textarea name="prochaineEtape" rows={2} defaultValue={session.prochaineEtape ?? ""} className={`${fieldClass} h-auto py-2`} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton type="submit" variant="secondary" size="sm">Enregistrer le compte-rendu</AdminButton>
                  </div>
                </form>
                <form action={deleteCoachingSessionAction} className="mt-2">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <AdminButton type="submit" variant="danger" size="sm">Supprimer la séance</AdminButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Actions à suivre">
        <form action={createCoachingActionItemAction} className="mb-5 grid gap-3 border-b border-neutral-800/80 pb-5 sm:grid-cols-[1fr_8rem_10rem_auto] sm:items-end">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>
            Action
            <input name="label" required placeholder="Envoyer le schéma annoté" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Pour
            <select name="responsible" defaultValue="" className={fieldClass}>
              <option value="">—</option>
              <option value="CLIENT">Client</option>
              <option value="COACH">Vous</option>
            </select>
          </label>
          <label className={labelClass}>
            Échéance
            <input name="dueDate" type="date" className={fieldClass} />
          </label>
          <AdminButton type="submit" variant="secondary">Ajouter</AdminButton>
        </form>

        {project.actions.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune action pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {project.actions.map((action) => (
              <li key={action.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <span>
                  <span className="block text-base font-semibold text-white">{action.label}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    {action.responsible ? <AdminBadge tone="info">{action.responsible === "CLIENT" ? "Pour le client" : "Pour vous"}</AdminBadge> : null}
                    {action.dueDate ? <span>Échéance {formatDate(action.dueDate)}</span> : null}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <form action={updateCoachingActionStatusAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="actionId" value={action.id} />
                    <input type="hidden" name="status" value={action.status === "A_FAIRE" ? "FAIT" : "A_FAIRE"} />
                    <AdminButton type="submit" variant={action.status === "FAIT" ? "success" : "secondary"} size="sm">
                      {getCoachingActionStatusLabel(action.status)}
                    </AdminButton>
                  </form>
                  <form action={deleteCoachingActionItemAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="actionId" value={action.id} />
                    <AdminButton type="submit" variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Supprimer cette action">✕</AdminButton>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Suivi commercial" description="Distinguer le montant convenu du montant reçu — suivi manuel, sans nouveau prestataire de paiement.">
        <form action={createCoachingProposalAction} className="mb-5 grid gap-3 border-b border-neutral-800/80 pb-5 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
          <input type="hidden" name="projectId" value={project.id} />
          <label className={labelClass}>
            Intitulé
            <input name="intitule" required placeholder="Pack 5h coaching" className={fieldClass} />
          </label>
          <label className={labelClass}>
            Montant (€)
            <input name="montantEuros" type="number" min={0} step="0.01" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Durée (h)
            <input name="dureeHeures" type="number" min={0.5} step="0.5" required className={fieldClass} />
          </label>
          <AdminButton type="submit" variant="secondary">Ajouter</AdminButton>
        </form>

        {project.proposals.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune proposition pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-3">
            {project.proposals.map((proposal) => (
              <li key={proposal.id} className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-white">{proposal.intitule}</span>
                  <span className="flex gap-1.5">
                    <AdminBadge tone={getCoachingProposalStatusTone(proposal.status)}>{getCoachingProposalStatusLabel(proposal.status)}</AdminBadge>
                    <AdminBadge tone={getCoachingPaymentStatusTone(proposal.paymentStatus)}>{getCoachingPaymentStatusLabel(proposal.paymentStatus)}</AdminBadge>
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatEuroFromCents(proposal.montantCents)} convenu · {formatEuroFromCents(proposal.montantRecuCents)} reçu · {minutesLabel(proposal.dureeMinutes)}
                </p>
                <form action={updateCoachingProposalAction} className="mt-3 grid gap-2 sm:grid-cols-[8rem_10rem_8rem_auto] sm:items-end">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <label className={labelClass}>
                    Statut
                    <select name="status" defaultValue={proposal.status} className={fieldClass}>
                      <option value="BROUILLON">Brouillon</option>
                      <option value="ENVOYEE">Envoyée</option>
                      <option value="ACCEPTEE">Acceptée</option>
                      <option value="REFUSEE">Refusée</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Paiement
                    <select name="paymentStatus" defaultValue={proposal.paymentStatus} className={fieldClass}>
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="PARTIEL">Partiel</option>
                      <option value="PAYE">Payé</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Reçu (€)
                    <input name="montantRecuEuros" type="number" min={0} step="0.01" defaultValue={(proposal.montantRecuCents / 100).toFixed(2)} className={fieldClass} />
                  </label>
                  <AdminButton type="submit" variant="secondary" size="sm">Mettre à jour</AdminButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Documents" description="Photos, plans et documents — stockage privé, PDF/PNG/JPEG/WEBP, 2 Mo max par fichier.">
        <form action={uploadCoachingProjectDocumentAction} encType="multipart/form-data" className="mb-5 flex flex-wrap items-end gap-3 border-b border-neutral-800/80 pb-5">
          <input type="hidden" name="projectId" value={project.id} />
          <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required className="text-sm text-neutral-300" />
          <label className={labelClass}>Classer sous
            <select name="deviceId" defaultValue="" className={`${fieldClass} h-9`}>
              <option value="">Projet (général)</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <AdminButton type="submit" variant="secondary">Envoyer</AdminButton>
        </form>

        {project.documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun document pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {project.documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                <Link href={`/api/internal/coaching-projects/documents/${document.id}`} className="text-sm font-medium text-brand-300 underline">
                  {document.filename}
                </Link>
                <span className="flex items-center gap-3 text-xs text-neutral-500">
                  {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                  <form action={deleteCoachingProjectDocumentAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="documentId" value={document.id} />
                    <AdminButton type="submit" variant="ghost" size="sm">Retirer</AdminButton>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </DashboardPageShell>
  );
}
