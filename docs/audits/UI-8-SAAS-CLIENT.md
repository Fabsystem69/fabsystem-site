# UI-8 — Espace client / SaaS V1

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `app/mon-compte/**` (layout + 6 pages, réécrit/nouveau), `components/customer/dashboard/*` (nouveau), `components/customer/CustomerAccountShell.tsx` (supprimé, contenu réparti), `lib/project-labels.ts` (nouveau).
**Non modifié :** `lib/engines/*`, `lib/services/project.ts`, `lib/services/project-values.ts`, `lib/services/project-dependencies.ts`, `lib/entitlements.ts`, `app/api/projects/**`, Prisma, Dashboard admin, Stripe, authentification, règles commerciales. Aucun nouveau moteur, aucune nouvelle architecture de capabilities, aucune nouvelle route de mutation n'a été créée : toutes les mutations de cette mission utilisent des routes déjà existantes et déjà fonctionnelles.

## Audit existant

Audit mené avant toute écriture (agent de recherche dédié + lecture directe des fichiers critiques). Résultat classé selon les 4 catégories demandées par la mission.

### A. Déjà fonctionnel (backend réel, testé en conditions réelles pendant cette mission)

- **Authentification client** : lien magique (15 min, usage unique), session fixe 30 jours (`CUSTOMER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000`), déconnexion — inchangés, non touchés.
- **`lib/services/project.ts`** : `createProject`, `getProject`, `listProjectsForCustomer`, `updateProject`, `archiveProject`, `deleteProject` (immédiate), `scheduleDeletion` (+72h), `cancelDeletion`. Toutes ownership-checkées côté serveur (`requireOwnerOrAdmin`).
- **`STANDARD_PROJECT_LIMIT = 3`**, réellement appliqué dans `createProject` (`conflict` 409 si atteint).
- **Routes `/api/projects/**`** (customer-facing, `requireCustomerActor()`) : `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`, `POST .../archive`, `POST .../schedule-deletion`, `POST .../cancel-deletion`. Toutes vérifiées par appels réels pendant cette mission (voir "Validation réelle" plus bas).
- **`lib/services/project-values.ts`** (`retainValue`, `markValueObsolete`, `getProjectValue`, `getProjectValues`) : logique réelle et correcte, mais **sans aucune route API** — uniquement consommable côté serveur.
- **`lib/services/project-dependencies.ts`** (`declareDependency`, `markDependentsObsolete`) : réel, mais propagation à un seul niveau (non transitive, arbitrage déjà documenté dans `docs/audits/PHASE-3-RAPPORT.md`), et uniquement appelé en interne par `EngineRunner`.
- **10 moteurs** (`lib/engines/*`) : implémentations réelles et typées (Energy, Battery, Alternator, Solar, Charger, Cable, Circuit, Protection, Diagram, Global Energy Balance), orchestrées par un `EngineRunner` réel qui persiste les valeurs retenues et propage l'obsolescence.
- **`lib/entitlements.ts` / `lib/server/permissions.ts`** (`hasCapability`, `requireCapability`) : moteur de capabilities réel et réutilisable, basé sur `CustomerCapability` (statut/dates/portée CUSTOMER ou PROJECT).

### B. Mocké / preview / ancien (retiré ou remplacé dans cette mission)

- L'ancien `/mon-compte` (page unique, `CustomerAccountShell.tsx`) affichait uniquement "Informations client" + "Mes achats" — aucune mention de Projets. Contenu réel (pas de fausses données), mais architecture à plat, non conforme à la navigation à 5 entrées de MASTER-04 §15. Remplacé par le layout + les 6 pages dédiées ; le contenu réel (achats, infos client) a été déplacé, jamais réinventé.

### C. Existe au backend mais sans UI avant cette mission (branché dans cette mission, dans la limite du raisonnable)

- Liste/création/ouverture/renommage/archivage/suppression de Projects : **aucune UI n'existait** ; branchée intégralement dans cette mission sur les routes réelles existantes.
- `getProjectValues` : branché en lecture directe (Server Component → service, sans nouvelle route HTTP) dans la Vue Project.

### D. N'existe pas du tout (documenté, non fabriqué — voir "Backend manquant éventuel")

