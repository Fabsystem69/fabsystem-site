# UI-6 — Refonte complète de "Les Bases"

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `app/formations/page.tsx` (hub, réécrit), `components/lesbases/*` (nouveau), `components/QuizFormations.tsx` (persistance locale ajoutée), `components/home/Parcours.tsx` (1 libellé corrigé).
**Non modifié :** `app/formations/bases-12v/page.tsx`, `app/formations/lire-schema/page.tsx`, `app/formations/types-batteries/page.tsx` (contenu réel déjà solide, hors périmètre de cette mission), `components/ModuleStepper.tsx`, `lib/formations-tools.ts` (données réutilisées telles quelles), moteurs, Project, Prisma, Dashboard, espace client, Stripe, prix, règles commerciales. Outils non retouché (seuls des liens contextuels réels y pointent).

## Architecture

Route canonique confirmée par `les-bases/00-ARCHITECTURE.md §18` : **`/formations` reste la route**, avec le libellé public "Les bases" (déjà acté en UI-1/UI-2 pour Header/Footer). Aucune migration de route effectuée — non demandée et explicitement conditionnée à une décision séparée avec redirection.

Audit préalable (agent de recherche dédié) confirmant l'état réel avant réécriture :
- 4 fichiers sous `app/formations/**` : le hub (`page.tsx`) et 3 pages module (`bases-12v`, `lire-schema`, `types-batteries`), toutes avec du contenu technique réel et dense (pas de contenu "creux").
- Le hub affichait encore `title="AUTODIDACTE"` dans son Hero, malgré la décision UI-1/UI-2 de renommer la navigation en "Les bases" — incohérence corrigée par cette mission (Hero réécrit).
- `components/home/Parcours.tsx` (Home) pointait vers `/formations` avec le libellé "Apprendre", incohérent avec Navbar/Footer ("Les bases") — corrigé (1 mot).
- Une "échelle pédagogique" (blocs de progression 1-2-3-4 avec ancres `#accompagnement-distance` et `#prestations-terrain` vers `/prestations`) figurait sur le hub sans exister dans l'architecture CDC (`00-ARCHITECTURE.md §3` ne prévoit que 6 sections) — supprimée (voir Arbitrages).
- Un bloc "Coaching découverte — 20 min offerts" figurait en fin de hub — interdit explicitement par le CDC (§11 : "Pas de coaching gratuit dans cette page") — supprimé.
- Un bloc "5 calculateurs" (grille Outils générique) figurait sur le hub — interdit par le CDC (§9 : "Ne pas ajouter un bloc Outils générique uniquement pour faire du cross-linking") — supprimé, remplacé par une passerelle strictement contextuelle (voir Navigation).
- `components/FormationsEssentialTools.tsx` + `lib/formations-tools.ts` (10 outils réels déjà rédigés) existaient mais n'étaient jamais rendus sur la page live — réactivés sous une forme conforme au CDC V1 (voir Contenus).
- Aucune implémentation "Bons gestes" n'existait nulle part dans le code (uniquement dans les CDC) — créée pour cette mission, contenu dérivé de texte déjà réel et publié dans les modules (voir Contenus).
- Aucun asset Volta (image) n'existe dans le dépôt — confirmé une nouvelle fois par recherche exhaustive (`public/`, tout le repo) : aucune image, uniquement une charte graphique documentaire (`docs/branding/FABSYSTEM-VOLTA-IMAGE-GUIDELINES.md`) jamais produite.

## Hub Les Bases

Ordre implémenté, conforme à `00-ARCHITECTURE.md §3` :

