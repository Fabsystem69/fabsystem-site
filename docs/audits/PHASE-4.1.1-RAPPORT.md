# PHASE-4.1.1-RAPPORT — Micro-correction Energy Engine

**Date : 12/08/2026**
**Périmètre : extraction de la tolérance numérique codée en dur (1 %) vers une constante commune. Aucune formule, aucune validation, aucun test métier, aucun comportement modifié.**

---

# Fichiers modifiés

| Fichier | Nature |
|---|---|
| `lib/engines/constants.ts` | **Nouveau.** Constante commune `DEFAULT_FLOAT_TOLERANCE_RATIO`. |
| `lib/engines/energy-engine.ts` | Import de la constante commune ; suppression de la constante locale `POWER_CONSISTENCY_TOLERANCE_RATIO` ; unique site d'usage mis à jour pour référencer la constante importée. |

Aucun autre fichier touché. `EngineRunner`, `BaseEngine`, `Registry`, `Project`, et tout module hors `lib/engines/` : non modifiés.

---

# Constante créée

```ts
// lib/engines/constants.ts
export const DEFAULT_FLOAT_TOLERANCE_RATIO = 0.01;
```

Placée dans un nouveau fichier `lib/engines/constants.ts` plutôt que conservée localement dans `energy-engine.ts` : la mission demandait une constante **commune**, réutilisable par de futurs moteurs (Batterie, Solaire, Section...) qui auront eux aussi besoin de comparer deux grandeurs calculées par des voies différentes. Le fichier ne contient et ne doit contenir aucune règle métier — uniquement des tolérances numériques génériques, cohérent avec l'esprit du socle de la Phase 4.0 (`lib/engines/` = infrastructure partagée).

Le nom reprend l'exemple `DEFAULT_FLOAT_TOLERANCE` suggéré par la mission (adapté en `DEFAULT_FLOAT_TOLERANCE_RATIO` pour préciser qu'il s'agit d'un ratio relatif, comme documenté dans le commentaire d'origine du Phase-4.1-Rapport : « Arbitrage nécessaire #1 »).

---

# Occurrences remplacées

Une seule occurrence existait, à l'endroit exact identifié par le rapport Phase 4.1 (« Arbitrages nécessaires », point 1) :

```diff
- const POWER_CONSISTENCY_TOLERANCE_RATIO = 0.01;
+ import { DEFAULT_FLOAT_TOLERANCE_RATIO } from "@/lib/engines/constants";
  ...
- if (referenceW > 0 && deltaW / referenceW > POWER_CONSISTENCY_TOLERANCE_RATIO) {
+ if (referenceW > 0 && deltaW / referenceW > DEFAULT_FLOAT_TOLERANCE_RATIO) {
```

Recherche exhaustive confirmée (`grep -rn "0.01\|POWER_CONSISTENCY_TOLERANCE_RATIO"` sur `lib/engines/`) : aucune autre occurrence du nombre `0.01` ni de l'ancien nom de constante ne subsiste dans le dépôt.

---

# Vérification de l'absence de changement fonctionnel

- **Valeur numérique strictement identique** : `0.01` avant et après, seule son adresse (nom + emplacement) a changé.
- **Formule de comparaison inchangée** : `deltaW / referenceW > tolérance`, ligne pour ligne identique.
- **Aucune formule de calcul touchée** : `computeEnergyEngineOutput`, `resolveConsumer`, `resolveSystemVoltage`, `assertFiniteNonNegative` — tous inchangés caractère pour caractère en dehors de ce seul remplacement.
- **Aucune validation ajoutée ou retirée** : les quatre catégories d'erreurs (donnée manquante, valeur invalide, unité incohérente, calcul impossible) déclenchent exactement dans les mêmes conditions qu'avant.
- **Aucun test modifié** : les 38 tests de la Phase 4.1 (`tests/energy-engine.test.ts`, `tests/energy-engine-runner.test.ts`) sont restés inchangés et passent tous sans adaptation — notamment le test `puissance et courant cohérents à l'arrondi près : aucune erreur` (60,3 W pour 5 A × 12 V), qui exerce directement cette tolérance et confirme le comportement identique.

---

# Résultat des tests

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 559 / # pass 559 / # fail 0   (identique à la Phase 4.1)
npm run build             → succès (prisma generate && next build --webpack)
```

`npm run lint` reste indisponible pour la même cause préexistante que les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

**Critères de sortie** : ✅ aucune différence fonctionnelle · ✅ une constante unique remplace le nombre magique · ✅ aucun MASTER contredit (MASTER-00, MASTER-10 relus ; migration/comportement de production non touchés) · ✅ Build OK · ✅ Tests OK.

---

# Fin — PHASE-4.1.1-RAPPORT / FabSystem
