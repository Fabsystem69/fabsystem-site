import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isHttpError } from "@/lib/http-errors";
import { getProject } from "@/lib/services/project";
import { listMissingCableLengths } from "@/lib/services/project-schema";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitCableLengthsAction } from "./actions";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export const metadata: Metadata = {
  title: "Compléter le schéma",
  robots: { index: false, follow: false },
};

// Cas régulier de l'accompagnement (retour utilisateur : "rendre
// participatif, demande des distances de câble ou autre") : l'admin
// construit la topologie mais ne connaît pas les distances réelles dans le
// véhicule du client — un formulaire ciblé plutôt que l'éditeur complet,
// pour ne demander que ce qui manque réellement (lib/services/project-schema.ts
// listMissingCableLengths, dérivé de l'état des câbles, aucun champ dédié).
export default async function CompleterProjetPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const { error, success } = await searchParams;
  const actor = await requireCustomerActor();

  let project;
  try {
    project = await getProject(actor, projectId);
  } catch (err) {
    if (isHttpError(err) && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const missing = await listMissingCableLengths(actor, projectId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Compléter le schéma — {project.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Certaines distances de câble n&apos;ont pas encore été renseignées. Indiquez-les ci-dessous,
          en mètres, le plus précisément possible.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {missing.length === 0 ? (
        <Card className="p-6 text-sm text-neutral-600">
          Tout est renseigné, merci !{" "}
          <Link href={`/mon-compte/projets/${projectId}`} className="underline underline-offset-2">
            Retour au projet
          </Link>
        </Card>
      ) : (
        <form action={submitCableLengthsAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <Card className="divide-y divide-neutral-100 p-0">
            {missing.map((item) => (
              <div key={item.edgeId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="text-sm text-neutral-800">{item.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name={`length_${item.edgeId}`}
                    placeholder="Longueur"
                    className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                  />
                  <span className="text-xs text-neutral-500">m</span>
                </div>
              </div>
            ))}
          </Card>
          <Button type="submit" variant="primary">
            Enregistrer
          </Button>
        </form>
      )}
    </div>
  );
}