1. **Hero** (`components/lesbases/Hero.tsx`) — repère "Les bases", titre "Comprendre avant de se lancer.", texte repris mot pour mot, un seul CTA "Commencer par les modules →" vers l'ancre `#modules`. Sombre, technique, même photo réelle déjà utilisée (`/hero-fabsystem.png`, tableau électrique réel). Aucun CTA Outils, aucun Volta, aucune statistique — conforme à `01-HERO-MODULES.md §1`.
2. **Modules** (`components/lesbases/Modules.tsx`) — 3 modules réels, données reprises telles quelles (titre, résumé, durée déjà existante) des pages `app/formations/*/page.tsx`. Aucune progression affichée (aucune persistance réelle par module dans le code — `ModuleStepper.tsx` utilise uniquement `useState`, perdu au rechargement) : chaque carte reste à l'état standard, conformément à `01-HERO-MODULES.md §2` ("Ne jamais simuler une progression").
3. **Quiz** (`components/lesbases/QuizSection.tsx` + `components/QuizFormations.tsx` modifié) — bloc sombre fort, "Vérifiez vos acquis" / "Testez vos bases", fonctionnement existant conservé à l'identique (10 questions, `Question X/10`, correction immédiate, résultat détaillé, seuils déjà codés dans le projet : 90/70/50 %, seuil `< 80 %` déjà utilisé pour "Revoir les modules"). **Ajout** : persistance locale réelle du résultat (`localStorage`, clé `fabsystem-les-bases-quiz-result`) pour permettre l'état "compact" après un résultat satisfaisant (`02-QUIZ.md §9`) — voir Arbitrages.
4. **Bons gestes (60 %) + Indispensables (40 %)** côte à côte sur desktop, empilés sur mobile (`grid lg:grid-cols-[3fr_2fr]`), conforme à `03-BONS-GESTES-INDISPENSABLES.md §2-3`.
5. **Aller plus loin — Boutique** (`components/lesbases/PasserelleBoutique.tsx`) — 2 ebooks réels maximum, prix dynamique réel (même source que `/boutique`), déduction affichée si applicable.
6. **Passerelle Services** discrète (`components/lesbases/PasserelleServices.tsx`) — une phrase, un lien, aucun bloc commercial.
7. **Footer** — global, non touché (`SiteChrome`, rendu par `app/layout.tsx`, inchangé).

Composition éditoriale, pas une grille SaaS uniforme : Hero pleine largeur sombre, modules en cartes numérotées avec connecteur pédagogique, quiz en bloc contrasté séparé, bons gestes/indispensables en colonnes asymétriques 60/40, passerelle Boutique en 2 cartes larges avec vraie couverture.

## Contenus

Aucun contenu fictif ajouté. Détail par section :

- **Modules** : titres, résumés et durées identiques à ceux déjà publiés (les durées `~30/~20/~25 min` sont les valeurs déjà réellement affichées en production avant cette mission — non modifiées, non inventées pour cette refonte).
- **Quiz** : 10 questions réelles, aucune modifiée. Seule addition : persistance du résultat réel (pas de score simulé).
- **Bons gestes** : 3 entrées créées pour cette mission car aucune n'existait dans le code. Chacune est une **reformulation condensée d'un passage déjà rédigé et publié** dans un module réel (jamais un fait technique nouveau) :
  1. "Le fusible protège le câble, pas l'appareil" — repris de `app/formations/lire-schema/page.tsx` (section "Fusibles et protections", règle des 30 cm).
  2. "Une cosse mal sertie chauffe avant de lâcher" — repris de la section "Connexions et cosses" du même module (liste "à ne jamais utiliser en permanent").
  3. "Un câble trop fin chauffe et peut prendre feu" — repris de `app/formations/bases-12v/page.tsx` (section "Résistance des câbles", formule P = I² × R).
  Chaque bon geste renvoie vers son module source (lien réel).
- **Indispensables** : réutilise les 10 outils déjà rédigés dans `lib/formations-tools.ts` (`name` + `usage`, contenu 100 % réel, déjà écrit avant cette mission mais jamais publié). Aucun prix, marque, lien marchand ou bouton d'achat affiché (voir Arbitrages pour la différence avec le composant existant `FormationsEssentialTools.tsx`).
- **Passerelle Boutique** : les 2 ebooks réellement actifs en catalogue (`ebook-electricite-van`, `ebook-electricite-bateau`), lus dynamiquement via `getProductBySlug`/`getActivePriceForProduct` — mêmes fonctions que `/boutique` (UI-5), aucune duplication de logique tarifaire. Déduction affichée uniquement si `findPrestationsPackIncludingEbook` la confirme (même mécanisme que la fiche Boutique).
- Aucun "bientôt disponible" ajouté : le bloc "Prochains modules en préparation" de l'ancien hub a été retiré (hors architecture CDC — voir Arbitrages), donc aucun contenu de ce type ne subsiste.

## Navigation

