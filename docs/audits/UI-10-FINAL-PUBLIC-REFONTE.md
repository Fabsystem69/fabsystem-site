# UI-10 — Refonte visuelle / architecture publique finale

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Origine :** revue visuelle réelle du dernier push par l'utilisateur (captures desktop), pas une reprise des audits théoriques précédents.
**Non touché :** moteurs de calcul, EngineRunner, dépendances Project, Prisma, Stripe, règles d'achat, auth, admin, suppression +72h, Volta.
**Limite assumée :** aucun outil navigateur/capture d'écran disponible dans cet environnement. Toute vérification passe par lecture de code + `curl` + `grep` sur le HTML rendu — fiable pour la structure (ancres, build, présence des éléments) mais pas pour un jugement esthétique fin. Signalé à l'utilisateur avant de commencer.

---

# Architecture avant / après

**Avant** : chaque page publique avait son propre système de Hero (5 variantes différentes, déjà documentées dans UI-9.1), toutes avec un grand bandeau photo + overlay occupant une bonne partie du premier écran.

**Après** :
- **Home** : garde un vrai grand Hero (`components/public/PublicHero.tsx`, inchangé dans sa structure UI-9.1, désormais réservé à cette seule page) + indicateur de scroll.
- **Toutes les pages secondaires** (Services, Boutique, Les Bases, Outils, Contact, À propos, landers SEO) : nouvel en-tête compact `components/public/PageIntro.tsx` — titre + phrase courte, fond neutre, pas de photo, contenu réel visible immédiatement en dessous.
- **Services** : passe d'une page unique de ~8 sections empilées à 3 pages — une page d'orientation (`/prestations`) + deux pages dédiées (`/prestations/accompagnement`, `/prestations/intervention`).
- **Outils** : nouvelle identité visuelle réelle (illustrations fournies par l'utilisateur, `public/outils/*.png`) remplaçant la hiérarchie "gros pavé + 3 pavés + AWG à part".

---

# Hero

- `components/public/PageIntro.tsx` (nouveau) : titre + description courte, fond `bg-neutral-50`, `py-6 sm:py-8` — remplace le grand Hero sur Services, Boutique, Les Bases, Outils, Contact, À propos et les 4 landers SEO (installation-12v-bateau, sécurisation-correction-bateau, réalisations, problème-charge-batterie-bateau).
- `components/public/PublicHero.tsx` : conservé tel quel dans sa structure (héritage UI-9.1), mais son usage est désormais réservé exclusivement à la Home. L'indicateur de scroll (chevrons, déjà construit en UI-9.1) y reste actif.
- Composants Hero devenus inutiles supprimés : aucun cette fois (déjà nettoyés en UI-9.1) — seuls les appels à `PublicHero` ont été remplacés par des appels à `PageIntro` sur les pages concernées.

---

# Home

## Hero
Inchangé dans sa structure (style jugé bon par l'utilisateur), toujours avec l'indicateur de scroll vers `#apres-hero` (`TroisUnivers`).

## Image Hero (§2.2)
Le visuel actuel (`/hero-fabsystem.png`) reste en place — aucune photo combinant Bateau + Van n'a été fournie pour cette mission, et la mission interdit explicitement d'en générer une. Un commentaire dédié dans `PublicHero.tsx` documente le besoin exact et le point unique à modifier le jour où l'asset est disponible (`const BACKGROUND`).

## Univers (§2.3)
`components/home/TroisUnivers.tsx` continue de pointer vers `/prestations?univers=<id>`. Le comportement "Hero coupé / cartes coupées / mauvais scroll initial" décrit par l'utilisateur ne peut plus se produire : `/prestations` n'est plus une longue page à scroll interne — c'est désormais une page d'orientation courte (PageIntro + 2 cartes de choix + repli "Je fais seul"), donc il n'y a plus de saut d'ancre à mi-page à corriger sur cette destination. Le paramètre `?univers=` est transmis tel quel aux deux pages dédiées (`/prestations/accompagnement?univers=X`, `/prestations/intervention?univers=X`) via `lib/prestations-search-params.ts` (nouveau, factorisé pour éviter la duplication entre les 3 pages `/prestations/**`).

## Ancres Home (audit complet)
`components/home/Parcours.tsx#parcours` n'avait pas de `scroll-mt` (bug réel confirmé par grep, indépendant de ce ticket) — corrigé (`scroll-mt-24`). `components/home/TroisUnivers.tsx#apres-hero` n'en avait pas non plus (créé en UI-9.1 sans y penser) — corrigé.

## Bloc Outils (§2.4)
`components/home/OutilsGratuits.tsx` réécrit : l'ancienne hiérarchie "1 grande carte Section câble + 3 cartes empilées" est remplacée par une grille uniforme des 5 outils, réutilisant `OutilCard` (composant partagé avec `/outils`, voir section Outils) — même poids visuel pour chacun, CTA final inchangé vers `/outils`.

---

# Services

## Page d'orientation (`/prestations`, §3)
Entièrement réécrite. Structure : `PageIntro` → 2 grandes cartes de choix ("Être accompagné" → `/prestations/accompagnement`, "Confier mon installation" → `/prestations/intervention`, contraste clair/sombre pour les différencier visuellement) → bloc secondaire compact "Je fais seul" (texte + 2 liens Outils/Les Bases, jamais traité comme une offre) → `Déroulement` (conservé, vue d'ensemble des 3 chemins) → `Faq` (conservée).

Composants retirés de cette page : `TroisFacons`, `OnFaitEnsemble`, `JeConfie` (déplacés vers leurs pages dédiées), `Preuves` (voir section dédiée), `ServicesCtaFinal` (devenu redondant avec les 2 nouvelles cartes de choix en tête de page).

## Accompagnement (§4)
Nouvelle page `/prestations/accompagnement`. Contenu = `components/services/OnFaitEnsemble.tsx`, densifié : espacements verticaux réduits (`mt-8`→`mt-5`, `mt-10`→`mt-6`, `pt-8`→`pt-5`), "Préparer / Vérifier / Débloquer" passé d'une grille 3 colonnes aérée à une ligne compacte (`flex flex-wrap gap-x-8`), sélecteur d'univers et offres rapprochés du haut de page. Pas de `PageIntro` séparé : le composant porte déjà son propre eyebrow + h1 + description, un second bloc d'intro aurait dupliqué le message (et créé un second `<h1>`).

## Intervention (§5)
Nouvelle page `/prestations/intervention`. Contenu = `components/services/JeConfie.tsx`, réécrit. Les deux cartes "J'ai une intervention précise" / "J'ai un projet" — auparavant des blocs statiques sans effet au clic (constat utilisateur : "trompeur") — sont désormais `ContactModalTrigger` (`components/services/ContactModal.tsx`, nouveau) : un clic ouvre une vraie modale de contact, reste sur le site, message prérempli selon le contexte cliqué (via un nouveau prop `defaultMessage` sur `ContactForm`), réutilise `/api/contact` tel quel (aucune nouvelle route). La modale : `role="dialog"` + `aria-modal`, piège de focus, fermeture au clic sur le fond ou `Escape`, restaure le focus au premier élément focusable à l'ouverture — même pattern que `CartDrawer.tsx` déjà en place dans le dépôt. Le bouton "Voir les réalisations →" qui pointait vers `#preuves` (ancre qui n'existera plus sur cette page) a été changé pour pointer vers `/realisations` (page toujours réelle et disponible).

## Réalisations (§6)
Retirée du flux principal de Services : `components/services/Preuves.tsx` (études de cas + témoignages + double pont) supprimé, plus aucun import. La page standalone `/realisations` existe toujours et reste accessible (via le lien ci-dessus et la navigation existante) — aucun contenu inventé, aucun blog créé (hors périmètre de cette mission).

## Ancres / scroll (§7)
Audit complet de tous les `id=` utilisés comme cible d'ancre sur Home + Services : `scroll-mt-16` uniformisé en `scroll-mt-24` partout (`on-fait-ensemble`, `je-confie`, `modules`, `calculateurs`, `guides-disponibles`, `bons-gestes`, `outils-principaux`), et les deux cibles qui n'avaient aucun `scroll-mt` (`#parcours` sur Home et sur l'ancienne page Services, `#apres-hero` sur Home) corrigées. Les anchors mortes préexistantes (`/prestations#accompagnement-distance`, qui ne correspondait à aucun `id` réel — bug déjà présent avant cette mission, trouvé par grep) corrigées vers `/prestations/accompagnement` dans les 6 fichiers qui la référençaient (`realisations`, `installation-12v-bateau`, `FaqEbook` ×2, `CartDrawer`).

---

# Boutique

## Performance (§8.1)
Mesuré, pas deviné : TTFB comparé entre `/`, `/boutique`, `/prestations`, `/outils`, `/formations` en production réelle (`curl -w "%{time_total}"` sur `www.fabsystem.fr`) — aucun écart flagrant et reproductible spécifique à `/boutique` (0.58-0.68s, comparable ou meilleur que `/prestations`). Le vrai problème identifié en lisant le code : `components/boutique/ProductCard.tsx` n'avait **aucun attribut `sizes`** sur son `<Image>` (`next/image`), contrairement à toutes les autres images du site — sans `sizes`, le navigateur peut demander une image bien plus grande que sa taille réelle affichée dans la grille. Corrigé. Deuxième cause réelle : **aucune page du site n'a de `loading.tsx`** — `/boutique` étant `force-dynamic`, l'utilisateur ne voyait rien (écran blanc) tant que la requête base de données n'était pas terminée, ce qui correspond exactement à la plainte "donne l'impression que la page bug". Créé `app/boutique/loading.tsx` (squelette immédiat, convention native Next.js, aucun JS supplémentaire).
Non traité : le point d'architecture secondaire noté en observant `buildGuideEntries()` (N requêtes parallèles, une par produit, plutôt qu'une requête batchée) — le volume actuel (2-3 produits réels) ne le justifie pas et toucher `lib/services/catalog.ts` aurait dépassé le périmètre "ne pas refaire le backend" pour un gain non mesuré comme significatif.

## Hero (§8.2)
`PublicHero` → `PageIntro` (voir section Hero). Les produits arrivent immédiatement après.

## Cartes produits (§8.3)
`ProductCard.tsx` agrandi : image `h-44`→`h-60`, padding `p-5`→`p-6`, titre `text-lg`→`text-xl`. Grille conservée à 3 colonnes max (`sm:grid-cols-2 xl:grid-cols-3`) — avec 2-3 produits réels + 1 carte "à venir", 3 colonnes reste la disposition la plus cohérente pour une "petite sélection premium" (ni étirée à 2 colonnes avec une carte seule sur sa ligne, ni un mur de 20 produits).

## Ebook Camping-car (§8.4)
`ComingSoonCard` (nouveau, dans `GuidesEtUnivers.tsx`) : carte éditoriale visuellement alignée sur `ProductCard` (même gabarit) mais explicitement non achetable — pas de prix, pas de CTA d'achat, pas de lien vers une fiche produit, bordure en pointillés. Affichée dans la vue "Tous" (aux côtés des vrais produits, pour que les 3 univers restent visibles ensemble) et dans la vue filtrée "Camping-car" (à la place de l'ancien message texte seul). Aucune ligne `Product` créée en base.

---

# Les Bases

## Hero (§9.1)
`PublicHero` → `PageIntro`.

## Structure (§9.2)
`app/formations/page.tsx` réécrit : nouvelle barre de navigation interne compacte (3 ancres : Formations, Les bons gestes, Les outils) juste sous l'en-tête. Nouvelle section "Les outils principaux" (`#outils-principaux`) : liens directs vers les 5 calculateurs + CTA "Voir tous les outils →" — volontairement léger (pas de réplique du hub Outils, conforme à la consigne de ne pas dupliquer).

## Quiz (§9.3)
`QuizSection` déplacée en toute fin de page (après les passerelles Boutique/Services), plus au milieu — logique désormais : apprendre → bons gestes → outils → passerelles → tester ses connaissances.

---

# Outils

C'est la refonte la plus importante de cette mission (priorité visuelle explicite de l'utilisateur).

