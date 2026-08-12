# UI-11 — Audit multi-agents VS Code : visuel, design, UX et cohérence FabSystem

Audit-only. Aucune modification, aucune correction, aucun commit effectué pendant cette mission.

## Résumé exécutif

Un navigateur réel (Chrome piloté par Playwright) était disponible dans cet environnement : cet audit repose donc sur de vraies captures d'écran (78 au total, desktop/mobile/6 breakpoints/SaaS avec données de test réelles), pas sur une lecture de code seule. Score global ~7,6/10.

Constat principal : le site public tient une cohérence visuelle réelle depuis UI-10, avec **Outils comme meilleure vitrine du produit**. Le point le plus faible n'est pas une page publique mais **la rupture de langage visuel entre le site public et l'écran d'exécution des moteurs dans le SaaS** (`/mon-compte/projets/[id]`), qui reste un formulaire brut sans illustration ni hiérarchie visuelle — à l'opposé du soin apporté à Outils/Boutique. Un seul bug visuel dur, reproductible et net a été trouvé : la nav publique déborde et tronque "Mon compte" à 768px, sur toutes les pages (composant partagé). Volta n'existe visuellement nulle part aujourd'hui (une seule occurrence textuelle) : le terrain est libre pour l'introduire, cf. section dédiée. Détail des scores, preuves et priorités P0-P3 ci-dessous.

## Méthode

