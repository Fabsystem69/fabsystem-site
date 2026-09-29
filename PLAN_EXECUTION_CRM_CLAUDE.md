# Plan d’exécution et reprise par Claude — CRM FabSystem

Établi avant les modifications du code, le 27 septembre 2026. Point de départ : `afcfc98` ; les deux documents produit étaient déjà non suivis dans Git. Ne pas écraser les changements d’un autre intervenant.

## 1. Lire avant de reprendre

1. `AGENTS.md` : protection du site, règles des domaines et plan obligatoire avant modification Prisma.
2. `AUDIT_INDEPENDANT_FABSYSTEM.md` : preuves et limites, références D1–D14/U1–U5.
3. `PLAN_AMELIORATION_CRM_FABSYSTEM.md` : cible produit et décisions métier.
4. `FICHE_ENTRETIEN_ET_SUIVI_COACHING.md` : trame à convertir en interface après validation du socle.
5. Le journal de réalisation en fin de ce document et `git diff` : seuls les éléments explicitement terminés sont réalisés.

Le présent fichier est un plan de travail modifiable par Claude ou un autre intervenant. Mettre à jour son journal à chaque lot ; ne pas présenter un objectif comme une fonction livrée.

## 2. Décisions confirmées par Fabien

- 5 à 10 clients suivis en même temps, depuis téléphone **et** PC.
- Prospection souvent initiée en MP après une question ou un schéma sur Facebook/groupes.
- Premier entretien de 45–60 minutes : projet, avancement, aisance en bricolage, présentation et proposition ; bilan souvent fait ensemble.
- Pack principalement à 199 €, règlement sur le site via Stripe. Les tarifs évolueront : conserver le montant et le contenu convenus pour chaque accompagnement.
- Mise au propre selon le travail nécessaire et l’accord avec le client ; ne pas appliquer automatiquement l’option de 99 € affichée sur le site.
- Client réalisant le gros du travail et recherchant son matériel ; Fabien accompagne de bout en bout et s’adapte.
- Suivi surtout WhatsApp et petites visios de 2–3 minutes ; une note rapide doit suffire.
- Dossier projet commun, progressivement enrichi, avec vue coach et vue client ; notes internes protégées.
- Besoin prioritaire : fil conducteur, fiche d’entretien et prochaines actions, puis bilan de fin qui aide Fabien à améliorer son offre.
- Aucune durée obligatoire de 90 jours ou limite horaire à introduire sur la base du texte public existant. Harmonisation commerciale distincte.

Autorisation actuelle : plan puis commencement des modifications locales. Pas de déploiement, envoi de message, paiement réel, purge, migration distante ou correction massive de données dans ce travail.

## 3. Exigences téléphone et PC

Recette cible : 360/390 px téléphone, 768 px tablette, 1440 px PC ; zoom/texte agrandi et clavier. Un appareil réel reste nécessaire pour conclure sur iOS/Android.

- Pas de défilement horizontal de la page pour les tâches CRM ; tableaux techniques défilables dans leur propre zone si nécessaire.
- Cibles tactiles principales d’au moins 44 px ; formulaires lisibles, champs à 16 px sur téléphone.
- PC : navigation persistante et espace utile ; téléphone : navigation ouvrable, fermable, focus contenu et restitué.
- Labels associés aux champs, nom accessible des boutons/icônes, focus visible, fermeture Échap des dialogues.
- Sauvegardes explicites, état en cours et résultat ; conflits/erreurs ne doivent pas effacer la saisie.
- Dossier long découpé en composants puis sections ; retour à la section concernée après action.
- Accès client et coach au même projet, avec filtrage serveur des informations privées.

## 4. Lots et ordre de travail

**Clarification impérative de Fabien : fusionner les deux systèmes de suivi existants en un seul.** Un simple lien entre deux outils ne satisfait pas la demande. Aucun troisième système à créer. Les lots gardent leurs lettres pour les références, mais l’ordre est désormais **A → B → D (consolidation) → C (entretien et notes dans le système commun) → E**. Ne pas enrichir durablement deux circuits concurrents.

### A — Première tranche de corrections, sans migration

Périmètre immédiat et vérifiable :

- D1 : retirer les événements navigateur de la page serveur CRM ; contrôles de statut explicites et accessibles. Extraire la section invitation plutôt qu’agrandir la page.
- D2/D3 : parser séparément les champs du formulaire véhicule admin ; conserver les champs absents, convertir les euros en centimes avec validation. Ne pas réparer automatiquement les anciennes données.
- D5 : durée d’invitation annoncée correctement. Préférer une réponse d’action locale au composant à un jeton placé dans l’URL ; conserver la garde admin.
- D6 : extraire la préparation du texte de contact, couvrir les détails type/urgence/contexte dans les tests sans SMTP.
- D9 : aligner transport Server Actions et limite métier des fichiers avec marge multipart ; aucune augmentation de la limite métier.
- D14 : labels du contact et navigation mobile accessibles, contrôles tactiles utilisables au PC comme au téléphone.

Fichiers principaux : `app/dashboard/crm/actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`, `components/dashboard/crm/*`, `lib/coaching-vehicle-form.ts`, `lib/contact-message.ts`, `app/api/contact/route.ts`, `components/ContactForm.tsx`, `components/dashboard/shell/MobileDrawer.tsx`, `next.config.ts`.

Tests requis : conversion 2 000 € → 200 000 centimes, zéro/centimes/valeur invalide, champs absents non effacés, e-mail contenant tous les renseignements, branche RSC interactive corrigée, contrôle d’accès conservé. Vérifier le menu au clavier, les contrôles sans débordement aux largeurs cibles et l’absence de requête externe dans les fixtures.

### B — Intégrité et reprise des opérations existantes

- D7 : mise à jour atomique ID+version, couvrant toutes les voies modifiant les champs partagés ; conflit renvoyé avec saisie récupérable.
- D8 : journal et drapeau de relecture lors des suppressions appareil/usage/matériel.
- D4 : purge conditionnée à un avertissement effectivement envoyé et à son délai ; ne pas perdre les références des fichiers non supprimés.
- D10 : confirmation après paiement et effets critiques durables/rejouables, séparés de l’existence du dossier.
- D13 : retour d’erreur avec valeurs conservées ; pas de perte au changement de section.

Avant ajout de données durables : plan dans `docs/03-DATABASE.md` et décisions associées. Vérifier les sauvegardes, migrations additives et retour arrière. Ne pas déclencher un cron ou un webhook réel pour tester.

### C — Fil conducteur, première livraison métier

- Préparer le plan de données pour les informations d’entretien privées/partagées ; réutiliser les champs existants sans entasser des objets JSON dans une note libre.
- Prospect : origine Facebook/groupe/lien, MP initié, réponse, relance, entretien.
- Fiche d’entretien progressive : projet, avancement, aisance, préoccupations, bilan disponible/manquants, offre convenue, prochaine action.
- Conversion idempotente ; historique conservé ; rattachement prudent du client Stripe.
- Résumé partagé dès le démarrage, sans demander au client de tout ressaisir.
- Note rapide WhatsApp/visio : sujet, conclusion, action/responsable, pièce éventuelle, visibilité. Aucune réservation préalable requise.

Découpage envisagé : `components/dashboard/crm/ProspectIntakeForm`, `CoachingSummary`, `QuickFollowUpForm`, services de prospection/coaching existants. Les noms sont des pistes, pas des fichiers déjà créés.

Critère de sortie : une personne peut reprendre un vrai scénario fictif, depuis le MP jusqu’à une courte visio, sur téléphone et PC, sans changer plusieurs fois de fiche ni recopier une information.

### D — Un seul système de suivi, deux vues selon le rôle

- Consolider `CoachingProject` et `DossierClient` dans un seul suivi métier. `CoachingProject` est le point de départ envisagé, déjà utilisé par le CRM ; documenter les champs et fonctions à reprendre avant de confirmer le plan de données.
- Inventorier les lectures/écritures des deux circuits : activation après paiement, accès client, statuts, notes, documents, événements, notifications et purge. Définir une seule référence et un seul traitement pour chaque responsabilité.
- Reprendre les enregistrements existants avec table de correspondance, essai à blanc, comptages et contrôle des liens/fichiers/droits. Les cas ambigus restent à résoudre explicitement ; aucune fusion au seul nom/e-mail. Une prestation distincte reste un dossier distinct dans le même système.
- Basculer la création après paiement et les actions coach/client vers le parcours commun, avec idempotence. Ne pas entretenir une double écriture permanente.
- Après vérification, retirer les écrans, boutons et traitements devenus doublons ; rediriger les anciennes URLs utiles avec contrôle d’accès. Les anciennes tables peuvent être conservées temporairement pour le retour arrière, sans être un second système actif. Leur suppression physique fera partie d’une migration séparée et documentée.
- Vue coach : résumé, entretien, actions, échanges, dossier technique, documents, commercial.
- Vue client : prochaine action, derniers ajouts, documents déjà envoyés, dernière version partagée et synthèses.
- Brouillon privé distinct de la version partagée ; plusieurs projets accessibles sans masquer l’ancien.
- Prix, périmètre et options historiques conservés quand le tarif de la prochaine vente évolue.

Critères : un achat produit ou rejoint un seul dossier, une seule saisie et un seul état de suivi, aucun second parcours actif pour le même accompagnement ; deux clients isolés, aucun export de notes privées, aucune duplication d’événement ou paiement ; contrôles serveur même avec ID falsifié.

### E — Pilotage, clôture et perfectionnement

- Aujourd’hui : réponses, relectures, rendez-vous, attentes et suivis sans prochaine action.
- Agenda regroupé et report sans perte du compte rendu ; notes spontanées prioritaires sur un calendrier sophistiqué.
- Version finale utile, clôture manuelle/réouverture, bilan « ce qui a aidé / ce qui a pris du temps / à changer pour le prochain client ».
- Temps interne facultatif pour apprendre sur le forfait ; ne pas afficher une marge nette déduite du seul prix et du temps.
- Automatisations et rapports supplémentaires seulement après observation de l’usage du socle.

## 5. Vérification et garde-fous de reprise

- Lire les guides concernés dans `node_modules/next/dist/docs/` avant le code Next.js.
- Ne pas convertir une page entière en composant client pour contourner une erreur RSC.
- Aucun changement de schéma sans plan documenté ; aucune migration de production depuis une commande de build.
- Ne pas ouvrir une page connectée sur une base réelle pour un test présumé en lecture seule : certaines pages créent des données au chargement.
- Tests avec doubles et fixtures, puis environnement isolé pour la recette. Ne pas charger des secrets de production dans un serveur de démonstration.
- Lint ciblé, vérification TypeScript, tests adaptés ; distinguer les défauts déjà présents des régressions introduites.
- Tests d’auth/cart/checkout/webhook/download/snapshots exigés par le dépôt pour les lots commerce.
- Reporter les commandes exactes et résultats. Ne pas déclarer « testé sur téléphone » si seul un viewport ou le CSS a été examiné.
- Avant passage de relais : `git status`, liste de fichiers, changements réalisés, tests, limites et prochaine tâche précise.

## 6. Journal de réalisation

### 27 septembre 2026 — début de tranche A

- Plan d’exécution écrit avant modification de l’application.
- Guides locaux Next.js forms/Server Actions lus ; revue React prévue.
- Tranche A en cours ; B–E non réalisés.
- Aucun accès à une base réelle, aucun déploiement ni action externe autorisé par ce journal.

### 27 septembre 2026 — corrections locales et clarification de la consolidation

**État : code de la tranche A réalisé ; recette navigateur et appareil réel encore requise. B–E non réalisés. La fusion des deux systèmes est planifiée, pas encore implémentée.**

Réalisé :

- Formulaire véhicule : champs absents conservés, objectifs/niveau non écrasés par ce formulaire, budgets euros convertis en centimes, zéro et décimales conservés. Aucune réparation automatique des budgets historiques.
- Page serveur CRM : événements navigateur retirés ; boutons explicites pour enregistrer les statuts ; invitation extraite dans un composant client.
- Invitation : garde admin conservée, réponse locale avec expiration réelle, jeton absent de l’URL du dashboard, copie et état d’erreur. Aucun lien réel généré pendant les tests.
- Contact : type/urgence/contexte transmis au constructeur de message ; labels associés et contraintes de longueur du message alignées avec la validation existante.
- Navigation : dialogue mobile natif, fermeture Échap, focus initial, verrouillage du fond et fermeture au passage PC ; boutons de suppression CRM nommés et cibles de 44 px. Cela ne vaut pas validation complète de l’accessibilité.
- Transport Server Actions réglé à 3 Mo pour un document métier de 2 Mo et son enveloppe ; limite métier inchangée. L’envoi réel de fichier reste à vérifier en environnement isolé.

Fichiers applicatifs : `app/api/contact/route.ts`, `app/dashboard/crm/actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`, `components/ContactForm.tsx`, `components/dashboard/shell/{DashboardShell,MobileDrawer}.tsx`, `components/dashboard/ui/AdminButton.tsx`, `components/dashboard/crm/CoachingInvitation.tsx`, `lib/{coaching-invitation,coaching-vehicle-form,contact-message}.ts`, `next.config.ts`.

Tests ajoutés : `tests/coaching-vehicle-form.test.ts`, `tests/contact-message.test.ts`, `tests/crm-invitation-action.test.ts`.

Vérifications effectuées :

- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts` : **42 tests réussis**.
- `node --import tsx --test tests/crm-invitation-action.test.ts` : **3 tests réussis**, action réelle exécutée avec dépendances simulées (auth refusée, réponse/expiration, erreur du service). Aucun accès DB/SMTP.
- ESLint ciblé sur tous les fichiers applicatifs modifiés et les trois nouveaux tests : réussi.
- `node_modules/.bin/tsc --noEmit --incremental false` : échec global, **45 diagnostics dans les tests existants**. Comparaison par l’API TypeScript avec le contenu `HEAD` des fichiers modifiés : mêmes 45 diagnostics, aucun nouveau. Notamment fixtures sans `includedEditorAccessDays`, champs de projet manquants et doubles de service incomplets. Le dépôt ne dispose donc pas d’un contrôle TypeScript global vert.
- `git diff --check` : réussi.

Limites : pas de build de production, pas de test navigateur de l’application complète ni de recette téléphone/PC. La CLI `agent-browser` n’est pas disponible dans le PATH. Pas de serveur lancé contre une base réelle ; aucune persistance distante ni intégration Stripe/SMTP testée ici. Les changements CSS et dialogue sont relus, pas présentés comme validés sur iPhone/Android. Les limites d’upload et le rendu RSC complet nécessitent encore une recette isolée.

Reprise précise : terminer la recette A avec des données fictives isolées (360/390/768/1440 px, ouverture/fermeture/focus/clavier, invitations simulées, statuts, upload 2 Mo), puis B. Avant les nouvelles fonctions d’entretien, réaliser D : inventaire des deux circuits et plan de consolidation dans les documents de données/architecture existants, afin de travailler ensuite dans un seul système. Conserver les données, autorisations, achats et fichiers ; supprimer les parcours doublons uniquement après bascule vérifiée. Ne pas livrer un simple regroupement visuel comme une fusion terminée.

### Reprise suivante — prompt autonome pour Claude

`PROMPT_REPRISE_CLAUDE_CRM.md` contient le contexte et les instructions de consolidation. Lors de la dernière exploration (sans nouvelle modification applicative), un défaut supplémentaire a été repéré par lecture : les actions client de suppression appareil/matériel vérifient le projet fourni, mais les services suppriment la ressource par ID sans la contraindre à ce projet. Priorité avant bascule : mutation limitée au projet autorisé, tests croisés entre clients, puis examen des autres accès par ID. Ce défaut n’est pas encore corrigé ; aucun scénario offensif n’a été exécuté sur des données réelles.

### 27 septembre 2026 — correction de la suppression hors projet autorisé (défaut n°1)

**État : défaut n°1 corrigé et testé. Défauts n°2 à 5 (concurrence, journalisation, purge, confirmation paiement) non traités. Consolidation D non commencée.**

Réalisé :

- `lib/services/coaching-van-dossier.ts` : `deleteDevice(deviceId, projectId)` charge désormais `projectId` de l’appareil et refuse (403) si différent du `projectId` fourni, avant toute suppression. Signature changée (second paramètre obligatoire).
- `lib/services/coaching-material.ts` : même correction pour `deleteMaterial(materialId, projectId)`.
- Quatre appelants mis à jour pour passer le `projectId` déjà connu : `app/mon-compte/mon-van/actions.ts` (`deleteDeviceAction`, `deleteMaterialAction`, propriété déjà revérifiée par `assertOwnedProject` avant l’appel) et `app/dashboard/crm/actions.ts` (`deleteDeviceAdminAction`, `deleteMaterialAdminAction`, session admin globale — la contrainte ajoutée est une défense en profondeur contre un `projectId` de formulaire désynchronisé, pas une faille corrigée côté coach).
- Recherche des autres mutations par ID accessibles au client (`grep` sur les champs cachés `deviceId`/`materialId`/`usageId`/`scenarioId` dans `app/mon-compte` et `app/dashboard/crm`) : seuls `deleteDeviceAction`/`deleteMaterialAction` exposaient un ID de ressource arbitraire sans contrainte de projet ; `upsertDeviceUsage` côté client ne reçoit qu’un `deviceId` généré côté serveur dans la même requête (jamais un ID choisi par le formulaire). `updateDevice` (service) n’est appelé par aucune route actuellement — laissé tel quel, non prioritaire tant qu’il reste mort.

Fichiers modifiés : `lib/services/coaching-van-dossier.ts`, `lib/services/coaching-material.ts`, `app/mon-compte/mon-van/actions.ts`, `app/dashboard/crm/actions.ts`. Nouveau test : `tests/coaching-cross-project-ownership.test.ts`.

Tests exécutés :

- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts tests/crm-invitation-action.test.ts tests/coaching-cross-project-ownership.test.ts` : **47 tests réussis** (45 précédents + 2 nouveaux). Les deux nouveaux tests chargent le vrai service transpilé (aucune base réelle, `@/lib/prisma` simulé) et prouvent : (1) un `projectId` valide mais ne correspondant pas au propriétaire réel de l’appareil/matériel est rejeté avant toute suppression ; (2) la suppression légitime par le bon propriétaire fonctionne toujours.
- ESLint ciblé sur les 4 fichiers applicatifs modifiés et le nouveau test : réussi, aucun avertissement.
- `node_modules/.bin/tsc --noEmit --incremental false` : **68 diagnostics** globaux (contre 72 en réappliquant un `git stash` des 4 fichiers modifiés, donc mes changements réduisent le nombre de diagnostics de 4, n’en ajoutent aucun). Aucun diagnostic dans les 4 fichiers modifiés ni dans le nouveau test. Le chiffre global a dérivé depuis le dernier relevé (45) sans lien avec ce lot — dérive pré-existante non expliquée, à noter pour une prochaine passe TypeScript globale, pas bloquante pour ce lot.
- `git diff --check` : réussi.

Limites : correction et tests par lecture/service isolé uniquement ; aucun scénario offensif exécuté contre une base réelle, aucune recette navigateur. Les défauts n°2 (écrasements concurrents, y compris `updateCoachingProject`), n°3 (suppressions non journalisées), n°4 (purge) et n°5 (confirmation paiement rejouable) restent à traiter avant la bascule, dans cet ordre d’après `PROMPT_REPRISE_CLAUDE_CRM.md`. La fusion des deux systèmes (étape D) n’a pas commencé.

Prochaine tâche précise : traiter le défaut n°2 — rendre atomique la vérification version+ID dans `coaching-van-dossier.ts` (actuellement version vérifiée puis écriture par ID seul, fenêtre de course entre les deux) et couvrir `updateCoachingProject` s’il modifie objectifs/niveau hors du marqueur véhicule ; conserver la saisie rejetée en cas de conflit.

### 27 septembre 2026 — atomicité version+ID pour les trois sections partagées (défaut n°2, partiel)

**État : `updateVehicleInfo`/`updateUsagesInfo`/`updateImplantationInfo` corrigés et testés. `updateCoachingProject` (objectifs/niveau/statut/notes) n’a toujours AUCUNE vérification de version — c’est un sous-défaut distinct, plan de données requis avant migration, non traité ici. Défauts n°3 à 5 non traités. Consolidation D non commencée.**

Réalisé :

