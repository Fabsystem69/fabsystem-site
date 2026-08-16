import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { OutilMeta } from "@/lib/outils-catalog";

// UI-10 (correctif final) — carte uniforme pour les calculateurs : même
// famille visuelle stricte (largeur, hauteur, ratio d'image, radius,
// bordure, padding, emplacements) pour qu'aucun outil ne paraisse plus
// important qu'un autre. Identité visuelle réelle (illustration technique
// dédiée par outil), jamais un emoji, une icône générique ou un
// placeholder décoratif. Réutilisée telle quelle par le hub Outils et par
// le teaser Home (éviter la duplication).
export function OutilCard({
  outil,
  variant = "default",
}: {
  outil: OutilMeta;
  variant?: "default" | "compact";
}) {
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/outils/${outil.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-colors duration-150 hover:border-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <div
        className={`relative w-full overflow-hidden bg-neutral-100 ${
          isCompact ? "aspect-[16/10]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={outil.image}
          alt=""
          fill
          sizes={
            isCompact
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
          }
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className={`flex flex-1 flex-col ${isCompact ? "p-4" : "p-5"}`}>
        <Badge tone="info">{outil.tag}</Badge>
        <h3 className={`mt-2 font-bold text-neutral-950 ${isCompact ? "text-base" : "text-lg"}`}>
          {outil.title}
        </h3>
        <p
          className={`mt-1.5 flex-1 text-neutral-600 ${
            isCompact ? "text-xs leading-6" : "text-sm leading-relaxed"
          }`}
        >
          {outil.description}
        </p>
        <span
          className={`inline-flex items-center gap-1 font-semibold text-neutral-900 ${
            isCompact ? "mt-2.5 text-xs" : "mt-3 text-sm"
          }`}
        >
          {outil.cta}
          <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
