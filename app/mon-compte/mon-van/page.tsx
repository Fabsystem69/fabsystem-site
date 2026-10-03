import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mon dossier technique",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// La plupart des clients n'ont qu'un seul projet van : on saute directement
// dessus plutôt que d'imposer un clic supplémentaire. Une vraie liste ne
// s'affiche que si plusieurs projets existent.
export default async function MonVanIndexPage() {
  const actor = await requireCustomerActor();
  if (actor.role !== "customer") redirect("/mon-compte");

  const projects = await prisma.coachingProject.findMany({
    where: { customerId: actor.customerId },
    orderBy: { derniereActivite: "desc" },
    select: { id: true, title: true },
  });

  if (projects.length === 1) redirect(`/mon-compte/mon-van/${projects[0].id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Mon dossier technique</h1>
        <p className="mt-1 text-sm text-neutral-600">Votre dossier d&apos;accompagnement électrique.</p>
      </div>

      {projects.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-neutral-600">
            Aucun dossier pour l&apos;instant — il sera disponible dès que votre coach l&apos;aura préparé.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/mon-compte/mon-van/${project.id}`}>
                <Card className="p-5 hover:border-neutral-300">
                  <p className="font-semibold text-neutral-950">{project.title}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
