# UI-4.1-NOMS-ACCOMPAGNEMENTS — Alignement des noms commerciaux par univers

**Date : 22/08/2026**
**Périmètre : correction ciblée de l'affichage des noms commerciaux des quatre paliers d'accompagnement (Amarrage/Cap/Passerelle/Grand Large et leurs équivalents Van/Camping-car), conformément à MASTER-08-ACCOMPAGNEMENT.md §5. Aucune API, moteur, Prisma, Dashboard, espace client, prix, période ou entitlement modifié. Aucun produit Stripe touché.**

**Documents lus** : `docs/masters/MASTER-08-ACCOMPAGNEMENT.md`, `docs/masters/MASTER-12-DESIGN-SYSTEM.md`, `docs/audits/UI-4-SERVICES-UNIVERS.md` (arbitrage n°2, qui signalait l'écart sans le corriger).

---

# Cause

L'audit UI-4 avait signalé l'écart sans le corriger (hors périmètre de cette phase-là) : le catalogue réel des packs d'accompagnement (`lib/prestations-packs.ts`) utilise un identifiant technique de niveau fonctionnel — `PrestationsPalier = "amarrage" | "cap" | "passerelle" | "grand-large"` — commun aux trois univers (Bateau/Van/Camping-car), ce qui est correct. Le problème se situait dans la **couche d'affichage** :

1. `lib/prestations-packs.ts` : `PALIER_LABELS` était une simple table `Record<PrestationsPalier, string>` (« amarrage » → « Amarrage », etc.) — un seul libellé par palier, **jamais univers-aware**, alors que MASTER-08 §5 exige un libellé distinct par (niveau fonctionnel × univers).
2. `components/prestations/PrestationsDistanceOffers.tsx` (composant réellement affiché sur `/prestations`, section « On fait ensemble ») **n'appelait même pas** `getPalierLabel` : son tableau interne `paliers` codait en dur `name: "AMARRAGE"`, `"CAP"`, `"PASSERELLE"`, `"GRAND LARGE"` — ces quatre chaînes s'affichaient **à l'identique quel que soit l'univers sélectionné** dans le sélecteur Bateau/Van/Camping-car. Un client Van voyait donc « CAP » au lieu de « ITINÉRAIRE », « PASSERELLE » au lieu de « COPILOTE », etc.
3. `lib/services/prestations-notify.ts` (email interne à Fabien lors d'un achat) appelait `getPalierLabel(definition.palier)` — même limite, un seul libellé par palier sans distinction d'univers.

**Ce qui était déjà correct et n'a pas été touché** : les identifiants techniques (`palier: PrestationsPalier`, les slugs produit `pack-<palier>-<categorie>`), les prix (`PRICES_CENTS`), la logique d'éligibilité ebook (`resolveGrantsEbookSlug`) — tous reposent déjà uniquement sur `palier`/`categorie`, jamais sur un libellé affiché. Aucun `if packName === "..."` n'existait nulle part dans le code audité.

---

# Correction

**Une seule source de vérité pour les libellés, univers-aware**, conforme mot pour mot à la matrice MASTER-08 §5 :

```ts
// lib/prestations-packs.ts
const PALIER_LABELS_BY_CATEGORIE: Record<PrestationsCategorie, Record<PrestationsPalier, string>> = {
  bateau: { amarrage: "Amarrage", cap: "Cap", passerelle: "Passerelle", "grand-large": "Grand Large" },
  van: { amarrage: "Départ", cap: "Itinéraire", passerelle: "Copilote", "grand-large": "Roadbook" },
  "camping-car": { amarrage: "Étape", cap: "Feuille de route", passerelle: "Relais", "grand-large": "Carnet de route" },
};

export function getPalierLabel(categorie: PrestationsCategorie, palier: PrestationsPalier) {
  return PALIER_LABELS_BY_CATEGORIE[categorie][palier];
}
```

`getPalierLabel` change de signature (`categorie` devient un paramètre obligatoire) — **changement volontaire et assumé** : un appel qui ne connaît pas l'univers ne peut plus produire un libellé incorrect par omission. Les trois points d'appel existants ont été mis à jour :

1. **`lib/prestations-packs.ts`**, `listPrestationsPackDefinitions()` : `name: \`${getPalierLabel(categorie, palier)} — ${getCategorieLabel(categorie)}\`` (au lieu de `getPalierLabel(palier)`).
2. **`lib/services/prestations-notify.ts`**, `sendPrestationsPackNotification` : `getPalierLabel(definition.categorie, definition.palier)` — l'email interne à Fabien affiche désormais le vrai nom univers-aware.
3. **`components/prestations/PrestationsDistanceOffers.tsx`** — la correction visible :
   - Le champ `name` codé en dur a été **retiré** du tableau `paliers` (qui ne porte plus que l'identifiant technique `id` et le contenu univers-agnostique : sous-titre, points clés, étapes).
   - Le libellé réel est désormais calculé au rendu, pour l'univers sélectionné : `displayName={getPalierLabel(category, palier.id)}`, passé en prop à `PalierCard` et utilisé dans le titre de la carte et dans le message de succès d'ajout au panier (`${displayName} ajouté au panier.`).

**Aucun remplacement naïf** : à aucun moment un texte n'a été substitué directement dans une chaîne affichée sans passer par `getPalierLabel` ; l'identifiant technique `palier.id` (utilisé pour `buildPrestationsPackSlug`, le thème visuel de la carte, la clé React) n'a pas été renommé ni touché.

---

# Modèle de nommage

Le modèle à trois couches déjà en place est confirmé et rendu réellement effectif à l'affichage :

```
nom commercial (affiché)     ←  getPalierLabel(categorie, palier)
        ↑ dérivé de
niveau fonctionnel / palier  ←  "amarrage" | "cap" | "passerelle" | "grand-large"  (identifiant stable, JAMAIS affiché tel quel côté client, sert aux slugs et à la logique d'éligibilité)
        ↑ combiné à
univers                      ←  "bateau" | "van" | "camping-car"
        ↓
capacités / entitlements     ←  hors périmètre de cette correction (aucun entitlement n'existe encore dans ce dépôt pour ces packs — voir Compatibilité)
```

- **`palier`** (`PrestationsPalier`) reste l'identifiant fonctionnel stable et unique — c'est la clé technique qui structure les slugs produits, les prix (`PRICES_CENTS`) et la règle d'éligibilité ebook (`resolveGrantsEbookSlug`). Il n'est **jamais** affiché brut au client (le rendu passe systématiquement par `getPalierLabel`).
- **`categorie`** (`PrestationsCategorie`) reste l'identifiant d'univers stable (`"bateau" | "van" | "camping-car"`), déjà utilisé pour les prix et désormais aussi pour le libellé.
- **Le nom commercial n'est qu'une fonction pure de ces deux identifiants** (`(categorie, palier) → libellé`), jamais l'inverse : aucun code ne part du nom commercial pour retrouver un comportement. Recherche exhaustive effectuée (`grep` sur `"Amarrage"|"Cap"|"Passerelle"|"Grand Large"|"Départ"|...` dans `app/`, `components/`, `lib/`) : aucune occurrence d'un test `if (name === ...)` ou équivalent pilotant une capacité, un prix ou un accès.
- **Capacités/entitlements** : ce dépôt ne possède aujourd'hui aucun moteur d'entitlement pour ces packs (confirmé par MASTER-10 §7 : `Project`/capabilities/accompagnement n'existent pas encore dans le schéma Prisma actuel) — la règle « nom commercial → niveau fonctionnel → capacités » de MASTER-08 §4/§47 est donc respectée par construction : il n'existe simplement rien qui pourrait aujourd'hui coder un droit sur un nom commercial, et cette correction n'introduit aucune nouvelle dépendance de ce type.

---

# Compatibilité commerciale

Vérifié explicitement, aucune régression :

- **Prix inchangés** : `PRICES_CENTS` non touché — les mêmes montants s'affichent pour chaque (univers × palier), avant et après.
- **Slugs produit inchangés** : `buildPrestationsPackSlug(palier, categorie)` non modifié — `pack-amarrage-van`, `pack-cap-bateau`, etc. restent strictement identiques. Aucun risque de rupture avec les `Product.slug` déjà seedés en base.
- **Références produit / Stripe non modifiées** : le catalogue Product/ProductPrice réel (`lib/services/prestations-packs-catalog.ts`, `scripts/seed-prestations-packs.ts`) n'a **pas été exécuté ni modifié** — cette mission n'a touché aucune donnée persistée. **Point important pour la suite** : le champ `Product.name` déjà seedé en base (via `scripts/seed-prestations-packs.ts`, qui consomme `listPrestationsPackDefinitions().name`) reflète encore l'**ancien** libellé incorrect pour Van/Camping-car (ex. `"Cap — Van aménagé"` au lieu de `"Itinéraire — Van aménagé"`), puisque le code du script a été mis à jour mais n'a pas été rejoué contre la base. La page `/prestations` affiche déjà le bon nom (elle ne lit jamais `Product.name` pour ce libellé, elle calcule `getPalierLabel` côté composant), mais le panier/la commande/les emails de confirmation qui liraient `Product.name` directement resteraient incohérents tant que `npx tsx scripts/seed-prestations-packs.ts` n'est pas rejoué. **Ce script n'a pas été exécuté dans cette mission** : c'est une action d'écriture sur une base partagée, hors de ce qu'une correction de code doit déclencher elle-même — à rejouer par Fabien selon la politique de déploiement habituelle (le script est idempotent, déjà conçu pour cela).
- **Panier fonctionnel** : `AddToCartButton` reçoit toujours le même `productId` (issu de `packProductIdBySlug`, lui-même basé sur le slug inchangé) — le flux d'ajout au panier, le Stripe Checkout dynamique (`price_data`) et la commande ne sont affectés que par le texte du message de succès (`${displayName} ajouté au panier.`), jamais par un identifiant.
- **Éligibilité ebook inchangée** : `resolveGrantsEbookSlug` continue de raisonner uniquement sur `palier`/`categorie`, jamais sur un libellé.
- **Aucune capability pilotée par un nom commercial** : confirmé par recherche exhaustive (voir Modèle de nommage) — ce point était déjà vrai avant cette correction et le reste.

---

# Tests

Un test préexistant assertait le **comportement incorrect** et a dû être mis à jour pour refléter le comportement désormais correct :

- `tests/prestations-notify.test.ts` → `sendPrestationsPackNotification includes every pack when multiple are purchased` : l'assertion `assert.match(email?.text ?? "", /Cap/)` pour un item `pack-cap-van` supposait l'ancien libellé univers-agnostique (« Cap » affiché même pour un Van). Corrigée en `assert.match(email?.text ?? "", /Itinéraire/)`, conforme au nom réellement attendu pour Van/Conception. L'autre assertion du même test (`/Amarrage/`, pour `pack-amarrage-bateau`) restait déjà correcte (le nom Bateau/Orientation est inchangé) et n'a pas été modifiée.
- L'autre test de ce fichier (`sends an email with client, pack and form details`, assertion `/Passerelle/`) continue de passer sans modification : cette assertion est satisfaite par le champ `productName` de la fixture de test (donnée de commande simulée, indépendante de `getPalierLabel`), pas par le libellé calculé — vérifié explicitement pour ne pas laisser un test « vert par coïncidence » sans le documenter ici.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 844 / # pass 844 / # fail 0   (1 assertion corrigée, aucun test supprimé)
npm run build             → succès (prisma generate && next build --webpack)
```

Vérification de rendu réelle (serveur de développement, requêtes HTTP réelles) :

```
/prestations?univers=bateau       → AMARRAGE · CAP · PASSERELLE · GRAND LARGE
/prestations?univers=van          → DÉPART · ITINÉRAIRE · COPILOTE · ROADBOOK
/prestations?univers=camping-car  → ÉTAPE · FEUILLE DE ROUTE · RELAIS · CARNET DE ROUTE
```

`npm run lint` reste indisponible pour la même cause préexistante que toutes les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Arbitrages éventuels

1. **`scripts/seed-prestations-packs.ts` mis à jour mais non exécuté.** Le script consomme déjà `listPrestationsPackDefinitions()` (donc les nouveaux libellés corrects) sans qu'aucune ligne de son propre code n'ait dû être modifiée — mais je ne l'ai pas exécuté moi-même, car cela écrirait dans la base réelle connectée à cet environnement (action à effet de bord sur un système partagé). Conformément à la prudence attendue pour ce type d'action, ce point est signalé plutôt qu'exécuté silencieusement — voir Compatibilité commerciale pour le détail exact de ce qui resterait incohérent tant que le script n'est pas rejoué.
2. **`app/boutique/[slug]/page.tsx` non corrigé malgré un écart similaire repéré.** Cette page affiche un texte codé en dur (« pack Cap, Passerelle ou Grand Large ») pour signaler qu'un ebook est inclus dans un pack, sans jamais varier selon l'univers de l'ebook concerné — un symptôme de la même cause racine. Cette mission restreint explicitement le périmètre à « la page Services » et interdit de modifier d'autres pages « sans nécessité » ; corriger ce fichier n'était pas strictement nécessaire à l'objectif validé (afficher les bons noms sur Bateau/Van/Camping-car dans Services) et relève de la Boutique, explicitement hors périmètre. Signalé ici pour une phase future plutôt que corrigé silencieusement en dépassant le périmètre accordé.
3. **`getPalierLabel` : changement de signature plutôt qu'une nouvelle fonction séparée.** Une alternative aurait été de créer `getPalierLabelForCategorie(...)` en laissant `getPalierLabel(palier)` intact (dépréciée). Rejeté : cela aurait laissé une fonction techniquement appelable mais produisant un résultat presque toujours faux (un seul libellé Bateau par défaut), un piège pour un futur appel. Casser la signature à la compilation (TypeScript refuse tout appel non mis à jour) était la garantie la plus sûre qu'aucun appelant existant ou futur n'affiche silencieusement le mauvais nom — les trois points d'appel existants ont tous été corrigés dans la même mission, aucun n'est resté cassé.

---

# Fin — UI-4.1-NOMS-ACCOMPAGNEMENTS / FabSystem
