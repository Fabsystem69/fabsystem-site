# PHASE-4.0-RAPPORT — Socle des moteurs métier

**Date : 11/08/2026**
**Périmètre : infrastructure commune uniquement (`EngineContext`, `EngineResult`, `EngineError`, `BaseEngine`, `EngineRunner`, `Registry`). Aucun calcul électrique, aucune formule, aucune règle métier, aucun moteur réel enregistré.**

---

# Architecture

Nouveau dossier `lib/engines/`, isolé du reste de l'application :

```
lib/engines/
  types.ts     — EngineContext, EngineResult, BaseEngine, types de proposition
  errors.ts    — hiérarchie EngineError
  context.ts   — createEngineContext (construit un EngineContext à partir d'un Project)
  runner.ts    — createEngineRunner (exécute un moteur, persiste ce qu'il propose)
  registry.ts  — createEngineRegistry (registre générique, vide par défaut)
```

Principes directeurs, tous issus des MASTER relus :

- **Réutilisation, pas réécriture** (MASTER-11 §28-29, MASTER-06 §32) : le socle ne duplique aucune logique de la Phase 3. `EngineContext`, `EngineRunner` et `createEngineContext` **réutilisent tel quel** `lib/services/project.ts` (ownership), `lib/services/project-values.ts` et `lib/services/project-dependencies.ts` — aucune nouvelle lecture/écriture Project n'a été inventée.
- **Simulation ≠ décision** (MASTER-06 §25-26, MASTER-00 §13) : le framework ne décide jamais qu'une valeur calculée devient une valeur retenue. Il persiste mécaniquement ce qu'un moteur place explicitement dans `result.retainedValues` — la distinction `value`/`simulatedValue` reste portée jusqu'au bout, et c'est au futur moteur (et à l'action explicite qui l'invoque) de décider quoi y placer, jamais au framework de l'interpréter.
- **Dépendances ciblées, pas de règle métier** (MASTER-06 §27-30) : le registre de dépendances déclaré par un moteur (`result.dependencies`) est persisté tel quel via le socle de dépendances de la Phase 3 (propagation à un seul niveau, déjà tranchée en Phase 3).
- **Isolation totale** : vérifié par recherche (`grep`) — aucun fichier hors `lib/engines/` ne référence ce nouveau dossier. Aucun moteur réel n'est enregistré (`createEngineRegistry()` démarre toujours vide).

---

# Interfaces

## `EngineContext` (`lib/engines/types.ts`)

```ts
type EngineContext = {
  readonly project: Project;
  readonly now: () => Date;
  getRetainedValue(key: string): Promise<ProjectRetainedValue | null>;
  getRetainedValues(): Promise<ProjectRetainedValue[]>;
  getDependencies(): Promise<ProjectValueDependency[]>;
};
```

Purement passif : aucune méthode de calcul, aucune méthode d'écriture (un moteur ne peut pas persister lui-même — seul l'`EngineRunner` le fait, après coup, à partir de ce que le moteur *propose*). Vérifié par test dédié (`the context carries no business logic`) que l'objet ne contient exactement que ces cinq clés.

## `EngineResult<TOutput>`

```ts
type EngineResult<TOutput = unknown> = {
  output: TOutput;                                  // résultat métier propre au moteur, opaque pour le framework
  retainedValues?: EngineRetainedValueProposal[];
  dependencies?: EngineDependencyProposal[];
  warnings?: EngineWarning[];
  errors?: EngineResultError[];                      // erreurs non bloquantes rapportées dans un résultat par ailleurs exploitable
  debug?: Record<string, unknown>;
};
```

`errors` (champ du résultat) est volontairement distinct de `EngineError` (exception levée) : une `EngineError` interrompt l'exécution (ex. donnée requise totalement absente), alors que `result.errors` permet à un futur moteur de renvoyer un résultat partiel accompagné d'anomalies non bloquantes — les deux mécanismes ne se substituent pas l'un à l'autre.

## `BaseEngine<TInput, TOutput>`

