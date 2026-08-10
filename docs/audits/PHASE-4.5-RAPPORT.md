# PHASE-4.5-RAPPORT — Charger Engine (cinquième moteur métier)

**Date : 16/08/2026**
**Périmètre : un seul moteur, `lib/engines/charger-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit les valeurs retenues `energy.*` (Phase 4.1) et `battery.*` (Phase 4.2) via `EngineContext`, ne les recalcule jamais. Aucun autre moteur modifié, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/charger-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts        ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts, solar-engine.ts   ← inchangés
  charger-engine.ts                                                           ← nouveau (Phase 4.5)
```

Même structuration en deux couches que les quatre moteurs précédents :

- **`computeChargerEngineOutput(input, energy, battery)`** — fonction pure, sans `EngineContext` : prend les paramètres chargeur et les grandeurs déjà lues, calcule l'évaluation de recharge secteur. Testable indépendamment de tout contexte.
- **`createChargerEngine()`** — fabrique le `BaseEngine` : lit `energy.dailyConsumption` et `battery.usefulCapacity` via `context.getRetainedValue(...)`, valide les paramètres, appelle la fonction pure, construit les propositions `charger.*`.

**Aucun couplage de code avec l'Energy Engine, le Battery Engine, l'Alternator Engine ou le Solar Engine** : `charger-engine.ts` n'importe aucun de ces quatre fichiers (vérifié par recherche). Le seul lien entre les moteurs est une dépendance de **données** — les valeurs retenues persistées en base par des runs antérieurs — jamais un appel de fonction direct.

Isolation vérifiée par recherche (`grep`) : aucun fichier hors `lib/engines/charger-engine.ts` et ses tests ne référence ce moteur. Il n'est enregistré dans aucun `Registry` applicatif.

---

# Paramètres

Conformément à la contrainte (« tous les paramètres doivent être fournis explicitement, aucune valeur métier par défaut, aucun coefficient codé en dur ») :

```ts
type ChargerEngineInput = {
  nominalPowerW: number;           // requis, > 0
  maxCurrentA: number;             // requis, > 0
  outputVoltageV: number;          // requis, > 0
  systemEfficiencyRatio: number;   // requis, (0, 1]
  chargingDurationHours: number;   // requis, [0, 24]
};
```

- **`outputVoltageV` est un paramètre propre au chargeur**, à la différence de l'Alternator Engine (Phase 4.3) et du Solar Engine (Phase 4.4), qui lisent tous deux `Project.voltage`. Ce moteur **ne lit jamais `Project.voltage`** : la mission cite explicitement « tension de sortie » comme exemple de paramètre chargeur, contrairement aux deux phases précédentes où la tension n'apparaissait pas dans la liste des paramètres. `outputVoltageV` n'est donc pas comparé à `Project.voltage` (aucune catégorie « tension incompatible » n'est listée dans la Validation de cette phase, à la différence du Battery Engine) — voir « Arbitrages nécessaires » pour la discussion de ce choix.
- **`systemEfficiencyRatio` est obligatoire**, sans qualificatif « si applicable » dans la mission (comme pour le Solar Engine, Phase 4.4, à la différence du rendement optionnel de l'Alternator Engine).
- **Deux limites nominales indépendantes** (`nominalPowerW` et `maxCurrentA`) sont fournies : la formule retient la plus restrictive des deux, une pratique réelle de dimensionnement chargeur (voir Formules).

---

# Formules

Toutes déterministes, chacune isolée dans `computeChargerEngineOutput` :

| # | Grandeur | Formule |
|---|---|---|
| 1 | Puissance réellement disponible (W) | `availablePowerW = min(nominalPowerW, maxCurrentA × outputVoltageV) × systemEfficiencyRatio` |
| 2 | Courant de charge (A) | `chargingCurrentA = availablePowerW / outputVoltageV` |
| 3 | Énergie rechargeable (Wh) | `rechargeableEnergyWh = availablePowerW × chargingDurationHours` |
| 4 | Temps de recharge théorique (h) | `theoreticalRechargeTimeHours = usefulCapacityAh / chargingCurrentA` |
| 5 | Couverture énergétique | `coverageRatio = rechargeableEnergyWh / dailyWh` |

- **Formule 1 — `min(...)`** : un chargeur possède deux limites nominales indépendantes (puissance et courant à une tension donnée) ; la puissance réellement livrable est bornée par celle qui est atteinte en premier — ce n'est pas un coefficient inventé, c'est la contrainte physique la plus restrictive entre deux valeurs explicitement fournies. Documenté avec un test dédié (« puissance disponible limitée par le courant maximal plutôt que la puissance nominale »).
- Formule 4 cible la **capacité utile** batterie (`battery.usefulCapacity.usefulCapacityAh`, Phase 4.2), par cohérence avec l'Alternator Engine et le Solar Engine.
- Formule 5 compare l'énergie rechargeable au **besoin journalier** (`energy.dailyConsumption.dailyWh`, Phase 4.1), même convention que le Solar Engine (« couverture », pas « marge » comme l'Alternator Engine).
- `availablePowerW`, `chargingCurrentA` et `rechargeableEnergyWh` ne dépendent d'aucune valeur retenue `energy.*`/`battery.*` — uniquement des paramètres. Cela se reflète directement dans le graphe de dépendances (voir plus bas).

