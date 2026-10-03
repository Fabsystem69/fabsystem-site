# Claude — implémenter la première version du dashboard client FabSystem

## Mission et autorisation

Fabien te demande d’implémenter localement le dashboard client décrit ci-dessous. Ce document consolide les dernières décisions du 2 octobre 2026 et prévaut sur les anciennes suggestions produit contradictoires. Il ne te demande pas de recommencer l’audit ou de multiplier les modules.

Lis `AGENTS.md`, les instructions locales pertinentes, `git status --short`, le diff, puis le code actuel avant de modifier. D’autres travaux peuvent avoir été intégrés depuis l’analyse : conserve-les, réutilise ce qui est terminé et ne rétablis pas une ancienne version. Si un autre agent modifie actuellement les mêmes fichiers, termine son lot avant de reprendre ; pas de modifications concurrentes.

Autorisé : code local, documentation technique, migrations préparées et tests isolés. Pas de push, déploiement, migration distante, modification de production, message réel, paiement ou purge. N’exécute pas des tests utilisant `.env.local` ou une vraie base client. Une application lancée pour recette doit être explicitement isolée des services réels. Ne modifie pas les permissions des outils pour contourner ces limites.

Avant tout changement de schéma, documente le plan dans `docs/03-DATABASE.md`, les sources de vérité et décisions concernées. Lis les guides Next.js installés pertinents. Préfère les changements incrémentaux et termine chaque lot avec ses vérifications.

## Le résultat recherché

Un assistant utile au travail de Fabien, formateur qui guide très bien ses clients par téléphone. Le site doit l’aider à retrouver le contexte, conserver les décisions et partager les éléments utiles. Il ne remplace pas son accompagnement et n’impose pas au client un questionnaire complet avant de travailler ensemble.

Clientèle souvent âgée de plus de 60 ans et peu à l’aise avec l’informatique sans guidage : parcours clair, lisible, respectueux, sans jargon ni « mode senior ». 5–10 accompagnements simultanés. Téléphone ET PC.

**Un seul parcours centré sur le projet électrique du client**, avec installation, schéma, prochaine action, coaching et ressources. Réutiliser l’éditeur, les dossiers, les modèles, la navigation et les droits existants ; aucun second éditeur, moteur de coaching ou système de fichiers parallèle. Plusieurs tables spécialisées peuvent subsister sans créer plusieurs outils concurrents pour le client.

Supports : van/fourgon, camping-car, bateau, autre. Réutiliser `ProjectAssetType` et les adaptations existantes. Ne pas généraliser des règles électriques propres à un support à tous les autres.

## Décisions métier fermes

1. **Aucun nombre de séances incluses ni compteur de séances restantes** pour le coaching principal. Le pack est un accompagnement adaptable, pas un crédit de rendez-vous. Ne pas afficher un solde de minutes comme un droit contractuel à réserver.
2. **Rendez-vous convenus avec Fabien**, saisis ensuite dans le suivi. Pas de calendrier de réservation autonome, disponibilités, paiement de réservation ou lien Calendly à ajouter.
3. **Visios en direct sur WhatsApp** : pas de lien de réunion à gérer et pas de replay à ajouter. Afficher canal, date, heure, durée si connue, et les coordonnées utiles déjà vérifiées. Un lien WhatsApp ouvre une conversation ; il ne rejoint pas automatiquement une visio. Ne pas inventer de numéro ni envoyer de message automatiquement.
4. **Dernier schéma enregistré affiché par défaut.** Bouton simple pour consulter les versions précédentes. Ne pas imposer une nouvelle procédure de publication/brouillon pour accéder au schéma actuel.
5. **Client et coach peuvent modifier le même schéma**, dans le respect des droits d’édition existants. Fabien veut retrouver l’état complet avant modification et savoir si le client a modifié le schéma. Historique automatique et protection contre écrasement indispensables ; comparaison graphique détaillée facultative pour plus tard.
6. **Ressources : ebooks achetés ou offerts avec l’accompagnement**, regroupés et réellement accessibles selon les droits. Pas de passage commercial obligatoire pour retrouver un fichier déjà disponible.
7. **Un schéma principal par accompagnement pour l’instant.** Plusieurs projets d’un même client restent accessibles. Pas de refonte de cardinalité pour un besoin futur encore hypothétique.
8. **Factures hors périmètre.** Ne pas chercher à connecter ou configurer Stripe pour les factures, ni créer de module de facturation. Conserver les commandes et mécanismes de paiement existants.

