# PHASE-4.3-RAPPORT — Alternator Engine (troisième moteur métier)

**Date : 14/08/2026**
**Périmètre : un seul moteur, `lib/engines/alternator-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit les valeurs retenues `energy.*` (Phase 4.1) et `battery.*` (Phase 4.2) via `EngineContext`, ne les recalcule jamais. Aucun autre moteur modifié, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/alternator-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts   ← inchangés
  energy-engine.ts, battery-engine.ts                                    ← inchangés
  alternator-engine.ts                                                   ← nouveau (Phase 4.3)
```

Même structuration en deux couches que les moteurs précédents :

- **`computeAlternatorEngineOutput(input, energy, battery, projectVoltageV)`** — fonction pure, sans `EngineContext` : prend les paramètres alternateur et les grandeurs déjà lues, calcule l'évaluation de recharge. Testable indépendamment de tout contexte.
- **`createAlternatorEngine()`** — fabrique le `BaseEngine` : lit `energy.dailyConsumption` et `battery.usefulCapacity` via `context.getRetainedValue(...)`, valide les paramètres, appelle la fonction pure, construit les propositions `alternator.*`.

**Aucun couplage de code avec l'Energy Engine ni le Battery Engine** : `alternator-engine.ts` n'importe ni `energy-engine.ts` ni `battery-engine.ts` (vérifié par recherche). Le seul lien entre les trois moteurs est une dépendance de **données** — les valeurs retenues persistées en base par des runs antérieurs — jamais un appel de fonction direct.

Isolation vérifiée par recherche (`grep`) : aucun fichier hors `lib/engines/alternator-engine.ts` et ses tests ne référence ce moteur. Il n'est enregistré dans aucun `Registry` applicatif.

---

# Paramètres

Conformément à la contrainte (« tous les paramètres doivent être fournis explicitement, aucun coefficient codé en dur »), `AlternatorEngineInput` reprend les cinq exemples cités par la mission :

```ts
type AlternatorEngineInput = {
  nominalCurrentA: number;       // requis
  availableCurrentA: number;     // requis
  referenceRpm: number;          // requis
  efficiencyRatio?: number;      // optionnel — voir ci-dessous
  rollingDurationHours: number;  // requis, [0, 24]
};
```

- **`referenceRpm`** est un paramètre de traçabilité de l'hypothèse (régime moteur auquel `availableCurrentA` a été estimé) : il n'entre dans **aucune** formule, car aucune courbe alternateur/régime n'est disponible dans ce périmètre (en inventer une aurait été un « coefficient codé en dur »). Il est validé (> 0, fini) et reporté tel quel dans la sortie.
- **`efficiencyRatio` est le seul paramètre optionnel**, exactement conforme à la formulation de la mission (« rendement global, **si applicable** »). Son absence ne signifie pas une valeur métier par défaut : elle signifie explicitement « aucun rendement à appliquer », traduite par une branche conditionnelle dans la formule (`× (efficiencyRatio ?? 1)`), jamais par une constante métier assumée. Voir « Arbitrages nécessaires » pour la discussion de ce choix.
- **Pas de `systemVoltageV`** dans les paramètres, à la différence du Battery Engine (Phase 4.2) : la mission ne le cite pas parmi les exemples de paramètres alternateur. La tension système est lue directement depuis `context.project.voltage` (donnée Project déjà existante, Phase 3) plutôt que redemandée à l'appelant — si elle est `UNKNOWN`, c'est un « calcul impossible » (voir Validation), jamais une valeur inventée.
- **Validation croisée** : `availableCurrentA` ne peut jamais dépasser `nominalCurrentA` (physiquement impossible qu'un courant réellement disponible excède le courant nominal de l'alternateur) — cette vérification donne à `nominalCurrentA` un rôle de garde-fou réel, même s'il n'intervient dans aucune formule de calcul.

---

# Formules

Toutes déterministes, chacune isolée dans `computeAlternatorEngineOutput` :

| # | Grandeur | Formule |
|---|---|---|
| 1 | Courant exploitable (A) | `usableCurrentA = availableCurrentA × (efficiencyRatio ?? 1)` |
| 2 | Énergie rechargeable (Wh) | `rechargeableEnergyWh = usableCurrentA × projectVoltageV × rollingDurationHours` |
| 3 | Temps de recharge théorique (h) | `theoreticalRechargeTimeHours = usefulCapacityAh / usableCurrentA` |
| 4 | Marge de recharge (Wh) | `rechargeMarginWh = rechargeableEnergyWh − dailyWh` |

