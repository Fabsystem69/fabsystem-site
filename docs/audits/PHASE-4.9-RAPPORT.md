# PHASE-4.9-RAPPORT — Protection Engine

**Date : 21/08/2026**
**Périmètre : un seul moteur, `lib/engines/protection-engine.ts`, construit exclusivement sur le socle de la Phase 4.0. Lit `circuit.*` et `cable.*` via `EngineContext`, sans jamais appeler ni recalculer le Circuit Engine (Phase 4.7/4.7.1) ni le Cable Engine (Phase 4.8). Aucun schéma généré. Aucun moteur existant modifié, `EngineRunner` et `Registry` non touchés, aucune interface.**

---

# Architecture

Un unique nouveau fichier, `lib/engines/protection-engine.ts`, aux côtés des briques déjà existantes (aucune modifiée) :

```
lib/engines/
  types.ts, errors.ts, context.ts, runner.ts, registry.ts, constants.ts, value-diff.ts   ← inchangés
  energy-engine.ts, battery-engine.ts, alternator-engine.ts,                             ← inchangés
  solar-engine.ts, charger-engine.ts, global-energy-balance-engine.ts,
  circuit-engine.ts, cable-engine.ts
  protection-engine.ts                                                                   ← nouveau (Phase 4.9)
```

C'est le **premier moteur à lire deux sources structurelles/dérivées simultanément** (`circuit.*` et `cable.*`) plutôt qu'une seule : le Circuit Engine ne consomme que `energy.consumers`, le Cable Engine ne consomme que `circuit.*` ; le Protection Engine consomme les deux, sans jamais réexécuter leurs calculs.

Même structuration en deux couches que les moteurs précédents :

- **`computeProtectionEngineOutput(input, circuits, cables)`** — fonction pure, sans `EngineContext` : prend les définitions de protection et deux dictionnaires de circuits/câbles déjà résolus, sélectionne le dispositif. Testable indépendamment de tout contexte.
- **`createProtectionEngine()`** — fabrique le `BaseEngine` : lit `circuit.<circuitId>` et `cable.<circuitId>` via `context.getRetainedValue(...)` pour chaque circuit à protéger, appelle la fonction pure, construit les propositions `protection.*`.

**Un nombre variable de valeurs retenues**, comme le Circuit Engine et le Cable Engine : `protection.<circuitId>` — une clé par circuit protégé, pas un jeu fixe.

## Aucune table normative — catalogue et règles entièrement fournis par l'appelant

