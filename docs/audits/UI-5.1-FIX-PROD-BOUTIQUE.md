# UI-5.1 — Correction de l'erreur serveur production sur la Boutique

**Statut :** Corrigé et base de production remise en cohérence — aucun commit supplémentaire tant que la validation ci-dessous n'était pas terminée (elle l'est désormais).
**Fichiers modifiés :** `lib/server/customer-session.ts`, `app/boutique/page.tsx`, `app/boutique/[slug]/page.tsx` (voir "Décision sur le fallback session" pour le détail du second passage).
**Action production effectuée :** `npx prisma migrate deploy` contre la base de production (3 migrations pending appliquées, aucune nouvelle migration créée).

## Symptôme

En production, `/boutique` retournait une page d'erreur générique Next.js
("This page couldn't load — A server error occurred. Reload to try again.")
avec un digest, pour une partie des visiteurs. Le build local (`npm run
build`) et les tests (`npm test`, 844/844) étaient verts avant déploiement.

Reproduction ciblée :

- `/boutique` : plantait en production pour tout visiteur porteur d'un
  cookie de session client existant (`fabsystem_customer_session`) pointant
  vers une session réellement active en base.
- `/boutique/ebook-electricite-van` et `/boutique/ebook-electricite-bateau`
  ne présentaient **pas** ce symptôme dans les logs observés (voir "Cause
  exacte" — ils empruntent le même code que la fiche produit d'avant UI-5,
  donc le même risque existe en théorie, mais aucune occurrence n'a été
  vue dans la fenêtre de logs consultée).
- Visiteur non connecté (aucun cookie) : aucun problème, `/boutique` et les
  deux fiches répondaient 200.

## Cause exacte

**Ce n'est pas un bug de logique introduit par le code de UI-5.** C'est une
dérive de schéma entre le code déployé et la base de données de
production : trois migrations Prisma déjà committées dans le dépôt
n'avaient jamais été appliquées à la base de production —

```
20260807190259_drop_legacy_ebook_order
20260810180645_add_customer_origin_and_capabilities
20260810182640_add_project_foundation
```

Confirmé par requête directe (lecture seule) sur la base de production :

- Colonnes réelles de `Customer` en production : `id, name, email, phone,
  address, createdAt, updatedAt, assetType, assetBrand, assetModel,
  registration, odometerKm, engineHours, lastLoginAt, status` — **`origin`
  est absente**, alors que `prisma/schema.prisma` la déclare (ajoutée par
  `20260810180645_add_customer_origin_and_capabilities`).
- `CustomerCapability` : table absente en production (`to_regclass`
  retourne `null`), alors que le Prisma Client généré au build la connaît.
- Dernière migration réellement appliquée en production :
  `20260807070850_add_testimonial` (07/08). Les trois migrations listées
  ci-dessus, plus récentes, ne sont jamais montées.

Explication du mécanisme de déploiement : `package.json` définit
`"build": "prisma generate && next build --webpack"` — **il n'y a pas de
`prisma migrate deploy` dans le build Vercel**. Les migrations doivent donc
être appliquées manuellement à la base de production (déjà le
fonctionnement observé sur ce projet : le script `seed-prestations-packs.ts`
avait été lancé manuellement après déploiement). `prisma generate` régénère
un client qui connaît `Customer.origin`, alors que la table réelle ne l'a
pas encore — d'où l'échec au premier `include: { customer: true }` en base.

Le point de code touché : `getCustomerSession()`
(`lib/services/customer-auth.ts`) exécute
`prisma.customerSession.findUnique({ where: { sessionTokenHash },
include: { customer: true } })`. Le `include` matérialise toutes les
colonnes du modèle `Customer` généré, dont `origin` — absente en base — ce
qui fait échouer la requête entière avec `P2022`.

Ce point de code existait **avant** UI-5 (déjà utilisé par l'ancienne
fiche produit `/boutique/[slug]`). UI-5 a changé l'exposition, pas la
cause : le hub `/boutique` n'appelait auparavant jamais
`getCustomerSessionFromCookie()` (aucune notion de "produit déjà possédé"
sur la grille avant UI-5). UI-5 a ajouté cet appel sur `/boutique` pour
afficher "Déjà dans votre bibliothèque" sur les cartes (objectif #2 de la
mission UI-5). Résultat : un visiteur avec un cookie de session valide, qui
auparavant ne déclenchait cette requête que sur la fiche produit, la
déclenche désormais aussi sur le hub — élargissant la fenêtre d'exposition
à un bug d'infrastructure préexistant.

## Stack trace utile

Récupérée via `vercel logs https://www.fabsystem.fr` (déploiement de
production du commit `04742fb`) :