- Aucune route HTTP pour `ProjectRetainedValue`/`ProjectValueDependency`.
- Aucun appelant de `EngineRunner`/`EngineRegistry` nulle part dans l'app réelle (zéro route, zéro page ne déclenche un moteur).
- Aucune fonction `restoreProject`/`unarchiveProject`, ni côté service ni côté route.
- Aucune fonction de duplication de Project (`duplicateProject` n'existe pas).
- Aucun exécuteur de suppression différée à +72h (seule l'intention est persistée).
- Aucun modèle "Accompagnement" (période/niveau/livrables) lié à un Project — seule une `CustomerCapability` générique (chaîne libre) existe, jamais peuplée pour ce cas d'usage.
- "Volta" n'existe nulle part comme label/statut réel — uniquement en commentaires de code et un texte marketing statique.
- Aucune fonction de mise à jour de profil sécurisée côté client (`lib/services/customers.ts:updateCustomer` existe mais sans vérification de propriété — usage admin uniquement).

## Architecture SaaS

Nouvelle arborescence sous `app/mon-compte/` :

```
app/mon-compte/
├── layout.tsx              (garde d'authentification centralisée + nav)
├── page.tsx                 → Accueil
├── projets/
│   ├── page.tsx              → Mes projets (liste)
│   ├── nouveau/page.tsx       → Création
│   └── [projectId]/page.tsx  → Vue Project
├── achats/page.tsx           → Mes achats (contenu déplacé, inchangé)
└── profil/page.tsx           → Mon profil (lecture seule)
```

`app/mon-compte/layout.tsx` centralise la vérification de session (`getCustomerSessionFromCookie()` + `redirect("/connexion-client")`) — auparavant dupliquée uniquement dans l'unique page existante, désormais protège les 6 routes sans répétition.

**Navigation** (`components/customer/dashboard/DashboardNav.tsx`) : Accueil, Mes projets, Mes achats, Mes outils (lien réel vers `/outils`, public), Mon profil. **"Mon accompagnement" est volontairement absente** — aucun backend réel n'existe (voir audit §D), et la mission autorise explicitement cette entrée comme "éventuelle" ("Navigation minimale attendue... éventuellement Accompagnement"). "Documents/Ressources" également omise, pour la même raison (aucun backend Documents lié à un Project).

**Thème** : clair (`bg-white`/`neutral-950`), conforme à `MASTER-12-DESIGN-SYSTEM.md §8` ("SaaS clair, premium, pédagogique, rassurant — le thème sombre n'est pas la direction principale du compte client"). Composants réutilisés : `Card`, `Badge`, `Button`, `Alert` (déjà existants, non modifiés).

## Dashboard

`app/mon-compte/page.tsx` (Accueil) répond aux 4 questions de la mission avec des données réelles uniquement :

- **Où en est mon projet ?** → carte "Reprendre votre projet" avec le projet le plus récemment modifié (`updatedAt` réel, tri côté serveur).
- **Mes achats** → résumé réel (nombre de commandes, nombre de téléchargements disponibles), lien vers le détail.
- Aucun pourcentage, score, jauge ou badge artificiel. Aucune donnée simulée.
- États vides gérés explicitement : "Vous n'avez pas encore de projet" + CTA "Créer mon premier projet" si `projects.length === 0`.

## Projects

### Liste (`/mon-compte/projets`)

- Sépare Actifs (`ACTIVE` + `DELETE_SCHEDULED`, ce dernier avec une bannière rouge affichant l'échéance réelle) et Archivés (`ARCHIVED`), conformément à `04-MES-PROJETS.md §6`.
- Indicateur de quota réel `{count} / {STANDARD_PROJECT_LIMIT}` — importé directement de `lib/services/project.ts`, jamais recopié en dur.
- CTA "+ Nouveau projet" désactivé visuellement à la limite (le serveur reste seul juge, cf. `createProject` → 409).
- **Aucune action "Dupliquer" ni "Restaurer"** : ni l'une ni l'autre n'existe côté backend (voir audit §D) — respecte explicitement l'instruction "Ne pas créer `restoreProject` si le backend ne le supporte toujours pas."

### Actions Project (`components/customer/dashboard/ProjectActions.tsx`)

- `ArchiveProjectButton` → `POST .../archive`.
- `RenameProjectForm` → `PATCH /api/projects/[id]` (`{ name }`).
- `DeleteProjectControls` → case à cocher "Suppression différée de 72 h", **décochée par défaut** (conforme à MASTER-06 §15) ; cochée → `POST .../schedule-deletion` ; décochée → `DELETE /api/projects/[id]` avec `{confirm:true}`, immédiat et définitif.
- `CancelDeletionButton` → `POST .../cancel-deletion`, affiché uniquement si `status === "DELETE_SCHEDULED"`.

## Création Project

`app/mon-compte/projets/nouveau/page.tsx` + `CreateProjectForm.tsx` : formulaire minimal — nom, type (Bateau/Van/Camping-car/Autre), tension (12 V/24 V/Je ne sais pas), exactement les 3 champs supportés par `parseCreateProjectInput` (zod). Soumission → `POST /api/projects` → redirection vers la Vue Project créée. Aucun champ supplémentaire inventé.

## Vue Project

`/mon-compte/projets/[projectId]` (Server Component) :

1. `requireCustomerActor()` puis `getProject(actor, projectId)` — ownership vérifiée côté serveur ; erreur 403/404 → `notFound()` Next.js (jamais un id seul n'autorise l'accès).
2. En-tête : nom, badge de statut, type, tension, actions (renommer/archiver/supprimer ou annuler la suppression programmée).
3. **Informations retenues** : `getProjectValues(project.id)` — appel serveur direct, aucune nouvelle route HTTP. Aujourd'hui **toujours vide pour tout projet réel** (voir audit — rien n'appelle jamais `retainValue` en production), donc affichage honnête : "Votre projet est prêt. Aucune information n'est encore retenue..." + lien vers les calculateurs publics réels (`/outils`), avec la précision explicite que leurs résultats ne sont pas encore reliés au projet.
4. **Structure technique** : 9 cartes (Énergie, Batterie, Alternateur, Solaire, Chargeur, Circuits, Câbles, Protections, Schéma) — une par moteur réel existant (`lib/engines/*`, mêmes identifiants exacts : `energy.consumption`, `battery.sizing`, etc.). Chaque carte affiche son état réel : "À compléter" aujourd'hui pour toutes (aucune valeur retenue n'existe), "Retenu"/"À recalculer" si une valeur existait un jour. Aucune ne dispose d'un bouton menant vers un module non construit — ce serait un "faux CTA".

## Valeurs retenues

Distinction respectée strictement, selon le modèle réel :

- **Retenu** (`ProjectValueStatus.ACTIVE`) : badge vert "Retenu".
- **À recalculer** (`ProjectValueStatus.OBSOLETE`) : badge orange "À recalculer" — jamais "erreur".
- Aucune simulation n'est jamais affichée comme valeur retenue : la Vue Project ne lit que `getProjectValues` (les valeurs réellement retenues via `retainValue`), jamais un état de calcul temporaire côté client.
- Aucune UI d'édition des valeurs retenues n'a été construite : la mission demande "éditables uniquement selon les capacités réelles de l'API", et aucune route ne permet une édition customer-facing de `ProjectRetainedValue` aujourd'hui (voir audit §D) — donc lecture seule, honnêtement.

## Moteurs

Consommation prévue mais **non réalisable dans cette mission sans créer une nouvelle infrastructure** : aucun des 10 moteurs n'est appelable depuis une route existante (`EngineRunner`/`EngineRegistry` ont zéro appelant réel, confirmé par recherche exhaustive). Construire un déclenchement de moteur depuis l'UI aurait exigé de créer de nouvelles routes API (`POST /api/projects/[id]/engines/[engineId]/run` ou équivalent) — explicitement hors périmètre ("Ne pas créer de nouvelle infrastructure", "Ne pas réimplémenter les formules dans React", "Ne pas dupliquer les calculateurs publics dans le SaaS"). La Vue Project affiche donc la structure des 10 moteurs (leurs identifiants réels) sans jamais simuler un résultat : chaque section reste à l'état réel "À compléter" tant qu'aucune route ne permet de les déclencher.

## Dépendances et statuts

- Le badge "À recalculer" utilise directement `ProjectRetainedValue.status === "OBSOLETE"` — jamais un état inventé.
- Aucun label "Erreur critique" nulle part : seuls "Retenu"/"À recalculer"/"À compléter" sont utilisés, cohérents avec les 5 niveaux MASTER-07 (Information/À compléter/À vérifier/À recalculer/Important) sans en abuser — cette mission n'introduit pas de mini-couche Volta, conformément à l'instruction explicite.
- Aucun texte n'attribue un état à "Volta" : le mot n'apparaît nulle part dans l'UI construite (conforme à l'instruction "ne pas créer de personnage animé... si le nom est déjà utilisé comme label système, il peut rester dans un petit bloc neutre" — mais puisque "Volta" n'est **pas** un label système réel aujourd'hui, il n'a pas été introduit du tout, par prudence).

## Accompagnement

**Non implémenté, documenté comme backend manquant** (audit §D). Aucun modèle Prisma, aucun service, aucune donnée réelle représentant une période/un niveau/des livrables d'accompagnement liés à un Project. `CustomerCapability` existe mais n'est jamais peuplé pour ce cas. Conformément à la mission ("Si ce backend n'est pas encore implémenté : ne pas faker la section"), **aucune section "Mon accompagnement" n'a été construite**, ni dans la navigation ni dans la Vue Project.

## Capabilities

`lib/entitlements.ts`/`lib/server/permissions.ts` (`hasCapability`/`requireCapability`) existent et sont prêts, mais **aucun point d'accès construit dans cette mission n'en avait besoin** : toutes les routes Project utilisées sont déjà protégées par `requireCustomerActor()` + ownership (`requireOwnerOrAdmin`), pas par des capabilities nommées. Aucune capability n'a été inventée, aucun accès n'est conditionné par un nom de pack ou un prix — conforme à la mission. Si une fonction future doit être limitée par capability (ex. nombre de projets pour une offre Pro), le helper existant est prêt à être branché sans modification.

## Profil

`/mon-compte/profil` : affichage **lecture seule** des données réelles (`email`, `name` via `getCustomerAccountOverview`). Aucun formulaire de modification n'a été construit : la seule fonction de mise à jour trouvée (`lib/services/customers.ts:updateCustomer`) est un service d'administration qui prend un `id` arbitraire **sans aucune vérification de propriété** — l'exposer tel quel à un client serait une faille de sécurité (un client pourrait modifier n'importe quel autre compte en devinant/observant un id). Construire une modification de profil sécurisée exigerait une nouvelle route avec contrôle d'appartenance, ce qui est une nouvelle surface de mutation non couverte par cette mission — documenté ci-dessous plutôt que bricolé dangereusement.

