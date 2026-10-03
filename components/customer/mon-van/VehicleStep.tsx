import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceSelect } from "@/components/shared/ChoiceSelect";
import { ASSET_TYPE_OPTIONS, CLIENT_LEVEL_OPTIONS, PROJECT_STAGE_CHOICES } from "@/lib/coaching-form-options";
import type { CoachingProject } from "@/lib/generated/prisma/client";
import { updateVehicleInfoAction } from "@/app/mon-compte/mon-van/actions";
import { TextAreaField, TextField, fieldClass, labelClass, type Draft } from "./FormFields";

type VehicleProject = Pick<
  CoachingProject,
  | "id" | "assetType" | "vehicleInfoUpdatedAt" | "vehicleBrand" | "vehicleModel" | "vehicleYear" | "vehicleEngine"
  | "vehicleFormat" | "vehicleDimensions" | "registrationCountry" | "usageCountry" | "homologationNotes"
  | "projectStage" | "niveauClient" | "whoDoesTheWork" | "startDeadline" | "coachingTopics" | "objectifs"
  | "threePriorities" | "materialBudgetCents" | "laborBudgetCents"
>;

function euros(cents: number | null) {
  return cents == null ? "" : String(cents / 100);
}

// Libellés adaptés au support : seul le vocabulaire change ("véhicule" ne
// convient pas à un bateau), jamais un questionnaire inventé.
function vehicleNoun(assetType: string | null) {
  return assetType === "BOAT" ? "bateau" : "véhicule";
}

export function VehicleStep({ project, draft }: { project: VehicleProject; draft: Draft }) {
  const noun = vehicleNoun(project.assetType);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-neutral-950">Votre projet et votre {noun}</h2>
      <form action={updateVehicleInfoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="expectedVehicleInfoUpdatedAt" value={project.vehicleInfoUpdatedAt.toISOString()} />
        <ChoiceSelect
          label="Votre support"
          name="assetType"
          options={ASSET_TYPE_OPTIONS}
          defaultValue={draft?.assetType ?? project.assetType}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <TextField label={`Marque du ${noun}`} name="vehicleBrand" defaultValue={draft?.vehicleBrand ?? project.vehicleBrand} />
        <TextField label="Modèle" name="vehicleModel" defaultValue={draft?.vehicleModel ?? project.vehicleModel} />
        <TextField label="Année" name="vehicleYear" defaultValue={draft?.vehicleYear ?? project.vehicleYear} />
        <TextField label="Motorisation" name="vehicleEngine" defaultValue={draft?.vehicleEngine ?? project.vehicleEngine} />
        <TextField
          label={project.assetType === "VAN" || project.assetType === null ? "Gabarit (L2H2...)" : "Gabarit"}
          name="vehicleFormat"
          defaultValue={draft?.vehicleFormat ?? project.vehicleFormat}
        />
        <TextField label="Dimensions utiles" name="vehicleDimensions" defaultValue={draft?.vehicleDimensions ?? project.vehicleDimensions} />
        <TextField label="Pays d'immatriculation" name="registrationCountry" defaultValue={draft?.registrationCountry ?? project.registrationCountry} />
        <TextField label="Pays d'usage" name="usageCountry" defaultValue={draft?.usageCountry ?? project.usageCountry} />
        <TextAreaField label="Démarche d'homologation" name="homologationNotes" defaultValue={draft?.homologationNotes ?? project.homologationNotes} />
        <ChoiceSelect
          label="Où en êtes-vous ?"
          name="projectStage"
          options={PROJECT_STAGE_CHOICES}
          defaultValue={draft?.projectStage ?? project.projectStage}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <ChoiceSelect
          label="Votre niveau en électricité"
          name="niveauClient"
          options={CLIENT_LEVEL_OPTIONS}
          defaultValue={draft?.niveauClient ?? project.niveauClient}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <TextField label="Qui réalisera les travaux ?" name="whoDoesTheWork" defaultValue={draft?.whoDoesTheWork ?? project.whoDoesTheWork} />
        <TextField label="Échéance de départ souhaitée" name="startDeadline" defaultValue={draft?.startDeadline ?? project.startDeadline} />
        <TextField
          label="Budget matériel indicatif (€)"
          name="materialBudgetEuros"
          type="number"
          defaultValue={draft?.materialBudgetEuros ?? euros(project.materialBudgetCents)}
        />
        <TextField
          label="Budget main-d'œuvre indicatif (€)"
          name="laborBudgetEuros"
          type="number"
          defaultValue={draft?.laborBudgetEuros ?? euros(project.laborBudgetCents)}
        />
        <TextAreaField label="Sujets sur lesquels être accompagné" name="coachingTopics" defaultValue={draft?.coachingTopics ?? project.coachingTopics} />
        <TextAreaField label="Votre objectif principal" name="objectifs" defaultValue={draft?.objectifs ?? project.objectifs} />
        <TextAreaField label="Vos trois priorités" name="threePriorities" defaultValue={draft?.threePriorities ?? project.threePriorities} />
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
