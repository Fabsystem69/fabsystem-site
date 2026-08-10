# PHASE-4.6-RAPPORT — Global Energy Balance (premier moteur d'agrégation)

**Date : 18/08/2026**
**Périmètre : un seul moteur, `lib/engines/global-energy-balance-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit les valeurs retenues `energy.*`, `battery.*`, `alternator.*`, `solar.*`, `charger.*` via `EngineContext`, sans jamais appeler ni recalculer les cinq moteurs sources. Aucun moteur existant modifié, `EngineRunner` et `Registry` non touchés, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/global-energy-balance-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts, value-diff.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                             ← inchangés
  solar-engine.ts, charger-engine.ts
  global-energy-balance-engine.ts                                                        ← nouveau (Phase 4.6)
```

C'est le **premier moteur d'agrégation** du dépôt : contrairement aux cinq précédents, il ne réalise aucun calcul primaire et ne prend **aucun paramètre** (`GlobalEnergyBalanceEngineInput` est un type vide) — il compose exclusivement des valeurs déjà produites et persistées par les cinq moteurs sources.

Même structuration en deux couches que les moteurs précédents :

- **`computeGlobalEnergyBalanceOutput(sources)`** — fonction pure, sans `EngineContext` : prend les cinq grandeurs déjà lues et compose l'équilibre global. Testable indépendamment de tout contexte.
- **`createGlobalEnergyBalanceEngine()`** — fabrique le `BaseEngine` : lit les cinq valeurs retenues sources via `context.getRetainedValue(...)`, appelle la fonction pure, construit les propositions `energyBalance.*`.

**Aucun couplage de code avec les cinq moteurs sources** : `global-energy-balance-engine.ts` n'importe aucun des cinq fichiers `*-engine.ts` (vérifié par recherche). Le lien est exclusivement une dépendance de **données** — cinq valeurs retenues déjà persistées — jamais un appel de fonction ni une réexécution de leurs formules.

Isolation vérifiée par recherche (`grep`) : aucun fichier hors `lib/engines/global-energy-balance-engine.ts` et ses tests ne référence ce moteur. `EngineRunner` et `Registry` sont strictement identiques à l'issue de cette phase (`git diff --stat` sans sortie sur les sept fichiers du socle et des cinq moteurs existants).

---

# Agrégation

Cinq grandeurs sont lues, une par domaine — exactement les cinq domaines requis par la mission, chacune contribuant réellement au calcul (aucune lecture décorative) :

| Domaine | Clé lue | Grandeur utilisée |
|---|---|---|
| Energy | `energy.dailyConsumption` | `dailyWh`, `complete` |
| Battery | `battery.usefulEnergy` | `usefulEnergyWh` |
| Alternator | `alternator.rechargeableEnergy` | `rechargeableEnergyWh` |
| Solar | `solar.dailyEnergy` | `dailySolarEnergyWh` |
| Charger | `charger.rechargeableEnergy` | `rechargeableEnergyWh` |

Aucune de ces cinq valeurs n'est recalculée : chacune est lue telle quelle et réapparaît inchangée dans `GlobalEnergyBalanceEngineOutput` (vérifié par test : « les grandeurs sources sont reprises telles quelles »). Les seules opérations appliquées sont des **sommes, une différence et un ratio** entre valeurs déjà calculées — jamais une formule primaire (aucune conversion Wh↔Ah, aucune notion de tension, aucune dérivation physique nouvelle).

---

# Formules

Toutes déterministes, chacune isolée dans `computeGlobalEnergyBalanceOutput`, composées exclusivement à partir des cinq grandeurs sources :

| # | Grandeur | Formule |
|---|---|---|
| 1 | Énergie rechargeable totale (Wh) | `totalRechargeableEnergyWh = alternatorRechargeableEnergyWh + solarRechargeableEnergyWh + chargerRechargeableEnergyWh` |
| 2 | Énergie disponible totale (Wh) | `totalAvailableEnergyWh = usefulEnergyWh` (reprise directe de la réserve utile batterie) |
| 3 | Couverture énergétique globale | `globalCoverageRatio = totalRechargeableEnergyWh / dailyWh` |
| 4 | Équilibre énergétique (Wh) | `globalBalanceWh = totalRechargeableEnergyWh − dailyWh` |
| 5 | Autonomie globale (jours) | `globalAutonomyDays = globalBalanceWh ≥ 0 ? null : totalAvailableEnergyWh / │globalBalanceWh│` |