Prix principal actuellement 199 €, susceptible d’évoluer ; garder le prix/périmètre convenus par client. Mise au propre selon accord, ni automatiquement incluse ni automatiquement facturée 99 €. Ne pas ajouter de fin obligatoire à 90 jours à partir des seuls textes marketing.

## Éléments observés dans le code — à revérifier au démarrage

- `app/mon-compte/page.tsx` présente séparément projet récent de l’éditeur, dossier coaching récent, ancien accompagnement et achats. Ces sélections indépendantes peuvent concerner différents projets.
- `components/customer/dashboard/DashboardNav.tsx` et `app/mon-compte/layout.tsx` composent la navigation et le thème clair existants.
- `CoachingProject.linkedProjectId` relie déjà le coaching à `Project`, avec unicité et contrôles dans `lib/services/coaching-project.ts`. Utiliser ce lien, pas le nom ou le dernier projet du compte.
- `app/mon-compte/mon-van/[projectId]/page.tsx` dispose de sections techniques, actions destinées au client, résumé partagé et documents. Les champs permettent une saisie partielle.
- `app/mon-compte/projets/[projectId]/page.tsx`, `components/customer/dashboard/guided/*` et `engines/*` exposent les données/calculs du projet de l’éditeur. Certains choix de parcours sont en localStorage : ne pas les considérer comme synchronisés entre appareils.
- `ProjectSchema` contient le dessin courant ; `ProjectSchemaVersion` contient des instantanés complets avec auteur/date/numéro. Les services et routes de versions/restauration existent. La sauvegarde courante examinée fait un upsert sans sauvegarde préalable systématique.
- `CoachingSchemaRevision` représente un instantané du dossier technique, pas nécessairement une version du dessin. Ne pas mélanger ces deux historiques.
- L’admin peut déjà créer et ouvrir un schéma pour un client depuis le dashboard. Le rendu et les exports existent dans les composants de l’éditeur et `features/schemas/export.ts`.
- `CoachingSession` : date, durée, statut, canal, compte rendu et `sharedWithClient`. `CoachingActionItem` : responsable, échéance, statut, lien éventuel à une séance.
- `DossierClient` et ses rendez-vous sont encore lus par l’ancien écran `mon-accompagnement`. Migration et synchronisations vers `CoachingProject` existent dans `lib/services/coaching-dossier-migration.ts` et `dossier-client.ts`. Vérifier ce qui est effectivement repris et éviter deux historiques affichés en double. Un schéma Prisma ou un script présent ne prouve pas qu’une migration a été appliquée.
- `app/mon-compte/achats/page.tsx` et `lib/services/customer-account.ts` regroupent achats, droits de téléchargement, ressources offertes et codes inclus. Certains ebooks inclus passent encore par un code panier : un code n’est pas un droit direct de téléchargement.

## Navigation cible

- **Accueil** : vue utile du projet sélectionné.
- **Mon installation** : informations techniques, équipements, besoins et documents.
- **Mes schémas** : dessin courant et historique secondaire.
- **Mon coaching** : rendez-vous et comptes rendus partagés, actions.
- **Ressources** : ebooks et guides accessibles, contenus inclus clairement identifiés.
- **Mon compte** : profil, commandes, gestion des accès existants et déconnexion. Pas de factures nouvelles.

Réutiliser les routes existantes ou ajouter des entrées claires avec compatibilité des anciennes URLs ; les renommages cosmétiques ne doivent pas retarder le parcours. Déplacer la promotion Éditeur Plus et les outils secondaires hors de la navigation quotidienne. Conserver l’identité graphique, les composants et l’aide Volta utile lorsqu’elle apporte une information réelle.

Un seul sélecteur de projet commun. Avec un seul projet, ne pas imposer de sélection. Avec plusieurs, garder le contexte entre rubriques et vérifier l’appartenance à chaque requête. Un client qui possède uniquement un ebook ne doit pas créer de projet pour le lire. Un projet autonome de l’éditeur ne doit pas devenir artificiellement un coaching.

## Lot 1 — Synthèse serveur et contexte commun

Créer une lecture agrégée, par exemple `lib/services/customer-dashboard.ts`, sans dupliquer les données dans une nouvelle table « dashboard ». Réutiliser les services existants et sélectionner uniquement les champs publics nécessaires.