```ts
interface BaseEngine<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  run(context: EngineContext, input: TInput): Promise<EngineResult<TOutput>> | EngineResult<TOutput>;
}
```

Choisi comme **interface TypeScript**, pas classe abstraite : cohérent avec la convention déjà établie dans tout le dépôt (fabriques `createXxxService(...)` + interfaces `XxxDb`, aucune classe côté métier ailleurs dans `lib/`). `run` accepte un retour synchrone ou une Promise, pour ne pas imposer `async` à un futur moteur purement synchrone.

---

# Services créés

## `lib/engines/context.ts` — `createEngineContext(project, deps?)`

Construit un `EngineContext` à partir d'un `Project` déjà résolu. Les trois lecteurs (`getRetainedValue`, `getRetainedValues`, `getDependencies`) délèguent par défaut à `lib/services/project-values.ts` et `lib/services/project-dependencies.ts` (Phase 3), injectables pour les tests.

## `lib/engines/runner.ts` — `createEngineRunner(deps?)`

```ts
runner.run(actor, projectId, engine, input): Promise<EngineResult<TOutput>>
```

Déroulé exact :
1. **Prépare le contexte** : résout le Project via `lib/services/project.ts::getProject(actor, projectId)` — l'ownership (propriétaire/Admin, refus des tiers) est donc vérifié par le service Phase 3 existant, sans nouvelle logique d'autorisation.
2. **Appelle le moteur** : `engine.run(context, input)`.
3. **Récupère le résultat**, en capturant toute exception :
   - une `EngineError` (ou sous-classe) levée par le moteur est **propagée telle quelle** ;
   - toute autre exception est **enveloppée** dans une `CalculationError` (message contenant l'id du moteur, `cause` = erreur d'origine) — un moteur ne peut jamais faire fuiter une erreur non typée hors du framework.
4. **Enregistre les valeurs retenues** : chaque entrée de `result.retainedValues` est persistée via `lib/services/project-values.ts::retainValue`, avec `source` par défaut = `engine.id` si le moteur n'en fournit pas.
5. **Enregistre les dépendances** : chaque entrée de `result.dependencies` est persistée via `lib/services/project-dependencies.ts::declareDependency`.
6. Si le moteur ne propose ni valeur ni dépendance, ou s'il lève une erreur, **rien n'est persisté**.

Le runner ne lit jamais `result.output` : il ne connaît jamais le contenu du calcul, conformément à la contrainte.

## `lib/engines/registry.ts` — `createEngineRegistry()`

`register`, `get`, `has`, `list`, `unregister`. `register` lève une `ConfigurationError` (code `ENGINE_ALREADY_REGISTERED`) en cas de doublon, ou si l'id est vide. Aucun moteur n'est enregistré par défaut.

---

# Types créés

- `EngineContext`, `EngineResult<TOutput>`, `EngineRetainedValueProposal`, `EngineDependencyProposal`, `EngineWarning`, `EngineResultError`, `BaseEngine<TInput, TOutput>` (`lib/engines/types.ts`)
- `EngineError`, `ValidationError`, `ConfigurationError`, `DependencyError`, `CalculationError`, `isEngineError` (`lib/engines/errors.ts`) — même forme que `lib/http-errors.ts` (message + code + details), volontairement découplée du HTTP.
- `EngineContextDeps`, `EngineRunnerDeps`, `EngineRegistry` — types d'options/injection, pour la testabilité.

---

# Tests

Quatre nouveaux fichiers, 41 nouveaux tests, aucun test existant modifié.

## `tests/engines-errors.test.ts` (7 tests)
Code par défaut de chaque sous-classe, héritage (`instanceof EngineError`), override de code, `details`/`cause`, `isEngineError`.

## `tests/engines-context.test.ts` (7 tests)
**✓ création du contexte** : exposition du Project, horloge par défaut vs injectée, délégation scopée par `project.id` des trois lecteurs, et vérification explicite que le contexte ne contient aucune clé additionnelle (pas de logique métier cachée).

