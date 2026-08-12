# UI-12 — Finition SaaS + corrections finales avant Volta

Mission d'implémentation (pas d'audit) traitant en une seule passe les points prioritaires révélés par `docs/audits/UI-11-MULTI-AGENT-VISUAL-AUDIT.md`. Exécutée en multi-agent : deux agents en parallèle (Navbar 768px + 2 nettoyages publics ; loading states) pendant que le cœur de la mission (refonte visuelle de la fiche Project) a été traité directement, avec vérification visuelle réelle (Chrome + Playwright) partagée entre les trois flux de travail. Aucun moteur, aucun EngineRunner, aucune règle métier, aucun schéma Prisma modifié. Aucun commit pendant le travail — commit demandé explicitement par l'utilisateur une fois la mission terminée.

## Résumé

- **Navbar 768px** : corrigé. Le point de bascule mobile/desktop est passé de `sm:` (640px) à `lg:` (1024px) sur les 4 endroits qui l'utilisaient. Vérifié à 375/430/768/1024/1440 sur Home, `/prestations/intervention`, `/a-propos` : plus aucun débordement, rien de coupé.
- **Fiche Project SaaS** (`/mon-compte/projets/[projectId]`) : refonte visuelle complète. Nouvelle coquille de carte partagée (`EngineModuleShell`) avec icône, statut, aperçu de résultat et description, pour les 10 modules moteur. Regroupement en deux familles visuelles (Énergie / Distribution) avec compteur de progression. En-tête de projet en carte avec "prochaine action" dérivée honnêtement de l'état réel. Section "Informations retenues" passée d'une liste textuelle à une grille de cartes compactes avec valeur chiffrée mise en avant. Aucune formule, aucun moteur, aucun payload API modifié — uniquement composition visuelle.
- **États de chargement** : 6 nouveaux `loading.tsx` (dashboard, liste projets, fiche projet, achats, profil, fiche produit boutique) + un composant `Skeleton` partagé. Le squelette de la fiche projet a été réaligné après coup sur la nouvelle structure (familles + cartes) pour rester honnête vis-à-vis de la page réelle.
- **Intervention** : lien "Voir mes réalisations →" retiré (route `/realisations` conservée, seulement déréférencée depuis cette page).
- **À propos** : bandeau `ServiceAssurance` retiré (conservé sur `/contact` et ailleurs).
- **Validation technique** : `npx tsc --noEmit` → 0 erreur. `npm test` → 872/872. `npm run build` → succès, toutes les routes compilées, y compris les 6 nouvelles routes `loading.tsx`.
- **Volta** : non intégrée dans cette phase, conformément à la mission. Un emplacement visuel a été préparé (bandeau "Calculer vs Utiliser pour mon projet", icône ronde neutre "i") pour accueillir une future apparition discrète en UI-13, documenté par un commentaire de code — aucune mascotte ajoutée.

## Navbar 768px

**Diagnostic réel** : le bug venait du point de bascule Tailwind `sm:` (640px) utilisé pour arbitrer entre menu mobile et menu desktop, alors qu'à 768px le menu desktop complet (nav + Contact + Mon compte + panier) est déjà trop large pour la largeur disponible.

**Correction** : remontée du point de bascule à `lg:` (1024px) sur les 4 endroits qui le pilotaient dans `components/Navbar.tsx` : nav desktop, bloc Contact/Mon compte/panier desktop, bloc panier+burger mobile, drawer mobile. Le menu mobile (burger) s'affiche donc désormais jusqu'à 1023px inclus ; le menu desktop complet n'apparaît qu'à partir de 1024px, là où il tient confortablement.

**Vérification visuelle réelle** (Chrome + Playwright, captures dans le scratchpad de session) : 375/430 (menu mobile intact) ; 768 (menu mobile, aucun débordement, testé sur Home, `/prestations/intervention`, `/a-propos`) ; 1024/1440 (menu desktop complet, tout lisible et bien espacé). Confirmé une deuxième fois lors de la vérification de la fiche Project (captures `responsive-*`, `projet-rempli-768-full.png`) : à 768px, l'espace client bascule lui aussi correctement sur le menu mobile, sans troncature.

