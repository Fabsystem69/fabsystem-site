# PHASE-4.1-RAPPORT — Energy Engine (premier moteur métier)

**Date : 12/08/2026**
**Périmètre : un seul moteur, `lib/engines/energy-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Aucun autre moteur, aucune interface, aucun écran modifié.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/energy-engine.ts`, à côté des briques de la Phase 4.0 (non modifiées) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts   ← Phase 4.0, inchangés
  energy-engine.ts                                          ← nouveau (Phase 4.1)
```

Le moteur implémente `BaseEngine<EnergyEngineInput, EnergyEngineOutput>` du socle Phase 4.0, sans le modifier. Il est composé de deux couches, comme les autres services du dépôt (fonction pure + fabrique) :

- **`computeEnergyEngineOutput(input, systemVoltageV)`** — fonction pure, sans `EngineContext`, testable indépendamment de tout moteur ou runner. Ne touche jamais Project ni aucune base de données.
- **`createEnergyEngine()`** — fabrique le `BaseEngine` : lit `context.project.voltage` (déjà existant, Phase 3) pour résoudre la tension système, appelle la fonction pure, construit les propositions de valeurs retenues et de dépendances attendues par le `EngineRunner`.

Vérifié par recherche (`grep`) : aucun fichier hors `lib/engines/energy-engine.ts` et ses tests ne référence ce moteur — il n'est enregistré dans aucun `Registry` applicatif, ni appelé depuis aucune route API, aucun composant, aucun autre module.

Le moteur ne connaît ni batterie, ni alternateur, ni solaire, ni protections, ni sections de câble, ni Volta : aucun import, aucune clé de valeur retenue ni dépendance ne référence ces domaines (vérifié : toutes les clés produites commencent par `energy.`).

---

# Modèle énergétique

## Consommateur (`EnergyConsumerInput`)

```ts
type EnergyConsumerInput = {
  name: string;
  powerW?: number;        // puissance unitaire (W)
  currentA?: number;      // courant unitaire (A), si connu
  voltageV?: number;      // tension de ce consommateur (V)
  dailyUsageHours: number; // durée d'utilisation quotidienne (h), 0 valide
  quantity?: number;       // nombre d'unités, défaut 1, 0 valide
};
```

**Aucun nouveau modèle Prisma** : conformément à la contrainte (« ne créer aucune base de données supplémentaire si Project permet déjà de stocker ces informations »), les consommateurs ne sont pas persistés directement — ils sont l'entrée du moteur, et c'est le **résultat agrégé** du calcul qui est proposé comme valeur retenue via le socle `ProjectRetainedValue` (Phase 3), déjà prévu à cet effet.

`voltageV` est optionnel au niveau du consommateur : à défaut, la tension système du Project (`context.project.voltage`, Phase 3 : `V12` / `V24` / `UNKNOWN`) sert de référence. Cela évite de ressaisir 12 ou 24 sur chaque consommateur d'une installation à bus unique, tout en respectant MASTER-06 §9 (ne jamais inventer une tension à la place du client) : si ni le consommateur ni le Project ne déclarent de tension, aucune tension n'est supposée.

## Sortie (`EnergyEngineOutput`)

```ts
type EnergyEngineOutput = {
  consumers: EnergyConsumerComputation[];  // détail par consommateur
  totalPowerW: number;   // somme des puissances connues
  dailyWh: number;       // somme des consommations journalières connues (Wh)
  dailyAh: number;       // somme des consommations journalières connues (Ah)
  maxCurrentA: number;   // somme des courants totaux connus (pire cas simultané)
  complete: boolean;     // false si au moins une grandeur n'a pas pu être calculée
};
```

Les agrégats sont **toujours des nombres** (jamais `null`) : ils somment ce qui est calculable et signalent séparément, via `result.errors`, les grandeurs qui ne le sont pas (voir section Validation). C'est directement l'application de MASTER-06 §41 (« un calcul exigeant une donnée absente peut demander cette donnée au moment utile ») et de l'anti-dérive #26 de MASTER-06 (« Projet incomplet autorisé ») : un consommateur incomplet ne bloque ni ne fausse silencieusement le total des autres.

---

# Formules utilisées

Toutes déterministes, aucune valeur magique métier :

| Grandeur | Formule |
|---|---|
| Puissance unitaire, si non fournie | `unitPowerW = currentA × tension résolue` |
| Courant unitaire, si non fourni | `unitCurrentA = powerW / tension résolue` |
| Puissance totale d'un consommateur | `totalPowerW = unitPowerW × quantity` |
| Courant total d'un consommateur | `totalCurrentA = unitCurrentA × quantity` |
| Consommation journalière (Wh) | `dailyWh = totalPowerW × dailyUsageHours` |
| Consommation journalière (Ah) | `dailyAh = totalCurrentA × dailyUsageHours` |
| Totaux du Project | somme des grandeurs connues sur tous les consommateurs |

Aucune formule d'onduleur, de rendement de charge, de perte en ligne ou de conversion de tension n'est introduite : ces sujets appartiennent aux futurs moteurs (Batterie, Solaire, Section) et sont hors périmètre.

**Tension résolue** pour un consommateur = sa propre `voltageV` si déclarée, sinon la tension système du Project (12 pour `V12`, 24 pour `V24`, absente pour `UNKNOWN`).

---

# Valeurs retenues produites

Trois propositions (`EngineResult.retainedValues`), correspondant exactement à la chaîne décrite par la mission :

| Clé | Contenu |
|---|---|
| `energy.consumers` | Le détail calculé par consommateur (`EnergyConsumerComputation[]`) |
| `energy.dailyConsumption` | `{ totalPowerW, dailyWh, dailyAh, complete }` |
| `energy.maxCurrent` | `{ maxCurrentA, complete }` |

Pour chacune, `value` et `simulatedValue` sont identiques à l'issue de ce premier calcul (le moteur vient de les calculer, il n'y a pas encore de valeur antérieurement retenue à comparer). Le moteur **ne persiste jamais lui-même** : il propose, et c'est exclusivement `EngineRunner` (Phase 4.0, inchangé) qui appelle `retainValue`/`declareDependency`.

---

# Dépendances créées

Exactement les deux arêtes décrites dans la mission, aucune autre :

```
energy.dailyConsumption  dépend de  energy.consumers
energy.maxCurrent        dépend de  energy.dailyConsumption
```

Le moteur ne déclare que ses propres clés (`energy.*`) — vérifié explicitement par test (`le moteur ne déclare que ses propres clés energy.*`).

---

# Validation

Conformément à la mission, uniquement des instances de `EngineError` (Phase 4.0), jamais d'`Error` générique.

## Bloquantes (levées, interrompent le calcul)

- **`ValidationError` — donnée manquante** (`CONSUMER_MISSING_POWER_DATA`) : un consommateur ne déclare ni `powerW` ni `currentA`.
- **`ValidationError` — valeur invalide** (`CONSUMER_INVALID_VALUE`) : nom vide, valeur négative, valeur non finie (`NaN`/`Infinity`), tension déclarée égale à zéro, ou durée quotidienne supérieure à 24h (contrainte dimensionnelle, pas commerciale).
- **`ValidationError` — unité incohérente** : deux cas — (`CONSUMER_VOLTAGE_MISMATCH`) la tension propre du consommateur diverge de la tension système du Project ; (`CONSUMER_POWER_CURRENT_MISMATCH`) puissance et courant déclarés simultanément sont physiquement incompatibles (`P ≠ U × I` au-delà d'une tolérance d'arrondi).

## Non bloquante (rapportée dans `result.errors`, le calcul continue)

- **`CalculationError` — calcul impossible** (`CONSUMER_CALCULATION_IMPOSSIBLE`) : une grandeur (puissance ou courant) ne peut pas être dérivée faute de tension connue, ni sur le consommateur ni sur le Project. Une instance de `CalculationError` est construite et sérialisée dans `result.errors` (utilise donc bien `EngineError`), sans être levée : le reste du calcul se poursuit pour les autres grandeurs et les autres consommateurs, `output.complete` passe à `false`.

`DependencyError` n'est pas utilisée par ce moteur : ce premier moteur n'a aucune dépendance envers une valeur produite par un autre moteur (il est la racine de la chaîne) — cette classe redeviendra pertinente pour les futurs moteurs qui consommeront `energy.*`.

---

# Tests

Deux nouveaux fichiers, 38 nouveaux tests, aucun test existant modifié.

## `tests/energy-engine.test.ts` (31 tests) — fonction pure `computeEnergyEngineOutput`
Couvre explicitement chaque point du mission-brief : **✓ aucun consommateur**, **✓ un consommateur**, **✓ plusieurs consommateurs**, **✓ tension 12V**, **✓ tension 24V**, **✓ puissance connue**, **✓ courant connu**, puissance+courant cohérents fournis ensemble, **✓ durée nulle**, **✓ quantité multiple** (+ quantité zéro), calcul impossible non bloquant (tension système inconnue, un consommateur incomplet n'empêche pas les autres), et **✓ erreurs de validation** : nom manquant, donnée manquante, valeur négative, valeur non finie, durée > 24h, tension nulle, tension incohérente, puissance/courant incohérents, tolérance d'arrondi acceptée, `consumers` absent du payload, et une vérification que toute erreur produite est bien une `EngineError`.

## `tests/energy-engine-runner.test.ts` (7 tests) — `BaseEngine` et intégration `EngineRunner`
Id stable, **✓ valeurs retenues proposées** (3 clés, `value`/`simulatedValue`), **✓ dépendances proposées** (les 2 arêtes exactes), isolation des clés (`energy.*` uniquement), fonctionnement avec tension système `UNKNOWN`, et surtout : **le moteur fonctionne via `EngineRunner`** — exécution complète à travers `createEngineRunner` (Phase 4.0, non modifié) avec persistance simulée des valeurs/dépendances, et **propagation des erreurs** d'une `ValidationError` levée par le moteur à travers le runner jusqu'à l'appelant.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 559 / # pass 559 / # fail 0
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle. Il réutilise intégralement `Project.voltage` (Phase 3) et le socle `ProjectRetainedValue`/`ProjectValueDependency` via `EngineRunner` (Phase 4.0), sans les modifier.
- **Aucun fichier existant modifié** : `Project`, `Runner`, `Registry`, le reste du framework, Volta, Dashboard, Frontend, Auth, Stripe — aucun n'a été touché. Seuls deux fichiers nouveaux (`lib/engines/energy-engine.ts` et ses deux fichiers de test) ont été créés.
- **Aucun autre moteur créé, aucune interface graphique.**
- **Build et tests intégralement au vert.**

---

# Arbitrages nécessaires

1. **Tolérance de cohérence puissance/courant (1 %).** `P = U × I` est une loi physique exacte, mais une saisie utilisateur arrondie (ex. 60,3 W pour 5 A × 12 V) ne doit pas être rejetée à tort. Aucun MASTER ne fixe de seuil de tolérance pour cette vérification de saisie. La valeur retenue ici (1 % relatif) est un choix technique d'arrondi, pas une règle commerciale, mais reste un nombre choisi sans base MASTER — à confirmer ou ajuster si besoin.
2. **Limite de 24h/jour par consommateur.** Contrainte dimensionnelle (un jour ne peut pas compter plus de 24h d'usage), non explicitement demandée par la mission ni par un MASTER, ajoutée par cohérence physique. Aucun impact métier (un consommateur utilisé 24h/24 reste valide).
3. **Somme partielle plutôt que blocage total en cas de donnée manquante isolée.** La mission liste « calcul impossible » comme une erreur à créer ; ce rapport a choisi de la rendre **non bloquante** (un consommateur sans tension connue n'empêche pas le calcul des autres, ni le calcul de sa propre puissance/Wh), par cohérence avec MASTER-06 §41 et l'anti-dérive #26 (Projet incomplet autorisé). Un rejet total du calcul dès qu'un seul consommateur est incomplet aurait été tout aussi défendable littéralement, mais aurait contredit ces principes MASTER pour un cas d'usage qui sera fréquent (saisie progressive du Bilan énergétique). Ce choix est documenté ici pour validation explicite plutôt qu'imposé silencieusement.
4. **Choix de sommer les grandeurs partiellement connues plutôt que de renvoyer `null` en cas d'incomplétude.** Voir point 3 — mécaniquement lié : `totalPowerW`/`dailyWh`/`dailyAh`/`maxCurrentA` sont toujours des nombres (somme de ce qui est connu), et `output.complete`/`result.errors` signalent l'incomplétude séparément, plutôt que de propager un `null` global peu exploitable. Aucun MASTER ne tranche explicitement cette convention de sortie ; elle est cohérente avec la philosophie « ne jamais bloquer sur une donnée manquante » mais reste un choix de forme à confirmer avant qu'un futur moteur (Batterie) ne consomme `energy.dailyConsumption`/`energy.maxCurrent`.

Aucun de ces points ne remet en cause le socle de la Phase 4.0 ni les MASTER relus ; ils sont documentés par transparence, conformément à la consigne d'ouverture des phases précédentes.

---

# Fin — PHASE-4.1-RAPPORT / FabSystem
