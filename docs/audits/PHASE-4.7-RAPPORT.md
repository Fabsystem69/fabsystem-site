# PHASE-4.7-RAPPORT — Circuit Engine (premier moteur structurel)

**Date : 19/08/2026**
**Périmètre : un seul moteur, `lib/engines/circuit-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit `energy.consumers` via `EngineContext`, sans jamais appeler ni recalculer l'Energy Engine. Aucun câble, aucune protection, aucun schéma. Aucun moteur existant modifié, `EngineRunner` et `Registry` non touchés, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/circuit-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts, value-diff.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                             ← inchangés
  solar-engine.ts, charger-engine.ts, global-energy-balance-engine.ts
  circuit-engine.ts                                                                      ← nouveau (Phase 4.7)
```

C'est le **premier moteur structurel** du dépôt : contrairement aux six précédents (cinq moteurs de calcul + un agrégateur numérique), il ne produit pas une grandeur physique mais un **modèle logique** — le regroupement de consommateurs déjà connus en circuits. Deux différences structurantes en découlent, documentées ci-dessous :

- **Un paramètre de structure, pas de grandeur physique** : `CircuitEngineInput` reçoit le regroupement des consommateurs en circuits (identifiant, nom, type optionnel, liste des noms de consommateurs) — une décision que ce moteur ne peut pas déduire lui-même des données énergétiques, elle doit venir de l'appelant.
- **Un nombre variable de valeurs retenues** : contrairement aux moteurs précédents qui produisent toujours le même jeu fixe de clés, le Circuit Engine produit **une clé `circuit.<id>` par circuit défini** — voir section Valeurs retenues.

Même structuration en deux couches que les moteurs précédents :

- **`computeCircuitEngineOutput(input, consumers)`** — fonction pure, sans `EngineContext` : prend les définitions de circuits et la liste des consommateurs déjà connus, construit le modèle logique. Testable indépendamment de tout contexte.
- **`createCircuitEngine()`** — fabrique le `BaseEngine` : lit `energy.consumers` via `context.getRetainedValue(...)`, appelle la fonction pure, construit les propositions `circuit.*`.

**Aucun couplage de code avec l'Energy Engine ni aucun autre moteur** : `circuit-engine.ts` n'importe aucun fichier `*-engine.ts` (vérifié par recherche). Le lien est exclusivement une dépendance de **données** — `energy.consumers`, déjà persisté par l'Energy Engine (Phase 4.1) — jamais un appel de fonction ni une réexécution de ses formules.

Isolation vérifiée : aucun fichier hors `lib/engines/circuit-engine.ts` et ses tests ne référence ce moteur ; `EngineRunner` et `Registry` sont strictement identiques à l'issue de cette phase (`git diff --stat` sans sortie).

---

# Modèle des circuits

## Entrée : le regroupement, fourni par l'appelant

```ts
type CircuitDefinitionInput = {
  id: string;                  // identifiant stable, fourni par l'appelant
  name: string;
  circuitType?: string;        // libre, aucune liste fermée imposée
  consumerNames: string[];     // noms référençant energy.consumers[].name
};

type CircuitEngineInput = {
  circuits: CircuitDefinitionInput[];
};
```

Le regroupement des consommateurs en circuits est une décision structurelle qui n'est dérivable d'aucune formule : ce moteur ne l'invente jamais, il l'attend explicitement en entrée (cohérent avec l'esprit « aucune valeur métier codée en dur » déjà appliqué aux moteurs de calcul, transposé ici à une décision de structure plutôt qu'à un paramètre numérique).

## Sortie : le modèle logique construit

```ts
type CircuitComputation = {
  id: string;
  name: string;
  circuitType: string | null;
  consumerNames: string[];
  cumulatedPowerW: number;         // toujours un nombre
  cumulatedCurrentA: number | null; // « si disponible » (mission) → nullable
  voltageV: number;                 // toujours requis, jamais nullable
};
```

Reprend exactement les sept champs cités en exemple par la mission (« identifiant, nom, consommateurs associés, puissance cumulée, courant cumulé (si disponible), tension, type de circuit (si fourni) »). Deux distinctions de nullabilité sont directement dictées par la formulation de la mission elle-même :

