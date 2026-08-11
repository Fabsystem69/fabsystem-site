# UI-7 — Refonte complète des Outils publics

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `app/outils/page.tsx` (hub, réécrit), `components/outils/*` (nouveau), `components/CalcSection.tsx` (extraction pure + dédoublonnage, comportement inchangé), `lib/calc/section-cable.ts` (nouveau, moteur pur extrait), `lib/outils-catalog.ts` (nouveau, source unique des métadonnées), `tests/section-cable-calc.test.ts` (nouveau).
**Non modifié :** `lib/engines/*` (moteurs backend, y compris `cable-engine.ts`), `EngineRunner`, Project, Prisma, Dashboard, espace client, Boutique (lecture seule via les mêmes fonctions déjà utilisées par UI-5/UI-6), Stripe, prix, règles commerciales. Aucune fonctionnalité SaaS/Project introduite.

## Audit existant

- **`app/outils/page.tsx`** (139 lignes avant) : `PageHero` + index de 5 outils (tableau `outils`, dupliqué) + `<CalcSection />` + un bloc CTA de fin pointant vers `/prestations#accompagnement-distance` — **ancre morte** (l'ancre réelle créée en UI-4 est `#on-fait-ensemble`, voir Navigation).
- **`components/CalcSection.tsx`** (1415 lignes avant) : un seul fichier `"use client"` contenant **5 calculateurs réellement fonctionnels** : `CalcSectionCable`, `CalcBilanConso`, `CalcAutonomie`, `CalcMPPT`, `CalcAWG`, plus un second tableau de métadonnées (`CALC_META`) dupliquant celui du hub avec des libellés légèrement différents. Chaque calculateur est monté dans une `<section id={...}>` ancrée, rendue par le composant racine `CalcSection`.
- **Interconnexion déjà réelle** (à conserver) : `CalcBilanConso` remonte sa consommation totale (`onConsoChange`) et un instantané du bilan (`onBilanSnapshot`) au composant racine, qui les repasse en props à `CalcAutonomie` (`importedConsoWh`, `bilanSnapshot`). C'est une forme déjà fonctionnelle, en mémoire (non persistée), de la "donnée interconnectée" visée par `MASTER-05 §26-27` et `02-PAGES-CALCULATEURS.md §24` — conservée telle quelle.
- **Aucun autre composant/helper** dédié aux outils n'existe ailleurs dans le dépôt (recherche `*calc*` sur tout le repo hors `node_modules`/Prisma).
- **Écart CDC vs implémentation** : `00-ARCHITECTURE-OUTILS.md` et `01-HUB-PUBLIC.md` visent une architecture cible bien plus large — une page dédiée par outil (`/outils/section-cable`, etc.), un éditeur de schéma public, une section "Mes projets". **Rien de tout cela n'existe dans le dépôt aujourd'hui.** La mission UI-7 elle-même restreint explicitement le périmètre ("ne pas brancher brutalement `/outils` sur Project", "ne pas commencer UI-8 SaaS", "refactorer uniquement si cela améliore réellement... ne pas faire une réécriture complète"). Cette refonte reste donc volontairement sur l'architecture **une seule page `/outils` avec sections ancrées**, déjà en place et déjà consommée par plusieurs pages réelles (voir Navigation) — la migration vers "une page par outil" est documentée comme travail futur, pas engagée ici.
- **Moteur backend existant** : `lib/engines/cable-engine.ts` (399 lignes, Phase 4.8 SaaS) calcule déjà une section de câble avec exactement la même formule que le calculateur public — voir "Convergence moteurs".

## Architecture

Le hub reste une seule page (`/outils`), conformément à l'existant et aux ancres réellement consommées ailleurs (voir Navigation). Ordre implémenté, adapté du CDC (`01-HUB-PUBLIC.md §2`) au périmètre réellement disponible :

1. **Hero** (`components/outils/Hero.tsx`) — un seul CTA vers `#calculateurs`.
2. **Calculateurs** — index (`CalculateursIndex.tsx`, 4 cartes principales + AWG traité en compact, `01-HUB-PUBLIC.md §5`) puis les 5 sections réelles (`<CalcSection />`, inchangé fonctionnellement).
3. **Les basiques de l'atelier** (`BasiquesAtelier.tsx`) — passerelle courte vers Les Bases (voir Arbitrages).
4. **Guides** (`Guides.tsx`) — 2 ebooks réels maximum, prix dynamique réel.
5. **Accompagnement** (`Accompagnement.tsx`) — CTA unique vers `/prestations#on-fait-ensemble`.
6. **Footer** — global, non touché.

**Sections explicitement omises** (le CDC les prévoit dans sa vision cible, mais elles n'existent pas réellement) :
- **"Schéma électrique gratuit"** : aucun éditeur de schéma public n'existe dans le dépôt (aucune route, aucun composant). L'afficher serait présenter un "faux schéma électrique", explicitement interdit par la mission.
- **"Passerelle Mes projets"** : aucune page cliente "Mes projets"/Project n'existe (recherche confirmée : aucune route `app/**/project*`, aucune occurrence "Mes projets"). L'afficher serait une "fonctionnalité client non encore disponible", également interdite.

Ces deux sections sont documentées comme travail futur (voir Visuels nécessaires / Arbitrages), pas ajoutées en `Bientôt disponible` : le CDC (`MASTER-05 §38`) autorise ce libellé "lorsque sa visibilité est utile", mais la mission UI-7 est explicitement plus stricte ("Ne pas afficher... outil 'bientôt disponible' sauf exigence explicite du CDC") — aucune exigence explicite ne demandait ce libellé, donc rien n'a été affiché plutôt qu'un encart vide.

## Outils disponibles

Les 5 calculateurs réellement fonctionnels sont conservés à l'identique et mieux mis en avant :

| Outil | Ancre | Statut |
|---|---|---|
| Section de câble | `#section-cable` | Réel, mis en avant (carte principale) |
| Bilan de consommation | `#bilan-conso` | Réel |
| Autonomie batterie | `#autonomie` | Réel, reçoit les données du bilan (interconnexion existante) |
| Régulateur MPPT | `#mppt` | Réel |
| AWG ↔ mm² | `#awg` | Réel, traitement secondaire/compact conforme au CDC |

Aucun outil fictif, aucune carte "bientôt disponible" n'a été ajoutée. Les métadonnées (titre, description, tag) proviennent désormais d'une unique source (`lib/outils-catalog.ts`), éliminant la duplication entre le hub et `CalcSection.tsx`.

## Calculateur de section

`CalcSectionCable` (composant React, UI/formulaire) est inchangé visuellement et fonctionnellement. Seule sa logique de calcul a été extraite :

- `calcSection(intensite, longueur, chute, tension)` et `fusibleRecommande(intensite)` déplacées telles quelles (aucune formule, constante ou arrondi modifié) vers `lib/calc/section-cable.ts`, un module pur sans dépendance React.
- 7 tests unitaires ajoutés (`tests/section-cable-calc.test.ts`) couvrant : cas nominal (croisé avec une valeur de référence du moteur backend `cable-engine.ts`), arrondi au catalogue de sections normalisées, plafond à 50 mm², sensibilité à la chute de tension admissible, et les 3 cas du calibrage fusible (nominal, limite exacte, hors catalogue).
- Aucune réécriture du composant `CalcSectionCable` lui-même (formulaire, affichage du résultat, avertissements) : le changement est strictement l'extraction du calcul, conformément à la mission ("Refactorer uniquement si cela améliore réellement... Conserver strictement le comportement fonctionnel existant").
- Les 4 autres calculateurs (`CalcBilanConso`, `CalcAutonomie`, `CalcMPPT`, `CalcAWG`) n'ont **pas** été refactorés en profondeur : leur volume (~1100 lignes cumulées) et leur absence de rôle central explicite dans cette mission (seul "Calculateur de section de câble" est nommé dans les livrables demandés) ne justifiaient pas le même effort dans ce passage — voir Arbitrages.

## Convergence moteurs

**Duplication identifiée et confirmée** entre le calculateur public et le moteur backend :

- Public (`lib/calc/section-cable.ts`, ex-`CalcSection.tsx`) : `sMin = (2 × longueur × I × 0.0175) / (chute% × tension / 100)`.
- Backend (`lib/engines/cable-engine.ts`, ligne ~315) : `minimumSectionMm2 = (electricalLengthM × referenceCurrentA × resistivity) / maxVoltageDropV`, avec `electricalLengthM = 2 × oneWayLengthM` et `maxVoltageDropV = (chute% / 100) × tension`.

**Formule mathématiquement identique** (vérifié par un cas croisé : 5 A, 3 m aller, 12 V, chute 3 % → 1,46 mm² côté public, confirmé cohérent avec le test existant `tests/cable-engine.test.ts` "un seul circuit").

**Pourquoi ne pas fusionner dans cette phase :**
- `cable-engine.ts` est un moteur SaaS qui lit son courant et sa tension via `EngineContext` depuis un `circuit.<id>` déjà produit par le Circuit Engine (Phase 4.7), avec gestion d'erreurs `DependencyError`/`ValidationError` propres à l'architecture Projet. Le calculateur public n'a ni circuit, ni contexte, ni projet : ses entrées sont directement les valeurs saisies par le visiteur.
- Extraire un helper vraiment partagé nécessiterait de modifier `cable-engine.ts` pour qu'il délègue son cœur de calcul à la même fonction pure — une modification d'un moteur métier, explicitement restreinte par cette mission ("ne pas modifier les moteurs métier sauf besoin strict et démontré ; ne pas modifier EngineRunner"). Il n'y a ici aucun bug, aucune divergence de résultat : uniquement une duplication de formule sans risque actuel.
- Conformément à la mission ("Sinon : documenter le point pour la convergence SaaS future. Ne pas créer une phase infrastructure supplémentaire"), ce point est documenté ici pour une convergence future (probablement au moment où `cable-engine.ts` sera lui-même scindé en `inputs → moteur pur → résultat`, comme le vise `02-PAGES-CALCULATEURS.md §18`), sans action supplémentaire dans cette phase.

Les 4 autres calculateurs publics (bilan, autonomie, MPPT, AWG) n'ont pas d'équivalent direct déjà implémenté dans `lib/engines/` à ce jour (vérifié : `battery-engine.ts`, `solar-engine.ts`, `energy-engine.ts` existent mais avec des contrats d'entrée/sortie orientés Projet substantiellement différents des formulaires publics actuels) — une comparaison formule par formule dépasserait le périmètre de cette mission et est laissée à une phase de convergence dédiée.

## Navigation et ancres

Ancres réellement consommées ailleurs dans le site, vérifiées avant toute modification (`grep` sur tout `app/`/`components/`) :

- `/outils#section-cable`, `/outils#bilan-conso`, `/outils#autonomie`, `/outils#mppt` — utilisées par `components/home/OutilsGratuits.tsx` (Home, UI-3). **Conservées à l'identique.**
- `/outils#section-cable` — utilisée par `components/lesbases/BonsGestes.tsx` (Les Bases, UI-6). **Conservée à l'identique.**
- `/outils#awg` — pas de lien externe connu, mais conservée (utilisée en interne par l'index du hub).
- `/outils` (sans ancre) — `Navbar`, `Footer`, `components/home/Parcours.tsx`, `components/home/Hero.tsx`, `components/services/TroisFacons.tsx`, `components/services/ServicesCtaFinal.tsx`. Aucun changement nécessaire.

**Ancre morte corrigée** : `app/outils/page.tsx` pointait vers `/prestations#accompagnement-distance` (bloc CTA de fin), une ancre obsolète déjà remplacée par `#on-fait-ensemble` lors de la refonte Services (UI-4) mais jamais mise à jour ici. Remplacée par `/prestations#on-fait-ensemble` (nouvelle section "Accompagnement").

**Nouvelle ancre créée** : `/formations#bons-gestes` — la section "Bons gestes/Indispensables" de Les Bases (UI-6) n'avait pas d'`id`. Un `id="bons-gestes"` a été ajouté à son `<Section>` dans `app/formations/page.tsx` (une seule ligne) pour que la nouvelle passerelle "Les basiques de l'atelier" y renvoie précisément — changement minimal, justifié par la mission ("conserver ou corriger les ancres réellement utilisées... utiliser les nouvelles ancres réelles").

`#je-confie` n'a pas été utilisé sur `/outils` : aucun CTA de cette page ne correspond au sens "confier directement l'installation à FabSystem" (le CTA existant concerne l'accompagnement à distance, donc `#on-fait-ensemble`).

## UX formulaires

Non modifiée pour les 5 calculateurs (comportement conservé à l'identique, déjà conforme à l'essentiel du CDC avant cette mission) :
- Labels visibles au-dessus de chaque champ (`Intensité (A)`, `Longueur simple aller (m)`, etc.), jamais uniquement en `placeholder`.
- `type="number"` sur les champs numériques (clavier adapté sur mobile).
- Unités explicites dans le label (`(A)`, `(m)`, `(%)`, `(V)`).
- Résultat affiché dans une zone visuellement séparée des champs de saisie (colonne dédiée sur desktop, en dessous sur mobile via `grid lg:grid-cols-2`).
- Validation basique déjà présente (`if (!i || !l || !c || !t || i <= 0 || l <= 0) return;`) — pas de message d'erreur dédié par champ actuellement ; amélioration possible mais non traitée dans cette mission (pas de régression introduite, non plus).

## Responsive

- Hero, index des calculateurs, "Les basiques de l'atelier", Guides et Accompagnement : tous construits avec `Container`/`Section` (largeurs `max-w-6xl`/`max-w-3xl`/`narrow`), empilement vertical natif sous `sm`/`lg`.
- Index des calculateurs : carte principale (Section de câble) en pleine largeur sur mobile, `lg:col-span-2` sur desktop ; les 3 cartes secondaires en `sm:grid-cols-2` puis `lg:grid-cols-1` — jamais de tableau horizontal.
- Les 5 calculateurs (`CalcSection.tsx`) : non modifiés, déjà en `grid lg:grid-cols-2` (paramètres | résultat sur desktop, empilé sur mobile) — comportement déjà conforme et non régressé.
- Aucun résultat hors écran : les zones de résultat utilisent la largeur du conteneur parent, jamais de largeur fixe supérieure au viewport.
- Non vérifié dans un navigateur réel (aucun Playwright/Puppeteer dans ce dépôt) : validation par revue des classes Tailwind responsive + smoke test HTTP. Limitation déjà documentée dans les rapports précédents.

## Accessibilité

- Un seul `<h1>` sur `/outils` (Hero) — vérifié par smoke test.
- Hiérarchie `<h2>` cohérente : "Les calculateurs", chacun des 5 calculateurs (déjà en `<h2>` dans `CalcSection.tsx`, non modifié), "Les basiques de l'atelier", "Envie d'aller plus loin ?", "Un doute sur votre installation ?" — vérifiée par smoke test (aucun niveau de titre sauté).
- Liens explicites : "Calculer une section →", "Ouvrir →", "Voir les basiques de l'atelier →", "Voir la Boutique →", "Être accompagné" — aucun "cliquez ici".
- Focus visible : hérité des primitives `Button`/`Card` déjà validées (UI-1/UI-2), non modifié pour les calculateurs existants.
- Résultats de calcul : déjà non dépendants de la seule couleur dans `CalcSectionCable` (texte explicite "Section inférieure à 1,5 mm²...", "Section confortable...", pas seulement une pastille colorée) — non modifié, déjà conforme.

## Performance

- `app/outils/page.tsx` reste un Server Component par défaut. Seul `<CalcSection />` (et ses 5 sous-composants) est `"use client"` — c'était déjà le cas avant cette mission, confirmant que la mission de départ respectait déjà la contrainte "calculateurs interactifs en Client Component, reste du hub en Server Component".
- Nouveaux composants (`Hero`, `CalculateursIndex`, `BasiquesAtelier`, `Accompagnement`) : tous Server Components, aucun JS client ajouté.
- `Guides` : Server Component asynchrone (lecture catalogue), même pattern que `PasserelleBoutique` (UI-6) et les cartes Boutique (UI-5).
- `export const dynamic = "force-dynamic"` ajouté sur `/outils` : nécessaire car `Guides` affiche désormais un prix dynamique réel (même contrainte que `/boutique` et `/formations`) — la page ne peut plus être générée statiquement au build sans figer un prix.
- Aucune nouvelle dépendance npm. Aucune bibliothèque graphique ajoutée.

## Visuels nécessaires

- **Éditeur de schéma public** : n'existe pas. Sa mise en avant visuelle (aperçu réaliste de l'éditeur demandé par `01-HUB-PUBLIC.md §7`) ne peut pas être produite tant que l'outil lui-même n'est pas développé — hors périmètre de cette mission (UI-8 SaaS).
- **Illustrations par calculateur** : aucun visuel/schéma dédié n'existe pour illustrer chaque calculateur (le CDC `02-PAGES-CALCULATEURS.md` n'en exige pas explicitement) ; les cartes restent typographiques + emoji existant (déjà le cas avant cette mission, non modifié).
- **Volta** : aucun emoji ni icône n'a été ajouté à sa place dans les nouveaux composants Outils (Hero, index, basiques, guides, accompagnement) — conformément à l'instruction explicite de cette mission, Volta n'apparaît nulle part sur `/outils`.

## Arbitrages

1. **Architecture "une page par outil" non engagée.** Le CDC cible (`00-ARCHITECTURE-OUTILS.md §6`) prévoit une route dédiée par calculateur. La mission UI-7 restreint explicitement ce chantier ("ne pas faire une réécriture complète", "ne pas créer une phase infrastructure supplémentaire") et plusieurs ancres réelles (Home, Les Bases) pointent aujourd'hui vers les sections de la page unique `/outils`. Migrer aurait cassé ces liens sans bénéfice immédiat pour cette mission. L'architecture actuelle (une page, cinq sections ancrées) est conservée ; la migration reste un travail futur explicitement documenté, pas silencieusement abandonné.
2. **"Les basiques de l'atelier" en passerelle plutôt qu'en contenu dupliqué.** Le CDC (`01-HUB-PUBLIC.md §9`) décrit cette section avec deux axes ("outils indispensables", "bons gestes") qui recoupent exactement le contenu déjà écrit et publié en UI-6 sur `/formations` ("Le minimum pour travailler proprement", "Les bons gestes"). Republier une seconde version plus courte (donc nécessairement moins complète) aurait créé deux sources divergentes du même contenu. La section reste donc une passerelle courte et honnête vers le contenu réel déjà existant, cohérente avec la propre règle du CDC ("reste volontairement courte... ne pas republier gratuitement").
3. **Sections "Schéma électrique" et "Mes projets" omises**, pas indiquées "Bientôt disponible". Aucune des deux fonctionnalités n'existe dans le dépôt ; la mission UI-7 est explicite ("Ne pas afficher... sauf exigence explicite du CDC") et aucune exigence de ce type n'a été trouvée pour ce cas précis — rien n'a donc été affiché plutôt qu'un encart vide ou un badge "à venir" qui n'apporterait aucune valeur réelle au visiteur actuel.
4. **Extraction limitée à `CalcSectionCable`.** Les 4 autres calculateurs (bilan, autonomie, MPPT, AWG, ~1100 lignes cumulées) n'ont pas été refactorés en profondeur : la mission nomme explicitement "Calculateur de section de câble" comme sujet du refactor (rubrique dédiée du rapport demandé), et étendre le même traitement aux 4 autres aurait dépassé "refactorer uniquement si cela améliore réellement" pour un gain non demandé dans cette phase. Leur comportement n'a subi aucune régression (seul l'import de `CALC_META`/`OUTILS_CALCULATEURS` a changé, une donnée pure).
5. **Convergence avec `cable-engine.ts` documentée, non implémentée.** Voir section dédiée : fusionner les deux moteurs impliquerait de modifier un moteur métier SaaS existant, restreint explicitement par cette mission en l'absence de bug démontré. Duplication actuelle sans risque (formules vérifiées identiques par un cas croisé testé).
6. **Nouvel `id="bons-gestes"` sur `/formations`.** Seul changement hors du périmètre strict `/outils` (avec la correction du libellé "Apprendre" en UI-6, même logique) : un attribut `id` ajouté à une `Section` déjà existante, nécessaire pour qu'un lien réel créé par cette mission ait une destination précise plutôt qu'un simple renvoi en haut de page.

## Vérifications techniques

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : 851/851 tests passants (844 existants + 7 nouveaux pour `lib/calc/section-cable.ts`), aucune régression.
- `npm run build` : build de production réussi ; `/outils` listée en rendu dynamique (`ƒ`, cohérent avec le prix dynamique des guides).
- Smoke test serveur de dev : `GET /outils` → 200. Contenu attendu présent (Hero, 5 calculateurs avec leurs 5 ancres réelles, guides avec prix dynamique réel, CTA accompagnement vers `#on-fait-ensemble`, aucune trace de `#accompagnement-distance`). `GET /formations` → confirmé, `id="bons-gestes"` présent.
