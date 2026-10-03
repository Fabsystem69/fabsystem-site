import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { getCoachingMaterialCategoryLabel } from "@/lib/dashboard-status-labels";
import type { CoachingMaterial, CoachingProjectDocument } from "@/lib/generated/prisma/client";
import {
  createMaterialAction,
  deleteMaterialAction,
  uploadOwnCoachingProjectDocumentAction,
} from "@/app/mon-compte/mon-van/actions";
import { TextAreaField, TextField, fieldClass, hintClass, labelClass } from "./FormFields";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MaterialsStep({
  projectId,
  materials,
  documents,
}: {
  projectId: string;
  materials: readonly Pick<CoachingMaterial, "id" | "category" | "brand" | "reference" | "quantity">[];
  documents: readonly Pick<CoachingProjectDocument, "id" | "filename" | "sizeBytes" | "createdAt">[];
}) {
  return (
    <>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Ajouter un matériel</h2>
        <p className={`mt-1 ${hintClass}`}>Batterie, panneaux, régulateur, chargeur… ce que vous avez déjà ou avez choisi.</p>
        <form action={createMaterialAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
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
                  <input type="hidden" name="projectId" value={projectId} />
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
          <input type="hidden" name="projectId" value={projectId} />
          <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required className="text-sm text-neutral-700" />
          <Button type="submit" variant="secondary">Envoyer</Button>
        </form>
      </Card>
    </>
  );
}