## `tests/engines-registry.test.ts` (9 tests)
**✓ registry** : enregistrement puis lecture, `has`, `list`, id inconnu, doublon refusé, id vide refusé, désenregistrement, registre vide par défaut.

## `tests/engines-runner.test.ts` (13 tests)
Un **moteur fictif** (`fixture.dummy`, défini uniquement dans le fichier de test, jamais exporté ni enregistré) sert de double de test : **✓ exécution d'un moteur fictif** (contexte correctement préparé, résultat retourné, support d'un moteur asynchrone), **✓ enregistrement des valeurs** (persistance via `retainValue`, source par défaut = id du moteur, source explicite conservée), **✓ enregistrement des dépendances** (persistance via `declareDependency`), aucune persistance si le moteur ne propose rien, **✓ propagation des erreurs** (une `EngineError` levée par le moteur traverse le runner inchangée ; une erreur non typée est enveloppée dans `CalculationError` avec la `cause` d'origine ; aucune persistance en cas d'erreur).

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 528 / # pass 528 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : cette phase n'ajoute ni ne modifie aucun modèle. Le socle des moteurs réutilise intégralement `Project`, `ProjectRetainedValue` et `ProjectValueDependency` de la Phase 3, sans modification.
- **Aucun fichier existant modifié** : uniquement des fichiers nouveaux sous `lib/engines/` et `tests/`. `Project`, Volta, Schéma, Circuits, Accompagnement, Frontend, Dashboard, Stripe, Auth : aucun n'a été touché.
- **Aucun calcul métier implémenté** : `lib/engines/` ne contient aucune formule, aucun seuil, aucune règle électrique. Le seul moteur qui existe dans le dépôt est le moteur fictif du fichier de test, non exporté.
- **Build et tests intégralement au vert.**

---

# Validation des critères de sortie

| Critère | Statut |
|---|---|
| Build OK | ✅ `npm run build` réussi |
| TypeScript OK | ✅ `npx tsc --noEmit` sans erreur |
| Tests OK | ✅ 528/528 (41 nouveaux tests dédiés au framework) |
| Aucun MASTER contredit | ✅ MASTER-00, MASTER-06, MASTER-10, MASTER-11 relus ; chaque choix de conception s'appuie sur une référence précise ci-dessus |
| Aucun calcul métier n'est encore implémenté | ✅ Vérifié : aucune formule, aucun moteur réel, uniquement un double de test non exporté |
| Tous les futurs moteurs pourront utiliser ce socle sans modification | ✅ `BaseEngine<TInput, TOutput>` est générique ; `EngineRunner`/`Registry`/`Context` ne connaissent aucun type ni aucune clé métier spécifique — un futur moteur Bilan/Batterie/Section n'aura qu'à implémenter `BaseEngine` et s'enregistrer |
| ⚠️ Lint | Non exécutable, cause préexistante et non liée à cette mission (identique aux phases précédentes) |

---

# Arbitrages éventuels

Aucun arbitrage bloquant identifié pour cette phase : contrairement à la Phase 3 (Project), le périmètre demandé ici est de l'infrastructure pure, sans décision commerciale ou de modélisation métier en suspens. Deux précisions de conception, documentées par transparence mais ne nécessitant pas d'arbitrage externe :

1. **`result.errors` vs `EngineError` levée.** Le mission-brief demande les deux (« EngineError : hiérarchie commune » et « EngineResult... erreurs »). Interprétation retenue : `EngineError` interrompt l'exécution (erreur bloquante), `result.errors` accompagne un résultat par ailleurs exploitable (erreurs non bloquantes). Cette distinction est structurelle, pas business — elle ne fige aucune règle sur *quand* un futur moteur doit utiliser l'un ou l'autre.
2. **`source` par défaut d'une valeur retenue = `engine.id`.** Non explicitement demandé, mais nécessaire pour que le champ `source` (déjà prévu par le modèle `ProjectRetainedValue` en Phase 3) porte une valeur par défaut utile plutôt que de rester vide ; un moteur reste libre de fournir son propre `source` pour l'écraser.

---

# Fin — PHASE-4.0-RAPPORT / FabSystem
