import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ExistingInstallationFields } from "@/components/shared/ExistingInstallationFields";
import { parseExistingInstallation } from "@/lib/crm/existing-installation";
import type { CoachingProject } from "@/lib/generated/prisma/client";
import { updateImplantationInfoAction } from "@/app/mon-compte/mon-van/actions";
import { TextAreaField, TextField, type Draft } from "./FormFields";

type ImplantationProject = Pick<
  CoachingProject,
  | "id" | "implantationUpdatedAt" | "implantationNotes" | "ventilationConstraints" | "outletsLightingNotes"
  | "vehicleElectricalNotes" | "vehicleElectricalSource" | "existingInstallation"
>;

export function ImplantationStep({ project, draft }: { project: ImplantationProject; draft: Draft }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-neutral-950">Votre implantation</h2>
      <form action={updateImplantationInfoAction} className="mt-4 grid gap-4">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="expectedImplantationUpdatedAt" value={project.implantationUpdatedAt.toISOString()} />
        <TextAreaField label="Croquis, emplacements et volumes disponibles pour la batterie" name="implantationNotes" defaultValue={draft?.implantationNotes ?? project.implantationNotes} />
        <TextAreaField label="Contraintes de ventilation, température, eau, accessibilité" name="ventilationConstraints" defaultValue={draft?.ventilationConstraints ?? project.ventilationConstraints} />
        <TextAreaField label="Position des prises, éclairages et commandes" name="outletsLightingNotes" defaultValue={draft?.outletsLightingNotes ?? project.outletsLightingNotes} />
        <TextAreaField label="Tension, alternateur, contraintes constructeur (si connu)" name="vehicleElectricalNotes" defaultValue={draft?.vehicleElectricalNotes ?? project.vehicleElectricalNotes} />
        <TextField
          label="D'où vient cette information ?"
          name="vehicleElectricalSource"
          defaultValue={draft?.vehicleElectricalSource ?? project.vehicleElectricalSource}
          placeholder="Manuel constructeur, mesure, estimation…"
        />
        <ExistingInstallationFields variant="customer" current={parseExistingInstallation(project.existingInstallation)} draft={draft} />
        <div>
          <Button type="submit" className="w-full sm:w-auto">Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
