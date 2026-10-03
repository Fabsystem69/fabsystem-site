import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceSelect } from "@/components/shared/ChoiceSelect";
import {
  DAYS_WITHOUT_RECHARGE_CHOICES,
  SOLAR_PREFERENCE_CHOICES,
  USAGE_PATTERN_CHOICES,
} from "@/lib/coaching-form-options";
import type { CoachingProject } from "@/lib/generated/prisma/client";
import { updateUsagesInfoAction } from "@/app/mon-compte/mon-van/actions";
import { TextAreaField, TextField, fieldClass, labelClass, type Draft } from "./FormFields";

type UsagesProject = Pick<
  CoachingProject,
  | "id" | "usagesUpdatedAt" | "travelerCount" | "usagePattern" | "remoteWorkNotes" | "seasonsRegionsNotes"
  | "parkingExposure" | "daysWithoutRecharge" | "minAutonomyNoRecharge" | "criticalDevicesWhenLow" | "drivingHabits"
  | "shorePowerAvailability" | "solarPreference" | "solarMounting" | "solarRoofSpaceNotes" | "otherEnergySources"
  | "plannedEquipmentNotes"
>;

export function UsagesStep({ project, draft }: { project: UsagesProject; draft: Draft }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-neutral-950">Votre quotidien et votre recharge</h2>
      <form action={updateUsagesInfoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="expectedUsagesUpdatedAt" value={project.usagesUpdatedAt.toISOString()} />
        <TextField label="Nombre de voyageurs" name="travelerCount" defaultValue={draft?.travelerCount ?? project.travelerCount} />
        <ChoiceSelect
          label="Votre utilisation"
          name="usagePattern"
          options={USAGE_PATTERN_CHOICES}
          defaultValue={draft?.usagePattern ?? project.usagePattern}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <TextAreaField label="Télétravail (durée quotidienne)" name="remoteWorkNotes" defaultValue={draft?.remoteWorkNotes ?? project.remoteWorkNotes} />
        <TextAreaField label="Saisons, régions, températures" name="seasonsRegionsNotes" defaultValue={draft?.seasonsRegionsNotes ?? project.seasonsRegionsNotes} />
        <TextField label="Stationnement (soleil / ombre)" name="parkingExposure" defaultValue={draft?.parkingExposure ?? project.parkingExposure} />
        <ChoiceSelect
          label="Jours souhaités sans recharge"
          name="daysWithoutRecharge"
          options={DAYS_WITHOUT_RECHARGE_CHOICES}
          defaultValue={draft?.daysWithoutRecharge ?? project.daysWithoutRecharge}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <TextField label="Autonomie minimale sans recharge" name="minAutonomyNoRecharge" defaultValue={draft?.minAutonomyNoRecharge ?? project.minAutonomyNoRecharge} />
        <TextAreaField label="Appareils indispensables si énergie limitée" name="criticalDevicesWhenLow" defaultValue={draft?.criticalDevicesWhenLow ?? project.criticalDevicesWhenLow} />
        <TextAreaField label="Conduite : temps et fréquence" name="drivingHabits" defaultValue={draft?.drivingHabits ?? project.drivingHabits} />
        <TextField label="Disponibilité du secteur" name="shorePowerAvailability" defaultValue={draft?.shorePowerAvailability ?? project.shorePowerAvailability} />
        <ChoiceSelect
          label="Solaire envisagé ?"
          name="solarPreference"
          options={SOLAR_PREFERENCE_CHOICES}
          defaultValue={draft?.solarPreference ?? project.solarPreference}
          labelClassName={labelClass}
          selectClassName={fieldClass}
        />
        <TextField label="Fixe ou portable ?" name="solarMounting" defaultValue={draft?.solarMounting ?? project.solarMounting} />
        <TextAreaField label="Espace et obstacles sur le toit" name="solarRoofSpaceNotes" defaultValue={draft?.solarRoofSpaceNotes ?? project.solarRoofSpaceNotes} />
        <TextAreaField label="Autres sources d'énergie envisagées" name="otherEnergySources" defaultValue={draft?.otherEnergySources ?? project.otherEnergySources} />
        <TextAreaField label="Évolutions futures envisagées" name="plannedEquipmentNotes" defaultValue={draft?.plannedEquipmentNotes ?? project.plannedEquipmentNotes} />
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
