import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateProjectForm } from "@/components/customer/dashboard/CreateProjectForm";
import { STANDARD_PROJECT_LIMIT, listProjectsForCustomer } from "@/lib/services/project";
import { requireCustomerActor } from "@/lib/server/project-actor";

export const metadata: Metadata = {
  title: "Nouveau projet",
  description: "Créer un nouveau projet FabSystem.",
  alternates: { canonical: "/mon-compte/projets/nouveau" },
  robots: { index: false, follow: false },
};

// UI-9 FINAL §10 : la limite de 3 projets est vérifiée avant d'afficher le
// formulaire — un client qui accède directement à cette URL alors que la
// limite est atteinte ne doit jamais remplir un formulaire pour recevoir
// une erreur ensuite. Le backend (lib/services/project.ts, conflict 409)
// reste la source de vérité et le seul contrôle réellement bloquant ;
// cette vérification n'est qu'un confort d'affichage en amont.
export default async function NouveauProjetPage() {
  const actor = await requireCustomerActor();
  const customerId = actor.role === "customer" ? actor.customerId : "";
  const projects = await listProjectsForCustomer(actor, customerId);
  const limitReached = projects.length >= STANDARD_PROJECT_LIMIT;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/mon-compte/projets"
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
        >
          ← Mes projets
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">
          Commencer un projet
        </h1>
        {!limitReached ? (
          <p className="mt-1 text-sm text-neutral-600">
            Le strict nécessaire pour démarrer — vous complèterez le reste progressivement.
          </p>
        ) : null}
      </div>

      {limitReached ? (
        <Card className="p-6">
          <p className="text-sm font-semibold text-neutral-950">
            Vous avez atteint la limite de {STANDARD_PROJECT_LIMIT} projets.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Archivez ou supprimez définitivement un projet existant pour en libérer une place, ou
            reprenez un projet déjà commencé.
          </p>
          <div className="mt-4">
            <Button href="/mon-compte/projets" variant="secondary">
              ← Mes projets
            </Button>
          </div>
        </Card>
      ) : (
        <CreateProjectForm />
      )}
    </div>
  );
}