- **`cumulatedCurrentA` est nullable** — seul champ qualifié « (si disponible) » dans la liste de la mission. Reprend la même philosophie que l'Energy Engine (« sommer ce qui est calculable ») : si au moins un consommateur du circuit a un courant connu, la somme partielle est renvoyée ; si aucun n'en a, `null` plutôt qu'un zéro trompeur.
- **`voltageV` n'est jamais nullable** — aucune réserve « si disponible » dans la mission pour ce champ. Si aucun consommateur du circuit n'a de tension connue, c'est un « calcul impossible » bloquant (`CalculationError`), pas une valeur manquante tolérée.
- **`cumulatedPowerW` n'est pas non plus nullable** — même logique que le courant : c'est une somme de ce qui est calculable côté Energy Engine, mais contrairement au courant, la mission ne le qualifie pas d'optionnel ; en pratique, il est presque toujours calculable (l'Energy Engine résout la puissance dès que la puissance **ou** le courant + une tension sont connus), donc un `0` en cas d'absence totale reste cohérent avec le comportement déjà établi par l'Energy Engine plutôt qu'un `null` supplémentaire.

Aucune section de câble, aucun fusible, aucun disjoncteur, aucun relais : le modèle ne contient que des grandeurs déjà connues (puissance, courant, tension), jamais un dimensionnement physique.

---

# Valeurs retenues

**Une clé `circuit.<id>` par circuit défini**, et non un jeu fixe de clés comme les moteurs précédents : un moteur structurel produit un nombre variable d'objets, chacun devant rester individuellement adressable et propageable (un futur Cable Engine ou Protection Engine devra pouvoir dépendre d'un circuit précis, pas d'une liste globale). Exemple avec deux circuits `c1`/`c2` :

| Clé | Contenu |
|---|---|
| `circuit.c1` | `{ id, name, circuitType, consumerNames, cumulatedPowerW, cumulatedCurrentA, voltageV }` |
| `circuit.c2` | idem |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que les six moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (Phase 4.0/4.5.2, inchangé) reste seul responsable de la persistance et de la propagation d'obsolescence.

Aucun circuit défini (`circuits: []`) → aucune valeur retenue, aucune dépendance proposée — un cas légitime (« Projet incomplet autorisé »), vérifié par test.

---

# Dépendances

Graphe **exact** : chaque circuit dépend uniquement de la seule source réellement lue.

```
circuit.<id>   dépend de   energy.consumers
```

Une arête par circuit produit — aucune dépendance vers `battery.*`, `alternator.*`, `solar.*`, `charger.*`, `cable.*`, `protection.*`, `diagram.*` ou Volta (vérifié par test). C'est le graphe le plus simple de tous les moteurs construits jusqu'ici : ce moteur ne lit qu'**une seule** valeur retenue source (`energy.consumers`), contrairement aux moteurs de recharge (2 sources) ou à l'agrégateur (5 sources).

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0).

- **`DependencyError` — données manquantes/obsolètes/incompatibles** (`ENERGY_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`) : `energy.consumers` absent, non `ACTIVE`, ou de forme inattendue (chaque élément du tableau doit exposer `name`, `quantity`, `voltageV`/`totalPowerW`/`totalCurrentA` nullable-numériques). Même famille de codes que la Phase 4.6.
- **`ValidationError` — circuit vide** (`CIRCUIT_EMPTY`) : un circuit sans aucun consommateur associé.
- **`ValidationError` — consommateur absent** (`CIRCUIT_CONSUMER_NOT_FOUND`) : un circuit référence un nom de consommateur qui n'existe pas dans `energy.consumers`.
- **`ValidationError` — données incohérentes** (`CIRCUIT_CONSUMER_DUPLICATE_ASSIGNMENT`) : un même consommateur est rattaché à deux circuits simultanément — un consommateur appartient à une seule branche électrique.
- **`ValidationError` — tension incompatible** (`CIRCUIT_VOLTAGE_MISMATCH`) : le circuit mélange des consommateurs dont les tensions résolues diffèrent.
- **`ValidationError` — structure invalide** (`CIRCUITS_MISSING`, `CIRCUIT_INVALID_VALUE`, `CIRCUIT_DUPLICATE_ID`) : payload d'entrée mal formé, identifiant/nom de circuit manquant, identifiants dupliqués — validations de structure complémentaires, non nommément citées par la mission mais nécessaires pour garantir un modèle cohérent.
- **`CalculationError` — calcul impossible** (`CIRCUIT_VOLTAGE_INDETERMINATE`) : aucun consommateur du circuit n'a de tension connue — la tension du circuit (champ non « si disponible ») ne peut être déterminée.

---

# Tests

Deux nouveaux fichiers, 25 nouveaux tests, aucun fichier existant modifié.

