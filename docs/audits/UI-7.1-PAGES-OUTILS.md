# UI-7.1 — Finaliser l'architecture Outils : une page par calculateur

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `app/outils/page.tsx` (hub, réduit), 5 nouvelles routes `app/outils/<id>/page.tsx`, `components/outils/calculators/*` (nouveau, 5 fichiers), `components/outils/CalculatorPageShell.tsx` (nouveau), `components/outils/CalculateursIndex.tsx` (liens mis à jour), `lib/calc/bilan-storage.ts` (nouveau), `lib/outils-catalog.ts` (id alignés sur les routes), `components/home/OutilsGratuits.tsx`, `components/lesbases/BonsGestes.tsx` (liens mis à jour). **Supprimé :** `components/CalcSection.tsx` (monolithe, entièrement remplacé).
**Non modifié :** `lib/engines/*`, EngineRunner, Project, Prisma, Dashboard, espace client, Stripe, Volta, prix, règles commerciales. Aucun éditeur de schéma, aucune fonction "Mes projets" introduits.

## Architecture finale

```
/outils                     → hub (cartes uniquement, aucun formulaire)
/outils/section-cable        → Calculateur de section de câble
/outils/bilan-consommation   → Bilan de consommation
/outils/autonomie-batterie   → Autonomie batterie (+ solaire)
/outils/mppt                 → Dimensionnement régulateur MPPT
/outils/awg                  → Conversion AWG ↔ mm²
```

Noms de route repris exactement de la liste numérotée de cette mission (le CDC `00-ARCHITECTURE-OUTILS.md §6` propose `awg-mm2` comme exemple illustratif, mais précise lui-même que "les routes exactes pourront être ajustées selon le projet existant" — la mission UI-7.1, plus récente et plus précise, prévaut ici sans contredire le principe validé "un outil = une page").

`lib/outils-catalog.ts` reste la source unique des métadonnées (`id`, `title`, `description`, `tag`, `emoji`) ; son champ `id` correspond désormais exactement au segment de route (`/outils/<id>`), utilisé à la fois par les cartes du hub et par chaque page dédiée.

## Hub

`app/outils/page.tsx` ne rend plus aucun calculateur complet. Structure conservée de UI-7, allégée d'une seule section :

1. Hero (inchangé)
2. **Calculateurs** — `CalculateursIndex.tsx` : les mêmes 5 cartes qu'avant (1 carte principale "Section de câble" + 3 cartes secondaires + 1 ligne compacte AWG), mais chaque carte pointe désormais vers sa page dédiée (`/outils/<id>`) au lieu d'une ancre `#<id>` vers une section rendue plus bas sur la même page.
3. Les basiques de l'atelier (inchangé)
4. Guides (inchangé)
5. Accompagnement (inchangé)

Le bloc `<CalcSection />` (les 5 formulaires complets, ~1400 lignes rendues) a été retiré de la page — c'était le seul changement structurel nécessaire au hub.

## Routes calculateurs

Chaque page (`app/outils/<id>/page.tsx`) utilise la coquille commune `components/outils/CalculatorPageShell.tsx` :

1. lien "← Tous les outils" (retour au hub) ;
2. `<h1>` spécifique (titre réel de l'outil) ;
3. courte explication (reprise du texte déjà utilisé au hub, aucune nouvelle affirmation) ;
4. le calculateur (composant client extrait) ;
5. hypothèses/limites : déjà intégrées à l'intérieur de chaque calculateur (ex. "Calcul basé sur la résistivité du cuivre... Majorez d'une section si câble en conduit ou forte chaleur" pour la section de câble) — non dupliquées au niveau de la page, conformément à la mission ("pas de duplication massive du hub") ;
6. passerelle contextuelle unique vers un outil complémentaire, en bas de page (voir Navigation entre outils).

Metadata (`title`/`description`/`alternates.canonical`) définies individuellement par page pour un référencement propre à chaque outil, conformément à `01-HUB-PUBLIC.md §19`.

## Extraction composants

Les 5 calculateurs ont été extraits de `components/CalcSection.tsx` vers `components/outils/calculators/` :

| Fichier | Calculateur d'origine | Changement |
|---|---|---|
| `SectionCableCalculator.tsx` | `CalcSectionCable` | Aucun — copie strictement identique |
| `BilanConsommationCalculator.tsx` | `CalcBilanConso` | Écrit désormais dans `localStorage` au lieu de remonter son état via des props à un parent (voir "Bilan vers Autonomie") |
| `AutonomieBatterieCalculator.tsx` | `CalcAutonomie` | Lit désormais le bilan importé depuis `localStorage` au montage au lieu de le recevoir en props |
| `MpptCalculator.tsx` | `CalcMPPT` | Aucun — copie strictement identique |
| `AwgCalculator.tsx` | `CalcAWG` | Aucun — copie strictement identique |

`components/CalcSection.tsx` a été **supprimé** : plus aucune référence réelle dans le code (vérifié par recherche globale avant suppression), entièrement remplacé par les 5 composants + les 5 pages + `CalculatorPageShell`.

Le moteur pur `lib/calc/section-cable.ts` (extrait dès UI-7, avec ses 7 tests) reste inchangé et continue d'être importé par `SectionCableCalculator.tsx` et `MpptCalculator.tsx` (qui l'utilise pour dimensionner les câbles panneaux→MPPT et MPPT→batterie).