## Responsive

- Layout : `grid lg:grid-cols-[200px_minmax(0,1fr)]` — navigation empilée en haut sur mobile (`flex-wrap`), colonne latérale seulement à partir de `lg`. Pas de sidebar desktop simplement masquée : la nav mobile est un vrai composant de navigation en ligne, pas une compression du desktop.
- Cartes Project (liste, Vue Project) : pleine largeur, empilées verticalement à toutes les tailles d'écran — jamais de tableau horizontal.
- Formulaire de création : boutons radio en grille `sm:grid-cols-4`/`sm:grid-cols-3`, empilés en une colonne sous `sm`.
- Actions Project (archiver/supprimer/renommer) : `flex flex-wrap`, zones tactiles ≥ 40px (héritées de la primitive `Button`).
- Non vérifié dans un navigateur réel (aucun Playwright/Puppeteer dans ce dépôt) — validé par revue des classes Tailwind responsive et par le smoke test HTTP réel décrit ci-dessous.

## Accessibilité

- Un seul `<h1>` par page — vérifié par smoke test réel sur Accueil et Mes projets (`grep` : 1 occurrence chacune).
- Labels explicites sur tous les champs (`<label htmlFor>`), y compris le champ de renommage (`sr-only` mais présent, jamais uniquement un placeholder).
- Boutons radio du formulaire de création : `sr-only` input réel + `<label>` cliquable, jamais une simple `div` sans sémantique de formulaire.
- Dialogue de suppression : `role="dialog"` + `aria-modal="true"` + `aria-label` explicite.
- Navigation : `aria-current="page"` sur l'entrée active.
- États jamais communiqués uniquement par la couleur : chaque `Badge`/message d'état porte un texte explicite ("Retenu", "À recalculer", "À compléter", "Suppression programmée le...").
- Focus visible hérité des primitives `Button`/liens déjà validées (UI-1/UI-2), non modifié.

## Performance

- `app/mon-compte/layout.tsx` et toutes les pages (`page.tsx`) restent des **Server Components** — la garde de session, la lecture des projets, des achats et des valeurs retenues se fait côté serveur, sans hydratation inutile.
- Seuls les composants réellement interactifs sont `"use client"` : `DashboardNav` (état de route actif), `LogoutButton`, `ProjectActions.tsx` (archiver/renommer/supprimer), `CreateProjectForm`.
- La Vue Project ne refetch jamais deux fois la même donnée : `getProject` est appelé une fois, son résultat (`project.id`) réutilisé pour `getProjectValues` — pas de requête client redondante.
- Aucune nouvelle dépendance npm.

## Backend manquant éventuel

Points explicitement documentés plutôt que contournés par une fausse fonctionnalité ou une nouvelle infrastructure :