Contrairement aux audits précédents de cette série (UI-9A notamment), un navigateur réel était disponible dans cet environnement : Chrome (`/Applications/Google Chrome.app`) piloté par Playwright (`playwright-core@1.62.1`, installé temporairement et de façon isolée dans le scratchpad — jamais dans `node_modules/` du projet, qui a été restauré à l'état du lockfile après vérification).

Déroulé réel :

1. Démarrage du serveur `npm run dev` en local (`localhost:3000`).
2. Capture de **78 captures d'écran réelles** (pas de simulation, pas de description a priori) :
   - les 9 pages publiques mandatées, en plein écran (`fullPage`) et en viewport, à 1440px et 375px ;
   - 3 pages représentatives (Home, Outils, Boutique) aux 6 breakpoints demandés : 375 / 430 / 768 / 1024 / 1440 / 1920 ;
   - l'espace client (`/mon-compte`, `/mon-compte/projets`, deux Project réels — un vide, un avec valeurs retenues —, `/mon-compte/achats`, `/mon-compte/profil`) à 1440 et 375, avec une **vraie session client de test** créée directement en base locale (Customer + CustomerSession, cookie de session valide signé comme le ferait `/api/client-auth/verify`), puis **entièrement supprimée** après capture (vérifié par un comptage à 0 après suppression).
3. Chaque page a ensuite été rechargée avec un script de scroll forcé + vérification `img.complete && img.naturalWidth > 0` sur toutes les balises `<img>`, pour distinguer un vrai bug d'un artefact de capture (lazy-loading non déclenché par une capture `fullPage` instantanée). Ce contrôle a permis d'écarter une fausse alerte (voir §"Limites").
4. Un agent d'exploration dédié (lecture seule) a fait un audit de code complémentaire (composants dupliqués, styles arbitraires, routes/ancres, `sizes`, `loading.tsx`, éléments cliquables, usage réel de Volta).
5. Toutes les captures ont été lues et évaluées visuellement par moi-même (lecture d'image directe), page par page, breakpoint par breakpoint.

**Aucune donnée de production n'a été touchée.** Toutes les vérifications SaaS ont été faites sur la base Postgres locale de développement, avec des données de test créées puis détruites pour cet audit uniquement.

## Limites de l'audit

- **Visuel réellement vérifié** pour toutes les pages listées dans la mission, aux breakpoints listés. Ce n'est donc pas un audit "code seulement" comme les précédents de cette série.
- Non couvert par une vraie capture : les flux d'interaction complexes (ouverture de la modale de contact sur `/prestations/intervention`, soumission réelle d'un formulaire, parcours d'achat Stripe complet, navigation clavier/lecteur d'écran). Tout ce qui touche à ces flux est marqué **HYPOTHÈSE**.
- Les captures ont été faites sur Chrome desktop headless uniquement (pas de test réel sur Safari iOS, pas de test tactile réel, pas de test avec un lecteur d'écran). Le rendu mobile est simulé par redimensionnement de viewport Chrome, pas par un vrai appareil.
- Une fausse alerte a été détectée et corrigée pendant l'audit lui-même : la première capture de la Home montrait plusieurs vignettes (ebooks, photo d'accompagnement) en blanc. Après re-vérification par scroll forcé + contrôle `naturalWidth`, il s'agissait d'un artefact de capture (lazy-loading Next.js non déclenché par une capture instantanée), pas d'un bug réel. Cela illustre concrètement la règle "ne jamais présenter une hypothèse comme un fait" — ce constat a été vérifié avant d'être exclu du rapport, pas supposé.

## Score global

| Page | Compréhension | Design | Cohérence FabSystem | Densité | UX | Crédibilité | Responsive | Verdict |
|---|---|---|---|---|---|---|---|---|
| Home | 8 | 7 | 8 | 6 | 7 | 8 | 7 | 🟡 |
| Services (orientation) | 9 | 8 | 9 | 8 | 9 | 8 | 8 | 🟢 |
| Accompagnement | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 🟢 |
| Intervention | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 🟢 |
| Boutique | 8 | 7 | 8 | 8 | 8 | 7 | 8 | 🟢 |
| Les Bases (`/formations`) | 7 | 6 | 7 | 5 | 7 | 7 | 7 | 🟡 |
| Outils | 9 | 9 | 9 | 8 | 9 | 9 | 8 | 🟢 |
| Contact | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 🟢 |
| À propos | 6 | 6 | 7 | 6 | 6 | 6 | 8 | 🟡 |
| SaaS / espace client | 7 | 6 | 6 | 7 | 7 | 7 | 7 | 🟡 |

**Moyenne globale : ~7,6/10.** Le site public a un socle visuel réellement solide depuis UI-10 — la faiblesse la plus nette n'est pas une page mais une **rupture de langage visuel entre le site public (soigné, illustré, dense mais maîtrisé) et le cœur technique du SaaS (formulaires bruts, sans illustration, sans hiérarchie visuelle forte)**, détaillée plus bas.

## Design system

**CODE CONFIRMÉ** (agent d'exploration) :

- Un composant `Card` partagé existe (`components/ui/Card.tsx`) et est utilisé dans 19 fichiers, mais le même motif visuel (`rounded-2xl border border-neutral-200 bg-white` ou équivalent) est réécrit à la main dans une trentaine d'autres emplacements (`app/a-propos/page.tsx`, `app/boutique/[slug]/page.tsx` — 7 fois dans le même fichier —, `app/vcard/page.tsx`, `components/home/Boutique.tsx`, `components/outils/OutilCard.tsx`, etc.). Aucune régression visuelle constatée aujourd'hui (VISUEL CONFIRMÉ : les cartes se ressemblent bien à l'œil sur les captures), mais c'est une dette qui rend toute évolution du style de carte risquée (~30 endroits à modifier à la main).
- Le motif "eyebrow" (petit label majuscule au-dessus d'un titre) n'a pas de composant partagé pour les sous-sections (seulement pour les en-têtes de page via `PageIntro`/`PublicHero`) : au moins 4 valeurs de `tracking-*` différentes (`wide`, `widest`, `[0.2em]`, `[0.22em]`) et 3 couleurs (`neutral-500`, `brand-400`, `brand-700`) recensées pour un rôle identique.
- Palette : `tailwind.config.js` ne définit que `brand.50-700` (jaune) en extension — pas de token "yellow" séparé. Or `yellow-600`/`yellow-50`/`yellow-100` bruts (hors palette `brand`) sont utilisés à 3 endroits (`AutonomieBatterieCalculator.tsx`, `app/formations/bases-12v/page.tsx`, `app/boutique/[slug]/page.tsx`).
- Tailles de police arbitraires (`text-[10px]`, `text-[11px]`, `text-[13px]`) au lieu de l'échelle Tailwind standard, recensées dans 11 fichiers (`Navbar.tsx`, `Badge.tsx`, `Alert.tsx`, `ServiceAssurance.tsx`, etc.).
- Autres valeurs magiques : `z-[999]` répété (modale contact, panier), deux largeurs de logo légèrement différentes non tokenisées (`w-[180px]`/`w-[160px]`), calcul pixel-perfect en dur dans `Navbar.tsx` (`-bottom-[calc(0.375rem+1px)]`).

**VISUEL CONFIRMÉ** : malgré cette dette de code, le résultat visuel reste cohérent à l'œil sur toutes les captures — c'est une dette de maintenabilité, pas (encore) une dette visuelle perceptible.

## Home

**VISUEL CONFIRMÉ** (1440 et 375, plus re-vérification par scroll forcé) :

- Hero clair, direct, avec CTA primaire/secondaire net et indicateur de scroll visible.
- Structure en 7 sections empilées (Univers → Comment avancer → Outils → Bases → Accompagnement → Ressources → CTA final) : logique et lisible, mais **longue** (~4590px de haut à 1440px, ~8240px à 375px). La question centrale de la mission — densité/rythme — trouve ici sa réponse la plus nette : ce n'est pas qu'une section soit creuse individuellement, c'est l'empilement de 7 sections à poids visuel comparable qui crée une sensation de défilement long sans respiration forte (pas de section "pivot" visuellement plus légère entre deux blocs cards+texte).
- Le bloc "Vous faites. Je vous accompagne." a une image à droite qui charge correctement (vérifié) mais qui est un simple aperçu générique d'installation, pas une photo qui illustre spécifiquement le sujet du bloc (l'accompagnement humain) — cohérent avec la note de correction de l'utilisateur sur `fab-bateau.png`, cette image-ci n'est pas concernée par cette règle mais reste un visuel "installation" plutôt générique.

**Comparaison Home vs Services** (demandée en §12 de la mission) : Services (`/prestations`) est visuellement plus court, plus direct, deux choix clairs immédiatement sous l'intro compacte. Home, en gardant un vrai Hero + 7 sections, est délibérément plus "vitrine" — cohérent avec la répartition demandée en UI-10 (Home = vitrine, pages secondaires = compactes), mais cela signifie que Home porte à elle seule presque toute la "longueur perçue" du site.

## Services (orientation, `/prestations`)

**VISUEL CONFIRMÉ** : page courte, deux cartes de choix contrastées (claire "On fait ensemble" / sombre "Je confie"), bandeau discret pour "Je fais seul", section "Comment avancer" en 3 colonnes parallèles, FAQ en accordéon dense mais lisible. C'est la page la plus aboutie du triptyque Services — verdict 🟢, rien à signaler.

## Accompagnement (`/prestations/accompagnement`)

**VISUEL CONFIRMÉ** : page dense (4 offres tarifées, filtre par univers, filtre par sujet), fond noir uniforme, cartes de prix bien hiérarchisées (badge "Recommandé" sur Copilote). Fonctionne bien commercialement — verdict 🟢.

**Point mineur (VISUEL CONFIRMÉ)** : la transition header blanc → contenu noir est immédiate, sans zone de respiration (pas de `PageIntro` clair/gris comme sur les autres pages secondaires) : le noir commence dès le pixel sous la nav. Ce n'est pas un défaut en soi (choix assumé, cohérent avec Intervention en miroir), mais casse la récurrence visuelle "bandeau gris clair d'intro" observée partout ailleurs.

## Intervention (`/prestations/intervention`)

**VISUEL CONFIRMÉ** : page claire, filtres univers/sujet, deux cartes de choix ("intervention précise" / "projet"), bloc "Fabien — FabSystem" avec la vraie photo, CTA final net. Bonne page — verdict 🟢.

**Incohérence avec l'intention de la mission (VISUEL + CODE CONFIRMÉ)** : le lien secondaire "Voir mes réalisations →" est toujours présent (`components/services/JeConfie.tsx:80-81`, pointant vers `/realisations`, route qui existe réellement — `app/realisations/page.tsx`). Or la mission UI-10 demandait explicitement de retirer "Réalisations" du flux principal. Ce n'est pas un lien mort, mais une incohérence entre l'intention documentée et l'état réel du code.

## Boutique

**VISUEL CONFIRMÉ** : `PageIntro` compact (pas de Hero, conforme à la mission), filtres par univers, cartes agrandies avec `sizes` correct, carte "Camping-car — Bientôt disponible" bien démarquée (bordure pointillée, "Visuel à venir" en texte, pas de CTA actif). Bonne cohérence avec Outils. Verdict 🟢.

## Les Bases (`/formations`)

**Point de vigilance sur le nommage (CODE CONFIRMÉ)** : il n'existe **aucune route `/les-bases`** dans le code. La page réelle est `/formations` (`app/formations/page.tsx`) ; seuls les composants et dossiers internes gardent le nom `les-bases` (`components/lesbases/*`, `components/home/LesBases.tsx`). Si un lien externe, un bookmark ou une doc pointe vers `/les-bases`, il est mort. J'ai moi-même reproduit cette confusion en début d'audit (première capture sur `/les-bases` → 404 réel constaté avant correction) — signe que le risque de confusion est réel, pas seulement théorique.

**VISUEL CONFIRMÉ** : c'est la page la plus **dense** du site — 3 modules + bons gestes + minimum matériel (11 items) + outils + boutique + quiz, empilés avec peu de air entre les blocs. C'est cohérent avec son rôle pédagogique, mais c'est visuellement la page qui ressemble le moins à une "vitrine produit" et le plus à une page de documentation. Le contenu "Le minimum pour travailler proprement" (11 items listés en 2 colonnes) est particulièrement dense visuellement comparé au reste du site.

**Point positif (VISUEL CONFIRMÉ)** : le label "Point de vigilance Volta" est la **seule apparition visible de Volta sur tout le site actuel** (texte seul, pas d'icône) — cf. section Volta plus bas.

## Outils

**VISUEL CONFIRMÉ, aux 3 breakpoints (375/768/1024, plus 1440/375 pleine page)** : c'est la page la plus aboutie visuellement du site. Grille homogène de 6 cartes (5 réelles + 1 "Bientôt disponible" correctement non cliquable, bordure pointillée, statut textuel), illustrations dédiées par outil (pas d'icône générique), bandeau "Accès rapide" utile, section finale CTA claire. **Réponse à la question centrale de la mission** ("Est-ce visuellement la vitrine produit la plus forte du site ?") : **oui, c'est actuellement la meilleure page du site**, devant Services et Boutique. Verdict 🟢, rien à corriger en priorité ici.

## Contact

**VISUEL CONFIRMÉ** : formulaire clair, carte de visite digitale avec QR code fonctionnel, FAQ en accordéon. Bonne page — verdict 🟢.

**Point demandé par la mission (§audit des deux boutons "Ajouter à mes contacts") — CODE CONFIRMÉ** : il existe bien deux implémentations distinctes de la même fonctionnalité "ajouter à mes contacts" :
- une carte compacte intégrée à `/contact` (`app/contact/page.tsx:181` "Ajouter à mes contacts" + `:189` "Télécharger la fiche (.vcf)"),
- une page dédiée standalone `/vcard` (`app/vcard/page.tsx:203`), plus complète (QR, réalisations, tous les moyens de contact), pensée pour être scannée depuis un support physique (carte de visite imprimée).

Ce n'est pas un doublon accidentel — les deux servent des contextes différents (un visiteur du site vs quelqu'un qui scanne une carte physique) — mais le fait que `/contact` réimplémente une version light du même composant plutôt que de renvoyer vers `/vcard` (ou l'inverse) est une duplication de logique fonctionnelle à surveiller si l'un des deux évolue sans l'autre.

## À propos

**VISUEL CONFIRMÉ** : page la plus courte du site (2 sections : "Expertise" avec la vraie photo de Fabien + "Positionnement" en texte seul). Fonctionnellement correcte, mais :

- Le bandeau `ServiceAssurance` ("Rhône/AURA · 24-48h · Détails") est un composant **volontairement partagé** avec `/contact` (CODE CONFIRMÉ, pas un copier-coller accidentel), mais visuellement il détonne sur une page de présentation personnelle — c'est un badge de SLA d'intervention, pas une information "à propos de Fabien". HYPOTHÈSE (à trancher visuellement, pas un bug) : ce bandeau a plus sa place sur les pages transactionnelles (Contact, Intervention) que sur une page d'identité.
- La section "Positionnement" est un simple bloc de texte en `max-w-3xl` sur un conteneur `max-w-6xl` : à 1440px, cela laisse une large bande vide à droite. Ce n'est pas un bug de grille cassée (vérifié dans le code : c'est un choix délibéré, pas une colonne vide non remplie), mais visuellement c'est la page où le rapport texte/espace est le plus déséquilibré du site — la page qui "fait le plus léger en contenu" alors que Fabien/FabSystem est un pilier de l'identité éditoriale du site.

C'est la page qui répond le moins bien à sa propre mission : présenter Fabien comme humain de confiance. Score cohérence FabSystem correct (7) mais crédibilité/densité les plus faibles du site (6).

## SaaS / espace client

**VISUEL CONFIRMÉ** (dashboard, liste projets, 2 fiches projet réelles, achats, profil, 1440 et 375) :

- `/mon-compte` (accueil) et `/mon-compte/projets` (liste) sont **visuellement dans la continuité directe du site public** : même nav, même typographie, même accent jaune, même langage de carte. Indicateur de quota "2/3" clair. Statut "ACTIF" en badge vert cohérent avec le reste du site.
- **En revanche**, la fiche projet (`/mon-compte/projets/[id]`, écran d'exécution des moteurs Énergie/Batterie/Circuit/etc.) est **visuellement en rupture nette** avec tout le reste du produit : formulaires bruts (inputs sans icône, sans illustration, labels en `placeholder`), aucune hiérarchie visuelle forte au-delà du texte, aucun élément qui rappelle le soin apporté à Outils ou Boutique. C'est fonctionnellement honnête (états "À compléter"/"Retenu" clairs, bandeau pédagogique "Calculer vs Utiliser pour mon projet" bien pensé), mais c'est visuellement la page la plus "amateur" du produit entier.

**Réponse à la question centrale de la mission** ("Le SaaS paraît-il être le prolongement naturel du site public ?") : **partiellement**. La coquille (dashboard, liste, navigation) oui, clairement. Le cœur produit (l'écran où le client passe le plus de temps, l'exécution réelle des moteurs) non — c'est un saut de qualité visuelle vers le bas au moment précis où le produit devrait le plus démontrer sa valeur ("SaaS technique premium").

## Responsive (6 breakpoints, Home / Outils / Boutique)

**VISUEL CONFIRMÉ — bug réel identifié** : à **768px** (tablette portrait), la barre de navigation déborde horizontalement — le libellé "Mon compte" est tronqué/coupé sur le bord droit de l'écran, reproduit identiquement sur Home et sur Outils (composant `Navbar` partagé, donc le bug touche **toutes** les pages publiques à cette largeur, pas seulement les deux vérifiées). À 1024px le menu tient à nouveau normalement (probablement un point de rupture Tailwind mal calé entre `md`/`lg`). C'est le seul bug visuel réel et reproductible trouvé pendant tout l'audit.

À 375, 430, 1024, 1440 et 1920 : aucun débordement, aucune superposition, grilles qui se réorganisent correctement (3 colonnes → 2 → 1 sur Outils/Boutique).

## Accessibilité (visuelle et interaction)

**CODE CONFIRMÉ** (agent d'exploration) : aucun `<div onClick>` trouvé à la place d'un élément interactif natif sur le périmètre public ; les seuls `cursor-pointer` recensés sont sur des éléments nativement interactifs (`<summary>`, `<label>` englobant un `<input>`). La carte "Schéma électrique" (Outils) est confirmée **visuellement** non cliquable (pas de changement de curseur au survol dans le code, bordure pointillée distincte, texte de statut explicite).

**HYPOTHÈSE** (non vérifiable sans lecteur d'écran réel ni test clavier réel) : navigation au clavier complète, ordre de focus, contraste exact des textes gris clair sur fond gris clair (ex. `text-neutral-500` sur `bg-neutral-50`, visible sur plusieurs bandeaux d'intro) — à vérifier avec un vrai outil d'audit d'accessibilité (axe, Lighthouse) plutôt que par lecture visuelle seule.

## Performance perçue (chargement, squelettes)

**CODE CONFIRMÉ** : un seul `loading.tsx` existe dans tout le projet (`app/boutique/loading.tsx`). Aucune route de l'espace client (`/mon-compte/**`), aucune fiche produit (`/boutique/[slug]`), aucune page Outils/Formations n'a de squelette de chargement dédié — l'utilisateur voit soit une page blanche soit le contenu précédent le temps du rendu serveur.

**VISUEL CONFIRMÉ** : en local (réseau rapide), aucun flash de contenu vide perceptible sur les pages testées — mais ce n'est pas un test représentatif d'une connexion mobile réelle.

## Identité éditoriale (FabSystem / Fabien / Volta)

**VISUEL CONFIRMÉ** : aucune violation trouvée. FabSystem est systématiquement nommé comme l'entité (guides, offres, engagement "FabSystem s'engage à..."), Fabien apparaît avec sa vraie photo et son nom complet uniquement là où un humain doit rassurer (Intervention, À propos) — jamais d'action humaine prêtée à "FabSystem" à l'écrit sur les pages vérifiées.

**Volta — état réel (CODE + VISUEL CONFIRMÉ)** : contrairement à l'hypothèse implicite de la mission ("où NE PAS ajouter Volta"), Volta n'est aujourd'hui présente **nulle part visuellement** — ni image, ni icône, ni mascotte dans aucun composant. La seule trace utilisateur est un texte "Point de vigilance Volta" sur `/formations`, sans aucun élément graphique. Tout le reste du code ne fait que **documenter son absence volontaire** (commentaires "aucun Volta ici", règles anti-dérive). Voir recommandations ci-dessous.

## Éléments qui fonctionnent très bien

- La page **Outils** dans son ensemble (grille, illustrations, carte "bientôt disponible") — la meilleure vitrine actuelle du site.
- Le triptyque **Services / Accompagnement / Intervention** : architecture claire, chaque page a un rôle net, les CTA sont cohérents entre elles.
- Le bandeau "Comment souhaitez-vous avancer ?" sur la Home (01/02/03) : résume tout le système de choix du site en une section courte et lisible.
- La fiche projet SaaS, malgré sa faiblesse visuelle, a un **contenu fonctionnel honnête** : bandeau pédagogique "Calculer vs Utiliser pour mon projet" et libellés d'état ("À compléter"/"Retenu") clairs, sans ambiguïté sur ce qui est enregistré ou non.
- La carte de visite digitale sur `/contact` (QR + .vcf) : détail soigné, rare sur ce type de site.
- Le dashboard SaaS (accueil, liste projets) reste visuellement dans la continuité du site public — contrairement à la fiche projet.

## Éléments qui font amateur

Chaque point ci-dessous est un constat **observé réellement** (VISUEL CONFIRMÉ), pas une supposition :

1. **L'écran d'exécution des moteurs dans le SaaS** (`/mon-compte/projets/[id]`) : formulaires bruts sans aucune illustration ni hiérarchie visuelle, en rupture nette avec le reste du produit — c'est l'écran où le client passe le plus de temps.
2. **Le bug de nav à 768px** : "Mon compte" tronqué sur toutes les pages publiques à cette largeur précise — un défaut de responsive visible dès le premier coup d'œil sur tablette portrait.
3. **Le bandeau `ServiceAssurance` recyclé sur `/a-propos`** : un badge de SLA d'intervention ("Rhône/AURA · 24-48h") sur une page de présentation humaine détonne, même si le choix de réutilisation est délibéré côté code.
4. **La confusion de nommage `/les-bases` vs `/formations`** : un piège pour quiconque (interne ou externe) construit un lien à partir du nom "Les bases" affiché dans la nav plutôt que de vérifier la route réelle.

## Incohérences entre pages

- **Densité de "eyebrow"** : au moins 4 styles de label majuscule différents pour le même rôle sémantique sur des pages voisines (Services, Accompagnement, Les Bases, Boutique) — cf. section Design system.
- **Transition sous la nav** : la majorité des pages secondaires ouvrent sur un bandeau `PageIntro` gris clair ; Accompagnement et Intervention ouvrent directement sur fond noir/blanc sans ce bandeau — cohérent en soi (elles ont leur propre en-tête stylé), mais rompt la récurrence visuelle attendue en scannant le site page après page.
- **Palette de statut SaaS vs site public** : le vert ("ACTIF", "RETENU") n'apparaît que dans l'espace client — jamais sur le site public, qui reste strictement noir/blanc/gris/jaune. Cohérent fonctionnellement (statut ≠ décoratif) mais c'est la première fois qu'une autre couleur que l'accent jaune apparaît dans le produit.

## P0 (bloquant, à corriger avant toute autre chose)

- Bug de navigation à 768px : le libellé "Mon compte" est tronqué/déborde du viewport sur toutes les pages publiques (composant `Navbar` partagé). Impact direct sur l'utilisabilité en tablette portrait.

## P1 (fort impact, à traiter rapidement)

- Rupture visuelle de l'écran d'exécution des moteurs dans le SaaS (`/mon-compte/projets/[id]`) : c'est l'écran-clé du produit payant, et c'est aussi le moins soigné visuellement du site entier.
- Absence de `loading.tsx` sur `/mon-compte/**` et sur les fiches produit/outils individuelles : un seul squelette existe sur tout le site (`/boutique`).

## P2 (impact moyen, cohérence/dette)

- Uniformiser le motif "eyebrow" dans un composant partagé (au moins 4 variantes de `tracking-*` et 3 couleurs relevées).
- Factoriser le motif "carte" (`Card`) : ~30 occurrences manuelles contre 19 usages du composant partagé.
- Trancher le lien "Voir mes réalisations" sur `/prestations/intervention` : soit assumer sa présence (et documenter que Réalisations n'est retiré que de la Home/nav principale), soit le retirer pour être cohérent avec l'intention UI-10.
- Clarifier la relation entre `/contact` (carte de visite compacte) et `/vcard` (carte complète) pour éviter une divergence future des deux implémentations.

## P3 (mineur, polish)

- Couleurs `yellow-*` brutes hors palette `brand-*` (3 occurrences).
- Tailles de police arbitraires `text-[Npx]` (11 fichiers) à remplacer par l'échelle standard.
- Densité visuelle très haute de la page `/formations` (section "Le minimum pour travailler proprement" notamment) — envisager un espacement supplémentaire, pas un contenu en moins.
- Grande zone vide à droite du bloc "Positionnement" sur `/a-propos` à 1440px.
- `components/home/Boutique.tsx` : `<Image>` sans `sizes` sur une taille d'affichage responsive (impact perf mineur, pas de `fill`).

## Passe A recommandée (structurel)

1. Corriger le débordement de la nav à 768px (P0).
2. Refondre visuellement l'écran d'exécution des moteurs SaaS pour le rapprocher du langage visuel du reste du produit (cartes, un minimum d'illustration ou d'icônes par module, hiérarchie typographique plus marquée) — sans toucher à la logique métier (retain/preview, obsolescence, etc.), uniquement l'habillage.
3. Ajouter des `loading.tsx` sur `/mon-compte/**` et les routes de fiches individuelles (`/boutique/[slug]`, `/outils/*`).

## Passe B recommandée (polish visuel)

1. Composant `Eyebrow` partagé + composant `Card` généralisé pour réduire la dette de duplication identifiée par l'audit de code.
2. Trancher et documenter le sort du lien "Réalisations" sur Intervention.
3. Nettoyage des valeurs Tailwind arbitraires (`text-[Npx]`, `yellow-*` hors palette, `z-[999]`) au fil de l'eau, sans risque visuel (déjà cohérent à l'œil).

## Passe C recommandée (Volta)

Voir emplacements ci-dessous — travail éditorial + un minimum d'illustration, aucun changement structurel.

## Volta — emplacements potentiels

Constat de départ : Volta n'existe visuellement nulle part aujourd'hui (un seul texte, aucune image). Emplacements jugés pertinents, **hors Hero Home, hors grands bandeaux, hors zones commerciales principales** (conformément à la consigne) :

1. **Le bandeau pédagogique "Calculer vs Utiliser pour mon projet"** dans la fiche projet SaaS — déjà un point de friction identifié (P1) où une petite mascotte pourrait porter l'explication sans ajouter de charge visuelle supplémentaire à un endroit déjà dense en texte.
2. **Le label "Point de vigilance Volta"** sur `/formations` (déjà existant en texte) — lui donner enfin une icône dédiée cohérente, puisque c'est le seul endroit où le nom Volta est déjà exposé à l'utilisateur.
3. **Les états vides du SaaS** ("Aucun achat pour le moment", futur "aucun projet") — un registre habituel pour une mascotte, sans risque de la faire passer pour une conseillère humaine.
4. **Les tooltips `ⓘ` déjà présents sur Accompagnement** (`DC-DC`, `Convertisseur`, `VASP`) — remplacer l'icône générique par un micro-élément Volta cohérent avec son rôle "vulgarisation/pédagogie", sans toucher au contenu.
5. **La FAQ (Services, Contact, Boutique)** — un petit repère visuel Volta à côté du titre "Questions fréquentes"/"FAQ" serait cohérent avec un rôle d'assistance non-commerciale, sans jamais répondre elle-même (le contenu reste écrit par FabSystem).

## Conclusion

Le site public, après UI-10, tient une cohérence visuelle réelle et une vitrine Outils clairement la plus forte du produit. Le seul bug visuel dur trouvé est localisé et simple à isoler (nav à 768px). Le point qui mérite le plus d'attention n'est pas une page publique mais la jonction entre le site public et le cœur du SaaS : l'écran où le client exécute réellement les moteurs de calcul est aujourd'hui le moins abouti visuellement de tout le produit, alors que c'est celui où la valeur "SaaS technique premium" devrait le plus se voir. Volta, elle, n'existe encore nulle part visuellement — le terrain est donc libre pour l'introduire progressivement, sans reprendre de zone déjà occupée.

VOIR → COMPARER → COMPRENDRE → PRIORISER. Fin de l'audit.