- **Formule 5** : lorsque l'équilibre est soutenable (recharge ≥ besoin), l'autonomie globale est représentée par `null` (pas de notion de « jours avant épuisement » puisqu'il n'y a pas d'épuisement) plutôt qu'une valeur infinie non représentable en JSON. En déficit, elle indique le nombre de jours avant épuisement de la réserve utile batterie au rythme du déficit quotidien constaté — une composition directe de deux grandeurs déjà calculées (`totalAvailableEnergyWh`, `globalBalanceWh`), sans nouvelle hypothèse physique.
- Aucune formule des cinq moteurs sources n'est dupliquée : ni la dérivation Wh↔Ah (Energy), ni la profondeur de décharge (Battery), ni le rendement/tension (Alternator, Solar, Charger) ne réapparaissent ici sous quelque forme que ce soit.

---

# Valeurs retenues

Cinq propositions (`EngineResult.retainedValues`), toutes `energyBalance.*` :

| Clé | Contenu |
|---|---|
| `energyBalance.totalAvailableEnergy` | `{ totalAvailableEnergyWh }` |
| `energyBalance.totalRechargeableEnergy` | `{ totalRechargeableEnergyWh }` |
| `energyBalance.coverage` | `{ globalCoverageRatio }` |
| `energyBalance.balance` | `{ globalBalanceWh }` |
| `energyBalance.autonomy` | `{ globalAutonomyDays }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que les cinq moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0/4.5.2, inchangé) reste seul responsable de la persistance et, désormais, de la propagation d'obsolescence.

---

# Dépendances

Graphe **exact** (une arête uniquement lorsque la formule produisant cette clé utilise réellement, numériquement, la source visée) : 17 arêtes au total, réparties selon ce que chaque grandeur utilise réellement :

```
energyBalance.totalAvailableEnergy      dépend de   battery.usefulEnergy

energyBalance.totalRechargeableEnergy   dépend de   alternator.rechargeableEnergy
                                                     solar.dailyEnergy
                                                     charger.rechargeableEnergy

energyBalance.coverage                  dépend de   energy.dailyConsumption
                                                     alternator.rechargeableEnergy
                                                     solar.dailyEnergy
                                                     charger.rechargeableEnergy

energyBalance.balance                   dépend de   energy.dailyConsumption
                                                     alternator.rechargeableEnergy
                                                     solar.dailyEnergy
                                                     charger.rechargeableEnergy

energyBalance.autonomy                  dépend de   energy.dailyConsumption
                                                     battery.usefulEnergy
                                                     alternator.rechargeableEnergy
                                                     solar.dailyEnergy
                                                     charger.rechargeableEnergy
```

`energyBalance.totalAvailableEnergy` est la seule clé à une dépendance unique (elle ne fait que reprendre `battery.usefulEnergy`). Les quatre autres agrègent effectivement plusieurs sources, d'où un nombre d'arêtes plus élevé que les moteurs de recharge individuels (2 arêtes chacun en Phases 4.3-4.5) — cohérent avec la nature agrégative de ce premier moteur. Aucune dépendance vers un domaine non listé (`cable.*`, `protection.*`, Volta) — vérifié par test.

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0). Ce moteur n'a **aucun paramètre propre** : il n'existe donc aucune `ValidationError` de type « paramètre manquant/invalide » — toute la validation porte sur les cinq dépendances lues.

- **`DependencyError` — données manquantes** (`<DOMAINE>_DATA_MISSING`) : une des cinq valeurs retenues sources n'existe pas encore pour ce Project. Un code distinct par domaine (`ENERGY_DATA_MISSING`, `BATTERY_DATA_MISSING`, `ALTERNATOR_DATA_MISSING`, `SOLAR_DATA_MISSING`, `CHARGER_DATA_MISSING`), reprenant le préfixe déjà établi par les Phases 4.2-4.5.
- **`DependencyError` — données obsolètes** (`<DOMAINE>_DATA_OBSOLETE`) : la valeur existe mais son `status` n'est pas `ACTIVE`.
- **`DependencyError` — données incompatibles** (`<DOMAINE>_DATA_INCOMPATIBLE`) : la valeur existe et est active, mais sa forme ne correspond pas à ce qui est attendu (garde défensive sur le contenu `Json` non typé). Ce libellé (« incompatibles ») reprend le vocabulaire propre à cette phase — les moteurs précédents utilisaient `_INVALID_SHAPE` pour le même type de garde ; voir « Arbitrages éventuels ».
- **`CalculationError` — calcul impossible** : deux cas — (`ENERGY_DATA_INCOMPLETE`, code identique à celui déjà utilisé par les Phases 4.2-4.5) l'Energy Engine n'a pas pu tout résoudre (`complete: false`) ; (`ENERGY_BALANCE_COVERAGE_INDETERMINATE`) le besoin journalier (`dailyWh`) vaut exactement zéro, rendant le taux de couverture global mathématiquement indéterminé (`0/0`), jamais laissé fuiter comme `NaN`.

---

# Tests

Deux nouveaux fichiers, 26 nouveaux tests, aucun fichier existant modifié.

## `tests/global-energy-balance-engine.test.ts` (12 tests) — fonction pure `computeGlobalEnergyBalanceOutput`
Somme des trois sources de recharge, reprise directe de la réserve utile, **✓ couverture complète**, **✓ couverture partielle**, **✓ équilibre positif** (autonomie `null`), équilibre exactement nul (soutenable), **✓ équilibre négatif** (autonomie globale finie), besoin journalier nul (`CalculationError`), et non-recalcul des grandeurs source.

## `tests/global-energy-balance-engine-runner.test.ts` (18 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, **✓ toutes les sources disponibles**, **✓ une source absente**, **✓ plusieurs sources absentes** (+ un test paramétré vérifiant que chacune des cinq sources déclenche bien son propre code de domaine si elle manque), **✓ données obsolètes**, données incompatibles (forme inattendue), énergie incomplète (calcul impossible), **✓ valeurs retenues proposées** (5 clés, `value`/`simulatedValue` égales), **✓ dépendances proposées** (uniquement vers les cinq domaines autorisés), graphe de dépendances exact (les 17 arêtes précises), et intégration bout en bout via `createEngineRunner` (Phase 4.0/4.5.2, non modifié) : persistance des 5 valeurs et des 17 dépendances, propagation d'une erreur du moteur à travers le runner.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 735 / # pass 735 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle, il réutilise `ProjectRetainedValue`/`ProjectValueDependency` (Phase 3) via `EngineRunner` (Phase 4.0/4.5.2) exactement comme les moteurs précédents, y compris la propagation d'obsolescence introduite en Phase 4.5.2 (une clé `energyBalance.*` qui change sera désormais correctement propagée si elle a elle-même des dépendants, sans aucune modification supplémentaire nécessaire).
- **Aucun fichier existant modifié** : `Energy Engine`, `Battery Engine`, `Alternator Engine`, `Solar Engine`, `Charger Engine`, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché (vérifié par `git diff --stat`).
- **Aucun calcul métier dupliqué** : vérifié à la fois par relecture (aucune formule des cinq moteurs sources n'est réécrite) et par construction (la fonction pure ne prend en entrée que des grandeurs déjà calculées, jamais des données brutes comme des consommateurs ou des paramètres de dimensionnement).
- **Build et tests intégralement au vert.**

---

# Arbitrages éventuels

1. **Consolidation de « marge énergétique » et « équilibre énergétique » en une seule grandeur (`globalBalanceWh`).** La section Objectifs de la mission liste les deux comme exemples distincts, mais aucune formule différenciée n'est fournie pour l'une ou l'autre, et la liste est explicitement introduite par « par exemple » (illustrative, non restrictive, à la différence des phases précédentes). Les deux termes désignent le même concept (différentiel Wh entre énergie rechargeable totale et besoin), et le jeu de tests requis ne teste explicitement que l'« équilibre » (positif/négatif). Une seule grandeur canonique a donc été retenue plutôt que d'inventer une deuxième formule non spécifiée pour distinguer artificiellement les deux.
2. **« Énergie disponible totale » interprétée comme la réserve utile batterie, pas comme une resomme des sources de recharge.** La mission liste séparément « énergie disponible totale » et « énergie rechargeable totale » ; ce rapport les interprète comme deux concepts différents — le stock actuellement disponible (batterie) versus le flux qu'on peut y ajouter (recharge) — plutôt que deux synonymes. Interprétation documentée, pas une donnée explicitement tranchée par un MASTER.
3. **Renommage `_INVALID_SHAPE` → `_DATA_INCOMPATIBLE`.** Les moteurs précédents (Phases 4.2-4.5) utilisaient un code `_INVALID_SHAPE` pour signaler une valeur retenue de forme inattendue. Cette phase liste explicitement « données incompatibles » comme catégorie de validation attendue ; le code a donc été adapté à ce vocabulaire (`_DATA_INCOMPATIBLE`) plutôt que de réutiliser `_INVALID_SHAPE`, introduisant une divergence de nommage mineure entre ce moteur et les cinq précédents pour un même type de garde. Signalé pour une éventuelle harmonisation future (cf. « Conventions à figer » de l'audit Phase 4.5.1).
4. **Autonomie globale représentée par `null` plutôt qu'une valeur numérique lorsque l'équilibre est soutenable.** Aucun MASTER ne précise comment représenter une autonomie « illimitée ». `null` a été retenu (cohérent avec `Infinity`, non représentable tel quel en JSON) plutôt qu'une valeur sentinelle numérique (ex. `-1` ou un grand nombre), pour rester sans ambiguïté — à confirmer si une convention différente est préférée pour un futur module consommateur (ex. Volta).
5. **Duplication du patron `readRetainedValue`/`hasNumberField` au sein de ce nouveau fichier.** Comme relevé par l'audit de Phase 4.5.1, ce patron est déjà dupliqué dans les moteurs précédents ; il est repris une fois de plus ici (à 5 domaines au lieu de 1-2) faute de module partagé consolidé. Aucune duplication de **formule métier** n'a lieu — uniquement ce helper d'infrastructure déjà identifié comme candidat à extraction future.

---

# Fin — PHASE-4.6-RAPPORT / FabSystem
