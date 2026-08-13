"use client";

import { useState } from "react";
import { Section } from "@/components/layout/Section";

// Services V2 — FAQ (docs/refonte-site-public/services/07-FAQ.md). Neuf
// questions/réponses reprises mot pour mot (§3-11) — FAQ commerciale
// transversale, pas un centre d'aide technique. Accordéon accessible :
// boutons réels, aria-expanded, association question/réponse (§21).
const FAQS = [
  {
    q: "Est-ce que FabSystem réalise aussi les travaux ?",
    a: "Oui. Fabien intervient directement sur les installations électriques de bateaux, vans et camping-cars : diagnostic, dépannage, installation, modification ou refit selon le projet. Les ebooks, outils et accompagnements à distance complètent cette activité terrain. Ils ne constituent pas l'unique activité de FabSystem.",
  },
  {
    q: "Je veux faire mon installation moi-même : pouvez-vous simplement m'accompagner ?",
    a: "Oui. Le parcours On fait ensemble est conçu pour cela. Vous restez celui qui réalise. Selon l'accompagnement choisi, Fabien peut vous aider à faire le point sur le projet, concevoir l'installation, vérifier les étapes importantes, répondre aux blocages et documenter l'installation finale.",
  },
  {
    q: "Je ne sais pas quelle formule choisir.",
    a: "Vous n'avez pas besoin d'être expert pour choisir. Pour un accompagnement à distance, Amarrage pour le bateau, Départ pour le van et Étape pour le camping-car servent justement à faire le point avant de décider jusqu'où vous souhaitez être accompagné. Pour une intervention terrain, décrivez simplement votre besoin : FabSystem qualifiera la demande et vous indiquera la suite adaptée.",
  },
  {
    q: "J'ai déjà acheté un ebook FabSystem. Est-ce que je repaie tout si j'ai besoin d'aide ?",
    a: "Pas nécessairement. Lorsqu'un ebook est éligible, le montant prévu peut être pris en compte si vous passez ensuite à la première étape correspondante. Si vous poursuivez ensuite vers un accompagnement éligible, cette première étape peut à son tour être prise en compte selon les conditions applicables. L'objectif est de pouvoir avancer progressivement sans payer deux fois pour la même progression.",
  },
  {
    q: "Et si je commence en accompagnement puis décide finalement de vous confier les travaux ?",
    a: "C'est possible. Un projet peut évoluer. Les informations déjà recueillies peuvent être réutilisées pour éviter de repartir inutilement de zéro. Lorsque les achats concernés sont éligibles, les montants déjà engagés peuvent également être pris en compte selon les conditions commerciales applicables.",
  },
  {
    q: "Faut-il obligatoirement passer par un accompagnement avant une intervention sur place ?",
    a: "Non. Les accompagnements à distance et les prestations terrain sont deux façons différentes de travailler avec FabSystem. Si vous souhaitez faire poser un équipement, résoudre une panne ou confier un projet complet, vous pouvez contacter directement Fabien. Amarrage, Départ et Étape ne sont jamais un ticket d'entrée obligatoire pour une intervention terrain.",
  },
  {
    q: "Intervenez-vous partout en France ?",
    a: "Les accompagnements à distance peuvent être proposés en France sans dépendre de la localisation du projet. Pour les interventions physiques, Fabien intervient principalement dans le Rhône et les secteurs environnants. Pour un projet situé plus loin, contactez Fabien : certaines interventions peuvent être étudiées au cas par cas.",
  },
  {
    q: "Travaillez-vous sur une installation déjà existante ?",
    a: "Oui. Fabien intervient aussi bien sur des projets neufs que sur des installations existantes. Selon le besoin, cela peut concerner : diagnostic, correction, fiabilisation, évolution, ajout d'équipements, solaire, lithium, recharge, refit partiel ou complet. C'est particulièrement fréquent sur les bateaux et camping-cars, mais également possible sur les vans déjà aménagés.",
  },
  {
    q: "Pouvez-vous me dire combien coûtera mon installation ?",
    a: "Les accompagnements à distance qui disposent d'un tarif fixe affichent leur prix avant la prise de contact. Pour une intervention terrain, le coût dépend de l'installation existante, du matériel, de l'accessibilité et de l'ampleur réelle des travaux. FabSystem qualifie donc le besoin avant d'établir un devis lorsqu'un devis est nécessaire.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section tone="light">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Questions fréquentes
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Vous avez une question ?
        </h2>
      </div>

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {FAQS.map((item, index) => {
          const open = openIndex === index;
          const panelId = `services-faq-panel-${index}`;
          const buttonId = `services-faq-button-${index}`;

          return (
            <div key={item.q}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:text-base"
                >
                  {item.q}
                  <span aria-hidden="true" className="shrink-0 text-neutral-400">
                    {open ? "−" : "+"}
                  </span>
                </button>
              </h3>
              {open ? (
                <div id={panelId} role="region" aria-labelledby={buttonId} className="pb-4 text-sm leading-relaxed text-neutral-600">
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-neutral-600">
        Votre situation ne rentre pas exactement dans ces cas ? Décrivez-moi simplement votre
        projet.
      </p>
    </Section>
  );
}
