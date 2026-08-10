# PHASE-4.8-RAPPORT — Cable Engine

**Date : 20/08/2026**
**Périmètre : un seul moteur, `lib/engines/cable-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit `circuit.*` via `EngineContext`, sans jamais appeler ni recalculer le Circuit Engine ni l'Energy Engine. Aucune protection choisie, aucun schéma généré. Aucun moteur existant modifié, `EngineRunner` et `Registry` non touchés, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/cable-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts, value-diff.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                             ← inchangés
  solar-engine.ts, charger-engine.ts, global-energy-balance-engine.ts, circuit-engine.ts
  cable-engine.ts                                                                        ← nouveau (Phase 4.8)
```

C'est le **second moteur qui consomme un moteur structurel** plutôt qu'un simple agrégat numérique : il ne lit pas `energy.*` mais exclusivement `circuit.*` (Phase 4.7/4.7.1), une valeur elle-même dérivée sans jamais toucher au code du Circuit Engine — même discipline que tous les moteurs précédents (« dépendance de données, jamais d'appel de fonction »).

Même structuration en deux couches que les moteurs précédents :

- **`computeCableEngineOutput(input, circuits)`** — fonction pure, sans `EngineContext` : prend les définitions de câbles et un dictionnaire de circuits déjà résolus (`circuitId → { cumulatedPowerW, cumulatedCurrentA, voltageV }`), calcule le dimensionnement. Testable indépendamment de tout contexte.
- **`createCableEngine()`** — fabrique le `BaseEngine` : lit `circuit.<circuitId>` via `context.getRetainedValue(...)` pour chaque câble demandé, appelle la fonction pure, construit les propositions `cable.*`.

**Un nombre variable de valeurs retenues**, comme le Circuit Engine : `cable.<circuitId>` — une clé par circuit câblé, pas un jeu fixe.

## Un moteur public équivalent existe déjà — non réutilisé dans cette phase

Un calculateur public de section de câble existe déjà (`components/CalcSection.tsx`, route `/outils#section-cable`) : même principe physique (résistivité cuivre fixe à 0,0175 Ω·mm²/m, longueur doublée pour l'aller-retour, arrondi à la section normalisée immédiatement supérieure dans une liste `[0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50]`). MASTER-11 §11/§76 demande qu'un calcul public et le même calcul utilisé dans un Project **partagent le même moteur** lorsque la logique est identique.

Cette mission interdit cependant explicitement de modifier le Frontend — `components/CalcSection.tsx` ne peut donc pas être refactoré pour extraire une logique partagée dans cette phase. Le Cable Engine reproduit la même physique (mêmes formules) mais sans aucun import ni couplage de code avec le composant public, et sans dupliquer ses constantes (résistivité, catalogue de sections) : celles-ci sont ici des **paramètres obligatoires**, jamais des valeurs codées en dur (voir section Paramètres). Ce point est documenté comme Arbitrage ci-dessous plutôt que traité silencieusement.

Isolation vérifiée : `circuit-engine.ts`, `runner.ts`, `registry.ts` et les six autres moteurs sont strictement identiques à l'issue de cette phase (`git diff --stat` sans sortie) ; aucun fichier hors `lib/engines/cable-engine.ts` et ses tests ne référence ce moteur (`grep` sur `cable-engine`/`CABLE_ENGINE_ID`/`createCableEngine`).

---

# Paramètres utilisés

Conformément à la mission (« Aucune valeur codée en dur. Les limites réglementaires ou métier doivent être fournies par paramètres »), **tous** les paramètres physiques et métier sont fournis explicitement par l'appelant, circuit par circuit — le moteur ne connaît aucune constante figée :

| Paramètre | Rôle |
|---|---|
| `circuitId` | Référence le `circuit.<id>` (Circuit Engine) à câbler. |
| `oneWayLengthM` | Longueur simple (aller simple) entre la source et le consommateur, en mètres. |
| `maxVoltageDropPercentage` | Chute de tension maximale admissible, en % de la tension du circuit — limite réglementaire/métier, jamais déduite. |
| `conductorResistivityOhmMm2PerM` | Résistivité linéique du conducteur (Ω·mm²/m) — dépend du matériau (cuivre, aluminium...), jamais une constante figée dans le moteur. |
| `availableSectionsMm2` | Catalogue des sections normalisées disponibles (mm²) — utilisé pour arrondir la section minimale calculée à la section réellement disponible immédiatement supérieure. |

Rien n'est lu depuis `Project` : la tension utilisée pour le calcul de la chute (`voltageV`) provient exclusivement de `circuit.<id>.voltageV`, déjà porté par le circuit — conforme à l'exemple donné par la mission (« tension si elle n'est pas déjà portée par le circuit », ici elle l'est déjà).

---

# Formules

Pour chaque câble, dans l'ordre :

**1. Courant de référence (A)**
```
referenceCurrentA = circuit.cumulatedCurrentA si connu (≠ null)
                     sinon circuit.cumulatedPowerW / circuit.voltageV
```
Le circuit porte toujours un courant cumulé « si disponible » (Phase 4.7) ; lorsqu'il est `null`, le courant est dérivé de la puissance et de la tension déjà connues du circuit — jamais recalculé depuis `energy.*`.

**2. Longueur électrique utilisée (m)**
```
electricalLengthM = 2 × oneWayLengthM
```
Aller-retour du courant continu (même convention que le calculateur public `/outils`).

**3. Chute de tension maximale admissible (V)**
```
maxVoltageDropV = (maxVoltageDropPercentage / 100) × circuit.voltageV
```

**4. Section minimale admissible (mm²)** — loi d'Ohm appliquée à un conducteur de résistivité linéique donnée :
```
minimumSectionMm2 = (electricalLengthM × referenceCurrentA × conductorResistivityOhmMm2PerM)
                     / maxVoltageDropV
```

**5. Section retenue (mm²)**
```
retainedSectionMm2 = plus petite valeur de availableSectionsMm2 ≥ minimumSectionMm2
```
Si aucune section du catalogue fourni ne satisfait cette condition → `CalculationError` (« calcul impossible », voir Validation).

**6. Chute de tension réellement obtenue avec la section retenue**
```
computedVoltageDropV = (electricalLengthM × referenceCurrentA × conductorResistivityOhmMm2PerM)
                        / retainedSectionMm2
computedVoltageDropPercentage = (computedVoltageDropV / circuit.voltageV) × 100
```

Toutes ces formules sont commentées dans le code au-dessus de `computeCableEngineOutput`. Aucune n'utilise de constante interne au moteur : chaque grandeur provient soit d'un paramètre `CableDefinitionInput`, soit d'une donnée déjà portée par `circuit.<id>`.

---

# Valeurs retenues

**Une clé `cable.<circuitId>` par câble défini**, même convention que `circuit.<id>` (Phase 4.7) : un moteur dérivé d'un moteur structurel produit lui aussi un nombre variable d'objets, chacun individuellement adressable et propageable (un futur Protection Engine pourra dépendre d'un câble précis, pas d'une liste globale).

| Clé | Contenu |
|---|---|
| `cable.frigo` | `{ circuitId, referenceCurrentA, electricalLengthM, voltageV, maxVoltageDropV, minimumSectionMm2, retainedSectionMm2, computedVoltageDropV, computedVoltageDropPercentage }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que tous les moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (inchangé) reste seul responsable de la persistance et de la propagation d'obsolescence.

Aucun câble défini (`cables: []`) → aucune valeur retenue, aucune dépendance proposée — cas légitime, vérifié par test.

---

# Dépendances

Graphe **exact**, comme le Circuit Engine : chaque câble dépend uniquement de la seule source réellement lue.

```
cable.<circuitId>   dépend de   circuit.<circuitId>
```

Une arête par câble produit — aucune dépendance vers `energy.*`, `battery.*`, `alternator.*`, `solar.*`, `charger.*`, `protection.*`, `diagram.*` ou Volta (vérifié par test).

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0).

- **`DependencyError` — circuit absent/obsolète/incompatible** (`CIRCUIT_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`) : `circuit.<circuitId>` absent, non `ACTIVE`, ou de forme inattendue (doit exposer `cumulatedPowerW`, `voltageV` numériques et `cumulatedCurrentA` nullable-numérique). Même famille de codes que les moteurs précédents.
- **`ValidationError` — paramètres manquants/invalides propres au moteur** :
  - `CABLE_PARAMETER_MISSING` : `circuitId` absent ou tout autre paramètre requis non fourni.
  - `CABLE_LENGTH_INVALID` : `oneWayLengthM` absente, non finie ou ≤ 0.
  - `CABLE_VOLTAGE_DROP_LIMIT_INVALID` : `maxVoltageDropPercentage` absente, non finie ou ≤ 0.
  - `CABLE_RESISTIVITY_INVALID` : `conductorResistivityOhmMm2PerM` absente, non finie ou ≤ 0.
  - `CABLE_SECTION_CATALOG_INVALID` : `availableSectionsMm2` absent, vide, ou contenant une valeur non finie/négative.
  - `CABLE_DUPLICATE_CIRCUIT` : un même `circuitId` apparaît deux fois dans `cables`.
  - `CABLES_MISSING` : `cables` n'est pas un tableau (structure d'entrée invalide).
- **`CalculationError` — calcul impossible** :
  - `CABLE_CURRENT_INDETERMINATE` : le courant de référence dérivé n'est pas un nombre fini ≥ 0 (courant indéterminé, ex. tension de circuit nulle empêchant la division).
  - `CABLE_VOLTAGE_DROP_INDETERMINATE` : la chute de tension maximale admissible n'est pas un nombre fini strictement positif (chute de tension impossible).
  - `CABLE_SECTION_OUT_OF_RANGE` : aucune section du catalogue fourni ne permet de respecter la chute de tension maximale admissible (chute de tension excessive quelle que soit la section disponible).

---

# Tests

Deux nouveaux fichiers, 29 nouveaux tests, aucun fichier existant modifié.

## `tests/cable-engine.test.ts` (18 tests) — fonction pure `computeCableEngineOutput`
**✓ un circuit**, **✓ plusieurs circuits** (dimensionnement indépendant), **✓ courant faible**, **✓ courant élevé** (comparaison de section minimale), **✓ longueur faible**, **✓ longueur importante** (comparaison de section minimale), **✓ chute de tension admissible** (section retenue respecte la limite), **✓ chute de tension excessive** (aucune section du catalogue ne convient → `CalculationError`), **✓ circuit absent**, **✓ paramètres invalides** (longueur, chute max, résistivité, catalogue, `circuitId` manquant/dupliqué, payload invalide), courant indéterminé, non-recalcul des grandeurs du circuit, dérivation du courant depuis la puissance quand le courant n'est pas connu.

## `tests/cable-engine-runner.test.ts` (11 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, `circuit.<id>` absent/obsolète/de forme inattendue, **✓ valeurs retenues proposées** (une clé `cable.<circuitId>` par câble, `value`/`simulatedValue` égales), **✓ dépendances proposées** (une arête par câble, exclusivement vers `circuit.<circuitId>`), aucun câble → aucune valeur ni dépendance, et intégration bout en bout via `createEngineRunner` (Phase 4.0/4.5.2, non modifié) : persistance des valeurs et dépendances, propagation d'une erreur du moteur (`CABLE_SECTION_OUT_OF_RANGE`) à travers le runner, garantie que seules des `EngineError` sont levées.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 791 / # pass 791 / # fail 0   (762 précédents + 29 nouveaux)
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle en base — les câbles vivent uniquement comme valeurs retenues JSON (`ProjectRetainedValue`), exactement comme toutes les grandeurs des moteurs précédents.
- **Aucun fichier existant modifié** : les sept moteurs précédents, `EngineRunner`, `Registry`, `Project`, `Frontend` (y compris `components/CalcSection.tsx`), `Dashboard`, `Volta` — aucun n'a été touché (vérifié par `git diff --stat` et `grep`).
- **Aucun calcul de protection ni de schéma** : vérifié par relecture — le modèle ne contient que courant, longueur, tension, section et chute de tension, jamais un calibre de fusible/disjoncteur ni une représentation graphique.
- **Fonctionne uniquement via `EngineRunner`** : aucune route API, aucun accès direct depuis une interface.
- **Toutes les dépendances sont explicites** : une seule arête par câble, exclusivement vers `circuit.<circuitId>`.
- **Build et tests intégralement au vert.**

---

# Arbitrages éventuels

1. **Réutilisation de la physique du calculateur public `/outils#section-cable`, sans réutilisation de code.** MASTER-11 §11/§76 demande qu'un calcul public et le même calcul côté Project partagent le même moteur métier lorsque la logique est identique — ce qui est le cas ici (même formule de chute de tension, même principe d'arrondi à une section normalisée). Cette mission interdit cependant explicitement de modifier le Frontend, ce qui exclut d'extraire `calcSection`/`fusibleRecommande` de `components/CalcSection.tsx` vers `lib/` dans cette phase. Le Cable Engine reproduit donc la même physique de façon indépendante, sans aucun couplage de code, et transforme les deux constantes du calculateur public (résistivité cuivre fixe, catalogue de sections fixe) en **paramètres obligatoires** plutôt que de les recopier en dur — cohérent avec l'exigence explicite de cette mission (« aucune valeur codée en dur »). Point signalé pour une future phase de convergence Frontend/moteur commun, hors périmètre ici.
2. **Courant de référence dérivé de `cumulatedPowerW / voltageV` lorsque `cumulatedCurrentA` est `null`.** La mission demande un « courant de référence » sans préciser comment le déduire quand seul un courant partiel/absent est porté par le circuit. Le choix retenu réutilise les deux grandeurs déjà connues du circuit (jamais une lecture supplémentaire d'`energy.*`), cohérent avec le principe « dépendances réellement utilisées » déjà appliqué depuis la Phase 4.3.
3. **`maxVoltageDropPercentage` et `conductorResistivityOhmMm2PerM` comme paramètres par câble, pas globaux au moteur.** La mission ne précise pas si ces limites sont uniques pour tout le Projet ou spécifiques à chaque circuit câblé. Choix retenu : par câble, pour permettre à un futur appelant (Assistant Circuit) d'appliquer une tolérance différente selon la nature du circuit (ex. signal vs puissance) — cohérent avec le principe de dépendances/paramètres ciblés déjà observé pour les autres moteurs.
4. **Longueur électrique doublée en interne (`electricalLengthM = 2 × oneWayLengthM`), plutôt que de demander une longueur aller-retour directement.** Choix aligné sur la convention déjà établie par le calculateur public existant, jugé plus naturel pour un futur appelant qui mesure une distance physique simple (source → consommateur) plutôt qu'un aller-retour électrique.
5. **`CABLE_SECTION_OUT_OF_RANGE` couvre à la fois « calcul impossible » et « chute de tension excessive ».** La mission liste ces deux catégories séparément dans sa checklist de tests, mais elles correspondent au même scénario physique (aucune section du catalogue fourni ne respecte la chute de tension maximale) : un seul code d'erreur a été retenu plutôt que d'en inventer un second sans différence de cause réelle.

---

# Fin — PHASE-4.8-RAPPORT / FabSystem
