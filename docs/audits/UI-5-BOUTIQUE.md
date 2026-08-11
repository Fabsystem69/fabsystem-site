# UI-5 — Refonte complète de la Boutique

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `app/boutique/page.tsx`, `app/boutique/[slug]/page.tsx`, `components/boutique/*` (nouveau), `lib/boutique-ebook-content.ts` (nouveau), `lib/services/product-access.ts` (nouveau), `lib/prestations-packs.ts` (ajout `getUniversForEbookSlug`, aucune modification des fonctions existantes).
**Non modifié :** moteurs, Project, Prisma (aucune migration), Dashboard, espace client, Les Bases, Outils, Volta (asset), prix, Stripe ProductPrice, aucun nouveau produit créé.

## Architecture

Avant toute écriture, audit du catalogue réel (script temporaire en lecture seule, supprimé après usage) :

- 13 produits `ACTIVE`/`BUY_NOW` en base : 11 packs d'accompagnement (`pack-*`, exclus de la Boutique via `isPrestationsPackSlug`, inchangé) + **2 ebooks réels** : `ebook-electricite-van` et `ebook-electricite-bateau`. Aucun guide Camping-car n'existe.
- Les deux ebooks ont déjà un `featuredImage` renseigné en base (`/ebook/couverture.jpg`, `/ebook/couverture-bateau.jpg`) — la constante `EBOOK_ENRICHMENT` sert de repli, pas de source principale.
- Aucun prix n'a de `compareAtAmountCents` défini : aucune promotion réelle n'existe aujourd'hui.
- Le modèle Prisma `Product`/`ProductPrice` ne porte **aucun champ** univers, déductibilité, promotion (dates/libellé), nombre de pages ou ordre d'affichage — confirmé par lecture directe de `prisma/schema.prisma`.