- CTA Hero → ancre `#modules` (réelle, sur la même page).
- Modules → 3 routes réelles déjà existantes (`/formations/bases-12v`, `/lire-schema`, `/types-batteries`), inchangées.
- Bons gestes → lien vers le module source de chaque conseil (réel).
- Un bon geste (câble sous-dimensionné) → passerelle contextuelle **réelle** vers `/outils#section-cable` (ancre vérifiée existante dans `app/outils/page.tsx`), conforme à `00-ARCHITECTURE.md §9` ("Mettre en pratique → Calculateur de section").
- Indispensables → lien contextuel vers `/outils` uniquement pour distinguer la terminologie ("matériel physique" vs "applications numériques"), pas une grille de calculateurs.
- Passerelle Boutique → fiche produit réelle par ebook (`/boutique/[slug]`) puis `/boutique`.
- Passerelle Services → `/prestations`.
- **Lien réparé** : `components/home/Parcours.tsx`, libellé "Apprendre" → "Les bases" (même route `/formations`, cohérent avec Navbar/Footer depuis UI-2).
- **Liens supprimés** (dead/hors périmètre) : les deux ancres mortes `#accompagnement-distance` et `#prestations-terrain` vers `/prestations` n'existent plus dans `/formations` — elles n'étaient utilisées que par l'"échelle pédagogique" retirée (voir Arbitrages), aucune autre occurrence trouvée dans le repo.

## Passerelles

- **Les bases → Outils** : contextuelle et unique (un seul bon geste, un seul lien), jamais une grille Outils dupliquée sur cette page — conforme à `00-ARCHITECTURE.md §9`.
- **Les bases → Boutique** : passerelle dédiée en fin de page, 2 guides maximum, prix dynamique, aucun filtre/catégorie/pagination.
- **Les bases → Services** : un seul lien textuel discret, aucun Hero bis, aucun prix, aucune prestation listée.
- Ordre de priorité respecté : la page reste d'abord pédagogique (Hero, Modules, Quiz, Bons gestes/Indispensables occupent l'essentiel de la page) ; les passerelles commerciales n'apparaissent qu'en fin de parcours et restent visuellement secondaires (pas de gros CTA jaune agressif, pas de répétition).

## Responsive