## Project avant

État constaté par UI-11 (VISUEL CONFIRMÉ) : formulaires bruts, `<details>`/`<summary>` texte brut sans icône ni statut visuel, liste plate de 10 moteurs sans regroupement, section "Informations retenues" en simple liste de lignes texte, aucune continuité visuelle avec `/outils`.

## Project après

- **`components/customer/dashboard/engines/EngineModuleShell.tsx`** (nouveau) : coquille `<details>` accessible reprenant icône + titre + badge de statut + aperçu de résultat (ou description) dans l'en-tête, description complète + contenu réel du module une fois ouvert.
- **`components/customer/dashboard/engines/icons.tsx`** (nouveau) : 11 icônes SVG inline sobres (trait fin, `currentColor`, aucune image générée) — une par moteur + une pour la famille "Distribution" + le chevron d'expansion.
- **`lib/engine-payload.ts`** (étendu, UI seulement) : `ENGINE_DESCRIPTIONS` (texte déplacé tel quel depuis chaque module, source unique), `ENGINE_FAMILIES` (regroupement Énergie/Distribution, affichage seulement — `ENERGY_CHAIN`/`CIRCUIT_CHAIN` restent la structure fonctionnelle réelle, inchangée), `ENGINE_PRIMARY_VALUE_KEY` (clé à prévisualiser par moteur à entrée fixe).
- **`lib/retained-value-labels.ts`** (étendu) : `formatRetainedValueDisplay(value, key?)` — formatteur présentationnel qui devine une unité lisible (Wh, Ah, A, W, %, j, h) à partir du nom du champ déjà renvoyé par le moteur ; une table `PREFERRED_FIELD` explicite gère les 3 clés dont la valeur porte plusieurs champs numériques (`energy.dailyConsumption`, `battery.nominalCapacity`, `battery.autonomy`), vérifiées directement dans le code source de chaque moteur (`lib/engines/*.ts`) avant d'écrire cette table — aucune valeur n'est recalculée.
- **Les 10 fichiers `components/customer/dashboard/engines/*Module.tsx`** : la carte (`Card`/titre/description) qu'ils dessinaient eux-mêmes a été retirée — ils ne rendent plus que leur formulaire, leur résultat et leur `EngineActionBar`, encapsulés désormais par `EngineModuleShell` depuis la page. Pour les 4 modules de la chaîne Distribution qui avaient un état "prérequis manquant" avec leur propre carte (`CableModule`, `ProtectionModule`, `DiagramModule` déjà cette forme ; `CircuitModule` avait un texte dynamique intégré à sa description), ce texte de prérequis est conservé tel quel, simplement sans la carte englobante redondante.
- **`app/mon-compte/projets/[projectId]/page.tsx`** : réécrit pour composer la nouvelle hiérarchie — carte d'identité (nom, univers, tension, statut, bandeau "prochaine action" dérivé honnêtement de l'état réel : valeur obsolète en priorité, sinon premier module incomplet, sinon "Tous les modules sont à jour"), bandeau "À faire maintenant" inchangé dans sa logique, bandeau Calculer/Retenir compacté avec un emplacement visuel neutre réservé à une future Volta, section "Informations retenues" en grille de cartes avec valeur chiffrée, puis les deux familles de moteurs (en-tête avec icône ronde + "X/N modules retenus") contenant chacune ses `EngineModuleShell`.

Aucune des 10 formules, aucun appel `EngineRunner`, aucun payload envoyé à `/api/projects/[projectId]/engines/[engineId]/run` n'a été modifié — vérifié par lecture avant/après de chaque fichier de module et confirmé par les 872 tests (qui couvrent notamment `lib/engines/*` et le runner) toujours au vert.

## Hiérarchie moteurs

Regroupement en deux familles visuelles, chacune avec un en-tête (icône ronde + libellé + compteur "X/N modules retenus" dérivé des statuts déjà calculés) :

