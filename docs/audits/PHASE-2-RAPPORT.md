# PHASE-2-RAPPORT — Identité client et droits (Couche 2)

**Date : 10/08/2026**
**Périmètre : socle Couche 2 uniquement (origine Customer, capabilities, entitlements, helpers, ownership). Aucun Project, Volta, Accompagnement, Circuit ni interface n'a été développé.**

---

# Modèle de données

Trois évolutions, toutes additives, dans `prisma/schema.prisma`.

## 1. Origine du Customer (MASTER-04 §3-4, MASTER-10 §10-11)

```prisma
enum CustomerOrigin {
  PURCHASE
  ADMIN
}
```

Nouveau champ sur `Customer` :

```prisma
origin CustomerOrigin @default(PURCHASE)
```

+ index `@@index([origin])`.

Ce champ est une **traçabilité**, pas un droit : conformément à MASTER-10 §11 (« Origine du compte ≠ droits du compte »), aucun helper créé dans cette phase ne lit `origin` pour décider d'un accès.

## 2. Capabilities (MASTER-00 §9, MASTER-10 §44-45, MASTER-11 §15-17)

```prisma
enum CapabilityScope {
  CUSTOMER
  PROJECT
}

enum CustomerCapabilityStatus {
  ACTIVE
  REVOKED
}

model CustomerCapability {
  id         String
  customerId String
  customer   Customer                  @relation(..., onDelete: Cascade)
  capability String                    // identifiant fonctionnel libre
  scope      CapabilityScope           @default(CUSTOMER)
  scopeId    String?                   // ex. futur projectId quand scope = PROJECT
  status     CustomerCapabilityStatus  @default(ACTIVE)
  source     String?                   // traçabilité libre, pas de FK vers un modèle absent
  startsAt   DateTime                  @default(now())
  expiresAt  DateTime?
  revokedAt  DateTime?
  createdAt  DateTime                  @default(now())
  updatedAt  DateTime                  @updatedAt
}
```

