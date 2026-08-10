# PHASE-4.2-RAPPORT — Battery Engine (deuxième moteur métier)

**Date : 13/08/2026**
**Périmètre : un seul moteur, `lib/engines/battery-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit les valeurs retenues `energy.*` (Phase 4.1) via `EngineContext`, ne les recalcule jamais. Aucun autre moteur modifié, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/battery-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts   ← inchangés
  energy-engine.ts                                                       ← inchangé (Phase 4.1)
  battery-engine.ts                                                      ← nouveau (Phase 4.2)
```

Même structuration en deux couches que l'Energy Engine :

- **`computeBatteryEngineOutput(input, energy)`** — fonction pure, sans `EngineContext` : prend les paramètres batterie et les grandeurs `energy.*` déjà lues, calcule le dimensionnement. Testable indépendamment de tout contexte.
- **`createBatteryEngine()`** — fabrique le `BaseEngine` : lit `energy.dailyConsumption` et `energy.maxCurrent` via `context.getRetainedValue(...)`, valide les paramètres, appelle la fonction pure, construit les propositions `battery.*`.

**Aucun couplage de code avec l'Energy Engine** : `battery-engine.ts` n'importe jamais `energy-engine.ts` (vérifié). Le seul lien entre les deux moteurs est une dépendance de **données** — les valeurs retenues `energy.*` persistées en base par un run antérieur d'Energy Engine — jamais un appel de fonction direct. C'est exactement le découplage attendu par MASTER-11 §28 (moteurs réutilisables indépendamment) et par la contrainte explicite de cette phase.

Isolation vérifiée par recherche (`grep`) : aucun fichier hors `lib/engines/battery-engine.ts` et ses tests ne référence ce moteur. Il n'est enregistré dans aucun `Registry` applicatif.

---

# Paramètres

Conformément à la contrainte (« aucune valeur codée en dur, tous les paramètres doivent être explicitement fournis, le moteur ne choisit jamais une valeur par défaut métier »), `BatteryEngineInput` comporte exactement les quatre paramètres cités en exemple par la mission, **tous obligatoires, aucun défaut** :

```ts
type BatteryEngineInput = {
  technology: "LEAD_ACID" | "AGM" | "GEL" | "LIFEPO4";
  maxDepthOfDischarge: number;  // fraction (0, 1]
  desiredAutonomyDays: number;  // > 0
  systemVoltageV: number;       // > 0
};
```

- Le type `technology` est restreint aux quatre chimies explicitement citées par la mission et testées (`plomb, AGM, GEL, LiFePO4`) : c'est une énumération de catégories valides, pas une valeur métier — comparable à `ProjectAssetType` de la Phase 3. Aucune table de correspondance technologie → profondeur de décharge n'existe : la formule n'utilise **que** `maxDepthOfDischarge`, fourni par l'appelant quelle que soit la technologie choisie.
- `systemVoltageV` est comparé à `Project.voltage` (Phase 3) lorsque celle-ci est connue : incompatibilité → erreur bloquante (voir Validation). Si `Project.voltage` vaut `UNKNOWN`, aucune vérification n'est possible et aucune valeur n'est inventée à sa place — le calcul continue avec la tension fournie par l'appelant.

---

# Formules

Toutes déterministes, aucun coefficient implicite, chacune isolée dans `computeBatteryEngineOutput` :

| # | Grandeur | Formule |
|---|---|---|
| 1 | Énergie utile nécessaire (Wh) | `usefulEnergyWh = dailyWh × desiredAutonomyDays` |
| 2 | Capacité utile nécessaire (Ah) | `usefulCapacityAh = dailyAh × desiredAutonomyDays` |
| 3 | Capacité nominale à acquérir (Ah) | `nominalCapacityAh = usefulCapacityAh / maxDepthOfDischarge` |
| 4 | Autonomie théorique (jours) | `autonomyDays = usefulCapacityAh / dailyAh` |

`dailyWh`, `dailyAh` et `maxCurrentA` proviennent **exclusivement** des valeurs retenues `energy.dailyConsumption`/`energy.maxCurrent` lues via `EngineContext` — jamais recalculés (vérifié par test dédié).

