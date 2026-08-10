# PHASE-4.4-RAPPORT — Solar Engine (quatrième moteur métier)

**Date : 15/08/2026**
**Périmètre : un seul moteur, `lib/engines/solar-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit les valeurs retenues `energy.*` (Phase 4.1) et `battery.*` (Phase 4.2) via `EngineContext`, ne les recalcule jamais. Aucun autre moteur modifié, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/solar-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts               ← inchangés
  solar-engine.ts                                                        ← nouveau (Phase 4.4)
```

Même structuration en deux couches que les trois moteurs précédents :

- **`computeSolarEngineOutput(input, energy, battery, projectVoltageV)`** — fonction pure, sans `EngineContext` : prend les paramètres solaires et les grandeurs déjà lues, calcule l'évaluation de production. Testable indépendamment de tout contexte.
- **`createSolarEngine()`** — fabrique le `BaseEngine` : lit `energy.dailyConsumption` et `battery.usefulCapacity` via `context.getRetainedValue(...)`, valide les paramètres, appelle la fonction pure, construit les propositions `solar.*`.

**Aucun couplage de code avec l'Energy Engine, le Battery Engine ou l'Alternator Engine** : `solar-engine.ts` n'importe aucun de ces trois fichiers (vérifié par recherche). Le seul lien entre les moteurs est une dépendance de **données** — les valeurs retenues persistées en base par des runs antérieurs — jamais un appel de fonction direct.

Isolation vérifiée par recherche (`grep`) : aucun fichier hors `lib/engines/solar-engine.ts` et ses tests ne référence ce moteur. Il n'est enregistré dans aucun `Registry` applicatif.

---

# Paramètres

Conformément à la contrainte (« tous les paramètres doivent être fournis explicitement, aucune valeur métier par défaut, aucun coefficient codé en dur, le moteur ne doit jamais inventer un ensoleillement ») :

```ts
type SolarEngineInput = {
  panelPowerWp: number;            // requis, > 0
  equivalentSunHours: number;      // requis, > 0, ≤ 24 — jamais déduit d'une table géographique
  systemEfficiencyRatio: number;   // requis, (0, 1]
  shadingFactor?: number;          // optionnel, (0, 1]
};
```

- **`equivalentSunHours` est systématiquement obligatoire**, fourni par l'appelant : aucune table d'ensoleillement géographique n'existe dans ce moteur, conformément à l'interdiction explicite d'inventer un ensoleillement.
- **`systemEfficiencyRatio` est obligatoire** (contrairement à `efficiencyRatio` de l'Alternator Engine, Phase 4.3, qui était optionnel) : la mission qualifie le rendement alternateur de « si applicable » mais le rendement solaire simplement de « rendement global du système », sans réserve — cette différence de formulation entre les deux phases est respectée ici en rendant le paramètre obligatoire.
- **`shadingFactor` est le seul paramètre optionnel** (« masquage éventuel, si fourni ») : son absence signifie explicitement « aucun masquage à appliquer » (repli neutre `?? 1` dans la formule), jamais une valeur métier assumée.
- **Orientation / inclinaison ne sont pas des paramètres distincts** de ce moteur : la mission les qualifie de « si déjà calculées en amont », ce qui est interprété comme « déjà intégrées par l'appelant dans `systemEfficiencyRatio` » plutôt que comme des champs séparés nécessitant un modèle géométrique (loi en cosinus, etc.) qu'aucun MASTER ne fournit. Voir « Arbitrages nécessaires » pour la discussion de cette interprétation.
- **Pas de `systemVoltageV`** dans les paramètres, comme pour l'Alternator Engine : la tension système est lue directement depuis `context.project.voltage` (Phase 3). Si elle vaut `UNKNOWN`, c'est un « calcul impossible », jamais une valeur inventée.

---

# Formules

Toutes déterministes, chacune isolée dans `computeSolarEngineOutput` :

| # | Grandeur | Formule |
|---|---|---|
| 1 | Puissance photovoltaïque exploitable (W) — étape interne | `usablePowerW = panelPowerWp × systemEfficiencyRatio × (shadingFactor ?? 1)` |
| 2 | Énergie solaire quotidienne (Wh) | `dailySolarEnergyWh = usablePowerW × equivalentSunHours` |
| 3 | Courant moyen de charge (A) | `averageChargingCurrentA = usablePowerW / projectVoltageV` |
| 4 | Temps de recharge théorique (h) | `theoreticalRechargeTimeHours = usefulCapacityAh / averageChargingCurrentA` |
| 5 | Taux de couverture des besoins | `coverageRatio = dailySolarEnergyWh / dailyWh` |

- La formule 1 (« puissance photovoltaïque exploitable ») figure dans la section **Objectifs** de la mission mais pas dans la liste restrictive **« Calculs : uniquement »** (qui cite « énergie solaire quotidienne, courant moyen de charge, temps de recharge théorique, taux de couverture »). Elle est donc calculée comme **étape interne** nécessaire aux formules 2 et 3, exposée dans `SolarEngineOutput.usablePowerW` pour traçabilité, mais **n'a pas sa propre clé `solar.*`** — cohérent avec la discipline déjà appliquée à l'Alternator Engine (Phase 4.3), où seules les grandeurs listées dans « Calculs : uniquement » deviennent des valeurs retenues.
- Formule 4 cible la **capacité utile** batterie (`battery.usefulCapacity.usefulCapacityAh`, Phase 4.2), par cohérence avec l'Alternator Engine (même cible, même justification : c'est l'Ah réellement consommé qu'il faut recharger, pas la capacité nominale surdimensionnée par la profondeur de décharge).
- Formule 5 compare l'énergie solaire quotidienne au **besoin journalier** (`energy.dailyConsumption.dailyWh`, Phase 4.1), par cohérence avec la marge de recharge de l'Alternator Engine.
- `usablePowerW` et `averageChargingCurrentA` ne dépendent d'aucune valeur retenue `energy.*`/`battery.*` — uniquement des paramètres et de `projectVoltageV` (donnée Project). Cela se reflète directement dans le graphe de dépendances (voir plus bas).

