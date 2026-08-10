# PHASE-3-RAPPORT — Project (socle métier)

**Date : 10/08/2026**
**Périmètre : socle Project uniquement (modèle, CRUD serveur, ownership, archivage, suppression immédiate/différée 72h, valeurs retenues, dépendances, API CRUD). Aucun Volta, Circuit, Schéma, Accompagnement, Document, Livrable ou calculateur n'a été développé. Aucune interface, aucun React.**

Conformément à la consigne d'ouverture de cette phase, toute décision de modélisation non explicitement tranchée par les MASTER est signalée ci-dessous comme **Arbitrage requis** plutôt qu'inventée silencieusement.

---

# Modèle Prisma

Trois nouveaux modèles, tous additifs, dans `prisma/schema.prisma`.

## Project

```prisma
enum ProjectStatus { ACTIVE ARCHIVED DELETE_SCHEDULED }   // exactement les 3 états demandés
enum ProjectAssetType { BOAT VAN MOTORHOME OTHER }         // MASTER-06 §8
enum ProjectVoltage { V12 V24 UNKNOWN }                    // MASTER-06 §8-9, "Je ne sais pas" = UNKNOWN explicite

model Project {
  id                String
  customerId        String
  customer          Customer         @relation(onDelete: Restrict)
  name              String
  assetType         ProjectAssetType
  voltage           ProjectVoltage   @default(UNKNOWN)
  status            ProjectStatus    @default(ACTIVE)
  archivedAt        DateTime?
  deleteScheduledAt DateTime?
  preScheduleStatus ProjectStatus?
  createdAt / updatedAt
  retainedValues    ProjectRetainedValue[]
  valueDependencies ProjectValueDependency[]
}
```

Choix de conception justifiés par les MASTER :
- **Indépendant de Volta/Circuits/Schéma/Documents/Accompagnement** : aucune relation Prisma vers ces objets, qui n'existent pas encore. Conforme à MASTER-10 §41 et à la contrainte explicite de cette phase.
- **`ProjectAssetType` distinct de `Customer.assetType`** : ce dernier classe le matériel commercial historique (Quote/Invoice), le nouveau classe l'univers du Project SaaS. Les mélanger aurait contredit MASTER-10 §42 (« ne pas déplacer les données techniques du Projet dans le profil Customer »).
- **`customer` en `onDelete: Restrict`**, comme `Quote`/`Invoice` (données de valeur), pas `Cascade` comme les artefacts d'auth (`MagicLoginToken`/`CustomerSession`) ni `SetNull` comme `Order`. Conforme à MASTER-10 §62-63 : pas de cascade globale Customer → Project sans politique dédiée.
- **Exactement 3 valeurs d'état**, comme demandé. Une suppression immédiate ne laisse pas de ligne « DELETED » : elle retire la ligne (voir section Services).
- **`preScheduleStatus`** : champ technique nécessaire pour appliquer littéralement MASTER-10 §56 (« l'annulation... restitue le Project dans son état normal ») — sans lui, une annulation ne pourrait pas savoir s'il faut revenir à `ACTIVE` ou `ARCHIVED`. Ce n'est pas un 4ᵉ état (l'enum `ProjectStatus` a toujours 3 valeurs) : c'est une mémoire de l'état précédent, requise pour respecter le texte du MASTER.

## ProjectRetainedValue (valeurs retenues)

```prisma
enum ProjectValueStatus { ACTIVE OBSOLETE }

model ProjectRetainedValue {
  id, projectId, project (onDelete: Cascade)
  key            String    // identifiant fonctionnel libre, non figé
  value          Json      // valeur retenue
  simulatedValue Json?     // dernier résultat de simulation, distinct de `value`
  status         ProjectValueStatus @default(ACTIVE)
  source         String?
  retainedAt, obsoletedAt, createdAt, updatedAt
  @@unique([projectId, key])
}
```

`key` est un `String` libre plutôt qu'un enum : aucun calculateur n'est développé dans cette phase (contrainte explicite), donc aucune clé métier définitive (« battery.capacity », etc.) n'est figée — conforme à MASTER-00 §15. `value`/`simulatedValue` distincts reproduisent littéralement MASTER-06 §25 (simulation ≠ valeur retenue).

## ProjectValueDependency (dépendances)

```prisma
model ProjectValueDependency {
  id, projectId, project (onDelete: Cascade)
  dependentKey String
  dependsOnKey String
  createdAt
  @@unique([projectId, dependentKey, dependsOnKey])
}
```

