# UI-3-HOME — Refonte de la page d'accueil

**Date : 22/08/2026**
**Périmètre : uniquement la Home (`app/page.tsx` + `components/home/`). Header et Footer (UI-2) considérés définitifs et non modifiés. Aucune API, moteur, Dashboard ou espace client touché. Services, Boutique et Les bases non commencés (leurs pages existantes ne sont pas modifiées ; la Home s'y lie uniquement).**

**Documents lus** : `docs/masters/MASTER-12-DESIGN-SYSTEM.md`, `docs/refonte-site-public/00-CAHIER-DES-CHARGES-GLOBAL.md`, `docs/audits/UI-2-LAYOUT-PUBLIC.md`, et l'intégralité des CDC Home : `00-HOME-ARCHITECTURE.md`, `01-HEADER-HERO.md` (partie Hero), `02-TROIS-UNIVERS.md`, `03-PARCOURS.md`, `04-OUTILS-GRATUITS.md`, `05-LES-BASES-HOME.md` (v1.1, prioritaire sur `05-LES-BASES.md` v1.0), `06-ACCOMPAGNEMENT.md`, `07-BOUTIQUE.md`, `08-CONFIANCE.md`, `09-VOLTA.md`, `10-CTA-FINAL.md`, `11-FOOTER.md`.

---

# Sections implémentées

Ordre strictement conforme à `00-HOME-ARCHITECTURE.md` §5, aucune section supprimée ni fusionnée, chacune dans son propre composant sous `components/home/` :

| # | Section | Composant | Statut |
|---|---|---|---|
| 1 | Header | `components/Navbar.tsx` (UI-2, inchangé) | Réutilisé tel quel |
| 2 | Hero | `Hero.tsx` | Implémenté |
| 3 | Bateau, van ou camping-car | `TroisUnivers.tsx` | Implémenté (voir Arbitrages : destinations temporaires) |
| 4 | Comment souhaitez-vous avancer ? | `Parcours.tsx` | Implémenté |
| 5 | Outils gratuits | `OutilsGratuits.tsx` | Implémenté |
| 6 | Les bases | `LesBases.tsx` | Implémenté |
| 7 | Vous faites. Je vous accompagne. | `Accompagnement.tsx` | Implémenté |
| 8 | Des ressources pour aller plus loin | `Boutique.tsx` | Implémenté |
| 9 | Des conseils ancrés dans le réel | `Confiance.tsx` | Implémenté, **conditionnelle** |
| 10 | CTA final | `CtaFinal.tsx` | Implémenté |
| 11 | Footer | `components/Footer.tsx` (UI-2, inchangé) | Réutilisé tel quel |

**Hero** (`01-HEADER-HERO.md` §10-16) : titre, texte et les deux CTA repris mot pour mot, aucun texte ni bouton ajouté. Composition ~50/50 desktop (`Container size="wide"` + `grid lg:grid-cols-2`), photo réelle déjà utilisée sur le site (`/hero-fabsystem.png`, « conservée provisoirement » comme l'exige le CDC — non remplacée). Pas de `100vh` imposé, pas de Volta.

**Trois univers** (`02-TROIS-UNIVERS.md`) : exactement Bateau / Van / Camping-car, zones entièrement cliquables (tout le bloc est un `<Link>`, pas seulement le texte « Découvrir »), pas de carrousel mobile (grille empilée), pas de grille de petites cartes SaaS génériques (grandes zones photographiques/dark). **Écart signalé** : les pages dédiées `/bateau`, `/van`, `/camping-car` n'existent pas dans ce dépôt (hors périmètre de cette phase Home) — voir Arbitrages pour la destination temporaire retenue.

**Parcours** (`03-PARCOURS.md`) : exactement trois niveaux (Je fais seul / On fait ensemble / Je confie), aucun nom commercial de pack, progression horizontale desktop (connecteur discret) / verticale mobile, ancre `#parcours` ciblée par le CTA du Hero. CTA de chaque étape conformes à la liste recommandée du CDC.

**Outils gratuits** (`04-OUTILS-GRATUITS.md`) : uniquement des outils réellement actifs aujourd'hui (mêmes routes/ancres que `/outils`), aucun outil « schéma électrique » affiché puisqu'il n'existe pas encore, CTA final unique « Voir tous les outils → » vers `/outils`. Utilise `Card`/`Badge` (UI-1), légitime ici selon le CDC lui-même (§10 : « les cartes sont légitimes dans cette section »).

**Les bases** (`05-LES-BASES-HOME.md` v1.1) : composition asymétrique (Les bases en élément principal, un ebook réel en complément), pas de grille uniforme de trois cartes, brique « Ressources » **absente** car aucun contenu réel de ce type n'existe encore (§6, respecté à la lettre). L'ebook est lu dynamiquement dans le catalogue réel (`lib/services/catalog`), jamais inventé ; la section s'adapte automatiquement si aucun ebook actif n'existe (pas de bloc ebook affiché).

**Accompagnement** (`06-ACCOMPAGNEMENT.md`) : titre et texte repris mot pour mot, trois notions Préparer/Vérifier/Débloquer, un seul CTA principal, aucun prix, aucun pack commercial nommé, contenu prioritaire sur mobile (ordre DOM : contenu puis visuel). Volta **non intégrée** — voir Visuels nécessaires.

**Boutique** (`07-BOUTIQUE.md`) : un produit vedette réel mis en avant, jusqu'à deux produits secondaires si le catalogue en compte davantage (jamais de faux produit, jamais de symétrie forcée), prix réels lus dynamiquement, CTA final « Voir toute la boutique → ». Si le catalogue actif est vide, un état minimal sans faux produit est affiché plutôt qu'une section vide silencieuse.

**Confiance** (`08-CONFIANCE.md`) : composant strictement conditionnel — lit les témoignages publiés réels (`listPublishedTestimonials`) et **ne rend rien du tout** (`return null`) si aucun n'existe, conformément à « ne pas afficher la section » (§9). Vérifié par le test de rendu : au moment de cette phase, la base ne contient aucun témoignage publié, et la section est bien absente du HTML généré (aucune trace de placeholder « Bientôt ici »). C'est un composant volontairement distinct de `components/TestimonialsSection.tsx` (utilisé sur `/prestations`, qui affiche un état vide par design pour cette page-là — comportement différent, légitime pour `/prestations` mais non conforme à la règle spécifique de la Home).

**CTA final** (`10-CTA-FINAL.md`) : titre, texte et les deux CTA repris mot pour mot, aucune photo, aucune Volta, aucun formulaire intégré, bloc sombre distinct du Footer par sa structure et une bordure (pas de fusion visuelle en masse noire indifférenciée).

**Volta** (`09-VOLTA.md`) : conformément à la décision de gouvernance (« il n'existe pas de section autonome Volta »), aucune section dédiée n'a été créée. Son unique emplacement éligible (Accompagnement) reste sans son illustration faute d'asset officiel disponible dans ce dépôt — voir Visuels nécessaires. Elle n'apparaît nulle part ailleurs (Hero, Header, Footer, CTA final), conforme aux interdictions explicites.

---

# Responsive

Vérifié par lecture de code (classes Tailwind responsive) et par un test de rendu réel (serveur de développement démarré, page d'accueil récupérée par requête HTTP réelle : statut 200, tous les titres de section présents dans le HTML généré, aucune trace d'erreur de rendu). **Aucun outil de capture visuelle par navigateur n'est configuré dans ce dépôt** (ni Playwright ni Puppeteer) — comme en UI-2, cette validation reste une revue de code et de rendu HTML, pas une vérification pixel par viewport ; limite assumée et transparente.

- **Hero** : `grid` sans colonnes explicites en mobile (empilement naturel : titre → texte → CTA principal → CTA secondaire → photo, exactement l'ordre exigé par `01-HEADER-HERO.md` §14) → `lg:grid-cols-2` à partir de 1024 px.
- **Trois univers** : `grid gap-4 sm:grid-cols-3` — empilé verticalement sur mobile, pas de carrousel (interdiction explicite du CDC), zones tactiles pleine largeur.
- **Parcours** : `grid gap-8 lg:grid-cols-3` — vertical sur mobile avec espacement généreux, connecteur horizontal uniquement affiché `lg:block` (invisible en dessous, pas de résidu visuel cassé).
- **Outils gratuits** : `grid gap-4 lg:grid-cols-3` avec l'outil vedette en `lg:col-span-2` — sur mobile, empilement naturel outil vedette puis grille 2 colonnes des outils secondaires (`sm:grid-cols-2`).
- **Les bases / Boutique** : `grid lg:grid-cols-[...]` à une colonne implicite en dessous de `lg`, ordre DOM déjà correct (bloc principal avant complément).
- **Accompagnement** : `order-2 lg:order-1` / `order-1 lg:order-2` pour que le contenu précède le visuel sur mobile tout en gardant visuel-gauche/contenu-droite sur desktop, conforme à `06-ACCOMPAGNEMENT.md` §6.
- **CTA final** : `flex-col sm:flex-row`, bouton principal en pleine largeur sur mobile (`w-full sm:w-auto`), conforme à `10-CTA-FINAL.md` §9.
- Toutes les sections utilisent `Container`/`Section` (UI-2), garantissant une largeur maximale cohérente sur très grand écran (`max-w-6xl` ou `max-w-7xl` selon la section) — aucun étirement artificiel constaté par lecture de code.
- Aucun `overflow-x` introduit, aucune largeur arbitraire fixe en pixels sur du contenu (seules des tailles d'image `width`/`height` proportionnées via `next/image`).

---

# Accessibilité

- **Trois univers** : chaque bloc est un unique `<Link>` avec un `aria-label` explicite combinant nom + description + « Découvrir » (évite un nom accessible tronqué ou ambigu) ; la photographie (quand elle existe) porte `alt=""` car l'information est déjà portée par le lien lui-même — évite une double annonce redondante en lecture d'écran, conforme à `02-TROIS-UNIVERS.md` §14.
- **Focus visible** : tous les liens/CTA de la Home portent soit la classe du composant `Button` (UI-1, déjà `focus-visible:outline`), soit un `focus-visible:outline` explicite ajouté à la main sur les liens texte (Parcours, Outils secondaires, Boutique secondaire, CTA final secondaire) — aucun élément interactif sans traitement de focus.
- **Contraste** : texte blanc sur `bg-neutral-950`/`bg-neutral-900` (Trois univers sans photo, CTA final) ; jaune `brand-400` utilisé uniquement pour de petits éléments (numéro Parcours, flèche « Découvrir », CTA principal avec texte sombre dessus) jamais pour du texte de paragraphe — conforme à MASTER-12 §90/§213.
- **Couleur non exclusive** : l'état/l'information n'est jamais porté uniquement par une couleur — chaque CTA et chaque tag (`Badge`) est toujours accompagné d'un texte.
- **Structure de titres** : un seul `<h1>` (Hero), chaque section suivante utilise un `<h2>` unique, hiérarchie cohérente du haut vers le bas de page — aucun niveau sauté, aucune section sans titre.
- **Témoignage (Confiance)** : `<blockquote>` sémantique, attribution du nom et du contexte en texte lisible (jamais une information portée uniquement par une image).
- **Ordre de lecture logique** : vérifié section par section — l'ordre DOM correspond à l'ordre de lecture voulu y compris quand l'ordre visuel diffère sur desktop (Accompagnement utilise `order-*` uniquement pour l'inversion visuelle desktop, jamais pour modifier l'ordre de tabulation clavier de façon incohérente avec le contenu).
- **Zones tactiles** : tous les CTA utilisent `h-10` minimum (`Button`, UI-1) ou un padding généreux (liens texte « Découvrir », « Voir... ») — cohérent avec MASTER-12 §30.

---

# Performance

- **Images** : toutes les photographies passent par `next/image` (`fill` avec `sizes` adapté pour les visuels pleine largeur/colonne, `width`/`height` explicites pour les couvertures de produits). Aucune balise `<img>` brute introduite.
- **Lazy loading ciblé** : seule l'image du Hero porte `priority` (elle est visible immédiately au chargement, au-dessus de la ligne de flottaison) ; les photographies plus bas dans la page (Trois univers, Accompagnement, Confiance) portent `loading="lazy"` ou héritent du comportement paresseux par défaut de `next/image` (jamais chargées avant d'être nécessaires).
- **Composants serveur par défaut** : `Hero`, `TroisUnivers`, `Parcours`, `OutilsGratuits`, `CtaFinal` sont des composants serveur purs (pas de `"use client"`) — aucun JavaScript client n'est expédié pour ces sections. Seuls `LesBases`, `Boutique` et `Confiance` sont des composants serveur **asynchrones** (lecture base de données), toujours sans `"use client"` : leur coût est un aller-retour base de données au rendu serveur, jamais du JavaScript supplémentaire envoyé au navigateur.
- **Aucun composant client ajouté** à la Home dans cette phase — le seul composant client de la page reste le Header (`Navbar.tsx`, déjà `"use client"` avant cette phase, UI-2).
- **Une seule page dynamique** (`export const dynamic = "force-dynamic"`, cohérent avec la convention déjà utilisée par `/boutique`) : nécessaire car le catalogue (Boutique, Les bases) et les témoignages (Confiance) doivent toujours refléter l'état réel de la base, jamais un rendu figé au build — c'est un choix de fraîcheur des données, pas une régression de performance : les autres pages statiques du site (formations, mentions légales...) ne sont pas affectées.
- **Aucune nouvelle dépendance** : toutes les icônes/flèches sont du texte ou des caractères Unicode simples (`→`), aucune librairie ajoutée.

---

# Visuels nécessaires

Conformément à l'instruction de ne jamais utiliser de placeholder, voici précisément ce qui manque pour que la Home soit visuellement complète — à produire avant une prochaine itération, pas intégré maintenant :

1. **Photographie réelle de van aménagé** — section Trois univers. Aucune photo de van n'existe dans ce dépôt (`public/` ne contient que des photos liées à des bateaux). En attendant, le bloc « Van » utilise un traitement typographique sombre sans photo plutôt qu'une image générique ou une photo de stock (interdites par `02-TROIS-UNIVERS.md` §9). Format cible : paysage, cadrage cohérent avec `/fab-bateau.png` (même traitement que le bloc Bateau), thème « installation électrique van aménagé ».
2. **Photographie réelle de camping-car** — même besoin, même raison, section Trois univers, bloc « Camping-car ».
3. **Illustration Volta officielle** — section Accompagnement (« Vous faites. Je vous accompagne. »), seul emplacement éligible sur la Home selon `09-VOLTA.md`. **Aucun fichier Volta n'existe dans ce dépôt** (recherche exhaustive dans `public/` et l'ensemble du code : zéro résultat). Ce visuel n'est **pas** une tâche DALL·E générique : le CDC interdit explicitement de « générer une nouvelle interprétation graphique arbitraire de Volta » et exige le respect strict d'« une bibliothèque visuelle déjà validée » — bibliothèque qui doit exister en dehors de ce dépôt de code (chez Fabien / dans les assets de marque). Fabien doit fournir l'asset officiel (pose cohérente avec « diagnostic à distance, explication de schéma, accompagnement technique », voir `09-VOLTA.md` §5) pour qu'il soit intégré à la place du visuel photographique de remplacement actuellement utilisé dans `Accompagnement.tsx`.

**Non requis pour cette phase** : les photographies déjà utilisées (Hero, Bateau, Accompagnement, Confiance) sont réelles et déjà présentes dans `public/` — aucune génération nécessaire pour elles.

---

# Arbitrages

1. **Destinations temporaires pour les trois univers.** `02-TROIS-UNIVERS.md` exige des pages dédiées `/bateau`, `/van`, `/camping-car`, qui n'existent pas dans ce dépôt et sont explicitement hors périmètre de cette phase (Home uniquement, « ne pas commencer Services/Boutique/Les Bases » — les pages univers n'y figurent pas non plus). Le CDC lui-même prévoit ce cas (§15 : signaler le manque, appliquer une solution temporaire). Faute de validation interactive possible dans ce flux de travail autonome, la solution la plus conservatrice a été retenue : les trois blocs mènent vers `/prestations`, la seule page publique réelle couvrant déjà les trois univers, plutôt que vers un lien mort ou une page vide créée pour l'occasion. **Ce point doit être revu dès que les pages univers existeront** — il s'agit du plus grand écart fonctionnel de cette phase avec la cible finale.
2. **CTA « On fait ensemble » et « Je confie » (Parcours), « Découvrir l'accompagnement » (Accompagnement) et « Voir les services » (CTA final) pointent vers `/prestations` sans ancre.** Les CDC recommandent des ancres (`#accompagnement-distance`, `#prestations-terrain`) ou une route `/services` : aucune des deux n'existe dans la page `/prestations` actuelle (vérifié : seul `id="contact"` y est présent) ni dans le routage du site (`/services` n'existe pas, seul `/prestations` existe). Utiliser ces destinations telles quelles aurait créé un lien mort ou un fragment d'ancre non fonctionnel. Choix retenu : pointer vers `/prestations` tel quel (destination réelle et fonctionnelle), sans fragment inventé — cohérent avec l'interdiction explicite de « destination temporaire inventée sans validation » (mieux vaut une page entière correcte qu'une ancre qui ne scrolle nulle part). À corriger lorsque la refonte de Services (hors périmètre ici) ajoutera ces ancres ou lorsque la route canonique sera clarifiée.
3. **Volta omise de la section Accompagnement, remplacée par une photographie réelle.** `06-ACCOMPAGNEMENT.md` indique que Volta est « éligible » pour cette section mais que sa présence n'y est « pas verrouillée » — ce n'est pas une obligation. Faute d'asset officiel disponible (voir Visuels nécessaires), l'intégrer aurait signifié soit inventer une interprétation graphique (interdit explicitement par `09-VOLTA.md` §12), soit utiliser un placeholder (interdit par cette mission). Une vraie photographie d'installation a été utilisée à la place, une option explicitement recommandée en premier dans la liste du CDC (§11 : « photographie réelle » est cité avant Volta comme piste de visuel).
4. **Ancien contenu de la Home (parcours « 4 niveaux », section « Marques et équipements utilisés ») retiré, pas migré.** Ces deux blocs existaient dans la version précédente de `app/page.tsx` mais n'apparaissent nulle part dans l'architecture validée `00-HOME-ARCHITECTURE.md` (qui liste exactement 10 sections visibles, sans section partenaires/marques ni parcours à quatre niveaux — remplacé par le parcours à trois niveaux du CDC). Conformément à « implémenter la nouvelle Home conformément aux CDC », ce contenu n'a pas été reporté : la Home V2 est une refonte complète de la page, pas un ajout au-dessus de l'ancienne. Le contenu des logos partenaires n'est pas perdu techniquement (historique Git), simplement absent de la Home tant qu'une décision explicite ne le réintègre pas.
5. **Section Boutique affichée avec un état minimal (pas totalement masquée) si le catalogue actif est vide.** `07-BOUTIQUE.md` ne précise pas explicitement ce cas (contrairement à Confiance, où le CDC est explicite sur le masquage total). Choix retenu : afficher le titre de section + un texte factuel (« catalogue en cours de préparation ») + le CTA vers `/boutique`, plutôt que masquer toute la section ou inventer un produit — cohérent avec MASTER-12 §73 (« état vide doit expliquer clairement ») et §128 (jamais de contenu inventé). Au moment de cette phase, le catalogue contient au moins un produit réel actif, donc ce cas ne s'est pas produit en pratique lors du test de rendu, mais le code doit rester correct si le catalogue venait à se vider.
6. **Validation responsive/accessibilité par revue de code et rendu HTML réel, pas par capture visuelle navigateur** — même limite that déjà signalée en UI-2 (aucun outil Playwright/Puppeteer disponible dans ce dépôt). Un rendu serveur réel a été vérifié (statut 200, présence de tous les titres de section, absence d'erreur, données réelles — prix, témoignages — correctement branchées), mais aucune vérification pixel par viewport n'a été effectuée.

---

# Fin — UI-3-HOME / FabSystem