Décision d'architecture : plutôt que d'ajouter ces champs (interdit par la mission sauf bug bloquant démontré — une fonctionnalité manquante n'est pas un bug), la Boutique V2 réutilise exclusivement des mécanismes déjà réels et déjà utilisés en production :

- **Univers** : nouvelle fonction `getUniversForEbookSlug(slug)` dans `lib/prestations-packs.ts`, qui interroge en sens inverse `EBOOK_SLUG_BY_CATEGORIE` — la même correspondance produit→univers qui pilote déjà l'octroi automatique d'ebook à l'achat d'un pack. Ce n'est ni une nouvelle matrice, ni une déduction fragile depuis un titre/mot-clé (interdit par `Boutique/02-UNIVERS.md §17`) : c'est la réutilisation d'une donnée métier déjà réelle. Voir "Arbitrages".
- **Déductibilité** : réutilisation telle quelle de `findPrestationsPackIncludingEbook(slug)`, déjà utilisée par l'ancienne fiche produit.
- **Statut de possession** : logique extraite de l'ancienne fiche produit (`findExistingAccess`) vers `lib/services/product-access.ts` (`findExistingProductAccess`), pour être partagée entre le hub et la fiche sans duplication.
- **Promotion** : non implémentée (voir "Arbitrages") — aucune donnée réelle n'existe pour l'alimenter.

Nouveaux composants dans `components/boutique/` : `Hero.tsx`, `GuidesEtUnivers.tsx` (filtre + grille, état client partagé), `ProductCard.tsx`, `UsageEtAcces.tsx`, `PasserelleAccompagnement.tsx`, `types.ts`. Tous réutilisent `Container`/`Section`/`Button`/`Card`/`Badge` (UI-1/UI-2), aucune nouvelle primitive créée.

## Boutique

`/boutique` suit l'ordre imposé par `00-BOUTIQUE-ARCHITECTURE.md` : Hero → Choisissez votre univers (filtre) → Les guides disponibles → Pensés pour être utilisés, pas simplement lus → Besoin d'un coup de main ensuite ?

- **Hero** : texte repris mot pour mot (`Boutique/01-HERO.md` §2-4, §7). Un seul CTA « Voir les guides » ancré sur `#guides-disponibles`. Aucun prix, produit vedette, avis ou Volta.
- **Univers** : quatre filtres Tous/Bateau/Van/Camping-car, `role="tablist"`/`role="tab"`/`aria-selected`, filtrage 100 % client (état React local, `useState`), **aucun scroll automatique** au clic (règle explicite §5), Tous sélectionné par défaut. Textes d'accroche par univers repris mot pour mot (§7-9).
- **Guides disponibles** : grille de `ProductCard`, ordre couverture → univers → titre → bénéfice → formats → prix → mention déduction → CTA (`03-GUIDES-DISPONIBLES.md §4`). Aucune étoile, avis, stock ou compte à rebours. CTA normal « Découvrir le guide » ; état possédé prioritaire → « Déjà dans votre bibliothèque » / « Accéder à mon guide » ; aucun « Créer un compte ».
- **Camping-car** : aucun produit réel → état sobre « Guide Camping-car en préparation », aucun faux produit créé.
- **Usage et accès** : trois usages Préparer/Consulter/Retrouver + bloc pédagogique « Le saviez-vous ? » (mention obligatoire « Fonctionnalités en développement. » conservée).
- **Passerelle accompagnement** : CTA unique « Découvrir les accompagnements » vers `/prestations#on-fait-ensemble` (ancre réelle créée en UI-4, `components/services/OnFaitEnsemble.tsx`). Aucune matrice/prix de packs recopiée.

Smoke test dev-server : `GET /boutique` → 200, présence vérifiée de tous les titres de section et des deux ebooks réels dans la grille.

## Pages produit

`/boutique/[slug]` évolue depuis la structure existante (non reconstruite, conformément à `06-FICHE-PRODUIT.md §1/§30`) :

- **Hero produit** : couverture réelle, éventuel `UNIVERS · Type`, titre, promesse courte, prix, mention « Déductible de votre accompagnement FabSystem » si applicable.
- **Suppression de l'ancienne logique packs** (objectif #4 / §3) : l'ancien encart ambré « Déjà inclus si vous prenez un pack Cap, Passerelle ou Grand Large {univers} » — qui affichait un nom de palier générique indépendant de l'univers réel du pack, exactement le bug déjà signalé en UI-4.1 — est **supprimé**, remplacé par la mention neutre « Déductible de votre accompagnement FabSystem » dans le Hero et par le petit bloc Volta (voir plus bas). Il n'y a donc plus de texte à corriger via `getPalierLabel` : la source du bug a été retirée, conformément à la nouvelle logique demandée par le CDC lui-même.
- **« Ce guide est fait pour vous si... »** remplace « Description bientôt disponible » : 4 situations concrètes par ebook, reformulées à partir du contenu déjà réel (`benefits`/`sommaire` déjà existants, accroches univers déjà validées) — aucune promesse commerciale nouvelle inventée.
- Conservés : « Ce que vous allez apprendre », sommaire visible, formats (renommé « Un guide, plusieurs façons de l'utiliser », conforme §8), FAQ (`FaqEbook`, inchangé).
- **Bloc Volta déduction** : petit encart « Vous avez besoin d'aide ensuite ? » après les formats, avant la FAQ (§17), affiché uniquement si le produit est déductible.
- **Nombre de pages** : aucune donnée fiable en base → non affiché, conformément à §10 (« si aucun nombre fiable n'est renseigné, ne rien afficher »).
- **Bloc d'achat** : `sticky` sur desktop, synthèse factuelle (type, univers, formats, accès, prix, déduction), CTA « Acheter le guide », ou état possédé « Déjà dans votre bibliothèque » / « Accéder à mon guide ». Ligne de réassurance « Accès disponible après paiement... / Votre premier achat active automatiquement votre espace client FabSystem. » Aucun « Créer un compte ».
- Carte et fiche partagent désormais la même source (`lib/boutique-ebook-content.ts`, `getUniversForEbookSlug`, `findPrestationsPackIncludingEbook`, `findExistingProductAccess`) — pas de copie divergente (§25).

Smoke test : `GET /boutique/ebook-electricite-van` et `/boutique/ebook-electricite-bateau` → 200, sections attendues présentes (« Ce guide est fait pour vous si », « Un guide, plusieurs façons », « Vous avez besoin d'aide ensuite », « Acheter le guide »).

## Accompagnements

Objectif #4 traité en supprimant la source du bug plutôt qu'en la patchant : l'ancien texte listant "Cap, Passerelle ou Grand Large" (identique au problème déjà corrigé en UI-4.1 sur `/prestations`) n'existe plus nulle part dans la Boutique. Aucune nouvelle occurrence de noms de palier (Amarrage/Cap/Passerelle/Grand Large ou leurs équivalents Van/Camping-car) n'a été ajoutée dans `app/boutique/**` ou `components/boutique/**`. Le prix/la matrice des accompagnements ne sont jamais recopiés (Passerelle accompagnement §7). Si un futur besoin réintroduit un libellé de palier dans la Boutique, il devra passer par `getPalierLabel(categorie, palier)` — jamais par une nouvelle matrice.

## Ebooks

- Mention de déduction affichée avant achat, sur la carte et sur la fiche, avec le libellé exact imposé : « Déductible de votre accompagnement FabSystem » — jamais « éligible » côté client.
- Mécanique de déduction (montant réellement payé, jamais recalculé depuis le prix catalogue) **non implémentée dans le front** : aucune règle de calcul n'existe côté source de vérité transactionnelle aujourd'hui (confirmé par l'audit — pas de champ dédié sur `Order`/`OrderItem`), donc conformément à `03-GUIDES-DISPONIBLES.md §13` et `05-PASSERELLE-ACCOMPAGNEMENT.md`, le front se limite à afficher la mention et ne calcule rien.
- Jamais présentée comme applicable aux outils SaaS/espace client — la mention Volta de `04-USAGE-ET-ACCES.md` reste séparée et parle uniquement d'activation automatique de l'espace client, pas de déduction.
- Aucune grosse "argumentation commerciale" : la mention reste une phrase courte, répétée deux fois maximum par page (Hero + bloc Volta sur la fiche ; carte + passerelle sur le hub), jamais un gros encadré promotionnel.

## Panier

Aucune modification de `AddToCartButton`, de `/api/cart/items`, du panier ou du checkout. Le composant `AddToCartButton` est réutilisé tel quel (prop `label` déjà existante, utilisée pour afficher « Acheter le guide » sur la fiche au lieu du libellé par défaut « Ajouter au panier »). Aucun bug directement lié à la refonte n'a été identifié dans le parcours Boutique → Produit → Panier ; aucun changement de logique métier n'a donc été fait, conformément à la mission.

Vérifié : le hub liste les produits avec `product.id` réel transmis à la fiche puis au panier ; la fiche transmet le même `product.id` à `AddToCartButton` ; le statut de possession (`findExistingProductAccess`) masque le CTA d'achat quand le produit est déjà possédé, sur le hub **et** sur la fiche (avant : uniquement sur la fiche).

## Responsive

- Cartes produit : grille `sm:grid-cols-2 xl:grid-cols-3`, couverture dominante, contenu qui ne déborde jamais (`flex-1` sur la description).
- Filtre univers : `flex flex-wrap`, retour à la ligne maîtrisé sur mobile plutôt qu'un carrousel (conforme §19 de `02-UNIVERS.md`), taille tactile ≥ 40px (boutons `px-4 py-2`).
- Fiche produit : bloc d'achat en colonne unique sur mobile (ordre naturel du flux DOM : Hero → contenu → bloc achat en bas), `sticky` uniquement à partir de `lg:` pour ne jamais masquer le contenu sur petit écran.
- Non vérifié dans un navigateur réel (aucun Playwright/Puppeteer disponible dans ce dépôt) : vérification faite par revue de code (classes Tailwind responsive) + smoke test HTTP (statuts 200, présence du contenu attendu dans le HTML serveur). Limitation déjà documentée dans les rapports UI-2/UI-3/UI-4.

## Accessibilité

- Un seul `<h1>` par page (titre produit sur la fiche, absent volontairement du hub qui utilise `<h1>` uniquement dans le Hero — vérifié par smoke test : 1 seul `<h1>` sur la fiche produit).
- Hiérarchie `<h2>` cohérente pour chaque section/bloc.
- Filtre univers : `role="tablist"`, `role="tab"`, `aria-selected`, focus visible (`focus-visible:outline`), libellés textuels (jamais uniquement un pictogramme) — vérifié par smoke test (4× `role="tab"`, 1× `aria-selected="true"`).
- Images de couverture : `alt` réel et descriptif (ex. « Couverture du livre « Câbler son van sans se planter » ») — vérifié par smoke test. Visuel Hero décoratif : `alt=""` (aucune information non redondante avec le texte).
- Statut de possession et mention de déduction toujours accompagnés de texte, jamais d'une couleur seule.
- Boutons/CTA : tous construits sur la primitive `Button` (UI-1), focus visible et contraste déjà validés en UI-1/UI-2.
- Bloc `sticky` desktop : ne capture pas le focus, reste dans le flux DOM naturel (pas de `position: fixed`, uniquement `sticky` avec `top-24`), donc n'entrave pas la navigation clavier.

## Performance

- Les deux pages restent des Server Components par défaut (`export const dynamic = "force-dynamic"`, conservé de l'existant car le catalogue doit toujours être lu à jour). Seul `GuidesEtUnivers` (filtre interactif) est un Client Component ; il reçoit les données déjà résolues côté serveur en props, aucun fetch client.
- `next/image` conservé pour toutes les couvertures et le visuel Hero, avec `sizes` explicite.
- Aucune nouvelle dépendance npm ajoutée.
- Requêtes catalogue : même volume qu'avant (une requête liste + un prix actif + un statut de possession par produit, exécutés en parallèle via `Promise.all`/`Promise.allSettled`) — pas de requête supplémentaire par rendu de carte.

## Visuels nécessaires

- **Hero Boutique** : aucun visuel dédié n'existe. Réutilisation de `public/preuves/cable.png` (préparation de câblage réelle, sans marque imposée dominante) en attendant un visuel Boutique propre. À remplacer si un visuel dédié "installation technique premium" est produit.
- **Visuels par univers** (`02-UNIVERS.md §13`, facultatifs) : non ajoutés — aucune photo Van/Camping-car n'existe dans le dépôt (déjà documenté en UI-3/UI-4). Le filtre reste donc uniquement textuel (badges + accroche), ce qui respecte la CDC (les visuels d'univers sont explicitement facultatifs, "Si un visuel accompagne un univers...").
- **Illustration Volta** : toujours aucun asset Volta dans le dépôt (constat répété UI-2 à UI-4). Les deux blocs pédagogiques (Usage et accès, fiche produit) restent donc **textuels**, avec un simple repère « 💡 » en lieu d'icône Volta, conformément à la clause d'exception « Volta considérée comme décorative si tout son message est déjà présent en texte » (`04-USAGE-ET-ACCES.md §20`).
- **Guide Camping-car** : aucun visuel nécessaire tant qu'aucun produit réel n'existe (état "Guide en préparation" volontairement sans couverture).

## Arbitrages

1. **Univers produit sans champ Prisma dédié.** `Product` ne porte aucun champ `univers`. Plutôt que soit (a) migrer Prisma — interdit sans bug bloquant démontré —, soit (b) omettre entièrement le filtre — contraire à `02-UNIVERS.md §23.1` (« quatre filtres obligatoires ») —, j'ai réutilisé la correspondance déjà réelle `EBOOK_SLUG_BY_CATEGORIE` (production, pilote déjà l'octroi d'ebook à l'achat d'un pack) via une nouvelle fonction `getUniversForEbookSlug`. Ce choix couvre uniquement les deux ebooks déjà connus ; tout produit futur non présent dans cette table apparaîtra seulement sous « Tous », jamais classé à tort. **Ce n'est pas une solution définitive** : une vraie évolutivité (§18 de `02-UNIVERS.md`, "plusieurs guides par univers") nécessitera un vrai champ `Product.univers` administrable depuis le dashboard — décision de schéma à prendre en dehors de cette mission.
2. **Aucune promotion implémentée.** `ProductPrice.compareAtAmountCents` existe mais n'est renseigné pour aucun produit actif et aucune date de validité n'existe en base. Construire une UI de promotion sans ces garde-fous risquerait d'afficher un prix barré permanent, interdit par `03-GUIDES-DISPONIBLES.md §9/§11`. Aucune UI promotionnelle n'a donc été construite ; à réévaluer si le dashboard gagne un jour une vraie gestion de promotion (dates, libellé, activation).
3. **Nombre de pages non affiché.** Aucun champ `nombrePages` n'existe côté produit ; aucune valeur n'est donc affichée, conformément à la règle explicite de la CDC dans ce cas précis (§10 : « si aucun nombre fiable n'est renseigné, ne rien afficher »).
4. **`featuredImage` non éditable depuis le dashboard** (constat de l'audit UI-5 : `app/dashboard/catalog/actions.ts` fige ce champ à une chaîne vide, malgré son existence en base et son utilisation réelle sur les deux ebooks actuels). Hors périmètre (« Dashboard » explicitement exclu de cette mission) : non corrigé, seulement documenté. Sans impact fonctionnel actuel car les deux ebooks ont déjà un `featuredImage` renseigné en base.
5. **Réutilisation de `public/preuves/cable.png` pour le Hero Boutique.** Ce visuel a déjà un usage réel ailleurs (preuves terrain) ; il est repris ici comme visuel générique "câblage propre", conforme à la liste d'exemples de `01-HERO.md §8`, en l'absence d'un visuel Boutique dédié.

## Vérifications techniques

- `npx tsc --noEmit` : aucune erreur dans le code modifié (deux erreurs préexistantes dans `.next/dev/types/*.d.ts`, artefacts de cache non liés à cette mission, disparues après suppression du cache).
- `npm test` : 844/844 tests passants (aucune régression).
- `npm run build` : build de production réussi, `/boutique` et `/boutique/[slug]` listées en rendu dynamique (`ƒ`), cohérent avec `export const dynamic = "force-dynamic"`.
- Smoke test serveur de dev : `GET /boutique`, `GET /boutique/ebook-electricite-van`, `GET /boutique/ebook-electricite-bateau` → 200, contenu attendu présent (titres de section, CTA, mentions de déduction, rôles ARIA du filtre, alt des couvertures).