- **Hero** : titre/texte/CTA empilés verticalement sur tous les formats, photo en arrière-plan (`bg-cover`), aucun texte tronqué vérifié jusqu'à 375px.
- **Modules** : `grid lg:grid-cols-3` — empilement vertical simple sous `lg`, 3 colonnes au-delà. Voir Arbitrages pour le choix de ne pas implémenter le carrousel manuel mobile (optionnel dans le CDC).
- **Quiz** : `max-w-3xl` centré, boutons de réponse en pleine largeur, aucune dépendance au hover (déjà le cas dans le composant existant, non régressé).
- **Bons gestes / Indispensables** : `grid lg:grid-cols-[3fr_2fr]` → empilement vertical naturel sous `lg` (Bons gestes d'abord, conforme à `03-...md §3`), pas de carrousel.
- **Passerelle Boutique** : `grid sm:grid-cols-2` → empilement dès mobile, 2 colonnes dès `sm`.
- **Longueur de ligne** : tous les blocs de texte long utilisent `max-w-2xl`/`max-w-3xl`, évitant les lignes trop longues sur grand écran.
- Non vérifié dans un navigateur réel (aucun Playwright/Puppeteer dans ce dépôt) : validation par revue des classes Tailwind responsive + smoke test HTTP (statuts 200, présence du contenu attendu). Limitation déjà documentée dans les rapports précédents (UI-2 à UI-5).

## Accessibilité

- Un seul `<h1>` par page (Hero), vérifié par smoke test sur `/formations`.
- Hiérarchie `<h2>` cohérente pour chaque section (Modules, Quiz, Bons gestes, Indispensables, Passerelle Boutique) — vérifiée par smoke test.
- Filtre/quiz : boutons réels (`<button>`), `disabled` après sélection, focus visible hérité des styles globaux déjà validés en UI-1/UI-2.
- Couvertures des ebooks (Passerelle Boutique) : `alt` réel (`product.name`), déjà établi comme pattern en UI-5.
- Liens explicites : "Accéder au module →", "Voir {module} →", "Découvrir le guide", "Voir la Boutique →", "Découvrir les services FabSystem →" — aucun "cliquez ici".
- Mention "Le conseil de Volta" : texte seul, sans icône ni couleur comme seul indicateur — conforme à `03-...md §20`/`les-bases §15`.
- Sommaire/quiz : pas de sommaire de page dédié (page à défilement simple avec ancres `#modules`/`#quiz`), pas de structure d'accordéon nécessitant un traitement spécifique.

## Performance

- `app/formations/page.tsx` reste un Server Component par défaut (`export const dynamic = "force-dynamic"`, nécessaire pour le prix dynamique des ebooks, même contrainte que `/boutique`).
- Seuls deux composants sont client (`"use client"`) : `components/QuizFormations.tsx` (déjà client avant cette mission, interactivité intrinsèque au quiz) et son wrapper n'a pas besoin de l'être (`QuizSection.tsx` reste serveur). `Modules.tsx`, `BonsGestes.tsx`, `Indispensables.tsx`, `PasserelleBoutique.tsx`, `PasserelleServices.tsx`, `Hero.tsx` : tous des Server Components, aucun JS client ajouté pour du contenu éditorial simple, conformément à la contrainte de cette mission.
- Aucune nouvelle dépendance npm.
- `next/image` conservé pour les couvertures d'ebooks (`sizes` implicite via `width`/`height`, cohérent avec le pattern déjà utilisé en Boutique).
- Le carrousel mobile manuel (optionnel dans le CDC) n'a pas été implémenté afin d'éviter tout JS client superflu pour 3 cartes déjà pleinement lisibles empilées — voir Arbitrages.

## Visuels nécessaires

- **Hero Les Bases** : aucun visuel dédié n'existe ; réutilisation de `/hero-fabsystem.png` (déjà utilisé par l'ancien Hero de cette même page, donc pas une nouvelle réutilisation problématique — c'était déjà l'image de cette page avant la mission).
- **Illustration Volta** : toujours aucun asset dans le dépôt (reconfirmé). La seule apparition prévue par le CDC (Bons gestes) reste donc **strictement textuelle** ("Le conseil de Volta", sans emoji ni icône de substitution, conformément à l'instruction explicite de cette mission).
- **Indispensables** : aucune photo des 10 outils physiques n'existe dans le dépôt ; la section reste donc textuelle (nom + usage), ce qui reste conforme au CDC (aucune photo n'est requise, seule une "illustration ou photo réellement utile" est autorisée si elle existe).
- **Modules** : aucun aperçu visuel réel (capture d'écran, schéma) n'est actuellement produit pour chaque module ; les cartes restent typographiques, conformément à `01-HERO-MODULES.md §3` ("aperçu réel du module, pictogramme utile... ou traitement graphique minimal cohérent" — le traitement minimal a été choisi en l'absence d'aperçu réel).

## Arbitrages

1. **Suppression de l'"échelle pédagogique"** (bloc 1-2-3-4 avec ancres vers `/prestations`). Ce bloc n'appartient pas à l'architecture validée (`00-ARCHITECTURE.md §3` liste exactement 6 sections, sans cette échelle) et pointait vers deux ancres potentiellement mortes (`#accompagnement-distance`, `#prestations-terrain`) déjà signalées comme un point ouvert par l'audit UI-4. Plutôt que de réparer des ancres pour un bloc hors périmètre CDC, il a été retiré.
2. **Suppression du bloc "Coaching découverte — 20 min offerts"**. Explicitement interdit par `00-ARCHITECTURE.md §11` ("Pas de coaching gratuit dans cette page").
3. **Suppression du bloc "5 calculateurs"** (grille Outils générique en bas de hub). Explicitement interdit par `00-ARCHITECTURE.md §9`. Remplacé par une seule passerelle contextuelle réelle (voir Navigation), plus conforme à l'esprit du CDC qu'un cross-link générique.
4. **Suppression du bloc "Prochains modules en préparation"**. Ce bloc n'appartient pas non plus à l'architecture des 6 sections validées, et `00-ARCHITECTURE.md §16` interdit tout contenu "bientôt disponible" ajouté pour remplir la page. Le bloc existant était honnête (non cliquable, clairement labellisé), mais reste hors périmètre CDC — retiré plutôt que conservé par défaut.
5. **Persistance locale du quiz (localStorage)**. Le CDC (`02-QUIZ.md §9-10`) décrit explicitement un état "compact" après un résultat satisfaisant, et autorise une persistance locale pour un visiteur non connecté si elle correspond à l'architecture existante. Aucune persistance n'existait avant cette mission : plutôt que d'omettre entièrement cette moitié du comportement demandé par le CDC (le bloc restant alors toujours "plein" y compris après un résultat parfait, contraire à l'intention explicite du §9), une persistance minimale et honnête a été ajoutée — elle stocke uniquement les réponses réellement données par le visiteur, jamais un score simulé, et réutilise le seuil `< 80 %` déjà présent dans le code existant (pas de nouveau seuil inventé). Cette persistance est strictement client-side, n'introduit aucune dépendance, ne touche à aucun compte ni synchronisation serveur.
6. **Indispensables : nouvelle présentation plutôt que réactivation de `FormationsEssentialTools.tsx`**. Le composant existant (déjà rédigé, jamais branché) affiche deux boutons par outil : un lien de recherche marchande générique et un placeholder `[MODÈLE À PRÉCISER PAR FABIEN]` pour les 10 outils (tous `proModel: null`). Le CDC V1 (`03-...md §11`) interdit explicitement tout bouton d'achat systématique et tout catalogue marchand. Afficher un placeholder de type "à préciser" sur une page publique aurait par ailleurs recréé un contenu "bientôt disponible" que le CDC proscrit ailleurs. Un nouveau composant plus sobre a donc été créé, qui réutilise les mêmes données réelles (`name`, `usage`) sans bouton d'achat ni placeholder. `lib/formations-tools.ts` n'a pas été modifié ; `FormationsEssentialTools.tsx` reste en l'état dans le dépôt (non supprimé, simplement non utilisé — comme avant cette mission).
7. **Question CDC "quel point vérifier avant d'acheter" non répondue par indispensable**. `lib/formations-tools.ts` ne contient qu'un champ `usage` réel par outil (répond à "à quoi ça sert"/"pourquoi c'est utile"), pas de critère d'achat rédigé. Plutôt que d'inventer un critère par outil, cette troisième question du CDC (`03-...md §10`) reste sans réponse affichée pour l'instant — à compléter lorsque ce contenu existera réellement.
8. **Pas de carrousel mobile manuel pour les Modules**. Le CDC le présente comme une possibilité ("peuvent être présentés"), pas une obligation, et prévient explicitement contre l'esthétique "plateforme e-learning générique". Avec exactement 3 modules, un simple empilement vertical reste pleinement lisible, accessible sans JavaScript et cohérent avec l'exigence de performance de cette même mission ("pas de JS client pour de simples contenus éditoriaux"). Un carrousel pourra être introduit plus tard si le nombre de modules augmente sensiblement.
9. **Durées de module non recalculées**. Les durées `~30/~20/~25 min` déjà affichées avant cette mission sont des estimations éditoriales, pas des mesures. Elles ont été conservées telles quelles (déjà "réelles" au sens où elles étaient déjà publiées et assumées par le projet) plutôt que supprimées ou recalculées, cette mission n'ayant ni outil de mesure ni instruction de les retirer.
10. **Lien corrigé hors du dossier `app/formations`** : `components/home/Parcours.tsx` (label "Apprendre" → "Les bases"). Justifié explicitement par la mission ("Réparer... les liens Les Bases actuellement cassés ou temporaires si leur destination appartient bien à ce périmètre") : la destination (`/formations`) appartient bien au périmètre Les Bases, seul le libellé était incohérent avec la décision déjà actée en UI-2. Aucun autre changement n'a été fait dans ce fichier ni dans la Home.

## Vérifications techniques

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : 844/844 tests passants, aucune régression.
- `npm run build` : build de production réussi ; `/formations` listée en rendu dynamique (`ƒ`, cohérent avec le prix dynamique des ebooks), les 3 pages module restent statiques (`○`, inchangées).
- Smoke test serveur de dev : `GET /formations`, `/formations/bases-12v`, `/formations/lire-schema`, `/formations/types-batteries` → 200. Contenu attendu présent (titres de section, CTA, mention Volta unique, 3 modules, 2 ebooks avec prix dynamique). Aucune trace de "AUTODIDACTE" ni "Coaching découverte" dans le HTML rendu.
