import type { Metadata } from "next";
import Link from "next/link";
import { CreateProjectForm } from "@/components/customer/dashboard/CreateProjectForm";

export const metadata: Metadata = {
  title: "Nouveau projet",
  description: "Créer un nouveau projet FabSystem.",
  alternates: { canonical: "/mon-compte/projets/nouveau" },
};

export default function NouveauProjetPage() {
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
        <p className="mt-1 text-sm text-neutral-600">
          Le strict nécessaire pour démarrer — vous complèterez le reste progressivement.
        </p>
      </div>

      <CreateProjectForm />
    </div>
  );
}