## Hero (§10.1)
`PublicHero` → `PageIntro`. Les calculateurs sont visibles dès le premier écran.

## Structure abandonnée (§10.2)
L'ancienne composition (`CalculateursIndex.tsx`) qui donnait à "Section de câble" une carte 2 colonnes, empilait 3 outils secondaires à côté, et traitait AWG comme une bannière séparée en bas, a été entièrement supprimée.

## Design produit (§10.3)
L'utilisateur a fourni, en cours de mission, une illustration réelle par calculateur (`public/outils/section-cable.png`, `bilan-consommation.png`, `autonomie-batterie.png`, `mppt.png`, `awg.png`, renommées depuis les fichiers originaux). `lib/outils-catalog.ts` mis à jour : le champ `emoji` (jamais utilisé dans le rendu — vérifié par grep avant suppression) remplacé par `image`, pointant vers ces fichiers. Nouveau composant partagé `components/outils/OutilCard.tsx` : image en ratio 4:3, badge de tag, titre, description, "Ouvrir →" — identité visuelle réelle par outil, aucun emoji, aucune icône générique sans rapport avec la fonction.

## Carrousel (§10.4)
**Testé dans le raisonnement, écarté avant implémentation.** Sans outil de capture d'écran pour comparer réellement les deux rendus (déjà signalé à l'utilisateur avant de commencer), construire un carrousel aurait ajouté de la complexité (contrôles, swipe, pause au survol, `prefers-reduced-motion`) sans pouvoir vérifier qu'il "résout mieux" le problème qu'une grille — ce que la mission elle-même interdit ("ne pas forcer le carrousel si le rendu est moins bon"). Choix retenu : grille responsive uniforme (`sm:grid-cols-2 lg:grid-cols-3`), qui affiche les 5 outils sans scroll horizontal ni JS supplémentaire. Si l'utilisateur juge après déploiement que le rendu manque de dynamisme, un carrousel peut être ajouté dans une mission dédiée avec une vraie comparaison visuelle.