---

# Valeurs retenues

Cinq propositions (`EngineResult.retainedValues`), toutes `charger.*` — cette fois, les sections « Objectifs » et « Calculs : uniquement » de la mission citent exactement les cinq mêmes grandeurs (contrairement aux phases 4.2/4.3/4.4, où un écart existait entre les deux sections) :

| Clé | Contenu |
|---|---|
| `charger.availablePower` | `{ availablePowerW }` |
| `charger.chargingCurrent` | `{ chargingCurrentA }` |
| `charger.rechargeableEnergy` | `{ rechargeableEnergyWh }` |
| `charger.rechargeTime` | `{ theoreticalRechargeTimeHours }` |
| `charger.coverage` | `{ coverageRatio }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que les quatre moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0, inchangé) reste seul responsable de l'appel à `retainValue`.

---

# Dépendances

Graphe **exact** (mission explicite : « créer uniquement des dépendances réellement utilisées ») :

```
charger.rechargeTime  dépend de   battery.usefulCapacity
charger.coverage      dépend de   energy.dailyConsumption
```

`charger.availablePower`, `charger.chargingCurrent` et `charger.rechargeableEnergy` n'ont **aucune** dépendance : elles se déduisent uniquement des paramètres. Aucune dépendance vers `alternator.*`, `solar.*`, `cable.*`, `protection.*` ou Volta — vérifié par test (« graphe de dépendances exact »).

Ce graphe reprend la même structure que l'Alternator Engine et le Solar Engine (deux arêtes, mêmes cibles finales), mais avec une clé purement paramétrique de plus (`charger.chargingCurrent`, sans dépendance) — la structure du graphe suit naturellement le nombre de grandeurs à calculer, pas une règle fixe à trois.

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0), toutes bloquantes (même choix que les moteurs précédents — pas de canal `result.errors` non bloquant, cohérent avec une grandeur agrégée unique par run).

- **`DependencyError` — données energy absentes** (`ENERGY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : `energy.dailyConsumption` absent, non `ACTIVE`, ou de forme inattendue.
- **`DependencyError` — données battery absentes** (`BATTERY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : mêmes trois cas pour `battery.usefulCapacity`.
- **`ValidationError` — paramètres chargeur absents** (`CHARGER_PARAMETER_MISSING`) : un des cinq paramètres obligatoires manque.
- **`ValidationError` — puissance invalide** (`CHARGER_POWER_INVALID`) : `nominalPowerW` non fini, négatif ou nul.
- **`ValidationError` — courant invalide** (`CHARGER_CURRENT_INVALID`) : `maxCurrentA` ou `outputVoltageV` non finis, négatifs ou nuls. `outputVoltageV` est regroupé sous ce code faute de catégorie « tension » distincte listée par la mission — il conditionne directement la conversion puissance ↔ courant, donc ce regroupement reste cohérent.
- **`ValidationError` — rendement invalide** (`CHARGER_EFFICIENCY_INVALID`) : `systemEfficiencyRatio` hors de `(0, 1]`.
- **`ValidationError` — durée invalide** (`CHARGER_DURATION_INVALID`) : `chargingDurationHours` négative ou supérieure à 24h (contrainte dimensionnelle, pas commerciale).
- **`CalculationError` — calcul impossible** : deux cas — (`ENERGY_DATA_INCOMPLETE`) l'Energy Engine n'a pas pu tout résoudre (`complete: false`) ; (`CHARGER_COVERAGE_INDETERMINATE`) le besoin journalier (`dailyWh`) vaut exactement zéro, rendant le taux de couverture mathématiquement indéterminé (`0/0`), jamais laissé fuiter comme `NaN`.

Contrairement à l'Alternator Engine et au Solar Engine, **il n'existe pas de scénario « tension système inconnue »** ici : ce moteur ne lit jamais `Project.voltage`, `outputVoltageV` étant son propre paramètre validé indépendamment. Par construction (`nominalPowerW`, `maxCurrentA`, `outputVoltageV` et `systemEfficiencyRatio` tous validés strictement positifs), `availablePowerW` et `chargingCurrentA` sont toujours strictement positifs : aucune division par zéro n'est possible sur la formule du temps de recharge.

---

# Tests

Deux nouveaux fichiers, 46 nouveaux tests, aucun fichier existant modifié.

## `tests/charger-engine.test.ts` (17 tests) — fonction pure `computeChargerEngineOutput`
**✓ petit chargeur**, **✓ gros chargeur**, puissance limitée par le courant plutôt que par la puissance nominale, **✓ faible durée de charge**, **✓ longue durée de charge**, durée nulle, **✓ rendement faible**, **✓ rendement élevé**, courant de charge, temps de recharge théorique, **✓ couverture insuffisante**, **✓ couverture complète**, besoin journalier nul (`CalculationError`), et non-recalcul des grandeurs source.

## `tests/charger-engine-runner.test.ts` (29 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, **✓ énergie absente**, **✓ batterie absente** (+ obsolescence et forme invalide pour chacune), énergie incomplète (calcul impossible), **✓ paramètres invalides** (manquant, puissance invalide, courant invalide ×2, rendement invalide ×2, durée invalide ×2), **✓ valeurs retenues proposées** (5 clés, `value`/`simulatedValue` égales), **✓ dépendances proposées** (uniquement vers `energy.*`/`battery.*`), **✓ graphe de dépendances exact** (les deux arêtes précises, rien d'autre), et intégration bout en bout via `createEngineRunner` (Phase 4.0, non modifié) : persistance des 5 valeurs et des 2 dépendances, propagation d'une erreur du moteur à travers le runner.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 691 / # pass 691 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle, il réutilise `ProjectRetainedValue`/`ProjectValueDependency` (Phase 3) via `EngineRunner` (Phase 4.0) exactement comme les moteurs précédents.
- **Aucun fichier existant modifié** : `Energy Engine`, `Battery Engine`, `Alternator Engine`, `Solar Engine`, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché. Seuls trois fichiers nouveaux (`lib/engines/charger-engine.ts` et ses deux fichiers de test) ont été créés.
- **Aucun autre moteur créé, aucune interface graphique.**
- **Build et tests intégralement au vert.**

---

# Arbitrages nécessaires

1. **`outputVoltageV` non comparé à `Project.voltage`.** La mission liste explicitement « tension de sortie » comme paramètre chargeur mais ne mentionne aucune catégorie de validation « tension incompatible » pour cette phase (à la différence du Battery Engine, Phase 4.2, qui comparait explicitement son paramètre de tension à `Project.voltage`). Choix retenu : `outputVoltageV` est utilisé directement, sans lecture ni comparaison à `Project.voltage`, en cohérence littérale avec la liste de validation fournie. Une lecture alternative aurait pu ajouter cette vérification par précaution (comme pour le Battery Engine) — non retenue ici pour ne pas inventer une catégorie d'erreur non demandée, mais signalée pour arbitrage explicite.
2. **`min(nominalPowerW, maxCurrentA × outputVoltageV)` comme formule de puissance disponible.** Aucun MASTER ne définit explicitement cette règle de contrainte la plus restrictive entre deux limites nominales indépendantes. C'est une pratique d'ingénierie électrique standard et directement justifiée par les deux paramètres fournis (pas un coefficient inventé), mais reste une interprétation de la mission plutôt qu'une formule explicitement dictée — documentée et testée explicitement (« puissance disponible limitée par le courant maximal plutôt que la puissance nominale »).
3. **Regroupement de `outputVoltageV` sous le code `CHARGER_CURRENT_INVALID`.** La mission liste séparément « puissance invalide », « courant invalide », « rendement invalide » et « durée invalide », sans catégorie dédiée à la tension. `outputVoltageV` est validé sous le code courant plutôt que sous un nouveau code non demandé — choix de regroupement documenté, pas une catégorie manquante.
4. **Cible du temps de recharge et convention de couverture, par cohérence avec les moteurs précédents plutôt que par instruction explicite.** Comme aux phases 4.3 et 4.4, ni MASTER-06 ni la présente mission ne tranchent explicitement si le temps de recharge doit cibler la capacité utile ou nominale batterie, ni si la couverture doit se comparer au besoin journalier ou à la capacité utile totale. Les choix retenus ici reproduisent ceux des moteurs de recharge précédents pour la cohérence entre les trois — signalé pour confirmation, comme dans les rapports précédents.

---

# Fin — PHASE-4.5-RAPPORT / FabSystem
