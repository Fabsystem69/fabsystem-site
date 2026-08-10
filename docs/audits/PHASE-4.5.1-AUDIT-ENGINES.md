# PHASE-4.5.1 — Audit transversal des Engines

**Date : 16/08/2026**
**Nature : audit d'architecture uniquement. Aucune ligne de code modifiée, aucun refactoring, aucun commit.**
**Périmètre audité : `lib/engines/{types,errors,context,runner,registry,constants}.ts` (Phase 4.0) et `lib/engines/{energy,battery,alternator,solar,charger}-engine.ts` (Phases 4.1 à 4.5), plus les six rapports de phase associés.**

---

# Résumé

Le socle des moteurs métier (Phase 4.0) et les cinq premiers moteurs (Energy, Battery, Alternator, Solar, Charger) forment un ensemble cohérent, testé (691 tests, tous verts), et conforme à MASTER-06/MASTER-10/MASTER-11 sur l'essentiel : aucun moteur n'écrit directement dans Project, la distinction simulation/valeur retenue est structurellement possible, les dépendances sont explicites, et les erreurs utilisent exclusivement la hiérarchie `EngineError`.

Deux constats dominent cet audit :

1. **Une duplication de code significative et bien identifiée** (quatre à cinq fonctions utilitaires quasi identiques répétées dans 3 à 4 fichiers), directement causée par la contrainte « ne pas modifier les moteurs précédents » imposée à chaque phase — un compromis délibéré et documenté phase après phase, arrivé au point où une consolidation devient rentable.
2. **Un gap architectural réel, non cosmétique** : le graphe de dépendances construit par les cinq moteurs (Phase 3 : `ProjectValueDependency`) n'est actuellement **jamais lu** par `EngineRunner`. Rien ne déclenche `markDependentsObsolete` lorsqu'un moteur amont recalcule. Le mécanisme d'obsolescence qui doit un jour alimenter Volta (MASTER-07) est donc écrit mais pas encore branché.

