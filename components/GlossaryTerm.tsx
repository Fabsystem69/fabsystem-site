import { Tooltip } from "@/components/Tooltip";
import { getGlossaryDefinition } from "@/lib/technical-glossary";

const DEFAULT_CLASS =
  "underline decoration-dotted decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700";

type GlossaryTermProps = {
  term: string;
  className?: string;
};

// Affiche un terme technique tel quel ; si une definition existe dans
// lib/technical-glossary.ts, l'entoure d'une info-bulle (Tooltip) avec un
// petit marqueur "?" — sinon rendu en texte simple, sans rien inventer.
export function GlossaryTerm({ term, className }: GlossaryTermProps) {
  const definition = getGlossaryDefinition(term);

  if (!definition) {
    return <span className={className}>{term}</span>;
  }

  return (
    <Tooltip label={definition} className={className ?? DEFAULT_CLASS}>
      {term}
      <span aria-hidden="true" className="ml-1 text-[10px] opacity-70">
        ⓘ
      </span>
    </Tooltip>
  );
}