- `lib/services/coaching-van-dossier.ts` : les trois fonctions faisaient un `findUnique` (lecture de la version) puis, séparément, un `update` par ID seul — une écriture concurrente entre les deux pouvait passer inaperçue et être écrasée silencieusement (la vérification et l’écriture n’étaient pas une seule opération atomique). Remplacé par un `updateMany` conditionné sur `{ id, <champ>UpdatedAt: attendu }` : la vérification de version et l’écriture se font maintenant dans la même requête SQL, sans fenêtre entre les deux. Si `count === 0`, une vérification d’existence dédiée distingue « projet introuvable » (404) de « conflit de version » (409), pour ne pas transformer un ID invalide en faux conflit. En cas de succès, la ligne à jour est relue dans la même transaction pour conserver la forme de retour existante (aucun appelant n’utilisait la valeur de retour jusqu’ici — vérifié par recherche).
- Pas de changement de schéma : les champs `vehicleInfoUpdatedAt`/`usagesUpdatedAt`/`implantationUpdatedAt` existaient déjà pour cet usage.

Fichier modifié : `lib/services/coaching-van-dossier.ts`. Nouveau test : `tests/coaching-versioned-update-conflict.test.ts`.

Tests exécutés :

- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts tests/crm-invitation-action.test.ts tests/coaching-cross-project-ownership.test.ts tests/coaching-versioned-update-conflict.test.ts` : **50 tests réussis** (47 précédents + 3 nouveaux, un par section). Chaque nouveau test charge le vrai service transpilé avec un faux `prisma` en mémoire (aucune base réelle) et vérifie dans l’ordre : écriture réussie avec la bonne version, rejeu avec l’ancienne version rejeté sans écraser la valeur déjà enregistrée, nouvelle écriture possible avec la version courante, et projet inexistant renvoyant une erreur dédiée plutôt qu’un conflit trompeur.
- Limite assumée du test : il prouve que le chemin unique (une seule requête conditionnelle) produit les bonnes issues fonctionnelles ; il ne simule pas une vraie concurrence au niveau du moteur SQL (interdit ici : pas de base réelle). L’argument d’atomicité repose sur la structure du code (une seule requête `WHERE id AND version` au lieu de deux requêtes séparées), pas sur un test de course exécuté.
- ESLint ciblé sur le fichier modifié et le nouveau test : réussi.
- `node_modules/.bin/tsc --noEmit --incremental false` : **68 diagnostics**, inchangé par rapport au relevé précédent de ce même lot ; aucun dans `coaching-van-dossier.ts` ni dans le nouveau test.
- `git diff --check` : réussi.

Limites : `updateCoachingProject` (utilisé uniquement par le dashboard coach pour objectifs/niveau/statut/questions/actions/notes internes) reste sans aucune détection de conflit — contrairement aux trois sections corrigées ici, il n’existe pas de champ `xUpdatedAt` dédié pour ce groupe de champs ; en ajouter un est un changement de schéma additif qui doit d’abord être documenté dans `docs/03-DATABASE.md` avant migration, conformément aux garde-fous du dépôt. Aucun scénario de concurrence réelle exécuté contre une base ; aucune recette navigateur.

Prochaine tâche précise : soit (a) documenter et appliquer une migration additive ajoutant un marqueur de version pour `updateCoachingProject` puis appliquer le même correctif, soit (b) passer au défaut n°3 (suppressions appareil/usage/matériel non journalisées) si l’on préfère garder ce lot sans toucher au schéma. Poursuite prévue avec (b) d’abord pour rester sans migration, puis revenir sur `updateCoachingProject` avec son plan de données dédié.

### 27 septembre 2026 — suppressions journalisées (défaut n°3)

**État : suppression d’appareil/usage/matériel journalisée et couplée au marqueur de relecture. `updateCoachingProject` toujours sans version (reporté, changement de schéma). Défauts n°4 et 5 non traités. Consolidation D non commencée.**

Réalisé :

- `lib/services/coaching-van-dossier.ts` : `deleteDevice`, `deleteDeviceUsage` prennent désormais un `actor: CoachingActor` et suppriment dans une transaction qui met aussi à jour `derniereActivite` et appelle `logCoachingProjectEvent` avec une note nommant la ressource (ex. « Appareil supprimé : Frigo »). `logCoachingProjectEvent` bascule déjà `hasChangesSinceReview` quand une relecture a eu lieu — la suppression déclenche donc automatiquement le même besoin de relecture qu’une modification. `deleteDeviceUsage` récupère le `projectId`/nom via la relation `device` (il ne recevait aucun projet en entrée).
- `lib/services/coaching-material.ts` : même traitement pour `deleteMaterial`, note construite à partir de catégorie/marque/référence.
- Callers mis à jour pour passer l’acteur réel : `app/mon-compte/mon-van/actions.ts` (`{ kind: "client" }`), `app/dashboard/crm/actions.ts` (`{ kind: "coach" }` pour `deleteDeviceAdminAction`, `deleteMaterialAdminAction`, `deleteDeviceUsageAction`).
- `deleteScenario` (service) reste sans appelant dans le dépôt — non modifié, pas de risque tant qu’il est mort.

Fichiers modifiés : `lib/services/coaching-van-dossier.ts`, `lib/services/coaching-material.ts`, `app/mon-compte/mon-van/actions.ts`, `app/dashboard/crm/actions.ts`. Test étendu : `tests/coaching-cross-project-ownership.test.ts` (les deux tests du lot précédent couvrent maintenant aussi la journalisation, pas seulement le rejet croisé).

Tests exécutés :

- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts tests/crm-invitation-action.test.ts tests/coaching-cross-project-ownership.test.ts tests/coaching-versioned-update-conflict.test.ts` : **50 tests réussis** (même nombre qu’avant, les deux tests existants ont été enrichis plutôt que dupliqués : ils vérifient maintenant qu’aucun événement n’est journalisé pour une tentative croisée rejetée, et qu’une suppression légitime met à jour `derniereActivite` et crée un événement `DEVICE`/`MATERIAL` nommant la ressource).
- ESLint ciblé sur les 4 fichiers applicatifs et le test modifié : réussi.
- `node_modules/.bin/tsc --noEmit --incremental false` : retombé à **68 diagnostics** (une régression passagère à 73 dans le test, due à `assert.deepEqual(events, [])` qui étroitise le type de `events` en `never[]` via le typage TS de `assert.strict.deepEqual` — corrigé en `assert.equal(events.length, 0, …)`). Aucun diagnostic dans les fichiers applicatifs modifiés.
- `git diff --check` : réussi.

Limites : logique testée par service isolé (faux `prisma`/`logCoachingProjectEvent`), pas par une vraie base ; aucune recette navigateur. Le journal (`CoachingProjectEvent`) et le drapeau `hasChangesSinceReview` sont maintenant alimentés pour ces suppressions, mais leur affichage réel dans les écrans dashboard/compte client n’a pas été revérifié visuellement dans ce lot.

Prochaine tâche précise : défaut n°4 — purge : conditionner la suppression physique à un avertissement effectivement envoyé (preuve durable) et à son délai, sans perdre la référence DB d’un fichier non supprimé. Localiser le code de purge (`lib/services/dossier-notifications.ts` et son cron, cité dans `PROMPT_REPRISE_CLAUDE_CRM.md`) avant de modifier.

### 27 septembre 2026 — purge conditionnée à un avertissement confirmé (défaut n°4)

**État : défaut n°4 corrigé et testé, avec une migration additive appliquée au schéma (première de ce lot). Défaut n°5 (confirmation paiement rejouable) non traité. Consolidation D non commencée. De nouvelles précisions de Fabien sont arrivées pendant ce lot (voir note en fin de journal) — lues mais pas encore traitées.**

Réalisé :

- Constat confirmé par lecture de `lib/services/dossier-notifications.ts` : (1) la purge effective (~12 mois) ne vérifiait que `dateLivraison`, jamais si l’avertissement (~11 mois) avait réellement été envoyé avec succès — le seul garde-fou était un `tryAcquireCooldown` posé **avant** la tentative d’envoi, donc consommé pour ~12 mois même en cas d’échec, et de toute façon jamais consulté par la requête de purge ; (2) une suppression physique de fichier échouée n’empêchait pas la suppression de la ligne `DossierDocument` correspondante (`deleteMany` portait sur tout le dossier), perdant la seule référence permettant de retrouver ou retenter ce fichier.
- Ajout d’un champ additif `purgeWarningSentAt DateTime?` sur `DossierClient` (nullable, sans defaut rétroactif) — plan documenté dans `docs/03-DATABASE.md` avant modification du schéma, migration écrite à la main sous `prisma/migrations/20260927160000_add_dossier_purge_warning_marker/migration.sql` (`ALTER TABLE ... ADD COLUMN`, additive). **Migration non appliquée à une base réelle** : `npx prisma validate` et `npx prisma generate` exécutés (aucun des deux ne se connecte à une base — confirmé par le message « Prisma config detected, skipping environment variable loading »), mais pas `prisma migrate dev`/`deploy`, conformément à l’interdiction d’accéder à une base réelle.
- `lib/services/dossier-notifications.ts` : l’avertissement (4a) n’écrit `purgeWarningSentAt` qu’après un envoi confirmé réussi (jamais avant tentative), et le filtre `purgeWarningSentAt: null` évite de le renvoyer une fois confirmé tout en permettant un nouvel essai automatique le lendemain tant qu’aucun envoi n’a réussi. La purge effective (4b) exige maintenant `purgeWarningSentAt` non nul et vieux d’au moins le délai annoncé (30 jours), en plus de `dateLivraison` — un avertissement jamais confirmé bloque désormais la purge au lieu d’être ignoré. Chaque document est supprimé du stockage individuellement ; seuls ceux réellement supprimés perdent leur ligne `DossierDocument` (`deleteMany` restreint aux IDs confirmés) ; un dossier partiellement purgé n’incrémente pas `dossiersPurged` et son événement précise « X/Y … le reste sera retenté », laissant les fichiers en échec disponibles pour un nouveau passage du cron.

Fichiers modifiés : `prisma/schema.prisma`, `docs/03-DATABASE.md`, `lib/services/dossier-notifications.ts`. Nouveaux : `prisma/migrations/20260927160000_add_dossier_purge_warning_marker/migration.sql`, `tests/dossier-purge-safety.test.ts`.

Tests exécutés :

