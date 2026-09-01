import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatEuroFromCents } from "@/lib/format";
import { getCategorieLabel } from "@/lib/prestations-packs";
import type { BoutiqueGuideEntry } from "./types";

function getProductTypeLabel(value: BoutiqueGuideEntry["productType"]) {
  switch (value) {
    case "EBOOK":
      return "Ebook";
    case "DIGITAL_DOWNLOAD":
      return "Téléchargement";
    case "BUNDLE":
      return "Bundle";
  }
}

// Ordre imposé par Boutique/03-GUIDES-DISPONIBLES.md : couverture → univers
// → titre → bénéfice → formats → prix → mention déduction → CTA. "Déjà
// dans votre bibliothèque" prime sur tout le reste (§14).
export function ProductCard({ entry }: { entry: BoutiqueGuideEntry }) {
  return (
    <article className="flex h-full flex-col rounded-card border border-neutral-200 bg-white p-6 shadow-card">
      {entry.featuredImage ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          <Image
            src={entry.featuredImage}
            alt={entry.name}
            width={400}
            height={534}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 384px"
            className="h-60 w-full object-cover object-top"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {entry.univers ? <Badge tone="neutral">{getCategorieLabel(entry.univers)}</Badge> : null}
        {entry.slug === "ebook-schema-electrique" ? (
          <Badge tone="info">1 mois d&apos;éditeur illimité inclus</Badge>
        ) : null}
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {getProductTypeLabel(entry.productType)}
        </span>
      </div>

      <h3 className="mt-2 text-xl font-semibold text-neutral-950">{entry.name}</h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
        {entry.shortDescription || "Description bientôt disponible."}
      </p>

      {entry.pageCount || entry.formatsCount ? (
        <p className="mt-3 text-xs font-medium text-neutral-500">
          {entry.pageCount ? `~${entry.pageCount} pages` : null}
          {entry.pageCount && entry.formatsCount ? " · " : null}
          {entry.formatsCount ? `${entry.formatsCount} format${entry.formatsCount > 1 ? "s" : ""} inclus` : null}
        </p>
      ) : null}

      <p className="mt-3 text-base font-semibold text-neutral-950">
        {formatEuroFromCents(entry.priceCents)}
      </p>

      {entry.isDeductible ? (
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Déductible de votre accompagnement FabSystem.
        </p>
      ) : null}

      <div className="mt-4">
        {entry.owned ? (
          <Button href={`/boutique/${entry.slug}`} variant="secondary" className="w-full">
            Voir le guide
          </Button>
        ) : (
          <Button href={`/boutique/${entry.slug}`} variant="primary" className="w-full">
            Découvrir le guide
          </Button>
        )}
      </div>

      {entry.owned ? (
        <p className="mt-2 text-center text-xs font-semibold text-emerald-700">
          Déjà dans votre bibliothèque
        </p>
      ) : null}
    </article>
  );
}
