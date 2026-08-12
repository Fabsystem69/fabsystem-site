# UI-13 — Project guidé débutant + pont Outils → Project

Mission d'évolution produit (pas un polish UI). Exécutée en un seul bloc, sans repasser par validation intermédiaire, sur demande explicite de l'utilisateur après exposition des directives (audit d'abord, puis implémentation phasée : pont Outils→Project, mode Guidé/Avancé, lien retour). Aucun commit pendant le travail.

## Résumé

- **Audit d'architecture réalisé avant tout code** (2 agents en parallèle, lecture seule) : a révélé un fait structurant qui change la portée honnête de la mission — les 5 outils publics n'appellent aujourd'hui **aucun moteur backend** ; ils dupliquent déjà leur propre logique en JS côté client, avec des constantes parfois différentes (DOD 50 % figé, marge MPPT 25 % figée). Voir "Mapping outils → moteurs" ci-dessous.
- **Mode Guidé / Mode Avancé** : implémenté sur le même Project, mêmes données, aucune duplication. Choix au premier accès, réversible à tout moment (`ModeSwitch`), persistance en `localStorage` (pas de migration Prisma). Vérifié en vrai : basculer de Guidé vers Avancé affiche instantanément les mêmes valeurs retenues.
- **Parcours guidé** en 6 étapes (Installation, Besoins, Batterie, Recharge, Distribution, Schéma), avec branchement conditionnel réel sur la Recharge (Alternateur/Solaire/Prise 230V, un module ne s'affiche que si sélectionné) et sur la Distribution (Câbles/Protections n'apparaissent qu'une fois un circuit retenu). Chaque étape réutilise **exactement** les composants moteur existants (`EnergyModule`, `BatteryModule`...) — aucune formule dupliquée, vérifié par test de régression sur le code source (aucun `fetch()` dans `GuidedProjectFlow.tsx`).
- **Pont Outils → Project réel** pour les 2 seuls outils où une correspondance honnête existe : **Bilan de consommation → Energy** et **Section de câble → Circuit/Cable**. Flux complet vérifié en vrai navigateur : calcul → clic → choix de projet (création si aucun) → aperçu (calcul réel en preview) → détection de conflit → remplacement explicite → propagation d'obsolescence via le mécanisme existant, intact.
- **Autonomie batterie et MPPT** : aucun import automatique (mission §17, "ne pas inventer une correspondance" — l'audit confirme qu'aucune ne serait honnête). CTA "Continuer dans mon projet" sans transfert de données.
- **Utilisateur non connecté** : le calcul est conservé en `localStorage`, proposé à nouveau via un bandeau sur `/mon-compte` après connexion — sans toucher à la chaîne d'authentification magic link (arbitrage détaillé plus bas).
- **Tests** : 27 nouveaux tests (898/898 verts), `tsc`/`build` propres.

## Architecture existante (audit préalable)

Résultat complet des 2 agents d'audit (résumé) :

- **`Project` / `ProjectRetainedValue` / `ProjectValueDependency`** : aucun champ "mode" n'existe. `ProjectRetainedValue.source` existe déjà (traçabilité partielle) mais pas les paramètres d'entrée bruts.
- **`EngineRunner`** (`lib/engines/runner.ts`) : preview (`retain:false`) n'appelle jamais le runner — appel direct `engine.run()`, rien n'est persisté. Retain (`retain:true`) persiste toujours ce que le moteur propose, compare via `hasValueChanged`, propage l'obsolescence via `markDependentsObsolete`, et re-persiste les clés obsolétées appartenant au même run.
- **Quota** : `STANDARD_PROJECT_LIMIT = 3` (`lib/services/project.ts`), appliqué dans `createProject`, renvoie un 409 (`conflict()`).
- **Session client / magic link** : cookie `fabsystem_customer_session`, `SUCCESS_REDIRECT_PATH` codé en dur à `/mon-compte` dans `app/api/client-auth/verify/route.ts`. **Aucun mécanisme `returnTo`** pour ce flux (contrairement à la session admin interne, `lib/require-session.ts`, qui en a un mais qui est un système entièrement différent).
- **`localStorage`/`sessionStorage`** déjà utilisés ailleurs dans le repo (bilan conso, quiz Les Bases, panier prestations) — jamais pour Project.

## Mapping outils → moteurs

Constat central de l'audit, qui a directement dimensionné le périmètre réel du pont :

| Outil public | Moteur visé | Verdict |
|---|---|---|
| Bilan de consommation | `energy.consumption` | **Mapping honnête possible.** Champs renommables 1:1 (`nom→name`, `puissance→powerW`, `heures→dailyUsageHours`), même unités. |
| Section de câble | `circuit.structure` + `cable.sizing` | **Mapping honnête possible**, mais avec une vraie dépendance : `cable.sizing` exige un circuit déjà retenu, lui-même dépendant de `energy.consumers` déjà retenu (`lib/engines/circuit-engine.ts` lève une `DependencyError` sinon). Le pont doit donc parfois créer un circuit, parfois refuser proprement. |
| Autonomie batterie | `battery.sizing` | **Aucun mapping honnête.** Logique inversée : l'outil part d'une capacité connue pour donner une autonomie ; le moteur part d'une autonomie désirée pour donner une capacité. L'outil mélange en plus batterie et solaire dans un seul écran. Champ `état de charge` sans équivalent moteur. |
| MPPT | `solar.production` / `charger.recharging` | **Aucun mapping honnête.** Domaines différents : l'outil dimensionne un régulateur (Voc/Vmp/courant de sortie), le moteur estime une production énergétique (Wh/j, taux de couverture). Aucun moteur de dimensionnement de régulateur n'existe dans `lib/engines/`. |
| AWG ↔ mm² | — | Utilitaire de conversion pur, aucun moteur correspondant (conforme à la mission, qui prévoit ce cas par défaut). |

Conséquence directe : le pont réel (import automatique avec aperçu/conflit) n'a été construit que pour les 2 premiers. Les 2 autres reçoivent un CTA "Continuer dans mon projet" sans transfert de données, avec une explication honnête à l'utilisateur plutôt qu'un faux import.

## Mode guidé

- `lib/client/project-mode-storage.ts` : `readProjectMode`/`writeProjectMode`, clé `fabsystem:project-mode:<projectId>`. Choix par projet, jamais par compte — cohérent avec "même Project, mêmes données".
- `components/customer/dashboard/project-mode/ModeChoiceScreen.tsx` : écran "Comment souhaitez-vous avancer ?" au premier accès (aucune préférence mémorisée), Guidé visuellement recommandé (bordure jaune, badge), Avancé toujours accessible.
- `components/customer/dashboard/project-mode/ProjectModeGate.tsx` : composant client qui lit le mode, affiche `ModeChoiceScreen`, `GuidedProjectFlow` ou `AdvancedProjectView` — reçoit les mêmes props (project, retainedValues, dependencies...) déjà fetchées côté serveur par `page.tsx`, jamais de requête différente selon le mode.
- `components/customer/dashboard/project-mode/ModeSwitch.tsx` : pastille Guidé/Avancé visible dans les deux vues, réversible à tout moment.

`app/mon-compte/projets/[projectId]/page.tsx` a été réduit à : ownership, fetch des données réelles, calcul des dérivés déjà existants avant UI-13 (statut par moteur, prochaine action — extrait dans `lib/project-module-status.ts` pour éviter une 3ᵉ copie), puis délégation complète à `ProjectModeGate`.

## Mode avancé

Inchangé fonctionnellement — simplement extrait tel quel dans `components/customer/dashboard/project-mode/AdvancedProjectView.tsx` (même JSX que la refonte visuelle UI-12), avec l'ajout du `ModeSwitch` dans l'en-tête.

## Parcours débutant

6 étapes fixes (`components/customer/dashboard/guided/GuidedProjectFlow.tsx`), progression "Étape X sur 6" toujours affichée :

1. **Mon installation** — lecture seule (type, tension déjà choisis à la création), pas de moteur.
2. **Mes besoins** — `EnergyModule` intégral, badge de statut, lien vers le calculateur public en complément (export PDF).
3. **Ma batterie** — question Oui/Non/Je ne sais pas (état local, purement UX) puis `BatteryModule`, bloqué avec message explicite si Énergie n'est pas encore retenue (la vraie dépendance du moteur).
4. **Ma recharge** — sélection multiple (Alternateur/Solaire/Prise 230V/Je ne sais pas), chaque module correspondant ne s'affiche que si sélectionné.
5. **Ma distribution** — `CircuitModule` toujours visible, `CableModule`/`ProtectionModule` seulement si au moins un circuit est retenu.
6. **Mon schéma** — synthèse des valeurs retenues (réutilise `getRetainedValueLabel`/`formatRetainedValueDisplay` d'UI-12) + `DiagramModule` si des circuits existent.

Chaque étape a un bouton Précédent/Suivant ; aucune page ne contient plus d'un module actif à la fois par défaut (les sous-modules de la Recharge/Distribution s'accumulent uniquement sur choix explicite de l'utilisateur, jamais automatiquement).

## Étapes conditionnelles

Vérifié réellement (capture `mobile-recharge-all.png`) : sélectionner "Solaire" seul n'affiche ni Alternateur ni Chargeur. Sélectionner les 3 méthodes affiche les 3 modules empilés, chacun avec son propre statut. La Distribution masque Câbles/Protections tant qu'aucun circuit n'est retenu, avec un message explicite plutôt qu'un formulaire cassé.

## Import outil → Project

Flux exact suivi (mission §16), vérifié en vrai bout en bout sur Bilan de consommation :

1. Calcul déjà fait sur `/outils/bilan-consommation` (3 appareils, 780 Wh/j).
2. Clic "Ajouter à mon projet" → `EnergyImportModal`.
3. `GET /api/projects` : 0 → formulaire de création inline ; 1 → sélection automatique ; >1 → liste cliquable (les 3 cas ont été exercés).
4. Aperçu réel : appel `POST .../engines/energy.consumption/run` avec `retain:false` (jamais un chiffre recalculé côté front) + `GET /api/projects/[id]/values` (nouvelle route, lecture seule) pour détecter un conflit.
5. Si `energy.dailyConsumption` existe déjà : bandeau "Une valeur existe déjà dans ce projet", comparaison Valeur actuelle / Nouvelle valeur, boutons Remplacer / Conserver l'actuelle / Annuler.
6. Validation → `retain:true` sur le même moteur réel. La propagation d'obsolescence (EngineRunner, inchangé) s'applique normalement aux clés dépendantes.

`CableImportModal` suit le même schéma avec une étape supplémentaire (choix ou création d'un circuit), et refuse proprement l'import si le projet cible n'a encore aucun consommateur retenu (dépendance réelle du moteur, pas une limite arbitraire de l'UI).

## Project → outils

Version volontairement légère (mission §21-23 anticipait un préremplissage + retour ; l'architecture réelle rend cette mécanique largement redondante) : le parcours guidé embarque déjà les **vrais** composants moteur directement dans le Project (§ "Parcours débutant" ci-dessus) — il n'y a donc pas besoin de faire l'aller-retour vers l'outil public pour la plupart des cas. Deux liens simples ont été ajoutés (étapes Besoins et Distribution) vers `/outils/bilan-consommation` et `/outils/section-cable` en nouvel onglet, pour l'utilisateur qui veut l'export PDF ou tester plusieurs hypothèses rapidement — sans préremplissage ni état de retour complexe. Voir "Arbitrages" pour la justification de ne pas être allé plus loin.

## Gestion des conflits

Implémentée exactement selon la mission §19 pour Energy (comparaison `energy.dailyConsumption`) et Cable (avertissement "un câble est déjà retenu pour ce circuit" avant remplacement). Jamais d'écrasement silencieux : le remplacement est toujours un choix explicite (bouton "Remplacer"), et la propagation d'obsolescence déjà existante (EngineRunner) n'a été ni contournée ni dupliquée.

## Valeurs retenues / Dépendances / Obsolescence

Aucune modification de `lib/engines/runner.ts`, `lib/services/project-values.ts`, `lib/services/project-dependencies.ts`. Le pont et le mode guidé passent systématiquement par la même route API (`/api/projects/[projectId]/engines/[engineId]/run`) que le mode avancé — jamais un appel direct à un service interne depuis le client, jamais une deuxième voie de persistance.

Un seul ajout d'API : `GET /api/projects/[projectId]/values` (lecture seule, même vérification d'ownership que les routes existantes) — nécessaire pour que le pont puisse détecter un conflit *avant* d'écraser quoi que ce soit.

## Auth / session

**Arbitrage assumé** : la mission §15 demandait de "restaurer le contexte du calcul si possible" après connexion, ce qui suggérait naturellement un paramètre `returnTo` dans la chaîne magic link (`request-link` → email → `verify` → redirection). L'audit a montré que ce mécanisme n'existe pas aujourd'hui côté client (contrairement à la session admin), et le construire proprement implique de toucher une zone sensible (génération de lien signé, redirection après consommation d'un token à usage unique) pour un gain marginal.

Choix retenu : le calcul en attente est sauvegardé en `localStorage` (`lib/client/pending-import-storage.ts`) **avant** la redirection vers `/connexion-client` (route de connexion inchangée), et un bandeau sur `/mon-compte` (`PendingImportBanner`) propose de le reprendre une fois connecté, en réutilisant le même modal d'import que depuis l'outil. Aucune donnée n'est envoyée au serveur avant validation explicite — la garantie de la mission est respectée, sans toucher au flux d'authentification.

## Mobile

Vérifié réellement (Chrome + Playwright) à 375px sur le parcours complet (Installation → Besoins avec calcul + retenue réelle → Batterie → Recharge avec les 3 méthodes sélectionnées → Distribution). Aucun scroll horizontal détecté (`document.documentElement.scrollWidth > clientWidth` = `false`), aucune erreur JS levée pendant le parcours, formulaires en une colonne, boutons Précédent/Suivant toujours accessibles sans être minuscules.

## Accessibilité

Réutilise les primitives déjà auditées en UI-12 (`Badge`, `Button`, boutons de sélection avec `aria-pressed`). Les boutons de choix (Oui/Non/Je ne sais pas, méthodes de recharge) utilisent `aria-pressed` pour exposer leur état sélectionné aux technologies d'assistance — même patron que `CalculateursIndex`/`CircuitModule` déjà en place. Non vérifié avec un lecteur d'écran réel (même limite que les audits précédents de cette série).

## Tests

27 nouveaux tests (898/898 verts au total, suite existante intacte) :

- `tests/outils-project-bridge.test.ts` (6) — traduction des champs, jamais de calcul dupliqué, valeurs non numériques gérées proprement.
- `tests/client-storage-utils.test.ts` (11) — mode Project réversible et par-projet, reprise du parcours guidé, branche recharge conditionnelle, batterie inconnue, JSON invalide géré, calcul en attente conservé/nettoyé.
- `tests/guided-project-source.test.ts` (8) — régression sur le code source : aucun `fetch()` dans le parcours guidé, réutilisation exacte des Module existants, aucun `retain:true` littéral hors des composants réutilisés, aperçu obligatoire avant import, conflit jamais silencieux, dépendance circuit réellement vérifiée.
- `tests/project-values-route.test.ts` (2) — ownership vérifiée, route strictement en lecture seule.

## Captures

Réalisées en Chrome + Playwright (scratchpad de session, non versionnées) : écran de choix de mode, les 6 étapes du parcours guidé, bascule Guidé→Avancé avec vérification que les mêmes données s'affichent, flux complet d'import Bilan de consommation avec conflit réel (projet ayant déjà 480 Wh retenus, import de 780 Wh, comparaison affichée), parcours mobile complet à 375px, et l'étape Installation aux 5 breakpoints demandés (375/430/768/1024/1440).

## Fichiers modifiés

Modifiés :
- `app/mon-compte/projets/[projectId]/page.tsx` (réduit à data-fetching + délégation)
- `app/mon-compte/page.tsx` (bandeau de reprise)
- `components/outils/calculators/BilanConsommationCalculator.tsx`, `SectionCableCalculator.tsx`, `AutonomieBatterieCalculator.tsx`, `MpptCalculator.tsx`

Créés :
- `lib/outils-project-bridge.ts`, `lib/project-module-status.ts`
- `lib/client/project-mode-storage.ts`, `lib/client/guided-flow-storage.ts`, `lib/client/pending-import-storage.ts`
- `app/api/projects/[projectId]/values/route.ts`
- `components/ui/Modal.tsx`
- `components/customer/dashboard/project-mode/{AdvancedProjectView,ModeSwitch,ModeChoiceScreen,ProjectModeGate}.tsx`
- `components/customer/dashboard/guided/{GuidedProjectFlow,GuidedStepShell}.tsx`
- `components/customer/dashboard/PendingImportBanner.tsx`
- `components/outils/project-bridge/{useProjectPicker,ProjectPickerStep,EnergyImportModal,CableImportModal,AddEnergyToProjectButton,AddCableToProjectButton,OpenProjectLink}.tsx`
- 4 nouveaux fichiers de tests (voir ci-dessus)

Non modifiés (vérifié) : tout `lib/engines/*`, `lib/engines/runner.ts`, toutes les routes API existantes, `prisma/schema.prisma`, la chaîne d'authentification magic link, les 10 composants Module (formulaires inchangés, seule leur composition dans le parcours guidé est nouvelle).

## Migrations éventuelles

**Aucune migration Prisma.** Le mode Project (Guidé/Avancé) et l'état du parcours guidé sont volontairement en `localStorage`, pas en base — ce sont des préférences d'affichage, pas des données techniques du projet (arbitrage détaillé ci-dessous). `ProjectRetainedValue`/`ProjectValueDependency` restent inchangés.

## Arbitrages

- **Mode Project en `localStorage`, pas en colonne Prisma** : évite une migration pour une donnée qui n'a pas besoin de survivre au changement d'appareil ni d'être visible côté Admin. Limite assumée : un client qui change de navigateur revoit l'écran de choix de mode — comportement jugé acceptable (mission §3 n'exige pas de synchronisation cross-device).
- **Pont Outils→Project limité à 2 outils sur 5** : décision directement issue de l'audit, pas d'un choix de confort — construire un import pour Autonomie batterie ou MPPT aurait nécessité d'inventer une correspondance que la mission interdit explicitement (§17).
- **Pas de `returnTo` dans la chaîne magic link** : `localStorage` + bandeau sur `/mon-compte` couvre la même exigence produit ("restaurer le contexte") sans toucher à une route d'authentification sensible.
- **Lien Project→Outils volontairement léger** : le parcours guidé intègre déjà les vrais moteurs directement dans le Project ; un système de préremplissage/retour complexe (§21-23) aurait dupliqué une valeur déjà apportée par l'intégration directe, pour un bénéfice marginal.
- **6 étapes fixes plutôt qu'un nombre variable** : la conditionnalité (§8) se joue à l'intérieur des étapes Recharge/Distribution plutôt qu'en ajoutant/retirant des étapes — garde une progression prévisible ("Étape X sur 6") tout en respectant "ne pas imposer une étape non pertinente".

## Limites

- Tests de composants React non écrits avec une librairie de rendu DOM (le repo n'utilise que `node:test` en pur Node, aucune dépendance React Testing Library) — la couverture porte sur les fonctions pures et des régressions de code source, pas sur un rendu interactif simulé. Documenté explicitement plutôt que contourné en ajoutant une dépendance de test hors scope.
- Accessibilité non vérifiée avec un vrai lecteur d'écran (même limite que UI-11/UI-12).
- Le lien Project→Outils n'a pas de préremplissage ni de retour automatique (voir Arbitrages) — l'utilisateur ressaisit s'il choisit d'ouvrir l'outil public plutôt que le module intégré.

## Restes éventuels avant Volta

Le bandeau "Calculer vs Utiliser pour mon projet" du mode avancé (UI-12) porte déjà un emplacement visuel neutre prévu pour Volta (UI-13). Le mode guidé, plus conversationnel par nature, est le candidat naturel pour une future apparition ponctuelle de Volta (expliquer une question, rassurer sur "Je ne sais pas") — aucune intégration faite dans cette phase, conformément à la mission.
