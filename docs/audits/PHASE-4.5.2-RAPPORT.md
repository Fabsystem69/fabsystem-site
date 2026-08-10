# PHASE-4.5.2-RAPPORT — Dependency Propagation

**Date : 17/08/2026**
**Périmètre : infrastructure uniquement. `EngineRunner` propage désormais l'obsolescence des dépendances après avoir persisté les valeurs retenues d'un run. Aucun moteur métier modifié, aucune formule, aucune validation métier, aucun nom de clé touché.**

Cette phase répond directement au risque principal identifié par l'audit transversal (`docs/audits/PHASE-4.5.1-AUDIT-ENGINES.md`) : le graphe de dépendances construit par les cinq moteurs n'était jamais lu par `EngineRunner`, rendant le mécanisme d'obsolescence de la Phase 3 inerte.

---

# Architecture

Un seul fichier du socle modifié (`lib/engines/runner.ts`), un seul fichier nouveau (`lib/engines/value-diff.ts`) :

```
lib/engines/
  types.ts, errors.ts, context.ts, registry.ts, constants.ts               ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                ← inchangés
  solar-engine.ts, charger-engine.ts
  value-diff.ts                                                            ← nouveau (Phase 4.5.2)
  runner.ts                                                                ← étendu (Phase 4.5.2)
```

`EngineRunner` reste l'unique responsable de : préparer le contexte, exécuter le moteur, persister les résultats, et désormais **propager l'obsolescence**. Il ne contient toujours aucune logique métier : la détection de changement compare des structures de données génériques (`value-diff.ts`), et la propagation elle-même est intégralement déléguée au service de dépendances de la Phase 3 (`lib/services/project-dependencies.ts::markDependentsObsolete`), réutilisé tel quel, sans aucune duplication de sa logique (résolution des dépendants directs, garde MASTER-06 §30 « dépendances ciblées »).

```
EngineRunner.run()
  ↓ résout le Project (ownership, Phase 3, inchangé)
  ↓ prépare le contexte (Phase 4.0, inchangé)
  ↓ exécute le moteur
  ↓ lit en une fois l'état actuel des valeurs retenues du Project
  ↓ pour chaque proposition : compare, persiste, retient les clés réellement changées
  ↓ persiste les dépendances proposées (inchangé)
  ↓ propage l'obsolescence pour chaque clé réellement changée (nouveau)
  ↓ retourne le résultat
```

---

# Modifications apportées

## `lib/engines/value-diff.ts` (nouveau)

`isStructurallyEqual(a, b)` — égalité structurelle récursive (objets, tableaux, primitives), insensible à l'ordre des clés d'un objet. `hasValueChanged(previous, next)` — son inverse, nommé pour l'usage du Runner. Fonctions pures, sans dépendance, testées indépendamment.

## `lib/engines/runner.ts` (étendu)

- `EngineRunnerDeps` gagne deux champs optionnels, suivant exactement la convention déjà en place pour `retainValue`/`declareDependency` (type inféré via `typeof`, défaut réel importé du service Phase 3 correspondant) :
  - `getProjectValues?: typeof getProjectValues` (défaut : `lib/services/project-values.ts::getProjectValues`)
  - `markDependentsObsolete?: typeof markDependentsObsolete` (défaut : `lib/services/project-dependencies.ts::markDependentsObsolete`)
- Avant d'écraser une valeur retenue, le Runner lit désormais **une fois** l'ensemble des valeurs déjà persistées pour le Project (`getProjectValues`), et compare — pour chaque proposition — le champ `value` existant au `value` proposé via `hasValueChanged`. Si la clé n'existait pas encore, elle est traitée comme changée.
- Chaque clé réellement changée est collectée une seule fois (dédoublonnée via un `Set`), puis, une fois toutes les valeurs et dépendances persistées, `markDependentsObsolete(projectId, key)` est appelé pour chacune.
- **Aucune autre étape du Runner n'est modifiée** : la résolution du Project, la construction du contexte, l'appel au moteur, la capture/enveloppement des erreurs (`EngineError` vs `CalculationError`), la persistance des valeurs et des dépendances restent identiques ligne pour ligne.

## Fichiers de test existants (mise à jour mécanique, aucune assertion modifiée)