Résoudre explicitement dossier coaching et projet d’éditeur liés. Prévoir les cas non liés et historiques : ne pas créer automatiquement des correspondances par e-mail/nom et ne pas cacher les dossiers non migrés. Documenter le traitement transitoire et la fin des entrées doublons.

Définir la source de chaque information technique : déclarée par le client, calculée par un moteur ou retenue par le coach. Ne pas copier automatiquement une valeur entre deux modèles si son sens est différent. Ne pas créer un nouveau moteur de calcul.

## Lot 2 — Accueil lisible et orienté action

Afficher dans cet ordre, selon les données présentes :

1. Projet/support sélectionné et état compréhensible, sans pourcentage arbitraire.
2. Prochaine action réelle avec intitulé concret et bouton pour la réaliser. Utiliser les actions CLIENT ouvertes ; priorité stable et expliquée (échéance puis ancienneté, par exemple). Ne pas afficher les actions privées du coach.
3. Aperçu du schéma courant, date provenant du schéma et accès direct à sa consultation.
4. Prochain rendez-vous non annulé : date/heure et canal WhatsApp/téléphone réellement renseigné ; aucun bouton « Rejoindre » fictif.
5. Ressources déjà disponibles et utiles, avec accès immédiat.
6. Aide/contact visible sans encombrer l’écran.

Une action principale dominante ; liens secondaires sobres. Quand le client n’a rien à faire, ne pas l’envoyer compléter tous les calculateurs par défaut. « En attente de relecture » seulement si cet état existe. Le coach peut compléter le dossier avec lui pendant l’appel.

## Lot 3 — Schéma courant et historique protégé

Réutiliser `ProjectSchema` et `ProjectSchemaVersion`, les endpoints et le rendu existants.

- Consultation simple avec zoom/déplacement et export existant accessible ; « Modifier dans l’éditeur » secondaire selon les droits.
- Historique avec date, auteur et libellé ; consulter une ancienne version ne doit jamais restaurer ni écraser le schéma courant.
- Restauration explicitement nommée et confirmée, conservant aussi l’état remplacé.
- Avant chaque sauvegarde qui change réellement le dessin, conserver atomiquement l’état complet remplacé (nœuds, câbles, nom et données nécessaires à une restitution fidèle). Les sauvegardes identiques ne doivent pas créer de copies inutiles.
- La version conservée décrit l’auteur de l’état sauvegardé ; l’auteur de la modification qui le remplace est une information distincte. Ne pas attribuer au client un état créé par le coach simplement parce que le client vient de le modifier. Préparer les métadonnées manquantes si nécessaire.
- Identifier l’auteur/date de la dernière modification ; afficher côté coach un signal fiable « Modifié par le client depuis votre dernière consultation » si une référence de consultation est effectivement enregistrée. Sinon commencer par l’auteur/date, sans fabriquer un état « non lu ».
- Vérifier toutes les voies d’écriture : autosave, sauvegarde manuelle, envoi admin vers client, import, restauration et opérations automatiques. Ne pas couvrir seulement un bouton.
- Protection atomique contre deux onglets/client et coach enregistrant sur la même version. En cas de conflit, conserver la saisie et proposer de recharger/récupérer sans écrasement silencieux ; aucun faux succès.
- L’autosave étant fréquent, documenter le coût et la présentation des versions. On peut regrouper visuellement les versions par date/auteur, mais ne pas supprimer arbitrairement des états pour économiser du stockage. Toute politique de rétention nécessite un choix explicite.
- Historique privé authentifié : aucun jeton public créé automatiquement pour la consultation du client.
- Statuts de suivi factuels (« Enregistré », « Modifié… ») ; jamais certification électrique implicite.

Ce lot nécessite des tests de concurrence et de restauration, pas seulement un test d’affichage de la liste.

## Lot 4 — Installation, coaching et ressources dans le même parcours

Installation : réutiliser les formulaires, inventaires et calculs. Afficher résumé, informations manquantes pertinentes et documents. « Je ne sais pas / À voir ensemble » accepté ; une valeur inconnue n’est pas zéro. Les photos déjà déposées restent visibles. Préserver données masquées et saisies lors des erreurs.

Coaching : lire les séances existantes, trier le prochain rendez-vous et l’historique, ne montrer les comptes rendus que si `sharedWithClient`. La date/canal d’un rendez-vous et les notes privées sont des contenus distincts. Proposer la préparation avec les actions existantes liées à la séance. Ne pas créer de réservation, quota, lien de réunion ou replay. Le coach continue à saisir les horaires après accord.