- Formule 3 cible la **capacité utile** batterie (`battery.usefulCapacity.usefulCapacityAh`, Phase 4.2) — la quantité d'Ah réellement consommée sur l'autonomie souhaitée — et non la capacité nominale (qui inclut déjà la marge de profondeur de décharge, non pertinente pour un cycle de recharge).
- Formule 4 compare l'énergie rechargeable pendant la durée de roulage donnée au **besoin journalier** (`energy.dailyConsumption.dailyWh`, Phase 4.1) : positive = surplus, négative = déficit. Aucun seuil ou pourcentage de marge « acceptable » n'est inventé — seule la valeur signée est produite, l'interprétation reste au client de la donnée.
- `usableCurrentA` et `rechargeableEnergyWh` ne dépendent d'aucune valeur retenue `energy.*`/`battery.*` — uniquement des paramètres et de `projectVoltageV` (donnée Project). Cela se reflète directement dans le graphe de dépendances (voir plus bas).

---

# Valeurs retenues

Quatre propositions (`EngineResult.retainedValues`), toutes `alternator.*` :

| Clé | Contenu |
|---|---|
| `alternator.usableCurrent` | `{ usableCurrentA }` |
| `alternator.rechargeableEnergy` | `{ rechargeableEnergyWh }` |
| `alternator.rechargeTime` | `{ theoreticalRechargeTimeHours }` |
| `alternator.rechargeMargin` | `{ rechargeMarginWh }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que les deux moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0, inchangé) reste seul responsable de l'appel à `retainValue`.

---

# Dépendances

Graphe **exact** (deux arêtes, pas plus) : une dépendance n'est déclarée que lorsque la formule produisant cette clé `alternator.*` utilise réellement, numériquement, la valeur `energy.*`/`battery.*` visée — pas simplement parce que cette donnée a été lue pour une vérification de complétude.

```
alternator.rechargeTime    dépend de   battery.usefulCapacity
alternator.rechargeMargin  dépend de   energy.dailyConsumption
```

`alternator.usableCurrent` et `alternator.rechargeableEnergy` n'ont **aucune** dépendance : elles se déduisent uniquement des paramètres et de `Project.voltage` (une donnée Project, pas une valeur retenue). Aucune dépendance vers `solar.*`, `charger.*`, `cable.*`, `protection.*` ou Volta — vérifié par test (« graphe de dépendances exact »).

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0), toutes bloquantes (même choix que le Battery Engine — pas de canal `result.errors` non bloquant, cohérent avec une grandeur agrégée unique par run).

- **`DependencyError` — données energy absentes** (`ENERGY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : `energy.dailyConsumption` absent, non `ACTIVE`, ou de forme inattendue.
- **`DependencyError` — données battery absentes** (`BATTERY_DATA_MISSING`/`OBSOLETE`/`INVALID_SHAPE`) : mêmes trois cas pour `battery.usefulCapacity`.
- **`ValidationError` — paramètres alternateur absents** (`ALTERNATOR_PARAMETER_MISSING`) : un des quatre paramètres obligatoires manque.
- **`ValidationError` — courant invalide** (`ALTERNATOR_CURRENT_INVALID`) : `nominalCurrentA`/`availableCurrentA` non finis, négatifs ou nuls, ou `availableCurrentA > nominalCurrentA`.
- **`ValidationError` — rendement invalide** (`ALTERNATOR_EFFICIENCY_INVALID`) : lorsqu'il est fourni, `efficiencyRatio` hors de `(0, 1]`.
- **`CalculationError` — calcul impossible** : deux cas — (`ENERGY_DATA_INCOMPLETE`) l'Energy Engine lui-même n'a pas pu tout résoudre (`complete: false`) ; (`ALTERNATOR_VOLTAGE_UNKNOWN`) `Project.voltage` vaut `UNKNOWN`, rendant la conversion en Wh indéterminée.

