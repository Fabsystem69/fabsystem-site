# PHASE-5.0-RAPPORT — Diagram Engine

**Date : 22/08/2026**
**Périmètre : un seul moteur, `lib/engines/diagram-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit `circuit.*`, `cable.*` et `protection.*` via `EngineContext`, sans jamais appeler ni recalculer le Circuit Engine (Phase 4.7/4.7.1), le Cable Engine (Phase 4.8) ou le Protection Engine (Phase 4.9). Aucun calcul électrique, aucun SVG, aucun PDF, aucun placement graphique. Aucun moteur existant modifié, `EngineRunner` et `Registry` non touchés, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/diagram-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts, value-diff.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                             ← inchangés
  solar-engine.ts, charger-engine.ts, global-energy-balance-engine.ts,
  circuit-engine.ts, cable-engine.ts, protection-engine.ts
  diagram-engine.ts                                                                      ← nouveau (Phase 5.0)
```

C'est le **premier moteur de représentation** du dépôt, distinct des huit moteurs précédents (cinq moteurs de calcul, un agrégateur, deux moteurs structurels/dérivés qui produisent tous une grandeur physique nouvelle) : le Diagram Engine ne calcule rien, il **assemble** trois sources déjà produites (`circuit.*`, `cable.*`, `protection.*`) en un objet par circuit, prêt à être consommé par un futur générateur de schémas. Cohérent avec MASTER-06 §43-44 : « Le Schéma référence le Circuit plutôt que de recopier inutilement toutes ses données métier » — ce moteur prépare précisément cette référence assemblée, sans jamais décider d'un placement graphique ni produire de rendu.

Même structuration en deux couches que les moteurs précédents :

- **`computeDiagramEngineOutput(input, circuits, cables, protections)`** — fonction pure, sans `EngineContext` : prend la liste des circuits à représenter et trois dictionnaires de données déjà résolues, assemble le modèle. Testable indépendamment de tout contexte.
- **`createDiagramEngine()`** — fabrique le `BaseEngine` : lit `circuit.<circuitId>`, `cable.<circuitId>` et `protection.<circuitId>` via `context.getRetainedValue(...)` pour chaque circuit demandé, appelle la fonction pure, construit les propositions `diagram.*`.

**Un nombre variable de valeurs retenues**, comme les trois moteurs précédents : `diagram.<circuitId>` — une clé par circuit représenté, pas un jeu fixe.

**Aucune donnée nouvelle** : chaque champ du modèle produit est une copie directe d'un champ déjà calculé par un moteur précédent — aucune addition, multiplication, comparaison ou dérivation d'aucune sorte n'a lieu dans ce fichier (vérifié par relecture : `computeDiagramEngineOutput` ne contient que des accès de propriété et de la construction d'objets).

Isolation vérifiée : `circuit-engine.ts`, `cable-engine.ts`, `protection-engine.ts`, `runner.ts`, `registry.ts` et les six autres moteurs sont strictement identiques à l'issue de cette phase (`git diff --stat` sans sortie) ; aucun fichier hors `lib/engines/diagram-engine.ts` et ses tests ne référence ce moteur (`grep` sur `diagram-engine`/`DIAGRAM_ENGINE_ID`/`createDiagramEngine`).

---

# Modèle du diagramme

## Entrée : la liste des circuits à représenter

```ts
type DiagramDefinitionInput = { circuitId: string };
type DiagramEngineInput = { circuits: DiagramDefinitionInput[] };
```

Aucun paramètre de calcul : la seule décision laissée à l'appelant est le choix des circuits à inclure — cohérent avec un moteur qui n'effectue aucun calcul électrique.

## Sortie : un objet complet par circuit

```ts
type DiagramComputation = {
  circuitId: string;
  circuit: {
    name: string;
    circuitType: string | null;
    consumerNames: string[];
    cumulatedPowerW: number;
    cumulatedCurrentA: number | null;
    voltageV: number;
  };
  cable: {
    electricalLengthM: number;
    retainedSectionMm2: number;
    computedVoltageDropPercentage: number;
  };
  protection: {
    protectionType: string;
    retainedRatingA: number;
    marginRatio: number;
  };
};
```

