# UI-5.1 — Correction de l'erreur serveur production sur la Boutique

**Statut :** Corrigé — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Fichier modifié :** `lib/server/customer-session.ts` (une seule fonction, `getCustomerSessionFromCookie`).

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

## Validation production

- Confirmation directe par requête SQL en lecture seule sur la base de
  production (`information_schema.columns`, `_prisma_migrations`) : `origin`
  absente de `Customer`, `CustomerCapability` absente, dernière migration
  appliquée `20260807070850_add_testimonial`.
- `npx tsc --noEmit` : aucune erreur (hors artefacts `.next/dev/types`
  déjà connus, sans rapport).
- `npm test` : 844/844 tests passants, aucune régression.
- `npm run build` : build de production réussi.
- Reproduction en environnement équivalent production : build local +
  `npm start` avec le `DATABASE_URL` de production réel (lecture seule),
  requête `/boutique` avec et sans cookie de session — 200 dans les deux
  cas après correction. La reproduction exacte du `P2022` (qui exige un
  jeton de session réellement actif en base) n'a pas été rejouée à
  l'identique pour ne pas créer de session de test en production ; la
  correction a été validée par lecture directe du code du `catch` (couvre
  bien tout `PrismaClientKnownRequestError`, qui n'est pas un `HttpError`)
  et par la confirmation SQL de la cause réelle.
- Non exécuté par cette mission, à faire séparément par décision explicite
  du propriétaire du projet : appliquer les migrations manquantes à la
  production (`prisma migrate deploy` avec le `DATABASE_URL` de
  production). **Attention** : `20260807190259_drop_legacy_ebook_order`
  supprime la table `EbookOrder` — à vérifier qu'elle est bien vide/obsolète
  avant d'appliquer cette migration en production. Cette action n'a pas été
  effectuée par cette mission (mutation de base de données de production,
  hors périmètre "correction minimale de la Boutique", et le patron établi
  sur ce projet est que ces actions sont lancées manuellement par le
  propriétaire).

## Fichiers modifiés

- `lib/server/customer-session.ts` — `getCustomerSessionFromCookie()` :
  dégrade en "non connecté" + log au lieu de relancer une erreur
  inattendue.
