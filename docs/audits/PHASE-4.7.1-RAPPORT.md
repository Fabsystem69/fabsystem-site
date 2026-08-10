# PHASE-4.7.1-RAPPORT — Circuit Engine (correction de responsabilité)

**Date : 20/08/2026**
**Périmètre : correction ciblée d'une seule responsabilité mal placée dans le Circuit Engine (Phase 4.7). Aucun nouveau calcul électrique, aucune interface, aucun autre moteur ni le socle (`EngineRunner`, `Registry`) touché.**

---

# Constat corrigé

En Phase 4.7, `CircuitDefinitionInput` demandait à l'appelant de fournir lui-même un **identifiant technique** (`id: string`) en plus du nom, du type et des consommateurs à regrouper. Cela obligeait tout appelant externe (futur Assistant Circuit, script d'import, test) à inventer et maintenir un identifiant stable pour chaque circuit — une responsabilité qui appartient naturellement au moteur chargé de « construire le modèle logique des circuits », pas à celui qui se contente de décrire un regroupement de consommateurs.

**Correction** : le Circuit Engine dérive désormais lui-même l'identifiant de chaque circuit à partir de son nom. L'appelant ne fournit plus que les données réellement nécessaires au regroupement.

```diff
 export type CircuitDefinitionInput = {
-  /** Identifiant stable du circuit, fourni par l'appelant. */
-  id: string;
   name: string;
   circuitType?: string;
   consumerNames: string[];
 };
```

`CircuitComputation.id` (la sortie) est inchangé dans sa forme — toujours une chaîne stable — seule sa **provenance** change : produit par le moteur, jamais recopié depuis l'entrée.

---

# Mécanisme de dérivation

Nouvelle fonction pure `deriveCircuitId(name)` : normalise le nom (suppression des accents via `NFD` + retrait des marques diacritiques, minuscules, séparateurs normalisés en tirets, tirets de bord retirés). Déterministe, sans aléatoire ni horodatage — un même nom produit toujours le même identifiant, ce qui préserve la testabilité et la reproductibilité déjà exigées de tous les moteurs.

Exemples vérifiés par test : `"Circuit frigo"` → `"circuit-frigo"`, `"Éclairage Général"` → `"eclairage-general"`.

**Nouvelle validation** : si le nom ne contient aucun caractère alphanumérique exploitable (ex. `"!!!"`), l'identifiant dérivé serait vide — `ValidationError` (`CIRCUIT_INVALID_VALUE`) plutôt qu'une clé de valeur retenue invalide (`circuit.`).

**Détection des doublons inchangée dans son principe, adaptée à sa source** : `CIRCUIT_DUPLICATE_ID` se déclenche toujours de la même façon (deux circuits ne peuvent pas partager le même identifiant), mais la cause désormais possible est différente — deux noms distincts qui se réduisent au même identifiant (ex. `"Circuit A"` et `"circuit a"`) déclenchent la même erreur qu'auparavant deux `id` identiques fournis par erreur.

---

# Ce qui n'a pas changé

- **Toutes les autres responsabilités du moteur** : lecture exclusive de `energy.consumers` via `EngineContext`, aucun appel à un autre moteur, aucun recalcul d'énergie, aucun calcul de câble/protection/schéma.
- **Le format de sortie** (`CircuitComputation`) : mêmes sept champs, mêmes règles de nullabilité (`cumulatedCurrentA` nullable, `voltageV` jamais nullable).
- **Toutes les catégories de validation** : consommateur absent, circuit vide, données incohérentes (double affectation), tension incompatible, calcul impossible (tension indéterminée) — inchangées dans leur déclenchement et leurs codes.
- **Les valeurs retenues** : toujours une clé `circuit.<id>` par circuit (l'identifiant change de source, pas la convention de clé).
- **Les dépendances** : toujours une arête `circuit.<id> → energy.consumers` par circuit.
- **`EngineRunner`, `Registry`, les six autres moteurs** : aucun fichier touché (vérifié par `git diff --stat`).

---

# Fichiers modifiés

| Fichier | Nature |
|---|---|
| `lib/engines/circuit-engine.ts` | Retrait de `id` de `CircuitDefinitionInput` ; ajout de `deriveCircuitId` ; `validateCircuitDefinitions` calcule et valide désormais l'identifiant de chaque circuit (au lieu de valider un identifiant fourni) et le retourne avec chaque définition résolue. |
| `tests/circuit-engine.test.ts` | Fixtures et assertions mises à jour pour ne plus fournir d'`id` et vérifier l'identifiant dérivé ; deux tests ajoutés (dérivation avec accents/casse, nom sans caractère exploitable). |
| `tests/circuit-engine-runner.test.ts` | Mêmes définitions de circuits mises à jour (suppression de `id`), clés de valeurs retenues et de dépendances attendues alignées sur les identifiants désormais dérivés (`circuit.frigo`, `circuit.pompe`). |

Aucun autre fichier du dépôt n'a été modifié.

---

# Tests

Les scénarios existants sont intégralement conservés — seule la construction des fixtures d'entrée a été adaptée au nouveau contrat (mécanique, aucune assertion de comportement supprimée). Deux tests ajoutés, ciblant spécifiquement la nouvelle responsabilité :

- « l'identifiant dérivé ignore la casse et les accents »
- « nom de circuit sans caractère alphanumérique : ValidationError »

## Résultat global

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 762 / # pass 762 / # fail 0   (760 précédents + 2 nouveaux)
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

---

# Compatibilité

- **Aucun autre moteur, `EngineRunner` ou `Registry` modifié** (vérifié par `git diff --stat` sur les six autres moteurs et le socle).
- **Aucune migration Prisma, aucun calcul électrique ajouté.**
- **Rupture de contrat assumée et volontaire** sur `CircuitDefinitionInput` (retrait du champ `id`) : c'est l'objet même de cette correction, demandée explicitement par la mission. Aucun code applicatif existant ne consommait encore ce moteur (aucune interface, aucun autre moteur ne l'appelle), donc aucun appelant réel n'est impacté au-delà des fichiers de test mis à jour dans cette même phase.
- **Build et tests intégralement au vert.**

---

# Fin — PHASE-4.7.1-RAPPORT / FabSystem