Reprend exactement les éléments cités en exemple par la mission (« circuit, câble, protection, consommateurs associés, informations utiles à l'affichage ») : les consommateurs associés vivent dans `circuit.consumerNames` (déjà porté par le Circuit Engine), et chaque sous-objet ne conserve que les champs pertinents à l'affichage d'un schéma (nom, type, grandeurs cumulées, tension côté circuit ; longueur, section et chute de tension côté câble ; type et calibre retenu côté protection) plutôt que de recopier intégralement les trois enregistrements sources — un choix documenté en Arbitrage.

Aucun champ de placement (position, page, rotation) : conforme à MASTER-06 §47 (« ces données [de présentation] ne doivent pas polluer les objets métier du Projet ») et à la mission (« le moteur ne décide jamais du placement graphique »).

---

# Valeurs retenues

**Une clé `diagram.<circuitId>` par circuit représenté**, même convention que `circuit.<id>` (Phase 4.7), `cable.<circuitId>` (Phase 4.8) et `protection.<circuitId>` (Phase 4.9).

| Clé | Contenu |
|---|---|
| `diagram.frigo` | `{ circuitId, circuit, cable, protection }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que tous les moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (inchangé) reste seul responsable de la persistance et de la propagation d'obsolescence.

Aucun circuit demandé (`circuits: []`) → aucune valeur retenue, aucune dépendance proposée — cas légitime, vérifié par test.

---

# Dépendances

Graphe **exact**, comme les trois moteurs précédents : chaque entrée de diagramme dépend uniquement des trois sources réellement lues.

```
diagram.<circuitId>   dépend de   circuit.<circuitId>
diagram.<circuitId>   dépend de   cable.<circuitId>
diagram.<circuitId>   dépend de   protection.<circuitId>
```

Trois arêtes par circuit représenté — aucune dépendance vers `energy.*`, `battery.*`, `alternator.*`, `solar.*`, `charger.*`, `energyBalance.*` ou Volta (vérifié par test).

**`energyBalance.*` non utilisé** : la mission l'autorise « uniquement si réellement utile ». Chaque circuit porte déjà, via `circuit.<id>`, toutes les grandeurs nécessaires à sa propre représentation (consommateurs, puissance, courant, tension) ; `energyBalance.*` est un agrégat global du Projet (Phase 4.6) sans lien direct avec un circuit particulier. Aucune formule ni aucun champ du modèle produit n'en aurait eu l'usage — lire cette valeur aurait été une dépendance déclarée sans être réellement utilisée, ce que la mission exclut explicitement.

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0).

- **`DependencyError` — circuit/câble/protection absent, obsolète ou incompatible** (`CIRCUIT_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`, `CABLE_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`, `PROTECTION_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`) : la valeur retenue correspondante est absente, non `ACTIVE`, ou de forme inattendue (chaque source doit exposer les champs listés dans « Modèle du diagramme »). Même famille de codes que les moteurs précédents.
- **`ValidationError` — paramètres/structure invalides** :
  - `CIRCUITS_MISSING` : `circuits` n'est pas un tableau.
  - `DIAGRAM_PARAMETER_MISSING` : `circuitId` absent ou vide.
  - `DIAGRAM_DUPLICATE_CIRCUIT` : un même `circuitId` apparaît deux fois.
- **`CalculationError` — modèle impossible à construire** (`DIAGRAM_MODEL_IMPOSSIBLE`) : les trois sources lues pour un même `circuitId` ne se référencent pas mutuellement (le `id` porté par `circuit.<id>`, ou le `circuitId` porté par `cable.<id>`/`protection.<id>`, diffère du `circuitId` demandé) — signale une incohérence entre les données stockées qui empêche de garantir que le modèle assemblé décrit réellement un seul et même circuit.

« Données incompatibles » (catégorie citée par la mission) est couverte par les erreurs `_INCOMPATIBLE` ci-dessus (forme individuelle inattendue d'une source) ; « modèle impossible à construire » est distinguée comme une incohérence de **cohérence croisée** entre les trois sources déjà individuellement valides — un scénario plus sévère qu'une simple forme inattendue.

---

# Tests

Deux nouveaux fichiers, 23 nouveaux tests, aucun fichier existant modifié.

## `tests/diagram-engine.test.ts` (13 tests) — fonction pure `computeDiagramEngineOutput`
**✓ un circuit**, **✓ plusieurs circuits** (assemblage indépendant), **✓ données complètes** (toutes les grandeurs utiles à l'affichage reprises telles quelles), **✓ circuit absent**, **✓ câble absent**, **✓ protection absente**, données incohérentes entre sources (`DIAGRAM_MODEL_IMPOSSIBLE`), `circuitId` manquant/dupliqué, payload invalide, **✓ modèle produit** (assemblage correct, aucun recalcul des grandeurs sources), aucun circuit demandé (modèle vide sans erreur).

## `tests/diagram-engine-runner.test.ts` (10 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, `circuit.<id>`/`cable.<id>`/`protection.<id>` absent (3 scénarios) et de forme inattendue, **✓ valeurs retenues proposées** (une clé `diagram.<circuitId>` par circuit, `value`/`simulatedValue` égales), **✓ dépendances proposées** (trois arêtes par circuit, exclusivement vers `circuit.<circuitId>`, `cable.<circuitId>` et `protection.<circuitId>`), aucun circuit → aucune valeur ni dépendance, et intégration bout en bout via `createEngineRunner` (Phase 4.0/4.5.2, non modifié) : persistance des valeurs et dépendances, propagation d'une erreur du moteur (`DIAGRAM_MODEL_IMPOSSIBLE`) à travers le runner, garantie que seules des `EngineError` sont levées.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 844 / # pass 844 / # fail 0   (821 précédents + 23 nouveaux)
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle en base — les entrées de diagramme vivent uniquement comme valeurs retenues JSON (`ProjectRetainedValue`), exactement comme toutes les grandeurs des moteurs précédents.
- **Aucun fichier existant modifié** : les huit moteurs précédents, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché (vérifié par `git diff --stat` et `grep`).
- **Aucun calcul électrique ajouté** : vérifié par relecture — `computeDiagramEngineOutput` ne contient que des lectures de propriétés et de la construction d'objets, aucun opérateur arithmétique.
- **Aucun SVG, aucun PDF, aucun placement graphique** : le modèle produit ne contient aucun champ de présentation (position, taille, rotation, page).
- **Fonctionne uniquement via `EngineRunner`** : aucune route API, aucun accès direct depuis une interface.
- **Toutes les dépendances sont explicites** : trois arêtes par circuit, exclusivement vers `circuit.<circuitId>`, `cable.<circuitId>` et `protection.<circuitId>`.
- **Build et tests intégralement au vert.**

---

# Arbitrages éventuels

1. **`energyBalance.*` non lu.** La mission l'autorisait « uniquement si réellement utile ». Aucun champ du modèle de diagramme n'aurait eu l'usage d'un agrégat global du Projet (Phase 4.6) : chaque circuit porte déjà ses propres grandeurs via `circuit.<id>`. Choix documenté plutôt que traité silencieusement, conformément à la discipline établie depuis la Phase 4.3 (« dépendances réellement utilisées »).
2. **Sous-ensembles de champs plutôt que recopie intégrale des trois enregistrements sources.** La mission cite « circuit, câble, protection, consommateurs associés, informations utiles à l'affichage » sans figer la forme exacte. Le choix retenu ne conserve que les champs directement utiles à la représentation d'un schéma (ex. `referenceCurrentA`/`minimumSectionMm2` du câble ne sont pas repris, seule la section retenue et la chute de tension effective le sont) plutôt que de dupliquer intégralement `cable.<id>` et `protection.<id>` — jugé plus proche de l'esprit « prépare le modèle exploitable par un générateur de schémas » que d'un simple miroir brut des trois sources. Une alternative (recopie intégrale) reste possible sans rupture de compatibilité si un futur générateur en a besoin.
3. **`DIAGRAM_MODEL_IMPOSSIBLE` comme vérification de cohérence croisée entre les trois sources.** La mission liste « modèle impossible à construire » comme catégorie de validation distincte de « données incompatibles ». Le choix retenu interprète cette catégorie comme une incohérence entre les identifiants de circuit portés par les trois enregistrements eux-mêmes (`circuit.id`, `cable.circuitId`, `protection.circuitId` doivent tous correspondre au `circuitId` demandé) — un scénario de corruption/incohérence de données plus grave qu'une simple forme inattendue, mais qui n'invente aucune règle métier nouvelle : il vérifie uniquement que les données déjà produites par les trois moteurs précédents se réfèrent bien au même circuit.
4. **Aucun paramètre de calcul dans `DiagramDefinitionInput`.** Contrairement au Cable Engine et au Protection Engine, ce moteur n'effectuant aucun calcul, la mission ne demandait aucun paramètre métier — seule la liste des circuits à inclure a été retenue comme entrée, cohérent avec un moteur d'assemblage pur.

---

# Fin — PHASE-5.0-RAPPORT / FabSystem
