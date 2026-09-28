# Consigne complémentaire pour Claude — après le travail CRM en cours

## Ordre et autorisation

Fabien a confirmé cette évolution après le lancement de la reprise décrite dans `PROMPT_REPRISE_CLAUDE_CRM.md`. Termine le travail déjà confié et mets à jour son journal avant d’implémenter ce complément. Ne recommence pas l’audit ni la fusion. Lis l’état réel résultant de ton travail : les chemins mentionnés ici sont ceux observés avant la consolidation et peuvent avoir changé.

Les modifications locales et tests isolés sont autorisés. Les limites précédentes restent applicables : aucun push, déploiement, paiement, e-mail réel, purge ni migration distante. Préserve les changements existants. Documente le plan de données avant toute modification de schéma.

## Besoin confirmé

Le van est le marché principal de Fabien, pas une limite de son activité. Il peut accompagner un camping-car ou un bateau. Adapter le système commun existant pour ces projets, sans multiplier les outils.

- Un seul CRM et un seul système d’accompagnement.
- Un dossier par projet, deux vues coach/client selon les permissions.
- Des libellés génériques « Mon projet », « Mon dossier », « Mes accompagnements » selon le contexte.
- Type de support proposé : van/fourgon, camping-car, bateau, autre ; possibilité de ne pas encore savoir.
- Socle commun : entretien, besoins électriques, matériel, schémas, échanges, documents, prochaines actions et clôture.
- Questions spécifiques au support seulement lorsqu’elles servent réellement le suivi ; ne pas imposer des informations automobiles à un bateau.
- Utilisation simple depuis téléphone et PC, avec 5–10 clients en parallèle.

## Partir de ce qui existe

Avant tes éventuels changements de consolidation, le dépôt possédait déjà `Customer.assetType`, un enum `AssetType`, ainsi que `Project.assetType` et un enum `ProjectAssetType` pour le projet de l’éditeur. Le dossier coaching `CoachingProject` avait des champs `vehicleBrand`, `vehicleModel`, etc. Vérifie leur sens et leurs valeurs actuelles avant de choisir la représentation.

Le type du client n’est pas forcément le type de chacun de ses projets : une même personne peut avoir un van puis un bateau. Le type doit être porté par le dossier accompagné (ou sa référence projet unique après fusion), sans créer une seconde identité client ni une nouvelle famille de dossiers. Un type historique du client peut aider à proposer une valeur, mais ne justifie pas de réécrire automatiquement tous ses projets.

Réutilise les types et validations existants lorsque leurs significations conviennent. N’ajoute pas un enum concurrent juste pour changer un libellé ; ne force pas non plus « camping-car » dans « van » si cela empêche les distinctions nécessaires. Documente une extension minimale si les valeurs actuelles sont insuffisantes. Les inconnus restent inconnus : aucun ancien dossier ne devient automatiquement « van » parce que son URL contenait mon-van.

## Travail attendu

1. Recenser les libellés et hypothèses « van/véhicule » dans le parcours unifié : dashboard, entretien, fiche client, navigation, formulaires, exports, instantanés et messages générés. Distinguer un contenu marketing volontairement dédié aux vans d’un écran de suivi générique. Ne pas remplacer aveuglément tous les mots « van » du site.
2. Ajouter ou réutiliser un type de support au niveau du projet. Permettre au coach de le préciser et assurer sa cohérence dans les deux vues. Réutiliser les règles d’édition, permissions et concurrence du dossier partagé, sans second champ indépendant côté client.
3. Adapter les titres, aides, exemples et champs applicables. Commencer par les informations communes (marque/constructeur, modèle, année, contexte, usages). Les questions automobiles existantes ne doivent pas être obligatoires pour un bateau. N’invente pas un questionnaire nautique complet sans besoin observé.
4. Conserver les données lors d’un changement de type. Masquer un champ inapplicable ne doit pas envoyer une valeur vide qui l’efface. Si d’anciennes informations spécifiques subsistent, les rendre retrouvables par le coach plutôt que les supprimer silencieusement.
5. Adapter les exports et nouveaux instantanés au contexte du projet sans réécrire les révisions historiques déjà figées. Assurer la lecture des anciens instantanés où le type est absent.
6. Choisir une entrée client générique dans le parcours déjà consolidé. Un ancien chemin `/mon-compte/mon-van/*` peut rester compatible ou rediriger vers la route canonique ; ne pas faire une migration d’URL cosmétique risquée si elle n’apporte rien à l’usage. Préserver ID, section, autorisation et liens existants. Aucun dossier bateau ne doit obliger l’utilisateur à choisir un second système.

## Limite technique importante

Cette évolution rend le suivi adapté à plusieurs supports ; elle ne certifie pas automatiquement les schémas ou calculs pour ces supports. Conserver les périmètres des moteurs existants. Ne pas réutiliser implicitement une règle propre à un véhicule routier comme règle nautique. Si un calcul dépend du support, vérifier explicitement son domaine d’application et documenter ce qui reste à confirmer. Ne pas introduire de nouvelles règles électriques ou réglementaires sans sources appropriées.

## Recette attendue

Données fictives isolées, sans vraie base client ni service externe :

- Trois accompagnements représentatifs : van, camping-car, bateau, chacun dans le même parcours.
- Une même personne avec deux projets de supports différents, sans changement du type de l’autre projet.
- Ancien dossier sans type : consultation et sauvegarde possibles, pas de valeur inventée.
- Passage van → bateau → van : informations préexistantes conservées, champs masqués non effacés, droits inchangés.
- Type invalide refusé côté serveur ; tentative d’édition d’un autre client refusée.
- Dossier et document partagé cohérents entre coach/client ; notes privées toujours exclues.
- Export et nouvelle révision avec le bon contexte ; anciennes révisions lisibles et immuables.
- Vérification téléphone 360/390 px et PC 1440 px : labels lisibles, sélecteur accessible au clavier, absence de débordement. Distinguer test navigateur et test sur appareil réel.

## Livrable et suivi

Implémente dans le système consolidé, sans nouveau module parallèle. Actualise `PLAN_EXECUTION_CRM_CLAUDE.md` avec les fichiers, décisions de données, tests et limites. Indique précisément ce qui est opérationnel, ce qui n’est qu’une migration préparée et les questions métier réellement restantes.

Ce complément affine le périmètre du projet commun ; il ne remplace pas le travail de consolidation en cours.
