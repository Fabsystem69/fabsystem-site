# Clarification prioritaire — réutiliser le schéma déjà attribué au client

Fabien rappelle qu’il peut déjà mettre un schéma sur le compte d’un client depuis le dashboard. Il demande de partir de ce fonctionnement pour obtenir un outil complet, sans multiplier les systèmes. Cette précision doit être prise en compte AVANT de figer le modèle de consolidation ; elle ne demande pas d’abandonner un lot de correction en cours.

## Vérification du code actuel (lecture uniquement)

- `app/dashboard/customers/[id]/page.tsx:379` : formulaire « Créer et ouvrir l’éditeur », nom, support, tension et modèle.
- `app/dashboard/customers/[id]/actions.ts:147` : `createProjectForCustomerAction`, garde admin, création sur le customerId et ouverture `/outils/schema/editeur?projectId=...`.
- `app/dashboard/accompagnements/[dossierId]/page.tsx:71` et `:150` : rubrique « Schéma électrique », liste des projets du client, ouverture dans l’éditeur et création depuis l’accompagnement. La liste est recherchée par customerId, pas par relation à cette prestation particulière.
- `lib/services/project.ts:391` : `createProjectForCustomerByAdmin` crée un `Project` appartenant au client, avec `createdByAdmin`, et peut initialiser son vrai schéma depuis la galerie existante.
- `app/dashboard/projects/[projectId]/page.tsx:101` : ouverture du même projet dans l’éditeur.
- `components/schema-editor/AdminProjectSwitcher.tsx` : recherche et reprise de projets clients directement dans l’éditeur.
- `components/schema-editor/SaveToProjectMenu.tsx` : enregistrement du schéma courant dans un projet du client connecté (ne pas confondre ce menu avec le chemin administrateur).
- `app/api/projects/[projectId]/schema/route.ts` et `lib/services/project-schema.ts:138` : lecture/enregistrement via `ProjectSchema`, autorisation sur le projet ; l’enregistrement met à jour l’état courant. L’admin peut travailler indépendamment du verrou commercial d’édition du client.
- `app/mon-compte/projets/[projectId]/page.tsx:57` : lit déjà le schéma et transmet son aperçu à l’interface client.
- `components/schema-editor/SharedSchemaViewer.tsx`, `ShareSchemaDialog.tsx`, routes de versions/restauration et partage existent aussi. La création du lien de partage passe actuellement par une route avec `requireCustomerActor`. Le lien partage l’état consultable courant ; ne pas le qualifier de publication privée figée ou de partage admin opérationnel sans vérifier ses gardes et le traitement réel.

Les références peuvent se déplacer pendant le travail de Claude. Aucune création de schéma ni sauvegarde en base réelle n’a été effectuée pour cette vérification.

## Conséquence pour la consolidation

Ne pas limiter la réflexion à `DossierClient` et `CoachingProject` en oubliant `Project`/`ProjectSchema`, qui portent déjà le vrai travail dans l’éditeur. Ils doivent être présents dans la cartographie et le plan de données.

- Conserver l’éditeur existant, ses projets et ses fichiers de schéma. Aucun second éditeur, format concurrent ou copie indépendante de nœuds/câbles dans le CRM.
- Depuis le dossier unifié, réutiliser les actions existantes « Créer le schéma » / « Ouvrir le schéma », avec rattachement explicite au projet pertinent. S’il existe déjà, le sélectionner sans le recréer.
- Ne pas associer automatiquement tous les projets d’un client à tous ses accompagnements. Deux projets d’une même personne peuvent concerner deux supports ou prestations distincts.
- Le client doit retrouver le même schéma depuis son dossier, dans une présentation simple. Réutiliser le rendu/aperçu/exports existants et les droits applicables. Ne pas forcer un téléchargement puis un nouvel upload pour alimenter son dossier.
- Examiner les versions/restaurations/partages existants avant tout ajout. La proposition « brouillon privé → partager une version figée » formulée auparavant par Codex est une piste, pas une exigence métier confirmée ni une fonction à ajouter d’office. Ne pas retirer une capacité actuelle d’accès/édition du client sans expliquer le changement nécessaire.
- Définir une seule référence pour le schéma, des liens persistants cohérents et des états de suivi sans duplication. Un état technique partagé n’est pas une validation électrique automatique.
- Unifier les entrées visibles et l’expérience ; plusieurs tables spécialisées peuvent subsister si elles servent ce même dossier et ne créent pas deux parcours concurrents.

## Recette à inclure

Client ayant déjà un Project et un schéma : reprise dans son accompagnement sans duplication. Client avec deux projets : sélection du bon schéma. Création depuis le dossier : apparaît sur le bon compte et se rouvre dans l’éditeur. Modification enregistrée : comportement côté client vérifié et expliqué. Accès d’un autre client refusé. Droits d’édition existants conservés. Aucun téléchargement/réimport manuel requis pour faire apparaître le schéma.

## Autre complément confirmé

`PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` contient la vision client guidée validée par Fabien (clientèle souvent peu à l’aise avec l’informatique). L’appliquer aux écrans consolidés : dossier simple, prochaine action claire, aide visible et consultation facile du schéma, sans autre système parallèle. Le document est une cible, pas une preuve de fonctionnalités réalisées.

Même périmètre d’autorisation : modifications locales, tests isolés, aucun push/déploiement/action réelle ni migration distante. Préserver le travail existant.
