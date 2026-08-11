# UI-4-SERVICES-UNIVERS — Refonte Services, univers et destinations

**Date : 22/08/2026**
**Périmètre : refonte complète de `/prestations` (Services V2), résolution des destinations temporaires univers/accompagnement créées par la Home (UI-3). Aucune API, moteur, Dashboard, espace client, Boutique, Les bases ou Outils modifié.**

**Documents lus** : `docs/masters/MASTER-12-DESIGN-SYSTEM.md`, `docs/refonte-site-public/00-CAHIER-DES-CHARGES-GLOBAL.md`, l'intégralité des CDC Services (`00` à `08`, dont les versions `update/00-SERVICES-ARCHITECTURE(3).md`, `update/02-MATRICE-ACCOMPAGNEMENTS(6).md`, `update/03-ON-FAIT-ENSEMBLE(6).md` — vérifiées identiques aux versions `services/` correspondantes, aucun contenu supplémentaire), `docs/audits/UI-2-LAYOUT-PUBLIC.md`, `docs/audits/UI-3-HOME.md`. Aucun CDC dédié `univers/*.md` n'existe (recherche confirmée — seul `home/02-TROIS-UNIVERS.md` en parle, comme intention future).

---

# Architecture retenue

Un seul fichier de route, `app/prestations/page.tsx`, orchestrant huit sections dans `components/services/` — ordre strictement conforme à `services/00-SERVICES-ARCHITECTURE.md` §3 :

```
Header (global, inchangé)
  → Hero (PageHero, réutilisé tel quel)
  → Trois façons d'avancer         (id="parcours")
  → On fait ensemble               (id="on-fait-ensemble")
  → Je confie                      (id="je-confie")
  → Comment avancer (Déroulement)
  → Preuves et réalisations        (id="preuves")
  → FAQ
  → CTA final
Footer (global, inchangé)
```