## `tests/circuit-engine.test.ts` (16 tests) — fonction pure `computeCircuitEngineOutput`
**✓ un seul circuit**, **✓ plusieurs circuits** (regroupement indépendant), **✓ plusieurs consommateurs** dans un même circuit (somme puissance/courant), consommateur au courant partiellement inconnu (somme partielle), aucun courant connu (`null`), **✓ consommateur absent**, **✓ circuit vide**, **✓ tensions différentes**, tension indéterminée (calcul impossible), données incohérentes (double affectation), identifiants dupliqués, payload invalide, aucun circuit défini (liste vide sans erreur), type de circuit optionnel conservé/`null`, et non-recalcul des grandeurs consommateurs.

## `tests/circuit-engine-runner.test.ts` (14 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, `energy.consumers` absent/obsolète/de forme inattendue, **✓ valeurs retenues proposées** (une clé `circuit.<id>` par circuit, `value`/`simulatedValue` égales), **✓ dépendances proposées** (une arête par circuit, exclusivement vers `energy.consumers`), aucun circuit → aucune valeur ni dépendance, et intégration bout en bout via `createEngineRunner` (Phase 4.0/4.5.2, non modifié) : persistance des valeurs et dépendances, propagation d'une erreur du moteur à travers le runner, garantie que seules des `EngineError` sont levées.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 760 / # pass 760 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle `Circuit` en base — les circuits vivent uniquement comme valeurs retenues JSON (`ProjectRetainedValue`), exactement comme toutes les grandeurs des moteurs précédents. Aucun modèle Phase 3 modifié.
- **Aucun fichier existant modifié** : les six moteurs précédents, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché (vérifié par `git diff --stat`).
- **Aucun calcul de câble ni de protection** : vérifié par relecture — le modèle ne contient que puissance/courant/tension déjà connus, jamais une section de câble, un calibre de fusible ou un disjoncteur.
- **Build et tests intégralement au vert.**

---

# Arbitrages éventuels

1. **Une clé retenue par circuit, plutôt qu'une clé unique contenant la liste.** La mission ne précise pas explicitement comment `circuit.*` doit se décliner pour un nombre variable de circuits. Le choix retenu (`circuit.<id>` par instance) permet à un futur Cable/Protection Engine de déclarer une dépendance précise vers **un** circuit donné plutôt que vers une liste entière (ce qui aurait invalidé tous les circuits dès qu'un seul change) — cohérent avec le principe MASTER-06 §30 de dépendances ciblées. Une alternative (une clé unique `circuit.list` contenant tous les circuits) a été écartée pour cette raison, mais reste documentée ici comme option non retenue.
2. **`consumerNames` comme identifiant de rattachement plutôt qu'un identifiant stable dédié.** `energy.consumers` (Phase 4.1) identifie chaque consommateur par son `name` (chaîne libre), sans identifiant technique séparé. Le Circuit Engine réutilise ce même identifiant pour le rattachement — cohérent avec l'existant, mais fragile si deux consommateurs portent un jour le même nom (l'Energy Engine ne l'interdit pas explicitement). Non traité ici : signalé comme point d'attention pour une future évolution du modèle consommateur, hors périmètre de cette phase.
3. **Une seule clé `energy.*` lue (`energy.consumers`), pas `energy.dailyConsumption`.** La mission autorise « energy.* si nécessaire » sans en imposer le détail. `energy.consumers` suffit entièrement (chaque consommateur y porte déjà son statut de résolution individuel) ; lire `energy.dailyConsumption` en plus aurait été une lecture non utilisée par aucune formule, donc explicitement évitée conformément à la discipline « dépendances réellement utilisées » déjà appliquée depuis la Phase 4.3.
4. **`cumulatedPowerW` non nullable, `cumulatedCurrentA` nullable.** Choix déduit de la formulation littérale de la mission (seul le courant porte la mention « si disponible ») plutôt que d'un principe général — si une incohérence apparaît un jour entre les deux (un circuit dont aucun consommateur n'a de puissance connue mais dont certains ont un courant connu), la puissance resterait `0` plutôt que `null`, ce qui pourrait mériter reconsidération lors d'un futur moteur consommateur de cette donnée.
5. **Validations de structure additionnelles non nommément citées** (`CIRCUITS_MISSING`, `CIRCUIT_INVALID_VALUE`, `CIRCUIT_DUPLICATE_ID`). La mission liste « consommateur absent, données incohérentes, tension incompatible, circuit vide, calcul impossible » comme catégories à prévoir « notamment » (non exhaustif) ; ces validations complémentaires ont été ajoutées pour garantir un modèle structurellement cohérent avant même de résoudre les consommateurs, jugées nécessaires plutôt qu'inventées sans besoin.

---

# Fin — PHASE-4.7-RAPPORT / FabSystem
