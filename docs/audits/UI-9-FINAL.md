# UI-9 FINAL — Finition globale FabSystem

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Base :** `docs/audits/UI-9A-AUDIT-GLOBAL.md`. Cette mission corrige, en une passe cohérente, les points P1/P2 identifiés — aucune refonte d'architecture, aucun nouveau moteur, aucune nouvelle auth, pas de Volta graphique.

## Corrections éditoriales

**Identité FabSystem / Fabien / Volta** — 9 occurrences P1 corrigées + 2 P2 (institutionnel) :

- `components/services/TroisFacons.tsx` (×2), `components/home/Parcours.tsx`, `components/services/Faq.tsx` (5 occurrences dans les réponses, dont "contactez FabSystem" → "contactez Fabien"), `components/services/OnFaitEnsemble.tsx`, `components/home/Accompagnement.tsx`, `components/outils/Accompagnement.tsx`, `components/boutique/PasserelleAccompagnement.tsx`, `app/prestations/page.tsx` (metadata + Hero subtitle), `app/a-propos/page.tsx` (Hero subtitle) : "FabSystem intervient / aide / accompagne" → "Fabien intervient / aide / accompagne" partout où l'action est humaine (intervention terrain, coaching, conseil).
- `components/lesbases/BonsGestes.tsx` : "Le conseil de Volta" → "Point de vigilance Volta" (registre automatisé, jamais "conseil" qui personnifie Volta comme un humain).
- **Non modifié, volontairement** : les usages où "FabSystem" reste correct (entreprise/marque : "Les services FabSystem", "espace client FabSystem", "activité de FabSystem") et les 3 occurrences P3 de "FabSystem qualifie la demande" (`Deroulement.tsx`, `Faq.tsx` ×2) — registre administratif de traitement d'une demande, pas une action de coaching personnelle, jugé acceptable par l'audit et laissé tel quel.
- `components/services/JeConfie.tsx` et `components/services/ServicesCtaFinal.tsx` : déjà corrects (« bons exemples » de l'audit), non touchés.

Grep final effectué (`FabSystem (intervient|vous accompagne|vous aide|...)`) : plus aucune occurrence problématique restante hors des 3 P3 explicitement acceptées.

## SaaS

Le plus gros chantier, correspondant aux mission §2-10 :

- **Clés techniques traduites** : `lib/retained-value-labels.ts` (nouveau) mappe chaque clé de valeur retenue (`energy.dailyConsumption`, `battery.usefulCapacity`, `energyBalance.global`, etc., y compris les clés dynamiques `circuit.<id>`/`cable.<id>`/`protection.<id>`/`diagram.<id>`) vers un libellé français. Fallback neutre ("Donnée technique du projet") si une clé inconnue apparaît — jamais la clé brute affichée. Branché dans `app/mon-compte/projets/[projectId]/page.tsx` ("Informations retenues").
- **Erreurs moteur traduites** : `lib/engine-error-messages.ts` (nouveau) traduit chaque `EngineError` (`DependencyError`/`ValidationError`/`CalculationError`) en français, orienté action, en s'appuyant sur `error.code` et `details.key` — jamais le message anglais original, jamais "Engine"/"payload"/"dependency" visible. Branché dans la route `app/api/projects/[projectId]/engines/[engineId]/run/route.ts` (catch `isEngineError`).
- **Erreurs non bloquantes affichées** : `translateEngineResultError()` traduit `EngineResult.errors` (ex. `CONSUMER_CALCULATION_IMPOSSIBLE` → "Puissance non calculable pour : Réfrigérateur (tension inconnue)"). Nouveau champ `notices` dans `useEngineRun.ts`, affiché par `EngineActionBar.tsx` en ton neutre (`Alert tone="info"`, jamais un panneau rouge pour une info non bloquante).
- **Champs Protection/Câble structurés** :
  - `ProtectionModule.tsx` : le champ texte `"fusible:10, disjoncteur:40"` est remplacé par des lignes répétables (`<select>` type + `<input number>` calibre + bouton retirer), avec "+ Ajouter un calibre". Le payload envoyé au moteur reste exactement `{type, ratingA}[]`.
  - `CableModule.tsx` : le champ CSV `"1.5,2.5,4,6,10,16,25"` est remplacé par des chips sélectionnables parmi les sections normalisées courantes (1.5 à 50 mm²). Le payload reste exactement `number[]`.
  - Aucun moteur métier (`lib/engines/*.ts`) modifié.
- **Vue Project réorganisée** (`app/mon-compte/projets/[projectId]/page.tsx`) selon l'ordre imposé par la mission : identité Projet → actions nécessaires → explication unique Calculer/Retenir → valeurs retenues → chaîne Énergie → chaîne Circuits → actions secondaires (renommer/archiver/supprimer, déplacées en bas de page). Le bloc "Structure technique" (redondant avec les statuts déjà affichés dans les `<summary>` des deux chaînes, jusqu'à 3 répétitions relevées par UI-9A) est supprimé.
- **Explication Calculer/Retenir unique** : un seul encadré en haut de la Vue Project, jamais répété module par module. Les boutons restent "Calculer"/"Utiliser pour mon projet" (inchangés).
- **Bilan énergétique** : `EnergyBalanceModule.tsx` affiche désormais explicitement "Ce bilan utilise automatiquement les informations déjà retenues dans votre projet — aucune saisie n'est nécessaire ici" avant le bouton Calculer.
- **Cause de "À recalculer"** : `obsolescenceCause()` (nouveau, dans `page.tsx`) lit les dépendances déjà déclarées (`ProjectValueDependency`, réutilisées telles quelles via `listDependencies`) pour afficher, sous chaque valeur `OBSOLETE`, une phrase du type « « Consommation quotidienne » a changé : ce calcul doit être relancé. » Fallback générique ("Une donnée utilisée par ce calcul a changé.") si aucune dépendance connue n'explique le changement — aucune nouvelle logique métier créée.
- **Limite de 3 projets anticipée** : `app/mon-compte/projets/nouveau/page.tsx` devient un Server Component qui vérifie `listProjectsForCustomer` avant d'afficher le formulaire ; si la limite est atteinte, affiche directement "Vous avez atteint la limite de 3 projets" avec un retour vers Mes projets. Le contrôle serveur 409 existant reste la source de vérité, cette vérification n'est qu'un confort d'affichage.