1. **Aucun moteur n'est déclenchable depuis l'UI.** `EngineRunner` existe et fonctionne (testé unitairement selon l'audit) mais n'a aucun point d'entrée HTTP. Construire "Bilan", "Batterie", etc. comme formulaires réels nécessite d'abord de nouvelles routes API qui appellent `createEngineRunner().run(...)` — hors périmètre UI-8.
2. **Aucune route pour `ProjectRetainedValue`/`ProjectValueDependency`.** La Vue Project les lit directement côté serveur (legitime, aucune nouvelle route nécessaire pour un affichage en lecture seule), mais aucune édition/rétention n'est possible depuis l'UI tant qu'aucune route n'existe.
3. **Aucune fonction `restoreProject`.** Un projet archivé ne peut plus jamais redevenir "Actif" avec le backend actuel — seul un chemin vers la suppression existe. Documenté ici, pas contourné.
4. **Aucune fonction de duplication.** "Utiliser un exemple comme point de départ" (04-MES-PROJETS.md §14, §18) et "Dupliquer" (§17) ne peuvent pas être construits : aucune fonction de duplication n'existe côté service, et aucun modèle de "projet exemple" n'existe dans le schéma (`Project` n'a pas de champ `isExample`/`sourceProjectId`). Cette mission n'a donc **pas** construit de section "Explorer un exemple" — l'afficher aurait été une fonctionnalité fictive.
5. **Aucun exécuteur de suppression différée.** `scheduleDeletion` persiste une intention et une échéance à +72h, mais rien ne purge réellement un projet à l'échéance aujourd'hui. Sans impact sur l'UI (le comportement visible — statut "Suppression programmée" + possibilité d'annuler — reste correct), mais à savoir avant de promettre que la suppression aura réellement lieu.
6. **Aucun modèle Accompagnement.** Voir section dédiée ci-dessus.
7. **Aucune route de modification de profil sécurisée côté client.** Voir section Profil ci-dessus.
8. **Pas de distinction "exemple exploré" vs "copié"** dans le calcul de la limite de 3 projets : le service compte actuellement tous les projets sans exception, ce qui est cohérent avec l'absence totale du concept d'exemple (point 4) — donc pas une incohérence dans cette mission, mais un point à traiter ensemble si "Explorer un exemple" est construit plus tard.

## Visuels nécessaires

- Aucune iconographie dédiée par type de véhicule (Bateau/Van/Camping-car/Autre) n'existe dans le dépôt ; les listes de projets utilisent uniquement le texte (déjà conforme à MASTER-04 §31 : "une fonction essentielle ne doit jamais être représentée uniquement par une icône" — donc l'absence d'icône n'est pas un manque bloquant, juste un enrichissement visuel possible plus tard).
- Aucun asset Volta, toujours (reconfirmé par l'audit) — sans impact puisque Volta n'a été introduite nulle part dans cette mission.

## Arbitrages

1. **`/mon-compte` réorganisé en 5 pages plutôt que rester une page unique.** Nécessaire pour respecter MASTER-04 §15 (5 entrées distinctes) et pour donner à "Mes projets" sa propre page réelle (exigence centrale de la mission). Le contenu réel existant (achats, infos client) a été déplacé tel quel, jamais réécrit.
2. **"Mon accompagnement" omise de la navigation** plutôt qu'affichée avec un contenu vide ou "Bientôt disponible" — choix explicitement autorisé par la mission ("éventuellement Accompagnement" + "si ce backend n'est pas encore implémenté, ne pas faker la section").
3. **Vue Project en une seule page** plutôt que 7 sous-pages (Bilan/Batterie/Recharge/Circuits/Schéma séparées comme le suggère la navigation cible à long terme de MASTER-06 §35). La mission elle-même décrit "Page Project" comme une page unique avec une liste de blocs (§6), et aucun module n'a de logique réelle à héberger sur une page dédiée aujourd'hui (aucun moteur déclenchable) — construire 7 pages presque vides aurait été une complexité sans valeur réelle. Documenté ici comme décision volontaire, pas un oubli.
4. **"Structure technique" affichée avec les 9 identifiants de moteurs réels**, plutôt qu'omise entièrement. Le mission item 6 demande explicitement cette structure ; comme chaque section affiche honnêtement "À compléter" (état réel, aucune donnée inventée) et ne propose aucun faux bouton d'action, cela respecte à la fois "brancher l'UI sur les moteurs" (en utilisant leurs vrais identifiants) et "ne pas afficher de section vide artificielle" (l'état affiché est le vrai état, pas un remplissage).
5. **Lien vers `/outils`** proposé comme "prochaine action" honnête pour un projet vide, plutôt qu'un faux CTA "Calculer votre bilan" qui ne mènerait nulle part. Les calculateurs publics sont réels et fonctionnels (UI-7/UI-7.1) ; le texte précise explicitement qu'ils ne sont pas encore reliés au projet, pour ne jamais laisser croire à une intégration qui n'existe pas.
6. **Profil en lecture seule.** Voir section Profil — construire un formulaire d'édition aurait nécessité une nouvelle route non sécurisée par défaut (le seul service existant n'a pas de contrôle de propriété) ; par prudence, aucune modification n'a été exposée côté client dans cette mission.
7. **Validation par smoke test réel sur la base de développement locale**, avec deux comptes client temporaires créés puis supprimés pendant la mission, plutôt qu'une simple lecture de code. A permis de confirmer réellement : création (201), limite à 3 (409 au 4ᵉ), cycle archive → suppression différée → annulation (statuts exacts observés), isolation stricte entre deux comptes (404, pas de fuite d'existence). Toutes les données de test ont été supprimées à la fin de la vérification (`Customer`, `CustomerSession`, `Project` — 2 clients, 3 projets, 2 sessions).

## Vérifications techniques

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : 851/851 tests passants, aucune régression (aucune logique de calcul modifiée dans cette mission, donc aucun nouveau test requis).
- `npm run build` : build de production réussi ; les 6 routes `/mon-compte/**` listées en rendu dynamique (`ƒ`, cohérent avec la garde de session).
- Smoke test réel (base de développement locale, jamais la production) : connexion par cookie de session réel, création de 3 projets via l'API réelle, blocage réel du 4ᵉ (409), cycle de vie complet archiver → programmer suppression différée → annuler (statuts et `preScheduleStatus` vérifiés exacts à chaque étape), isolation stricte vérifiée entre deux comptes clients distincts (404 sur accès croisé, liste propre à chaque compte), un seul `<h1>` par page, quota `3 / 3` affiché correctement. Toutes les données de test supprimées après vérification.

---