La formule 4 (autonomie théorique) est calculée **indépendamment** de `desiredAutonomyDays` — à partir de la capacité utile déjà dérivée et du besoin journalier — plutôt que simplement recopiée depuis le paramètre d'entrée. Sous l'arithmétique exacte de cette V1 (aucun arrondi de capacité commerciale n'est appliqué), elle est mathématiquement égale à `desiredAutonomyDays` ; elle reste néanmoins un calcul propre, traçable, et deviendrait réellement discriminante si une future version arrondissait `nominalCapacityAh` à une taille de batterie commerciale standard.

**Correspondance avec le vocabulaire de la mission** : la section « Objectifs » nomme « capacité minimale », la section « Calculs » nomme « capacité nominale » — les deux désignent la même grandeur (`nominalCapacityAh`) ; voir « Arbitrages nécessaires » pour la mention distincte de « réserve énergétique ».

---

# Valeurs retenues

Quatre propositions (`EngineResult.retainedValues`), toutes `battery.*` :

| Clé | Contenu |
|---|---|
| `battery.usefulEnergy` | `{ usefulEnergyWh }` |
| `battery.usefulCapacity` | `{ usefulCapacityAh }` |
| `battery.nominalCapacity` | `{ nominalCapacityAh, maxDepthOfDischarge, technology }` |
| `battery.autonomy` | `{ autonomyDays, desiredAutonomyDays }` |

`value` et `simulatedValue` sont identiques à l'issue de ce calcul (même logique que l'Energy Engine, Phase 4.1). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0, inchangé) reste seul responsable de l'appel à `retainValue`.

---

# Dépendances

Exactement le schéma demandé — `battery.* ↓ energy.*`, aucune dépendance battery-interne, aucune dépendance vers `solar`/`alternator`/`cable`/`protection`/`Volta` :

```
battery.usefulEnergy     dépend de   energy.dailyConsumption, energy.maxCurrent
battery.usefulCapacity   dépend de   energy.dailyConsumption, energy.maxCurrent
battery.nominalCapacity  dépend de   energy.dailyConsumption, energy.maxCurrent
battery.autonomy         dépend de   energy.dailyConsumption, energy.maxCurrent
```

