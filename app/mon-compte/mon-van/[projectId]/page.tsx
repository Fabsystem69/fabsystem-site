import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatEuroFromCents } from "@/lib/format";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { prisma } from "@/lib/prisma";
import { ensureDefaultScenario, getScenarioBilan } from "@/lib/services/coaching-van-dossier";
import { listMaterialsForProject } from "@/lib/services/coaching-material";
import { getCoachingMaterialCategoryLabel, getCoachingPowerSupplyLabel } from "@/lib/dashboard-status-labels";
import { PROJECT_ASSET_TYPE_LABELS } from "@/lib/project-labels";
import {
  updateVehicleInfoAction,
  updateUsagesInfoAction,
  createDeviceAction,
  deleteDeviceAction,
  markOwnActionStatusAction,
  sendForReviewAction,
  createMaterialAction,
  deleteMaterialAction,
  updateImplantationInfoAction,
  uploadOwnCoachingProjectDocumentAction,
} from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900";
const labelClass = "block space-y-1.5 text-sm font-medium text-neutral-900";
const hintClass = "text-xs font-normal text-neutral-500";

// Libellés adaptés au support choisi (PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md) :
// uniquement des ajustements de vocabulaire objectivement corrects ("véhicule"
// ne convient pas à un bateau), jamais un questionnaire nautique inventé.
// "VAN"/"MOTORHOME"/null (inconnu) gardent le vocabulaire véhicule existant.
function vehicleNoun(assetType: string | null) {
  return assetType === "BOAT" ? "bateau" : "véhicule";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function TextField({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder ?? "À définir avec Fabsystem"} className={fieldClass} />
    </label>
  );
}

function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string | null }) {
  return (
    <label className={`${labelClass} sm:col-span-2`}>
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={2} placeholder="À définir avec Fabsystem" className={fieldClass} />
    </label>
  );
}