Contrairement à tous les moteurs précédents (qui appliquaient des formules physiques universelles — loi d'Ohm, puissance = courant × tension), le choix d'une protection dépend de tables normatives réelles (courbes de déclenchement, calibres normalisés par famille de dispositif, règles de coordination câble/protection) que ce MASTER interdit explicitement d'inventer ou de coder en dur (« aucune table normative codée en dur, aucun calibre imposé, aucune règle métier figée »). Le moteur ne contient donc **aucune constante métier** : le catalogue des dispositifs disponibles et les bornes de marge admissible sont des paramètres obligatoires de chaque appel — voir section Paramètres.

Isolation vérifiée : `circuit-engine.ts`, `cable-engine.ts`, `runner.ts`, `registry.ts` et les six autres moteurs sont strictement identiques à l'issue de cette phase (`git diff --stat` sans sortie) ; aucun fichier hors `lib/engines/protection-engine.ts` et ses tests ne référence ce moteur (`grep` sur `protection-engine`/`PROTECTION_ENGINE_ID`/`createProtectionEngine`).

---

# Paramètres utilisés

Conformément à la mission (« Les règles de sélection doivent être entièrement pilotées par paramètres »), tous les paramètres métier sont fournis explicitement par l'appelant, circuit par circuit :

| Paramètre | Rôle |
|---|---|
| `circuitId` | Référence le `circuit.<id>` (Circuit Engine) et le `cable.<id>` (Cable Engine) du circuit à protéger. |
| `minMarginRatio` | Marge minimale admissible : le calibre retenu doit être ≥ `referenceCurrentA × minMarginRatio`. Limite métier, jamais déduite. |
| `maxMarginRatio` | Marge maximale admissible : le calibre retenu doit être ≤ `referenceCurrentA × maxMarginRatio`. Limite métier, jamais déduite. |
| `catalog` | Catalogue des dispositifs de protection disponibles pour ce circuit — liste de `{ type: string; ratingA: number }`, fournie intégralement par l'appelant (« en entrée », mission explicite). Aucune entrée par défaut. |

Rien n'est lu depuis `Project` : les seules grandeurs physiques utilisées (courant, section de câble) proviennent exclusivement de `circuit.<id>` et `cable.<id>`, déjà persistés.

---

# Algorithme de sélection

Pour chaque circuit à protéger, dans l'ordre :

**1. Courant nominal de protection (A)**
```
referenceCurrentA = circuit.cumulatedCurrentA si connu (≠ null)
                     sinon circuit.cumulatedPowerW / circuit.voltageV
```
Dérivé exclusivement de `circuit.<id>` — jamais du câble déjà dimensionné, pour que le courant nominal reste celui du circuit/de la charge, indépendamment du choix de section déjà arrêté par le Cable Engine.

**2. Bornes de marge admissible (A)**
```
minA = referenceCurrentA × minMarginRatio
maxA = referenceCurrentA × maxMarginRatio
```

**3. Candidats compatibles**
```
candidats = catalog.filter(dispositif => minA ≤ dispositif.ratingA ≤ maxA)
```
Aucune table normative n'intervient ici : la comparaison porte uniquement sur les bornes fournies par l'appelant et les calibres du catalogue fourni.

**4. Calibre retenu**
```
retenu = le plus petit calibre parmi les candidats compatibles
```
Le calibre le plus proche du courant nominal (par le bas de la fourchette admissible) est préféré à un sur-dimensionnement arbitraire — cohérent avec le choix déjà fait par le Cable Engine (Phase 4.8) de retenir la plus petite section satisfaisant la contrainte plutôt que la plus grande disponible. Aucun candidat compatible → « aucune protection compatible » (voir Validation).

**5. Marge de protection réellement obtenue**
```
marginRatio = retainedRatingA / referenceCurrentA
```

`protectionType` et `cableSectionMm2` (repris tel quel depuis `cable.<id>.retainedSectionMm2`, jamais recalculé) complètent la sortie pour traçabilité, sans intervenir dans le calcul lui-même.

Toutes ces étapes sont commentées dans le code au-dessus de `computeProtectionEngineOutput`. Aucune n'utilise de constante interne au moteur : chaque grandeur provient soit d'un paramètre `ProtectionDefinitionInput`, soit d'une donnée déjà portée par `circuit.<id>`/`cable.<id>`.

---

# Valeurs retenues

**Une clé `protection.<circuitId>` par circuit protégé**, même convention que `circuit.<id>` (Phase 4.7) et `cable.<circuitId>` (Phase 4.8).

| Clé | Contenu |
|---|---|
| `protection.frigo` | `{ circuitId, referenceCurrentA, cableSectionMm2, protectionType, retainedRatingA, minMarginRatio, maxMarginRatio, marginRatio }` |

`value` et `simulatedValue` identiques à l'issue du calcul (même convention que tous les moteurs précédents). Le moteur **ne persiste jamais lui-même** : il propose, `EngineRunner` (inchangé) reste seul responsable de la persistance et de la propagation d'obsolescence.

Aucune protection définie (`protections: []`) → aucune valeur retenue, aucune dépendance proposée — cas légitime, vérifié par test.

---

# Dépendances

Graphe **exact**, comme le Circuit Engine et le Cable Engine : chaque protection dépend uniquement des deux seules sources réellement lues.

```
protection.<circuitId>   dépend de   circuit.<circuitId>
protection.<circuitId>   dépend de   cable.<circuitId>
```

Deux arêtes par protection produite — aucune dépendance vers `energy.*`, `battery.*`, `alternator.*`, `solar.*`, `charger.*`, `diagram.*` ou Volta (vérifié par test).

---

# Validation

Uniquement des instances de `EngineError` (Phase 4.0).

- **`DependencyError` — circuit absent/obsolète/incompatible** (`CIRCUIT_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`) : `circuit.<circuitId>` absent, non `ACTIVE`, ou de forme inattendue.
- **`DependencyError` — câble absent/obsolète/incompatible** (`CABLE_DATA_MISSING`/`_OBSOLETE`/`_INCOMPATIBLE`) : `cable.<circuitId>` absent, non `ACTIVE`, ou de forme inattendue (doit exposer `retainedSectionMm2` numérique).
- **`ValidationError` — paramètres manquants/invalides propres au moteur** :
  - `PROTECTION_PARAMETER_MISSING` : `circuitId` absent.
  - `PROTECTION_MARGIN_INVALID` : `minMarginRatio`/`maxMarginRatio` absents, non finis, ≤ 0, ou `maxMarginRatio` < `minMarginRatio`.
  - `PROTECTION_CATALOG_MISSING` : `catalog` absent, non tableau ou vide.
  - `PROTECTION_CATALOG_INVALID` : une entrée du catalogue est mal formée (type non renseigné, calibre non fini ou ≤ 0).
  - `PROTECTION_DUPLICATE_CIRCUIT` : un même `circuitId` apparaît deux fois dans `protections`.
  - `PROTECTIONS_MISSING` : `protections` n'est pas un tableau (structure d'entrée invalide).