```
error  λ GET /boutique
prisma:error  Invalid `prisma.customerSession.findUnique()` invocation:
  The column `(not available)` does not exist in the current database.
Error [PrismaClientKnownRequestError]:
  Invalid `prisma.customerSession.findUnique()` invocation:
  The column `(not available)` does not exist in the current database.
    at async Object.getCustomerSession (.next/server/chunks/2367.js:1:5893)
    at async j (.next/server/chunks/2367.js:1:481)
    at async v (.next/server/app/boutique/page.js:1:17265)
    at async w (.next/server/app/boutique/page.js:1:17811)
{
  code: 'P2022',
  meta: {
    modelName: 'CustomerSession',
    driverAdapterError: Error [DriverAdapterError]: ColumnNotFound
  },
  clientVersion: '6.19.2',
  digest: '1239962557'
}
```

7 occurrences de cette exact trace observées sur `/boutique` dans la
fenêtre de logs consultée (~10 minutes), aucune sur `/boutique/[slug]`,
`/mon-compte`, `/prestations`, `/`, `/api/cart` dans cette même fenêtre —
les erreurs `error` visibles sur ces autres routes dans les logs sont un
avertissement SSL du driver `pg` (niveau de log `error` par le runtime, pas
une exception — vérifié : aucune stack trace associée), sans rapport avec
ce bug.

## Correction

Fichier modifié : `lib/server/customer-session.ts`,
fonction `getCustomerSessionFromCookie()` (seule fonction changée).

Avant : le `catch` ne traitait que les `HttpError` 404/409 (session
introuvable/expirée — état normal déjà géré) et **relançait** toute autre
erreur, y compris une erreur d'infrastructure/DB inattendue — faisant
planter toute la page qui l'appelle.

Après : toute erreur qui n'est pas un `HttpError` 404/409 attendu est
journalisée (`logServerEvent("error", ...)`, sans supprimer la visibilité
du problème) puis traitée comme "pas de session valide" (retour `null`) —
la page se comporte comme pour un visiteur non connecté au lieu de
planter.

```ts
try {
  return await getCustomerSession(sessionToken);
} catch (error) {
  if (isHttpError(error) && (error.status === 404 || error.status === 409)) {
    return null;
  }

  // Une session invalide/expirée est un état normal (géré ci-dessus via
  // isHttpError). Une erreur infra/DB inattendue ici (ex. dérive de
  // schéma) ne doit jamais faire planter une page publique qui ne fait
  // que vérifier "le visiteur est-il connecté ?" — on dégrade en visiteur
  // anonyme et on journalise pour ne pas masquer le problème réel.
  logServerEvent("error", "customer session lookup failed unexpectedly", {
    error: error instanceof Error ? error.message : String(error),
  });
  return null;
}
```