---

# Valeurs retenues

Quatre propositions (`EngineResult.retainedValues`), toutes `solar.*`, correspondant exactement à la liste « Calculs : uniquement » :

| Clé | Contenu |
|---|---|
| `solar.dailyEnergy` | `{ dailySolarEnergyWh }` |
| `solar.averageChargingCurrent` | `{ averageChargingCurrentA }` |
| `solar.rechargeTime` | `{ theoreticalRechargeTimeHours }` |
| `solar.coverage` | `{ coverageRatio }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que les trois moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0, inchangé) reste seul responsable de l'appel à `retainValue`.

---

# Dépendances

Graphe **exact** — la mission de cette phase l'exige explicitement (« Créer uniquement des dépendances réellement utilisées par les formules ») :

```
solar.rechargeTime  dépend de   battery.usefulCapacity
solar.coverage      dépend de   energy.dailyConsumption
```

`solar.dailyEnergy` et `solar.averageChargingCurrent` n'ont **aucune** dépendance : elles se déduisent uniquement des paramètres et de `Project.voltage` (une donnée Project, pas une valeur retenue). Aucune dépendance vers `alternator.*`, `charger.*`, `cable.*`, `protection.*` ou Volta — vérifié par test (« graphe de dépendances exact »).

Ce graphe est structurellement identique à celui de l'Alternator Engine (Phase 4.3) : deux moteurs de recharge, deux mêmes cibles finales (`battery.usefulCapacity` pour le temps de recharge, `energy.dailyConsumption` pour la comparaison au besoin), avec les mêmes étapes intermédiaires purement paramétriques en amont.

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0), toutes bloquantes (même choix que le Battery et l'Alternator Engine — pas de canal `result.errors` non bloquant, cohérent avec une grandeur agrégée unique par run).

- **`DependencyError` — données energy absentes** (`ENERGY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : `energy.dailyConsumption` absent, non `ACTIVE`, ou de forme inattendue.
- **`DependencyError` — données battery absentes** (`BATTERY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : mêmes trois cas pour `battery.usefulCapacity`.
- **`ValidationError` — paramètres solaires absents** (`SOLAR_PARAMETER_MISSING`) : un des trois paramètres obligatoires manque.
- **`ValidationError` — puissance invalide** (`SOLAR_POWER_INVALID`) : `panelPowerWp` non fini, négatif ou nul.
- **`ValidationError` — rendement invalide** (`SOLAR_EFFICIENCY_INVALID`) : `systemEfficiencyRatio` hors de `(0, 1]`, ou `shadingFactor` (s'il est fourni) hors de `(0, 1]`.
- **`ValidationError` — heures de production invalides** (`SOLAR_SUN_HOURS_INVALID`) : `equivalentSunHours` non fini, négatif, nul, ou supérieur à 24h (contrainte dimensionnelle, pas commerciale).
- **`CalculationError` — calcul impossible** : trois cas — (`ENERGY_DATA_INCOMPLETE`) l'Energy Engine n'a pas pu tout résoudre (`complete: false`) ; (`SOLAR_VOLTAGE_UNKNOWN`) `Project.voltage` vaut `UNKNOWN`, rendant la conversion en courant indéterminée ; (`SOLAR_COVERAGE_INDETERMINATE`) le besoin journalier (`dailyWh`) vaut exactement zéro, rendant le taux de couverture mathématiquement indéterminé (`0/0`), jamais laissé fuiter comme `NaN`.

Par construction (`panelPowerWp`, `systemEfficiencyRatio` et, s'il est fourni, `shadingFactor` sont tous validés strictement positifs), `usablePowerW` et `averageChargingCurrentA` sont toujours strictement positifs : aucune division par zéro n'est possible sur la formule du temps de recharge.

---

# Tests

Deux nouveaux fichiers, 44 nouveaux tests, aucun fichier existant modifié.

## `tests/solar-engine.test.ts` (18 tests) — fonction pure `computeSolarEngineOutput`
**✓ petit panneau**, **✓ grande installation**, **✓ faible ensoleillement**, **✓ fort ensoleillement**, **✓ rendement faible**, **✓ rendement élevé**, masquage appliqué / absent (repli neutre), courant moyen de charge, temps de recharge théorique, **✓ couverture insuffisante**, **✓ couverture complète**, tension système inconnue (`CalculationError`), besoin journalier nul (`CalculationError`), et non-recalcul des grandeurs source.

## `tests/solar-engine-runner.test.ts` (26 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, **✓ énergie absente**, **✓ batterie absente** (+ obsolescence et forme invalide pour chacune), énergie incomplète et tension inconnue (calcul impossible), **✓ paramètres invalides** (manquant, puissance invalide, rendement invalide ×2, masquage invalide, heures de production invalides ×2), **✓ valeurs retenues proposées** (4 clés, `value`/`simulatedValue` égales), **✓ dépendances proposées** (uniquement vers `energy.*`/`battery.*`), **✓ graphe de dépendances exact** (les deux arêtes précises, rien d'autre), et intégration bout en bout via `createEngineRunner` (Phase 4.0, non modifié) : persistance des 4 valeurs et des 2 dépendances, propagation d'une erreur du moteur à travers le runner.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 657 / # pass 657 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle, il réutilise `ProjectRetainedValue`/`ProjectValueDependency` (Phase 3) via `EngineRunner` (Phase 4.0) exactement comme les moteurs précédents.
- **Aucun fichier existant modifié** : `Energy Engine`, `Battery Engine`, `Alternator Engine`, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché. Seuls trois fichiers nouveaux (`lib/engines/solar-engine.ts` et ses deux fichiers de test) ont été créés.
- **Aucun autre moteur créé, aucune interface graphique.**
- **Build et tests intégralement au vert.**

---

# Arbitrages nécessaires

1. **Orientation / inclinaison absentes en tant que paramètres distincts.** La mission les cite comme exemples de paramètres (« orientation / inclinaison, si déjà calculées en amont »). Interprétation retenue : cette qualification signifie qu'elles sont déjà intégrées par l'appelant dans `systemEfficiencyRatio`, plutôt que des champs séparés — faute de modèle géométrique (loi en cosinus, table de pertes par inclinaison) fourni par un MASTER, en créer un aurait été un « coefficient codé en dur ». Une lecture alternative consisterait à les accepter comme champs optionnels purement descriptifs (à l'image de `referenceRpm` pour l'Alternator Engine), sans qu'ils entrent dans aucune formule — à trancher explicitement si cette traçabilité s'avère utile pour un futur module (ex. Schéma).
2. **`systemEfficiencyRatio` obligatoire (contrairement à l'`efficiencyRatio` optionnel de l'Alternator Engine).** Déduit de la différence de formulation entre les deux mission-briefs (« si applicable » pour l'alternateur, absent pour le solaire) — jugé être un choix de vocabulaire délibéré des phases, mais reste une déduction, pas une règle explicitement énoncée dans les MASTER eux-mêmes.
3. **Cible du temps de recharge et du taux de couverture, par cohérence avec l'Alternator Engine plutôt que par instruction explicite de cette phase.** Comme au point 3-4 du rapport de Phase 4.3 (Alternator), ni MASTER-06 ni la présente mission ne tranchent explicitement si le temps de recharge doit cibler la capacité utile ou la capacité nominale batterie, ni si la couverture doit se comparer au besoin journalier ou à la capacité utile totale. Le choix retenu ici reproduit celui de l'Alternator Engine pour la cohérence entre les deux moteurs de recharge — signalé pour confirmation, comme dans le rapport précédent.
4. **« Puissance photovoltaïque exploitable » n'a pas sa propre clé `solar.*`.** Citée dans les Objectifs mais absente de la liste restrictive « Calculs : uniquement », elle est traitée comme une étape interne (même discipline que pour l'Alternator Engine, Phase 4.3, où « puissance exploitable » n'était pas davantage sa propre clé). Signalé pour cohérence documentaire avec l'écart déjà noté en Phase 4.2 et 4.3 entre les sections Objectifs et Calculs des mission-briefs.

---

# Fin — PHASE-4.4-RAPPORT / FabSystem