- **Énergie** : Énergie/consommations → Batterie → Alternateur → Solaire → Chargeur → Bilan énergétique (ordre inchangé, `ENERGY_CHAIN`).
- **Distribution** : Circuits → Câbles → Protections → Schéma (ordre inchangé, `CIRCUIT_CHAIN`, renommé "Distribution" à l'affichage pour éviter la confusion avec le mot "Circuit" utilisé aussi comme nom de moteur individuel).

Chaque carte moteur affiche, sans avoir besoin de l'ouvrir : icône, nom, badge de statut (À compléter / Retenu / À recalculer — les 3 seuls statuts réellement calculés par `moduleStatus()`, aucun statut inventé), et un aperçu de résultat quand disponible (valeur retenue formatée pour les moteurs à clé fixe, comptage pour Distribution qui utilise des clés dynamiques `circuit.<id>`/`cable.<id>`/etc.).

## Formulaires

Aucun champ, aucun label, aucune validation modifiés. Seul changement : les formulaires ne portent plus leur propre titre/description (désormais dans l'en-tête de `EngineModuleShell`), ce qui supprime une répétition visuelle (titre en double une fois la carte ouverte) présente dans l'ancienne version.

## Valeurs retenues

Passée d'une liste de lignes texte (`<div className="flex items-center justify-between">`) à une grille de cartes 2 colonnes (1 colonne en mobile) où la valeur chiffrée est mise en avant en grand (`text-lg font-semibold`) sous le libellé humain, avec le badge de statut et — si obsolète — la cause déjà calculée par `obsolescenceCause()` (inchangée). Aucune clé technique interne n'est jamais affichée (règle déjà respectée par `getRetainedValueLabel`, reprise telle quelle).

**Limite assumée** : le formatteur de valeur (`formatRetainedValueDisplay`) ne sait afficher qu'un champ numérique par valeur retenue (le champ le plus représentatif pour les 3 clés à champs multiples identifiées ; le seul champ numérique pour les autres). Les valeurs à plusieurs champs numériques sans entrée dans `PREFERRED_FIELD` s'afficheraient sans valeur chiffrée (juste le libellé + badge) — aucun cas de ce type n'existe aujourd'hui dans les 10 moteurs réels (vérifié en lisant chaque `retainedValues: EngineRetainedValueProposal[]` des fichiers `lib/engines/*.ts`), mais un futur 11ᵉ moteur à sortie multi-champs devra étendre cette table pour garder un affichage chiffré.

## États

Réutilise exclusivement les 3 statuts déjà calculés par le code existant (`moduleStatus()` : À compléter / Retenu / À recalculer) et les 2 statuts déjà affichés sur les valeurs retenues individuelles (Retenu / À recalculer). Aucun nouveau statut métier introduit. La couleur (vert/orange/gris) accompagne toujours un libellé textuel — jamais seule (`Badge` déjà conforme, réutilisé tel quel).

## Mobile

Vérifié réellement à 375 et 430px (Chrome + Playwright, `deviceScaleFactor: 2` pour un rendu net) : sidebar `/mon-compte` réduite en rangée d'onglets horizontaux (comportement déjà existant, non modifié), grille "Informations retenues" en 1 colonne, formulaires de chaque module déjà en 1 colonne (`sm:grid-cols-*` déjà présent dans le code d'origine, non touché), cartes modules pleine largeur avec icône/titre/statut qui ne se chevauchent jamais, aucun tableau horizontal, boutons "Calculer"/"Utiliser pour mon projet" pleine taille. Aucun accordéon supplémentaire ajouté au-delà des `<details>` déjà natifs de chaque carte module.

## Loading states

6 nouveaux fichiers `loading.tsx` + `components/ui/Skeleton.tsx` (`SkeletonLine`, `SkeletonBlock`, `SkeletonCard`, factorisés pour éviter de dupliquer le motif) :

| Route | Fichier |
|---|---|
| `/mon-compte` | `app/mon-compte/loading.tsx` |
| `/mon-compte/projets` | `app/mon-compte/projets/loading.tsx` |
| `/mon-compte/projets/[projectId]` | `app/mon-compte/projets/[projectId]/loading.tsx` |
| `/mon-compte/achats` | `app/mon-compte/achats/loading.tsx` |
| `/mon-compte/profil` | `app/mon-compte/profil/loading.tsx` (ajouté après vérification que la page fait bien un fetch Prisma avant rendu) |
| `/boutique/[slug]` | `app/boutique/[slug]/loading.tsx` |

`app/outils/*` (5 pages calculateur) volontairement non touché : vérifié que ce sont des Server Components synchrones sans fetch bloquant, qui délèguent au Client Component calculateur — un `loading.tsx` n'y aurait aucun effet réel.

Le squelette de la fiche Project (écrit par l'agent avant la refonte visuelle) a été réaligné après coup pour reprendre la structure réelle post-UI-12 : carte d'identité, grille de valeurs retenues, puis deux sections famille (icône ronde + compteur + N cartes module), plutôt que l'ancienne liste plate.

**Limite honnête signalée par l'agent en charge** : en dev local, le fetch serveur est souvent trop rapide pour qu'un `loading.tsx` reste visible assez longtemps pour une capture d'écran propre ; l'agent a néanmoins observé un vrai état de chargement sur `/boutique/[slug]` et confirmé via `npm run build` que chaque route génère bien son propre chunk `loading-*.js` distinct — preuve que le câblage Suspense est correct indépendamment du timing dev.

## Intervention

`components/services/JeConfie.tsx` : le bouton "Voir mes réalisations →" (`href="/realisations"`, `variant="tertiary"`) a été retiré. Le bouton "Parler de mon projet" et le reste de la section (photo, bloc "Fabien — FabSystem") restent inchangés. La route `/realisations` (`app/realisations/page.tsx`) n'a pas été touchée et reste accessible (toujours listée dans `app/vcard/page.tsx` et le sitemap) — seule sa promotion depuis Intervention a été retirée, conformément à la mission.

## À propos

`app/a-propos/page.tsx` : import et usage de `<ServiceAssurance />` retirés, avec le conteneur qui l'enveloppait. Le composant `components/ServiceAssurance.tsx` lui-même n'a pas été modifié et reste utilisé sur `/contact` (vérifié : toujours importé et rendu à cet endroit).

## Captures comparatives

Captures réelles prises via Chrome + Playwright (scratchpad de session, non versionnées) :
- Navbar : `home`/`prestations-intervention`/`a-propos` à 375/430/768/1024/1440.
- Project : `projet-vide`, `projet-rempli`, `projet-obsolete` × 6 breakpoints (375/430/768/1024/1440/1920), plus des captures rapprochées (`deviceScaleFactor: 2`) de l'en-tête et des cartes module en desktop et mobile.
- Comparaison directe avec `/outils` (déjà vérifiée dans UI-11) : même famille de carte (icône + badge + description courte + action), même palette noir/blanc/gris/jaune, mêmes rayons et ombres (`rounded-card`/`shadow-card` réutilisés tels quels depuis `components/ui/Card.tsx`).
- Scénario "valeur obsolète" recréé avec une vraie dépendance (`ProjectValueDependency`) en base locale : le bandeau "Prochaine action : Recalculer les valeurs devenues obsolètes.", le badge orange "À recalculer" sur la carte module concernée et la cause textuelle sous la valeur retenue s'affichent tous correctement et de façon cohérente entre eux.

## Tests

- `npx tsc --noEmit` : 0 erreur (les ~121 erreurs "Prefetch" génériques observées à un moment par les deux agents dans `.next/types/` étaient un artefact de génération de types transitoire, disparu après reconstruction — confirmé propre lors de la validation finale groupée).
- `npm test` : 872/872, 0 échec.
- `npm run build` : succès complet, toutes les routes (dont les 6 nouvelles `loading.tsx` et `/mon-compte/projets/[projectId]` refondue) compilées sans erreur.
- Aucune assertion de test modifiée pour faire passer la suite.

## Fichiers modifiés

Modifiés :
- `components/Navbar.tsx`
- `components/services/JeConfie.tsx`
- `app/a-propos/page.tsx`
- `app/mon-compte/projets/[projectId]/page.tsx`
- `lib/engine-payload.ts`
- `lib/retained-value-labels.ts`
- `components/customer/dashboard/engines/{Energy,Battery,Alternator,Solar,Charger,EnergyBalance,Circuit,Cable,Protection,Diagram}Module.tsx` (10 fichiers, retrait de la carte/titre/description propre à chacun)

Créés :
- `components/customer/dashboard/engines/EngineModuleShell.tsx`
- `components/customer/dashboard/engines/icons.tsx`
- `components/ui/Skeleton.tsx`
- `app/mon-compte/loading.tsx`
- `app/mon-compte/projets/loading.tsx`
- `app/mon-compte/projets/[projectId]/loading.tsx`
- `app/mon-compte/achats/loading.tsx`
- `app/mon-compte/profil/loading.tsx`
- `app/boutique/[slug]/loading.tsx`

Non modifiés (vérifié) : tout `lib/engines/*`, `lib/engines/runner.ts`, toutes les routes `app/api/**`, `prisma/schema.prisma`, `components/outils/**`, `/prestations` (page d'orientation), `/prestations/accompagnement`, `/boutique` (hub), `/formations`, `/contact`, Home.

## Arbitrages

- **Regroupement en 2 familles plutôt que 10 cartes à plat** : choisi pour donner une lecture immédiate de la progression par domaine (mission §5), au prix d'un niveau de hiérarchie visuelle supplémentaire — jugé justifié vu le nombre de moteurs (10) et cohérent avec le découpage fonctionnel déjà réel (`ENERGY_CHAIN`/`CIRCUIT_CHAIN`).
- **`<details>` natif conservé** (au lieu d'un composant accordéon custom en JS) : accessible clavier/lecteur d'écran sans coût de développement supplémentaire, cohérent avec le choix déjà fait par la version précédente de la page.
- **Formatteur de valeur par heuristique de nom de champ + table d'exceptions explicite**, plutôt qu'un mapping exhaustif clé-par-clé pour les 25 clés fixes : réduit la surface de maintenance (une seule fonction générique + 3 exceptions documentées) au prix d'un risque résiduel si un futur moteur introduit un nom de champ ambigu — jugé acceptable et documenté comme limite assumée plutôt que masqué.
- **Emplacement Volta préparé mais vide** : un petit cercle neutre "i" dans le bandeau Calculer/Retenir marque l'endroit prévu pour UI-13, plutôt que de laisser cette décision totalement ouverte — décision de composition réversible, aucune dépendance créée.
- **Squelette de la fiche Project réaligné après la refonte** plutôt que laissé tel quel : la mission demande explicitement que les skeletons reprennent la structure réelle ; comme l'agent loading avait travaillé en parallèle de la refonte (avant qu'elle soit terminée), un réalignement manuel était nécessaire pour rester honnête.

## Restes éventuels avant Volta

- Le formatteur de valeur (`formatRetainedValueDisplay`) devra être étendu avec une nouvelle entrée dans `PREFERRED_FIELD` si un futur moteur retourne une valeur à plusieurs champs numériques sans champ "évident".
- La dette de composants dupliqués identifiée par UI-11 (motif carte manuel dans ~30 endroits, motif "eyebrow" à au moins 4 variantes) n'a volontairement pas été traitée ici (mission §16 : ne pas factoriser maintenant) — reste disponible pour une Passe B ultérieure.
- Le bandeau Calculer/Retenir porte désormais un emplacement visuel prêt pour Volta (icône ronde "i" neutre) : UI-13 peut y substituer une vraie mascotte sans changement de structure.
- Aucun blocage identifié pour démarrer UI-13.