export default async function MonVanProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ step?: string; error?: string; success?: string }>;
}) {
  const actor = await requireCustomerActor();
  if (actor.role !== "customer") redirect("/mon-compte");

  const { projectId } = await params;
  const { step, error, success } = await searchParams;
  const activeStep = ["2", "3", "4", "5"].includes(step ?? "") ? Number(step) : 1;

  const project = await prisma.coachingProject.findUnique({
    where: { id: projectId },
    // "Qu'ai-je à faire maintenant ?" (PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md
    // — l'une des 3 questions auxquelles le client doit pouvoir répondre sans
    // aide). Uniquement les actions qui lui sont explicitement destinées et
    // encore ouvertes — jamais les actions internes du coach.
    include: {
      actions: { where: { responsible: "CLIENT", status: "A_FAIRE" }, orderBy: { dueDate: "asc" } },
      linkedProject: { select: { id: true, name: true } },
    },
  });
  if (!project || project.customerId !== actor.customerId) notFound();

  const devices = activeStep === 3 ? await prisma.coachingDevice.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }) : [];
  const scenario = activeStep === 3 ? await ensureDefaultScenario(projectId) : null;
  const { bilan } = scenario ? await getScenarioBilan(scenario.id) : { bilan: null };
  const materials = activeStep === 4 ? await listMaterialsForProject(projectId) : [];
  // "Où retrouver le dernier document que Fabien m'a transmis ?"
  // (PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md) — un nouvel envoi ne doit
  // jamais donner l'impression que les précédents ont disparu.
  const documents =
    activeStep === 4 ? await prisma.coachingProjectDocument.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }) : [];

  const stepClass = (n: number) =>
    `rounded-full px-4 py-2 text-sm font-semibold ${activeStep === n ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-700"}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/mon-compte" className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900">
          ← Retour à l&apos;accueil
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">{project.title}</h1>
          {project.readyForReviewAt ? <Badge tone="info">Envoyé pour relecture</Badge> : null}
          {project.hasChangesSinceReview ? <Badge tone="warning">Modifié depuis la dernière relecture</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Dernière mise à jour le {formatDate(project.derniereActivite)} — vous et votre coach pouvez tous les deux compléter ce dossier.
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      {project.resumePartage ? (
        <Card className="border-neutral-900/10 bg-neutral-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Où vous en êtes</p>
          <p className="mt-2 whitespace-pre-wrap text-base text-neutral-900">{project.resumePartage}</p>
        </Card>
      ) : null}

      {project.actions.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Ce qu&apos;il vous reste à faire</p>
          <ul className="mt-2 space-y-2">
            {project.actions.map((action) => (
              <li key={action.id} className="flex flex-wrap items-center justify-between gap-3 py-1">
                <span className="text-base text-neutral-900">
                  {action.label}
                  {action.dueDate ? <span className="ml-2 text-sm text-neutral-600">avant le {formatDate(action.dueDate)}</span> : null}
                </span>
                <form action={markOwnActionStatusAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="actionId" value={action.id} />
                  <input type="hidden" name="status" value="FAIT" />
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    C&apos;est fait
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {project.accordPrixCents != null || project.accordPerimetre || project.accordMiseAuPropre ? (
        <Card className="border-neutral-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Ce qui est prévu</p>
          <dl className="mt-2 space-y-2 text-sm text-neutral-700">
            {project.accordPrixCents != null ? (
              <div>
                <dt className="font-medium text-neutral-900">Prix convenu</dt>
                <dd>{formatEuroFromCents(project.accordPrixCents)}</dd>
              </div>
            ) : null}
            {project.accordPerimetre ? (
              <div>
                <dt className="font-medium text-neutral-900">Ce qui est inclus</dt>
                <dd className="whitespace-pre-wrap">{project.accordPerimetre}</dd>
              </div>
            ) : null}
            {project.accordMiseAuPropre ? (
              <div>
                <dt className="font-medium text-neutral-900">Mise au propre du schéma</dt>
                <dd>{project.accordMiseAuPropre}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : null}

      {project.linkedProject ? (
        <Card className="border-neutral-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Votre schéma</p>
          <p className="mt-2 text-base text-neutral-900">{project.linkedProject.name}</p>
          <Link
            href={`/mon-compte/projets/${project.linkedProject.id}`}
            className="mt-3 inline-block text-sm font-semibold text-neutral-900 underline underline-offset-4"
          >
            Voir mon schéma →
          </Link>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/mon-compte/mon-van/${projectId}?step=1`} className={stepClass(1)}>1. Mon projet</Link>
        <Link href={`/mon-compte/mon-van/${projectId}?step=2`} className={stepClass(2)}>2. Mes usages</Link>
        <Link href={`/mon-compte/mon-van/${projectId}?step=3`} className={stepClass(3)}>3. Mes appareils</Link>
        <Link href={`/mon-compte/mon-van/${projectId}?step=4`} className={stepClass(4)}>4. Mon matériel</Link>
        <Link href={`/mon-compte/mon-van/${projectId}?step=5`} className={stepClass(5)}>5. Mon implantation</Link>
      </div>

      {activeStep === 1 ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Votre projet et votre {vehicleNoun(project.assetType)}</h2>
          <form action={updateVehicleInfoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="expectedVehicleInfoUpdatedAt" value={project.vehicleInfoUpdatedAt.toISOString()} />
            <label className={labelClass}>
              <span>Votre support</span>
              <select name="assetType" defaultValue={project.assetType ?? ""} className={fieldClass}>
                <option value="">Je ne sais pas encore</option>
                {Object.entries(PROJECT_ASSET_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <TextField label={`Marque du ${vehicleNoun(project.assetType)}`} name="vehicleBrand" defaultValue={project.vehicleBrand} />
            <TextField label="Modèle" name="vehicleModel" defaultValue={project.vehicleModel} />
            <TextField label="Année" name="vehicleYear" defaultValue={project.vehicleYear} />
            <TextField label="Motorisation" name="vehicleEngine" defaultValue={project.vehicleEngine} />
            <TextField
              label={project.assetType === "VAN" || project.assetType === null ? "Gabarit (L2H2...)" : "Gabarit"}
              name="vehicleFormat"
              defaultValue={project.vehicleFormat}
            />
            <TextField label="Dimensions utiles" name="vehicleDimensions" defaultValue={project.vehicleDimensions} />
            <TextField label="Pays d'immatriculation" name="registrationCountry" defaultValue={project.registrationCountry} />
            <TextField label="Pays d'usage" name="usageCountry" defaultValue={project.usageCountry} />
            <TextAreaField label="Démarche d'homologation" name="homologationNotes" defaultValue={project.homologationNotes} />
            <label className={labelClass}>
              <span>Où en êtes-vous ?</span>
              <select name="projectStage" defaultValue={project.projectStage ?? ""} className={fieldClass}>
                <option value="">À définir avec Fabsystem</option>
                <option value="Idée">Idée</option>
                <option value="Véhicule acheté">Véhicule acheté</option>
                <option value="Aménagement en cours">Aménagement en cours</option>
                <option value="Installation partielle">Installation partielle</option>
                <option value="Installation existante à modifier">Installation existante à modifier</option>
              </select>
            </label>
            <label className={labelClass}>
              <span>Votre niveau en électricité</span>
              <select name="niveauClient" defaultValue={project.niveauClient ?? ""} className={fieldClass}>
                <option value="">À définir avec Fabsystem</option>
                <option value="DEBUTANT">Je débute</option>
                <option value="INTERMEDIAIRE">J&apos;ai quelques bases</option>
                <option value="AVANCE">J&apos;ai déjà pratiqué</option>
              </select>
            </label>
            <TextField label="Qui réalisera les travaux ?" name="whoDoesTheWork" defaultValue={project.whoDoesTheWork} />
            <TextField label="Échéance de départ souhaitée" name="startDeadline" defaultValue={project.startDeadline} />
            <TextAreaField label="Sujets sur lesquels être accompagné" name="coachingTopics" defaultValue={project.coachingTopics} />
            <TextAreaField label="Votre objectif principal" name="objectifs" defaultValue={project.objectifs} />
            <TextAreaField label="Vos trois priorités" name="threePriorities" defaultValue={project.threePriorities} />
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {activeStep === 2 ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Votre quotidien et votre recharge</h2>
          <form action={updateUsagesInfoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="expectedUsagesUpdatedAt" value={project.usagesUpdatedAt.toISOString()} />
            <TextField label="Nombre de voyageurs" name="travelerCount" defaultValue={project.travelerCount} />
            <label className={labelClass}>
              <span>Votre utilisation</span>
              <select name="usagePattern" defaultValue={project.usagePattern ?? ""} className={fieldClass}>
                <option value="">À définir avec Fabsystem</option>
                <option value="Week-ends">Week-ends</option>
                <option value="Vacances">Vacances</option>
                <option value="Longs voyages">Longs voyages</option>
                <option value="Vie à l'année">Vie à l&apos;année</option>
              </select>
            </label>
            <TextAreaField label="Télétravail (durée quotidienne)" name="remoteWorkNotes" defaultValue={project.remoteWorkNotes} />
            <TextAreaField label="Saisons, régions, températures" name="seasonsRegionsNotes" defaultValue={project.seasonsRegionsNotes} />
            <TextField label="Stationnement (soleil / ombre)" name="parkingExposure" defaultValue={project.parkingExposure} />
            <TextField label="Jours souhaités sans recharge" name="daysWithoutRecharge" defaultValue={project.daysWithoutRecharge} />
            <TextField label="Autonomie minimale sans recharge" name="minAutonomyNoRecharge" defaultValue={project.minAutonomyNoRecharge} />
            <TextAreaField label="Appareils indispensables si énergie limitée" name="criticalDevicesWhenLow" defaultValue={project.criticalDevicesWhenLow} />
            <TextAreaField label="Conduite : temps et fréquence" name="drivingHabits" defaultValue={project.drivingHabits} />
            <TextField label="Disponibilité du secteur" name="shorePowerAvailability" defaultValue={project.shorePowerAvailability} />
            <label className={labelClass}>
              <span>Solaire envisagé ?</span>
              <select name="solarPreference" defaultValue={project.solarPreference ?? ""} className={fieldClass}>
                <option value="">À étudier ensemble</option>
                <option value="Souhaité">Souhaité</option>
                <option value="Non souhaité">Non souhaité</option>
                <option value="À étudier">À étudier</option>
              </select>
            </label>
            <TextField label="Fixe ou portable ?" name="solarMounting" defaultValue={project.solarMounting} />
            <TextAreaField label="Espace et obstacles sur le toit" name="solarRoofSpaceNotes" defaultValue={project.solarRoofSpaceNotes} />
            <TextAreaField label="Autres sources d'énergie envisagées" name="otherEnergySources" defaultValue={project.otherEnergySources} />
            <TextAreaField label="Évolutions futures envisagées" name="plannedEquipmentNotes" defaultValue={project.plannedEquipmentNotes} />
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {activeStep === 3 ? (
        <>
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Ajouter un appareil</h2>
            <p className={`mt-1 ${hintClass}`}>Une référence manque ? Vous pourrez la compléter avec votre coach.</p>
            <form action={createDeviceAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="projectId" value={project.id} />
              <TextField label="Nom de l'appareil" name="name" placeholder="Réfrigérateur" />
              <TextField label="Catégorie" name="category" placeholder="Réfrigérateur, éclairage, pompe..." />
              <label className={labelClass}>
                <span>Quantité</span>
                <input name="quantity" type="number" min={1} defaultValue={1} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span>Alimentation</span>
                <select name="powerSupply" defaultValue="INCONNU" className={fieldClass}>
                  <option value="DC12">DC 12 V</option>
                  <option value="DC24">DC 24 V</option>
                  <option value="DC_AUTRE">DC autre</option>
                  <option value="USB">USB</option>
                  <option value="AC230">AC 230 V</option>
                  <option value="INCONNU">Je ne sais pas</option>
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span>Comment estimer sa consommation ?</span>
                <select name="calcMethod" defaultValue="PUISSANCE_TEMPS" className={fieldClass}>
                  <option value="PUISSANCE_TEMPS">Puissance × durée d&apos;utilisation par jour</option>
                  <option value="ENERGIE_JOUR">Consommation quotidienne déjà connue (Wh/j)</option>
                  <option value="RECHARGE_CYCLE">Recharge / cycle (Wh par cycle × cycles/jour)</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>Puissance (W)</span>
                <input name="continuousPowerW" type="number" min={0} step="any" placeholder="À définir avec Fabsystem" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span>Durée effective par jour (h)</span>
                <input name="effectiveHoursPerDay" type="number" min={0} max={24} step="any" placeholder="À définir avec Fabsystem" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span>Ou : consommation quotidienne connue (Wh/j)</span>
                <input name="dailyEnergyWhPerUnit" type="number" min={0} step="any" placeholder="À définir avec Fabsystem" className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span>Ou : énergie par cycle (Wh) × cycles/jour</span>
                <div className="flex gap-2">
                  <input name="energyPerCycleWh" type="number" min={0} step="any" placeholder="Wh/cycle" className={fieldClass} />
                  <input name="cyclesPerDay" type="number" min={0} step="any" placeholder="cycles/j" className={fieldClass} />
                </div>
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto">＋ Ajouter l&apos;appareil</Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-950">Mes appareils</h2>
              <span className={hintClass}>{devices.length} équipement{devices.length > 1 ? "s" : ""}</span>
            </div>
            {devices.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">Aucun appareil pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 divide-y divide-neutral-200">
                {devices.map((device) => {
                  const deviceBilan = bilan?.perDevice.find((p) => p.deviceId === device.id);
                  return (
                    <li key={device.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-semibold text-neutral-900">{device.name || device.category}</p>
                        <p className="text-xs text-neutral-500">
                          {device.category} · {getCoachingPowerSupplyLabel(device.powerSupply)} · {device.quantity} ×
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-900">
                          {deviceBilan?.energyWh != null ? `${Math.round(deviceBilan.energyWh)} Wh/j` : "À préciser"}
                        </span>
                        <form action={deleteDeviceAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="deviceId" value={device.id} />
                          <Button type="submit" variant="tertiary">Retirer</Button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {bilan ? (
            <Card className="bg-neutral-900 p-6 text-white">
              <p className={bilan.isIncomplete ? "text-amber-300" : "text-neutral-300"}>
                {bilan.isIncomplete ? "Bilan incomplet — certains appareils manquent de données" : "Votre besoin quotidien"}
              </p>
              <p className="mt-2 text-4xl font-semibold tabular-nums">
                {Math.round(bilan.totalWhPerDay)} <span className="text-base font-normal">Wh / jour</span>
              </p>
              <p className="mt-1 text-xs text-neutral-400">Hors pertes et marge de dimensionnement — votre coach affinera ce chiffre.</p>
            </Card>
          ) : null}
        </>
      ) : null}

      {activeStep === 4 ? (
        <>
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Ajouter un matériel</h2>
            <p className={`mt-1 ${hintClass}`}>Batterie, panneaux, régulateur, chargeur… ce que vous avez déjà ou avez choisi.</p>
            <form action={createMaterialAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="projectId" value={project.id} />
              <label className={labelClass}>
                <span>Catégorie</span>
                <select name="category" defaultValue="BATTERIE" className={fieldClass}>
                  <option value="BATTERIE">Batterie</option>
                  <option value="BMS">BMS</option>
                  <option value="PANNEAU_SOLAIRE">Panneau solaire</option>
                  <option value="REGULATEUR">Régulateur</option>
                  <option value="CHARGEUR_MOTEUR">Chargeur moteur</option>
                  <option value="CHARGEUR_SECTEUR">Chargeur secteur</option>
                  <option value="CONVERTISSEUR">Convertisseur</option>
                  <option value="DISTRIBUTION">Distribution</option>
                  <option value="PROTECTION">Protection</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>Quantité</span>
                <input name="quantity" type="number" min={1} defaultValue={1} className={fieldClass} />
              </label>
              <TextField label="Marque" name="brand" />
              <TextField label="Référence" name="reference" />
              <label className={labelClass}>
                <span>État</span>
                <select name="state" defaultValue="ENVISAGE" className={fieldClass}>
                  <option value="ENVISAGE">Envisagé</option>
                  <option value="CHOISI">Choisi</option>
                  <option value="ACHETE">Acheté</option>
                  <option value="INSTALLE">Installé</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>Déjà en place, à conserver ?</span>
                <select name="keepExisting" defaultValue="" className={fieldClass}>
                  <option value="">Sans objet (pas encore en place)</option>
                  <option value="true">Oui, à conserver</option>
                  <option value="false">Non, à remplacer</option>
                </select>
              </label>
              <TextAreaField label="Dysfonctionnements connus (si déjà en place)" name="knownIssues" />
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto">＋ Ajouter</Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Mon matériel</h2>
            {materials.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">Aucun matériel pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 divide-y divide-neutral-200">
                {materials.map((material) => (
                  <li key={material.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{getCoachingMaterialCategoryLabel(material.category)}</p>
                      <p className="text-xs text-neutral-500">{material.brand ?? "—"} {material.reference ?? ""} · {material.quantity} ×</p>
                    </div>
                    <form action={deleteMaterialAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="materialId" value={material.id} />
                      <Button type="submit" variant="tertiary">Retirer</Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Photos, plans et documents</h2>
            <p className={`mt-1 ${hintClass}`}>Uniquement des photos prises sans danger — sans dépose de protections ni accès à des parties sous tension.</p>
            {documents.length > 0 ? (
              <ul className="mt-4 divide-y divide-neutral-200">
                {documents.map((document) => (
                  <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <a
                      href={`/api/coaching-projects/documents/${document.id}`}
                      className="text-base font-medium text-neutral-900 underline underline-offset-2"
                    >
                      {document.filename}
                    </a>
                    <span className="text-sm text-neutral-500">
                      {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">Aucun document pour l&apos;instant.</p>
            )}
            <form action={uploadOwnCoachingProjectDocumentAction} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="projectId" value={project.id} />
              <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required className="text-sm text-neutral-700" />
              <Button type="submit" variant="secondary">Envoyer</Button>
            </form>
          </Card>
        </>
      ) : null}

      {activeStep === 5 ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Votre implantation</h2>
          <form action={updateImplantationInfoAction} className="mt-4 grid gap-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="expectedImplantationUpdatedAt" value={project.implantationUpdatedAt.toISOString()} />
            <TextAreaField label="Croquis, emplacements et volumes disponibles pour la batterie" name="implantationNotes" defaultValue={project.implantationNotes} />
            <TextAreaField label="Contraintes de ventilation, température, eau, accessibilité" name="ventilationConstraints" defaultValue={project.ventilationConstraints} />
            <TextAreaField label="Position des prises, éclairages et commandes" name="outletsLightingNotes" defaultValue={project.outletsLightingNotes} />
            <TextAreaField label="Tension, alternateur, contraintes constructeur (si connu)" name="vehicleElectricalNotes" defaultValue={project.vehicleElectricalNotes} />
            <TextField label="D'où vient cette information ?" name="vehicleElectricalSource" defaultValue={project.vehicleElectricalSource} placeholder="Manuel constructeur, mesure, estimation…" />
            <div>
              <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <form action={sendForReviewAction}>
        <input type="hidden" name="projectId" value={project.id} />
        <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={Boolean(project.readyForReviewAt)}>
          {project.readyForReviewAt ? "Relecture demandée ✓" : "Envoyer pour relecture"}
        </Button>
      </form>
    </div>
  );
}