## Bilan vers Autonomie

**Solution retenue : persistance locale via `localStorage`**, dans un nouveau module `lib/calc/bilan-storage.ts` :

- `writeBilanSnapshot(snapshot)` — appelée par `BilanConsommationCalculator` à chaque changement (`useEffect` sur `[totalWh, appareils, tension, autonomie]`, exactement le même déclencheur qu'avant), écrit `{ appareils, tension, autonomie, totalWh }` sous la clé `fabsystem-outils-bilan-conso`.
- `readBilanSnapshot()` — appelée par `AutonomieBatterieCalculator` une seule fois au montage (`useEffect` à dépendances vides), lit et valide sommairement la forme des données (vérifie que `totalWh` est un nombre et `appareils` un tableau avant de faire confiance au contenu).
- Les deux fonctions sont protégées par `try/catch` (navigation privée, quota dépassé, etc. → dégradent silencieusement sans casser le calculateur).

**Comportement utilisateur** : un visiteur qui remplit son bilan sur `/outils/bilan-consommation`, puis navigue vers `/outils/autonomie-batterie`, retrouve exactement le même encart "📊 Bilan calculé : X Wh/j — Utiliser ↗" qu'avant cette mission (texte, style et action identiques) — seule la source de la donnée a changé (stockage navigateur au lieu d'un état React partagé entre deux composants montés simultanément). L'export PDF "rapport complet" d'Autonomie continue d'inclure le détail du bilan lorsqu'il est disponible, avec les mêmes calculs.

**Conformité MASTER-05** : purement local au navigateur, aucun compte, aucune donnée envoyée au serveur, aucun Project — le même principe que `MASTER-05-OUTILS-PUBLICS.md §16` ("Le schéma public peut être sauvegardé automatiquement dans le navigateur... ne nécessite aucun compte ; n'est pas une sauvegarde serveur") appliqué au bilan de consommation. Le même pattern existait déjà dans ce dépôt pour la persistance du quiz Les Bases (`components/QuizFormations.tsx`, UI-6) — solution cohérente avec une pratique déjà acceptée dans le projet, pas une nouveauté isolée.

**Limite assumée** : si le bilan est modifié après avoir ouvert Autonomie dans un autre onglet, la mise à jour n'est visible qu'au prochain montage de la page Autonomie (rechargement ou nouvelle navigation) — contrairement à l'ancienne architecture monopage où la synchronisation était instantanée puisque les deux calculateurs étaient montés en même temps. Ce compromis est direct et nécessaire dès lors que les deux calculateurs vivent sur des pages séparées ; aucune solution plus réactive (BroadcastChannel, storage event listener) n'a été ajoutée car non demandée et hors du besoin réel décrit par la mission ("réutiliser ses données sans tout ressaisir").

## Migration des liens

Audit exhaustif des références internes vers les anciennes ancres (`grep` sur `app/`/`components/`) avant modification :