Ressources : extraire/réutiliser la bibliothèque existante. Les guides achetés/offerts avec droit actif sont accessibles directement ; les contenus conseillés non acquis sont secondaires et ne bloquent rien. Un droit expiré, épuisé ou révoqué doit être expliqué, sans exposer le fichier.

Pour les ebooks offerts via un ancien code : ne pas afficher « Télécharger » avant un vrai droit. Réutiliser la mécanique de droits offerts si elle peut attribuer la ressource déterminée par l’achat de manière idempotente, sans doubler commande, droits ou code consommable. Si le code donne le choix entre plusieurs ebooks et que l’offre ne permet pas de déterminer lequel, conserver un choix explicite simple et demander uniquement cette clarification métier. Ne pas inventer l’ebook ni étendre gratuitement les droits à tout le catalogue.

Conserver historique de commandes et profil dans Mon compte. Facturation complètement hors de ce lot.

## UX et confidentialité

- Thème FabSystem existant ; mots simples et boutons textuels.
- Texte principal confortable, champs au moins 16 px sur mobile, cibles principales d’au moins 44 px ; contrastes et focus vérifiés.
- Menu mobile lisible, pas six mini-onglets ni plusieurs systèmes de navigation superposés.
- Une tâche simple par section, sauvegarde explicite ou retour fiable de l’autosave. Pas de message furtif comme seule confirmation.
- Erreurs compréhensibles, saisie récupérable ; ne pas mettre des brouillons privés dans l’URL.
- États distincts : aucune donnée, donnée manquante, chargement, échec, attente réelle de Fabien. Un échec de lecture n’est pas « aucun document ».
- Ownership vérifié côté serveur pour toutes les lectures, exports et mutations ; client A ne peut pas accéder aux données de B.
- Aucun champ privé dans les données transmises aux composants client, même masqué en CSS. Aucun cache partagé de données personnelles.
- Continuer à contrôler les droits commerciaux existants ; l’accès à un dossier ne donne pas accès à tous les produits payants.

## Recette minimale avant livraison

Fixtures isolées, aucun service externe réel :

1. Client coaching + projet lié : même installation/schéma/rendez-vous dans toutes les rubriques.
2. Client avec deux projets : changement de contexte complet, sans mélange des actions/documents.
3. Client ebook seul et projet autonome sans coaching : accès utile sans compte/projet supplémentaire.
4. Ancien dossier non repris, projet sans schéma, aucun rendez-vous, aucun ebook : états vides exacts, aucune information masquée par une fausse fusion.
5. Schéma modifié par client puis coach : états antérieurs intacts, auteurs exacts, historique consultable et restauration réversible.
6. Deux sauvegardes concurrentes, retry et autosave identique : pas d’écrasement silencieux ni doublon inutile ; aucune version partielle après échec.
7. Séance annulée exclue du prochain rendez-vous, compte rendu privé absent, prochaine action correctement attribuée.
8. Ebook acheté/offert accessible selon son vrai droit ; vieux code non traité comme fichier disponible ; retry d’attribution sans duplication.
9. Accès croisés interdits sur projet/schéma/version/document/ressource ; anciens liens fonctionnels.
10. Téléphone 360/390 px, tablette 768 px, PC 1440 px ; clavier, zoom 200 %, focus, erreurs et lecture/zoom du schéma. Distinguer viewport simulé et appareil réel.

Exécuter lint, types et tests appropriés en distinguant erreurs préexistantes et régressions. Si un build ou une recette risque de lire une base réelle, utiliser une configuration isolée ; ne pas lancer pour obtenir artificiellement un résultat vert. Ne pas annoncer « accessible » sur la seule base des tests unitaires.

## Livrables et persistance

Au début : bref plan d’implémentation par lots et plan de données si nécessaire, puis code sans attendre une nouvelle validation pour chaque détail déjà autorisé. Ne pas se limiter à un autre plan.

Après chaque lot : résultat utile, fichiers modifiés, commandes/tests et limites, migrations préparées mais non appliquées, prochaine tâche. Actualiser `PLAN_EXECUTION_CRM_CLAUDE.md` sans écraser les travaux d’autrui.

Si le contexte se réduit, finir le petit lot engagé et consigner précisément la reprise. Ne pas élargir à un CRM universel, factures, réservation automatique, IA conversationnelle ou application native. Critère final : le client trouve son schéma et sa prochaine étape, Fabien retrouve le contexte et les modifications, sans multiplier les outils ou la saisie.