Par construction (`availableCurrentA` et, s'il est fourni, `efficiencyRatio` sont tous deux validés strictement positifs), `usableCurrentA` est toujours strictement positif : aucune division par zéro n'est possible sur la formule 3, donc aucun garde-fou supplémentaire n'était nécessaire pour ce cas (contrairement au Battery Engine, où `dailyAh = 0` restait un scénario légitime à traiter).

---

# Tests

Deux nouveaux fichiers, 47 nouveaux tests, aucun fichier existant modifié.

## `tests/alternator-engine.test.ts` (19 tests) — fonction pure `computeAlternatorEngineOutput`
Courant exploitable sans/avec rendement, **✓ rendement faible**, **✓ rendement élevé**, **✓ alternateur faible**, **✓ alternateur puissant**, **✓ faible durée de roulage**, **✓ longue durée de roulage**, durée nulle, temps de recharge théorique, **✓ batterie déjà suffisante** (capacité utile nulle → temps nul, sans erreur), marges positive et négative, tension système inconnue (`CalculationError`), et non-recalcul des grandeurs source.

## `tests/alternator-engine-runner.test.ts` (28 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, **✓ énergie absente**, **✓ batterie absente** (+ obsolescence et forme invalide pour chacune), **✓ paramètres invalides** (manquant, courant invalide ×2, rendement invalide ×2, durée négative/>24h), énergie incomplète et tension inconnue (calcul impossible), **✓ valeurs retenues proposées** (4 clés, `value`/`simulatedValue` égales), **✓ dépendances proposées** (uniquement vers `energy.*`/`battery.*`), **✓ graphe de dépendances exact** (les deux arêtes précises, rien d'autre), et intégration bout en bout via `createEngineRunner` (Phase 4.0, non modifié) : persistance des 4 valeurs et des 2 dépendances, propagation d'une erreur du moteur à travers le runner.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 622 / # pass 622 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle, il réutilise `ProjectRetainedValue`/`ProjectValueDependency` (Phase 3) via `EngineRunner` (Phase 4.0) exactement comme les moteurs précédents.
- **Aucun fichier existant modifié** : `Energy Engine`, `Battery Engine`, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché. Seuls trois fichiers nouveaux (`lib/engines/alternator-engine.ts` et ses deux fichiers de test) ont été créés.
- **Aucun autre moteur créé, aucune interface graphique.**
- **Build et tests intégralement au vert.**

---

# Arbitrages nécessaires

1. **`efficiencyRatio` optionnel avec repli mathématique neutre (`?? 1`).** La mission dit explicitement « rendement global (si applicable) », suggérant son caractère optionnel — mais la contrainte générale « aucune valeur métier par défaut » pourrait aussi être lue comme interdisant tout repli, y compris neutre. Le choix retenu ici (absence = aucun facteur appliqué, formule sans terme de rendement plutôt qu'un rendement supposé de 100 %) est jugé conforme à l'esprit de la contrainte (1 n'est l'élément neutre de la multiplication, pas une hypothèse métier), mais reste un point d'interprétation à confirmer.
2. **Précision du graphe de dépendances plus stricte que le Battery Engine (Phase 4.2).** Le Battery Engine avait déclaré que chacune de ses 4 clés dépendait des 2 clés `energy.*` lues, y compris pour la seule vérification de complétude. Ce moteur-ci ne déclare une dépendance que lorsque la valeur `energy.*`/`battery.*` est réellement utilisée dans la formule produisant la clé — une convention plus stricte, retenue ici parce que la mission de cette phase exige explicitement un « graphe de dépendances exact ». Les deux moteurs ne suivent donc pas exactement la même convention de déclaration ; le Battery Engine n'a pas été modifié (contrainte explicite de cette phase) pour rester cohérent rétroactivement. Signalé pour arbitrage : faut-il harmoniser les deux conventions dans une phase ultérieure ?
3. **Cible du temps de recharge : capacité utile plutôt que capacité nominale.** MASTER-06 ne tranche pas explicitement laquelle des deux grandeurs batterie (Phase 4.2 : `usefulCapacityAh` vs `nominalCapacityAh`) doit servir de cible à un temps de recharge. Le choix de la capacité utile est justifié techniquement dans ce rapport (c'est l'Ah réellement consommé qu'il faut recharger, pas la capacité nominale surdimensionnée par la profondeur de décharge) mais reste une interprétation, pas une donnée explicitement fournie par un MASTER.
4. **Comparaison de la marge de recharge au besoin journalier plutôt qu'à la capacité utile totale.** La mission cite « des besoins énergétiques (energy.*) » et « des besoins batterie (battery.*) » comme sources communes, sans préciser à laquelle des deux la « marge de recharge » doit être comparée. Le choix retenu (comparaison au besoin **journalier**, `energy.dailyConsumption`) répond à la question « l'alternateur suit-il la consommation quotidienne pendant un roulage typique ? » ; une comparaison à la capacité utile totale (`battery.usefulCapacity`) répondrait à une question différente (« combien de sessions de roulage pour reconstituer toute la réserve ? »). Les deux interprétations sont défendables ; celle retenue ici est documentée explicitement plutôt que choisie silencieusement.

---

# Fin — PHASE-4.3-RAPPORT / FabSystem