| Ancienne ancre | Nouvelle route | Fichier(s) mis à jour |
|---|---|---|
| `/outils#section-cable` | `/outils/section-cable` | `components/home/OutilsGratuits.tsx`, `components/lesbases/BonsGestes.tsx` |
| `/outils#bilan-conso` | `/outils/bilan-consommation` | `components/home/OutilsGratuits.tsx` |
| `/outils#autonomie` | `/outils/autonomie-batterie` | `components/home/OutilsGratuits.tsx` |
| `/outils#mppt` | `/outils/mppt` | `components/home/OutilsGratuits.tsx` |
| `/outils#awg` | `/outils/awg` | (aucun lien externe existant — utilisée uniquement par l'index du hub, déjà mis à jour) |

Recherche finale (`grep -rn '#section-cable\|#bilan-conso\|#autonomie"\|#mppt"\|#awg"'` sur tout `app/`/`components/`) : **aucune occurrence restante**. Aucun lien interne connu ne pointe plus vers une ancienne ancre.

`Navbar`, `Footer`, `components/home/Parcours.tsx`, `components/home/Hero.tsx`, `components/services/TroisFacons.tsx`, `components/services/ServicesCtaFinal.tsx` : tous pointent vers `/outils` sans ancre — inchangés, toujours valides (le hub existe et répond 200).

**Compatibilité anciens favoris avec hash** : conformément à la mission, aucune solution de redirection JavaScript n'a été ajoutée. Les fragments d'URL (`#section-cable`, etc.) ne sont jamais transmis au serveur — un visiteur arrivant sur un ancien lien favori de type `/outils#section-cable` atterrit simplement sur `/outils` (le hub, fonctionnel), sans erreur ni page cassée, mais sans être automatiquement mené au calculateur correspondant. C'est documenté ici comme le comportement attendu, pas un oubli.

## Responsive

- `CalculatorPageShell` utilise `Section`/`Container` (`size="wide"`) pour un empilement cohérent à toutes les largeurs, identique au pattern déjà validé sur `/boutique`, `/formations`.
- Chaque calculateur conserve son `grid lg:grid-cols-2` (paramètres | résultat sur desktop, empilé sur mobile) — comportement non modifié, déjà conforme depuis UI-7.
- Amélioration réelle par rapport à l'ancienne page unique : chaque calculateur occupe désormais toute la largeur de sa propre page dès le chargement, sans avoir à faire défiler 4 autres formulaires complets au-dessus/en dessous sur mobile — gain de confort mobile concret, conforme à l'objectif de cette mission.
- Testé à 375px (retour "Tous les outils" et titres restent lisibles, aucun débordement horizontal) via revue des classes Tailwind ; pas de tableau horizontal illisible introduit (les tables existantes — appareils du bilan, AWG — étaient déjà en `overflow-x-auto`, non modifiées).

## Accessibilité

- Un seul `<h1>` par route calculateur (vérifié par smoke test sur les 6 pages) — avant cette mission, la page unique n'avait qu'un seul `<h1>` (Hero) et cinq `<h2>` pour les calculateurs ; désormais chaque calculateur a son propre `<h1>`, plus proche sémantiquement de son statut de page à part entière.
- Labels, unités, focus, clavier : hérités sans modification des calculateurs déjà conformes (audités en UI-7) — aucune régression, aucune amélioration ciblée dans cette mission au-delà de la structure de page.
- Lien de retour "← Tous les outils" et passerelle contextuelle : liens explicites, jamais "cliquez ici".

## Performance

**Objectif principal de cette mission, atteint** : le hub `/outils` n'hydrate plus aucun calculateur (0 composant `"use client"` de calcul monté sur `/outils`, uniquement les Server Components Hero/Index/Basiques/Guides/Accompagnement). Chaque route `/outils/<id>` ne charge que le JavaScript de son propre calculateur, grâce au découpage automatique par route de Next.js (chaque `app/outils/<id>/page.tsx` importe un seul composant client) — avant cette mission, visiter n'importe quelle ancre chargeait déjà les 5 calculateurs (~1400 lignes de composants React) sur une seule page.

- 5 routes calculateur rendues statiquement (`○`) au build — aucune ne dépend de données serveur.
- `/outils` reste dynamique (`ƒ`), uniquement à cause de la section Guides (prix réel du catalogue), inchangé depuis UI-7.
- Aucune nouvelle dépendance npm.

## Tests

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **851/851 tests passants** (aucun test supplémentaire nécessaire — cette mission n'a modifié aucune logique de calcul, seulement son emplacement et sa présentation ; les 7 tests de `lib/calc/section-cable.ts` déjà ajoutés en UI-7 continuent de couvrir le seul moteur pur du périmètre).
- `npm run build` : build de production réussi ; les 6 routes `/outils*` listées avec le rendu attendu (`ƒ` pour le hub, `○` pour les 5 calculateurs).
- Smoke test serveur de dev : les 6 routes → 200 ; hub sans aucun champ de formulaire (`Intensité (A)`, `Puissance panneaux`, etc. absents du HTML de `/outils`) ; chaque page calculateur avec son `<h1>` et son formulaire réel présents ; aucune ancienne ancre résiduelle.

## Arbitrages

1. **Nom de route `awg` retenu plutôt que `awg-mm2`** (suggéré à titre d'exemple par `00-ARCHITECTURE-OUTILS.md §6`). La mission liste explicitement et à plusieurs reprises `/outils/awg` comme route cible, et le CDC précise lui-même que ses exemples de routes "pourront être ajustées selon le projet existant" — la route la plus récemment et explicitement spécifiée a été retenue.
2. **`lib/outils-catalog.ts` : `id` renommés pour correspondre aux routes** (`bilan-conso` → `bilan-consommation`, `autonomie` → `autonomie-batterie`). Nécessaire pour garder une seule source de vérité entre les cartes du hub et les routes ; les anciens `id` n'étaient que des identifiants d'ancre internes à `CalcSection.tsx`, jamais exposés publiquement autrement que via les ancres elles-mêmes déjà migrées.
3. **Persistance Bilan→Autonomie en `localStorage` plutôt qu'un mécanisme plus réactif** (ex. `BroadcastChannel`, écoute d'évènements `storage`). Le besoin exprimé par la mission est "réutiliser ses données sans tout ressaisir", satisfait par une lecture au montage ; une synchronisation temps réel entre onglets n'a pas été demandée et aurait ajouté de la complexité sans bénéfice démontré pour un outil public mono-utilisateur.
4. **Aucune redirection JavaScript pour les anciennes ancres.** Conforme à l'instruction explicite de la mission ("Pas de JavaScript de redirection fragile sauf exigence explicite du CDC") : les anciens favoris avec hash atterrissent simplement sur le hub fonctionnel, comportement documenté plutôt que contourné par une solution fragile.
5. **`CalculatorPageShell` créé comme nouveau composant plutôt que de réutiliser `PageHero`.** `PageHero` (le composant générique utilisé par de nombreuses autres pages publiques du site) impose un visuel sombre pleine largeur avec image de fond, inadapté à une page calculateur qui doit rester claire et concentrée sur le formulaire — le Hero du hub Outils lui-même utilise déjà un composant dédié plutôt que `PageHero`, depuis UI-7. Une coquille dédiée, simple et réutilisée par les 5 pages calculateur, était plus appropriée et évite de complexifier un composant partagé par de nombreuses autres pages du site.
6. **Aucune donnée d'hypothèses/limites supplémentaire ajoutée au niveau des pages.** Chaque calculateur affiche déjà ses propres avertissements et limites dans son résultat (ex. section de câble : mention résistivité cuivre + majoration conduit/chaleur ; MPPT : marge de sécurité 25 % + alertes tension). Dupliquer ces informations au niveau de `CalculatorPageShell` aurait contredit la mission ("pas de duplication massive du hub") sans apporter d'information nouvelle.

## Fichiers modifiés / créés / supprimés

**Créés :** `components/outils/calculators/{SectionCableCalculator,BilanConsommationCalculator,AutonomieBatterieCalculator,MpptCalculator,AwgCalculator}.tsx`, `components/outils/CalculatorPageShell.tsx`, `lib/calc/bilan-storage.ts`, `app/outils/{section-cable,bilan-consommation,autonomie-batterie,mppt,awg}/page.tsx`, `docs/audits/UI-7.1-PAGES-OUTILS.md`.
**Modifiés :** `app/outils/page.tsx`, `components/outils/CalculateursIndex.tsx`, `lib/outils-catalog.ts`, `components/home/OutilsGratuits.tsx`, `components/lesbases/BonsGestes.tsx`.
**Supprimés :** `components/CalcSection.tsx`.