Aucun de ces points ne remet en cause la production actuelle (rien n'est en production) ni les cinq moteurs livrés, qui fonctionnent correctement et sont exhaustivement testés. Ce sont des points à trancher **avant** d'ajouter un sixième moteur ou d'entamer Volta.

---

# Points excellents

- **Discipline d'isolation totale respectée sur cinq phases consécutives.** Aucun des cinq moteurs n'importe le code d'un autre moteur (vérifié par recherche à chaque phase et reconfirmé ici) : le couplage est exclusivement par la donnée persistée (`ProjectRetainedValue`), jamais par le code. C'est exactement l'architecture visée par MASTER-11 §28.
- **Convention de traçabilité des formules exemplaire.** Les cinq moteurs suivent scrupuleusement le même patron : un commentaire `// Formule N — <nom> : <explication>` suivi de l'expression littérale en commentaire, directement au-dessus de la ligne de code. Aucune formule « cachée » n'a été trouvée ; chaque nombre magique potentiel (`24`, `0.01`, `1`) est justifié en commentaire.
- **Convention de nommage des codes d'erreur de dépendance parfaitement homogène**, apparue spontanément sans qu'aucune phase ne l'impose explicitement : `ENERGY_DATA_MISSING` / `_OBSOLETE` / `_INVALID_SHAPE` / `_INCOMPLETE` et `BATTERY_DATA_MISSING` / `_OBSOLETE` / `_INVALID_SHAPE` sont repris **mot pour mot** par Battery, Alternator, Solar et Charger. C'est la meilleure preuve que le style engagé en Phase 4.2 était le bon.
- **`EngineRunner` n'a jamais eu besoin d'être modifié** en cinq phases, malgré des domaines très différents (un moteur auto-suffisant, un moteur à une dépendance, trois moteurs à deux dépendances). C'est une validation forte du découpage retenu en Phase 4.0 : le contrat (préparer le contexte, appeler, persister) était complet dès le départ.
- **Aucune donnée métier ni coefficient réellement inventé.** Recherche systématique des littéraux numériques dans les cinq moteurs : seuls apparaissent `24` (contrainte dimensionnelle, un jour a 24h), `1` (élément neutre d'un facteur optionnel via `?? 1`) et `0.01` (tolérance d'arrondi, extraite en constante commune dès la Phase 4.1.1). Rien d'autre.
- **Le graphe de dépendances est vérifié par des tests dédiés « exact »** sur les trois derniers moteurs (Alternator, Solar, Charger), une discipline montante et positive — les moteurs les plus récents sont les mieux couverts sur ce point précis.
- **Séparation fonction pure / fabrique `BaseEngine` strictement respectée** dans les cinq moteurs, permettant des tests unitaires sans base de données ni `EngineContext` pour la totalité de la logique de calcul.

---

# Points perfectibles

- **Duplication de helpers techniques non consolidée** entre moteurs (détail en section Duplications) — attendu compte tenu de la contrainte de non-modification, mais désormais mûr pour une consolidation.
- **`run()` synchrone pour Energy Engine, asynchrone pour les quatre autres.** `EnergyEngine.run()` est la seule implémentation non-`async` (elle ne lit aucune dépendance via `EngineContext`), ce qui est valide au regard du contrat `BaseEngine` (`Promise<EngineResult<T>> | EngineResult<T>`) mais introduit une hétérogénéité de signature visible pour quiconque compare les cinq fichiers.
- **`computeEnergyEngineOutput` retourne `{ output, errors }`, les quatre autres fonctions pures retournent directement l'objet de sortie.** Conséquence directe et cohérente du modèle de dégradation partielle propre à l'Energy Engine (seul moteur à utiliser le canal `result.errors` non bloquant), mais cela signifie que la signature des fonctions `compute<X>EngineOutput` n'est pas uniforme dans l'absolu.
- **Constante dimensionnelle « 24 heures » non centralisée** : extraite en constante nommée uniquement dans `energy-engine.ts` (`MAX_DAILY_USAGE_HOURS`), inlinée en littéral `24` dans `alternator-engine.ts`, `solar-engine.ts` et `charger-engine.ts`. Un candidat évident pour rejoindre `lib/engines/constants.ts`, resté en dehors de la Phase 4.1.1 qui n'a traité que la tolérance flottante.

---

# Incohérences

## 1. Quatre conventions différentes de gestion de la tension système (la plus significative)

| Moteur | Paramètre tension | Comparaison à `Project.voltage` | Comportement si inconnue |
|---|---|---|---|
| Energy | `voltageV` optionnel **par consommateur**, repli sur `Project.voltage` | Oui, si le consommateur en déclare une explicitement → `ValidationError` bloquante (`CONSUMER_VOLTAGE_MISMATCH`) | Grandeur non dérivable → `CalculationError` **non bloquante** (canal `errors`) |
| Battery | `systemVoltageV` **obligatoire** | Oui, systématique → `ValidationError` bloquante (`BATTERY_VOLTAGE_INCOMPATIBLE`) | N/A (le paramètre est obligatoire) |
| Alternator | Aucun paramètre, lit `Project.voltage` directement | N/A (pas de paramètre à comparer) | `Project.voltage = UNKNOWN` → `CalculationError` bloquante (`ALTERNATOR_VOLTAGE_UNKNOWN`) |
| Solar | Aucun paramètre, lit `Project.voltage` directement | N/A | `Project.voltage = UNKNOWN` → `CalculationError` bloquante (`SOLAR_VOLTAGE_UNKNOWN`) |
| Charger | `outputVoltageV` **obligatoire** | **Non, jamais comparé** à `Project.voltage` | N/A (le paramètre est obligatoire, jamais recoupé) |

Cinq moteurs, quatre philosophies différentes pour la même question physique (« quelle tension utiliser, et que faire si elle diverge de celle du Project »). Chaque choix est individuellement documenté et justifié dans son propre rapport de phase, mais l'ensemble n'a jamais été comparé transversalement avant cet audit. C'est l'incohérence la plus visible de l'ensemble et celle qui mérite le plus clairement une décision de convention unique avant le prochain moteur.

## 2. Deux conventions différentes pour le graphe de dépendances

- **Battery Engine (Phase 4.2)** : convention « large » — chaque valeur retenue déclare une dépendance vers **toutes** les clés `energy.*` effectivement lues par le moteur, y compris celles qui ne servent qu'à une vérification de complétude et n'entrent dans aucune formule de cette valeur précise. Résultat : 4 clés × 2 sources = 8 arêtes.
- **Alternator, Solar, Charger (Phases 4.3-4.5)** : convention « stricte » — une arête n'existe que si la formule produisant cette clé utilise **numériquement** la source visée. Résultat : 2 arêtes par moteur, quel que soit le nombre de clés produites (4 ou 5).

Ce changement de convention est explicitement documenté comme un choix délibéré dans le rapport de Phase 4.3 (motivé par l'exigence de « graphe exact » introduite à partir de cette phase), mais le Battery Engine n'a pas pu être aligné rétroactivement (contrainte de non-modification de cette même phase). Le graphe de dépendances de `battery.*` est donc aujourd'hui plus « bruyant » (moins précis) que celui de `alternator.*`/`solar.*`/`charger.*`, sans que rien dans le code ne signale cette différence à un lecteur qui ne connaîtrait pas l'historique des phases.

## 3. Deux représentations différentes pour « le moteur couvre-t-il le besoin ? »

- **Alternator Engine** : `alternator.rechargeMargin` — un delta signé en **Wh** (`rechargeableEnergyWh − dailyWh`), positif = surplus, négatif = déficit.
- **Solar Engine** et **Charger Engine** : `solar.coverage` / `charger.coverage` — un **ratio** sans dimension (`énergie produite / dailyWh`), 1 = couverture exacte.

Les trois moteurs répondent à la même question conceptuelle (« la source de recharge suffit-elle au besoin journalier ? ») avec deux formats de sortie incompatibles entre eux. Un futur moteur agrégateur (« Global Energy Balance », voir section 10) devra reconvertir l'un vers l'autre pour les comparer ou les additionner, ce qui n'est pas trivial sans redescendre aux grandeurs `energy.dailyConsumption`/`XXX.rechargeableEnergy` sous-jacentes.

## 4. Ambiguïté du préfixe `BATTERY_` dans les codes d'erreur

Le préfixe `BATTERY_` recouvre deux significations distinctes selon le moteur qui l'émet :
- Dans `battery-engine.ts` : `BATTERY_PARAMETER_MISSING`, `BATTERY_DOD_INVALID`, `BATTERY_VOLTAGE_INCOMPATIBLE` — des erreurs sur les **paramètres propres** du Battery Engine.
- Dans `alternator-engine.ts`, `solar-engine.ts`, `charger-engine.ts` : `BATTERY_DATA_MISSING`, `BATTERY_DATA_OBSOLETE`, `BATTERY_DATA_INVALID_SHAPE` — des erreurs sur la **dépendance** `battery.usefulCapacity` lue depuis un autre moteur.

Les deux familles ne se recouvrent jamais en pratique (les codes complets sont distincts : `BATTERY_PARAMETER_*` vs `BATTERY_DATA_*`), donc ce n'est pas un bug, mais un lecteur qui ne filtre que sur le préfixe `BATTERY_` sans lire le mot suivant peut se méprendre sur l'origine de l'erreur (paramètre du moteur courant, ou donnée d'un moteur amont).

## 5. `simulatedValue` toujours égal à `value`, sur les cinq moteurs sans exception

Le socle de la Phase 4.0 a été conçu pour porter la distinction simulation ≠ décision (MASTER-06 §25-26) jusque dans `EngineRetainedValueProposal.simulatedValue`. En pratique, **les cinq moteurs livrés à ce jour fixent systématiquement `simulatedValue = value`** — aucun n'exploite la distinction. Ce n'est pas une erreur d'implémentation (chaque moteur a été construit pour proposer un calcul fraîchement effectué, sans notion de « proposition non retenue » à ce stade), mais c'est un renoncement de fait, répété cinq fois, à un mécanisme que le framework rend pourtant possible. Voir section Risques.

---

# Duplications

Quatre fonctions utilitaires quasi identiques, dupliquées à l'identique dans plusieurs fichiers, toutes causées par la contrainte explicite « ne pas modifier les moteurs précédents » imposée à chaque phase (documentée à chaque fois comme un compromis assumé) :

| Fonction | Rôle | Copies identiques | Fichiers |
|---|---|---|---|
| `resolveSystemVoltage` / `resolveProjectVoltage` | `V12`→12, `V24`→24, `UNKNOWN`→`null` | **4** | energy, battery, alternator, solar |
| `hasNumberField` / `hasBooleanField` | Garde de forme sur un `Json` non typé lu depuis `ProjectRetainedValue.value` | **4** | battery, alternator, solar, charger |
| `readRetainedValue` (alias `readEnergyValue` dans battery) | Lecture d'une valeur retenue via `EngineContext`, `DependencyError` si absente/obsolète | **4** | battery, alternator, solar, charger |
| `assertFiniteNumber` / `assertRequired` | Validation générique d'un paramètre scalaire | **4** | battery, alternator, solar, charger |

Deux fonctions de parsing spécifiques à une clé, dupliquées partiellement (même shape, répétées sous des noms identiques) :

| Fonction | Copies | Fichiers |
|---|---|---|
| `parseEnergyDailyConsumption` | **4** | battery, alternator, solar, charger |
| `parseBatteryUsefulCapacity` (ou équivalent nommé différemment) | **3** | alternator, solar, charger |

Une fonction non dupliquée mais généralisable : `toResultError` (Energy Engine uniquement) — sérialise une instance `EngineError` vers `EngineResultError` pour le canal non bloquant. Aujourd'hui à usage unique, elle deviendrait utile à tout futur moteur souhaitant un canal d'erreurs non bloquant similaire à celui d'Energy Engine.

**Non identifié comme duplication problématique** : chaque moteur définit son propre `<X>EngineInput`/`<X>EngineOutput`/`validateParameters` — c'est attendu et sain, ces types sont spécifiques au domaine et ne devraient pas être partagés.

---

# Conventions à figer

Sur la base des incohérences relevées, les conventions suivantes mériteraient d'être explicitement actées (dans un document ou en tête de `lib/engines/`) avant le prochain moteur, **sans qu'aucune ne soit appliquée dans le cadre de cet audit** :

1. **Tension système** : choisir une politique unique parmi les quatre observées. Recommandation de discussion (non tranchée ici) : les moteurs qui ne possèdent pas leur propre notion physique de tension (Alternator, Solar) devraient continuer à lire `Project.voltage` ; les moteurs qui manipulent un équipement ayant sa propre tension nominale (Battery, Charger) devraient systématiquement comparer leur paramètre à `Project.voltage` quand elle est connue, avec un code d'erreur nommé de façon homogène (`<DOMAIN>_VOLTAGE_INCOMPATIBLE`).
2. **Représentation « couverture du besoin »** : choisir entre le ratio (Solar/Charger) et la marge signée (Alternator) comme convention unique pour tout futur moteur de recharge, ou documenter explicitement que les deux coexistent et que la conversion est à la charge de l'appelant.
3. **Granularité du graphe de dépendances** : acter formellement la convention « stricte » (Alternator/Solar/Charger) comme référence pour tout futur moteur, et noter explicitement dans la documentation du Battery Engine que son graphe suit une convention antérieure plus large, pour éviter toute confusion lors d'une future lecture du graphe par un outil ou par Volta.
4. **Préfixes de code d'erreur** : formaliser par écrit la distinction déjà appliquée dans les faits — `<DOMAIN>_PARAMETER_*` (ou variantes `<DOMAIN>_<CHAMP>_INVALID`) pour les erreurs sur les paramètres propres d'un moteur, `<SOURCE_DOMAIN>_DATA_*` pour les erreurs de dépendance vers un autre moteur — et l'exception assumée du préfixe `CONSUMER_*` d'Energy Engine.
5. **Constante dimensionnelle 24h** : centraliser dans `lib/engines/constants.ts` au même titre que `DEFAULT_FLOAT_TOLERANCE_RATIO`.

---

# Évolutions recommandées

*(Décrites à titre d'analyse uniquement — aucune implémentation dans cette phase.)*

- Extraire les quatre helpers dupliqués (voir section Duplications) vers des modules partagés du socle, par exemple :
  - `lib/engines/shape-guards.ts` (`hasNumberField`, `hasBooleanField`, et les parseurs de clés bien connues `energy.dailyConsumption`/`battery.usefulCapacity`)
  - `lib/engines/dependency-reader.ts` ou extension de `context.ts` (`readRetainedValue` générique, avec les codes `DependencyError` déjà standardisés)
  - `lib/engines/validation.ts` (`assertFiniteNumber`, `assertRequired`, et pourquoi pas `assertPositive`/`assertWithinRange` génériques pour absorber les motifs `<= 0` et `hors de (0,1]` répétés dans les cinq moteurs)
  - Déplacer `resolveProjectVoltage` vers `lib/engines/context.ts` ou `constants.ts`, et `toResultError` vers `errors.ts`
- Ne procéder à cette extraction **qu'après** avoir figé les conventions ci-dessus, pour éviter d'industrialiser une incohérence (ex. extraire un `readRetainedValue` unique sans avoir d'abord tranché la question de la tension figerait la divergence Battery/Alternator-Solar-Charger dans un module partagé).
- Envisager que cette consolidation se fasse dans une phase dédiée de type « 4.5.2 — Consolidation du socle partagé », strictement postérieure à cet audit, avec la même discipline de tests de non-régression déjà en place (691 tests).

---

# Dette technique

1. **Graphe de dépendances non exploité** (détaillé en Risques) : c'est la dette la plus significative, car elle concerne le comportement fonctionnel futur (Volta), pas seulement la forme du code.
2. **`simulatedValue` toujours égal à `value`** sur les cinq moteurs : le mécanisme de distinction simulation/décision existe dans le type mais n'est concrètement exercé nulle part — une dette conceptuelle plus qu'un bug, à lever le jour où un premier moteur (ou l'application appelante) aura réellement besoin de proposer une simulation sans la retenir.
3. **Duplication des quatre helpers** (voir Duplications) : dette de maintenabilité pure — chaque correction de bug dans `hasNumberField` ou `resolveProjectVoltage`, par exemple, devrait aujourd'hui être répliquée manuellement dans 3 à 4 fichiers.
4. **Constante `24` non centralisée** : mineure, mais du même ordre que ce que la Phase 4.1.1 a déjà corrigé pour la tolérance flottante — un point resté hors du périmètre de cette micro-correction.
5. **`EngineRunner` sans transaction** : les écritures `retainValue`/`declareDependency` d'un même run sont indépendantes ; un échec partiel après quelques écritures ne les annule pas. Non bloquant pour la présente V1 (chaque `retainValue`/`declareDependency` est individuellement idempotent), mais à surveiller si un futur moteur produit un nombre important de valeurs/dépendances où une cohérence tout-ou-rien deviendrait nécessaire.

---

# Risques

- **Risque principal — Volta ne pourra pas fonctionner tel quel.** MASTER-07 (suivi automatique, cité par MASTER-11 §41 : `derivedIssues`) repose sur le principe « cause présente → alerte visible, cause corrigée → alerte disparaît », ce qui suppose que la modification d'une valeur retenue amont propage effectivement une obsolescence vers les valeurs avales. Aujourd'hui : `EngineRunner` ne fait **aucun appel** à `markDependentsObsolete` (Phase 3, `lib/services/project-dependencies.ts`) après un run. Le graphe de dépendances est donc actuellement **construit mais jamais consulté** : relancer l'Energy Engine avec des consommateurs différents ne marquera **pas** automatiquement `battery.*`, `alternator.*`, `solar.*`, `charger.*` comme obsolètes, même si leurs valeurs sont désormais fondées sur des chiffres périmés. C'est un vrai risque de donnée silencieusement incohérente une fois plusieurs moteurs enchaînés en usage réel, et un blocage direct pour construire Volta sans combler ce point d'abord.
- **Risque secondaire — absence de mode « simulation seule ».** Tant que `simulatedValue = value` systématiquement et que rien ne distingue un appel « aperçu » d'un appel « décision retenue », toute invocation de `EngineRunner.run()` persiste inconditionnellement. Un futur écran qui afficherait un résultat en aperçu avant validation utilisateur devra soit contourner `EngineRunner` (perdant la persistance automatique), soit accepter que chaque calcul affiché soit immédiatement retenu — ce qui contredirait MASTER-06 §25-26 si l'appelant n'y prend pas garde. Le risque n'est pas dans le framework lui-même (qui reste correct), mais dans l'usage qu'en feront les futurs appelants sans garde-fou explicite.
- **Risque mineur — confusion d'incident lors d'un futur débogage.** La divergence de convention de dépendances (Battery « large » vs les trois autres « strictes ») pourrait surprendre quelqu'un qui inspecterait le graphe de `battery.*` en production en s'attendant à une exactitude uniforme.

---

# Recommandations avant la suite

1. **Trancher la question de l'obsolescence avant tout nouveau moteur ou avant Volta.** Décider explicitement si `EngineRunner` doit appeler `markDependentsObsolete` après persistance (et selon quelle granularité — par clé modifiée, ou par moteur entier), ou si cette responsabilité doit rester hors du Runner (par exemple portée par un futur orchestrateur multi-moteurs). Ce n'est pas une simple préférence de style : c'est une dépendance dure de MASTER-07.
2. **Figer les cinq conventions listées ci-dessus** (tension, couverture, granularité de dépendance, préfixes d'erreur, constante 24h) dans un court document de référence avant d'écrire un sixième moteur, pour que celui-ci les suive dès l'origine plutôt que d'ajouter une cinquième variante.
3. **Reporter la consolidation des helpers dupliqués** à une phase dédiée, après le point 2 — extraire maintenant figerait des divergences pas encore tranchées.
4. **Ne pas construire Cable Engine / Protection Engine avant d'avoir décidé du modèle de scoping par Circuit.** `EngineContext` et `ProjectRetainedValue` sont aujourd'hui strictement scopés au Project ; MASTER-06 §39 place Circuits à un niveau de granularité inférieur, non encore modélisé (pas de `Circuit` en base). Une décision de modélisation est nécessaire avant ces deux moteurs, indépendamment du framework Phase 4.0 qui, lui, n'a pas besoin de changer.
5. **Documenter formellement le canal `EngineResult.errors`** (aujourd'hui utilisé uniquement par Energy Engine) comme un mécanisme optionnel réservé aux moteurs multi-éléments avec dégradation partielle légitime — pour éviter qu'un futur moteur agrégé unique (comme Battery/Alternator/Solar/Charger) ne l'utilise à tort là où un rejet bloquant est plus sûr.

---

# Décision finale

**L'architecture du socle des moteurs (Phase 4.0) est validée et n'a besoin d'aucune modification.** Elle a démontré sa suffisance sur cinq domaines métier différents sans jamais devoir être étendue.

**Les cinq moteurs livrés sont fonctionnellement corrects, isolés, testés et conformes aux MASTER** sur les points vérifiés par cet audit — aucune anomalie fonctionnelle n'a été trouvée dans les calculs eux-mêmes.

**Il n'est pas recommandé d'enchaîner immédiatement sur un sixième moteur (Cable, Protection) ni sur Volta sans arbitrage préalable** sur : (a) le branchement de l'obsolescence des dépendances à `EngineRunner`, condition bloquante pour Volta ; (b) les cinq conventions transversales non encore figées, pour éviter d'ajouter une nouvelle variante à chaque phase future ; (c) le modèle de scoping par Circuit, nécessaire avant Cable/Protection.

Une consolidation des duplications identifiées est recommandée mais **non urgente** : elle peut attendre que les conventions soient tranchées, pour ne pas figer une incohérence dans un module partagé.

---

# Fin — PHASE-4.5.1-AUDIT-ENGINES / FabSystem