Choix de conception, justifiés par les MASTER :
- **`capability` est un `String` libre, pas un enum figé.** MASTER-00 §15 et §204 interdisent d'inventer des « identifiants techniques définitifs des entitlements » avant audit/décision explicite. Le modèle est donc générique : il ne préjuge d'aucune liste finale de capacités (accès Projet, accès Fabien, documents chantier, etc. cités par MASTER-00 §9 et MASTER-08 restent des exemples, pas des valeurs codées en dur).
- **`scope`/`scopeId` génériques**, sans relation Prisma vers `Project` (qui n'existe pas). Permet de scoper une capacité au compte (`CUSTOMER`) ou à une ressource future (`PROJECT`) sans introduire de dépendance prématurée — conforme à MASTER-10 §45 (« Droits Projet ≠ droits Customer globaux »).
- **`source` en `String?` libre**, pas de `FK` vers `Order`/`Accompagnement` : ces modèles ne sont pas dans le périmètre de cette phase et ne doivent pas être modifiés (contrainte explicite de la mission). `source` reste disponible pour tracer plus tard l'origine commerciale d'un octroi.
- **`startsAt`/`expiresAt`/`status` séparés** : reproduit le principe MASTER-08 §23 (dates distinctes) et MASTER-10 §48 (une alerte/capacité recalculée plutôt que source de vérité figée), sans introduire l'objet Accompagnement lui-même.
- **Indépendant des produits/Stripe/Project**, comme demandé explicitement par la mission.

---

# Migrations

Une seule migration, entièrement additive :

```
prisma/migrations/20260810180645_add_customer_origin_and_capabilities/migration.sql
```

Contenu : 3 `CREATE TYPE` (enums), 1 `ALTER TABLE "Customer" ADD COLUMN "origin" ... NOT NULL DEFAULT 'PURCHASE'`, 1 `CREATE TABLE "CustomerCapability"`, 5 `CREATE INDEX`, 1 `ADD CONSTRAINT` (FK `CustomerCapability.customerId → Customer.id`, `ON DELETE CASCADE`).

Aucune colonne supprimée, aucune table renommée, aucune contrainte retirée.

**Vérification réelle sur la base de développement locale** (`fabsystem_dev`, générée via `npx prisma migrate dev`, jamais appliquée sur une base de production) :

```
 origin  | count
---------+-------
PURCHASE |     7
```

Les 7 `Customer` déjà existants en dev ont été automatiquement rétro-remplis à `PURCHASE` par le `DEFAULT` de la colonne — **aucune perte de donnée, aucune ligne orpheline**. C'est l'hypothèse la plus honnête disponible : le schéma actuel n'a jamais tracé l'origine avant cette phase, il est donc impossible de reconstituer rétroactivement laquelle de ces 7 fiches provient d'un achat réel ou d'une création manuelle passée. `PURCHASE` est retenu comme valeur par défaut parce que c'est la voie de création très majoritaire du système actuel (voir section Compatibilité). **Ce point est un arbitrage documenté, pas une donnée inventée : il est signalé explicitement ici plutôt que dissimulé.**

`lib/generated/prisma/**` a été régénéré par `prisma generate` (déclenché par `migrate dev`) — fichiers générés automatiquement, aucune édition manuelle.

---

# Services créés

## `lib/services/capabilities.ts` — gestion brute des capabilities

Convention identique aux services existants (`customer-auth.ts`, `order-purge.ts`, `download-access.ts`) : interface `CapabilitiesDb` injectable, fabrique `createCapabilitiesService(db, deps?)` testable, plus fonctions par défaut branchées sur Prisma (`grantCapability`, `revokeCapability`, `listCustomerCapabilities`).

- `grantCapability(input)` — crée une `CustomerCapability` (`scope` par défaut `CUSTOMER`, `status` par défaut `ACTIVE`).
- `revokeCapability(capabilityId)` — passe le statut à `REVOKED` + horodate `revokedAt` ; idempotent si déjà révoquée.
- `listCustomerCapabilities(customerId)` — liste brute (toutes, actives/expirées/révoquées confondues) pour un Customer.

Aucun couplage à `Product`, `Stripe`, `Order` ou `Project`.

## `lib/entitlements.ts` — moteur de calcul des droits actifs

- `computeActiveEntitlements(capabilities, now?)` — **fonction pure** : un entitlement est actif si `status === "ACTIVE"`, `startsAt <= now`, et (`expiresAt` absent ou `expiresAt > now`).
- `createEntitlementsService(deps?)` — fabrique testable (même convention que les services ci-dessus), avec injection de la source des capabilities brutes.
- Fonctions par défaut branchées sur `lib/services/capabilities.ts` : `getCustomerCapabilities`, `getCustomerEntitlements`, `hasCapability`, `requireCapability` (détail ci-dessous).

Aucune interface, aucun écran — uniquement le moteur, conformément à la mission.

---

# Helpers créés

Les quatre helpers demandés existent avec exactement ces noms, exportés à la fois depuis `lib/entitlements.ts` (testable, sans `"server-only"`) et depuis `lib/server/permissions.ts` (surface de consommation officielle, avec `"server-only"`) :

- `getCustomerCapabilities(customerId)` → liste brute de toutes les capabilities du Customer.
- `getCustomerEntitlements(customerId, now?)` → liste des entitlements actuellement actifs.
- `hasCapability(customerId, capability, options?)` → `boolean` ; `options` permet de filtrer par `scope`/`scopeId` (préparation du scoping Project futur) et `now` (pour les tests).
- `requireCapability(customerId, capability, options?)` → lève une `HttpError` 403 (`forbidden`) si la capacité n'est pas active, sinon résout silencieusement.

## Ownership

- `lib/ownership.ts` (testable) + `lib/server/ownership.ts` (`"server-only"`) :
  - `isAdminActor(actor)`, `isResourceOwner(actor, resourceOwnerCustomerId)`, `canAccessOwnedResource(actor, resourceOwnerCustomerId)`, `requireOwnerOrAdmin(actor, resourceOwnerCustomerId)`.
  - `OwnershipActor = { role: "customer"; customerId } | { role: "admin" }` — type générique, sans référence à `Project`.
  - `requireOwnerOrAdmin` lève une `HttpError` 403 si l'acteur n'est ni le propriétaire ni un Admin.

**Convention `lib/xxx.ts` (testable) + `lib/server/xxx.ts` (`"server-only"`)** : reprise à l'identique du patron déjà utilisé dans ce dépôt pour `lib/supabase-storage.ts` / `lib/server/supabase-storage.ts` et `lib/cart-session.ts` / `lib/server/cart-session.ts`. Le paquet `server-only` lève une exception dès son import hors contexte Server Component ; les tests `node --test` ciblent donc systématiquement le module non gardé, exactement comme le fait déjà `tests/supabase-storage.test.ts`.

---

# Tests

Trois nouveaux fichiers, 44 nouveaux tests, aucun test existant supprimé.

## `tests/capabilities-service.test.ts` (9 tests)
Octroi avec valeurs par défaut, octroi avec `scope`/`scopeId`/`source`/`expiresAt` explicites, rejet d'un `customerId`/`capability` vide, révocation, idempotence de la révocation, révocation d'un id inconnu (404), isolation du listing par Customer.

## `tests/entitlements.test.ts` (18 tests)
- `computeActiveEntitlements` (fonction pure) : capacité active sans expiration ✓, capacité révoquée exclue ✓, capacité pas encore démarrée exclue ✓, capacité expirée exclue ✓, capacité expirant dans le futur conservée ✓, capacité expirant exactement à `now` exclue (borne stricte).
- `hasCapability` / `requireCapability` : **capability présente** ✓, **capability absente** ✓, capability d'un autre Customer refusée, capability révoquée refusée, capability expirée refusée, filtre `scope`/`scopeId`, `requireCapability` résout silencieusement si présente, lève une `HttpError(403, FORBIDDEN)` si absente.
- Test explicite « **Customer PURCHASE** / **Customer ADMIN** » : `entitlements engine behaves identically for a PURCHASE-origin and an ADMIN-origin Customer` — vérifie que le moteur d'entitlement ne dépend jamais de l'origine du compte, conformément à MASTER-10 §11.

## `tests/ownership.test.ts` (9 tests)
`isAdminActor`, `isResourceOwner`, `canAccessOwnedResource` (propriétaire / admin / étranger), `requireOwnerOrAdmin` (résolution silencieuse propriétaire/admin, exception 403 pour un tiers), et un test dédié au principe MASTER-10 §40 (« connaître un identifiant ne suffit jamais »).

## Tests existants adaptés (non fonctionnels, dus au nouveau champ `Customer.origin`)
`tests/customer-account-service.test.ts`, `tests/customer-auth-service.test.ts`, `tests/order-service.test.ts` : les fixtures `createCustomerRecord()` renvoyaient un objet `Customer` désormais incomplet vis-à-vis du type généré (`origin` manquant) → ajout de `origin: overrides.origin ?? "PURCHASE"`. Aucune assertion de comportement existante n'a été modifiée.

`tests/order-service.test.ts` — le test `createOrderFromCart converts an active cart into a pending payment order...` a reçu une assertion supplémentaire `assert.equal(state.customers[0]?.origin, "PURCHASE")`, couvrant explicitement le critère **« Customer PURCHASE »** de la mission sur le vrai chemin de création (premier achat Boutique via `lib/services/order.ts`).

## Couverture du critère « Customer ADMIN » sur `lib/services/customers.ts`
Ce service (`createCustomer`, utilisé uniquement par `POST /api/internal/customers`, route protégée par `requireApiSession()`) n'utilise **pas** le patron DB-injectable des autres services : il importe directement le singleton `lib/prisma.ts`, qui ouvre une connexion PostgreSQL réelle dès l'import du module. Aucun test existant de ce dépôt n'importe `lib/prisma.ts` ou `lib/services/customers.ts` (vérifié) — la suite `node --test` fonctionne aujourd'hui sans base de données disponible. Ajouter un test direct sur ce fichier aurait donc introduit une dépendance nouvelle et non demandée (refactor vers l'injection de dépendance, hors périmètre « aucun refactoring non demandé »).
Le point est donc couvert par **relecture directe du code** plutôt que par un test automatisé : la modification est une constante littérale à un seul endroit (`data: { ...normalizeCustomerData(input), origin: "ADMIN" }`), à risque de régression minimal. Le comportement identique (« le moteur d'entitlement traite indifféremment un Customer `PURCHASE` ou `ADMIN` ») est en revanche testé automatiquement dans `tests/entitlements.test.ts` (voir ci-dessus).

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 446 / # pass 446 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même raison préexistante que lors de la Phase 1.1 (dépendance imbriquée `node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys` incomplète, sans rapport avec les fichiers modifiés ici).

---

# Impacts

**Fichiers de production modifiés (hors fichiers générés Prisma) :**

| Fichier | Nature |
|---|---|
| `prisma/schema.prisma` | Ajout additif (enums + champ `origin` + modèle `CustomerCapability`) |
| `lib/services/order.ts` | Ajout de `origin: "PURCHASE"` au seul `createCustomer` existant (premier achat) + élargissement du type `OrderDb.createCustomer` |
| `lib/services/customers.ts` | Ajout de `origin: "ADMIN"` au seul `createCustomer` existant (création manuelle Admin) |

**Aucune autre modification** de `Checkout`, `Stripe`, `DownloadGrant`, `Cart`, `Order` (comportement), `Product`, `Dashboard`, `Volta`, `Accompagnement` ou `Project` — vérifié par grep : les seules occurrences de `origin` ajoutées touchent exactement les deux points de création de `Customer` déjà identifiés lors de l'audit Phase 1 (`lib/services/order.ts`, `lib/services/customers.ts`).

**Nouveaux fichiers, non consommés par le reste de l'application :**
`lib/services/capabilities.ts`, `lib/entitlements.ts`, `lib/ownership.ts`, `lib/server/permissions.ts`, `lib/server/ownership.ts`.

Vérifié explicitement par recherche (`grep`) : aucun fichier sous `app/`, `components/` ne les importe. Seuls les nouveaux tests et les nouveaux modules eux-mêmes (wrappers `server-only` re-exportant leur pendant testable) s'y réfèrent.

---

# Compatibilité

- **Migration additive uniquement** : aucune colonne supprimée, aucune table renommée, aucune contrainte retirée. Vérifié par lecture du SQL généré et application réelle sur la base de développement locale.
- **Aucune perte de donnée** : les 7 `Customer` existants en dev ont été rétro-remplis à `origin = PURCHASE` par le `DEFAULT` de colonne, sans intervention manuelle.
- **Aucune API cassée** : `POST /api/internal/customers`, le flux `createOrderFromCart`, et tous les flux d'authentification (Phase 1.1) continuent de fonctionner à l'identique — seuls deux appels `prisma.customer.create` reçoivent désormais une valeur `origin` explicite au lieu de recevoir implicitement le défaut `PURCHASE` de la base.
- **Production préservée** : build Next.js complet réussi, 446/446 tests verts, aucun comportement métier existant modifié (uniquement des ajouts).
- **Aucun couplage introduit** vers `Project`, `Stripe`, `Product` ou `Accompagnement` depuis les nouveaux modules.

---

# Validation des critères de sortie

| Critère | Statut |
|---|---|
| Build OK | ✅ `npm run build` réussi |
| TypeScript OK | ✅ `npx tsc --noEmit` sans erreur |
| Tests OK | ✅ 446/446 (44 nouveaux tests dédiés à la Couche 2, dont Customer PURCHASE, Customer ADMIN via le moteur d'entitlement, capability présente/absente, entitlement actif/absent, `hasCapability`, `requireCapability`) |
| Aucun MASTER contredit | ✅ MASTER-00, MASTER-04, MASTER-08, MASTER-10, MASTER-11 relus avant implémentation ; choix de conception (capability en `String` libre, scope générique, pas de FK vers Project/Accompagnement) directement justifiés par ces MASTER dans ce rapport |
| Aucun comportement actuel modifié | ✅ Seuls deux points de création `Customer` reçoivent une valeur `origin` explicite ; aucun autre flux touché |
| Les nouveaux services ne sont utilisés par aucun module existant | ✅ Vérifié par recherche : aucune référence depuis `app/` ou `components/` |
| Le socle est prêt pour Project | ✅ `CustomerCapability.scope/scopeId` permet dès aujourd'hui de scoper une future capacité à un `Project` (`scope: "PROJECT", scopeId: <futur projectId>`) sans nouvelle migration ; `hasCapability`/`requireCapability` acceptent déjà `scope`/`scopeId` en option ; `OwnershipActor` et `requireOwnerOrAdmin` sont directement réutilisables pour l'ownership Project (remplacer la comparaison `resourceOwnerCustomerId` par `project.customerId`) |
| ⚠️ Lint | Non exécutable, cause préexistante et non liée à cette mission (identique à la Phase 1.1) |

---

# Fin — PHASE-2-RAPPORT / FabSystem
