"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Je ne sais pas par où commencer. C'est normal ?",
    a: "Oui, c'est la situation la plus courante. Une visio conseil de 30 min suffit pour cadrer votre projet, identifier les priorités et définir la bonne suite : diagnostic sur site, devis ou simplement quelques conseils. C'est sans engagement.",
  },
  {
    q: "Mon bateau a déjà une installation. Pouvez-vous intervenir dessus ?",
    a: "Absolument. C'est même le cas le plus fréquent. Une installation existante peut cacher des non-conformités, des câblages sous-dimensionnés ou des protections inadaptées. Le diagnostic sur site permet de tout clarifier avant d'intervenir.",
  },
  {
    q: "Est-ce que vous intervenez uniquement sur des bateaux ?",
    a: "Non. FabSystem intervient sur bateaux, vans aménagés et camping-cars. Les contraintes 12V/230V embarquées sont similaires, l'approche reste la même : fiabilité, sécurité, documentation.",
  },
  {
    q: "Vous pouvez faire le schéma électrique complet de mon bateau ?",
    a: "Oui. La prestation Schéma & documentation produit un plan complet de votre installation avec repérage, couleurs normalisées et nomenclature. Indispensable pour la maintenance, la vente ou une mise en conformité.",
  },
  {
    q: "Combien de temps dure une intervention ?",
    a: "Ça dépend du niveau : une visio conseil dure 45 à 60 min, un diagnostic sur site 2 à 3h selon la complexité. Une installation complète s'étale généralement sur une ou deux journées. Tout est planifié à l'avance sur rendez-vous.",
  },
  {
    q: "Quelle est la zone d'intervention ?",
    a: "L'intervention physique se fait principalement en Rhone-Alpes . La visio conseil et le conseil par schéma sont disponibles partout en France.",
  },
  {
    q: "Accompagnement à distance (Instal') : je débute complètement, c'est pour moi ?",
    a: "Oui. L'accompagnement part de votre niveau réel et avance à votre rythme — le diagnostic initial sert justement à cadrer ce qui est faisable seul et ce qui demande plus d'attention.",
  },
  {
    q: "Et si mon chantier dure plus de 2 mois ?",
    a: "Le suivi mensuel prend le relais après les 2 mois, mois par mois, tant que le chantier avance.",
  },
  {
    q: "Comment se passe le suivi à distance concrètement (photo/message/vocal) ?",
    a: "Vous envoyez des photos et des messages au fil du chantier, avec des points vidéo réguliers pour faire le bilan et valider les étapes avant de continuer.",
  },
];

export default function FaqPrestations() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
      {faqs.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-neutral-900">
              {item.q}
            </span>
            <span className="mt-0.5 shrink-0 text-neutral-400">
              {open === i ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 9h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 4.5v9M4.5 9h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </span>
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