Pourquoi ce point précis et pas un correctif dispersé dans
`app/boutique/**` : `getCustomerSessionFromCookie()` est le point d'entrée
partagé utilisé par `/boutique`, `/boutique/[slug]`, `/mon-compte` et
`/commande/merci`. Un correctif localisé uniquement dans les pages Boutique
aurait laissé `/mon-compte` exposé au même risque de plantage pour la même
cause. Corriger la fonction partagée résout la cause à la racine, une
seule fois, sans dupliquer de logique — c'est le changement le plus
minimal qui couvre réellement le risque décrit par la mission ("Une
absence normale de session... ne doit jamais provoquer une exception
500").

Ce qui n'a **pas** été fait, conformément aux contraintes de la mission :

- Aucune migration Prisma créée ou appliquée à la production.
- Aucun `try/catch` global masquant toutes les erreurs de la page.
- Aucune fonctionnalité de UI-5 retirée (le statut "Déjà dans votre
  bibliothèque" reste affiché normalement dès que la session se résout
  correctement ; il se dégrade simplement en "non connecté" si la
  vérification échoue pour une cause infra, plutôt que de faire planter
  toute la page).
- Aucun changement Stripe, prix ou produit.

## Pourquoi le local passait

En local, `DATABASE_URL` pointe vers une base de développement/Neon
différente, sur laquelle `npx prisma migrate dev` (ou un déploiement
manuel antérieur) avait déjà appliqué l'intégralité des migrations
présentes dans `prisma/migrations/`, `origin` et `CustomerCapability`
compris. `prisma generate` produit donc un client cohérent avec la base
locale : aucune requête `include: { customer: true }` n'échoue en local,
quel que soit le chemin de code emprunté. Le build (`next build`) ne se
connecte pas à la base pour ces pages `dynamic = "force-dynamic"` (rendu à
la requête, pas au build) : `npm run build` ne pouvait donc de toute façon
pas détecter une dérive de données de production. `npm test` mocke les
services Prisma (pas de connexion réelle) et n'aurait de toute façon pas pu
révéler une dérive spécifique à l'environnement de production.

## Validation production (état à l'issue de la première passe, avant migration)

- Confirmation directe par requête SQL en lecture seule sur la base de
  production (`information_schema.columns`, `_prisma_migrations`) : `origin`
  absente de `Customer`, `CustomerCapability` absente, dernière migration
  appliquée `20260807070850_add_testimonial`.
- `npx tsc --noEmit` : aucune erreur (hors artefacts `.next/dev/types`
  déjà connus, sans rapport).
- `npm test` : 844/844 tests passants, aucune régression.
- `npm run build` : build de production réussi.
- La migration de production n'avait délibérément **pas** été appliquée à
  ce stade (mutation de base de données hors périmètre du correctif
  minimal initial) — voir sections suivantes pour la suite (mission
  UI-5.1 FINAL).

---

# Vérification EbookOrder

Avant d'exécuter `20260807190259_drop_legacy_ebook_order`, vérification en
lecture seule sur la base de production :

- **Existence** : la table `EbookOrder` existe bien en production.
- **Colonnes** : `id, email, name, stripeSessionId, stripePaymentIntentId,
  status, desktopBlobPath, pocketBlobPath, failureReason, createdAt,
  updatedAt, downloadCount, emailSentAt, emailError` — le modèle legacy de
  livraison d'ebook (pré-catalogue `Product`/`Order`/`DownloadGrant`).
- **Nombre de lignes** : 2.
- **Contenu réel des 2 lignes** : les deux `stripeSessionId` commencent par
  `cs_test_` (mode **test** Stripe, jamais du live), et les deux lignes
  portent le même `email: fabien.lages@gmail.com` (compte du propriétaire
  du projet) — des essais de développement, pas des commandes clients
  réelles.
- **Usage résiduel dans le code actuel** : recherche exhaustive
  (`grep -rn "EbookOrder"` sur `app/`, `components/`, `lib/`, en excluant
  `lib/generated/prisma` et `prisma/migrations`) → **aucune occurrence**.
  Le modèle avait déjà été retiré de `prisma/schema.prisma` par le commit
  `ac28a9a` ("chore: retire la route /visio et le modele Prisma legacy
  EbookOrder"), antérieur à cette mission — la migration ne fait
  qu'aligner la base sur un schéma déjà décidé et déployé en code depuis
  longtemps.

**Conclusion : `EbookOrder` est confirmée obsolète.** Aucun code actif n'y
accède, ses seules données sont des artefacts de test Stripe appartenant
au propriétaire du projet. La migration destructive a été exécutée.

# Migrations appliquées

Commande utilisée (procédure normale, aucune migration créée, aucun SQL
manuel, aucun `migrate dev`/`db push`) :

```
npx prisma migrate deploy
```

exécutée avec `DATABASE_URL` de production (récupérée via
`vercel env pull --environment=production`, jamais committée). Note
technique : `DIRECT_URL` telle que stockée dans Vercel contient une valeur
factice (`postgresql://...@host/db`, littéralement des points de
suspension) — `prisma.config.ts` utilise `DIRECT_URL ?? DATABASE_URL`, il a
donc fallu explicitement forcer `DIRECT_URL=DATABASE_URL_UNPOOLED` (la
vraie URL non poolée, également présente dans les variables d'env Vercel)
pour que le CLI Prisma s'authentifie correctement. Cela n'affecte pas
l'application en production (le runtime Next.js utilise directement
`DATABASE_URL` via l'adapter `pg`, jamais `DIRECT_URL`).

Résultat :

```
Applying migration `20260807190259_drop_legacy_ebook_order`
Applying migration `20260810180645_add_customer_origin_and_capabilities`
Applying migration `20260810182640_add_project_foundation`

All migrations have been successfully applied.
```

# État final Prisma production

Vérifié en lecture seule après application :

- `npx prisma migrate status` → **"Database schema is up to date!"**
- `Customer` porte désormais la colonne `origin`.
- `CustomerCapability` existe (`to_regclass` renvoie la table).
- `Project` existe (table créée par `add_project_foundation`).
- `EbookOrder` n'existe plus (`to_regclass` renvoie `null`).
- `_prisma_migrations` : les 3 migrations apparaissent avec un
  `finished_at` réel (11/08, ~11:00 UTC), aucune migration réellement
  pending (la seule ligne "non finished" restante dans la table
  d'historique est l'entrée `rolled_back_at` déjà présente avant cette
  mission pour `20260806150000_normalize-customer-for-client-auth`,
  correctement réappliquée juste après le 06/08 — non liée à cette
  mission, confirmée sans impact par `prisma migrate status` lui-même).

# Décision sur le fallback session

Réexamen de `getCustomerSessionFromCookie()` (première passe UI-5.1) à la
lumière de la règle donnée : une page **publique à personnalisation
facultative** peut dégrader en visiteur anonyme + log ; une page
**authentifiée** ne doit jamais confondre une panne infra avec "non
connecté", sous peine de masquer un vrai incident derrière une simple
déconnexion.

Audit de tous les appelants de `getCustomerSessionFromCookie` :

| Appelant | `null` → | Catégorie |
|---|---|---|
| `app/boutique/page.tsx` | personnalisation facultative (badge "possédé") | publique/facultative |
| `app/boutique/[slug]/page.tsx` | idem | publique/facultative |
| `app/commande/merci/page.tsx` | personnalisation facultative (`hasMatchingCustomerSession`), page fonctionne sans session via le numéro de commande | publique/facultative |
| `app/mon-compte/page.tsx` | `redirect("/connexion-client")` | **authentifiée** |
| `app/api/client-auth/me/route.ts` | `throw unauthorized(...)` | **authentifiée** |
| `app/api/downloads/[grantId]/route.ts` | `redirect("/connexion-client")` | **authentifiée** |
| `lib/server/project-actor.ts` (`requireCustomerActor`) | `throw unauthorized(...)` | **authentifiée** |

Décision : la fonction partagée `getCustomerSessionFromCookie()` **revient
à son comportement strict d'origine** — seules les `HttpError` 404/409
(session introuvable/expirée/révoquée, des états réellement normaux) sont
absorbées ; toute autre erreur est **propagée**, pour que `/mon-compte`,
les routes API et `requireCustomerActor()` échouent bruyamment plutôt que
de traiter silencieusement un client réellement connecté comme déconnecté
pendant un incident.

Une nouvelle fonction dédiée, `getCustomerSessionFromCookieOrAnonymous()`,
enveloppe la première et absorbe *toute* erreur restante en la
journalisant puis en retournant `null` — réservée aux pages où l'absence
de session n'empêche jamais la page de fonctionner. Seuls
`app/boutique/page.tsx` et `app/boutique/[slug]/page.tsx` l'utilisent
désormais (portée strictement limitée au périmètre de cette mission ;
`commande/merci`, bien que de la même catégorie, n'a pas été touché car
hors périmètre explicite de UI-5/UI-5.1 et sans incident observé — à
traiter séparément si besoin).

Changement minimal : 2 imports changés (`app/boutique/page.tsx`,
`app/boutique/[slug]/page.tsx`), 1 fonction ajoutée dans
`lib/server/customer-session.ts`, 0 ligne changée dans les appelants
authentifiés.

# Validation réelle production

Après déploiement de la migration (le correctif de code affiné ci-dessus
est validé localement mais pas encore déployé — voir note) :

- `curl` direct sur `https://www.fabsystem.fr` :
  - `/` → 200
  - `/boutique` → 200
  - `/boutique/ebook-electricite-van` → 200
  - `/boutique/ebook-electricite-bateau` → 200
  - `/prestations` → 200
  - `/mon-compte` (sans cookie) → 307 vers `/connexion-client` (comportement attendu, pas une erreur)
- `vercel logs https://www.fabsystem.fr` (fenêtre glissante post-migration) :
  **0 occurrence de `P2022`**. Les seules lignes de niveau `error`
  restantes sont l'avertissement de dépréciation SSL du driver `pg`
  (aucune stack trace associée, sans rapport avec ce bug — déjà présent
  avant et après, cosmétique côté logs Vercel).
- Session client réellement valide : non testée directement contre la
  base de production (aurait nécessité de créer une session de test dans
  les données réelles) ; validée indirectement — la cause racine (colonne
  manquante) n'existe plus, et le code du `catch` dans les deux variantes
  a été relu ligne à ligne pour confirmer le comportement attendu.
- `npx tsc --noEmit` : aucune erreur.
- `npm test` : 844/844 tests passants.
- `npm run build` : build de production réussi.

**Note de séquencement** : la vérification `curl`/`vercel logs`
ci-dessus porte sur le déploiement déjà en production au moment de la
migration (commit `0fe2961`, qui contenait déjà le correctif générique de
la première passe UI-5.1). Le raffinement du fallback (séparation
stricte/anonyme) documenté dans "Décision sur le fallback session" est un
changement de code local à ce stade, validé par `tsc`/tests/build mais pas
encore par une requête HTTP réelle post-déploiement — il sera vérifié au
prochain déploiement.

## Fichiers modifiés

- `lib/server/customer-session.ts` — `getCustomerSessionFromCookie()`
  restaurée à son comportement strict (ne masque plus les erreurs
  inattendues) ; nouvelle fonction
  `getCustomerSessionFromCookieOrAnonymous()` pour les pages publiques à
  personnalisation facultative.
- `app/boutique/page.tsx`, `app/boutique/[slug]/page.tsx` — utilisent
  désormais `getCustomerSessionFromCookieOrAnonymous()`.
- Base de données de production : 3 migrations Prisma déjà committées
  appliquées via `prisma migrate deploy` (aucune migration créée).