- **`CalculationError` — calcul impossible** :
  - `PROTECTION_CURRENT_INDETERMINATE` : le courant de référence dérivé n'est pas un nombre fini ≥ 0 (défensif, ex. tension de circuit nulle).
  - `PROTECTION_NO_COMPATIBLE_DEVICE` : aucun dispositif du catalogue fourni ne se situe dans la fourchette de marge admissible (« aucune protection compatible »).

---

# Tests

Deux nouveaux fichiers, 30 nouveaux tests, aucun fichier existant modifié.

## `tests/protection-engine.test.ts` (18 tests) — fonction pure `computeProtectionEngineOutput`
**✓ un circuit**, **✓ plusieurs circuits** (sélection indépendante), **✓ petit calibre**, **✓ gros calibre** (comparaison de calibre retenu selon le courant), **✓ marge faible** (fourchette serrée), **✓ marge élevée** (fourchette large), **✓ aucune protection compatible** (`CalculationError`), **✓ circuit absent**, **✓ câble absent**, **✓ paramètres invalides** (`circuitId` manquant/dupliqué, marges invalides ou incohérentes, catalogue absent/invalide, payload invalide), courant indéterminé indirectement couvert par le non-recalcul (courant dérivé du circuit, jamais du câble).

## `tests/protection-engine-runner.test.ts` (12 tests) — `BaseEngine`, validation contextuelle, intégration `EngineRunner`
Id stable, `circuit.<id>`/`cable.<id>` absent/obsolète/de forme inattendue (4 scénarios), **✓ valeurs retenues proposées** (une clé `protection.<circuitId>` par circuit, `value`/`simulatedValue` égales), **✓ dépendances proposées** (deux arêtes par circuit, exclusivement vers `circuit.<circuitId>` et `cable.<circuitId>`), aucune protection → aucune valeur ni dépendance, et intégration bout en bout via `createEngineRunner` (Phase 4.0/4.5.2, non modifié) : persistance des valeurs et dépendances, propagation d'une erreur du moteur (`PROTECTION_NO_COMPATIBLE_DEVICE`) à travers le runner, garantie que seules des `EngineError` sont levées.

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 821 / # pass 821 / # fail 0   (791 précédents + 30 nouveaux)
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucune migration Prisma** : ce moteur ne crée aucun modèle en base — les protections vivent uniquement comme valeurs retenues JSON (`ProjectRetainedValue`), exactement comme toutes les grandeurs des moteurs précédents.
- **Aucun fichier existant modifié** : les huit moteurs précédents, `EngineRunner`, `Registry`, `Project`, `Frontend`, `Dashboard`, `Volta` — aucun n'a été touché (vérifié par `git diff --stat` et `grep`).
- **Aucun recalcul de câble** : `cable.<id>.retainedSectionMm2` est repris tel quel dans la sortie, jamais recalculé ; aucune formule de chute de tension ou de section n'est dupliquée dans ce fichier.
- **Aucune modification de circuit** : `circuit.<id>` est lu, jamais écrit.
- **Aucun schéma généré.**
- **Fonctionne uniquement via `EngineRunner`** : aucune route API, aucun accès direct depuis une interface.
- **Toutes les dépendances sont explicites** : deux arêtes par protection, exclusivement vers `circuit.<circuitId>` et `cable.<circuitId>`.
- **Build et tests intégralement au vert.**