# UI-8 FINAL — Terminer le cœur fonctionnel du SaaS client

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Périmètre modifié :** `lib/engines/index.ts` (nouveau), `lib/engine-payload.ts` (nouveau), `lib/engines/runner.ts` (correctif, voir "Dépendances réelles"), `lib/services/project.ts` (ajout `purgeDueScheduledDeletions`), `app/api/projects/[projectId]/engines/[engineId]/run/route.ts` (nouveau), `app/api/internal/jobs/purge-scheduled-deletions/route.ts` (nouveau), `app/mon-compte/projets/[projectId]/page.tsx` (réécrit), `components/customer/dashboard/engines/*` (nouveau, 10 modules + hook + barre d'action), tests (`tests/engine-payload.test.ts`, `tests/engines-index.test.ts`, ajouts à `tests/project-service.test.ts`).
**Non modifié :** aucune formule métier (`*-engine.ts` non touchés, à l'exception du correctif d'orchestration dans `runner.ts`, détaillé plus bas — jamais un calcul), aucun nouveau modèle Prisma, aucune nouvelle architecture de capabilities/entitlements, aucune authentification nouvelle, aucun Volta graphique, aucun Accompagnement/Fabien.

## Finalisation moteurs

Avant cette mission, `EngineRegistry` et `EngineRunner` (couche 4.0, MASTER-11) existaient et étaient testés unitairement, mais **aucune instance de registre n'était jamais peuplée en production** — confirmé par une recherche exhaustive (`grep`) : les seuls appelants de `createEngineRegistry`/`createEngineRunner` étaient leurs propres fichiers de test.

`lib/engines/index.ts` crée la première instance réelle : `getEngineRegistry()` enregistre les 10 moteurs existants (`createEnergyEngine`, `createBatteryEngine`, `createAlternatorEngine`, `createSolarEngine`, `createChargerEngine`, `createGlobalEnergyBalanceEngine`, `createCircuitEngine`, `createCableEngine`, `createProtectionEngine`, `createDiagramEngine`) — aucun nouveau moteur créé, uniquement un enregistrement. `listRegisteredEngineIds()` sert de source de vérité unique pour toute UI ayant besoin de la liste réelle (mission §5 : "ne pas coder la liste à la main à plusieurs endroits") — la Vue Project (voir "Parcours de calcul") ne recopie jamais cette liste, elle l'importe.

## API Project technique

Route unique, customer-facing : `POST /api/projects/[projectId]/engines/[engineId]/run` (`app/api/projects/[projectId]/engines/[engineId]/run/route.ts`).

- `requireCustomerActor()` obligatoire.
- `engineId` validé contre `lib/engine-payload.ts` (`ENGINE_INPUT_SCHEMAS`, un schéma zod par moteur réel, reflétant exactement le contrat de chaque `*EngineInput` — jamais une formule recopiée, uniquement la forme des données). Un `engineId` inconnu renvoie `400 { code: "BAD_REQUEST" }`, jamais une erreur 500 ou un moteur fantôme.
- L'appartenance du Project est vérifiée par le service `Project` existant (via `EngineRunner` en mode "retain", ou via `getProject` en mode aperçu) — aucune nouvelle logique d'autorisation.
- Le corps accepte `{ input, retain?: boolean }` :
  - `retain` absent ou `false` (**"Calculer"**) : le moteur réel est exécuté (`engine.run(context, input)`, `context` construit par `createEngineContext`) mais **rien n'est persisté** — une simulation au sens de MASTER-06 §25. C'est la seule façon, avec l'architecture existante, d'offrir une prévisualisation sans dupliquer `EngineRunner` ni le modifier : `EngineRunner.run` persiste systématiquement (comportement existant, volontaire, voir plus bas) — donc un aperçu doit appeler le moteur directement, jamais le runner.
  - `retain: true` (**"Utiliser pour mon projet"**) : `createEngineRunner().run(actor, projectId, engine, input)` est appelé — l'implémentation existante gère seule la persistance des valeurs proposées, la déclaration des dépendances et la propagation d'obsolescence (mission §1 : "laisser EngineRunner gérer dépendances/obsolescence"). Aucune formule n'est réimplémentée dans la route.
- Les erreurs métier du moteur (`ValidationError`, `DependencyError`, `CalculationError`) sont interceptées (`isEngineError`) et renvoyées en `400` avec le code d'erreur réel du moteur, jamais en `500` générique.

## Valeurs retenues

Aucune route de rétention "brute" séparée n'a été créée : autoriser un client à écrire une valeur retenue arbitraire, sans qu'elle provienne d'un calcul réel du moteur, aurait justement réintroduit le risque que la mission interdit ("aucune formule réimplémentée", et implicitement aucune valeur fabriquée côté client). La rétention est donc exclusivement un sous-produit de `retain: true` sur la route d'exécution moteur — le seul mécanisme de rétention réutilise `retainValue()` en interne (via `EngineRunner`, inchangé).

Cette architecture répond littéralement à MASTER-06 §25-26 ("simulation ≠ calcul ≠ décision") : `retain: false` = simulation (rien n'est écrit) ; `retain: true` = décision explicite de l'utilisateur (clic sur "Utiliser pour mon projet"), jamais automatique. `markValueObsolete()` n'a pas eu besoin d'une nouvelle route : il n'est appelé qu'en interne par la propagation de dépendances existante (`markDependentsObsolete`, inchangée), jamais directement par un client.

## Parcours de calcul

`app/mon-compte/projets/[projectId]/page.tsx` a été réécrit : les 9 cartes statiques "À compléter" (bug initial : liste recopiée à la main, incomplète — il manquait `energyBalance.global`, 10ᵉ moteur réel) sont remplacées par une structure dérivée de `listRegisteredEngineIds()` (exactement 10 entrées, aucune recopie manuelle) et deux chaînes réelles rendues avec `<details>`/`<summary>` (navigation compacte, une seule page — pas 10 pages géantes, conforme à la mission) :

- **Chaîne Énergie** (`ENERGY_CHAIN`) : `EnergyModule` (liste d'appareils), `BatteryModule`, `AlternatorModule`, `SolarModule`, `ChargerModule`, `EnergyBalanceModule` (aucune entrée propre, agrège les valeurs déjà retenues).
- **Chaîne Circuit** (`CIRCUIT_CHAIN`) : `CircuitModule` (regroupe les consommateurs déjà retenus en circuits), `CableModule`, `ProtectionModule`, `DiagramModule` — chacun affiche la liste des circuits déjà retenus (dérivée des valeurs réelles `circuit.<id>`, jamais une liste inventée) et refuse de s'afficher tant qu'aucun circuit n'existe ("Retenez d'abord un circuit...").

Chaque module (`components/customer/dashboard/engines/*.tsx`) est un Client Component avec un formulaire réel (champs typés selon le contrat exact du moteur, voir `lib/engine-payload.ts`), un bouton **Calculer** (aperçu), et — seulement une fois un résultat obtenu — un bouton **Utiliser pour mon projet** (rétention réelle). Aucun module ne recopie une formule d'un calculateur public (`/outils/*`) : chaque module appelle exclusivement la route `.../engines/[engineId]/run`, qui appelle exclusivement le moteur métier partagé. L'UI diffère volontairement du calculateur public (formulaires orientés "mon projet", résultats reliés aux autres modules), conformément à la mission §4 ("UI différente possible, moteur commun obligatoire").

Le catalogue de protections (`ProtectionModule`) et les sections de câble disponibles (`CableModule`) restent des champs texte compacts (`"fusible:30, disjoncteur:40"`, `"1.5,2.5,4,6,10,16,25"`) plutôt que des sous-formulaires imbriqués — un compromis assumé pour rester sur une seule page compacte sans sacrifier la validité réelle des données envoyées au moteur (parsées puis validées par le schéma zod avant tout appel moteur).

## Dépendances réelles

Le smoke test réel (voir plus bas) a révélé un **défaut préexistant réel** dans `lib/engines/runner.ts`, jamais visible jusqu'ici car aucun appelant en production n'existait avant cette mission : lors d'un premier calcul d'un moteur proposant plusieurs clés liées entre elles par une dépendance interne (ex. Energy Engine propose à la fois `energy.dailyConsumption` et `energy.maxCurrent`, avec une dépendance déclarée `energy.maxCurrent → energy.dailyConsumption`), le runner marquait `energy.maxCurrent` **obsolète dans la même exécution qui venait de le calculer** — parce que `energy.dailyConsumption` apparaissait aussi comme "changé" (première écriture) et que la propagation d'obsolescence ne distinguait pas "un dépendant obsolété par un autre moteur, plus tard" de "un dépendant recalculé à l'instant, par ce même moteur, avec les données actuelles".

Corrigé dans `runner.ts` (fonction `run`, toujours dans la couche 4.0 générique — aucun moteur métier touché, aucune formule modifiée) : après propagation, toute clé marquée obsolète qui fait partie des propositions de ce même run est immédiatement re-persistée avec sa valeur fraîche (statut `ACTIVE`). La propagation inter-moteurs — le cas réel visé par MASTER-06 §30 — reste strictement intacte : vérifié par le smoke test (changer l'énergie retenue fait bien passer `battery.usefulCapacity` en `OBSOLETE`, dans un run **séparé**, sans jamais toucher aux clés énergie elles-mêmes).

État affiché (`moduleStatus()`, `page.tsx`) : **À compléter** (aucune valeur retenue pour ce moteur), **Retenu** (au moins une valeur `ACTIVE`), **À recalculer** (au moins une valeur `OBSOLETE`) — dérivé exclusivement de `ProjectRetainedValue.status`, jamais un statut inventé. Une valeur `OBSOLETE` n'est jamais supprimée ni remplacée automatiquement : elle reste visible (avec son ancienne valeur) jusqu'à ce qu'un nouveau calcul explicite la retienne à nouveau — vérifié par smoke test (`value` toujours présent après passage en `OBSOLETE`). Aucun terme technique ("stale", "graphe de dépendances", "invalidation", "payload") n'apparaît dans l'UI cliente.

## Suppression +72 h

Avant cette mission, `scheduleDeletion`/`cancelDeletion` (customer-facing, `app/api/projects/[projectId]/{schedule-deletion,cancel-deletion}/route.ts`, confirmés existants et fonctionnels — contrairement à une hypothèse erronée soulevée puis écartée en cours de mission) persistaient une intention et une échéance (+72h, `deleteScheduledAt`), mais **aucun exécuteur ne supprimait jamais réellement rien à l'échéance**.

Ajouté, conformément à MASTER-10 §52/§54-60/§84-85 :

- `ProjectDb.findDueScheduledDeletions(before)` (`lib/services/project.ts`) : recherche les `Project` en statut `DELETE_SCHEDULED` dont `deleteScheduledAt <= before`.
- `purgeDueScheduledDeletions()` : supprime individuellement chaque Project dû (jamais une suppression groupée en une seule transaction), avec un `try/catch` par Project — un échec isolé ne bloque jamais les autres (même principe que `purgeAllEligiblePendingOrders`, précédent déjà existant dans ce dépôt pour les commandes). Retourne `{ deletedCount, deletedProjectIds, failed }`.
- **Idempotent par construction** : un Project déjà supprimé n'apparaît simplement plus dans la recherche suivante — rejouer le traitement ne recrée rien, ne supprime rien d'autre. Vérifié par test (`purgeDueScheduledDeletions is idempotent`) et par smoke test réel (deuxième appel → `deletedCount: 0`).
- **Aucun timer mémoire** : l'échéance vit exclusivement dans `deleteScheduledAt` (Neon/Postgres), déjà persistée par `scheduleDeletion` — le job ne fait que la lire.
- **Déclenchement en production** : `POST /api/internal/jobs/purge-scheduled-deletions` (`requireApiSession()`, donc Admin), même modèle que le bouton "Tout purger" déjà existant pour les commandes (`app/api/internal/orders/purge-pending`). C'est un déclenchement manuel réel et fonctionnel dès aujourd'hui. Conformément à MASTER-10 §57/§85 ("ne pas inventer un cron précis sans décision de déploiement"), **aucun cron n'a été câblé** (pas d'entrée `vercel.json`, pas de fournisseur de queue) : cette route peut être appelée soit manuellement (bouton Admin à ajouter — non fait dans cette mission, hors périmètre "terminer le cœur fonctionnel du SaaS client"), soit par un planificateur externe configuré séparément comme décision de déploiement ultérieure. Ce choix est documenté, pas inventé.

## Sécurité

- Toutes les nouvelles mutations passent par `requireCustomerActor()` — jamais de `projectId` client de confiance seul : l'appartenance est revérifiée côté serveur par `getProject`/`EngineRunner` à chaque appel (aucune nouvelle logique d'autorisation, réutilisation stricte du service `Project` existant, MASTER-10 §40).
- Aucune capacité basée sur un nom de pack (`packName`) : les 10 moteurs sont accessibles à tout Customer propriétaire du Project, sans distinction commerciale — cohérent avec l'absence de toute logique d'entitlement dans cette mission.
- Isolation testée réellement : un second Customer tentant d'exécuter un moteur sur le Project du premier reçoit `403 { code: "FORBIDDEN" }` (comportement du service `Project` existant, `requireOwnerOrAdmin`, partagé par toutes les routes Project depuis la Phase 3 — pas un comportement nouveau à cette mission) sans jamais recevoir le contenu du Project ni une distinction entre "n'existe pas" et "accès refusé" au niveau des données renvoyées.
- La route Admin de purge (`/api/internal/jobs/purge-scheduled-deletions`) est protégée par `requireApiSession()`, identique au précédent `purge-pending` — jamais accessible à un Customer.

## Validation fonctionnelle

Vérifications réelles, dans l'ordre :

1. `npx tsc --noEmit` : aucune erreur.
2. `npm test` : **867/867** tests passants (851 avant cette mission + 16 nouveaux : `tests/engine-payload.test.ts`, `tests/engines-index.test.ts`, et 6 tests ajoutés à `tests/project-service.test.ts` pour l'exécuteur de suppression différée) ; la suite pré-existante ne régresse pas.
3. `npm run build` : build de production réussi ; `/api/projects/[projectId]/engines/[engineId]/run` et `/api/internal/jobs/purge-scheduled-deletions` listées comme routes dynamiques.
4. **Smoke test réel** (base de développement locale uniquement, deux comptes Customer temporaires créés directement en base puis entièrement supprimés en fin de vérification — même méthodologie que UI-8) :
   - `engineId` inconnu → `400 { code: "BAD_REQUEST" }`, jamais 500.
   - Aperçu (`retain: false`) sur `energy.consumption` → `200`, **aucune ligne écrite** en base (vérifié directement par requête SQL).
   - Rétention (`retain: true`) sur `energy.consumption` → `200`, 3 valeurs persistées (`energy.consumers`, `energy.dailyConsumption`, `energy.maxCurrent`), toutes `ACTIVE` **après correctif** du défaut de propagation intra-run décrit ci-dessus (avant correctif : `energy.maxCurrent` finissait `OBSOLETE` dès sa création — bug confirmé puis corrigé pendant cette mission).
   - Rétention sur `battery.sizing` (dépendant de l'énergie déjà retenue) → `200`, `battery.usefulCapacity` persistée `ACTIVE`.
   - Nouvelle rétention sur `energy.consumption` avec une valeur différente → `battery.usefulCapacity` passe réellement à `OBSOLETE`, tout en conservant sa valeur précédente (jamais supprimée ni écrasée silencieusement) — dépendance inter-moteurs réelle, vérifiée en base.
   - Second Customer tentant d'exécuter un moteur sur le Project du premier → `403`, aucune fuite de contenu.
   - Programmation d'une échéance de suppression dans le passé (simulation d'une échéance atteinte) puis appel du service de purge → Project réellement supprimé ; second appel (rejeu) → `deletedCount: 0` (idempotence confirmée en conditions réelles).
   - Toutes les données de test supprimées après vérification (`Customer`, `CustomerSession`, `Project` — 2 clients, 1 projet).

Points volontairement non couverts par un test automatisé de bout en bout via la route HTTP elle-même (cohérent avec l'absence de tout harnais de test de routes Next.js dans ce dépôt — le seul précédent, `tests/downloads-route.test.ts`, ne fait que de la comparaison de source, jamais un appel réel) : l'autorisation et la persistance HTTP ont été vérifiées par le smoke test réel ci-dessus plutôt que par un test automatisé au niveau route ; la logique unitaire (schémas zod, registre peuplé, exécuteur de suppression) est, elle, couverte par les nouveaux tests `node:test`.

Checklist finale de la mission :

- [x] Un vrai Project peut recevoir des données (formulaires réels par moteur).
- [x] Au moins les chaînes de moteurs existantes sont exécutables depuis le SaaS (les deux chaînes complètes, 10/10 moteurs).
- [x] Les résultats viennent d'EngineRunner (rétention) ou du moteur direct (aperçu), jamais recalculés côté React.
- [x] Le client peut retenir une décision réellement supportée ("Utiliser pour mon projet").
- [x] Les dépendances transitent réellement vers "À recalculer" (vérifié en base, après correctif du défaut de propagation intra-run).
- [x] La valeur précédemment retenue n'est jamais écrasée silencieusement.
- [x] Le Dashboard/Vue Project affiche une synthèse "À faire maintenant" neutre, sans score ni pourcentage, sans recommandation attribuée à Fabien/Volta.
- [x] La suppression +72h est réellement exécutable (job vérifié en conditions réelles, idempotent).
- [x] Aucune personnification de FabSystem.
- [x] Aucune recommandation humaine attribuée à Volta/FabSystem (aucune recommandation n'a été écrite du tout — seuls des constats déterministes).
- [x] TypeScript OK, tests OK (867/867), build OK.

---

# Déclenchement automatique suppression +72 h

**Mission UI-8.1.** Portée strictement limitée au déclenchement automatique de `purgeDueScheduledDeletions()` — aucune autre logique de UI-8/UI-8 FINAL n'a été modifiée. Aucune nouvelle architecture de jobs créée : le seul mécanisme de jobs disponible dans ce dépôt et compatible avec le déploiement Vercel actuel (`vercel.json` sans `crons` avant cette mission, aucun autre système de file d'attente présent) est **Vercel Cron Jobs**, réutilisé directement.

## Mécanisme retenu

- `vercel.json` déclare un cron : `{"path": "/api/internal/jobs/purge-scheduled-deletions", "schedule": "0 3 * * *"}`. Vercel appelle cette route par une requête **GET** (comportement natif de Vercel Cron Jobs, jamais POST) à chaque déclenchement.
- La route (`app/api/internal/jobs/purge-scheduled-deletions/route.ts`) expose désormais deux handlers, une seule logique :
  - `GET` : déclenchement automatique (Vercel Cron). Authentifié par `isAuthorizedCronRequest()` (nouveau, `lib/cron-auth.ts`).
  - `POST` : déclenchement manuel Admin, inchangé dans son principe (`requireApiSession()`), conservé uniquement comme filet ponctuel — **le fonctionnement de production ne dépend plus de cette action** (conforme à la mission §3, §8).
- Les deux handlers appellent la même fonction `runPurgeAndLog()`, qui elle-même appelle exclusivement `purgeDueScheduledDeletions()` (`lib/services/project.ts`, inchangée depuis UI-8 FINAL) — **aucune logique de suppression n'a été réécrite** dans la couche scheduler : le scheduler ne fait que déclencher, journaliser, répondre.

## Fréquence

Une fois par jour, à 3h du matin (`0 3 * * *`). Choisie parce que : (a) le job n'a pas besoin de précision à la seconde près (mission §5 : "un Project arrivé à échéance sera traité automatiquement dans un délai raisonnable lors du prochain passage") — un délai maximal de 24h entre l'échéance et la suppression réelle reste raisonnable pour une suppression de compte ; (b) c'est la fréquence réellement compatible avec le déploiement actuel (voir ci-dessous) ; (c) 3h du matin minimise l'impact sur la charge aux heures d'usage réel. Aucune file d'attente n'a été construite : `purgeDueScheduledDeletions()` balaie et traite tous les Projects dus à chaque passage, ce qui suffit à ce volume.

**Contrainte de déploiement réelle, rencontrée et corrigée pendant cette mission** : une première configuration horaire (`0 * * * *`) a été tentée, mais le déploiement Vercel l'a explicitement refusée — "Hobby accounts are limited to daily cron jobs" : ce projet Vercel est sur le plan Hobby, qui limite les Cron Jobs à une exécution par jour maximum (restriction imposée par Vercel, pas par ce code). La fréquence a donc été corrigée à quotidienne pour rester compatible avec le déploiement actuel, conformément à la mission ("fréquence raisonnable compatible avec les possibilités du déploiement actuel"). Passer à une fréquence infra-journalière nécessiterait une mise à niveau vers le plan Pro — décision de facturation, non prise ici.

## Sécurité

- `CRON_SECRET` (nouvelle variable d'environnement, documentée dans `.env.example`, **jamais commitée avec une valeur réelle**) : quand elle est définie sur le projet Vercel, Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` sur les requêtes qu'il déclenche lui-même vers les chemins listés dans `crons` — mécanisme natif de Vercel, aucun code supplémentaire nécessaire côté déclenchement.
- `isAuthorizedCronRequest()` (`lib/cron-auth.ts`) compare l'en-tête reçu au secret attendu avec `crypto.timingSafeEqual` (même pattern que la vérification de signature de session existante, `lib/session.ts`) — jamais une comparaison `===` naïve sur un secret. Si `CRON_SECRET` n'est pas défini, la route refuse systématiquement toute requête `GET` (`401`), elle ne s'ouvre jamais par défaut.
- Sans le secret exact, `GET` renvoie `401` — vérifié par smoke test réel (`curl` sans en-tête → 401 ; en-tête faux → 401 ; en-tête exact → 200).
- `POST` reste protégé par la session Admin existante, inchangée.

## Configuration production

1. Sur le projet Vercel (dashboard → Settings → Environment Variables), définir `CRON_SECRET` avec une valeur aléatoire longue, en environnement Production (et Preview si des crons de preview sont voulus — non nécessaire ici).
2. Déployer avec le `vercel.json` mis à jour : Vercel détecte automatiquement le bloc `crons` et programme l'appel `GET` toutes les heures — aucune configuration supplémentaire dans le dashboard Vercel n'est requise pour la programmation elle-même.
3. Aucune action Admin n'est nécessaire ensuite pour que le cycle +72h fonctionne : programmation (`scheduleDeletion`, existant) → attente → purge automatique (ce mécanisme) → suppression réelle, sans intervention humaine.

## Validation

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **872/872** tests passants (867 avant cette mission + 5 nouveaux dans `tests/purge-scheduled-deletions-route.test.ts`, couvrant : secret correct → autorisé ; secret incorrect → refusé ; en-tête absent → refusé ; `CRON_SECRET` non configuré → toujours refusé ; en-tête vide → refusé). Les tests déjà présents pour `purgeDueScheduledDeletions()` (pas de suppression avant échéance, suppression après échéance, idempotence, annulation avant échéance — ajoutés en UI-8 FINAL) restent inchangés et passent toujours.
- `npm run build` : build de production réussi ; `/api/internal/jobs/purge-scheduled-deletions` toujours listée en route dynamique.
- **Smoke test réel** (serveur de développement local, `CRON_SECRET` de test défini uniquement pour la durée du test) :
  - `GET` sans en-tête `Authorization` → `401`.
  - `GET` avec un secret incorrect → `401`.
  - `GET` avec le secret exact → `200`, `{"ok":true,"deletedCount":0,...}` — `purgeDueScheduledDeletions()` réellement invoquée via le chemin cron.
  - `POST` sans session Admin → `401` (comportement Admin inchangé, vérifié à nouveau après modification du fichier).

Checklist finale de la mission :

- [x] `DELETE_SCHEDULED` reste persistant dans Neon (aucun changement au modèle Project).
- [x] Aucune suppression avant `deleteScheduledAt` (logique de `purgeDueScheduledDeletions()` inchangée).
- [x] Purge réelle après échéance (vérifié par smoke test réel, chemin cron).
- [x] Déclenchement automatique réellement configuré en production (`vercel.json` "crons", horaire).
- [x] Aucune action Admin nécessaire pour que le cycle fonctionne (le `POST` Admin n'est plus qu'un filet manuel optionnel).
- [x] Route/job sécurisé (`CRON_SECRET` + comparaison en temps constant ; session Admin pour le déclenchement manuel).
- [x] Traitement idempotent (inchangé, re-testé).
- [x] Aucun timer mémoire (`setTimeout`/`setInterval`/processus permanent) — le déclenchement vient exclusivement de Vercel Cron, l'échéance reste exclusivement en base.
- [x] TypeScript OK, tests OK (872/872), build OK.
