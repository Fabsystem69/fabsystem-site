import Link from "next/link";

// Lien contextuel vers un outil ou une ressource FabSystem, inséré dans le
// corps d'un module /formations/*. Le style reste stable d'un module à
// l'autre (repère visuel cohérent), mais le contenu (children, href, label)
// est toujours spécifique au point du cours où il apparaît — jamais un
// bloc générique "voir nos outils" recopié tel quel.
export function ModuleToolLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <p className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm leading-relaxed text-neutral-700">
      {children}{" "}
      <Link
        href={href}
        className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
      >
        {label} →
      </Link>
    </p>
  );
}