## Les Bases

- `app/formations/bases-12v/page.tsx` : suppression des emojis `📏`/`〰️`/`🔶` (remplacés par les blocs colorés déjà existants, sans icône superflue) et du `⚠️` devant "Danger — Câble sous-dimensionné".
- `app/formations/lire-schema/page.tsx` : suppression du `⚠️` devant "Sécurité busbar" et de la grille de 4 emojis différents (`⭕`/`🔌`/`🔧`/`☀️`) devant les types de connecteurs — le texte déjà descriptif (noms + descriptions) porte seul l'information.
- `app/formations/types-batteries/page.tsx` : suppression du `⚠️` devant "Attention au chargeur".
- Aucune bibliothèque d'icônes installée (aucune n'existait déjà) — traitement typographique sobre conformément à la mission.

## Outils

- `CalculatorPageShell.tsx` : ajout d'un bloc passerelle commun, unique et sobre (deux liens : "Comprendre les bases →" vers `/formations`, "Être accompagné sur ce calcul →" vers `/prestations#on-fait-ensemble`), présent sur les 5 pages calculateur. Le slot `relatedTool` (singulier) devient `relatedTools` (jusqu'à 2 liens) pour améliorer le maillage inter-outils sans jamais afficher un mur de cartes.
- Maillage amélioré : Autonomie batterie ↔ MPPT ajouté (en plus de Autonomie ↔ Bilan déjà existant), MPPT ↔ Autonomie batterie réciproque. Section câble ↔ AWG déjà réciproque, inchangé.
- `components/outils/calculators/SectionCableCalculator.tsx` : suppression des deux `⚠️` devant les avertissements (les encadrés colorés rouge/orange portent déjà le sens).