**Réutilisation systématique** de l'existant plutôt que reconstruction :
- **`PageHero`** (composant public déjà en production) pour le Hero — aucun nouveau composant Hero créé.
- **`PrestationsDistanceOffers`** (composant réel, déjà en production sur l'ancienne page, lisant le catalogue réel avec prix déjà vendus) pour le cœur de la section « On fait ensemble » — modifié minimalement (un prop optionnel `initialCategory`, voir Ancres), jamais réécrit.
- **`Container`/`Section`** (UI-2) pour la structure et le rythme vertical de toutes les sections.
- **`Card`/`Button`/`Alert`** (UI-1) pour « Trois façons d'avancer », les CTA et la zone d'intervention.
- **Contenu réel déjà publié** : les trois études de cas de `/realisations` (mêmes textes, mêmes photos) réutilisées telles quelles dans « Preuves et réalisations », restructurées au format Besoin/Intervention/Résultat demandé par le CDC.

**Composants réellement nouveaux, strictement nécessaires** (aucun composant générique supplémentaire créé) :
- `components/services/TroisFacons.tsx`, `OnFaitEnsemble.tsx`, `JeConfie.tsx`, `JeConfieUnivers.tsx` (sélecteur d'univers client, spécifique à Je confie — un composant partagé avec le sélecteur d'On fait ensemble aurait mélangé deux responsabilités différentes, prix/panier d'un côté, aucun prix de l'autre), `Deroulement.tsx`, `Preuves.tsx`, `Faq.tsx`, `ServicesCtaFinal.tsx`.

---

# Services

Chaque section reprend les textes validés du CDC **mot pour mot**, sans texte, slogan, bouton ou offre supplémentaire :

- **Hero** : titre « Vous avez un projet. Choisissez jusqu'où vous voulez être accompagné. », texte, un seul CTA « Choisir comment avancer » → `#parcours`. Aucun Volta, aucune bande de valeurs sous le Hero (interdite explicitement §6).
- **Trois façons d'avancer** : trois cartes de même poids visuel (`Card`, UI-1), aucune couleur différente par parcours, CTA « Explorer les outils » / « Découvrir l'accompagnement » / « Voir les services terrain ».
- **On fait ensemble** : « Vous restez aux commandes. », Préparer/Vérifier/Débloquer, puis le sélecteur d'univers réel (Bateau/Van/Camping-car) avec les quatre paliers déjà vendus (Amarrage/Cap/Passerelle/Grand Large), prix réels, ajout au panier réel. **Aucun prix inventé** : tous les montants affichés proviennent de `lib/prestations-packs.ts`, déjà en production.
- **Je confie** : accroche exacte, sélecteur d'univers avec les catégories d'intervention listées mot pour mot par le CDC (§8-10), « J'ai une intervention précise » / « J'ai un projet » (textes exacts), zone d'intervention (texte exact, aucun rayon kilométrique inventé), mention Fabien, CTA « Parler de mon projet ». **Aucun prix affiché** : « Sur devis, après qualification de votre besoin » (§15).
- **Déroulement** : section volontairement légère, ne répète ni les douze noms d'offres ni le catalogue terrain (§7-8), montre uniquement la liberté de parcours et les passerelles.
- **Preuves et réalisations** : trois études de cas réelles (contenu et photos identiques à l'ancienne page `/realisations`), témoignages publiés réels (section absente si aucun), double pont vers l'accompagnement et vers le contact.
- **FAQ** : neuf questions/réponses reprises mot pour mot de `07-FAQ.md`, accordéon accessible.
- **CTA final** : symétrie voulue avec le Hero (mêmes trois voies), trois destinations différentes, sortie secondaire « Vous hésitez encore ? ».

**Aucune nouvelle offre, aucun prix inventé, aucune règle commerciale modifiée** : `lib/prestations-packs.ts` n'a pas été touché, seul son usage a été déplacé/réorganisé dans la nouvelle page.

---

# Parcours

Les trois logiques restent immédiatement lisibles à trois endroits symétriques de la page (Hero implicite → Trois façons d'avancer → CTA final), exactement comme le veut `01-HERO-PARCOURS.md` §15 (« les trois choix sont de même niveau conceptuel »italique) :

- Aucun quatrième niveau introduit.
- Aucun nom commercial (Amarrage/Cap/Passerelle/Grand Large...) n'apparaît dans les zones d'orientation (Hero, Trois façons d'avancer, Déroulement, CTA final) — ces noms n'apparaissent que là où le CDC les autorise explicitement : dans le détail d'On fait ensemble, une fois l'univers choisi.
- La page ne devient à aucun moment une grille de packs : les paliers ne sont visibles qu'après avoir choisi la section « On fait ensemble » et un univers, jamais en première interface.

---

# Univers

**Décision retenue : option B (sections dédiées de Services), pas de pages dédiées `/bateau` /`/van` /`/camping-car`.**

Justification, conforme à l'instruction de la mission (« si les pages dédiées sont prévues et suffisamment spécifiées, les créer ; sinon, utiliser les sections Services ») :
- Aucun fichier `univers/01-BATEAU.md`, `02-VAN.md`, `03-CAMPING-CAR.md` n'existe dans `docs/refonte-site-public/` (recherche confirmée, dossier absent).
- `home/02-TROIS-UNIVERS.md` §17 indique lui-même que « leur conception viendra après la définition des fondations prioritaires de la Home » — ce n'est donc pas une simple omission, c'est une séquence explicitement différée par le CDC lui-même.
- Créer trois pages complètes sans spécification (contenu, structure, textes validés) aurait signifié inventer un contenu commercial et éditorial non validé — explicitement interdit par la mission.

**Mise en œuvre** : chaque univers dispose désormais d'une **destination distincte et fonctionnelle** au sein de `/prestations` :
- Les sections « On fait ensemble » et « Je confie » contiennent chacune un sélecteur Bateau/Van/Camping-car.
- Un paramètre d'URL (`?univers=bateau|van|camping-car`) pré-sélectionne le bon onglet dans les deux sections au chargement de la page — mécanisme explicitement autorisé (non obligatoire) par `03-ON-FAIT-ENSEMBLE.md` §25 (« `/services?univers=bateau` ... ce comportement n'est pas obligatoire ... et ne doit pas complexifier inutilement la refonte »). Implémentation minimale : lecture de `searchParams` dans `app/prestations/page.tsx`, transmise en `initialCategory` aux deux sélecteurs.

Les trois cartes de la Home pointent donc désormais vers :
- Bateau → `/prestations?univers=bateau`
- Van → `/prestations?univers=van`
- Camping-car → `/prestations?univers=camping-car`

Ce ne sont plus trois liens identiques vers `/prestations` (état temporaire de la Phase UI-3, résolu ici).

---

# Ancres et destinations

Ancres réellement créées sur `/prestations` (`id` posé sur la `<section>` correspondante, `scroll-mt-16` pour compenser le Header sticky) :

| Ancre | Section | Consommée par |
|---|---|---|
| `#parcours` | Trois façons d'avancer | Hero (CTA « Choisir comment avancer ») |
| `#on-fait-ensemble` | On fait ensemble | Trois façons d'avancer, CTA final, pont depuis Preuves, **Home** (`Parcours.tsx`, `Accompagnement.tsx`) |
| `#je-confie` | Je confie | Trois façons d'avancer, **Home** (`Parcours.tsx`) |
| `#preuves` | Preuves et réalisations | CTA de Je confie (« Voir les réalisations ») |

**Anciennes ancres jamais fonctionnelles, remplacées** : `#accompagnement-distance` et `#prestations-terrain` (utilisées par l'ancienne page et par la Home avant cette phase) ne pointaient vers aucun `id` réel — vérifié lors de l'audit initial (`grep` sur l'ancienne page : seul `id="contact"` existait). Elles ont été remplacées par `#on-fait-ensemble` et `#je-confie`, désormais réels.

**Références résiduelles hors périmètre, non corrigées** : ces deux anciennes ancres inexistantes sont encore référencées dans des fichiers explicitement hors périmètre de cette mission (`app/outils/page.tsx`, `app/formations/page.tsx`, `app/realisations/page.tsx`, `app/boutique/[slug]/page.tsx`, `app/installation-12v-bateau/page.tsx`, `components/FaqEbook.tsx`, `components/cart/CartDrawer.tsx`) — la mission interdit explicitement de toucher Outils, Boutique et Les bases, et ces fichiers ne font pas partie de Services ni de la Home. Ce n'est pas une régression introduite par cette phase (ces liens ne pointaient déjà vers rien de précis avant), mais un point à traiter lors d'une future phase touchant ces pages.

---

# Modifications de la Home

Trois fichiers `components/home/*.tsx` modifiés, uniquement pour corriger des destinations — **aucun contenu, texte ou structure de section changé** :

- **`TroisUnivers.tsx`** : chaque tuile univers a désormais son propre `href` (`?univers=...`) au lieu d'une constante unique `UNIVERS_TEMP_HREF`.
- **`Parcours.tsx`** : CTA « Voir l'accompagnement » → `/prestations#on-fait-ensemble` (au lieu de `/prestations` sans ancre) ; CTA « Voir les interventions » → `/prestations#je-confie`.
- **`Accompagnement.tsx`** : CTA « Découvrir l'accompagnement » → `/prestations#on-fait-ensemble`.

`CtaFinal.tsx` (Home) n'a pas été modifié : son lien « Voir les services » pointe vers `/prestations` sans ancre, ce qui reste correct — le CDC de cette section (`home/10-CTA-FINAL.md`) ne demande pas d'ancre précise.

---

# Responsive

Vérifié par lecture de code et par un rendu serveur réel (serveur de développement, requêtes HTTP réelles : `/prestations` → 200, `/prestations?univers=bateau` → 200, toutes les sections présentes dans le HTML généré). Comme pour UI-2/UI-3, **aucun outil de capture visuelle par navigateur n'est configuré** dans ce dépôt — limite assumée.

- Toutes les sections utilisent `Container`/`Section` (largeur maîtrisée, aucun étirement sur grand écran).
- « Trois façons d'avancer » : `grid sm:grid-cols-3` — empilé sur mobile, pas de carrousel.
- Sélecteurs d'univers (On fait ensemble, Je confie) : `flex flex-wrap gap-2` — les boutons d'onglet passent naturellement à la ligne sur petit écran, aucun défilement horizontal forcé.
- « Preuves » : `grid sm:grid-cols-2 lg:grid-cols-3` — empilé sur mobile, images en `aspect-[4/3]` responsive via `next/image` + `fill`.
- FAQ : accordéon pleine largeur, boutons `w-full`, zones tactiles confortables.
- CTA final Services : `grid sm:grid-cols-3` → empilé sur mobile.
- Aucun `overflow-x` introduit, aucune largeur fixe en pixels sur du contenu.

---

# Accessibilité

- **Hiérarchie de titres** : un seul `<h1>` (Hero, via `PageHero`), un `<h2>` par section, cohérent du haut vers le bas — vérifié section par section.
- **Sélecteurs d'univers** : `role="tablist"`/`role="tab"`/`aria-selected` (déjà le patron existant de `PrestationsDistanceOffers`, repris à l'identique dans le nouveau `JeConfieUnivers`) — utilisables au clavier, état sélectionné jamais porté par la seule couleur (fond + bordure + texte).
- **FAQ** : boutons réels (`<button>`), `aria-expanded`, `aria-controls`/`id` associant chaque question à sa réponse (`role="region"` + `aria-labelledby`), conforme à `07-FAQ.md` §21.
- **Focus visible** : tous les CTA (`Button`, UI-1) et tous les onglets portent `focus-visible:outline`.
- **Zone d'intervention** : utilise `Alert` (UI-1), qui porte un titre textuel explicite — jamais une information portée uniquement par une couleur.
- **Contraste** : sections sombres (On fait ensemble, CTA final) en texte blanc/`neutral-400` sur `neutral-950`, jaune réservé aux accents et CTA (jamais de texte de paragraphe en jaune).
- **Ancre + Header sticky** : chaque section ciblée par une ancre porte `scroll-mt-16`, pour que le contenu ne soit pas caché sous le Header sticky après un clic d'ancre (point explicitement demandé par `01-HERO-PARCOURS.md` §21 : « scroll d'ancre compatible avec le Header sticky »).
- **Photos des réalisations** : texte alternatif descriptif du contenu réel visible (jamais `alt="photo"` générique), conforme à `06-PREUVES-ET-REALISATIONS.md` §30.

---

# Performance

- **Composants serveur par défaut** : `OnFaitEnsemble`, `JeConfie`, `Deroulement`, `Preuves`, `TroisFacons`, `ServicesCtaFinal` sont tous des composants serveur (pas de `"use client"`). Seuls deux composants client existent, tous deux strictement nécessaires à une interaction réelle : `PrestationsDistanceOffers` (déjà en production avant cette phase, ajout au panier) et le nouveau `JeConfieUnivers` (bascule d'onglet univers, sans logique de prix).
- **`next/image`** partout où une photo est affichée (Hero via `PageHero`, réalisations), avec `loading="lazy"` hors above-the-fold — seule l'image du Hero (déjà gérée par `PageHero`) est chargée en priorité.
- **`export const dynamic = "force-dynamic"`** sur `/prestations` : nécessaire car la page lit le catalogue réel (prix, disponibilité des packs) et les témoignages publiés à chaque requête — cohérent avec la convention déjà utilisée par `/boutique` et la Home (UI-3).
- **Aucune nouvelle dépendance** ajoutée.
- **Suppression de code mort** issu directement de cette refonte : `components/prestations/PrestationsSectionTabs.tsx` (implémentait le sélecteur « À distance / Sur place » que le CDC demande explicitement de supprimer, §20 de `00-SERVICES-ARCHITECTURE.md`) et `components/FaqPrestations.tsx` (ancienne FAQ, remplacée par les neuf questions validées) sont devenus orphelins après la réécriture de la page et ont été supprimés plutôt que laissés inertes.

---

# Visuels nécessaires

Conformément à l'instruction de ne jamais utiliser de placeholder :

1. **Photo professionnelle réelle de Fabien en situation technique** — section Je confie (`04-JE-CONFIE.md` §19 : « une photo professionnelle réelle en situation technique peut être utilisée »). Aucune photo de Fabien n'existe dans ce dépôt (recherche exhaustive dans `public/` : zéro résultat). En attendant, la zone « Fabien — FabSystem » reste en texte seul (« J'interviens personnellement sur votre installation. »), sans photo — conforme à l'instruction de ne jamais inventer un visuel, cette zone reste donc volontairement sobre plutôt que d'utiliser une image générique.
2. **Photographie technique du Hero** — non requise : `01-HERO-PARCOURS.md` §6 autorise explicitement de conserver la photo déjà utilisée sur le site (« la photo déjà utilisée sur le site peut être conservée si elle fonctionne avec la nouvelle composition ») ; `/hero-fabsystem.png` a été réutilisée telle quelle, aucune nouvelle photo nécessaire.
3. **Photo Van pour une éventuelle future page dédiée `/van`** — non requise pour cette phase (aucune page dédiée créée, voir Univers), mais reste un besoin identifié en amont pour une phase future si l'option A (pages dédiées) est un jour retenue. Non dupliqué ici : déjà signalé dans `docs/audits/UI-3-HOME.md`.

**Volta** : conformément à la règle de marque rappelée par la mission (élément secondaire, jamais en visuel principal) et à `services/00-SERVICES-ARCHITECTURE.md` §18 (« Volta n'est pas obligatoire sur Services... la Home reste son principal usage de marque »), **Volta n'apparaît nulle part sur cette page** — aucun clin d'œil pédagogique n'a été ajouté, faute de fonction précise justifiant sa présence dans une section déjà dense en informations commerciales. Ce choix est conforme à la mission (« elle peut éventuellement apparaître... si le CDC et la composition le justifient ») : ici, ni l'un ni l'autre ne le justifiait clairement, donc elle a été omise plutôt qu'ajoutée par défaut.

---

# Arbitrages

1. **Route canonique : `/prestations` conservée, pas de migration vers `/services`.** Les CDC utilisent systématiquement `/services` dans leurs textes (« Destination : `/services` avec ancre... »), mais aucun document ne dit explicitement « migrer la route actuelle `/prestations` vers `/services` » — c'est le nom du **dossier de documentation** (`docs/refonte-site-public/services/`), pas nécessairement une exigence de route technique. Conformément à l'instruction explicite de la mission (« si ce n'est pas explicitement tranché, conserver `/prestations` et documenter le point »), la route existante a été conservée. Migrer aurait nécessité une redirection 301, la mise à jour de tous les liens internes (Footer, Navbar, Home, `/boutique`, `/outils`, `/formations`, emails transactionnels éventuels) et un risque de régression SEO non justifié par une exigence claire.
2. **Écart entre les douze noms de la matrice CDC et les quatre paliers réellement vendus par univers.** `02-MATRICE-ACCOMPAGNEMENTS.md` valide douze noms distincts (Amarrage/Cap/Passerelle/Grand Large pour Bateau ; Départ/Itinéraire/Copilote/Roadbook pour Van ; Étape/Feuille de route/Relais/Carnet de route pour Camping-car). Le catalogue réel actuellement vendu (`lib/prestations-packs.ts`, déjà en production, prix réels, Stripe réel) utilise **les quatre mêmes noms (Amarrage/Cap/Passerelle/Grand Large) déclinés sur les trois univers**, jamais les huit noms spécifiques Van/Camping-car de la matrice. Renommer les produits réels pour coller à la matrice CDC aurait constitué une modification de règle commerciale et de catalogue — explicitement interdite par cette mission (« ne pas modifier les règles commerciales », « ne pas modifier... Prisma »). Choix retenu : réutiliser le catalogue réel tel quel, signaler cet écart ici plutôt que le corriger silencieusement dans un sens ou dans l'autre. Une décision commerciale explicite (harmoniser le catalogue avec la matrice, ou mettre à jour la matrice pour refléter le catalogue réel) reste nécessaire hors de cette phase.
3. **Pas de séparation visuelle entre « Commencez ici » (Amarrage seul) et les « trois destinations » (Cap/Passerelle/Grand Large)** dans la section On fait ensemble. Le CDC (`03-ON-FAIT-ENSEMBLE.md` §6, §22) décrit ces deux blocs comme visuellement distincts. Le composant réel réutilisé (`PrestationsDistanceOffers`) affiche les quatre paliers ensemble, dans une seule grille à quatre colonnes égales — c'est son comportement de production existant, non modifié pour ne pas dupliquer une logique déjà fonctionnelle et testée. Documenté ici plutôt que reconstruit : une évolution future pourrait scinder visuellement le premier palier des trois suivants directement dans ce composant partagé.
4. **`/realisations` non supprimée, aucune redirection créée.** `06-PREUVES-ET-REALISATIONS.md` §4 prévoit la sortie de cette page de l'architecture cible avec une redirection 301 vers Services. Cette action n'était pas un objectif numéroté explicite de la mission UI-4 (qui liste Services, Parcours, Ancres, Univers, Route canonique, Design, Photos, Responsive, A11y, Performance — pas la suppression de `/realisations`), et sa réalisation correcte impliquerait de vérifier/modifier des fichiers hors périmètre explicitement protégé (`app/vcard/page.tsx` la référence encore). Non traité ici, signalé pour une phase dédiée. La page reste fonctionnelle et n'est plus liée depuis la Home, le Header ou le Footer (déjà le cas depuis UI-2/UI-3).
5. **Ancres mortes résiduelles hors périmètre non corrigées** (`#accompagnement-distance`, `#prestations-terrain` encore référencées par Outils, Boutique, Les bases, formations, et une page SEO) — voir section Ancres et destinations. Non corrigées car cela impliquerait de modifier des fichiers explicitement protégés par la mission (« ne pas commencer Boutique/Les Bases/Outils »).
6. **Preuve terrain : réutilisation intégrale du contenu réel de `/realisations`, sans nouvelle réalisation ajoutée.** Le CDC autorise jusqu'à 6 réalisations ; seules 3 existent réellement avec un contenu validé (texte + photos). Conformément à `06-PREUVES-ET-REALISATIONS.md` §7 (« s'il n'existe que 3 ou 4 réalisations réellement publiables, afficher 3 ou 4 bonnes preuves plutôt que compléter avec du contenu faible »), aucune quatrième réalisation n'a été inventée pour atteindre un nombre rond.
7. **Validation responsive/accessibilité par revue de code et rendu HTML réel, pas par capture visuelle navigateur** — même limite déjà signalée en UI-2/UI-3 (aucun outil Playwright/Puppeteer disponible dans ce dépôt).

---

# Fin — UI-4-SERVICES-UNIVERS / FabSystem