---

# Arbitrages éventuels

1. **Courant nominal de protection dérivé directement de `circuit.<id>`, plutôt que réutilisé depuis `cable.<id>.referenceCurrentA`.** La mission demande un « courant nominal de protection » distinct du courant utilisé pour le dimensionnement du câble. Le choix retenu redérive ce courant depuis le circuit (même formule que le Cable Engine : `cumulatedCurrentA` si connu, sinon `cumulatedPowerW / voltageV`), plutôt que de recopier la valeur déjà calculée par le Cable Engine — cohérent avec l'esprit métier réel (le calibre de protection se choisit sur le courant du circuit/de la charge, indépendamment de la section de câble déjà retenue) et avec l'interdiction explicite de « recalculer une section de câble » (cette dérivation ne recalcule aucune section, uniquement un courant). Une alternative (reprendre `cable.<id>.referenceCurrentA` tel quel) aurait été plus simple mais aurait rendu `circuit.<id>` non réellement utilisé dans le calcul, ce que la mission exclut implicitement en listant « circuit absent » comme catégorie de test à part entière.
2. **`cableSectionMm2` inclus dans la sortie à titre informatif, sans intervenir dans l'algorithme de sélection.** Aucune table section → ampacité n'existe dans ce moteur (interdite par la mission comme « table normative codée en dur ») ; la section de câble n'est donc pas utilisée comme contrainte de sélection, seulement reprise pour traçabilité (permettre à un futur Schéma ou à Volta de présenter ensemble le câble et sa protection sans reconstituer la relation). Documenté ici plutôt que traité silencieusement : une future évolution pourrait ajouter cette contrainte si un paramètre de correspondance section/courant maximal est explicitement fourni par l'appelant.
3. **`minMarginRatio`/`maxMarginRatio` définis par circuit, pas globaux au moteur.** Comme pour le Cable Engine (Phase 4.8, arbitrage similaire sur `maxVoltageDropPercentage`), la mission ne précise pas si ces bornes sont uniques pour tout le Projet ou spécifiques à chaque circuit. Choix retenu : par circuit, pour permettre une politique de marge différente selon la nature du circuit — cohérent avec le principe de paramètres ciblés déjà observé.
4. **Calibre retenu = le plus petit calibre compatible, pas le plus proche du milieu de la fourchette.** La mission ne précise pas de règle de départage lorsque plusieurs dispositifs du catalogue sont compatibles. Le choix retenu reprend la même logique que le Cable Engine (Phase 4.8) — prendre la valeur la plus proche du besoin réel plutôt que sur-dimensionner par défaut — pour rester cohérent entre les deux moteurs.

---

# Fin — PHASE-4.9-RAPPORT / FabSystem