## Navigation

- `components/Navbar.tsx` : le lien "Mon compte" desktop passe d'icône seule (aria-label uniquement) à icône + texte visible, même traitement que "Contact".
- `app/mon-compte/layout.tsx` : ajout d'un lien discret "← Retour au site" en haut de la coquille SaaS, sans dupliquer la Navbar publique.

## SEO

- `robots: { index: false, follow: false }` ajouté au metadata de : `/mon-compte`, `/mon-compte/achats`, `/mon-compte/profil`, `/mon-compte/projets`, `/mon-compte/projets/nouveau`, `/mon-compte/projets/[projectId]` (via `generateMetadata`), `/connexion-client`, `/panier`, `/commande/merci`.
- `public/robots.txt` complété avec `Disallow: /mon-compte`, `/mon-compte/`, `/connexion-client`, `/panier`, `/commande/merci` — défense en profondeur en plus du `noindex` par page.
- Aucune route publique légitime touchée ; `/api/**` reste géré séparément (déjà disallow).

## Performance

- `app/boutique/[slug]/page.tsx` : `getPublicProduct()` enveloppé dans `cache()` de React — `generateMetadata()` et le composant de page partagent désormais un seul appel réel à `getProductBySlug`/`getActivePriceForProduct` par rendu au lieu de deux. Le catalogue reste lu en base à chaque requête (`force-dynamic` inchangé) : la déduplication ne s'applique qu'à l'intérieur d'un seul rendu, jamais entre deux requêtes différentes.

## Visuels temporaires

- `app/a-propos/page.tsx` : les sections "Positionnement" et "Conclusion" (3 cartes blanches de structure identique relevées par UI-9A) sont fusionnées en une seule section de texte simple, sans bordure supplémentaire.
- Passerelles Home/Les Bases/Boutique/Services (`PasserelleBoutique.tsx`, `PasserelleServices.tsx`, `PasserelleAccompagnement.tsx`) : revues — déjà suffisamment différenciées dans leur traitement visuel (texte seul centré / section sombre pleine largeur / cartes produit), aucune modification nécessaire au-delà de ce que l'audit avait concrètement identifié (le cas a-propos).

## Visuels encore nécessaires

