"use client";

import { useEscapeToClose } from "@/lib/schema-editor/useEscapeToClose";

// Retour utilisateur : "il serait vraiment important de créer une vraie
// page aide qui explique les différentes fonctions" — jusqu'ici, "Aide et
// retours" et "Nouveautés et aide" ne menaient nulle part (ancien système
// d'onglets jamais nettoyé après la refonte du ruban en menus déroulants).
// Contenu statique plutôt qu'une vraie page à part : ce sont les fonctions
// DE L'ÉDITEUR qu'on documente, pas un contenu marketing du site.
interface HelpSection {
  title: string;
  items: { name: string; detail: string }[];
}

const SECTIONS: HelpSection[] = [
  {
    title: "Fichier",
    items: [
      { name: "Nouveau schéma", detail: "Partir d'un modèle existant ou d'un canevas vide." },
      { name: "Ouvrir un schéma", detail: "Retrouver un schéma déjà sauvegardé, un modèle, ou importer un fichier .fabschema." },
      { name: "Exporter en PNG / Imprimer en PDF", detail: "Choisir le cadrage avant de générer l'image ou le document." },
      { name: "Télécharger le schéma", detail: "Copie complète au format .fabschema, à réimporter plus tard ou partager hors ligne." },
      { name: "Liste de matériel", detail: "Équipements et quantités du schéma, avec les prix connus quand ils existent." },
      { name: "Demande de devis fournisseur", detail: "La même liste, prête à copier-coller dans un e-mail." },
      { name: "Vider le canevas", detail: "Repart d'un schéma vierge après confirmation — le brouillon actuel reste sauvegardé localement." },
    ],
  },
  {
    title: "Vue",
    items: [
      { name: "Libellés des composants / des câbles", detail: "Afficher ou masquer les noms sur le schéma." },
      { name: "Illustrations des composants", detail: "Basculer entre symboles techniques et visuels réels des produits." },
      { name: "Grille du canevas", detail: "Afficher ou masquer le quadrillage." },
      { name: "Vue jour / nuit", detail: "Change uniquement l'affichage de l'éditeur, pas le schéma." },
    ],
  },
  {
    title: "Ajouter des composants",
    items: [
      { name: "Bibliothèque de composants", detail: "Le panneau de gauche : glisser un composant directement dans le canevas." },
      { name: "Ajouter du solaire", detail: "Assistant guidé : panneaux, régulateur et protection posés et reliés automatiquement." },
      { name: "Créer un champ solaire / un parc batteries", detail: "Choisir les éléments et leur câblage série ou parallèle en une fois." },
    ],
  },
  {
    title: "Contrôles électriques",
    items: [
      { name: "Recalculer les sections", detail: "Met à jour les câbles dont les données sont suffisantes pour un calcul fiable." },
      { name: "Recalculer les protections", detail: "Met à jour les fusibles et disjoncteurs vers un calibre compatible." },
      { name: "Harmoniser les petites sections", detail: "Passe les câbles sous 1,5 mm² en 1,5 mm² et regroupe les petites quantités — évite d'acheter une bobine dédiée pour quelques mètres." },
      { name: "Optimiser les busbars", detail: "Répartit les plots de chaque busbar vers le côté le plus proche des câbles connectés." },
      { name: "Alertes du schéma", detail: "Le badge en haut signale les problèmes détectés (protection sous-dimensionnée, section insuffisante…) : cliquer dessus pour les lister." },
    ],
  },
  {
    title: "Édition",
    items: [
      { name: "Organisation et modèles", detail: "Canevas structuré, zones, et gabarits réutilisables." },
      { name: "Propriétés d'un élément", detail: "Cliquer sur un composant ou un câble ouvre son panneau de réglages à droite." },
      { name: "Dupliquer / pivoter / annuler", detail: "Voir les raccourcis clavier ci-dessous." },
    ],
  },
  {
    title: "Partage et historique",
    items: [
      { name: "Partager", detail: "Génère un lien de consultation en lecture seule, révocable à tout moment." },
      { name: "Historique", detail: "Revenir à une version précédente du schéma (projets cloud uniquement)." },
    ],
  },
];

const SHORTCUTS: { keys: string; detail: string }[] = [
  { keys: "Ctrl/Cmd + Z", detail: "Annuler" },
  { keys: "Ctrl/Cmd + Maj + Z", detail: "Rétablir" },
  { keys: "Ctrl/Cmd + D", detail: "Dupliquer l'élément sélectionné" },
  { keys: "R", detail: "Pivoter l'élément sélectionné" },
  { keys: "Échap", detail: "Désélectionner" },
];

export function HelpDialog({ onClose }: { onClose: () => void }) {
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Aide de l'éditeur">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Aide de l&apos;éditeur</h2>
            <p className="mt-2 text-slate-500">À quoi sert chaque fonction du schéma.</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-slate-500" aria-label="Fermer">×</button>
        </div>

        <div className="mt-6 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{section.title}</h3>
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <li key={item.name} className="text-sm">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-500"> — {item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Raccourcis clavier</h3>
            <ul className="mt-2 space-y-1.5">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.keys} className="flex items-center gap-3 text-sm">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700">{shortcut.keys}</span>
                  <span className="text-slate-600">{shortcut.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-5 text-sm text-slate-500">
          Une fonction manque, ou quelque chose ne marche pas comme attendu ?{" "}
          <a href="mailto:contact@fabsystem.fr?subject=Retour%20%C3%A9diteur%20de%20sch%C3%A9ma" className="font-semibold text-amber-700 hover:underline">
            Contacter le support
          </a>
          .
        </div>
      </div>
    </div>
  );
}
