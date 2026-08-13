# UI-14 — Intégration Volta dans le SaaS FabSystem

## Résumé

Refonte de l'intégration Volta : remplacement des icônes décoratives posées à
côté de titres (première passe, non conforme au brief) par un composant
unique `VoltaGuide`, utilisé uniquement quand un message apporte une
information réelle dérivée de l'état du projet ou d'un contenu pédagogique
déjà validé. Priorité au mode Guidé du Project (emplacement principal
demandé), présence minimale ailleurs. Aucun moteur, aucun calcul, aucune
migration Prisma touchés.

## Rôle retenu pour Volta

Guide UI déterministe : explique, rassure, signale une donnée manquante ou
une obsolescence, suggère la suite. Ne certifie rien, ne diagnostique rien,
ne parle jamais à la place de Fabien. Tous les textes sont statiques,
choisis par une règle fixe (état réel du Project) — aucun texte généré à la
volée.

## Emplacements audités

| Emplacement | Besoin réel ? | Message | Pose | Priorité | Décision |
|---|---|---|---|---|---|
| Intro parcours Guidé (étape Installation) | Oui — cadre l'attente | Guidage étape par étape | neutre | Haute | **Retenu** |
| Bandeau de progression, si obsolescence | Oui — meilleur usage du brief | Explication obsolescence + réapparition du badge sinon | perplexe | Haute | **Retenu** |
| Étape Besoins — puissance inconnue | Oui | Où trouver la puissance (W) | neutre | Haute | **Retenu** |
| Étape Batterie — réponse "Je ne sais pas" | Oui, conditionnel | Lecture d'étiquette (V/Ah) | perplexe | Moyenne | **Retenu** (conditionnel) |
| Étape Recharge — bloc générique "cochez plusieurs options" | Non — doublon du helper déjà affiché | — | — | — | **Rejeté** |
| Sous-module Solaire — terme MPPT | Oui, conditionnel à la sélection Solaire | Explication MPPT | neutre | Moyenne | **Retenu** (conditionnel) |
| Étape Distribution — regroupement de circuits | Oui — critère non dit par le helper | Un circuit = un fusible partagé | action | Moyenne | **Retenu** |
| Sous-bloc Câbles — mesure de distance | Oui — convention réelle du moteur à expliciter | Distance aller simple (le moteur double en interne) | action | Moyenne | **Retenu** |
| Étape Schéma — "rien n'est figé" | Non — doublon avec le nouveau bandeau obsolescence | — | — | — | **Rejeté** |
| Mode avancé — bandeau Calculer vs Utiliser | Oui, déjà en place | Distinction preview/retain | neutre | Haute | **Retenu** (seule présence de l'écran) |
| Mode avancé — obsolescence | Non — 2ᵉ présence sur le même écran (budget dépassé) | — | — | — | **Rejeté**, reste en texte simple |
| Dashboard `/mon-compte` — carte projet récent | Oui, si donnée dérivable | Obsolescence ou modules à compléter | perplexe / confiante | Moyenne | **Retenu**, conditionnel à une vraie info |
| Dashboard `/mon-compte` — état vide (aucun projet) | Non — aucune interaction réelle, message générique interdit (§28) | — | — | — | **Rejeté**, texte neutre repris, illustration seule conservée |
| FAQ Services — en-tête | Non — logo à côté d'un titre, aucune fonction | — | — | — | **Rejeté**, retiré |
| Choix de mode — carte "Être guidé" | Non — décoration de carte | — | — | — | **Rejeté**, retiré |
| Les Bases — intro "Commencez par les fondamentaux" | Oui — ordre de progression non explicite dans les cartes | Suivre les 3 modules dans l'ordre | neutre | Basse | **Retenu** (présence unique) |
| Les Bases — "Un câble trop fin..." | Oui — contenu pédagogique déjà validé (UI-10) | Vigilance section de câble | perplexe | Moyenne | **Retenu**, conservé de la version précédente |

## Emplacements retenus (résumé)

1. Mode Guidé — intro (étape Installation)
2. Mode Guidé — bandeau d'obsolescence (remplace le texte plat quand `obsoleteCount > 0`)
3. Mode Guidé — étape Besoins (puissance inconnue)
4. Mode Guidé — étape Batterie (réponse "Je ne sais pas")
5. Mode Guidé — sous-module Solaire (MPPT)
6. Mode Guidé — étape Distribution (critère de regroupement)
7. Mode Guidé — sous-bloc Câbles (convention de mesure)
8. Mode avancé — bandeau Calculer vs Utiliser (seule présence de l'écran)
9. Dashboard — carte projet récent (obsolescence ou modules à compléter, conditionnel)
10. Les Bases — intro modules + vigilance câble (2 présences, page publique, cf. §26 du brief)

## Emplacements rejetés

- FAQ Services (en-tête), carte "Être guidé" du choix de mode : logo décoratif sans fonction.
- Étape Recharge (texte générique), étape Distribution circuits (ancienne version doublonnant le helper), étape Schéma ("rien n'est figé") : redondants avec un texte déjà présent, ou remplacés par le bandeau d'obsolescence unifié.
- État vide du dashboard : le texte "Bonjour, je suis Volta" (posé lors d'une première itération non conforme) a été retiré — aucune information réelle, contraire à §28. L'illustration seule est conservée (accent visuel, `alt=""`, aucune info portée uniquement par l'image).
- Obsolescence en mode avancé : la présence Volta de l'écran est déjà occupée par le bandeau Calculer/Utiliser (§17 : une seule présence principale par écran) ; l'encart orange existant reste en texte simple.

## Composants créés

- `components/volta/VoltaAvatar.tsx` — 4 poses (`neutre`, `confiante`, `perplexe`, `action`), réutilise les assets déjà présents dans `public/volta/` (aucune nouvelle image générée).
- `components/volta/VoltaGuide.tsx` — composant unique, variantes `info` / `tip` / `warning` / `next`, avatar + titre optionnel + texte + CTA optionnel. Remplace l'ancien `VoltaTip.tsx` (supprimé).
- `lib/volta/messages.ts` — tous les textes Volta centralisés, y compris 2 fonctions paramétrées par un compte réel (`dashboardObsolete(count)`, `dashboardTodo(count)`).

## Messages déterministes

| Règle | Message |
|---|---|
| Entrée dans le parcours guidé | `guidedIntro` |
| `obsoleteCount > 0` dans le bandeau de progression | `obsoleteExplain` |
| Étape Besoins affichée | `powerUnknown` |
| Réponse batterie = "unknown" | `batteryUnknown` |
| Solaire coché en étape Recharge | `mpptExplain` |
| Sous-bloc Câbles affiché | `cableDistance` |
| Mode avancé, toujours affiché | `calculateVsRetain` |
| Dashboard, `obsoleteCount(projet récent) > 0` | `dashboardObsolete(count)` |
| Dashboard, sinon `uncompletedCount > 0` | `dashboardTodo(count)` |
| Les Bases, câble sous-dimensionné | `cableUndersized` |

Aucun texte n'est généré dynamiquement ni par un LLM : chaque branche ci-dessus est une condition fixe sur un état réel (`ProjectRetainedValue.status`, réponse utilisateur stockée en `localStorage`, sélection de méthode de recharge).

## Mode Guidé

Emplacement principal conforme au brief. Le bandeau de progression devient
la présence obsolescence unique et partagée par les 6 étapes (au lieu d'un
message par étape) : quand `obsoleteCount === 0`, aucun Volta n'apparaît
dans ce bandeau — seulement le texte de progression neutre déjà existant.
Les autres apparitions sont conditionnelles à un vrai manque d'information
(inconnue batterie, choix Solaire) plutôt que systématiques par étape.

## Mode Avancé

Une seule présence principale conservée (bandeau Calculer vs Utiliser),
conformément à §17. L'encart d'obsolescence de la section "À faire
maintenant" reste en texte simple (orange), sans Volta, pour ne pas dépasser
le budget d'une présence par écran.

## Dashboard

`/mon-compte` calcule désormais `obsoleteCount` / `uncompletedCount` pour le
projet le plus récent (réutilise `getProjectValues` + `moduleStatus`, déjà
utilisés sur la page projet) et n'affiche Volta que si l'un des deux est
strictement positif. L'état vide (aucun projet) ne porte plus de message
Volta générique — l'illustration reste seule, sans réclamer une information
qu'elle n'a pas.

## Obsolescence

Traité comme l'emplacement le plus pertinent du brief (§16) : un seul
bandeau partagé en mode Guidé (au lieu d'un badge "Obsolète" nu), plus le
signal `dashboardObsolete` sur le dashboard. Le mode avancé garde son
traitement textuel existant pour respecter la limite d'une présence par
écran.

## Responsive

Vérifié en 375px et 1280px sur les écrans suivants (captures Playwright
réelles, Chrome) : dashboard (vide et avec projet), choix de mode, parcours
guidé (étape 1 avec bandeau obsolescence, étape recharge avec MPPT), mode
avancé, Les Bases. Le composant `VoltaGuide` reste compact à toutes les
tailles testées (avatar 32px, texte prioritaire, pas de bulle qui pousse le
contenu hors écran). Les breakpoints 430/768/1024 n'ont pas été testés
individuellement (limite assumée, voir Limites) — le composant est en
`flex`/`rounded-xl` sans dimension fixe, le risque de rupture entre 375 et
1280 est faible.

## Accessibilité

`VoltaAvatar` a systématiquement `alt=""` : l'image est décorative, toute
l'information est portée par le texte adjacent (jamais l'inverse). Pas de
texte intégré dans les illustrations. Contraste vérifié visuellement sur
chaque variante (fond `neutral-50`/`brand-50`/`orange-50`/`emerald-50`,
texte `neutral-800`/`neutral-950`).

## Performance

`next/image` partout, dimensions explicites (`width`/`height` + `size` en
px). 4 poses réutilisées (contre 8 dans la première itération), donc moins
de fichiers distincts chargés par page. Aucun nouvel asset généré.

## Captures

Captures réelles (Playwright + Chrome, données de test créées puis
supprimées) : dashboard avec/sans projet, choix de mode, parcours guidé
(étapes Installation/Besoins/Batterie/Recharge avec obsolescence et MPPT),
mode avancé, Les Bases (desktop + mobile). Non conservées dans le repo
(scratchpad de session).

## Tests

- `npx tsc --noEmit` : vert.
- `npm test` : 898/898 verts (aucune régression).
- `npm run build` : vert.
- Vérification visuelle réelle via Playwright/Chrome sur données de test
  réelles (client + projet temporaires, création puis suppression
  confirmée en base).

## Fichiers modifiés

- Créés : `components/volta/VoltaAvatar.tsx`, `components/volta/VoltaGuide.tsx`, `lib/volta/messages.ts`
- Supprimé : `components/volta/VoltaTip.tsx` (composant de la première itération, non conforme)
- Modifiés : `app/mon-compte/page.tsx`, `components/customer/dashboard/guided/GuidedProjectFlow.tsx`, `components/customer/dashboard/project-mode/AdvancedProjectView.tsx`, `components/customer/dashboard/project-mode/ModeChoiceScreen.tsx`, `components/lesbases/BonsGestes.tsx`, `components/lesbases/Modules.tsx`, `components/services/Faq.tsx`

## Arbitrages

- Le brief autorise une présence Volta après retenue d'un résultat (§15,
  "Cette valeur est maintenant utilisée..."). Non implémentée : elle
  doublonnait le badge "Retenu" déjà visible sans ajouter d'information ;
  le budget de présence a été redirigé vers l'obsolescence (§16), jugée
  plus utile par le brief lui-même ("C'est un emplacement très pertinent").
- Le message câble ("mesurez la distance aller simple...") a été vérifié
  contre le moteur réel (`lib/engines/cable-engine.ts` : `oneWayLengthM`,
  doublé en interne pour l'aller-retour) avant rédaction, conformément à
  l'exigence du brief §14 ("le texte exact doit respecter le fonctionnement
  réel du moteur").

## Limites

- Breakpoints 430/768/1024 non testés individuellement (seuls 375 et 1280
  vérifiés par capture réelle).
- Le dashboard ne calcule l'obsolescence/complétude que pour le projet le
  plus récent, pas pour l'ensemble des projets d'un client (cohérent avec le
  fait que seul ce projet est affiché sur `/mon-compte`).

## Restes éventuels

Aucun. Périmètre du brief traité en un seul passage, aucun commit effectué.