**Corrigé pendant cette mission** (le fichier `fab-bateau.png` a été identifié par l'utilisateur comme un vrai portrait de Fabien, et non une photo de bateau comme l'audit UI-9A l'avait supposé à tort) :
- `app/a-propos/page.tsx` conserve `alt="Fabien Lages"` sur `fab-bateau.png` (portrait réel, correction annulée après clarification).
- `components/services/JeConfie.tsx` : le bloc "Fabien — FabSystem" affiche désormais ce même portrait réel (rond, 80-96px), au lieu d'un bloc 100% textuel.
- `components/home/TroisUnivers.tsx` : les 3 univers ont maintenant chacun une vraie photo fournie par l'utilisateur pendant cette mission — `/univers/bateau.png` (voilier), `/univers/van.png` (installation solaire dans un van aménagé), `/univers/camping-car.png` (compartiment électrique camping-car). Le traitement typographique sobre (tuile noire) qui existait en fallback n'est plus utilisé pour aucun des trois.

**Restant à produire, non bloquant pour cette mission** :
- Photo Boutique dédiée (le Hero Boutique réutilise toujours une photo de chantier générique, `/preuves/cable.png`) — non traité, hors du périmètre concret identifié par l'audit pour cette passe.
- Différenciation des Hero Contact/Les Bases (toujours `/hero-fabsystem.png`, identique à la Home) — non traité : aucun nouvel asset pertinent disponible, et la mission interdit explicitement de "fabriquer artificiellement" une image juste pour différencier.

## Responsive

Vérifié par lecture des classes Tailwind (pas de navigateur réel disponible dans cet environnement — même méthodologie que UI-9A) sur les zones citées par la mission : les nouveaux composants structurés (`ProtectionModule`, `CableModule`) suivent le même pattern `grid sm:grid-cols-*` déjà validé ailleurs dans le SaaS (empilement vertical sous `sm`, aucune largeur fixe). Le bloc passerelle `CalculatorPageShell` utilise `flex flex-wrap`. Aucun débordement horizontal identifié dans le code ajouté.

## Accessibilité

- `components/TestimonialsSection.tsx` : contraste des étoiles corrigé, `text-yellow-400` (~1.6:1 sur fond blanc) → `text-brand-700` (`#a16207`, même palette de marque, ~4.6:1). L'`aria-label` texte (`"${rating} sur 5"`) déjà présent est conservé à l'identique.
- Nouveaux champs dynamiques (Protection, Câble) : chaque contrôle reste un `<select>`/`<input>` natif avec `placeholder` et bouton d'action à texte explicite ("+ Ajouter un calibre", "Retirer ce calibre" via `aria-label`) — pas de nouveau bouton icon-only sans alternative texte.

## Validation

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **872/872** tests passants, aucune régression (aucune formule moteur modifiée — seule la présentation des erreurs/labels a changé, déjà couvert par les tests existants sur les services sous-jacents).
- `npm run build` : build de production réussi.
- Smoke test réel (serveur de développement local) :
  - Toutes les pages publiques touchées (`/`, `/prestations`, `/boutique`, `/formations` + 3 modules, `/outils` + 5 calculateurs, `/a-propos`, `/confidentialite`, `/connexion-client`, `/vcard`) répondent `200`.
  - `/mon-compte` redirige bien (`307`) sans session, conforme à la garde existante.
  - Les 3 nouvelles photos d'univers sont bien servies (`/univers/bateau.png`, `/univers/van.png`, `/univers/camping-car.png` détectées dans le HTML rendu).
  - `grep` sur `/prestations` rendu confirme 2 occurrences de "Fabien intervient" (zéro "FabSystem intervient" restant sur cette page).
  - `/a-propos` rendu confirme `alt="Fabien Lages"` toujours présent (portrait réel conservé).
  - `/formations/lire-schema` rendu confirme zéro emoji (`⚠️`/`💡`/`⭕`/`🔌`/`🔧`/`☀️`) restant dans le HTML.
  - Aucune occurrence de `text-yellow-400` restante dans `components/*.tsx`.

Checklist finale de la mission :

- [x] Aucune personnification humaine incorrecte de FabSystem (9 occurrences P1 + 2 P2 corrigées, grep final propre hors 3 P3 explicitement acceptés).
- [x] Fabien utilisé lorsqu'une personne intervient/conseille/accompagne.
- [x] Volta n'est pas présentée comme conseiller humain ("Le conseil de Volta" → "Point de vigilance Volta").
- [x] Aucune clé moteur brute visible côté client (`lib/retained-value-labels.ts`).
- [x] Aucune erreur moteur anglaise brute visible (`lib/engine-error-messages.ts`).
- [x] Protection utilisable sans syntaxe texte (lignes structurées type + calibre).
- [x] Sections câble utilisables sans liste CSV (chips sélectionnables).
- [x] Calculer / Utiliser pour mon projet expliqué une seule fois, boutons inchangés.
- [x] Bilan énergétique global expliqué (aucune saisie nécessaire, dit explicitement).
- [x] "À recalculer" compréhensible (cause affichée quand déterminable via les dépendances existantes).
- [x] Limite 3 Projects anticipée (formulaire non affiché si la limite est atteinte).
- [x] Emojis problématiques identifiés par UI-9A supprimés/remplacés.
- [x] noindex ajouté sur toutes les zones privées identifiées + `robots.txt` complété.
- [x] Boutique : fetch produit dédupliqué (`React.cache()`).
- [x] Aucun faux formulaire Visio mentionné (texte confidentialité corrigé).
- [x] alt À propos honnête (photo confirmée réelle par l'utilisateur — alt conservé/restauré en conséquence).
- [x] Navigation cohérente ("Mon compte" texte+icône, retour SaaS→site ajouté).
- [x] Mobile cohérent (classes responsive vérifiées par lecture de code, pattern déjà validé réutilisé).
- [x] TypeScript OK.
- [x] Tests existants OK (872/872).
- [x] Build OK.

## Arbitrages

1. **`fab-bateau.png` : correction puis annulation.** L'audit UI-9A avait supposé, à partir d'un usage incohérent dans `TroisUnivers.tsx` (alt "Installation électrique embarquée sur un bateau" pour un fichier utilisé par ailleurs comme portrait), que ce n'était pas une photo de Fabien. Une première correction a retiré ce portrait de la page À propos. L'utilisateur a corrigé cette hypothèse en cours de mission : `fab-bateau.png` est bien un vrai portrait de Fabien. La correction a été annulée sur `app/a-propos/page.tsx`, et le vrai problème corrigé à la source : c'est `TroisUnivers.tsx` qui réutilisait ce portrait à tort comme photo d'installation bateau — corrigé en retirant cette réutilisation erronée (la tuile Bateau est ensuite passée à une vraie photo dédiée, voir ci-dessous). Cet épisode illustre pourquoi la mission interdit d'inventer un visuel : une hypothèse d'audit non vérifiée aurait pu conduire à supprimer une photo réelle et légitime de Fabien.
2. **3 photos d'univers intégrées en cours de mission**, fournies directement par l'utilisateur (hors périmètre initial de "ne pas générer de visuel" puisqu'il s'agit de vraies photos, pas de génération) : Bateau, Van, Camping-car ont chacun désormais une vraie photo dans `components/home/TroisUnivers.tsx`, remplaçant le traitement sobre temporaire (tuile noire) qui restait nécessaire avant leur réception.
3. **Portrait de Fabien réutilisé dans `JeConfie.tsx`** plutôt que de laisser le bloc "Fabien — FabSystem" purement textuel, maintenant que la photo est confirmée réelle et disponible — c'est exactement la correction que l'audit recommandait "si pertinent".
4. **Densité (§23) traitée de façon ciblée, pas systématique.** Seul le cas concret identifié par UI-9A (3 cartes À propos) a été modifié. Les passerelles Home/Les Bases/Boutique/Services ont été revues mais jugées déjà suffisamment différenciées (formats différents : texte seul / section sombre pleine largeur / cartes produit) — les modifier davantage aurait dépassé "ne modifier que les répétitions réellement identifiées par UI-9A".
5. **Emojis hors du périmètre strict de UI-9A corrigés par cohérence** : les deux `⚠️` de `SectionCableCalculator.tsx` (outils publics), non explicitement cités par fichier dans l'audit mais relevant exactement de la même catégorie ("⚠️ utilisé comme icône graphique répétée", nommée en toutes lettres par la mission §11) ont été corrigés pour rester cohérent avec le reste du site. Les emojis `☀️` de `AutonomieBatterieCalculator.tsx` (label "Autonomie illimitée", utilisés dans la logique d'affichage plutôt qu'en JSX statique) ont été laissés en l'état : usage plus positif/thématique (soleil ↔ solaire) que décoratif, risque de régression plus élevé pour un bénéfice marginal, hors du périmètre strict de l'audit.
6. **Aucune nouvelle bibliothèque d'icônes installée**, conformément à la mission — les emojis retirés sont simplement supprimés (le texte porte déjà l'information) plutôt que remplacés par une icône inventée.
7. **Route d'exécution moteur (`.../engines/[engineId]/run`) modifiée uniquement dans sa couche de présentation** (traduction des messages), jamais dans sa logique d'autorisation, de validation ou de persistance — conforme à "ne pas toucher à l'architecture".
