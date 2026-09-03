# Plan de donnees - suivi admin des projets

## Niveaux d'acces par projet

Chaque projet reste dans l'un de ces deux niveaux simples :

- **Autonome** : le client utilise l'editeur et les outils pour lui-meme. Son dossier et ses decisions restent prives. Il peut demander une relecture ponctuelle de son schema : FabSystem voit alors le schema demande, pas l'ensemble du dossier.
- **Accompagne** : le client a explicitement autorise le partage de son dossier. FabSystem pilote les etapes, ajoute des consignes, valide les decisions, relance si besoin et peut ouvrir le lien cloud que le client a renseigne.

La demande de relecture est une passerelle vers l'accompagnement, sans retirer
de valeur au mode autonome. Le passage en accompagne est une action explicite
de l'administrateur et reste conditionne au consentement de partage du client.

## Objectif

Donner a l'administrateur une vue operationnelle des projets partages par les
clients et la possibilite de valider, demander une correction ou laisser une
consigne pour chaque etape du parcours.

## Ce qui reste la source de verite

- `ProjectRetainedValue`, `ProjectSchema` et `Project` restent les sources de
  verite des donnees techniques et de l'avancement technique.
- Le suivi ne persiste pas la position d'un client dans son interface guidee,
  car celle-ci est un confort d'utilisation local au navigateur.
- `ProjectFollowUpReview` est la source de verite de l'etat de revue humain
  par etape.
- `ProjectFollowUpEvent` est l'historique immuable des actions admin.

## Tables additives

`ProjectFollowUpReview` contient au plus une revue courante par paire
`(projectId, stepKey)` : statut, consigne visible par le client et date de
derniere revue.

`ProjectFollowUpEvent` conserve chaque demande de correction, validation ou
note envoyee. Aucun evenement existant n'est modifie ou supprime.

## Acces

- Les routes `/dashboard/projects/*` sont reservees a la session admin.
- Seuls les projets dont le client a active `dataShareConsent` sont listes.
- Le client lit les retours uniquement sur son propre projet, deja controle
  par `getProject(actor, projectId)`.

## Hors scope du premier lot

- messagerie client libre ou notifications email;
- pieces jointes et depot de photos;
- assignation multi-admin ou SLA;
- modification des donnees techniques client par le dashboard.