Six fichiers de test préexistants construisaient un `EngineRunner` de test sans injecter `getProjectValues`/`markDependentsObsolete` — avec l'extension ci-dessus, ces appels auraient silencieusement basculé sur les services réels (accès base de données) dans une suite de tests qui, jusqu'ici, ne touche jamais de base réelle. Pour préserver cette propriété (déjà documentée dès la Phase 2 : « la suite `node --test` fonctionne aujourd'hui sans base de données disponible »), les 11 appels à `createEngineRunner({...})` de ces six fichiers reçoivent désormais deux mocks supplémentaires (`getProjectValues` renvoyant `[]`, `markDependentsObsolete` renvoyant `[]`), sans toucher à une seule assertion métier :

- `tests/engines-runner.test.ts`
- `tests/energy-engine-runner.test.ts`
- `tests/battery-engine-runner.test.ts`
- `tests/alternator-engine-runner.test.ts`
- `tests/solar-engine-runner.test.ts`
- `tests/charger-engine-runner.test.ts`

Aucun des cinq fichiers `lib/engines/*-engine.ts` (les moteurs eux-mêmes) n'a été modifié — vérifié par `git diff --stat` sur les cinq fichiers, aucune sortie.

---

# Algorithme de propagation

1. **Lecture groupée unique** : `getProjectValues(projectId)` est appelé **au plus une fois** par run, uniquement si le moteur propose au moins une valeur retenue (aucun appel si `result.retainedValues` est vide ou absent). Le résultat est indexé en mémoire (`Map<key, ProjectRetainedValue>`) pour un accès `O(1)` par proposition.
2. **Détection** : pour chaque proposition, `changed = !existing || hasValueChanged(existing.value, proposal.value)`. Seul le champ `value` est comparé — jamais `simulatedValue`, `status`, `source`, `retainedAt` ni aucun horodatage (conforme à la consigne : « ne pas propager si seul un timestamp change »).
3. **Persistance inchangée** : que la valeur ait changé ou non, elle est toujours persistée via `retainValue` — la détection ne modifie en rien ce qui est écrit, seulement ce qui déclenche une propagation.
4. **Déduplication** : les clés changées sont accumulées dans un `Set` avant d'être converties en liste — une même clé proposée deux fois dans un même run n'est propagée qu'une fois.
5. **Propagation ciblée** : après la persistance de toutes les valeurs et de toutes les dépendances du run, `markDependentsObsolete(projectId, key)` est appelé pour chaque clé changée, dans l'ordre de détection. Cette fonction (Phase 3, non modifiée) résout elle-même les dépendants directs via le graphe déjà persisté et marque `OBSOLETE` chaque valeur retenue dépendante existante — le Runner ne connaît ni ne recrée cette logique.
6. **Ordre values → dependencies → propagation** : les dépendances proposées par ce même run sont persistées **avant** la propagation, pour que le graphe interrogé par `markDependentsObsolete` inclue déjà les arêtes tout juste déclarées (pertinent pour le tout premier run d'un moteur, qui déclare typiquement ses propres arêtes en même temps que ses valeurs).

Aucune propagation transitive multi-niveaux n'est introduite : `markDependentsObsolete` reste, comme en Phase 3, limité aux dépendants **directs** (MASTER-06 §30, dépendances ciblées) — ce comportement n'a pas été modifié.

---

# Performances

- **Une lecture par run, jamais une par proposition** : vérifié par test dédié (« une seule lecture groupée de l'existant, quel que soit le nombre de propositions »). Pour un run proposant N valeurs, le coût est `1 lecture groupée + N écritures de valeurs + M écritures de dépendances + K appels de propagation` (K = nombre de clés réellement changées, K ≤ N) — linéaire, sans lecture redondante.
- **Aucun appel de propagation pour une clé inchangée** : vérifié par test (« absence de propagation inutile »).
- **Aucune lecture ni propagation si le moteur ne propose aucune valeur retenue** : le bloc de lecture groupée est sauté entièrement (`retainedValueProposals.length > 0 ? ... : new Map()`).
- **Aucune optimisation supplémentaire ajoutée** (pas de traitement par lots des appels `markDependentsObsolete`, pas de cache inter-runs) : conforme à la consigne « sans optimisation prématurée ». Le comportement reste correct et raisonnablement efficace pour « plusieurs centaines de valeurs retenues » (une seule requête groupée reste proportionnée à ce volume ; au-delà, une optimisation par lots deviendrait pertinente mais n'a pas été demandée ni implémentée ici).

---

# Compatibilité

- **Aucun moteur métier modifié** : les cinq fichiers `lib/engines/{energy,battery,alternator,solar,charger}-engine.ts` sont strictement identiques à l'issue de cette phase (vérifié).
- **Aucune formule, aucune validation métier, aucun nom de clé modifié.**
- **Comportement des cinq moteurs strictement identique** : leurs propositions de valeurs retenues et de dépendances ne changent pas ; seul ce qui se passe **après** — côté Runner — a été étendu.
- **Aucune migration Prisma** : réutilisation intégrale des modèles et services de la Phase 3.
- **`EngineRunnerDeps` reste rétrocompatible** : les deux nouveaux champs sont optionnels, avec un défaut réel ; tout code appelant `createEngineRunner()` sans les fournir continue de fonctionner (et bénéficie désormais de la propagation réelle en production).

---

# Tests

Deux nouveaux fichiers, 22 nouveaux tests ; six fichiers existants mis à jour mécaniquement (aucune assertion modifiée) ; aucun test supprimé.

## `tests/engines-value-diff.test.ts` (10 tests)
Égalité de primitives, objets (indépendance à l'ordre des clés, nombre de clés différent), tableaux (longueur, ordre significatif), objets imbriqués, et `hasValueChanged` comme inverse exact.

## `tests/engines-runner-propagation.test.ts` (12 tests)
**✓ aucune valeur modifiée** (aucune propagation), **✓ une seule valeur modifiée** (propagation ciblée sur cette clé), **✓ plusieurs valeurs modifiées** (chacune propagée, les inchangées exclues), nouvelle clé jamais retenue (traitée comme changée), changement de métadonnées seules — `simulatedValue`/`retainedAt` — sans changement de `value` (aucune propagation), insensibilité à l'ordre des clés d'un objet, **✓ dépendances multiples** (le Runner délègue entièrement au service existant, quel que soit le nombre de dépendants qu'il résout), **✓ aucune dépendance** (le Runner appelle le service, qui ne produit aucun effet), **✓ propagation unique** (clé proposée deux fois → un seul appel), **✓ absence de propagation inutile** (aucune proposition → aucune lecture, aucune propagation), lecture groupée unique quel que soit le nombre de propositions, et non-régression de la persistance (chaque proposition reste écrite, changée ou non).

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 713 / # pass 713 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Arbitrages éventuels

1. **Mise à jour de six fichiers de test préexistants.** La mission demande « les moteurs existants ne doivent nécessiter aucune modification » — interprété comme portant sur les cinq fichiers `lib/engines/*-engine.ts` (source, comportement, formules), non sur leurs fichiers de test. Sans cette mise à jour mécanique (ajout de deux mocks par appel `createEngineRunner`), ces six fichiers auraient silencieusement dépendu d'un accès réel à la base de données pour continuer à passer — une régression de fond (perte d'isolation des tests), plus grave qu'une modification mécanique et non fonctionnelle de leurs mocks. Choix documenté ici plutôt qu'imposé silencieusement.
2. **Comparaison structurelle maison (`value-diff.ts`) plutôt que `JSON.stringify`.** Une comparaison par sérialisation JSON aurait été plus courte mais sensible à l'ordre des clés d'un objet (deux objets équivalents mais construits dans un ordre de propriétés différent auraient été vus à tort comme « changés »). La comparaison récursive retenue ici est plus robuste et directement testée pour ce cas précis.
3. **Ordre persist-values → persist-dependencies → propagation.** Non explicitement dicté par le schéma de la mission (qui ne mentionne pas explicitement l'étape « persister les dépendances » dans son diagramme simplifié), mais nécessaire pour que la propagation d'un premier run (qui déclare ses propres arêtes en même temps que ses valeurs) s'appuie sur un graphe à jour. Choix technique direct, sans impact métier.
4. **Aucune protection contre un échec partiel entre les étapes de persistance et de propagation** (pas de transaction englobante) — écart déjà noté comme dette technique mineure dans l'audit de Phase 4.5.1, non traité ici car hors du périmètre strict de cette mission (« infrastructure uniquement », pas de nouvelle garantie transactionnelle demandée).

---

# Validation des critères de sortie

| Critère | Statut |
|---|---|
| Build OK | ✅ `npm run build` réussi |
| TypeScript OK | ✅ `npx tsc --noEmit` sans erreur |
| Tous les tests passent | ✅ 713/713 (22 nouveaux tests dédiés à la propagation) |
| Aucun moteur modifié | ✅ Vérifié : `lib/engines/{energy,battery,alternator,solar,charger}-engine.ts` inchangés |
| Aucun calcul modifié | ✅ Aucune formule touchée, aucune valeur produite par les cinq moteurs n'est altérée |
| Les dépendances deviennent réellement obsolètes après modification | ✅ `EngineRunner` appelle désormais `markDependentsObsolete` pour chaque clé réellement modifiée, en réutilisant tel quel le service de la Phase 3 |
| Aucune régression | ✅ 691 tests préexistants toujours verts (713 au total avec les 22 nouveaux) ; isolation de la suite de tests vis-à-vis de la base de données préservée |

---

# Fin — PHASE-4.5.2-RAPPORT / FabSystem