## Accès rapide (§10.5)
Bandeau de 5 liens compacts (pills) juste sous le titre "Les calculateurs", avant la grille — navigation directe en un clic pour qui sait déjà quel outil il cherche.

## Pages calculateurs (§10.6)
Non modifiées au-delà de ce qui existait déjà (UI-9.1 avait déjà ajouté un "accès rapide" compact — `relatedTools` — dans `CalculatorPageShell.tsx`, 1-2 liens contextuels). Pas de carrousel ajouté sur ces pages.

---

# Contact

- Hero → `PageIntro` (§11). Formulaire, carte de visite, QR, FAQ conservés à l'identique.
- Les deux boutons "Ajouter à mes contacts" pointaient vers le même fichier `.vcf` avec le même libellé — impression de doublon confirmée. Ils ont une fonction réellement différente (l'un ouvre le flux natif "Ajouter aux contacts" du téléphone, l'autre force un téléchargement de fichier via l'attribut `download`) : conservée, seul le second libellé a été clarifié ("Télécharger la fiche (.vcf)").

---

# À propos

- Hero → `PageIntro` (§12). Le contenu réel (portrait de Fabien, Expertise, Positionnement) arrive immédiatement après, sans section ajoutée.

---

# Navigation / ancres

Audit complet effectué par grep de tous les `id="..."` utilisés comme cible d'ancre dans `app/` et `components/` (Home, Services, Les Bases, Outils, Boutique). Résultat :
- 2 cibles sans aucun `scroll-mt` (bug réel, indépendant du reste de la mission) : `components/home/Parcours.tsx#parcours`, `components/home/TroisUnivers.tsx#apres-hero` — corrigées.
- 1 famille d'ancres mortes préexistante (`/prestations#accompagnement-distance`, ne correspondant à aucun `id` réel) référencée dans 6 fichiers — corrigée vers `/prestations/accompagnement`.
- Toutes les cibles restantes uniformisées sur `scroll-mt-24` (96px, marge confortable au-dessus du header sticky ~60-64px) au lieu de `scroll-mt-16` (64px, jugé trop juste par la mission — "aucune section ciblée ne doit arriver coupée sous le header").

---

# Performance Boutique

Voir section Boutique ci-dessus pour le détail. Résumé : mesuré en conditions réelles (production), aucun écart de TTFB flagrant trouvé ; la cause probable de la perception "la page bug" est l'absence totale de tout `loading.tsx` sur le site (corrigée pour `/boutique`) combinée à une image de couverture sans `sizes` (corrigée).

---

# Responsive

Vérifié par lecture des classes Tailwind + smoke test HTTP réel (pas de navigateur disponible) :
- `PageIntro` utilise `px-6 py-6 sm:py-8`, identique sur toutes les pages qui l'utilisent, à toutes les largeurs.
- `OutilCard` et `ProductCard` : grilles `grid-cols-1`→`sm:grid-cols-2/3`→`lg:grid-cols-3/5`, aucune largeur fixe.
- `ContactModal` : `max-w-lg`, `max-h-[85vh] overflow-y-auto`, centré avec `p-4` de marge — ne déborde jamais du viewport, y compris à 375px.
- Bandeau "Accès rapide" (Outils, Les Bases) : `flex flex-wrap`, jamais de débordement horizontal.
- Indicateur de scroll Home : inchangé depuis UI-9.1, déjà vérifié à 375/430/desktop.
- Header sticky : hauteur inchangée (~60-64px), confirmée par lecture de `components/Navbar.tsx` — c'est la base du calcul `scroll-mt-24`.

---

# Tests

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **872/872** tests passants, aucune régression (aucun test ne couvrait la présentation Hero/PageIntro — nature de ce changement, purement visuelle/structurelle côté public).
- `npm run build` : build de production réussi ; `/prestations/accompagnement` et `/prestations/intervention` listées comme nouvelles routes dynamiques.
- Smoke test réel (serveur de développement local) :
  - Les 13 pages concernées répondent `200`.
  - `?univers=van` sur `/prestations` produit bien des liens `/prestations/accompagnement?univers=van` et `/prestations/intervention?univers=van` dans le HTML rendu.
  - Les 5 illustrations d'outils sont bien servies sur `/outils`.
  - `/formations` contient bien les 4 ancres dans l'ordre `modules` → `bons-gestes` → `outils-principaux` → `quiz` (Quiz en dernier dans le DOM).
  - `/prestations` et `/` ne contiennent plus `/hero-fabsystem.png` que dans les balises `og:image`/`twitter:image` (métadonnées de partage, pas le Hero visuel) — confirmé que `/prestations` n'a plus de fond photo.
  - `/prestations/intervention` contient bien les deux déclencheurs de modale ("Décrire mon besoin", "Présenter mon projet").
  - `/boutique` affiche bien la carte "Guide Camping-car — Bientôt disponible".

---

# Fichiers modifiés

**Créés** : `components/public/PageIntro.tsx`, `components/outils/OutilCard.tsx`, `components/services/ContactModal.tsx`, `lib/prestations-search-params.ts`, `app/boutique/loading.tsx`, `app/prestations/accompagnement/page.tsx`, `app/prestations/intervention/page.tsx`.

**Supprimés** : `components/services/TroisFacons.tsx`, `components/services/Preuves.tsx`, `components/services/ServicesCtaFinal.tsx`.

**Réécrits en profondeur** : `app/prestations/page.tsx`, `components/services/OnFaitEnsemble.tsx`, `components/services/JeConfie.tsx`, `app/formations/page.tsx`, `components/outils/CalculateursIndex.tsx`, `components/home/OutilsGratuits.tsx`, `components/boutique/GuidesEtUnivers.tsx`.

**Modifiés (Hero → PageIntro, ou correctifs ciblés)** : `app/boutique/page.tsx`, `app/outils/page.tsx`, `app/contact/page.tsx`, `app/a-propos/page.tsx`, `app/installation-12v-bateau/page.tsx`, `app/securisation-correction-bateau/page.tsx`, `app/realisations/page.tsx`, `app/probleme-charge-batterie-bateau/page.tsx`, `app/page.tsx`, `components/home/Parcours.tsx`, `components/home/TroisUnivers.tsx`, `components/boutique/ProductCard.tsx`, `components/ContactForm.tsx`, `components/public/PublicHero.tsx`, `components/FaqEbook.tsx`, `components/cart/CartDrawer.tsx`, `components/home/Accompagnement.tsx`, `components/outils/Accompagnement.tsx`, `components/boutique/PasserelleAccompagnement.tsx`, `components/outils/CalculatorPageShell.tsx`, `lib/outils-catalog.ts`.

---

# Arbitrages

1. **Carrousel Outils non implémenté.** Choix explicite faute de pouvoir comparer visuellement les deux rendus dans cet environnement — signalé à l'utilisateur avant de commencer. Grille uniforme retenue comme option la plus sûre à qualité égale non vérifiée.
2. **Réalisations non recréée ailleurs sur Services.** Composant `Preuves.tsx` supprimé en totalité (études de cas + témoignages publiés + double pont), pas seulement les études de cas — la mission cible "cette section" comme un tout, et ne demande pas de relocaliser les témoignages. Ils redeviendront visibles quand le sujet sera retravaillé (blog/cas chantier, hors périmètre ici).
3. **Pas de nouvelle page `/prestations` distincte pour "Je fais seul".** Traité comme un simple bloc secondaire sur la page d'orientation avec 2 liens (Outils, Les Bases), conformément à "ne pas traiter Je fais seul comme une vraie offre de service" — créer une 4ᵉ page aurait contredit cette instruction.
4. **Modale de contact réutilise `/api/contact` existant, aucune nouvelle route.** `ContactForm` a simplement gagné un prop `defaultMessage` optionnel ; toute la logique d'envoi, l'anti-spam et le honeypot restent inchangés.
5. **`ComingSoonCard` (Boutique) et carte "à venir" volontairement minimalistes** (pas de vraie photo, placeholder textuel "Visuel à venir") — aucun visuel Camping-car fourni pour la Boutique spécifiquement (contrairement aux photos d'univers Home et aux illustrations Outils, fournies pour ces usages précis).
6. **`scroll-mt-24` choisi plutôt que `scroll-mt-16`** pour toutes les ancres, avec une marge volontairement généreuse au-dessus des ~60-64px du header sticky réel — préférence pour "jamais coupé" plutôt que pour le minimum théorique suffisant.
7. **Ancres mortes préexistantes corrigées en passant** (`#accompagnement-distance`) bien que non explicitement citées par la mission — laissées en l'état, elles auraient contredit directement l'objectif "aucune section ciblée ne doit arriver coupée".

---

# Correction finale Outils — direction SaaS validée

**Statut :** Implémenté — aucun commit. Correctif ciblé sur `/outils` uniquement (et le teaser Home), suite à la validation visuelle de la direction "SaaS technique premium" par l'utilisateur. Ne reprend pas le reste de UI-10 (Services/Boutique/Les Bases/Contact/À propos non retouchés).

## Rendu retenu : grille, pas carrousel

Grille responsive uniforme, confirmé à nouveau après cette itération. Aucun outil de capture d'écran disponible dans cet environnement pour comparer réellement grille vs carrousel (déjà signalé lors du premier passage UI-10) : construire un carrousel sans pouvoir vérifier qu'il donne un meilleur rendu aurait été contraire à l'instruction explicite "ne pas forcer un carrousel uniquement pour faire moderne". La grille affiche les 6 cartes (5 outils + Schéma) comme une famille strictement homogène, sans JS ni dépendance supplémentaire, en `3 colonnes × 2 lignes` sur desktop large — exactement la disposition suggérée en repli par la mission (§8).

## Les 6 cartes

`lib/outils-catalog.ts` : ajout d'un champ `cta` par outil (libellé propre à chaque calculateur au lieu d'un "Ouvrir" générique partout — `Calculer` pour Section de câble, `Ouvrir` pour Bilan/Autonomie/MPPT, `Convertir` pour AWG) et d'une constante séparée `OUTIL_A_VENIR` (Schéma électrique) : **volontairement hors de `OUTILS_CALCULATEURS`**, le tableau qui alimente aussi les routes et le bandeau Accès rapide — Schéma électrique ne doit jamais y apparaître puisqu'aucune route `/outils/schema*` n'existe.

| Outil | Illustration | CTA |
|---|---|---|
| Section de câble | `/outils/section-cable.png` | Calculer → |
| Bilan de consommation | `/outils/bilan-consommation.png` | Ouvrir → |
| Autonomie batterie | `/outils/autonomie-batterie.png` | Ouvrir → |
| Régulateur MPPT | `/outils/mppt.png` | Ouvrir → |
| AWG ↔ mm² | `/outils/awg.png` | Convertir → |
| Schéma électrique | `/outils/schema-bientot-disponible.png` | — (carte non cliquable) |

Les 5 premières illustrations avaient déjà été fournies et renommées lors du premier passage UI-10. La 6ᵉ (`appli schema bient dispo.png`, déjà présente dans `public/outils/` mais pas encore utilisée) a été renommée `schema-bientot-disponible.png` et intégrée.

## Carte Schéma "Bientôt disponible"

Nouveau composant `OutilComingSoonCard` (`components/outils/OutilCard.tsx`) : `<article>`, jamais un `<Link>` ni un élément avec comportement de bouton — aucune interaction possible, conforme à "ne pas lui donner un comportement de bouton s'il n'est pas cliquable". Badge `Bientôt disponible` (ton neutre) + texte `En préparation` en bas de carte : le statut est porté par du texte explicite, jamais par la seule couleur. Illustration légèrement atténuée (`opacity-70`) pour la distinguer visuellement des 5 cartes actives sans dépendre uniquement de la bordure en pointillés.

## Accès rapide

Inchangé dans son principe (déjà correct depuis le premier passage UI-10) : `nav` de 5 liens, itère exclusivement sur `OUTILS_CALCULATEURS` — vérifié par smoke test que "Schéma électrique" n'y apparaît jamais et qu'aucun lien `/outils/schema*` n'existe nulle part sur la page.

## Teaser Home

`components/home/OutilsGratuits.tsx` : passait de 5 `OutilCard` pleine taille à seulement les **3 premières** (`OUTILS_CALCULATEURS.slice(0, 3)` — Section de câble, Bilan de consommation, Autonomie batterie), conformément à "ne pas reproduire les 6 cartes complètes". Même composant `OutilCard` réutilisé tel quel (même identité visuelle que `/outils`), grille `sm:grid-cols-3` sans la 4ᵉ/5ᵉ colonne desktop de l'itération précédente. CTA "Voir tous les outils →" inchangé.

## Intro de page

`app/outils/page.tsx` : copie de `PageIntro` alignée mot pour mot sur la mission — eyebrow "Les outils FabSystem", titre "Calculez, dimensionnez, vérifiez.", description "Des outils simples et gratuits pour préparer une installation électrique fiable." `CalculateursIndex.tsx` : suppression de son propre `<h2>`/`<p>` visible (redondant avec `PageIntro`, laissait un doublon de titre juste en dessous) — remplacé par un `<h2 className="sr-only">` pour garder une structure de titres valide sans rien afficher deux fois.

## Responsive

Vérifié par lecture des classes + smoke test HTTP réel : grille `grid-cols-1` (mobile) → `sm:grid-cols-2` (tablette) → `lg:grid-cols-3` (desktop, 3×2 avec 6 cartes). `sizes` de chaque image adapté à ces paliers (`100vw` / `50vw` / `384px`). Bandeau Accès rapide en `flex flex-wrap`, jamais de débordement horizontal forcé.

## Accessibilité

- `OutilCard` : une seule zone cliquable par carte (le `<Link>` englobant), aucun lien imbriqué, focus visible (`focus-visible:outline`).
- `OutilComingSoonCard` : non interactive, aucun `href`, aucun `role="button"` — son statut ("Bientôt disponible" / "En préparation") reste lisible sans dépendre de la couleur.
- Images décoratives : `alt=""` sur les 6 illustrations — le titre de chaque carte porte déjà l'information, conforme à la règle "alt vide si le titre porte déjà l'information".

## Performance images

`next/image` avec `fill` + `sizes` explicite sur les 6 cartes (repris du premier passage UI-10, déjà correct) — pas de `priority` ajouté (chargement lazy par défaut, cohérent avec des illustrations qui ne sont pas le LCP critique de la page). Aucune image chargée en pleine résolution inutilement sur mobile grâce à `sizes`.

## Tests

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **872/872** tests passants, aucune régression.
- `npm run build` : build de production réussi.
- Smoke test réel (serveur de développement local) :
  - `/outils`, les 5 pages calculateurs, `/`, `/prestations`, `/boutique`, `/formations` répondent toutes `200`.
  - Les 6 illustrations (`section-cable`, `bilan-consommation`, `autonomie-batterie`, `mppt`, `awg`, `schema-bientot-disponible`) sont bien servies sur `/outils`.
  - La carte Schéma affiche bien "Schéma électrique" + "Bientôt disponible" + "En préparation", et **aucun** `href="/outils/schema*"` n'existe nulle part sur la page.
  - Le bandeau Accès rapide ne contient que les 5 outils réels.
  - Les CTA par outil (`Calculer`, `Ouvrir` ×3, `Convertir`) sont bien rendus.
  - Le teaser Home ne contient plus que 3 liens `/outils/<id>` (section-cable, bilan-consommation, autonomie-batterie), plus aucun lien vers mppt/awg depuis la Home.

## Fichiers modifiés

`lib/outils-catalog.ts` (champ `cta` ajouté, `OUTIL_A_VENIR` nouveau), `components/outils/OutilCard.tsx` (`OutilComingSoonCard` ajouté, CTA par outil), `components/outils/CalculateursIndex.tsx` (grille à 6 cartes, titre visible retiré au profit du `PageIntro`), `app/outils/page.tsx` (copie d'intro alignée sur la mission), `components/home/OutilsGratuits.tsx` (teaser réduit à 3 cartes). Aucun fichier de `/outils/section-cable`, `/outils/bilan-consommation`, `/outils/autonomie-batterie`, `/outils/mppt`, `/outils/awg` modifié — formules, résultats et comportement métier inchangés. Aucun fichier Services/Boutique/Les Bases/Contact/À propos touché.
