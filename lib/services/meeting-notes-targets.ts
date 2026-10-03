import { notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import type { MeetingTarget } from "@/lib/crm/meeting-notes-contract";

export type MeetingTargetOption = {
  kind: "coaching_project" | "prospect";
  id: string;
  label: string;
  sublabel: string | null;
};

// Dossiers que Fabien peut choisir comme destinataire d'un compte rendu :
// projets coaching non termines et prospects encore ouverts. La liste est
// proposee telle quelle, jamais filtree ni choisie par l'IA.
export async function listMeetingTargets(): Promise<MeetingTargetOption[]> {
  const [projects, prospects] = await Promise.all([
    prisma.coachingProject.findMany({
      where: { status: { not: "TERMINE" } },
      select: { id: true, title: true, customer: { select: { name: true, email: true } } },
      orderBy: { derniereActivite: "desc" },
      take: 300,
    }),
    prisma.prospect.findMany({
      where: { status: { notIn: ["GAGNE", "SANS_SUITE"] } },
      select: { id: true, name: true, status: true },
      orderBy: { derniereActivite: "desc" },
      take: 300,
    }),
  ]);

  return [
    ...projects.map((project) => ({
      kind: "coaching_project" as const,
      id: project.id,
      label: project.customer.name || project.customer.email,
      sublabel: project.title,
    })),
    ...prospects.map((prospect) => ({
      kind: "prospect" as const,
      id: prospect.id,
      label: prospect.name,
      sublabel: prospect.status,
    })),
  ];
}

export async function resolveMeetingTarget(target: Pick<MeetingTarget, "kind"> & { id: string }) {
  if (target.kind === "coaching_project") {
    const project = await prisma.coachingProject.findUnique({
      where: { id: target.id },
      select: { id: true, title: true, customer: { select: { name: true, email: true } } },
    });
    if (!project) throw notFound("Projet introuvable.");
    return { label: project.customer.name || project.customer.email, href: `/dashboard/crm/projects/${project.id}` };
  }

  const prospect = await prisma.prospect.findUnique({ where: { id: target.id }, select: { id: true, name: true } });
  if (!prospect) throw notFound("Prospect introuvable.");
  return { label: prospect.name, href: `/dashboard/crm/prospects/${prospect.id}` };
}