Un simple graphe orienté, sans statut propre : l'« obsolescence » vit sur `ProjectRetainedValue.status`, pas sur l'arête elle-même — évite d'inventer un second concept d'état non demandé.

**`ProjectRetainedValue`/`ProjectValueDependency` → `Project` en `onDelete: Cascade`** : données intrinsèques au Project, sans valeur indépendante une fois le Project supprimé (MASTER-10 §63).

---

# Migrations

Deux migrations additives, générées par `npx prisma migrate dev` et appliquées réellement sur la base de développement locale (`fabsystem_dev`) :

1. `20260810180645_add_customer_origin_and_capabilities` — reportée du rapport Phase 2 pour mémoire (déjà appliquée avant cette phase).
2. `20260810182640_add_project_foundation` — 4 `CREATE TYPE` (enums), 3 `CREATE TABLE` (`Project`, `ProjectRetainedValue`, `ProjectValueDependency`), 8 `CREATE INDEX`, 3 `ADD CONSTRAINT` (FK). **Aucun `ALTER TABLE` sur une table existante, aucune colonne supprimée, aucune table renommée.**

Vérification réelle post-migration :

```
Customer : 7 lignes (inchangé)
Project  : 0 ligne (nouvelle table, vide)
```

Aucune perte de donnée, comportement existant totalement préservé.

---

# Services

Convention identique aux services des phases précédentes : interface `*Db` injectable, fabrique `create*Service(db, deps?)` testable sans base de données, fonctions par défaut branchées sur Prisma.

## `lib/services/project.ts` — CRUD Project

`createProject`, `getProject`, `listProjectsForCustomer`, `updateProject`, `archiveProject`, `deleteProject`, `scheduleDeletion`, `cancelDeletion` — exactement les 7 fonctions demandées (+ `listProjectsForCustomer`, nécessaire pour qu'un client puisse lister *ses* projets, non listée nommément mais indispensable à l'usage du CRUD).