Soit 8 arêtes au total. Chacune des quatre clés `battery.*` dépend des **deux** clés `energy.*` réellement lues par le moteur (`energy.dailyConsumption` pour Wh/Ah, `energy.maxCurrent` pour le contrôle de complétude — voir Validation) : cela reflète honnêtement ce que le moteur consulte réellement, plutôt que de ne déclarer qu'un lien partiel. Vérifié par test que `dependsOnKey` ne contient jamais que ces deux clés.

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0), toutes **bloquantes** (levées) — contrairement à l'Energy Engine, ce moteur produit une grandeur agrégée unique par run : il n'existe pas de scénario de dégradation partielle pertinent ici (soit la donnée est utilisable, soit elle ne l'est pas).

- **`DependencyError` — donnée énergétique absente** (`ENERGY_DATA_MISSING`) : `energy.dailyConsumption` ou `energy.maxCurrent` n'existe pas encore pour ce Project (l'Energy Engine n'a jamais été exécuté).
- **`DependencyError` — donnée énergétique obsolète** (`ENERGY_DATA_OBSOLETE`) : la valeur retenue existe mais son `status` n'est pas `ACTIVE` — ne jamais utiliser silencieusement une donnée marquée à recalculer (MASTER-06 §25-29).
- **`DependencyError` — forme inattendue** (`ENERGY_DATA_INVALID_SHAPE`) : garde défensive sur le contenu `Json` non typé du modèle `ProjectRetainedValue` (Phase 3).
- **`ValidationError` — paramètre manquant** (`BATTERY_PARAMETER_MISSING`) : un des quatre paramètres batterie est absent.
- **`ValidationError` — paramètre invalide** (`BATTERY_PARAMETER_INVALID`) : technologie non reconnue, `desiredAutonomyDays`/`systemVoltageV` non finis, nuls ou négatifs.
- **`ValidationError` — profondeur de décharge invalide** (`BATTERY_DOD_INVALID`) : `maxDepthOfDischarge` hors de l'intervalle `(0, 1]`.
- **`ValidationError` — tension incompatible** (`BATTERY_VOLTAGE_INCOMPATIBLE`) : `systemVoltageV` diverge de `Project.voltage` lorsque celle-ci est connue.
- **`CalculationError` — calcul impossible** : deux cas — (`ENERGY_DATA_INCOMPLETE`) les données `energy.*` existent mais sont marquées `complete: false` (l'Energy Engine lui-même n'a pas pu tout résoudre) : dimensionner une batterie sur une base reconnue incomplète serait trompeur, donc refusé plutôt que silencieusement approximé ; (`BATTERY_AUTONOMY_INDETERMINATE`) `dailyAh` vaut exactement zéro — la division définissant l'autonomie théorique est mathématiquement indéterminée (`0/0`), jamais laissée fuiter comme `NaN`.

---

# Tests

Deux nouveaux fichiers, 44 nouveaux tests, aucun fichier existant modifié.

## `tests/battery-engine.test.ts` (16 tests) — fonction pure `computeBatteryEngineOutput`
**✓ consommation faible**, **✓ consommation élevée** (mêmes formules, magnitudes différentes), **✓ batterie plomb**, **✓ batterie AGM**, **✓ batterie GEL**, **✓ batterie LiFePO4** (DoD propre à chacune, aucune table interne), **✓ autonomie 1 jour**, **✓ autonomie multiple** (3 jours), **✓ profondeur de décharge** (effet direct sur la capacité nominale, DoD faible ⇒ capacité plus grande), calcul impossible (`dailyAh = 0` → `CalculationError`), et vérification que les grandeurs `energy.*` ressortent inchangées.

## `tests/battery-engine-runner.test.ts` (28 tests) — `BaseEngine`, validation contextuelle et intégration `EngineRunner`
Id stable, **✓ énergie absente** (deux clés, absence et forme invalide), énergie obsolète, non-recalcul de l'énergie, **✓ calcul impossible** sur énergie incomplète, **✓ paramètres invalides** (manquant, technologie inconnue, DoD hors bornes ×2, autonomie ≤ 0), tension incompatible (+ cas `Project.voltage = UNKNOWN` qui ne bloque pas), **✓ valeurs retenues proposées** (4 clés `battery.*`, `value`/`simulatedValue` égales), **✓ dépendances proposées** (8 arêtes, exclusivement `battery.* → energy.*`), et intégration bout en bout via `createEngineRunner` (Phase 4.0, non modifié) : persistance des 4 valeurs et des 8 dépendances, propagation d'une erreur du moteur à travers le runner.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 588 / # pass 588 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle, il réutilise `ProjectRetainedValue`/`ProjectValueDependency` (Phase 3) via `EngineRunner` (Phase 4.0) exactement comme l'Energy Engine.
- **Aucun fichier existant modifié** : `Energy Engine`, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché. Seuls trois fichiers nouveaux (`lib/engines/battery-engine.ts` et ses deux fichiers de test) ont été créés.
- **Aucun autre moteur créé, aucune interface graphique.**
- **Build et tests intégralement au vert.**

---

# Arbitrages nécessaires

1. **« Réserve énergétique » (section Objectifs) absente de la section « Calculs : uniquement ».** La mission liste dans ses Objectifs quatre grandeurs (« capacité minimale, capacité utile, autonomie théorique, réserve énergétique ») mais la section « Calculs » — plus restrictive, « Calculer uniquement » — n'en cite que quatre différentes, sans « réserve énergétique ». Faute de définition (réserve par rapport à quoi ? au-delà du DoD ? un pourcentage de marge distinct ?), cette grandeur n'a pas été implémentée plutôt que devinée. Signalé pour arbitrage explicite si elle doit être ajoutée.
2. **« Capacité minimale » (Objectifs) vs « capacité nominale » (Calculs).** Traitées comme la même grandeur (`nominalCapacityAh`) faute d'indication contraire — à confirmer.
3. **Restriction de `technology` à quatre valeurs fixes.** Choix technique (type union fermé) pour permettre une validation d'entrée simple, cohérent avec les quatre technologies explicitement citées par la mission et les tests demandés. Une future technologie (ex. lithium NMC) nécessiterait d'étendre ce type — non bloquant, mais à noter.
4. **Toutes les erreurs de ce moteur sont bloquantes (aucun canal `result.errors` non bloquant).** Contrairement à l'Energy Engine (Phase 4.1) qui dégrade gracieusement certains consommateurs incomplets, le Battery Engine produit une grandeur agrégée unique par run : il n'existe pas de sous-ensemble « partiellement calculable » pertinent. Ce choix de conception découle directement de la nature du domaine, pas d'une interprétation ambiguë du texte de mission — signalé par transparence, pas comme un point bloquant.
5. **Duplication mineure de `resolveProjectVoltage` (12 V / 24 V) avec l'Energy Engine.** La contrainte « ne pas modifier Energy Engine » interdit d'en extraire une version partagée sans toucher à ce fichier. Une fonction locale de trois lignes est donc dupliquée dans `battery-engine.ts` plutôt que factorisée — écart mineur, documenté plutôt que silencieusement laissé sans explication.

---

# Fin — PHASE-4.2-RAPPORT / FabSystem