- `npx prisma validate` : schéma valide (aucune connexion base).
- `npx prisma generate` : client régénéré dans `lib/generated/prisma` (gitignored, aucune connexion base) pour que le typage TypeScript du nouveau champ soit disponible.
- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts tests/crm-invitation-action.test.ts tests/coaching-cross-project-ownership.test.ts tests/coaching-versioned-update-conflict.test.ts tests/dossier-purge-safety.test.ts` : **52 tests réussis** (50 précédents + 2 nouveaux). Les deux nouveaux chargent le vrai service transpilé avec un faux `prisma` en mémoire (table de dossiers/documents simulée, aucune base réelle, aucun envoi réel) et prouvent : un dossier livré depuis plus d’un an mais sans avertissement confirmé n’est pas purgé même si l’avertissement part ce jour-là (juste posé, donc pas encore « assez ancien ») ; et pour un dossier dont un fichier sur deux échoue à la suppression physique, seul le fichier réellement supprimé perd sa ligne en base, le dossier n’est pas compté comme purgé, et l’événement journalisé dit explicitement « 1/2 … le reste sera retenté ».
- Piège rencontré et corrigé pendant l’écriture du test : `vm.runInNewContext` ne fournit pas `process` par défaut, ce qui faisait échouer silencieusement `resolveFromAddress()` (`process.env`) et était avalé par le `.catch(() => [])` du service, masquant le vrai résultat (`purgeWarningsSent` restait à 0 sans erreur visible) — corrigé en injectant `process` dans le contexte vm du test.
- ESLint ciblé sur les fichiers applicatifs modifiés et le nouveau test : réussi (avertissement neutre « fichier ignoré » sur `schema.prisma`, qui n’a pas de config ESLint — attendu, pas une erreur).
- `node_modules/.bin/tsc --noEmit --incremental false` : **68 diagnostics**, inchangé, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

Limites : migration écrite à la main et validée hors-ligne (schéma + génération client), jamais appliquée à une base, réelle ou de développement — aucune preuve d’exécution SQL réussie dans cet environnement. Aucun scénario réel de purge exécuté (interdit). La cohérence entre le nouveau champ et l’éventuel futur modèle unifié (étape D) reste à revérifier une fois le plan de consolidation écrit, puisque `DossierClient` est justement l’un des deux systèmes à fusionner.

Note reçue en cours de lot (non traitée ici, à lire avant d’écrire le plan de consolidation) : Fabien a ajouté trois documents pendant ce travail — `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md` (le coaching doit couvrir van/fourgon, camping-car ET bateau dans le même système ; `ProjectAssetType` a déjà `BOAT`/`VAN`/`MOTORHOME`/`OTHER`, à réutiliser), `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md` (le dashboard attribue déjà un éditeur de schéma à un client via `Project`/`ProjectSchema` — l’intégrer au modèle commun au lieu de ne considérer que `DossierClient`/`CoachingProject`, pas de second éditeur), et `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` (parcours guidé, clientèle peu à l’aise avec l’informatique). Consigne explicite de Fabien : terminer d’abord la mission de sécurisation en cours (fait pour les défauts 1 à 4), puis lire ces trois documents avant de figer le modèle de consolidation — ce sont des compléments à la même mission, pas de nouvelles missions.

Prochaine tâche précise : lire `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md`, `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md` et `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` en entier, puis traiter le défaut n°5 (confirmation paiement rejouable, `stripe-webhook-commerce.ts`) pour clore la sécurisation du lot B, avant d’écrire le plan de consolidation (étape D) qui devra désormais intégrer `Project`/`ProjectSchema`/l’éditeur existant et le support multi-véhicules dès sa conception, pas seulement `DossierClient`/`CoachingProject`.

### 27 septembre 2026 — confirmation post-achat rejouable (défaut n°5) — lot B terminé

**État : les 5 défauts listés dans `PROMPT_REPRISE_CLAUDE_CRM.md` (« Défauts à traiter avant la bascule ») sont maintenant corrigés et testés en isolation. Lot B (« Sécuriser les mutations et les risques de perte ») terminé au sens code+tests ciblés — recette navigateur/téléphone réelle toujours à faire séparément. Trois documents complémentaires de Fabien ont été lus en entier (résumés ci-dessous) ; ils doivent façonner le plan de consolidation (étape D) avant tout schéma définitif, pas encore écrits.**

Réalisé :

- Constat confirmé par lecture de `lib/services/dossier-client.ts` (`createDossierClientForOrder`, appelée par `stripe-webhook-commerce.ts` à chaque `checkout.session.completed`, y compris en redelivery Stripe) : la fonction retournait dès que le `DossierClient` existait déjà pour cette commande (idempotence par `orderId` unique) — **avant même de tenter l'envoi de l'e-mail de confirmation**. Un envoi initial en échec (le `catch` se contentait de logger) ne pouvait donc plus jamais être retenté par aucune redelivery Stripe ultérieure : le test d'existence coupait court avant d'atteindre le code d'envoi.
- Ajout d'un champ additif `confirmationEmailSentAt DateTime?` sur `DossierClient` (même famille que `purgeWarningSentAt`), écrit uniquement après un envoi confirmé réussi. Plan documenté dans `docs/03-DATABASE.md` avant modification du schéma ; migration écrite à la main sous `prisma/migrations/20260927163000_add_dossier_confirmation_email_marker/migration.sql` (additive, `ADD COLUMN` nullable). Même limite que le lot précédent : migration validée hors-ligne (`npx prisma validate`, `npx prisma generate` — aucun des deux ne se connecte à une base) mais jamais appliquée à une base réelle ou de développement.
- `lib/services/dossier-client.ts` : quand le dossier existe déjà mais que `confirmationEmailSentAt` est encore nul, le service retente l'envoi au lieu de s'arrêter au seul test d'existence, en réutilisant la redelivery Stripe déjà en place comme mécanique de rejeu (aucun second moteur de paiement ni file d'attente ajoutés). Aucune deuxième ligne `DossierClient` n'est créée lors d'un rejeu.

Fichiers modifiés : `prisma/schema.prisma`, `docs/03-DATABASE.md`, `lib/services/dossier-client.ts`. Nouveaux : `prisma/migrations/20260927163000_add_dossier_confirmation_email_marker/migration.sql`, `tests/dossier-confirmation-email-retry.test.ts`.

Tests exécutés :

- `npx prisma validate` puis `npx prisma generate` : schéma valide, client régénéré (gitignored), aucune connexion base.
- `node --import tsx --test tests/coaching-vehicle-form.test.ts tests/contact-message.test.ts tests/contact-request.test.ts tests/customer-auth-service.test.ts tests/session.test.ts tests/coaching-consumption.test.ts tests/crm-invitation-action.test.ts tests/coaching-cross-project-ownership.test.ts tests/coaching-versioned-update-conflict.test.ts tests/dossier-purge-safety.test.ts tests/dossier-confirmation-email-retry.test.ts` : **54 tests réussis** (52 précédents + 2 nouveaux). Les deux nouveaux chargent le vrai service transpilé avec un faux `prisma`/`sendMailImpl` en mémoire (aucune base réelle, aucun envoi réel) et prouvent : un rejeu après un envoi réussi ne renvoie pas l'e-mail (pas de duplication) ; un rejeu après un envoi initial en échec retente et réussit, sans jamais créer un second dossier pour la même commande.
- ESLint ciblé sur les fichiers modifiés et le nouveau test : réussi.
- `node_modules/.bin/tsc --noEmit --incremental false` : **68 diagnostics**, inchangé, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

Limites : comme pour le défaut n°4, la migration n'a jamais tourné contre une vraie base ; aucun webhook Stripe réel déclenché ; aucune recette navigateur. La cohérence de ces deux nouveaux champs `DossierClient` avec le futur modèle unifié (étape D) reste à revérifier une fois ce plan écrit, puisque `DossierClient` est l'un des deux systèmes à fusionner — ils ne doivent pas être perdus ni dupliqués lors de la reprise des données.

**Résumé des trois documents complémentaires lus (contenu complet conservé dans les fichiers eux-mêmes, non recopié ici) :**

1. `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md` — le coaching doit couvrir van/fourgon, camping-car, bateau et « autre » (y compris « pas encore su ») dans le même système, jamais un second outil. `Customer.assetType`/`AssetType` et `Project.assetType`/`ProjectAssetType` existent déjà côté éditeur ; `CoachingProject` a déjà des champs véhicule (`vehicleBrand`, etc.). Le type doit être porté par le dossier/projet accompagné, pas par le client (une même personne peut avoir un van puis un bateau) ; pas de nouvel enum concurrent si l'existant convient ; pas de rétro-déduction automatique du type depuis une ancienne URL `/mon-van/`. Recette attendue : van/camping-car/bateau dans le même parcours, un client avec deux projets de supports différents, ancien dossier sans type lisible sans valeur inventée, changement de type sans perte de champs masqués, export/révision cohérents avec anciennes révisions immuables et lisibles.
2. `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md` — le dashboard attribue déjà un vrai éditeur de schéma à un client via `Project`/`ProjectSchema` (`app/dashboard/customers/[id]/actions.ts:createProjectForCustomerAction`, `lib/services/project.ts:createProjectForCustomerByAdmin`, `lib/services/project-schema.ts`, `app/mon-compte/projets/[projectId]/page.tsx`, composants `AdminProjectSwitcher`/`SaveToProjectMenu`/`SharedSchemaViewer`/`ShareSchemaDialog`). Le plan de consolidation ne doit **pas** se limiter à `DossierClient`/`CoachingProject` : `Project`/`ProjectSchema` portent le vrai travail technique et doivent entrer dans la cartographie. Aucun second éditeur, pas de copie indépendante de nœuds/câbles dans le CRM ; réutiliser les actions « Créer/Ouvrir le schéma » existantes avec rattachement explicite ; ne pas associer automatiquement tous les projets d'un client à tous ses accompagnements (deux projets peuvent être deux prestations distinctes). La séparation « brouillon privé → version figée partagée » suggérée précédemment par Codex n'est qu'une piste à examiner, pas une exigence confirmée — vérifier d'abord les versions/partages déjà existants avant d'ajouter quoi que ce soit.
3. `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` — clientèle coaching majoritairement peu à l'aise avec l'informatique (souvent 60+ ans) : dossier simple, une action principale par écran, français courant sans jargon interne (CRM/pipeline/snapshot/upload/ID), labels toujours visibles, confirmations explicites après action, conservation de la saisie en cas d'erreur/conflit/session expirée, cibles tactiles ≥44px, contraste et focus clavier vérifiés, aucune fausse progression ni validation technique déduite d'un champ rempli. Ordre de traitement explicite donné par Fabien dans ce document : (1) terminer le lot en cours [fait], (2) poursuivre la consolidation en un seul système, (3) appliquer le multi-support, (4) appliquer ces exigences d'accessibilité **dans la même modification** des écrans communs plutôt que trois refontes successives, (5) livrer fil conducteur d'entretien + note rapide + parcours client guidé. Recette attendue inclut un test d'usage réel avec quelques utilisateurs représentatifs (observation, pas de score inventé).

Prochaine tâche précise : écrire le plan de consolidation (étape D du plan d'exécution) dans `docs/03-DATABASE.md`/`docs/02-ARCHITECTURE.md`, en intégrant dès la conception : (a) la fusion `DossierClient`+`CoachingProject`, (b) `Project`/`ProjectSchema`/l'éditeur existant comme composant de premier ordre du dossier unifié (pas un système à part), (c) un type de support porté par le dossier/projet (réutilisant `ProjectAssetType`/`AssetType` existants plutôt qu'un nouvel enum), (d) les contraintes d'accessibilité/guidage comme exigence transverse des écrans du dossier unifié, pas une passe séparée. Ce plan doit rester un document de décisions (correspondances champs/états, cardinalités réelles, visibilité privée/partagée) — aucune migration ni écran ne doit être construit avant qu'il soit écrit et cohérent avec les trois documents complémentaires.

### 27 septembre 2026 — plan de consolidation écrit (étape D du plan d'exécution)

**État : plan de données complet écrit dans `docs/03-DATABASE.md` (« Plan de consolidation CRM »), avant tout schéma définitif. `CoachingProject` confirmé comme dossier pivot ; `Project`/`ProjectSchema` explicitement intégré par lien plutôt qu'absorbé ; type de support et exigence d'accessibilité pris en compte dès cette étape. Douze points ouverts explicitement listés en fin de section (§12), non tranchés.**

Contenu (voir le document lui-même pour le détail complet, non recopié ici) : décision du modèle pivot, table de correspondance champ par champ `DossierClient` → `CoachingProject` (y compris `DossierEvent`/`DossierDocument`/`DossierAppointment` → `CoachingProjectEvent`/`CoachingProjectDocument`/`CoachingSession`, avec préservation explicite de l'UID ICS), intégration `Project`/`ProjectSchema` par référence 1:1 optionnelle sans toucher à `CoachingCircuit`/`CoachingSchemaRevision` (rôle différent, complémentaire), réutilisation de `ProjectAssetType` (pas `Customer.assetType`) pour le support, préservation des deux parcours commerciaux distincts (`orderId` Stripe vs `CoachingProposal` négocié), règle de visibilité privée/partagée, ordre de bascule en 6 étapes avec coexistence temporaire, et rappel que l'accessibilité doit être conçue avec les écrans unifiés plutôt qu'en refonte séparée.

Fichier modifié : `docs/03-DATABASE.md` (nouvelle section « Plan de consolidation CRM »).

Limites : document de décisions uniquement à ce stade de rédaction — aucun code, aucun schéma. Douze points explicitement non tranchés (cardinalité Project↔CoachingProject si multi-schémas, devenir de la timeline figée `etapeActuelle`/`etapeOverride`, politique de conservation post-clôture, critère de sortie de la coexistence temporaire).

### 27 septembre 2026 — étape 3 : champs additifs + script de reprise idempotent

**État : les champs additifs du plan sont ajoutés au schéma (migration écrite, validée hors-ligne, non appliquée à une base). Le script de reprise (`lib/services/coaching-dossier-migration.ts`) est écrit et testé en isolation : simulation à blanc, comptages, cas ambigus signalés — mais jamais exécuté sur de vraies données, et aucune bascule d'écriture applicative (webhook, actions CRM) n'a encore lieu. Étape 4 (bascule) non commencée.**

Réalisé :

- `prisma/schema.prisma` : ajout de 23 champs additifs à `CoachingProject` (bloc `orderId`/`offre`/`whatsapp`/`statutSimple`/`compteRendu`/`etapeActuelle`/`etapeOverride`/`iterationCount`/`dateLivraison`/`consentementPartage(At)`/`temoignageDemande`/`temoignageRecu`/`j30MessageEnvoye`/`purgeWarningSentAt`/`confirmationEmailSentAt`/`besoin*`, plus `assetType ProjectAssetType?` et `linkedProjectId`/`linkedProject` vers `Project`), et `legacyDossierAppointmentId String? @unique` sur `CoachingSession`. Relations réciproques ajoutées sur `Order.coachingProject` et `Project.linkedCoachingProject`. Tout est nullable ou à valeur par défaut neutre — aucune donnée existante modifiée, aucun champ rendu obligatoire.
- `npx prisma validate` (schéma valide) et `npx prisma format` puis `npx prisma generate` exécutés — aucun ne se connecte à une base (confirmé par « Prisma config detected, skipping environment variable loading »). Migration écrite à la main en miroir exact du style généré par Prisma (`ALTER TABLE ... ADD COLUMN` alphabétique, `CREATE UNIQUE INDEX`, `ADD CONSTRAINT ... FOREIGN KEY`) : `prisma/migrations/20260927170000_add_coaching_project_dossier_fusion_fields/migration.sql`. **Jamais appliquée à une base réelle ou de développement.**
- `lib/services/coaching-dossier-migration.ts` : `planOrRunDossierClientMigration({ dryRun })` lit tous les `DossierClient` (+ satellites) et pour chacun : (a) si `orderId` est nul (dossier « découverte », créé manuellement) → toujours signalé `ambiguous_no_order`, jamais migré automatiquement (aucun identifiant fort pour distinguer d'un `CoachingProject` CRM existant) ; (b) si un `CoachingProject` a déjà cet `orderId` → `already_migrated` (idempotence) ; (c) si un ou plusieurs `CoachingProject` existent déjà pour ce client sans commande liée → `ambiguous_existing_candidates` avec la liste des candidats, jamais fusionné par supposition ; (d) sinon, cas limpide → `would_create` en mode simulation, ou création réelle (`CoachingProject` + `CoachingProjectEvent` préfixés `LEGACY_DOSSIER:`, `CoachingProjectDocument` avec détection de collision `bucket+path` — un document en conflit est ignoré et signalé dans `documentConflicts`, jamais écrasé — et `CoachingSession` avec `legacyDossierAppointmentId` et statut déduit de la présence d'un compte-rendu, jamais une annulation inventée).

Fichiers modifiés : `prisma/schema.prisma`. Nouveaux : `prisma/migrations/20260927170000_add_coaching_project_dossier_fusion_fields/migration.sql`, `lib/services/coaching-dossier-migration.ts`, `tests/coaching-dossier-migration.test.ts`.

Tests exécutés :

- `npx prisma validate`/`format`/`generate` : OK, aucune connexion base.
- `node --import tsx --test [...11 fichiers de tests ciblés...]` : **57 tests réussis** (54 précédents + 3 nouveaux). Les trois nouveaux chargent le vrai service transpilé avec un faux `prisma` en mémoire (aucune base réelle) et prouvent : un dry run ne fait strictement aucune écriture quel que soit le cas ; le cas limpide crée le dossier avec ses événements/documents/rendez-vous correctement mappés (préfixe d'événement, UID de rendez-vous préservé, statut de séance déduit sans invention) ; rejouer après une création réelle est idempotent (aucun doublon, toujours détecté via l'`orderId` unique) ; un document en collision de chemin de stockage est ignoré et signalé sans écraser l'existant.
- Piège rencontré : `assert.deepEqual` sur un tableau construit à l'intérieur du module chargé en `vm.runInNewContext` échoue (« same structure but not reference-equal ») car ce tableau appartient à un autre *realm* JavaScript que le tableau de comparaison du test — corrigé par `Array.from(...)` avant comparaison.
- ESLint ciblé et `tsc --noEmit` : réussis, **68 diagnostics** globaux inchangés, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

Limites (importantes) : ce script n'a **jamais tourné sur de vraies données** — ni volumétrie réelle, ni cas réellement ambigus observés, ni vérification que les décisions heuristiques (statut de séance déduit du compte-rendu, préfixe d'événement) conviennent à Fabien à l'usage. Aucune résolution des cas ambigus n'est implémentée (`ambiguous_no_order`/`ambiguous_existing_candidates` sont seulement détectés et rapportés, pas traités) — ce sera nécessaire avant une reprise réelle. Aucun appel n'existe encore pour déclencher ce script depuis une route/CLI interne : il est prêt à être invoqué manuellement en environnement isolé, pas encore câblé. Aucune bascule d'écriture (étape 4) n'a eu lieu : le webhook Stripe et les actions CRM écrivent toujours exclusivement sur `DossierClient`/`CoachingProject` comme avant ce lot.

Prochaine tâche précise : soit (a) écrire la résolution assistée des cas ambigus (fonction dédiée prenant une décision explicite par dossier, jamais automatique), soit (b) commencer l'étape 4 (bascule d'écriture du webhook Stripe et des actions CRM vers le parcours unique) pour les seuls dossiers déjà clairement migrables. Poursuite prévue avec (b), en laissant (a) comme outil manuel pour les cas ambigus détectés par la simulation à blanc.

### 27 septembre 2026 — étape 4 (partielle) : pont de création, jamais un remplacement des écrans existants

**Constat important avant d'agir : `lib/services/dossier-client.ts` (515 lignes) est lu par ~10 fichiers d'écrans/routes (`app/dashboard/accompagnements/*`, `app/mon-compte/mon-accompagnement/*`, `app/mon-compte/page.tsx`, `app/api/calendar/accompagnements.ics`, `app/api/dossiers/documents/*`), presque tous via ce seul service (bonne nouvelle), mais `DossierEvent`/`DossierAppointment` n'ont pas la même forme que `CoachingProjectEvent`/`CoachingSession` (pas de `fromEtape`/`toEtape`, compte-rendu en un seul champ texte vs quatre champs structurés). Réécrire ces écrans à l'aveugle, sans base de données réelle ni navigateur pour vérifier le rendu, aurait un risque réel de régression silencieuse sur un parcours de paiement en production — refusé pour cette raison, pas par manque de temps.**

Décision prise à la place, plus sûre et quand même utile immédiatement : **un pont de création, additif, jamais un remplacement.** `createDossierClientForOrder` continue de créer/mettre à jour `DossierClient` exactement comme avant (zéro changement de comportement, zéro écran touché) ; juste après, il rattache ou crée désormais aussi le `CoachingProject` correspondant, pour que tout nouvel achat alimente déjà le modèle unifié sans attendre une reprise en masse ultérieure. Un échec ou un cas ambigu de ce rattachement est journalisé mais **ne casse jamais** la création du dossier ni l'envoi de l'e-mail de confirmation (déjà traités avant, inchangés).

Réalisé :

- `lib/services/coaching-dossier-migration.ts` : logique par-dossier extraite dans `migrateOneDossierClient(dossierId, { dryRun })`, réutilisée à la fois par le comptage en masse (`planOrRunDossierClientMigration`, inchangé côté résultat) et par le nouveau pont. Une seule logique de correspondance, jamais deux versions qui pourraient diverger.
- `lib/services/dossier-client.ts` : `createDossierClientForOrder` appelle `migrateOneDossierClient(dossier.id, { dryRun: false })` juste après la création/le rejeu du dossier et l'e-mail, dans son propre `try/catch`.

Fichiers modifiés : `lib/services/coaching-dossier-migration.ts`, `lib/services/dossier-client.ts`. Nouveau test : `tests/dossier-client-coaching-sync.test.ts`.

Tests exécutés :

- `node --import tsx --test [...13 fichiers de tests ciblés...]` : **59 tests réussis** (57 précédents + 2 nouveaux). Les deux nouveaux chargent le vrai service transpilé et prouvent : un nouvel achat rattache bien son `CoachingProject` (via le mock de `migrateOneDossierClient`) ; un échec ou une ambiguïté de ce rattachement est journalisé sans jamais changer le statut retourné par `createDossierClientForOrder` ni empêcher la création du dossier.
- Les 3 tests existants de `coaching-dossier-migration.test.ts` ont été adaptés au refactor (le faux `prisma.dossierClient` expose maintenant `findMany` — retournant uniquement des IDs — et `findUnique` par ID, au lieu d'un seul `findMany` avec tous les satellites inclus) : toujours 3/3 réussis, même comportement observable.
- ESLint ciblé et `tsc --noEmit` : réussis, **68 diagnostics** globaux inchangés, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

**Limite importante, à ne pas perdre de vue :** ce pont ne fait qu'un instantané à la création. Aucune des ~12 fonctions de mutation ultérieure de `dossier-client.ts` (`updateDossierSimpleStatus`, `advanceDossierStep`, `addDossierIteration`, `setDossierWhatsapp`, `setDossierDelivered`, `addDossierDocument`, `createDossierAppointment`, etc.) ne répercute encore ses changements sur le `CoachingProject` lié : un dossier modifié après sa création divergera de son double tant que la bascule complète (réécriture des écrans, hors de ce lot) n'est pas faite. C'est un choix assumé (le risque d'une synchronisation bidirectionnelle mécanique sur 12 fonctions dépassait la valeur immédiate), pas un oubli — à corriger explicitement avant de considérer `CoachingProject` comme une source fiable pour un dossier déjà modifié après achat.

Réévaluation de priorité : au vu de `PLAN_AMELIORATION_CRM_FABSYSTEM.md` (« après les réparations, la première livraison métier doit réunir la fiche d'entretien, le dossier partagé et la note rapide... ne pas retarder ces trois fonctions essentielles ») et du risque réel d'une réécriture d'écrans sans navigateur pour vérifier, la suite privilégiée n'est pas d'achever la synchronisation bidirectionnelle mécanique ni la réécriture des écrans existants à l'aveugle, mais de commencer la fiche d'entretien (couche service/données, testée) directement sur `CoachingProject` — la fonctionnalité explicitement désignée comme prioritaire par Fabien, et la plus sûre à construire sans environnement de recette.

Prochaine tâche précise : concevoir et implémenter la couche service de la fiche d'entretien progressive (projet/support, avancement, aisance, préoccupations, bilan disponible/manquants, offre convenue, prochaine action — voir `FICHE_ENTRETIEN_ET_SUIVI_COACHING.md` et §1 de `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md`) sur `CoachingProject`, avec validation serveur, permission « je ne sais pas », et tests isolés. Pas d'écran avant que la couche de données soit posée et validée.

### 27 septembre 2026 — couche de données de la fiche d'entretien et de la note rapide

**État : première brique de données pour la fiche d'entretien (`FICHE_ENTRETIEN_ET_SUIVI_COACHING.md`) posée sur `CoachingProject`/`CoachingSession`/`CoachingActionItem`, testée en isolation. Volontairement minimal — voir « Ce qui n'a pas été fait » ci-dessous. Toujours aucun écran.**

Analyse préalable (lecture, pas de code) : la plupart des sections de la fiche sont déjà couvertes par des champs existants — `Prospect` couvre déjà entièrement la §1 (origine Facebook, lien, notesInternes, prochaine action datée) ; `vehicleBrand`/`projectStage`/`niveauClient`/`whoDoesTheWork`/`startDeadline` couvrent l'essentiel de la §2 "projet et avancement/aisance" ; `CoachingActionItem` couvrait déjà libellé/échéance/état. Manquaient réellement : les préoccupations du client, l'accord commercial *spécifique à ce client* (prix réel/périmètre/mise au propre — distinct du produit `offre` générique), un résumé explicitement partagé au client, le responsable d'une action (coach ou client), et un moyen de noter un échange WhatsApp/visio de 2-3 minutes sans créer un rendez-vous fictif. Conformément à l'avertissement du document lui-même (« essai avant développement... ne conserver que les champs réellement utiles »), je n'ai PAS transformé chaque ligne de la fiche en colonne de base de données — seulement ces manques réels.

Réalisé :

- `prisma/schema.prisma` : nouvel enum `CoachingResponsible` (`COACH`/`CLIENT`) ; `CoachingActionItem.responsible` (nullable, additif) ; nouveau bloc `CoachingProject` « Fiche d'entretien / accord commercial » (`preoccupations`, `accordPrixCents`, `accordPerimetre`, `accordMiseAuPropre`, `resumePartage`, `entretienUpdatedAt`) — `resumePartage` est explicitement le seul champ de ce bloc destiné à être montré au client (même convention que `objectifs`, déjà affiché sur `/mon-compte/mon-van`), documenté comme tel ; les autres restent privés par simple omission des écrans client, comme `notesInternes` déjà aujourd'hui. `CoachingSession.channel` (libre : WhatsApp/visio/appel/autre) et `CoachingSession.sharedWithClient` (booléen, faux par défaut) pour la note rapide.
- `lib/services/coaching-project.ts` : `updateEntretienInfo` reprend exactement la garantie d'atomicité version+ID du correctif du défaut n°2 (`updateMany` conditionné, jamais lecture-puis-écriture séparées), valide `accordPrixCents` (entier positif), journalise un événement `ENTRETIEN`. `createCoachingActionItem` accepte désormais `responsible` (facultatif, jamais une valeur inventée si absent). Nouvelle fonction `addQuickCoachingNote` : une seule opération transactionnelle crée une `CoachingSession` déjà `REALISEE` (jamais un rendez-vous fictif à venir, conformément à « une visio de 2-3 minutes ne doit nécessiter ni création préalable de rendez-vous ni long compte-rendu ») et, si fournie, la `CoachingActionItem` qui en découle, avec journalisation `QUICK_NOTE`.

Fichiers modifiés : `prisma/schema.prisma`, `lib/services/coaching-project.ts`. Nouveaux : `prisma/migrations/20260927180000_add_coaching_entretien_and_action_responsible/migration.sql`, `prisma/migrations/20260927190000_add_coaching_session_channel_and_visibility/migration.sql`, `tests/coaching-entretien-info.test.ts`.

Tests exécutés :

- `npx prisma validate`/`format`/`generate` : OK, aucune connexion base (confirmé par le message de saut de chargement des variables d'environnement).
- `node --import tsx --test [...14 fichiers ciblés...]` : **64 tests réussis** (59 précédents + 5 nouveaux). Les cinq nouveaux, sur le vrai service transpilé avec un faux `prisma` en mémoire : version+ID vérifiés atomiquement pour `updateEntretienInfo` (succès, conflit sans écrasement, projet introuvable) ; prix convenu négatif refusé ; `responsible` correctement enregistré ou laissé `null` sans invention ; `addQuickCoachingNote` crée en une seule opération une séance `REALISEE` + l'action liée, privée par défaut, journalisée ; sans action fournie, aucune `CoachingActionItem` n'est créée.
- ESLint ciblé et `tsc --noEmit` : réussis, **68 diagnostics** globaux inchangés, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

Ce qui n'a pas été fait (explicitement, pour ne pas laisser croire à une fonctionnalité livrée) :

- **Aucun écran.** Ni fiche d'entretien affichée, ni bouton « Note rapide », ni affichage du résumé partagé côté client. Uniquement la couche de données et les fonctions de service, prêtes à être appelées par une future action serveur.
- **Aucune action serveur (`app/dashboard/crm/actions.ts`) n'appelle encore `updateEntretienInfo`/`addQuickCoachingNote`.** `createCoachingActionItem` (déjà appelée en production) accepte le nouveau paramètre `responsible` mais l'appelant existant ne le fournit pas encore — comportement inchangé pour lui.
- La §1 de la fiche (prospection) et la majorité de la §2 (projet/aisance) n'ont nécessité aucun nouveau champ — déjà couvertes, à vérifier néanmoins à l'usage réel avant de les considérer suffisantes.
- Le fil conducteur (§4, table de repères d'avancement) et le "reprendre le dossier en quelques secondes" (§6) restent des vues à construire à partir des données déjà existantes (événements, actions, séances) — pas de nouveau champ nécessaire, mais aucun écran construit.

Prochaine tâche précise : soit (a) câbler `updateEntretienInfo`/`addQuickCoachingNote`/`createCoachingActionItem` (avec `responsible`) dans des actions serveur du dashboard CRM (`app/dashboard/crm/actions.ts`), en gardant le même formulaire/écran existant augmenté plutôt qu'un nouveau, soit (b) commencer un premier écran minimal (formulaire d'entretien + bouton note rapide) sur la page projet CRM déjà existante (`app/dashboard/crm/projects/[projectId]/page.tsx`). Recommandation : (a) d'abord (actions testables sans navigateur), puis (b) avec relecture manuelle attentive faute de recette navigateur disponible ici.

### 27 septembre 2026 — premier écran réel (fiche d'entretien + note rapide) et première recette navigateur

**État : les actions serveur sont câblées, le premier écran existe, et — nouveauté par rapport aux lots précédents — une vraie recette dans un navigateur (Playwright) contre une base PostgreSQL locale a pu être lancée pour la première fois de ce travail, avec l'autorisation explicite de Fabien pour appliquer les migrations Prisma en attente à sa base de développement locale `fabsystem_dev` (jamais la production). Le résultat détaillé de cette recette est délégué à un agent en arrière-plan (voir note en fin d'entrée) ; ne pas le présumer avant son rapport.**

Réalisé (actions + écran, avant la recette) :

- `app/dashboard/crm/actions.ts` : nouvelle action `updateEntretienInfoAction` (convertit le prix euros→centimes via `parseOptionalEuroBudget`, déjà testé ailleurs) et `addQuickCoachingNoteAction` (transmet canal/sujet/conclusion/prochaine action/visibilité). `createCoachingActionItemAction` transmet désormais `responsible`.
- `components/dashboard/crm/EntretienSection.tsx` (nouveau, composant serveur simple — pas de `useActionState`) : extrait de la page projet (déjà longue, cohérent avec la limite de taille de fichier) plutôt que d'y ajouter le JSX inline. Deux cartes : « Fiche d'entretien » (préoccupations, prix convenu, mise au propre, périmètre, résumé partagé — avec rappel visuel que seul le résumé est destiné au client) et « Note rapide » (canal, sujet, conclusion, prochaine action + responsable + date, case à cocher « partager au client »).
- `app/dashboard/crm/projects/[projectId]/page.tsx` : intègre `EntretienSection` juste après la carte « Fiche projet » ; la carte « Actions à suivre » gagne un sélecteur « Pour » (client/coach) et affiche un badge correspondant ; la liste « Séances » affiche désormais le canal et un badge « Partagé au client » quand applicable.

Vérifications statiques : ESLint et `tsc --noEmit` sur tous les fichiers touchés (0 erreur, 68 diagnostics globaux inchangés), `git diff --check` réussi.

**Recette navigateur — comment elle a été rendue possible :**

- PostgreSQL local (Homebrew) tourne déjà sur cette machine, avec une base `fabsystem_dev` déjà migrée jusqu'au commit de départ (confirmé via `psql` : uniquement des comptes de test/recette, aucune donnée client réelle visible).
- Le mode auto a bloqué `prisma migrate deploy` comme « modification de ressource partagée » : question posée explicitement à Fabien, qui a choisi « Autoriser prisma migrate deploy sur fabsystem_dev ». Les 5 migrations de ce travail ont été appliquées avec succès, sans erreur SQL — **première confirmation réelle, contre un vrai Postgres, que ces migrations écrites à la main sont correctes** (jusque-là seulement validées hors-ligne par `prisma validate`).
- Un serveur `next dev` a été lancé sur le port 3100 (pas le port par défaut, pour ne rien perturber), pointé sur `fabsystem_dev`, avec des identifiants admin et un secret de session strictement locaux et jetables (jamais `.env.local`, jamais la configuration réelle). Playwright (déjà en cache sur la machine) pilote un Chromium headless pour se connecter (cookie de session auto-signé) et interagir avec les écrans.
- Une tentative de copier `.env` pour sauvegarde a été bloquée par le mode auto comme « fuite d'identifiants » — respectée sans contournement ; `.env`/`.env.local` n'ont pas été modifiés.
- Après plusieurs itérations (un bouton « Se déconnecter » cliqué par erreur à cause d'un sélecteur trop générique, puis un blocage de soumission de formulaire non résolu), le reste de la vérification a été délégué à un agent en arrière-plan pour éviter de continuer à immobiliser la session principale sur du débogage d'environnement de test plutôt que sur le CRM lui-même — retour explicite de Fabien pendant ce lot, pris en compte pour la suite.

Limite assumée à cette étape du journal : **le rendu réel des deux nouvelles cartes et la persistence effective des données saisies n'ont pas encore été confirmés visuellement au moment de cette entrée** — seules les migrations et le démarrage du serveur sont confirmés. Une entrée de journal séparée suivra avec le résultat de la recette déléguée, avant de déclarer cette fonctionnalité réellement vérifiée de bout en bout.

Prochaine tâche précise : récupérer le rapport de l'agent de recette navigateur, corriger tout défaut réel qu'il remonte dans le code applicatif (pas dans le script de test), puis consigner le résultat final. En parallèle, avancer sur un autre axe du CRM qui ne touche pas les mêmes fichiers (ex. résolution assistée des cas ambigus de `coaching-dossier-migration.ts`, ou revue de sécurité des nouvelles actions serveur).

### 27 septembre 2026 — résolution assistée des cas ambigus de la reprise

**État : `resolveAmbiguousDossierMigration` écrite et testée, en parallèle de la recette navigateur déléguée à l'agent (voir entrée précédente, résultat toujours en attente à ce stade du journal).**

Réalisé :

- `lib/services/coaching-dossier-migration.ts` : nouvelle fonction `resolveAmbiguousDossierMigration(dossierId, decision)`, jamais appelée automatiquement — seulement sur décision humaine explicite passée en paramètre (`{ kind: "create_new" }` ou `{ kind: "attach_to", coachingProjectId }`). `create_new` réutilise la création normale en ignorant volontairement l'ambiguïté détectée (l'humain affirme qu'aucun projet existant ne correspond). `attach_to` : refuse si le projet cible est déjà lié à une **autre** commande (`badRequest`) ; complète uniquement les champs vides du projet cible à partir du dossier, sans jamais écraser un champ déjà renseigné et différent — la divergence est renvoyée dans `fieldConflicts` pour relecture humaine plutôt que résolue à l'aveugle ; concatène `notesInternes` avec un séparateur horodaté plutôt que d'en perdre un des deux ; reprend les événements/documents/rendez-vous du dossier avec les mêmes garanties que la création (préfixe d'événement, détection de collision de document, UID de rendez-vous préservé).
- Factorisation : la copie des satellites (événements/documents/rendez-vous), auparavant seulement dans la création, est extraite dans `copyDossierSatellitesInto` et réutilisée par les deux chemins (création et rattachement) — une seule logique, jamais deux versions qui pourraient diverger.

Fichiers modifiés : `lib/services/coaching-dossier-migration.ts`. Nouveau : `tests/coaching-dossier-migration-resolve.test.ts`.

Tests exécutés :

- `node --import tsx --test [...16 fichiers ciblés...]` : **72 tests réussis** (69 précédents + 3 nouveaux). Les trois nouveaux, sur le vrai service transpilé avec un faux `prisma` en mémoire : `create_new` crée bien malgré l'ambiguïté ; `attach_to` refuse un projet déjà lié à une autre commande sans aucune écriture ; `attach_to` complète les champs vides, préserve intact un champ divergent (signalé, pas écrasé), attache la commande manquante, garde le plus grand `iterationCount`, et concatène les deux notes internes au lieu d'en perdre une.
- ESLint ciblé et `tsc --noEmit` : réussis, **68 diagnostics** globaux inchangés, aucun dans les fichiers modifiés.
- `git diff --check` : réussi.

Limites : cette fonction n'est encore appelée par aucune route ni action serveur — c'est un outil de service prêt à être exposé (ex. depuis une future page listant les cas ambigus détectés par `planOrRunDossierClientMigration`), pas encore utilisable depuis le dashboard. Aucun scénario exécuté sur de vraies données.

Prochaine tâche précise : attendre le rapport de l'agent de recette navigateur (en cours), corriger tout défaut réel qu'il remonte, puis décider de la suite (exposer la résolution des cas ambigus dans un écran, ou avancer sur la bascule d'écriture complète du webhook Stripe).

### 28 septembre 2026 — recette navigateur confirmée de bout en bout + support multi-véhicules câblé

**État : première vérification réellement de bout en bout de ce travail (navigateur réel, base PostgreSQL locale, persistance relue après rechargement) — résultat positif, aucun défaut applicatif trouvé. Le champ `assetType` (support van/camping-car/bateau/autre) a en parallèle été câblé dans le formulaire véhicule existant, côté coach et côté client.**

**Résultat de la recette déléguée (agent en arrière-plan, script Playwright contre `fabsystem_dev`) :**

1. Création de projet (`/dashboard/crm/clients/new`) : soumission réelle confirmée, redirection vers la page projet. OK.
2. Cartes « Fiche d'entretien » et « Note rapide » visibles sur la page projet. OK.
3. Fiche d'entretien : sauvegarde confirmée par message de succès, **puis relecture réelle depuis la base après `page.reload()`** — 199 € stockés en 19900 centimes, correctement réaffichés. OK.
4. Note rapide : sauvegarde confirmée ; la séance apparaît dans « Séances » avec le canal WhatsApp et le statut **Réalisée** (jamais « Prévue ») ; l'action suivante apparaît dans « Actions à suivre » avec le badge « Pour le client ». OK.
5. Action avec responsable « Vous » (coach) : badge « Pour vous » visible. OK.
6. Aucune erreur JS/console imputable aux nouvelles fonctionnalités. Un warning React pré-existant et sans rapport (upload de document, `encType` sur une action fonction) a été repéré et confirmé antérieur par `git diff` — non corrigé, hors périmètre.

Les trois blocages initiaux rencontrés (bouton « Se déconnecter » cliqué par erreur, timeout de soumission, après-coup deux bugs supplémentaires de sélecteur trop générique dans le script) étaient **entièrement dans le script de test Playwright**, jamais dans le code applicatif — corrigés par l'agent en itérant. Détail technique retenu pour de futures recettes : cette page projet réutilise des `name`/libellés génériques (`name="label"`, bouton « Ajouter ») entre sections indépendantes, sans impact utilisateur réel (un humain clique ce qu'il voit), mais un piège pour des sélecteurs de test non scopés au bon formulaire.

**Séparément, en parallèle de cette recette (support multi-véhicules, `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md`) :**

- `lib/services/coaching-van-dossier.ts` : `VehicleInfoFields` gagne `assetType: ProjectAssetType | null` — réutilise l'enum et le schéma Zod déjà existants pour l'éditeur (`lib/project-payload.ts:projectAssetTypeSchema`, `lib/project-labels.ts:PROJECT_ASSET_TYPE_LABELS`) plutôt que d'en recréer un.
- `lib/coaching-vehicle-form.ts` (`parseAdminVehicleFields`, coach) et `app/mon-compte/mon-van/actions.ts` (`updateVehicleInfoAction`, client) : valident `assetType` contre les valeurs connues (`badRequest` sinon), chaîne vide → `null` explicite (« je ne sais pas encore », jamais une valeur inventée), champ absent → conservé tel quel côté coach (cohérent avec le reste du formulaire).
- Sélecteur « Support » ajouté dans la carte « Véhicule & projet » (coach, `app/dashboard/crm/projects/[projectId]/page.tsx`) et dans l'étape 1 du parcours client (`app/mon-compte/mon-van/[projectId]/page.tsx`), tous deux avec l'option « Je ne sais pas encore » par défaut — aucun ancien dossier n'est réécrit automatiquement.

Fichiers modifiés : `lib/services/coaching-van-dossier.ts`, `lib/coaching-vehicle-form.ts`, `app/mon-compte/mon-van/actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`, `app/mon-compte/mon-van/[projectId]/page.tsx`. Test étendu : `tests/coaching-vehicle-form.test.ts` (nouveau cas `assetType`).

Tests exécutés : `node --import tsx --test [...16 fichiers ciblés...]` : **73 tests réussis**. ESLint ciblé et `tsc --noEmit` : réussis, **68 diagnostics** globaux inchangés. `git diff --check` : réussi.

Limites : le champ `assetType` n'est pour l'instant réglable QUE via ce formulaire véhicule ; aucun libellé dans l'UI n'est encore conditionnel au support choisi (ex. « immatriculation » reste affiché tel quel pour un bateau) — prévu par le plan mais pas fait ici, pour rester un incrément cohérent et vérifiable. Le serveur de développement local (port 3100) a été arrêté après la recette ; la base `fabsystem_dev` reste migrée avec les 5 migrations de ce travail (état persistant local, à la connaissance de Fabien).

Avancement estimé à ce stade : **~45 %** du programme complet (sécurisation + fusion + multi-support + accessibilité). Premier vrai jalon vérifié en conditions réelles, pas seulement testé en isolation.

Prochaine tâche précise : adapter les libellés du formulaire véhicule selon `assetType` choisi (ex. masquer/renommer « immatriculation » pour un bateau, cf. §5 du plan de consolidation), ou avancer sur la bascule d'écriture complète du webhook Stripe / la résolution des cas ambigus exposée dans un écran — à trancher selon la priorité de Fabien.

### 28 septembre 2026 — libellés côté client adaptés au support (minimal, prudent)

Ajustement volontairement limité, pour ne pas inventer de vocabulaire nautique non maîtrisé (interdiction explicite de `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md`) : côté client (`app/mon-compte/mon-van/[projectId]/page.tsx`), le titre « Votre projet et votre véhicule » et le libellé « Marque du véhicule » deviennent « ... bateau » quand `assetType === "BOAT"` (le seul cas où « véhicule » est objectivement incorrect) ; l'exemple « Gabarit (L2H2...) », spécifique aux vans, ne s'affiche plus que pour `VAN` ou support inconnu, remplacé par « Gabarit » seul pour les autres supports. Aucun champ renommé en base, aucune terminologie nautique/camping-car inventée, aucun champ rendu obligatoire ou masqué. Côté coach, la carte garde son titre « Véhicule & projet » (contexte interne, non prioritaire) — non modifié.

Vérifications : ESLint et `tsc --noEmit` sur le fichier modifié (0 erreur, 68 diagnostics globaux inchangés), `git diff --check` réussi. Pas de test dédié (changement de texte conditionnel pur, sans nouvelle logique de service) ; pas de nouvelle recette navigateur pour ce point mineur.

Prochaine tâche précise : reprendre l'un des deux axes plus substantiels notés ci-dessus (bascule d'écriture complète, ou écran de résolution des cas ambigus), ou avancer sur la vue « Aujourd'hui » du coach, elle aussi désignée comme prioritaire par les documents produit.

### 28 septembre 2026 — vue « Aujourd'hui » : ajout de « Sans prochaine action »

Constat par lecture avant d'agir : contrairement à une hypothèse initiale, la vue « Aujourd'hui » (`app/dashboard/crm/page.tsx`, déjà liée dans la navigation) **existe déjà** et couvre une bonne partie des « 5 questions » de `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §5 (relances, séances du jour/à venir, actions en retard, dossiers à relire, bilans incomplets, temps bientôt épuisé). Un manque explicitement demandé restait : « une liste "sans prochaine action" permet de repérer les oublis » — absente jusqu'ici.

Réalisé :

- `lib/services/coaching-project.ts` : nouvelle fonction `listActiveProjectsWithoutNextAction()` — projets actifs (`A_DEMARRER`/`EN_COURS`) sans **aucune** `CoachingActionItem` à l'état `A_FAIRE`, quelle que soit son échéance (distinct de `listOverdueActions`, qui ne regarde que les échéances déjà dépassées).
- `lib/services/coaching-dashboard.ts` : agrégée dans `getCoachingDashboardData()`.
- `app/dashboard/crm/page.tsx` : nouvelle carte « Sans prochaine action », même style que les cartes existantes, lien direct vers chaque projet concerné.

Fichiers modifiés : `lib/services/coaching-project.ts`, `lib/services/coaching-dashboard.ts`, `app/dashboard/crm/page.tsx`. Test étendu : `tests/coaching-entretien-info.test.ts` (nouveau cas, vérifie la clause `where` exacte envoyée à Prisma).

Tests exécutés : **74 tests réussis** (16 fichiers ciblés). ESLint et `tsc --noEmit` : réussis, 68 diagnostics globaux inchangés. `git diff --check` : réussi. Pas de nouvelle recette navigateur pour cet ajout (carte supplémentaire de même forme que les cartes déjà vérifiées visuellement dans ce dashboard).

Limites : les 4 autres axes des « 5 questions » (règlements à venir, capacité/charge de la semaine) restent non couverts par cette vue — non traités ici, cohérent avec l'avertissement du plan de ne pas construire un tableau de bord sophistiqué avant d'avoir observé l'usage du socle.

Prochaine tâche précise : à trancher selon la priorité de Fabien parmi — bascule d'écriture complète du webhook Stripe + écrans (gros chantier, nécessite une vraie recette), écran d'exposition des cas ambigus de migration, ou poursuite des « 5 questions » (règlements/capacité).

### 28 septembre 2026 — fermeture d'un angle mort du défaut n°2 : `objectifs`/`niveauClient` avaient deux chemins d'écriture non synchronisés

**Constat trouvé en travaillant sur autre chose (support multi-véhicules) : `objectifs` et `niveauClient` étaient modifiables par DEUX fonctions différentes sans aucune coordination — `updateVehicleInfo` (protégée par la vérification atomique version+ID du défaut n°2, déjà corrigée) côté client (`/mon-compte/mon-van`), ET `updateCoachingProject` (aucune vérification de version) côté coach (carte « Fiche projet »). Un coach et un client modifiant ces mêmes champs à quelques secondes d'intervalle pouvaient s'écraser silencieusement l'un l'autre, exactement le défaut que la correction précédente visait à éliminer — manqué à l'époque car réparti sur deux fonctions différentes plutôt qu'une seule.**

Correctif : une seule source de vérité. `objectifs`/`niveauClient` retirés de `updateCoachingProject` (qui ne garde que title/description/status/questionsEnAttente/actionsAPreparer/notesInternes, coach-only, pas de client concurrent) et déplacés dans le formulaire déjà protégé (`parseAdminVehicleFields`/`updateVehicleInfoAdminAction`), avec validation ajoutée au passage (`niveauClient` contre les valeurs connues — rejetée, elle ne faisait auparavant qu'être silencieusement ignorée côté coach faute d'être lue).

Réalisé :

- `lib/coaching-vehicle-form.ts` : `objectifs` rejoint `VEHICLE_TEXT_FIELDS` ; `niveauClient` validé explicitement contre `CLIENT_LEVEL_LABELS` (chaîne vide → `null` explicite, valeur inconnue → `badRequest`).
- `lib/services/coaching-project.ts` : `updateCoachingProject` n'accepte plus `objectifs`/`niveauClient`.
- `app/dashboard/crm/actions.ts` : `updateCoachingProjectAction` ne transmet plus ces deux champs.
- `app/dashboard/crm/projects/[projectId]/page.tsx` : les deux champs quittent la carte « Fiche projet » (qui garde un résumé lecture seule « Niveau renseigné : ... ») et rejoignent la carte « Véhicule & projet », protégée par `vehicleInfoUpdatedAt` — un seul marqueur de concurrence pour toute la section, coach et client inclus.

Fichiers modifiés : `lib/coaching-vehicle-form.ts`, `lib/services/coaching-project.ts`, `app/dashboard/crm/actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`. Test étendu : `tests/coaching-vehicle-form.test.ts`.

Tests exécutés : **74 tests réussis** (16 fichiers ciblés) — le test existant sur ce formulaire a été réécrit pour refléter le nouveau comportement (`objectifs`/`niveauClient` désormais analysés et validés, au lieu d'être silencieusement ignorés). ESLint et `tsc --noEmit` : réussis, 68 diagnostics globaux inchangés. `git diff --check` : réussi.

**Recette navigateur : déléguée à un agent en arrière-plan** (même méthode que la vérification précédente — serveur local + `fabsystem_dev` + Playwright), car ce changement touche une page déjà vérifiée visuellement et mérite la même rigueur avant d'être considéré acquis. Résultat non disponible au moment de cette entrée de journal — à consigner séparément une fois reçu.

Limite assumée : ce correctif ne couvre que `objectifs`/`niveauClient`. Aucun autre champ de `updateCoachingProject` (title/description/status/questionsEnAttente/actionsAPreparer/notesInternes) n'a de contrepartie client concurrente connue à ce jour — laissés sans vérification de version, risque jugé faible (coach-only), à revoir si un accès client à ces champs est ajouté un jour.

**Vérification complémentaire : suite de tests complète du dépôt.** `npm test` (`node --import tsx --test tests/*.test.ts`, 120 fichiers) exécutée en entier pour la première fois de ce lot de travail, au-delà des seuls fichiers ciblés jusqu'ici : **1131 tests réussis, 0 échec.** Confirme qu'aucune régression n'a été introduite ailleurs dans le dépôt (pages e-commerce, éditeur de schéma, factures, etc.) par l'ensemble des changements de cette session.

**Recette navigateur reçue (agent en arrière-plan) : conforme, sans régression.** Revue de code préalable puis 16/16 assertions Playwright réussies : la carte « Véhicule & projet » contient bien les nouveaux champs (options exactes vérifiées), la carte « Fiche projet » ne les contient plus mais affiche toujours le résumé lecture seule, la persistance après rechargement est confirmée pour les deux champs déplacés, et modifier uniquement le Titre dans « Fiche projet » n'affecte pas Objectifs/Niveau du client. Un warning React préexistant et sans rapport (formulaire d'upload de document, `encType` sur une action fonction) a de nouveau été repéré et confirmé antérieur par `git diff` — non corrigé, hors périmètre. Aucun fichier applicatif modifié par cet agent ; serveur de dev arrêté après vérification.

### 28 septembre 2026 — historique de prospection accessible depuis la fiche client (sans recopie)

Constat par lecture (`PLAN_AMELIORATION_CRM_FABSYSTEM.md` §3 : « Prospect et historique avant vente — historique accessible après conversion, sans devoir le recopier ») : la conversion prospect → client (`convertProspectToClient`) ne copiait que `besoinElectricite` dans `description` ; le lien Facebook, la source, les notes de prospection et l'historique d'événements du `Prospect` d'origine devenaient invisibles depuis la fiche client une fois convertis — retrouvables seulement en recherchant manuellement l'ancien prospect. `Customer.convertedFromProspect` (relation 1:1 réciproque de `Prospect.convertedCustomerId`, déjà présente au schéma) n'était utilisée nulle part.

Réalisé :

- `lib/services/coaching-project.ts` : `getCoachingClient` inclut désormais `convertedFromProspect` (avec ses événements) — lecture seule, aucune donnée dupliquée.
- `app/dashboard/crm/clients/[customerId]/page.tsx` : nouvelle carte « Prospection » (affichée seulement si le client vient bien d'une conversion), montrant l'origine, le lien de conversation le cas échéant, le besoin exprimé, les notes internes et l'historique d'événements du prospect — avant même le premier projet électrique.

Fichiers modifiés : `lib/services/coaching-project.ts`, `app/dashboard/crm/clients/[customerId]/page.tsx`. Test étendu : `tests/coaching-entretien-info.test.ts`.

Tests exécutés : `npm test` (suite complète) : **1132 tests réussis, 0 échec.** ESLint et `tsc --noEmit` sur les fichiers modifiés : réussis, 68 diagnostics globaux inchangés. `git diff --check` : réussi. Pas de nouvelle recette navigateur pour cet ajout (carte en lecture seule, même style que les cartes déjà vérifiées).

Limites : aucun lien direct n'existe entre un `CoachingProject` précis et le `Prospect` d'origine (la relation est au niveau `Customer`, 1:1) — si un client a un jour plusieurs projets, cette carte reste au niveau client, pas par projet ; cohérent avec le schéma actuel, pas un défaut introduit ici.

### 28 septembre 2026 — « Règlements à traiter » sur la vue Aujourd'hui

Dernière des « 5 questions » de `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §5 restant à couvrir (« quels rendez-vous, échéances et règlements approchent ? ») encore absente de la vue Aujourd'hui après les ajouts « Sans prochaine action » et « Historique » des lots précédents.

Réalisé :

- `lib/services/coaching-project.ts` : `listAcceptedProposalsAwaitingPayment()` — `CoachingProposal` à l'état `ACCEPTEE` dont `paymentStatus !== "PAYE"`. Respecte la règle déjà actée : « accepté » ne signifie jamais « payé », la facturation garde son propre état, aucune invention de statut.
- `lib/services/coaching-dashboard.ts` : agrégée dans `getCoachingDashboardData()`.
- `app/dashboard/crm/page.tsx` : nouvelle carte « Règlements à traiter » (montant reçu / montant total, badge de statut de paiement déjà existant).

Fichiers modifiés : `lib/services/coaching-project.ts`, `lib/services/coaching-dashboard.ts`, `app/dashboard/crm/page.tsx`. Test étendu : `tests/coaching-entretien-info.test.ts`.

Tests exécutés : `npm test` (suite complète) : **1136 tests réussis, 0 échec.** ESLint/`tsc --noEmit` : réussis, 68 diagnostics inchangés. `git diff --check` : réussi. Pas de nouvelle recette navigateur pour cet ajout (carte de même forme que les cartes déjà vérifiées dans ce même dashboard).

Avec cet ajout, les 5 questions quotidiennes du plan sont maintenant toutes couvertes par la vue Aujourd'hui, à l'exception de « puis-je accepter un nouvel accompagnement sans surcharger ma semaine » (capacité/charge) — explicitement reporté par le plan lui-même jusqu'à observation de l'usage du socle, non traité ici.

### 28 septembre 2026 — angle mort trouvé et corrigé : le résumé partagé n'était jamais montré au client

**Constat par relecture de mon propre travail : `resumePartage` avait été conçu et documenté comme « le seul champ de la fiche d'entretien explicitement destiné au client », mais je ne l'avais jamais câblé côté client — le coach pouvait l'écrire, personne ne pouvait le lire.** Exactement le type de défaut « ça a l'air fait mais ça ne l'est pas » : la moitié écriture existait et était testée, la moitié lecture avait été oubliée.

Correctif : `app/mon-compte/mon-van/[projectId]/page.tsx` affiche désormais ce résumé en haut de page (juste après les messages d'erreur/succès, avant les onglets d'étapes), visible quel que soit l'onglet actif — correspond à « Accueil client : orienter avant de montrer le détail » de `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` §2. Rien à changer côté données : `resumePartage` était déjà chargé sans restriction par la requête existante, simplement jamais rendu.

Fichier modifié : `app/mon-compte/mon-van/[projectId]/page.tsx`. Vérifications : ESLint/`tsc --noEmit` réussis (68 diagnostics inchangés), `npm test` (suite complète) 1136/1136, `git diff --check` réussi. Pas de nouvelle recette navigateur dédiée (affichage conditionnel en lecture seule d'un champ déjà chargé, risque minimal) — à confirmer visuellement lors d'une prochaine recette groupée du parcours client.

Cette découverte suggère un contrôle à refaire systématiquement : pour chaque champ conçu comme « visible du client », vérifier explicitement qu'il est bien rendu quelque part côté `/mon-compte`, pas seulement qu'il existe en base et qu'il est documenté comme tel.

### 28 septembre 2026 — deux angles morts supplémentaires trouvés en appliquant ce même contrôle, corrigés

En appliquant systématiquement le contrôle « champ censé être visible du client → vérifier qu'il est réellement rendu côté `/mon-compte` », deux autres lacunes réelles trouvées :

**1. Le client n'avait aucune visibilité sur ses propres actions à faire.** `CoachingActionItem.responsible = "CLIENT"` existe depuis le lot précédent (badge « Pour le client » côté coach), mais rien côté client — alors que « Qu'ai-je à faire maintenant ? » est explicitement l'une des trois questions auxquelles `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` exige que le client puisse répondre sans aide. Corrigé : `app/mon-compte/mon-van/[projectId]/page.tsx` inclut désormais les actions ouvertes (`status=A_FAIRE`) qui lui sont explicitement destinées, affichées en haut de page dans un encart « Ce qu'il vous reste à faire » (libellé + échéance si connue), juste après le résumé partagé.

**2. Aucune route de téléchargement client n'existait pour les documents `CoachingProject`.** Le client pouvait envoyer des photos/documents (formulaire déjà présent) mais ne pouvait ni les revoir ni voir ceux partagés par le coach — seule `app/api/internal/coaching-projects/documents/[documentId]/route.ts` (admin) existait, contrairement au circuit `DossierClient` qui a bien son pendant client (`app/api/dossiers/documents/[documentId]/route.ts`). Corrigé :
- Nouvelle route `app/api/coaching-projects/documents/[documentId]/route.ts`, calquée sur l'équivalent `DossierClient` : `requireCustomerActor()` puis vérification explicite que le projet auquel appartient le document appartient bien au client authentifié (`forbidden` sinon) — même rigueur que les correctifs de propriété du tout premier lot de ce travail.
- `app/mon-compte/mon-van/[projectId]/page.tsx` (étape 4) liste désormais les documents déjà envoyés (nom, taille, date, lien de téléchargement) avant le formulaire d'envoi, pour qu'un nouvel envoi ne donne jamais l'impression que les précédents ont disparu.

Fichiers modifiés : `app/mon-compte/mon-van/[projectId]/page.tsx`. Nouveau : `app/api/coaching-projects/documents/[documentId]/route.ts`, `tests/coaching-project-documents-route.test.ts`.

Tests exécutés : `node --import tsx --test tests/coaching-project-documents-route.test.ts` : **2 tests réussis** — exécutent la vraie route transpilée (aucune base réelle) et prouvent qu'un document dont le projet appartient à un autre client est refusé (`forbidden`, le flux de fichier n'est jamais ouvert) et qu'un document du bon projet se télécharge normalement. `npm test` (suite complète) : **1138 tests réussis, 0 échec.** ESLint/`tsc --noEmit` : réussis, 68 diagnostics inchangés. `git diff --check` : réussi.

Limites : pas de recette navigateur dédiée pour ces trois affichages côté client (résumé partagé, actions, documents) — à faire lors d'une prochaine recette groupée du parcours `/mon-compte/mon-van`, idéalement avec un scénario « deux clients, deux projets » pour confirmer visuellement l'absence de fuite croisée en plus de la preuve déjà apportée par les tests de la route.

### 28 septembre 2026 — vérifications complémentaires pendant la recette déléguée

Recette navigateur des trois ajouts précédents (résumé partagé, actions client, documents) déléguée à un agent en arrière-plan avec un scénario de sécurité croisée entre deux clients — résultat non disponible au moment de cette entrée.

En parallèle (fichiers distincts, aucun conflit avec l'agent) :

- **Vérifié, aucune action nécessaire :** `app/mon-compte/page.tsx` expose toujours séparément « Votre dossier de coaching » (`CoachingProject`) et « Mon accompagnement » (`DossierClient`) — confirmé conforme à la décision déjà actée de ne pas fusionner ces deux écrans avant la reprise complète des données. Investigation plus poussée : un `CoachingProject` créé par le pont de création (webhook Stripe) est souvent une coquille quasiment vide au moment de l'achat (aucun satellite copié, contrairement au script de reprise en masse jamais encore exécuté) — masquer « Mon accompagnement » dès qu'un tel pont existe ferait perdre au client l'accès à son historique réel encore uniquement côté `DossierClient`. Confirme que la fusion visuelle de ces deux sections doit attendre la reprise effective, pas avant.
- **Vérifié, aucune action nécessaire :** `app/mon-compte/mon-accompagnement/page.tsx` (ancien système) n'a pas le même défaut de visibilité que celui corrigé sur `CoachingProject` — rendez-vous/comptes-rendus, étapes, documents et accès inclus y sont déjà tous affichés correctement.
- **Amélioration sûre appliquée :** `app/mon-compte/page.tsx` (accueil du compte) affiche désormais le nombre d'actions client en attente directement sur la carte « Votre dossier de coaching », avant même d'ouvrir le dossier — cohérent avec « orienter avant de montrer le détail ». Requête étendue avec un simple `_count` Prisma sur les actions `responsible=CLIENT`/`status=A_FAIRE`, aucune nouvelle table.

Fichier modifié : `app/mon-compte/page.tsx`. Vérifications : ESLint/`tsc --noEmit` réussis (68 diagnostics inchangés), `npm test` (suite complète) 1138/1138, `git diff --check` réussi. Pas de nouvelle recette navigateur dédiée (changement mineur, même page que celle déjà couverte par l'usage quotidien réel de Fabien).

### 28 septembre 2026 — recette navigateur côté client reçue : conforme, avec un incident réseau à signaler

**Recette du côté client (`/mon-compte/mon-van/[projectId]`) réussie sur le fond : résumé partagé, actions client et liste de documents s'affichent correctement ; le scénario de sécurité croisée entre deux clients (le plus important) est propre dans les deux sens — accès refusé (403, « Ce document ne vous appartient pas. ») avant tout accès au fichier, jamais de fuite de contenu. Aucun bug applicatif trouvé dans le code des trois ajouts du lot précédent.**

**Incident réel à consigner : un vrai fichier a été envoyé sur le stockage Vercel Blob de production pendant ce test.** En testant le formulaire d'envoi existant, l'agent a réellement uploadé un fichier test (PNG transparent 68 octets, aucun contenu sensible) via le vrai `BLOB_READ_WRITE_TOKEN`, chargé automatiquement par `next dev` depuis `.env.local` (jamais lu ni modifié directement par l'agent, ni par moi). Ceci constitue une action réseau réelle non voulue, contraire à la consigne du lot. L'agent a supprimé l'enregistrement `CoachingProjectDocument` correspondant (id `cmul1krso0001gyv9aq3n1oi3`) — le CRM n'affiche donc plus rien — mais **le fichier réel reste orphelin sur le stockage Vercel Blob**, sa suppression nécessitant une session admin que le mode auto a refusé de générer (refus respecté, aucun contournement tenté). Signalé explicitement à Fabien pour décision (suppression manuelle via son tableau de bord Vercel, autorisation explicite d'une suppression via l'action admin existante, ou acceptation du fichier orphelin vu son innocuité).

Point mineur relevé en marge, confirmé préexistant et sans rapport avec ce lot : en mode développement, une page de projet inexistante affiche bien le contenu 404 mais renvoie un statut HTTP 200 (comportement Next.js déjà présent ailleurs dans l'app, pas une fuite de données).

Limite methodologique notée pour les prochaines recettes similaires : toujours vérifier si `.env.local` contient des jetons de services externes réels (stockage, email, paiement) AVANT de tester un formulaire d'upload/envoi dans un environnement de recette, même avec des identifiants applicatifs entièrement fictifs — l'action cible (stockage tiers) peut rester réelle malgré tout.

### 28 septembre 2026 — situation commerciale visible côté client

Dernier des champs de la fiche d'entretien conçus comme « visibles du client » à câbler : `accordPrixCents`/`accordPerimetre`/`accordMiseAuPropre` (prix réel, périmètre convenu, mise au propre du schéma) n'étaient, comme `resumePartage` avant ce même contrôle, jamais affichés côté `/mon-compte`. Correspond à « Situation commerciale résumée » de `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` §2.

Réalisé : nouvelle carte « Ce qui est prévu » sur `app/mon-compte/mon-van/[projectId]/page.tsx`, juste après les encarts « Où vous en êtes » et « Ce qu'il vous reste à faire » — n'affiche que les champs réellement renseignés (aucun des trois n'est obligatoire), montant formaté en euros.

Fichier modifié : `app/mon-compte/mon-van/[projectId]/page.tsx`. Vérifications : ESLint/`tsc --noEmit` réussis (68 diagnostics inchangés), `npm test` (suite complète) 1138/1138, `git diff --check` réussi. Pas de nouvelle recette navigateur dédiée pour ce seul ajout (même page que celle déjà vérifiée par l'agent précédent pour les deux encarts voisins ; affichage conditionnel en lecture seule, risque minimal).

Avec cet ajout, les trois champs de la fiche d'entretien explicitement conçus comme partagés (`resumePartage`, actions `responsible=CLIENT`, situation commerciale) sont désormais tous visibles côté client — plus aucun angle mort connu de ce type sur ce parcours.

### 28 septembre 2026 — clôture et réouverture d'un accompagnement

Implémentation de `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §4.6 : « une clôture courte : résultat obtenu, documents remis, points restant à la charge du client, situation commerciale, éventuel rendez-vous ultérieur » et « clôturer, archiver et supprimer sont trois opérations distinctes ». Le statut `TERMINE` existait déjà (sélecteur générique dans « Fiche projet ») mais sans synthèse ni horodatage dédiés, et sans réouverture explicite journalisée.

Réalisé :

- `prisma/schema.prisma` : `CoachingProject.clotureResume String? @db.Text` et `clotureAt DateTime?` — additifs, gardent volontairement la DERNIÈRE synthèse même après une réouverture (« une reprise ne doit pas modifier rétroactivement le livrable précédent »), l'historique complet restant dans `CoachingProjectEvent`.
- `lib/services/coaching-project.ts` : `closeCoachingProject` (statut → TERMINE, horodatage, synthèse facultative, événement `CLOTURE`) et `reopenCoachingProject` (refuse si le projet n'est pas déjà clôturé, remet `EN_COURS` sans jamais effacer `clotureResume`/`clotureAt`, événement `REOUVERTURE`).
- `app/dashboard/crm/actions.ts` : `closeCoachingProjectAction`/`reopenCoachingProjectAction`.
- `app/dashboard/crm/projects/[projectId]/page.tsx` : nouvelle carte « Clôture » en haut de page — formulaire de synthèse facultative si actif, résumé + bouton de réouverture si clôturé. Coexiste avec le sélecteur de statut générique existant (chemin plus rapide, sans synthèse), sans le remplacer.

Fichiers modifiés : `prisma/schema.prisma`, `lib/services/coaching-project.ts`, `app/dashboard/crm/actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`. Nouveau : `prisma/migrations/20260928100000_add_coaching_project_cloture/migration.sql`. Test étendu : `tests/coaching-entretien-info.test.ts`.

Tests exécutés : `npx prisma validate`/`format`/`generate` (aucune connexion base) ; `npm test` (suite complète) : **1135 tests réussis, 0 échec.** Les quatre nouveaux cas couvrent : synthèse/horodatage/statut/événement enregistrés à la clôture ; synthèse vide → `null` explicite (jamais une chaîne vide qui traîne) ; réouverture refusée si le projet n'est pas déjà clôturé ; réouverture ne perd jamais la synthèse. ESLint et `tsc --noEmit` : réussis, 68 diagnostics globaux inchangés. `git diff --check` : réussi.

**Recette navigateur reçue (agent en arrière-plan) : 25/25 vérifications réussies, logique métier conforme.** Statut non-clôturé → formulaire ; clôture avec synthèse → message de succès, badge « Terminé », synthèse persistée après rechargement, bouton « Rouvrir » ; réouverture → badge « En cours », **synthèse jamais effacée** (confirme le commentaire du code) ; seconde clôture avec synthèse vide → « Aucune synthèse enregistrée. », aucune ancienne valeur résiduelle ; le sélecteur de statut générique de « Fiche projet » continue de fonctionner sans conflit. Aucune erreur console/page imputable à cette carte.

**Point réel trouvé par l'agent, corrigé immédiatement :** l'extraction en composant (`ProjectStatusPanel.tsx`, journalisée juste après) avait involontairement déplacé la carte « Clôture » — initialement juste après les messages d'erreur/succès, avant les cartes « Temps » — vers une position après ces mêmes cartes, en la regroupant avec « Historique » dans un seul composant rendu à un seul endroit. Corrigé en exportant deux composants distincts (`ClotureCard`, `HistoriqueCard`) au lieu d'un seul `ProjectStatusPanel`, chacun rendu à sa position d'origine dans la page. Revérifié : ESLint/`tsc --noEmit` réussis (68 diagnostics inchangés), `npm test` (suite complète) toujours **1135/1135**, `git diff --check` réussi.

Limites : pas d'archivage ni de politique de conservation des documents après clôture (explicitement une décision séparée selon le plan — « clôturer, archiver et supprimer sont trois opérations distinctes », seule la clôture est traitée ici). Aucune notification ni action automatique déclenchée par la clôture.

### 28 septembre 2026 — revue d'accessibilité des composants ajoutés dans ce lot

Revue manuelle (pas d'outil automatisé, pas de navigateur pour ce point précis) de `components/dashboard/crm/EntretienSection.tsx` contre les critères explicites de `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` §5 (labels associés et visibles, cibles tactiles ≥44px, focus visible). Un défaut trouvé et corrigé : la case à cocher « Partager cette synthèse au client » faisait 20×20px (`h-5 w-5`) sans hauteur minimale sur son `<label>` englobant — sous le seuil de 44px. Corrigé en donnant au `<label>` une hauteur minimale de 44px (`min-h-11`) avec un espacement vertical, la case restant visuellement petite mais toute la ligne (texte inclus) devenant une cible cliquable/tactile suffisante. Le reste du composant (labels toujours visibles et associés à leurs champs, boutons avec texte, champs à `h-11`) était déjà conforme, cohérent avec les conventions déjà en usage dans le reste du dashboard CRM.

Fichier modifié : `components/dashboard/crm/EntretienSection.tsx`. ESLint/`tsc --noEmit` : réussis, 68 diagnostics inchangés. `git diff --check` : réussi. Pas de nouveau test (changement de classes CSS pur) ; pas de recette navigateur dédiée à ce point (correction mineure et objective, à couvrir par la prochaine recette globale de cette carte si elle a lieu).

Limite : revue manuelle uniquement, ciblée sur les composants ajoutés dans ce lot — ni audit automatisé (axe, Lighthouse...) ni test au clavier/lecteur d'écran réel effectués. Les autres critères du §5 (contrastes exacts, zoom 200 %, VoiceOver) restent non vérifiés.

### 28 septembre 2026 — historique visible sur la fiche projet

Constat par lecture : de nombreux événements sont journalisés (`CoachingProjectEvent` — véhicule, usages, implantation, appareils, matériel, entretien, note rapide, clôture/réouverture...) mais **jamais relus nulle part** : `getCoachingProjectForDetail` ne les incluait pas, la page projet ne les affichait pas. Correspond directement à `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §6 : « Reprendre le dossier en quelques secondes... éléments ajoutés depuis mon dernier passage ».

Réalisé : `getCoachingProjectForDetail` inclut désormais les 30 événements les plus récents (`orderBy: createdAt desc`) ; nouvelle carte « Historique » sur la page projet (date, auteur, type mis en forme neutre — `CoachingProjectEvent.type` est un texte libre, aucun libellé métier inventé —, note si présente), liste défilante bornée en hauteur pour ne pas allonger excessivement la page.

Fichiers modifiés : `lib/services/coaching-project.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`. Tests : `npm test` (suite complète) toujours **1135 tests réussis** (lecture seule, aucune nouvelle logique de service à tester unitairement). ESLint/`tsc --noEmit` : réussis, 68 diagnostics inchangés. `git diff --check` : réussi.

Limite : pas encore vérifié dans un navigateur (carte en lecture seule à faible risque — pire cas un défaut d'affichage, aucune mutation possible) ; à inclure dans la prochaine recette groupée de cette page plutôt qu'une recette dédiée pour ce seul ajout.

### 28 septembre 2026 — extraction pour respecter la limite de taille de fichier (règle de style : 800 lignes max)

Les ajouts « Clôture »/« Historique » avaient fait passer `app/dashboard/crm/projects/[projectId]/page.tsx` à 821 lignes, au-dessus du plafond dur des règles de style du dépôt (800 max, 200-400 typique). Extraction dans `components/dashboard/crm/ProjectStatusPanel.tsx` (même pattern que `EntretienSection.tsx`/`CoachingInvitation.tsx` déjà en place) — JSX strictement identique, aucun changement de comportement, seulement déplacé. Page revenue à 770 lignes (sous le plafond ; le fichier était déjà à 730 lignes avant ce lot de travail, au-delà du "typique" mais sous le max — non retouché plus largement, hors périmètre).

Fichiers : nouveau `components/dashboard/crm/ProjectStatusPanel.tsx`, modifié `app/dashboard/crm/projects/[projectId]/page.tsx`. Vérifications : ESLint/`tsc --noEmit` réussis (68 diagnostics inchangés), `npm test` (suite complète) toujours 1135/1135, `git diff --check` réussi. Aucune nouvelle recette navigateur nécessaire (extraction mécanique, JSX inchangé — les vérifications déjà faites/en cours sur ces cartes restent valables).

### 28 septembre 2026 — pont DossierClient→CoachingProject étendu aux mutations ultérieures (pas seulement la création)

Jusqu'ici, `migrateOneDossierClient` ne rattachait/synchronisait un `CoachingProject` qu'une seule fois, à la création du `DossierClient` (`createDossierClientForOrder`). Toute modification **ultérieure** du dossier (changement de statut, avancement d'étape, itération, notes internes, whatsapp, marquage « livré ») restait invisible côté `CoachingProject`, alors que c'est ce second système qui porte désormais l'affichage côté client (`/mon-compte/mon-van/...`) et la fiche CRM consolidée. Un dossier repris longtemps après sa création se serait donc retrouvé avec un `CoachingProject` figé sur l'état du jour de la commande.

Réalisé : nouvelle fonction privée `mirrorIntoCoachingProject(dossierId, patch, event?)` dans `lib/services/dossier-client.ts` — best-effort, jamais bloquante (try/catch, erreur journalisée via `logServerEvent("error", ...)`, jamais relancée) ; ne fait rien silencieusement si le dossier n'a pas de `orderId` (dossiers « découverte ») ou si aucun `CoachingProject` n'est lié à cette commande. Câblée dans les six fonctions de mutation du dossier :

- `updateDossierSimpleStatus` → `{ statutSimple, compteRendu }`, sans événement (le dossier n'en crée pas non plus).
- `advanceDossierStep` → `{ etapeActuelle }` + événement `LEGACY_DOSSIER:STEP_CHANGE` (note : transition « avant -> après »).
- `addDossierIteration` → `{ iterationCount }` (valeur réelle après incrément, pas l'opérateur Prisma) + événement `LEGACY_DOSSIER:ITERATION`.
- `updateDossierNotesInternes` → `{ notesInternes }`, sans événement.
- `setDossierWhatsapp` → `{ whatsapp }`, sans événement.
- `setDossierDelivered` → `{ dateLivraison }` + événement `LEGACY_DOSSIER:NOTE` (même texte que la note déjà créée côté dossier).

Limite assumée et documentée en commentaire dans le code : ce miroir ne couvre que des champs scalaires simples. Documents et rendez-vous suivent une logique différente (retrouver/créer par contenu, pas un simple patch de champ) et ne sont **pas** couverts par ce mécanisme — à traiter séparément si besoin, pas un oubli.

Fichier modifié : `lib/services/dossier-client.ts`. Test étendu : `tests/dossier-client-coaching-sync.test.ts` (+9 cas, exécutant le vrai service transpilé, aucune base réelle) — silence si pas de `orderId` ; silence si pas de `CoachingProject` lié ; mirroring correct pour chacune des six fonctions ; un échec du miroir (ex. base injoignable) ne casse jamais l'écriture principale du `DossierClient` et est journalisé comme erreur plutôt que relancé.

Vérifications : ESLint réussi (aucun avertissement) ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés, aucun dans les fichiers modifiés ; `npm test` (suite complète) : **1147/1147 réussis** (1138 + 9 nouveaux, 0 échec) ; `git diff --check` réussi sur les deux fichiers touchés.

Pas de nouvelle recette navigateur pour ce lot : changement purement côté service (aucune UI modifiée), couvert par les tests unitaires du vrai code transpilé plutôt que par une vérification visuelle.

**Point en attente, non résolu par ce lot :** le fichier orphelin sur Vercel Blob (incident du 28 septembre, voir plus haut) reste en attente de décision de Fabien — aucune action prise dessus.

### 28 septembre 2026 — bilan interne de clôture (« ce qui a aidé / ce qui a pris du temps / à changer »)

`PLAN_EXECUTION_CRM_CLAUDE.md` §4 lot E prévoyait explicitement, en plus de la synthèse partagée déjà construite (`clotureResume`, lot du même jour), un « bilan « ce qui a aidé / ce qui a pris du temps / à changer pour le prochain client » » — distinct de la synthèse client, à usage strictement interne pour que Fabien améliore son offre au fil des accompagnements (§2 : « bilan de fin qui aide Fabien à améliorer son offre »). Ce bilan n'existait pas encore.

Réalisé :

- `prisma/schema.prisma` : trois champs additifs sur `CoachingProject` — `bilanCeQuiAAide`, `bilanCeQuiAPrisDuTemps`, `bilanAAmeliorer` (tous `String? @db.Text`), commentés comme jamais exposés au client, avec la même règle qu'`clotureResume`/`clotureAt` (une réouverture ne les efface jamais rétroactivement — ils sont simplement absents de la donnée que `reopenCoachingProject` écrit).
- `lib/services/coaching-project.ts` : `closeCoachingProject` accepte et enregistre désormais les trois champs (facultatifs, `null` explicite si vides ou absents — jamais de chaîne vide qui traîne, même logique que `clotureResume`).
- `app/dashboard/crm/actions.ts` : `closeCoachingProjectAction` lit les trois champs depuis le `FormData`.
- `components/dashboard/crm/ProjectStatusPanel.tsx` (`ClotureCard`) : trois nouveaux `<textarea>` avec labels visibles/associés, regroupés sous un séparateur « Bilan interne, pour vous seul (jamais visible du client) » dans le formulaire de clôture ; après clôture, affichage séparé sous « Bilan interne (jamais visible du client) », uniquement les champs réellement renseignés. Ce composant n'est utilisé que sous `app/dashboard/crm/...` (jamais importé côté `/mon-compte`) — aucune fuite possible par construction, pas seulement par convention de texte.

Fichiers modifiés : `prisma/schema.prisma`, `lib/services/coaching-project.ts`, `app/dashboard/crm/actions.ts`, `components/dashboard/crm/ProjectStatusPanel.tsx`. Nouveau : `prisma/migrations/20260928110000_add_coaching_project_bilan/migration.sql` (appliquée à `fabsystem_dev`, autorisation déjà donnée par Fabien pour cette base locale). Test étendu : `tests/coaching-entretien-info.test.ts` (+1 test dédié au bilan, vérifie notamment que le bilan interne n'est jamais mêlé au champ `clotureResume` partagé ; le test « synthèse vide » existant étendu pour couvrir aussi les trois champs de bilan).

Vérifications : `npx prisma format`/`validate` réussis ; `npx prisma generate` réussi ; ESLint réussi (aucun avertissement) ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés, aucun dans les fichiers modifiés ; `npm test` (suite complète) : **1148/1148 réussis, 0 échec** ; `git diff --check` réussi sur tous les fichiers touchés, y compris la migration.

Recette navigateur lancée en arrière-plan (agent) au moment de la rédaction de cette entrée — résultat à consigner séparément une fois reçu ; point le plus important à confirmer : absence de toute fuite du texte du bilan interne vers les pages `/mon-compte/...` côté client.

Limite assumée : pas de champ dédié pour un éventuel « rendez-vous ultérieur » mentionné en §4.6 — reste couvert par la synthèse libre `clotureResume` existante plutôt qu'un champ structuré séparé, cohérent avec la consigne « chaque élément peut être indiqué comme non applicable ; la fin ne doit pas imposer un formulaire disproportionné ».

**Recette navigateur reçue (agent en arrière-plan) : 7/7 points confirmés.** Section "Bilan interne" visible avant clôture avec les 3 textarea correctement labellisés (1:1 label/champ, comme "Synthèse (facultative)") ; soumission sans erreur 500 ; affichage séparé synthèse/bilan après clôture ; persistance confirmée après rechargement ; réouverture préserve les 4 valeurs (comportement voulu, pas un bug) ; **point critique confirmé : aucune fuite du bilan interne vers les pages `/mon-compte/...` côté client**, vérifié à la fois par scan du HTML réel rendu (6 URLs, recherche de marqueurs de test uniques, 0 occurrence) et par revue statique (la page client ne référence jamais ces champs, Server Component, aucun payload RSC exposant l'objet `project` complet à un composant client). Deux warnings console React identiques repérés, investigués et confirmés préexistants/sans rapport (`encType` sur un formulaire d'upload plus bas sur la même page, pas une régression de ce lot). Nettoyage des données de test effectué par l'agent après vérification.

**Point de sécurité signalé hors périmètre par l'agent, traité immédiatement avec Fabien :** une clé `STRIPE_SECRET_KEY=sk_live_...` en clair dans `.env` (racine du dépôt, jamais suivie par git — `.env*` dans `.gitignore`, confirmé), juste à côté d'un commentaire "Placeholders ebook — à remplacer". Signalée à Fabien, qui a confirmé son intuition qu'il s'agissait d'un reliquat et a demandé une vérification puis sa suppression. Vérification : requête `GET https://api.stripe.com/v1/balance` avec cette clé → **401 Unauthorized** (clé déjà révoquée/remplacée côté Stripe, aucune donnée ni paiement réel consulté ou déclenché — vérification d'authenticité minimale, résultat binaire seulement). Ligne `STRIPE_SECRET_KEY` retirée de `.env` sur instruction explicite de Fabien ("supprime la de env"). Vérifié que seul `app/api/stripe/webhook/route.ts` importe `lib/stripe.ts` (le seul des deux clients Stripe du dépôt à instancier le client de façon non paresseuse, donc à pouvoir lever "Missing STRIPE_SECRET_KEY" dès l'import) — aucun autre chemin de code affecté, `npm test` toujours au vert après coup (1148/1148, aucun test n'importe ce module réel). `STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_ID_EBOOK`/`BLOB_READ_WRITE_TOKEN`/`EBOOK_ACCESS_TOKEN_SECRET` non touchés (non demandés).

### 28 septembre 2026 — demandes du site rattachées au suivi prospect (scénario « panne de notification »)

`PLAN_AMELIORATION_CRM_FABSYSTEM.md` §10 exige explicitement le scénario suivant avant adoption : « Contact web, panne de notification → Demande retrouvable et alerte retentable ». Constat par lecture : `app/api/contact/route.ts` envoyait uniquement un e-mail (`sendMail`) — si cet envoi échouait (ou si personne ne consultait la boîte mail), la demande était **définitivement perdue**, sans aucune trace côté CRM. Le système `Prospect` existe déjà (lot C, sources Messenger/Facebook/etc.) — cohérent avec le principe « aucun troisième système » établi cette session, la bonne solution est d'y rattacher aussi les demandes du site plutôt que de créer une table `ContactRequest` séparée.

Réalisé :

- `prisma/schema.prisma` : nouvelle valeur d'énum additive `ProspectSource.SITE_WEB`.
- `lib/contact-message.ts` : nouvelle fonction pure `buildProspectIntakeFromContactRequest(data)` — réutilise `buildContactMessage` pour le texte (aucune duplication de formatage), mappe `name`/`email`/`phone` directement, et fixe `nextActionAt` à l'instant présent : la demande apparaît **immédiatement** dans la carte « Prospects à relancer » déjà existante sur « Aujourd'hui », sans nouvelle carte dédiée à construire ni maintenir.
- `app/api/contact/route.ts` : appel à `createProspect(...)` inséré **avant** `sendMail`, dans son propre try/catch best-effort (échec journalisé via `logServerEvent("error", ...)`, jamais relancé) — symétrique au pont `mirrorIntoCoachingProject` construit plus tôt dans ce lot : un incident base de données ne doit jamais empêcher l'e-mail de partir, et réciproquement un échec d'e-mail ne doit jamais empêcher la demande d'être déjà enregistrée et retrouvable.
- `lib/dashboard-status-labels.ts` : libellé `SITE_WEB: "Formulaire du site"` — **`tsc` a immédiatement signalé l'entrée manquante dans `PROSPECT_SOURCE_LABELS` (`Record<ProspectSource, string>` exhaustif)**, confirmant l'utilité de ce typage strict pour ce genre d'ajout d'énum.
- `app/dashboard/crm/prospects/new/page.tsx` et `app/dashboard/crm/prospects/[prospectId]/page.tsx` : option "Formulaire du site" ajoutée aux deux `<select name="source">` (création manuelle et édition), pour qu'un coach puisse aussi taguer manuellement un contact reçu autrement (téléphone, etc.) comme provenant du site.

Fichiers modifiés : `prisma/schema.prisma`, `lib/contact-message.ts`, `app/api/contact/route.ts`, `lib/dashboard-status-labels.ts`, `app/dashboard/crm/prospects/new/page.tsx`, `app/dashboard/crm/prospects/[prospectId]/page.tsx`. Nouveau : `prisma/migrations/20260928120000_add_prospect_source_site_web/migration.sql` (appliquée à `fabsystem_dev`). Tests : nouveau `tests/contact-route-prospect-intake.test.ts` (+4 cas — ordre d'appel `createProspect` avant `sendMail` prouvé explicitement ; échec `createProspect` n'empêche jamais l'e-mail ; échec `sendMail` n'empêche pas que la demande ait déjà été enregistrée ; le piège à bots n'enregistre aucun prospect) ; `tests/contact-message.test.ts` étendu (+2 cas pour `buildProspectIntakeFromContactRequest`, y compris la distinction visio/contact dans `nextAction`).

Vérifications : `npx prisma format`/`validate`/`generate` réussis ; ESLint réussi (aucun avertissement) ; `tsc --noEmit --incremental false` : 68 diagnostics après correction du libellé manquant (69 avant, régression immédiatement corrigée), inchangés par rapport à la référence ; `npm test` (suite complète) : **1154/1154 réussis, 0 échec** (1148 + 6 nouveaux) ; `git diff --check` réussi sur tous les fichiers touchés, y compris la migration.

Limites assumées : le rate-limiting existant (8 requêtes/10 min par IP) s'applique tel quel, aucune protection anti-spam supplémentaire ajoutée pour le nouveau flux d'écriture ; pas de `ProspectEvent` initial journalisé à la création (cohérent avec `createProspect`/`createProspectAction` existants, qui n'en créent pas non plus) ; pas de nouvelle recette navigateur dédiée pour ce lot (changement server-only, déjà couvert par les 4 tests d'intégration sur la vraie route transpilée ; la carte « Prospects à relancer » elle-même a déjà été vérifiée visuellement dans un lot précédent de cette session).

### 28 septembre 2026 — nettoyage `.env` demandé par Fabien (hors périmètre CRM)

Fabien a demandé de vérifier puis retirer une clé `STRIPE_SECRET_KEY=sk_live_...` repérée en clair dans `.env` (signalée dans le lot précédent). Vérification : requête `GET https://api.stripe.com/v1/balance` avec cette clé → **401 Unauthorized** (déjà révoquée/remplacée côté Stripe — vérification d'authenticité minimale, aucune donnée ni paiement réel consulté ou déclenché, résultat binaire seulement). Ligne retirée de `.env` sur instruction explicite ("supprime la de env"). `.env` n'est pas suivi par git (`.env*` dans `.gitignore`), donc aucun historique à nettoyer. Seul `app/api/stripe/webhook/route.ts` importe `lib/stripe.ts` (le seul des deux clients Stripe du dépôt à instancier de façon non paresseuse, donc à pouvoir lever "Missing STRIPE_SECRET_KEY" dès l'import) — aucun autre chemin de code affecté. `npm test` toujours au vert après coup (1154/1154 à ce moment-là, aucun test n'importe ce module réel).

### 28 septembre 2026 — rattachement à l'éditeur de schéma existant (champ préparé, jamais câblé)

Gap trouvé par lecture, pas par un rapport utilisateur : `CoachingProject.linkedProjectId`/`linkedProject` (champ additif introduit dans un lot précédent de cette session, précisément pour répondre à `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md`) **n'était lu ni écrit nulle part dans l'application** — seulement présent dans `prisma/schema.prisma` et `docs/03-DATABASE.md` §4 (qui documentait déjà précisément le plan à suivre : réutiliser `createProjectForCustomerAction`/`createProjectForCustomerByAdmin` et `/outils/schema/editeur?projectId=...` tels quels, proposer un rattachement plutôt qu'une seconde création si un `Project` existe déjà chez ce client). Ce lot met en œuvre ce plan déjà écrit, sans le modifier.

Réalisé :

- `lib/services/coaching-project.ts` : `getCoachingProjectForDetail` inclut désormais `linkedProject` (id/name/updatedAt) ; nouvelles fonctions `linkCoachingProjectToSchemaProject` (vérifie que le `Project` cible appartient au **même** `customerId` que l'accompagnement — jamais confiance dans un ID de formulaire seul, même principe d'ownership que partout ailleurs cette session ; refuse aussi un `Project` déjà rattaché à un *autre* accompagnement, mais accepte le re-rattachement au même) et `unlinkCoachingProjectSchemaProject`, toutes deux journalisant un événement (`SCHEMA_LIE`/`SCHEMA_DELIE`).
- `app/dashboard/crm/actions.ts` (devenu `project-lifecycle-actions.ts`, voir plus bas) : `linkCoachingProjectSchemaAction`/`unlinkCoachingProjectSchemaAction`.
- `components/dashboard/crm/SchemaLinkCard.tsx` (nouveau) : si un schéma est déjà rattaché, lien direct vers `/outils/schema/editeur?projectId=...` (l'éditeur admin existant) + bouton « Détacher » ; sinon, `<select>` pour rattacher un `Project` existant du même client (`listProjectsForCustomer({role:"admin"}, customerId)`, déjà ownership-safe), ou une invite à en créer un depuis la fiche client existante si aucun n'existe — jamais de second parcours de création construit ici. Rendue sur `/dashboard/crm/projects/[projectId]` juste avant « Révisions de schéma » (concept distinct et complémentaire, déjà présent — voir docs/03-DATABASE.md §4, pas fusionné).
- `app/mon-compte/mon-van/[projectId]/page.tsx` : nouvelle carte « Votre schéma » (si rattaché) avec lien vers `/mon-compte/projets/{id}` — la page client possède déjà son propre contrôle d'ownership (`getProject`), donc aucun risque de fuite cross-client même si le lien était deviné : le rattachement lui-même a déjà garanti que ce `Project` appartient à ce client.
- Aucune nouvelle migration : le champ existait déjà, seule l'absence de code l'utilisant était le problème.

**Pas de séparation brouillon/partagé construite** (question posée puis résolue par lecture de docs/03-DATABASE.md §4, qui l'avait déjà tranchée) : `ProjectSchemaVersion` (figer une étape) et `shareToken`/`shareEnabledAt` (partage public explicite) gèrent déjà ce besoin pour un tiers non authentifié ; un client authentifié voit toujours l'état live de son propre `Project`, ce qui est le comportement voulu (collaboration coach/client sur le même dossier), pas une fuite.

**Effet de bord découvert en cours de route, corrigé séparément :** `app/dashboard/crm/actions.ts` était passé à 909 lignes avec les ajouts cumulés de cette session (déjà à 776 avant le début de ce travail) — au-dessus du plafond dur de 800 lignes des règles de style du dépôt. Extraction de 8 fonctions (création/mise à jour/clôture/réouverture d'accompagnement, rattachement schéma, fiche d'entretien, note rapide — celles qui touchent au cycle de vie du `CoachingProject` lui-même) vers un nouveau fichier `app/dashboard/crm/project-lifecycle-actions.ts` (253 lignes). `actions.ts` revient à 681 lignes. Trois pages consommatrices mises à jour (`app/dashboard/crm/clients/[customerId]/page.tsx`, `app/dashboard/crm/clients/new/page.tsx`, `app/dashboard/crm/projects/[projectId]/page.tsx`). `tests/crm-entretien-actions.test.ts` chargeait `updateEntretienInfoAction`/`addQuickCoachingNoteAction` depuis l'ancien fichier transpilé — cassé par l'extraction (4 échecs), corrigé en paramétrant son helper `loadActions` par chemin de fichier (`createCoachingActionItemAction` reste testé depuis `actions.ts`, les deux autres depuis le nouveau fichier).

Fichiers modifiés : `lib/services/coaching-project.ts`, `app/dashboard/crm/actions.ts`, `app/mon-compte/mon-van/[projectId]/page.tsx`, `app/dashboard/crm/projects/[projectId]/page.tsx`, `app/dashboard/crm/clients/[customerId]/page.tsx`, `app/dashboard/crm/clients/new/page.tsx`, `tests/crm-entretien-actions.test.ts`. Nouveaux : `app/dashboard/crm/project-lifecycle-actions.ts`, `components/dashboard/crm/SchemaLinkCard.tsx`, `tests/coaching-schema-link.test.ts` (7 cas : rattachement réussi + événement, rejet cross-client, rejet si déjà lié à un autre accompagnement, re-rattachement idempotent au même, deux cas 404, détachement + événement).

Vérifications : ESLint réussi (aucun avertissement, y compris après le correctif du test) ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm test` (suite complète) : **1161/1161 réussis, 0 échec** (1154 + 7 nouveaux) ; `git diff --check` réussi sur tous les fichiers ; toutes les tailles de fichiers vérifiées ≤ 800 lignes (`actions.ts` 681, `project-lifecycle-actions.ts` 253, page projet CRM 789 — proche du plafond, à surveiller lors d'un prochain ajout).

Pas de recette navigateur dédiée pour ce lot précis (délibéré : la partie la plus sensible — l'ownership serveur du rattachement — est déjà prouvée par les tests d'intégration sur le vrai service ; une vérification visuelle du rendu des deux nouvelles cartes reste à faire lors de la prochaine recette groupée de ces pages).

Limite assumée : le rattachement reste manuel (le coach choisit explicitement dans une liste) — aucune suggestion automatique ni pré-remplissage par nom de projet, conforme à « aucune fusion automatique par nom » (§10 du plan).

### 28 septembre 2026 — nettoyage `.env` : clé Stripe morte retirée, suppression du fichier orphelin Vercel Blob tentée puis abandonnée

Suite au signalement de la clé `STRIPE_SECRET_KEY` (lot précédent), Fabien a confirmé qu'il s'agissait d'un reliquat et a demandé sa suppression après vérification. Vérifiée (`GET /v1/balance` → 401, déjà révoquée) puis retirée de `.env`. Voir entrée dédiée plus haut pour le détail.

Fabien a ensuite demandé la suppression du fichier orphelin sur Vercel Blob (incident signalé le 28 septembre, PNG de test de 68 octets sans DB record). Tentative via un script ciblé appelant directement `del()` du SDK `@vercel/blob` avec l'URL exacte du fichier — **bloquée par le classificateur de permissions automatique** (catégorie "Cloud Storage Mass Delete", même pour un fichier unique et identifié). Refus respecté, aucun contournement tenté. Fabien a choisi de laisser tomber pour l'instant ("laisse tomber pour l'instant continue") — le fichier reste orphelin, inoffensif, sans trace dans le CRM. Option pour plus tard : suppression manuelle par Fabien via son tableau de bord Vercel, ou ajout d'une règle de permission explicite s'il souhaite que je le fasse.

### 28 septembre 2026 — le client peut cocher lui-même ses actions « à faire »

Gap trouvé par lecture : la carte « Ce qu'il vous reste à faire » (`/mon-compte/mon-van/[projectId]`) affichait les actions `responsible: CLIENT` en pure lecture seule — le client devait prévenir son coach par un autre canal (WhatsApp...) pour qu'une action soit cochée dans le CRM. Fabien a signalé en cours de route avoir besoin de quelque chose de fonctionnel sous 30 minutes ; ce lot a été mené à son terme dans cette fenêtre (build + tests + recette navigateur inclus) plutôt que laissé à moitié fait.

Réalisé :

- `lib/services/coaching-project.ts` : nouvelle fonction `updateCoachingActionStatusByClient({actionId, customerId, status})`, distincte de `updateCoachingActionStatus` (coach, aucune vérification car appel admin) — revérifie ici que l'action appartient au **même** `customerId` (`forbidden` sinon) ET que `responsible === "CLIENT"` (`forbidden` sinon, y compris pour une action au responsable `null`, cas des actions créées avant l'ajout de ce champ) avant d'écrire, même principe d'ownership serveur que partout ailleurs cette session. Journalise un événement `ACTION_CLIENT`.
- `app/mon-compte/mon-van/actions.ts` : nouvelle action `markOwnActionStatusAction`.
- `app/mon-compte/mon-van/[projectId]/page.tsx` : bouton « C'est fait » (cible tactile ≥44px, texte clair) par action de la liste, formulaire dédié par ligne.

Fichiers modifiés : `lib/services/coaching-project.ts`, `app/mon-compte/mon-van/actions.ts`, `app/mon-compte/mon-van/[projectId]/page.tsx`. Nouveau test : `tests/coaching-action-client-status.test.ts` (5 cas : succès propriétaire légitime, rejet cross-client, rejet action `COACH`, rejet action sans responsable assigné, 404).

Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, tous préexistants et sans rapport (confirmé un par un dans le flot de sortie) ; `npm test` (suite complète) : **1166/1166 réussis, 0 échec** ; **`npm run build` réussi** (compilation de production propre, demandé explicitement vu l'urgence) ; `git diff --check` réussi.

**Recette navigateur reçue (agent en arrière-plan) : tous les points confirmés**, y compris le test de sécurité le plus important — soumission du formulaire avec le champ caché `actionId` bricolé en DOM pour viser l'action d'un autre client (vraie soumission via `form.requestSubmit()`, pas un fetch bricolé qui casse le protocole Server Actions de Next) → rejetée proprement (`403`, message clair, aucune mise à jour silencieuse), données de l'autre client intactes, vérifié en base. Un faux 500 rencontré lors d'un premier essai en `fetch()` brut était un artefact du script de test (protocole Server Actions non respecté), pas un bug applicatif — écarté après ré-essai avec une vraie soumission de formulaire. Données de test entièrement nettoyées après coup.

Limite assumée : pas de bouton pour « annuler » une action déjà marquée faite depuis l'espace client (le formulaire n'envoie que `status=FAIT`) — cohérent avec le principe « chaque élément peut être indiqué comme non applicable, pas de formulaire disproportionné » ; une correction reste possible côté coach via le CRM si besoin.

### 28 septembre 2026 — fiche d'entretien : saisie préservée en cas d'erreur (D13), mode clair du dashboard, premier commit et déploiement en production

Fabien a eu besoin d'utiliser la fiche d'entretien pour une vraie séance de coaching dans l'heure. Plutôt qu'un déploiement précipité, l'app a été lancée en local (`npm run dev` sur `fabsystem_dev`, déjà migrée) — la fiche d'entretien est un outil admin, pas quelque chose que le client externe doit voir en direct. Mot de passe admin local reconfiguré (celui de `.env.local` ne correspondait pas au vrai mot de passe de Fabien — base de test distincte de la prod). Un client + accompagnement de test créés directement via le vrai client Prisma (adapter `@prisma/adapter-pg`, car les services `server-only` ne s'importent pas hors du bundler Next). Finalement Fabien a fait sa séance sur papier comme d'habitude, et a demandé de finir le travail proprement pour une utilisation ultérieure.

**D13 (AUDIT_INDEPENDANT_FABSYSTEM.md) — saisie non reprise après erreur**, corrigé pour la fiche d'entretien (le formulaire le plus exposé à ce risque en séance réelle) :
- `updateEntretienInfoAction` (`project-lifecycle-actions.ts`) : en cas d'erreur, la saisie brute (`preoccupations`, `accordPrixEuros`, `accordPerimetre`, `accordMiseAuPropre`, `resumePartage`) est renvoyée dans l'URL de redirection (`entretienDraft`, JSON encodé) plutôt que perdue derrière le seul message d'erreur.
- `EntretienSection.tsx` : parsing défensif du brouillon (JSON invalide/absent → simplement ignoré, jamais une erreur affichée à la place du formulaire) ; chaque champ préfère le brouillon aux valeurs déjà en base.
- Limite assumée : seule la fiche d'entretien est corrigée ; le même risque existe sur d'autres formulaires du CRM (D13 le note explicitement pour plusieurs), à étendre si besoin observé.
- Test : `tests/crm-entretien-actions.test.ts` (+1 cas, vérifie que les 5 champs tapés survivent dans l'URL de redirection après un échec).

**Mode clair du dashboard admin** (retour utilisateur : « difficilement visible le jour », usage extérieur) :
- `app/dashboard/dashboard-theme.css` (nouveau) : le dashboard entier est en classes Tailwind sombres codées en dur (aucune variable CSS, aucun système de thème existant) — plutôt qu'une réécriture de chaque composant (gros chantier, risqué à faire vite pendant un usage réel), ce fichier surcharge directement les ~35 classes de couleur `neutral-*` effectivement utilisées (recensées par grep sur tout `app/dashboard`+`components/dashboard`) sous un sélecteur `[data-theme="light"]`. Mode sombre inchangé par défaut.
- `DashboardShell.tsx` : bouton « Mode clair »/« Mode sombre » (cible ≥44px, texte clair) dans l'en-tête mobile et la barre de fil d'Ariane desktop ; préférence mémorisée dans `localStorage`, lue une seule fois après montage (jamais dans l'état initial — `localStorage` n'existe pas côté serveur, casserait le SSR).
- Limite assumée : couverture des classes les plus utilisées, pas une garantie à 100 % sur chaque page — Fabien invité à signaler tout endroit resté peu lisible.

**Premier commit de toute cette session** (`c8ebdfa`, 68 fichiers, sur `main`) — rien n'avait été commité avant, sur demande explicite de Fabien après confirmation que l'app fonctionne. Puis, sur sa demande explicite et après qu'il ait fourni lui-même la chaîne de connexion de production (jamais écrite dans un fichier, utilisée une seule fois en mémoire pour la durée de la commande) :
- `prisma migrate status` contre la vraie base de production (Neon) : confirmé que seules les 8 migrations de cette session étaient en attente (les migrations plus anciennes de la fusion CRM étaient déjà appliquées lors d'une session précédente) ; relecture ligne par ligne des 8 migrations en attente pour confirmer qu'aucune n'est destructrice sur une base déjà peuplée (aucune colonne `NOT NULL` sans valeur par défaut, aucune suppression).
- `prisma migrate deploy` exécuté contre la production — succès, `migrate status` confirme la base à jour.
- `git push origin main` — poussé (`afcfc98..c8ebdfa`). Le dépôt est relié à un vrai projet Vercel (`.vercel/project.json`), donc un déploiement automatique était attendu à la suite du push.
- Vérification après coup : `https://www.fabsystem.fr` répond 200, `/login` répond 200, `/dashboard/crm` redirige proprement (307, session absente) — aucune erreur 500 constatée sur ces routes de base.

**Point d'attention pour la suite** : Fabien utilisera le CRM en production une fois qu'il aura vérifié lui-même que tout va bien — aucune donnée réelle n'y a encore été saisie via ce nouveau système à la date de cette entrée.

### 28 septembre 2026 — extension de la protection anti-perte de saisie (D13) aux formulaires les plus exposés

Suite à la fiche d'entretien (lot précédent), extension du même principe à trois autres formulaires — priorisés par exposition réelle (formulaires remplis en direct, pendant un appel ou par le client lui-même, pas des réglages ponctuels) :

- `addQuickCoachingNoteAction` (note rapide WhatsApp/visio) : la saisie (canal, sujet, conclusion, prochaine action) est renvoyée dans l'URL d'erreur (`noteDraft`) plutôt que perdue.
- `updateVehicleInfoAction` (« Votre projet et véhicule », 16 champs, **rempli par le client lui-même**, pas seulement le coach) : idem (`vehicleDraft`).
- `updateUsagesInfoAction` (« Votre quotidien et votre recharge », 15 champs, client) : idem (`usagesDraft`).

Pattern identique à chaque fois : capturer la saisie brute avant le `try`, la joindre en JSON encodé à l'URL de redirection uniquement en cas d'erreur, et au niveau de la page, préférer ce brouillon aux valeurs déjà en base via un parsing défensif (JSON invalide/absent → simplement ignoré). `EntretienSection.tsx` a vu son helper de parsing généralisé (`parseEntretienDraft` → `parseDraft<T>`) pour couvrir aussi la note rapide ; `app/mon-compte/mon-van/[projectId]/page.tsx` a son propre `parseDraft` local (même petite duplication déjà pratiquée ailleurs dans ce dépôt pour des helpers triviaux, plutôt qu'une abstraction partagée prématurée).

Fichiers modifiés : `app/dashboard/crm/project-lifecycle-actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`, `components/dashboard/crm/EntretienSection.tsx`, `app/mon-compte/mon-van/actions.ts`, `app/mon-compte/mon-van/[projectId]/page.tsx`. Tests : `tests/crm-entretien-actions.test.ts` étendu (+1 cas pour la note rapide) ; nouveau `tests/mon-van-vehicle-action-draft.test.ts` (3 cas : véhicule en erreur avec saisie complète préservée, véhicule en succès sans brouillon joint, usages en erreur avec saisie préservée).

Vérifications : ESLint réussi (aucun avertissement) ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm test` (suite complète) : **1171/1171 réussis, 0 échec** ; `git diff --check` réussi sur tous les fichiers.

Limite assumée : les formulaires admin plus rarement touchés en cours de séance (circuits, révisions de schéma, matériel...) ne sont pas couverts par ce lot — l'audit D13 cible en priorité les formulaires où une vraie perte de saisie ferait mal (appel en cours, client en train de remplir), pas une couverture exhaustive de tous les formulaires du CRM d'un coup.

Commité (`2ab0db5`) et poussé sur `main` — aucun changement de schéma, aucun risque prod, redéploiement Vercel attendu ; `https://www.fabsystem.fr` revérifié 200 après coup.

### 28 septembre 2026 — D13 : dernier des trois gros formulaires « étape » du dossier client (implantation)

Complète la trilogie des formulaires client à plusieurs champs remplis en direct par le client (véhicule, usages, et maintenant implantation — étape 5, 5 champs) avec le même principe exact que les deux précédents : `updateImplantationInfoAction` capture la saisie brute avant le `try` et la renvoie en JSON encodé (`implantationDraft`) dans l'URL d'erreur ; la page préfère ce brouillon aux valeurs en base via le `parseDraft` déjà généralisé.

Fichiers modifiés : `app/mon-compte/mon-van/actions.ts`, `app/mon-compte/mon-van/[projectId]/page.tsx`, `tests/mon-van-vehicle-action-draft.test.ts` (+1 cas). Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm test` (suite complète) : **1172/1172 réussis, 0 échec** ; `git diff --check` réussi.

Avec ce lot, les trois formulaires « étape » du dossier client (véhicule, usages, implantation — 36 champs au total) et les deux formulaires principaux du coach (fiche d'entretien, note rapide) sont tous couverts par D13. Restent hors périmètre, par choix assumé : les formulaires de création rapide (appareil, matériel, circuit — saisie courte, retape moins coûteuse) et les formulaires admin secondaires.

### 28 septembre 2026 — écrans d'erreur : « lien expiré ou session expirée » (scénario §10)

En creusant D13 pour repérer le prochain formulaire à protéger, constat plus large : **aucun fichier `error.tsx`/`global-error.tsx` n'existait nulle part dans tout le site.** `requireCustomerActor()` (utilisé en tout début de presque toutes les pages/actions sous `/mon-compte/**`, avant tout try/catch) lève une erreur `unauthorized()` si le cookie de session client est absent/invalide — sans limite d'erreur, ça affichait l'écran brut par défaut de Next.js, pour une session expirée comme pour un vrai bug. Correspond exactement au scénario obligatoire du plan : « Lien expiré ou session expirée → Reconnexion compréhensible ».

Correction envisagée puis écartée : modifier `requireCustomerActor()` elle-même pour rediriger au lieu de lever une erreur. Écartée après avoir recensé ses ~40 appelants — la moitié sont des routes `app/api/**` qui ont besoin d'un vrai 401 JSON (`toErrorResponse`), pas d'une redirection HTML ; changer la fonction partagée aurait cassé ces routes.

Réalisé à la place — une limite d'erreur par section, le mécanisme natif Next.js pour ce cas exact (une erreur non rattrapée dans une page **ou une Server Action déclenchée depuis cette page** remonte à la limite la plus proche) :
- `app/mon-compte/error.tsx` (nouveau) : message en langage clair (« Cela peut arriver si votre connexion a expiré »), boutons « Réessayer » et « Me reconnecter » (`/connexion-client`). Aucune distinction fiable session-expirée/vrai-bug n'est possible ici (Next retire le message d'erreur précis en production, volontairement, pour ne rien exposer) — message générique assumé plutôt qu'un faux diagnostic.
- `app/dashboard/error.tsx` (nouveau) : même principe, thème sombre (`AdminCard`/`AdminButton`). Moins critique côté session (`requireSession()` redirige déjà proprement vers `/login`), mais couvre les autres pannes non rattrapées (bug réel, base injoignable...) qui plantaient aussi sans filet jusqu'ici — et c'est justement la page que Fabien utilise en ce moment.
- Aucune récupération de la saisie à travers une reconnexion (la partie « selon le mécanisme retenu » du scénario, explicitement facultative dans l'audit D13 — « un brouillon local est facultatif ») : hors périmètre assumé de ce lot, le cas est déjà rare (cookie de session client valable 30 jours).

Fichiers : nouveaux `app/mon-compte/error.tsx`, `app/dashboard/error.tsx`. Pas de nouveau test unitaire (composants d'erreur React purs, difficiles à couvrir avec le pattern vm+transpile déjà en place) — recette navigateur lancée en arrière-plan pour vérifier : écran affiché sans session (pas l'écran brut de Next), bouton « Me reconnecter » fonctionnel, bouton « Réessayer » sans casser davantage, un client réellement connecté ne voit jamais cet écran par erreur, aucune information technique sensible affichée.

Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm run build` réussi (compilation de production propre) ; `npm test` (suite complète) toujours **1172/1172**.

**Recette navigateur reçue (agent en arrière-plan) : les 5 points confirmés**, avec une précision utile découverte en cours de route — `app/mon-compte/layout.tsx` fait sa propre garde d'authentification (redirection propre vers `/connexion-client`) *avant* que la page ou `requireCustomerActor()` ne s'exécute. Une visite directe sans aucun cookie ne déclenche donc pas `error.tsx` (interceptée plus tôt, correctement). Le scénario réel où `error.tsx` intervient : une session valide au chargement, révoquée *entre* deux navigations côté client (le layout parent ne se remonte pas lors d'une navigation App Router) — reproduit par l'agent en révoquant la session en base pendant que le navigateur restait sur `/mon-compte`, confirmé par la console dev ("handled by the ErrorBoundaryHandler"). Bouton « Me reconnecter » fonctionnel, bouton « Réessayer » ne casse rien, client connecté non affecté, aucune info technique visible sur l'écran.

**Trou structurel trouvé par le même agent, corrigé dans la foulée** : en testant un cookie de session avec une valeur corrompue (espace blanc après décodage, échec du schéma Zod `tokenSchema` dans `lib/services/customer-auth.ts:414`), l'erreur est levée *dans* `app/mon-compte/layout.tsx` lui-même — et un `error.tsx` ne peut structurellement jamais rattraper les erreurs du `layout.tsx` de son propre dossier (limitation du App Router, pas un défaut du fichier). L'agent a vu l'overlay de debug brut de Next (dev uniquement, mais rien n'aurait intercepté ce cas précis en prod non plus). Corrigé en ajoutant `app/error.tsx` à la **racine** du projet : un error.tsx d'un segment ancêtre rattrape bien les erreurs d'un layout enfant. Écran cohérent avec le ton du site public existant (mascotte Volta, même style que `app/not-found.tsx`), boutons « Réessayer »/« Accueil », lien contact — sert aussi de filet par défaut pour tout le reste du site qui n'a pas de error.tsx plus spécifique.

Fichier supplémentaire : nouveau `app/error.tsx`. Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm run build` réussi ; `npm test` (suite complète) toujours **1172/1172**.

**Seconde recette navigateur reçue : les 5 points confirmés.** Le cookie corrompu (espace blanc après décodage, échec `tokenSchema` dans `customer-auth.ts:414`) affiche bien `app/error.tsx` (mascotte Volta, « ERREUR ») et non l'overlay brut de Next — vérifié via le texte réellement rendu (`innerText`, pas le payload RSC inerte des balises `<script>`). Bouton « Accueil » mène à `/`. Bouton « Réessayer » ne casse rien (aucun `pageerror`, seuls des `console.error` volontaires de React signalant que l'erreur a bien été « handled by the ErrorBoundaryHandler »). Navigation normale de `/` sans session : aucun écran d'erreur, comme attendu.

Point de précision utile trouvé en re-testant le point 5 : `app/mon-compte/layout.tsx` a `export const dynamic = "force-dynamic"` et se ré-exécute à *chaque* navigation, y compris côté client — une session révoquée/expirée y est traitée comme un cas normal (`getCustomerSessionFromCookie` neutralise les erreurs 404/409 en `null`, simple redirection propre vers `/connexion-client`), jamais comme une exception. `app/mon-compte/error.tsx` intervient donc pour un autre cas, plus en aval : une vraie erreur non rattrapée *dans* une page ou une action serveur sous `/mon-compte/**`, une fois le layout franchi (ex. `requireCustomerActor()` levant `unauthorized()` — un 401, jamais neutralisé par `getCustomerSessionFromCookie`) — confirmé par lecture de code plutôt que rejoué à l'identique (repro live jugée trop coûteuse pour un point déjà couvert en substance par la première recette). Les trois limites (`app/error.tsx`, `app/mon-compte/error.tsx`, `app/dashboard/error.tsx`) se complètent donc correctement sans se marcher dessus.

### 28 septembre 2026 — D13 sur la fiche projet coach, puis pause de ce chantier

Extension D13 supplémentaire sur `updateCoachingProjectAction` (« Fiche projet » : titre, statut, description, questions en attente, actions à préparer, notes internes) — même pattern exact que les lots précédents. Fabien a fait remarquer, à raison, que ce chantier commençait à tourner en rond (extension formulaire par formulaire sans direction claire) — chantier D13 mis en pause à ce stade plutôt que poursuivi mécaniquement sur les formulaires restants. Ce lot précis, déjà terminé et vérifié (ESLint, `tsc`, build) au moment de la remarque, a été conservé (code fonctionnel, pas de raison de le jeter) et inclus dans le commit suivant plutôt qu'abandonné à mi-chemin.

Fichiers modifiés : `app/dashboard/crm/project-lifecycle-actions.ts`, `app/dashboard/crm/projects/[projectId]/page.tsx`.

### 28 septembre 2026 — fiche contact automatique par e-mail à la conversion d'un client coaching

Demande explicite de Fabien : « rajoute automatique des contacts à mon téléphone si passe en client coaching ». Aucune API web ne permet d'écrire silencieusement dans le carnet d'adresses d'un téléphone (iOS/Android bloquent volontairement ça sans intégration OAuth Google/Apple Contacts, hors périmètre ici) — le plus proche du besoin réalisable immédiatement : générer une fiche contact standard (vCard `.vcf`) et l'envoyer par e-mail au coach dès qu'un client passe en accompagnement, pour qu'un seul geste (ouvrir la pièce jointe) suffise à l'ajouter, au lieu de ressaisir à la main.

Le dépôt avait déjà un générateur de vCard, mais dans l'autre sens (`lib/contact-vcard.ts`, la fiche de Fabien lui-même pour ses visiteurs, servie sur `/vcard.vcf`). Réutilisé son petit helper d'échappement (`escapeVcardValue`, exporté) plutôt que dupliqué.

Réalisé :

- `lib/customer-vcard.ts` (nouveau) : `buildCustomerVcard(customer)`/`customerVcardFilename(customer)` — construit une vCard à partir de `name`/`email`/`phone` d'un `Customer`.
- `lib/services/coaching-project.ts` : nouvelle fonction exportée `notifyCoachOfNewCoachingClient(customerId, sendMailImpl?)` — best-effort (try/catch, jamais bloquant, erreur journalisée via `logServerEvent`), envoie un e-mail à `CONTACT_TO` (la propre boîte de Fabien) avec la vCard en pièce jointe. Appelée **après** l'écriture DB, jamais dedans (un envoi SMTP lent ne doit jamais retenir une transaction ouverte).
- Recherche des points de création réels d'un `CoachingProject` : il y en a **trois**, pas un seul — `createCoachingProject` (création manuelle admin), `convertProspectToClient` (lib/services/prospect.ts — le déclencheur le plus direct du besoin exprimé : « prospect devient client »​), et `createCoachingProjectFromDossier` (lib/services/coaching-dossier-migration.ts — un client qui achète directement un accompagnement, sans passage par un prospect). Les trois appellent désormais `notifyCoachOfNewCoachingClient` après leur écriture.

Fichiers modifiés : `lib/contact-vcard.ts` (export), `lib/services/coaching-project.ts`, `lib/services/prospect.ts`, `lib/services/coaching-dossier-migration.ts`. Nouveau : `lib/customer-vcard.ts`. Tests : nouveau `tests/coaching-notify-new-client.test.ts` (5 cas : e-mail + pièce jointe correctement construits, silence si client introuvable, échec journalisé sans relancer, `createCoachingProject` notifie après création réussie, `createCoachingProject` réussit même si la notification échoue) ; nouveau `tests/prospect-convert-notify.test.ts` (1 cas — comble au passage un gap réel : `convertProspectToClient` n'avait aucun test avant ce lot) ; `tests/coaching-dossier-migration.test.ts`/`tests/coaching-dossier-migration-resolve.test.ts` mis à jour (nouvelle dépendance neutralisée dans leurs mocks, 3 tests cassés par le changement puis réparés).

Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm run build` réussi ; `npm test` (suite complète) : **1178/1178 réussis, 0 échec** (1172 + 6 nouveaux) ; `git diff --check` réussi sur tous les fichiers.

Limites assumées : pas d'intégration Google/Apple Contacts réelle (nécessiterait OAuth avec le compte personnel de Fabien — hors périmètre demandé) ; pas de test de la réception réelle par e-mail (SMTP jamais sollicité pendant ce travail, comme pour tout le reste de la session) — à vérifier par Fabien lui-même en conditions réelles la prochaine fois qu'un client passe en coaching ; le numéro de téléphone n'est inclus dans la vCard que s'il est renseigné sur la fiche client (jamais inventé).

### 28-29 septembre 2026 — câbles superposés dans l'éditeur de schéma (hors CRM) : écart automatique + décalage manuel fiable

Sujet différent du reste de la session : l'éditeur de schéma électrique, pas le CRM coaching. Fabien a signalé (capture d'écran à l'appui) que plusieurs câbles partant d'un même composant (ex. une platine de fusibles à 6 sorties) se superposent parfaitement à l'écran, illisibles et impossibles à corriger à la souris — impossible d'attraper LE bon câble parmi plusieurs exactement superposés. Un système de points de coude manuels (glisser-déposer) existait déjà dans l'éditeur, mais devenait inutilisable précisément dans ce cas de superposition totale (rien à attraper).

Deux correctifs demandés explicitement ("les deux") :

- **Écart automatique par défaut** (`components/schema-editor/edges/CableEdge.tsx`) : chaque câble sans point de coude manuel tourne désormais à une distance légèrement différente de sa borne selon son rang parmi ses "câbles frères" (même nœud source, tri stable par `sourceHandle`) — `offset: 36 + siblingOffsetIndex * 10` au lieu d'un `offset: 36` fixe identique pour tous. Ne s'applique jamais à un câble déjà réglé à la main (jamais d'écrasement d'un réglage voulu).
- **Décalage manuel fiable** (`components/schema-editor/PropertiesSidebar.tsx`, nouveau `CableNudgeControl`) : un câble sélectionné affiche un bloc "Écarter ce câble" avec 4 flèches ↑↓←→ — chaque clic déplace son point de coude de 16px dans cette direction (en crée un au milieu source→destination s'il n'en existe pas encore). Contourne complètement le problème de sélection à la souris : un clic de bouton n'a jamais besoin d'attraper quoi que ce soit visuellement.

Fichiers modifiés : `components/schema-editor/edges/CableEdge.tsx`, `components/schema-editor/PropertiesSidebar.tsx`. Vérifications : ESLint réussi (3 erreurs préexistantes confirmées non liées à ce changement, en comparant avec `git show HEAD:...`) ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm test` (suite complète) toujours au vert ; `npm run build` réussi.

**Première recette navigateur interrompue** par un facteur externe : un `next build` lancé en parallèle par erreur a rendu le serveur `next dev` totalement non-réactif pendant le test, empêchant la suite. Au passage, l'agent a authentiquement vu un `ReferenceError: isAdmin is not defined` — **bug réel trouvé indépendamment**, dû à une erreur d'inattention pendant le développement de la fonctionnalité suivante (voir ci-dessous, un `isAdmin` déclaré dans la mauvaise fonction React). Corrigé avant la recette suivante. Seconde recette relancée après coup, résultat consigné séparément une fois reçu.

### 28-29 septembre 2026 — assistant IA conversationnel dans l'éditeur, admin uniquement

Demande explicite de Fabien pendant la discussion sur les câbles : "je voudrais aussi rajouter un moteur IA mais que pour moi uniquement pour créer ou évaluer les schémas pour me faire gagner du temps". Confirmé faisable, avec un point de sécurité assumé dès le départ et répété dans l'interface : un avis généré par IA sur de l'électrique réel ne doit **jamais** être présenté comme une certification — toujours "à vérifier", jamais "sûr" ou "conforme". Périmètre confirmé par Fabien : évaluation d'abord, génération ensuite (non commencée dans ce lot). Interface demandée explicitement en "mode chat box" plutôt qu'un simple bouton à un coup (le premier prototype — un dialogue "Avis IA" à usage unique — a été construit puis retiré sur retour direct de Fabien, avant d'être commité).

Clé API Anthropic fournie directement par Fabien, jamais réaffichée après réception, stockée uniquement dans `.env.local` (jamais commité, jamais en production sans nouvelle décision explicite) — clé à durée de vie illimitée d'après Fabien, donc particulièrement à protéger.

Réalisé :

- `@anthropic-ai/sdk` ajouté aux dépendances.
- `lib/server/anthropic.ts` : client Anthropic `server-only`, construction paresseuse (même précaution que `lib/server/stripe.ts` — jamais la construction immédiate au niveau module qui avait cassé le webhook Stripe plus tôt dans la session si la clé venait à manquer).
- `lib/ai/schema-summary.ts` : résumé texte compact du schéma (composants + câbles, avec libellés de bornes réels) pensé pour un prompt IA — ni le JSON brut (bruité de métadonnées de rendu) ni le récapitulatif matériel existant (`bom.ts`, pensé pour une commande de pièces, pas pour décrire la topologie).
- `lib/services/schema-ai-chat.ts` : `chatAboutSchema(history, nodes, edges, projectName)` — system prompt encadrant explicitement le rôle ("avis, jamais certification"), contexte du schéma **reconstruit à chaque message** (jamais mis en cache d'un tour à l'autre : le schéma change pendant la conversation), réutilise les contrôles déterministes déjà existants (`computeSchemaIssues`) pour ne jamais les faire répéter par l'IA. Modèle `claude-opus-5`, thinking adaptatif, conforme aux recommandations actuelles du SDK.
- `app/api/schema-editor/ai-chat/route.ts` : réservé admin, garde serveur `getSessionFromCookies()` — **jamais** `requireCustomerActor`, même principe que `/api/schema-unlock/status` déjà existant (un client ne doit jamais atteindre cette route, même en connaissant l'URL).
- `components/schema-editor/AiChatPanel.tsx` : bulle flottante repliée par défaut, panneau de conversation avec suggestion "Évaluer ce schéma", historique local (perdu au rechargement — acceptable pour cette première version), bandeau d'avertissement permanent (pas juste au premier message).
- Montée depuis `components/schema-editor/Editor.tsx`, conditionnée à `isAdmin` — **bug trouvé et corrigé en cours de route** : `isAdmin` avait été déclaré par erreur dans `EditorShortcuts()` (une fonction différente, sans rapport) au lieu de `Editor()`, provoquant un `ReferenceError` détecté par le premier passage de recette navigateur (voir entrée précédente) avant d'être commité — corrigé avant toute vérification finale.

Fichiers modifiés : `components/schema-editor/Editor.tsx`, `components/schema-editor/Ribbon.tsx` (nettoyé après le retrait du premier prototype), `package.json`/`package-lock.json`, `.env.local` (clé, jamais commitée). Nouveaux : `lib/server/anthropic.ts`, `lib/ai/schema-summary.ts`, `lib/services/schema-ai-chat.ts`, `app/api/schema-editor/ai-chat/route.ts`, `components/schema-editor/AiChatPanel.tsx`. Tests : nouveau `tests/schema-ai-chat.test.ts` (4 cas : construction correcte des messages avec contexte injecté dans le dernier tour, refus d'un historique vide, refus si le dernier message n'est pas de l'utilisateur, contrôles automatiques bien transmis sans être dupliqués) ; nouveau `tests/schema-ai-chat-route.test.ts` (4 cas : 403 sans session admin — et l'IA n'est jamais appelée dans ce cas —, 400 sans nodes/edges, 400 messages invalides, 200 avec appel effectif et réponse transmise).

Vérifications : ESLint réussi ; `tsc --noEmit --incremental false` : 68 diagnostics, inchangés ; `npm run build` réussi (confirme aussi qu'aucune frontière `server-only` n'est violée par l'import de type `SchemaAiChatMessage` dans un composant client) ; `npm test` (suite complète) : **1186/1186 réussis, 0 échec** (1178 + 8 nouveaux). Recette navigateur combinée (câbles + assistant IA) lancée en arrière-plan, résultat à consigner séparément une fois reçu.

Limites assumées : génération de schéma depuis une description texte non commencée (périmètre confirmé "évaluation d'abord" par Fabien) ; historique de conversation non persisté (perdu au rechargement de page — acceptable pour une première version, à revoir si Fabien le juge gênant à l'usage) ; pas de streaming de la réponse (réponse complète attendue avant affichage — le schéma reste modeste en taille pour l'instant).

### 29 septembre 2026 — correctif production (réponse IA vide) + choix du modèle dans la chatbox

Fabien a testé la fonctionnalité en production ("Évalue ce schéma : qu'est-ce qui mérite une vérification avant de le montrer au client ?") et reçu l'erreur "L'IA n'a renvoyé aucun texte exploitable." **Cause identifiée** : `max_tokens: 2048` était trop bas — avec `thinking: {type: "adaptive"}`, la réflexion du modèle consomme le même budget que la réponse visible, donc la réflexion pouvait à elle seule épuiser les 2048 tokens avant qu'un bloc de texte ne soit produit (`stop_reason: "max_tokens"`, aucun bloc `text`). **Corrigé** dans `lib/services/schema-ai-chat.ts` : `max_tokens` relevé à 8192, et le message d'erreur inclut désormais `response.stop_reason` pour un diagnostic futur plus rapide. Deux tests ajoutés dans `tests/schema-ai-chat.test.ts` verrouillant `max_tokens >= 8000` et reproduisant exactement la panne (réponse contenant seulement un bloc `thinking`, `stop_reason: "max_tokens"`).

Ensuite, suite aux questions de Fabien ("l'IA utilise quel moteur ?", "Sonnet ne suffirait pas ?"), demande explicite : "laisse-moi le choix directement dans le chatbox". Ajouté :

- `SCHEMA_AI_MODELS` (liste fermée `claude-opus-5` / `claude-sonnet-5`) et `schemaAiModelSchema` (validateur Zod construit sur cette liste) dans `lib/services/schema-ai-chat.ts` — jamais de chaîne libre envoyée par le navigateur, pour la sécurité/le coût et pour éviter un nom de modèle mal orthographié qui échouerait silencieusement. `chatAboutSchema` accepte un 5ᵉ paramètre `model`, par défaut `claude-opus-5` (comportement inchangé pour tout appel existant sans ce paramètre).
- `app/api/schema-editor/ai-chat/route.ts` : `body.model`, facultatif, validé via `schemaAiModelSchema.safeParse` (400 si présent mais invalide), transmis à `chatAboutSchema`.
- `components/schema-editor/AiChatPanel.tsx` : sélecteur `<select>` dans l'en-tête du panneau, alimenté par `SCHEMA_AI_MODELS`, valeur envoyée dans chaque requête.

Fichiers modifiés : `lib/services/schema-ai-chat.ts`, `app/api/schema-editor/ai-chat/route.ts`, `components/schema-editor/AiChatPanel.tsx`, `tests/schema-ai-chat.test.ts`, `tests/schema-ai-chat-route.test.ts`.

Vérifications : ESLint réussi sur les fichiers modifiés ; `tsc --noEmit` sans nouvelle erreur dans les fichiers touchés (diagnostics restants confirmés préexistants, sans rapport) ; `npm test` (suite complète) : **1191/1191 réussis, 0 échec**.