- **`createProject`** : vérifie l'ownership (`requireOwnerOrAdmin`), applique la limite (`STANDARD_PROJECT_LIMIT = 3`, voir Arbitrage ci-dessous), crée le Project.
- **`archiveProject`** : idempotent si déjà `ARCHIVED` ; refuse (409) si `DELETE_SCHEDULED` (annuler la suppression avant d'archiver).
- **`deleteProject`** : exige `{ confirm: true }` (traduction technique de « confirmation obligatoire », MASTER-06 §15, en l'absence de toute UI dans cette phase) ; supprime la ligne (`prisma.project.delete`) — **définitif et immédiat**, conforme à MASTER-06 §15 (« Décochée, la suppression est définitive et immédiate ») et MASTER-10 §53. Refuse (409) un Project déjà `DELETE_SCHEDULED`.
- **`scheduleDeletion`** : exige confirmation, refuse un Project déjà programmé, persiste `status = DELETE_SCHEDULED`, `deleteScheduledAt = now + 72h`, `preScheduleStatus = statut actuel`. **Ne supprime rien** (aucune donnée, aucun fichier — il n'y en a d'ailleurs aucun à ce stade). Aucun `setTimeout`/timer mémoire (MASTER-10 §55).
- **`cancelDeletion`** : ouvert au client propriétaire **et** à l'Admin (MASTER-10 §56) ; refuse (409) si rien n'est programmé ; restaure `status = preScheduleStatus`, efface `deleteScheduledAt`/`preScheduleStatus`.
- **L'exécuteur qui traiterait les Projects à échéance n'a volontairement pas été construit** (mission explicite + MASTER-10 §57 : fréquence de job non définie, pas de cron à inventer).

## `lib/services/project-values.ts` — socle valeurs retenues

`retainValue` (action explicite « Retenir », upsert), `markValueObsolete` (idempotent, 404 si jamais retenue), `getProjectValue`, `getProjectValues`. Aucune règle de recalcul, aucune clé métier prédéfinie.

## `lib/services/project-dependencies.ts` — socle dépendances

`declareDependency` (idempotent), `listDependencies`, `markDependentsObsolete` (compose `project-values.ts` via une dépendance injectable, jamais couplée en dur — testable sans DB), et la fonction pure `computeDirectDependents(edges, changedKey)`.

**Propagation à un seul niveau (non transitive)** : changer une clé ne marque obsolètes que ses dépendants directs, jamais en cascade — conforme à MASTER-06 §30 (« dépendances ciblées », exemple Week-end/Hiver). Voir Arbitrage ci-dessous pour la propagation multi-niveaux.

---

# API

Deux arborescences symétriques, reprenant exactement les mécanismes d'authentification déjà en place (aucune nouvelle mécanique introduite) :

## Côté client (`app/api/projects/*`) — session client existante (`getCustomerSessionFromCookie`)
- `GET /api/projects` — liste les projets du client connecté
- `POST /api/projects` — création
- `GET /api/projects/[projectId]` — lecture
- `PATCH /api/projects/[projectId]` — modification (nom/type/tension)
- `DELETE /api/projects/[projectId]` — suppression immédiate (`{confirm:true}`)
- `POST /api/projects/[projectId]/archive` — archivage
- `POST /api/projects/[projectId]/schedule-deletion` — programmation 72h (`{confirm:true}`)
- `POST /api/projects/[projectId]/cancel-deletion` — annulation

## Côté Admin (`app/api/internal/projects/*`) — session Admin existante (`requireApiSession`)
Mêmes 8 routes, `customerId` fourni explicitement (query param en lecture, body en création) plutôt que déduit d'une session — la création manuelle Admin (MASTER-04 §4) ne peut jamais agir sur un compte non désigné explicitement.

Toutes les routes délèguent l'autorisation au service (`requireOwnerOrAdmin`) : aucune route ne fait sa propre vérification d'ownership, pour éviter toute divergence entre surface client et surface Admin.

**Nouveau helper** `lib/server/project-actor.ts` (`requireCustomerActor`, `adminActor`) : résout l'acteur Phase 2 (`OwnershipActor`) à partir des sessions existantes, sans rien modifier de ces sessions.

---

# Ownership

Branchement direct des helpers de la Phase 2, sans les modifier :

- Chaque opération sur un Project existant (`getProject`, `updateProject`, `archiveProject`, `deleteProject`, `scheduleDeletion`, `cancelDeletion`) charge le Project puis appelle `requireOwnerOrAdmin(actor, project.customerId)` (`lib/ownership.ts`, Phase 2). Un identifiant de Project seul n'accorde jamais rien (MASTER-10 §40) : sans acteur correspondant, la fonction lève une `HttpError` 403.
- `createProject` vérifie `requireOwnerOrAdmin(actor, input.customerId)` — un client ne peut créer un Project que pour lui-même ; un Admin peut le faire pour n'importe quel client.
- Testé explicitement : propriétaire ✓, Admin ✓, tiers refusé ✓, `getProject` sur un id inconnu (404) ✓.

---

# Valeurs retenues

Infrastructure livrée exactement au périmètre demandé (« créer uniquement le modèle ») : le modèle Prisma `ProjectRetainedValue` plus un service minimal et générique (`lib/services/project-values.ts`) permettant de retenir, consulter et marquer obsolète une valeur — sans aucun calculateur, aucune clé métier prédéfinie, aucun recalcul automatique. `simulatedValue` et `value` restent deux champs distincts pour ne jamais confondre simulation et décision (MASTER-06 §25, §29).

---

# Dépendances

Le « moteur » demandé (§7 de la mission) est livré comme un socle purement structurel : déclarer une arête, lister les dépendants directs d'une clé, marquer obsolètes les valeurs retenues correspondantes. Aucune règle métier spécifique (quelles clés dépendent de quelles autres pour la batterie, le solaire, etc.) n'est codée — cela appartient aux futurs calculateurs, hors périmètre de cette phase.

---

# Tests

Cinq nouveaux fichiers, 61 nouveaux tests, aucun test existant supprimé, tous verts.

## `tests/project-service.test.ts` (33 tests)
Couvre explicitement chaque point demandé par la mission : **création** (dont refus tiers, autorisation Admin, respect de la limite de 3 y compris projets archivés, acceptation de `UNKNOWN`/« Je ne sais pas »), **lecture** (propriétaire, Admin, tiers refusé, id inconnu → 404, « un id seul n'accorde rien »), **modification** (champs partiels, tiers refusé), **archivage** (idempotence, refus si suppression programmée, tiers refusé), **suppression immédiate** (confirmation obligatoire, suppression réellement définitive — la ligne disparaît de la base mockée —, Admin autorisé, tiers refusé, refus si déjà programmée), **programmation 72h** (persistance de `DELETE_SCHEDULED` + échéance exacte +72h, mémorisation de l'état à restaurer, confirmation obligatoire, **aucune donnée supprimée**, refus de double-programmation, tiers refusé), **annulation** (restauration `ACTIVE` ou `ARCHIVED` selon l'état mémorisé, ouverte à l'Admin, tiers refusé, refus si rien n'est programmé).

## `tests/project-values-service.test.ts` (7 tests)
Rétention initiale, écrasement explicite (pas de fusion silencieuse), réactivation d'une valeur obsolète, marquage obsolète (idempotent, 404 si jamais retenue), listing scopé par Project.

## `tests/project-dependencies-service.test.ts` (7 tests)
Dépendants directs uniquement (test dédié à la non-propagation transitive), déclaration idempotente, marquage obsolète composé (valeurs sans dépendance ignorées silencieusement, clés non concernées jamais touchées).

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 494 / # pass 494 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les Phases 1.1 et 2 (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec les fichiers modifiés dans cette phase).

---

# Compatibilité

- **Migration additive uniquement** : 3 nouvelles tables, 4 nouveaux enums, aucune colonne supprimée/renommée, aucune contrainte retirée. Vérifié sur la base de développement réelle : 7 `Customer` inchangés, `Project` créée vide.
- **Aucun comportement existant modifié** : aucun fichier de `Checkout`, `Stripe`, `Customer` (service), `Capabilities`/`Entitlements` (Phase 2), `Volta`, `Accompagnement`, `Circuits`, `Schéma`, `Documents`, `Dashboard` n'a été touché.
- **Project totalement indépendant** : aucune relation Prisma, aucun import de code vers un module futur non encore construit.
- **Aucun module métier existant ne dépend de Project** : vérifié par recherche (`grep`) — seules les nouvelles routes/services Project eux-mêmes se référencent.
- **Build et tests intégralement au vert.**

---

# Validation des critères de sortie

| Critère | Statut |
|---|---|
| Build OK | ✅ `npm run build` réussi |
| TypeScript OK | ✅ `npx tsc --noEmit` sans erreur |
| Tests OK | ✅ 494/494 (61 nouveaux tests dédiés au socle Project) |
| Aucun MASTER contredit | ✅ MASTER-00, MASTER-06, MASTER-10, MASTER-11 relus avant implémentation ; chaque choix de modélisation non trivial est justifié par une citation précise dans ce rapport |
| Aucun comportement existant modifié | ✅ Migration additive, aucun fichier hors socle Project modifié |
| Project est totalement indépendant | ✅ Aucune dépendance vers Volta/Circuits/Schéma/Documents/Accompagnement |
| Aucun module métier ne dépend encore de Project | ✅ Vérifié par recherche |
| Le socle est prêt pour les futurs modules | ✅ `ProjectRetainedValue`/`ProjectValueDependency` prêts à être alimentés par les futurs moteurs (Énergie, Circuits...) ; ownership déjà branché ; capabilities Phase 2 réutilisables pour de futurs droits scopés `PROJECT` (`scope`/`scopeId` déjà prévus) |
| ⚠️ Lint | Non exécutable, cause préexistante et non liée à cette mission (identique aux Phases 1.1 et 2) |

---

# Arbitrages requis (non tranchés, à valider explicitement)

1. **Mécanisme de configuration de la limite de projets (MASTER-11 §21).** MASTER-06 fixe 3 projets personnels pour le compte standard, mais MASTER-11 §21 demande explicitement que cette limite soit configurable pour une future offre Pro, sans préciser comment (capability Phase 2 ? champ dédié sur `Customer` ? autre mécanisme ?). Implémenté ici comme une simple constante exportée (`STANDARD_PROJECT_LIMIT = 3`) volontairement isolée dans `lib/services/project.ts`, remplaçable sans réécrire le service — mais son branchement définitif à un mécanisme de configuration reste à décider.
2. **Propagation transitive des dépendances.** MASTER-06 §30 établit le principe de « dépendances ciblées » avec un exemple à un seul niveau (Week-end/Hiver), mais ne tranche pas explicitement si un changement doit un jour se propager à plusieurs niveaux (A dépend de B, B dépend de C, C change). Implémenté ici en propagation à un seul niveau uniquement (le plus conservateur, le plus proche du texte du MASTER) ; une éventuelle cascade multi-niveaux nécessiterait une décision explicite avant d'être ajoutée.
3. **Restauration d'un Project archivé (« Restaurer »).** MASTER-06 §13 mentionne une action « Restaurer » dans les Archives, mais la liste de services demandée pour cette phase (`createProject, getProject, updateProject, archiveProject, deleteProject, scheduleDeletion, cancelDeletion`) ne l'inclut pas. Non implémenté dans cette phase pour respecter strictement le périmètre demandé — signalé ici pour éviter qu'un Project archivé ne semble définitivement figé sans que ce soit une décision consciente.

Aucun de ces trois points n'a été tranché implicitement : les choix les plus conservateurs et les plus réversibles ont été retenus en attendant.

---

# Fin — PHASE-3-RAPPORT / FabSystem
