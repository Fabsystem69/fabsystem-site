# Plan d’amélioration du CRM FabSystem

27 septembre 2026 — proposition à valider avant implémentation.

## 1. Le résultat recherché

**Gérer sereinement 5 à 10 clients en accompagnement simultané depuis un téléphone, du premier échange jusqu’au bilan final.**

**Orientation confirmée : vous vendez principalement un forfait à 199 €, avec un résultat attendu, pour des projets déjà avancés dont certains besoins sont identifiés.** Le CRM doit donc suivre le périmètre convenu, les points à résoudre et les livrables. Le temps passé reste un indicateur interne facultatif ; il ne devient pas un crédit d’heures client par défaut.

**Répartition du travail confirmée : vous suivez le client du début à la fin de son accompagnement ; il réalise le gros du travail et recherche lui-même son matériel. Vous adaptez actuellement votre aide au projet.** Le CRM doit soutenir cette souplesse : tâches réparties clairement, conseils et corrections retrouvables, étapes ajoutées au besoin. Aucune durée fixe, quantité de rendez-vous ou limite de corrections n’est décidée par ce plan.

**Fonctionnement confirmé : votre dashboard gère la prospection, principalement Facebook et groupes, puis vos coachings. Dès l’accompagnement, le client retrouve le dossier de son projet dans son compte ; ce dossier s’enrichit progressivement.** La continuité entre ces deux vues est le cœur du produit proposé.

**Parcours réel précisé :** vous repérez souvent une question ou un schéma incorrect sur Facebook, puis prenez contact en message privé. Un entretien de 45 minutes à une heure permet au prospect d’expliquer son projet, son avancement et son niveau de bricolage ; vous vous présentez et proposez le forfait. Vous faites souvent le bilan avec lui. La suite repose surtout sur des messages WhatsApp et de courtes visios de 2–3 minutes pour examiner un point de montage, avec des réunions plus longues si nécessaire. La valeur recherchée est aussi de rassurer le client dans ses décisions.

**Besoin métier désormais démontré par votre témoignage : il manque un fil conducteur et une fiche à remplir pendant ce parcours.** La priorité produit devient la trame d’entretien, sa transformation en dossier partagé et la trace rapide des décisions au quotidien. La profondeur du reporting, de l’agenda et des automatismes doit rester proportionnée à cet usage.

Une première [fiche d’entretien et de suivi](FICHE_ENTRETIEN_ET_SUIVI_COACHING.md) accompagne ce plan. C’est une trame proposée, utilisable pour éprouver le fonctionnement avant de développer les écrans ; ce n’est pas un formulaire applicatif déjà implémenté.

**Modalités confirmées :** règlement sur le site par Stripe ; travail de mise au propre du schéma convenu avec chaque client selon ce qui est nécessaire. Le montant éventuel d’un complément n’est pas déduit automatiquement de l’option affichée sur la page. Le moment précis où vous commencez le travail par rapport au paiement n’a pas encore été précisé ; aucun nouveau blocage de démarrage n’est imposé.

Votre référence à Salesforce est traduite ici en exigences concrètes : information client regroupée, suivi commercial clair, historique fiable, prochaines actions visibles, rappels utiles, permissions et reprise après erreur. Ce document ne promet pas une équivalence à toute la plateforme Salesforce et ne propose pas son installation.

Chaque matin, FabSystem doit vous permettre de répondre rapidement à cinq questions :

1. À qui dois-je répondre ou qui dois-je relancer ?
2. Que dois-je faire pour chacun de mes clients ?
3. Qu’attend-on de moi, et qu’attend-on du client ?
4. Quels rendez-vous, échéances et règlements approchent ?
5. Puis-je accepter un nouvel accompagnement sans surcharger ma semaine ?

Le plan reprend [l’audit indépendant](AUDIT_INDEPENDANT_FABSYSTEM.md). Les références D1–D14 et U1–U5 correspondent à ses constats. Les fonctions nouvelles ci-dessous sont des **propositions**, pas des défauts prétendument démontrés. Leurs critères de réussite sont des objectifs à vérifier, pas des performances déjà mesurées.

Base de travail : dépôt `afcfc98`. Depuis la référence initiale de l’audit, le commit `380442c` ajoute la création d’un projet coaching pour un client existant : cette possibilité est à conserver, pas à reconstruire. Une vérification ciblée confirme encore les motifs de rendu et les traitements de champs/budgets signalés ; l’audit complet n’a pas été rejoué pour ce plan.

## 2. Le produit proposé : cinq entrées quotidiennes

| Entrée | Ce que vous venez y faire | Ce qui doit être visible immédiatement |
|---|---|---|
| **Aujourd’hui** | Organiser la journée et traiter les urgences de suivi | Rendez-vous, réponses à faire, relectures, relances et clients sans prochaine action |
| **Prospects** | Passer d’un message Facebook à un accompagnement accepté | Besoin, dernier échange, prochaine action, proposition et issue de la discussion |
| **Clients** | Ouvrir un client et reprendre son suivi | Résumé, travail attendu de chacun, prochaine séance, documents et situation commerciale |
| **Agenda** | Préparer, déplacer et terminer les séances | Tous les rendez-vous utiles, durée, client, objet et accès au compte rendu |
| **Gestion** | Retrouver devis, factures, règlements, modèles et réglages | Listes simples, recherche et exceptions à traiter |

Les outils spécialisés restent accessibles depuis le dossier auquel ils servent. Le catalogue, les contenus et les autres fonctions existantes restent disponibles dans une navigation secondaire. Aucun écran métier existant n’est supprimé avant qu’un remplacement validé ne couvre son usage.

### La fiche client devient le point de retour commun

En haut : nom, véhicule/projet, état du suivi, prochaine action, responsable de cette action, prochaine date, situation commerciale résumée. Actions rapides : appeler, ouvrir la conversation, ajouter une note, programmer une séance.

Le détail est organisé en sections courtes :

- **Résumé** : objectif, offre convenue, point actuel et prochain jalon.
- **Suivi** : échanges, séances, actions, comptes rendus et attentes.
- **Projet électrique** : véhicule, usages, appareils, matériel, bilan et relecture.
- **Documents** : pièces reçues, documents partagés, version courante et versions antérieures.
- **Commercial** : proposition, devis éventuel, commande, facture et règlements associés.

Pour chaque prospect Facebook, conserver aussi, lorsqu’ils sont connus, le groupe d’origine, le lien du message ou de la conversation et le contexte de la demande. Une même personne peut être rencontrée dans plusieurs groupes : proposer un rapprochement plutôt que multiplier ses fiches. Aucun accès automatique aux conversations ou groupes privés n’est supposé.

Sur téléphone, une seule section détaillée à la fois, avec retour à la bonne section après sauvegarde. La recherche retrouve un nom, un e-mail, un téléphone ou un projet. Un même client peut avoir plusieurs projets ; le projet actif doit être identifiable sans masquer les précédents.

**Principe de simplicité :** les données requises apparaissent au moment où elles deviennent nécessaires. Un prospect Facebook peut commencer par un nom, un besoin et un lien de conversation. Il n’a pas besoin de remplir le dossier technique pour demander un premier échange.

## 3. Rassembler les deux circuits existants

### Décision confirmée : un seul système de suivi

Faire de la fiche client et du projet de coaching l’entrée de travail quotidienne, tout en conservant les objets commerciaux et les accompagnements déjà enregistrés.

L’interface présente **un dossier par projet accompagné, vu par vous depuis le dashboard et par le client depuis son compte**. Le client n’a pas à choisir entre deux dossiers techniques concurrents pour le même coaching. Vos fiches prospect, notes privées et informations de gestion restent accessibles selon leurs permissions propres.

**Clarification de Fabien : réunir les deux systèmes existants, pas simplement les relier ni multiplier les outils.** La cible est un seul système de suivi, un dossier par accompagnement, avec deux vues selon les permissions. Une lecture regroupée peut servir de transition, mais ne constitue pas la livraison finale. Les écritures, statuts, documents et événements doivent progressivement passer par un seul parcours métier ; les écrans et traitements concurrents seront retirés après reprise vérifiée. Plusieurs tables techniques peuvent subsister pour leurs responsabilités distinctes sans former deux systèmes de coaching.

| Information | Référence à conserver | Règle proposée |
|---|---|---|
| Identité | `Customer` | Une identité métier ; rapprochement des doublons proposé, jamais effectué sur le seul nom |
| Prospect et historique avant vente | `Prospect` et événements | Historique accessible après conversion, sans devoir le recopier |
| Travail du coaching | `CoachingProject` | Dossier principal pour les accompagnements suivis ; plusieurs projets possibles par client |
| Ancien suivi après achat | `DossierClient` | Reprendre les données et liens commerciaux dans le suivi commun ; retirer son parcours de coaching parallèle après vérification. Une prestation distincte devient un autre dossier dans le même système |
| Vente et paiement en ligne | `Order` et `Payment` | Afficher leur état sans permettre au CRM d’inventer un paiement Stripe |
| Devis et facture | `Quote` et `Invoice` | Conserver leur rôle et leurs numéros ; les retrouver depuis le suivi, sans en fabriquer une seconde version |
| Séances/rendez-vous | Modèles existants au départ | Agenda regroupé ; un événement lié n’est affiché et compté qu’une fois |
| Droits aux fichiers vendus | Droits existants, dont `DownloadGrant` | Ne pas confondre propriété d’un projet et droit à toutes les ressources payantes |

### Éviter de créer deux suivis pour un même achat

- Si une prestation correspond à un projet existant, proposer son rattachement au coach ou au client authentifié selon le parcours retenu.
- Si aucun projet n’existe, préparer le démarrage du suivi avec les informations déjà connues, puis le confirmer selon le type de prestation.
- Un achat d’ebook seul ne doit pas ouvrir artificiellement un accompagnement actif.
- Une nouvelle commande du même client peut être un complément ou un nouveau projet : ne pas décider par simple égalité d’e-mail.
- Les anciens rendez-vous conservent leur origine et un identifiant stable pour éviter les doublons dans l’agenda.

**Critère de sortie :** un achat de coaching ouvre ou rejoint un seul dossier ; coach et client utilisent ce dossier ; une modification ne nécessite jamais deux saisies. Les anciennes adresses utiles redirigent avec contrôle d’accès. Aucun second moteur de statut, de notification ou de suivi ne reste actif pour le même accompagnement. Conserver les références de paiement et les fichiers ; ne pas déplacer les fichiers seulement pour changer leur écran.

**Dépendance de reprise :** identifier quels dossiers achetés et CRM existants correspondent à la même prestation. La cible d’un dossier commun est confirmée ; le rapprochement des anciens enregistrements doit être vérifié avant toute migration.

## 4. Le parcours commercial et pédagogique proposé

### Le pack à 199 € comme parcours principal

Le code de la page actuelle `app/prestations/accompagnement-guide/page.tsx` annonce déjà : 199 € au lancement, 90 jours d’accompagnement, analyse des besoins/calculs/matériel, correction du schéma existant, échanges WhatsApp et visios lorsque nécessaires, jalons architecture/avant câblage/avant mise sous tension. Il mentionne aussi une mise au propre complète en option à 99 €, un ebook et 12 mois d’accès à l’éditeur. La création complète du projet et la disponibilité permanente y sont exclues.

Ce sont des **textes effectivement présents dans le site**. Votre fonctionnement expliqué dans cette conversation prime pour la conception du CRM : accompagnement du début à la fin, client acteur principal, aide adaptée au projet. Les « 90 jours » affichés constituent donc un point commercial à clarifier et à harmoniser, pas une durée à coder dans le suivi. Le plan n’en déduit ni quota de rendez-vous ni promesse de disponibilité permanente ; les conditions des accords déjà passés devront être respectées.

Vous confirmez que la mise au propre dépend du travail nécessaire et de l’accord avec le client. La fiche conserve donc la prestation promise et l’éventuel prix complémentaire convenu. La page présente actuellement une option à 99 € : ce texte devra être harmonisé avec votre pratique ; le CRM ne doit ni ajouter automatiquement 99 € ni considérer toute mise au propre comme incluse.

Le dossier du forfait doit présenter une synthèse très courte :

| Élément | Exemple de contenu attendu — à adapter au client |
|---|---|
| Point de départ | Schéma existant, équipements déjà achetés, besoins déjà identifiés |
| Résultat convenu | Points précis à éclaircir ou corriger et document à remettre |
| Périmètre inclus | Parties de l’installation examinées, hypothèses et jalons retenus |
| Informations manquantes | Photo, référence, mesure ou usage nécessaire à la suite |
| Prochain jalon | Une seule prochaine étape prioritaire et son responsable |
| Repères de suivi | Date de début, prochaine action et échéance du projet si connue ; pas de date de fin obligatoire |
| Livrable courant | Version du schéma/commentaires partagée et date de partage |
| Changement demandé | Demande supplémentaire à qualifier avant de modifier le périmètre |

Le parcours recommandé devient : **qualifier l’existant → convenir des points à résoudre → ouvrir le suivi → examiner/corriger → accompagner les jalons retenus → remettre le bilan et clôturer**. Les jalons non concernés par le projet peuvent être marqués non applicables ; ils ne doivent pas imposer des étapes fictives.

Exemple du partage des tâches : le client propose une batterie ou un chargeur avec référence/lien, le coach commente les points à vérifier, le client précise son choix ou corrige son projet. Les propositions, avis et décisions sont conservés dans le même dossier. Une liste de matériel client n’est pas présentée comme une commande passée par FabSystem, ni comme un choix déjà relu par le coach.

Lorsqu’un client change largement son projet, le CRM permet de noter le changement et votre décision : adapté dans le suivi, différé ou complément à discuter. Cela reste une aide facultative à la mémoire, sans barrage administratif ni facturation automatique. Si le client demande que vous réalisiez le travail à sa place, cette demande est distinguée du coaching pour que vous puissiez en convenir avec lui.

**Fin proposée :** lorsque les points convenus sont traités et que vous considérez l’accompagnement terminé avec le client, vous clôturez manuellement le suivi avec une courte synthèse. Un résultat partiel peut être partagé bien avant cette clôture. Un client qui met son projet en pause passe en attente, sans être déclaré terminé. Aucune échéance, suppression de fichiers ou révocation de droits achetés n’est déclenchée automatiquement par l’ancien texte des 90 jours.

### 4.1 Premier contact et prospection

La prospection habituelle est **initiée par vous**. La fiche doit donc proposer « contacté en MP » et distinguer une réponse reçue d’une relance à faire. Les nouveaux contacts du formulaire web restent un second chemin. Aucun message Facebook n’est envoyé par l’application simplement parce qu’un prospect est créé ou change de statut.

Trame courte du premier entretien, proposée pour environ 50 minutes mais librement adaptable : accueil et présentation (5 min), projet/avancement (10 min), aisance pratique et préoccupations (10 min), revue des éléments disponibles et bilan (15 min), synthèse/proposition/prochaine étape (10 min). Le bilan peut être poursuivi lors d’un autre échange ; les inconnues sont conservées comme telles.

À la sortie de l’entretien, la fiche doit fournir cinq éléments : **où il en est, ce qui l’inquiète, ce qu’il veut obtenir, les informations qui manquent et la prochaine action de chacun**. Elle ne doit pas obliger à remplir tous les paramètres techniques pendant l’entretien commercial.

Conserver une saisie Facebook rapide. Ajouter une entrée durable pour les demandes du site, avec tous les champs envoyés, état « à traiter » et lien vers le prospect/client lorsqu’il est identifié. Une notification e-mail devient une alerte sur une demande enregistrée ; l’échec de cette notification ne fait pas disparaître la demande.

Pour les demandes qui concernent une intervention ou autre service, conserver leur nature et leur traitement actuel. Elles ne doivent pas devenir automatiquement des projets coaching ou entrer dans le panier.

Pipeline proposé, à simplifier selon vos habitudes :

| Étape | Signification | Action habituelle |
|---|---|---|
| Nouveau | Demande reçue, pas encore traitée | Répondre |
| En discussion | Besoin et contexte à préciser | Poser les questions utiles ou convenir d’un appel |
| Proposition faite | Une offre concrète a été présentée | Attendre une réponse, avec date de reprise |
| Accord obtenu | Accompagnement convenu selon la règle choisie | Préparer le démarrage et les formalités nécessaires |
| Sans suite | Discussion close | Conserver le motif utile, sans relance active |

La facturation et le paiement ont leurs propres états. « Accord obtenu » ne signifie pas automatiquement « payé ». Une vente directe peut sauter les étapes de discussion. Ce pipeline est une proposition de libellés ; il ne justifie pas à lui seul une migration des statuts existants.

Chaque prospect ouvert a soit une prochaine action datée, soit une attente explicitement choisie. Une liste « sans prochaine action » permet de repérer les oublis. Le passage en client est idempotent : un double clic ou une reprise ne crée pas deux projets.

### 4.2 Accord commercial et démarrage

Depuis la même fiche : préciser ce qui est vendu, le prix, ce qui est compris, la durée ou les jalons, les documents nécessaires et la prochaine étape. Réutiliser le devis et sa signature lorsqu’ils sont utiles à cette vente ; ne pas imposer un devis supplémentaire à toute commande déjà payée en ligne.

Le démarrage proposé comprend :

- Un accès client fonctionnel avec expiration annoncée correctement et reconnexion possible.
- Un résumé compréhensible de l’accompagnement convenu.
- Une première action simple pour le client.
- Un prochain rendez-vous, ou une indication claire de qui doit le proposer.

Après l’entretien, l’action commerciale proposée est « Préparer le lien de règlement sur le site ». Vous transmettez ce lien au client ; le paiement confirmé par le webhook Stripe apparaît sur sa fiche et permet de préparer le rattachement de son accompagnement. Une page de retour Stripe ou une déclaration du client ne suffit pas à marquer le paiement reçu. Si son e-mail de paiement diffère de celui du prospect, proposer un rapprochement contrôlé plutôt qu’un rattachement au seul nom.

L’invitation prépare un accès ; elle ne doit ni effacer le dossier ni modifier silencieusement les modalités commerciales.

### 4.3 Travail entre les séances

Une action comporte un libellé, une personne attendue — vous ou le client —, une date éventuelle et un état. Les notes privées restent distinctes des demandes publiées au client.

« En attente du client » doit pouvoir préciser ce qui manque : photo, référence de batterie, réponse ou validation d’un choix. « À faire par Fabien » peut être une relecture ou une préparation. Le tableau de bord affiche ces attentes sans vous obliger à relire tous les comptes rendus.

Pour votre forfait à 199 €, le suivi principal montre les points convenus, résolus et restant à résoudre. Vous pouvez ajouter ou réorganiser une étape à mesure que le projet se précise. Un résultat exige parfois plusieurs échanges : compter les rendez-vous ne suffit pas à mesurer l’avancement. Les fonctions historiques de packs d’heures restent disponibles pour les dossiers qui les utilisent, mais leur extension n’est pas prioritaire et leur compteur ne doit pas apparaître comme une limite commerciale de ce forfait.

### 4.4 Rendez-vous et compte rendu

Deux formats correspondent à votre usage : **entretien/réunion prévue** et **point rapide déjà effectué**. La visio spontanée de 2–3 minutes ne nécessite ni création préalable de rendez-vous ni long compte rendu. Un bouton « Noter un échange » suffit : canal, sujet et conclusion/prochaine action ; date du jour par défaut, durée facultative.

WhatsApp reste le canal de conversation. Seuls les éléments utiles à la continuité rejoignent le dossier : décision, correction demandée, référence ou photo importante, question encore ouverte. Pas de copie obligatoire de toute la conversation. Une synthèse peut regrouper plusieurs messages sur un même sujet. L’interface montre ce qui attend une réponse et ce qui a été traité.

Le client doit pouvoir retrouver « ce qu’on a décidé » et « ce que je fais ensuite » sans parcourir tous les messages. Un point examiné en visio conserve son contexte et, si nécessaire, la pièce correspondante ; le logiciel n’interprète pas une courte visio comme une validation générale de toute l’installation.

Un seul agenda de lecture rassemble les deux types de rendez-vous existants. Depuis le téléphone : créer, déplacer, annuler, ouvrir le dossier puis enregistrer le compte rendu.

Le compte rendu court propose : sujets traités, décisions, point bloquant éventuel, prochaine action. Une action ajoutée ici apparaît directement dans le suivi. Pour le forfait à 199 €, la durée éventuellement enregistrée sert au pilotage interne ; un report ne crée pas de supplément ou de dette horaire. Les dossiers historiques facturés en heures conservent leur calcul propre et doivent faire l’objet de tests de non-régression.

La synthèse partagée doit être identifiable avant publication. Une note de préparation privée ne doit pas devenir publique par changement de statut de séance.

### 4.5 Dossier technique et relecture

Le dossier évolue au fil du coaching. Il doit être utile dès le premier jour avec les éléments disponibles : projet, besoin identifié, pièces existantes et prochaine action. Le client n’est pas obligé de remplir toutes les rubriques avant de commencer.

| Au fil du suivi | Votre dashboard | L’espace client |
|---|---|---|
| Démarrage | Reprendre le besoin du prospect et les éléments disponibles | Retrouver le projet, ce qui a été convenu et la première étape |
| Précisions | Identifier les informations manquantes et demander les pièces utiles | Compléter progressivement et voir ce qui est enregistré |
| Échanges/séances | Rédiger les décisions et préparer les actions | Retrouver les synthèses partagées et ses prochaines actions |
| Travail technique | Corriger, annoter et préparer des versions | Consulter la dernière version partagée avec sa date et son état |
| Avancement | Suivre les points résolus et ceux en attente | Comprendre où en est le projet et ce qui reste à faire |
| Fin | Identifier le livrable final et les points de vigilance | Retrouver un dossier cohérent et téléchargeable selon les accès convenus |

Le partage suit une règle visible : les informations que le client enregistre dans les rubriques communes sont accessibles au coach ; les brouillons et notes internes du coach restent privés ; un document ou compte rendu devient visible au client lorsqu’il est partagé explicitement. La dernière version partagée demeure accessible pendant la préparation de la suivante. Toute suppression ou modification de visibilité doit être compréhensible et tracée.

Dans l’accueil client : **mon projet, la prochaine action, le prochain rendez-vous et les derniers ajouts**. Ensuite viennent les rubriques du dossier. Le client doit retrouver aussi ses propres fichiers déjà déposés ; un nouvel upload ne doit pas lui donner l’impression que les précédents ont disparu.

Conserver les modules existants. Les améliorations prioritaires portent sur :

- La sauvegarde sans écrasement silencieux entre coach et client.
- La conservation de la saisie rejetée après un conflit.
- L’édition d’un appareil ou de ses usages sans suppression/recréation lorsque cette opération est nécessaire.
- La visibilité des données inconnues et des appareils absents d’un scénario.
- L’enregistrement explicite avant la demande de relecture.
- L’invalidation de la relecture après toute modification pertinente, y compris une suppression.
- Une version figée contenant les entrées et hypothèses utiles pour comprendre un livrable final, si cette traçabilité est retenue.

Le statut d’une relecture décrit le travail réalisé ; il ne devient pas une promesse de certification de l’installation.

### 4.6 Fin, suivi ultérieur et reprise

Proposer une clôture courte : résultat obtenu, documents remis, points restant à la charge du client, situation commerciale, éventuel rendez-vous ultérieur. Chaque élément peut être indiqué comme non applicable ; la fin ne doit pas imposer un formulaire disproportionné.

La clôture archive le suivi quotidien tout en conservant l’accès aux éléments convenus. Un reliquat ou une facture restant à régler demeure visible dans la gestion. Une reprise du même projet est datée et journalisée ; elle ne doit pas modifier rétroactivement le livrable final précédent.

L’accès du client après clôture et la durée de conservation des documents demandent une décision explicite. **Clôturer, archiver et supprimer sont trois opérations distinctes.**

## 5. Piloter 5 à 10 accompagnements

### Accueil « Aujourd’hui »

Ordre proposé :

1. Les rendez-vous de la journée.
2. Ce qui nécessite votre réponse : demande entrante, relecture ou action échue.
3. Les relances et attentes à reprendre.
4. Les clients actifs, avec une ligne lisible par suivi.

Exemple fictif de la vue d’ensemble :

| Client/projet | Point actuel | Prochaine action | Qui ? | Échéance |
|---|---|---|---|---|
| Camille — van | Bilan prêt à relire | Vérifier les usages du réfrigérateur | Fabien | Aujourd’hui |
| Alex — fourgon | Référence attendue | Ajouter la photo du chargeur | Client | Jeudi |
| Morgan — van | Préparation du schéma | Séance de choix du matériel | Ensemble | Vendredi 10 h |

Les couleurs accompagnent un texte explicite. Un suivi sans date ne disparaît pas ; il apparaît dans une section dédiée. Les dossiers terminés ne polluent plus les alertes d’activité, mais leurs obligations encore ouvertes restent repérables.

### Capacité et indicateurs

Afficher d’abord : suivis actifs, rendez-vous et heures déjà programmées cette semaine, relectures à effectuer, dossiers sans prochaine action et règlements à traiter. Proposer un seuil personnel de suivis simultanés — par exemple 10 — comme indicateur, sans bloquer automatiquement une vente.

Le nombre de clients ne suffit pas à mesurer la charge : deux conceptions complètes peuvent demander plus de travail que plusieurs conseils ponctuels. Prévoir une appréciation légère de charge ou de prochaine échéance, sans introduire une planification détaillée obligatoire.

Pour protéger la viabilité du forfait à 199 €, proposer en interne un suivi léger du temps réellement passé : séances, relecture et préparation, avec ajout rapide et facultatif. Au bilan, comparer les dossiers et identifier les changements de périmètre les plus coûteux. Une mesure de temps incomplète doit être signalée ; un rapport prix/temps ne doit pas être présenté comme une marge nette. Aucun chronomètre permanent ni détail de chaque message n’est requis.

Les indicateurs commerciaux utiles peuvent ensuite être : demandes reçues, accords obtenus, montants facturés, encaissés et restant à recevoir sur une période. Ils doivent préciser leur source. Une commande payée liée à une facture ne compte pas deux fois dans les encaissements. Les périodes et dossiers incomplets doivent être signalés plutôt que transformés en statistiques trompeuses.

## 6. Niveau de qualité attendu

### Usage sur téléphone

Objectifs proposés pour les tâches courantes, à mesurer avec des données fictives sur votre téléphone :

| Tâche | Cible de recette |
|---|---|
| Ajouter un prospect avec lien de conversation | Moins d’une minute avec les informations disponibles |
| Identifier la prochaine action d’un client | Moins de 15 secondes depuis l’accueil |
| Ajouter une note et une relance | Moins de 30 secondes après ouverture de la fiche |
| Déplacer un rendez-vous | Moins de 30 secondes, sans recréer une séance |
| Déposer un document | Résultat clair : enregistré ou erreur récupérable, sans doublon après reprise |
| Revenir après une erreur de formulaire | Texte conservé, champ ou conflit identifié |

Tester aussi : clavier qui masque un bouton, retour arrière, changement d’application, session expirée, réseau interrompu, agrandissement du texte et VoiceOver. Les objectifs de durée supposent que l’information métier est déjà connue ; ils ne mesurent pas le temps de rédaction d’un compte rendu.

L’icône d’écran d’accueil peut rester un accès pratique. Le fonctionnement intégral hors connexion et une application native ne sont pas des prérequis de ce plan.

### Données, sécurité et continuité

- Contrôles serveur de propriété sur chaque document, modification et export ; tests croisés entre deux clients fictifs.
- Conservation des notes privées et distinction visible des contenus partagés, y compris dans les exports.
- Protection contre double soumission, génération répétée et rejeu des événements de paiement.
- Historique des transitions importantes : auteur, date, changement et référence source ; ne pas journaliser les secrets de connexion.
- Réponse utile à l’utilisateur lors d’une erreur ; trace technique consultable par l’administrateur.
- Archivage réversible pour les retraits métier sensibles ; confirmation avant une suppression définitive.
- Limites de fichiers cohérentes entre interface, application et hébergement ; fichiers orphelins détectables et reprise des suppressions échouées.
- Sauvegarde et restauration vérifiées dans un environnement isolé, en incluant base et fichiers ; les sauvegardes de base seules ne restaurent pas les fichiers supprimés.
- Vérification des protections administrateur et de la procédure de récupération d’accès avant usage quotidien ; ajout éventuel d’un second facteur après examen de l’existant.

## 7. Automatisations limitées et observables

| Déclencheur | Automatisation proposée | Contrôle indispensable |
|---|---|---|
| Demande du site acceptée | Enregistrer la demande, la rendre visible, préparer la notification | Ne pas enregistrer le spam comme vrai prospect ; reprendre l’alerte en échec |
| Paiement confirmé | Rattacher les éléments prévus et préparer le suivi nécessaire | Événement durable, transaction, identifiants uniques, reprise sans doublon |
| Client demande une relecture | Ajouter une attention dans Aujourd’hui | Pas d’e-mail nécessaire à chaque modification |
| Échéance de relance | Faire remonter l’action | Une attente reportée ne doit pas continuer à apparaître en retard |
| Séance passée non renseignée | Rappeler au coach de terminer le compte rendu | Ne pas marquer automatiquement réalisée ou décompter des heures |
| Notification en échec | Conserver le statut et permettre une nouvelle tentative | Distinguer préparation, tentative et envoi ; éviter les doubles envois concurrents |
| Fin du suivi | Proposer bilan et éventuelle prise de nouvelles | Pas de sollicitation automatique sans règle validée |
| Fin de conservation des fichiers | Avertissement traçable puis délai avant suppression | Purge conditionnée à l’avertissement réussi et à une politique décidée |

Les messages sortants resteront manuels ou préparés en brouillon jusqu’à validation explicite de leur texte, déclencheur et destinataire. Le plan n’autorise aucun envoi actuel. Les automatisations de prospection massives et la synchronisation complète de Messenger sont reportées jusqu’à ce qu’un besoin mesuré les justifie.

## 8. Plan de réalisation par lots

Estimations indicatives pour une personne connaissant le projet : développement et vérifications ciblées inclus, hors attente de décisions, assainissement important des données historiques et intégrations externes nouvelles. Chaque lot doit pouvoir être livré sans attendre la fin du programme.

| Lot | Contenu et origine | Livrable utilisable | Validation de sortie | Effort |
|---|---|---|---|---|
| **0 — Fiabiliser l’existant** | D1–D10, première protection D13 ; rendu, champs, budgets, invitations, contact, concurrence, relecture, uploads, purge et confirmation | Parcours actuel réparé, erreurs identifiables | Cas de régression de l’audit ; échecs/rejeux simulés ; aucune régression des accès ou ventes | 5–8 j |
| **1 — Rassembler le suivi client** | U1/U5 et besoin confirmé ; dossier commun dashboard/compte client, liens prospect/projets/accompagnements/documents, plan de données | Une porte d’entrée pour chaque client, un premier dossier partagé utile dès le démarrage | Même projet visible des deux côtés avec droits distincts ; aucune note interne exposée ; historiques conservés | 4–7 j |
| **2 — Organiser les prospects et l’entretien** | D6 déjà réparé ; MP initié sur Facebook, fiche guidée d’entretien, pipeline, relances et entrée durable des contacts web | Entretien de 45–60 min soutenu par une fiche réutilisée au démarrage | Aucune ressaisie du bilan initial ; données incomplètes permises ; conversion sans doublon | 3–5 j |
| **3 — Simplifier le quotidien mobile** | U4, D13/D14 ; Aujourd’hui, navigation, recherche, retours à la section, états en attente | Vos 5–10 suivis lisibles depuis le téléphone | Tâches chronométrées, clavier/VoiceOver, reprise après erreur, aucun dossier actif perdu dans les filtres | 3–5 j |
| **4 — Échanges et prochaines actions** | Besoin confirmé ; note rapide WhatsApp/visio, décisions retrouvables, agenda et réunions lorsque utiles | Le fil des petits échanges est conservé sans gestion lourde des séances | Visio de 2–3 min enregistrable sans rendez-vous préalable ; notes privées non exposées ; action visible dans le suivi | 3–5 j |
| **5 — Relier le forfait et son suivi** | U2 ; pack à 199 €, aide adaptée au projet, liens devis/commande/facture, règlement et compléments éventuels ; temps interne facultatif | Situation commerciale compréhensible et engagement visible depuis le client | Aucun quota d’heures fictif ni fin automatique à 90 jours ; aucune double comptabilisation | 3–6 j |
| **6 — Enrichir le dossier partagé** | D11/D12 ; plusieurs projets, derniers ajouts, pièces déposées, progression, édition des données, versions du livrable | Le dossier s’enrichit au fil du coaching et reste compréhensible | Deux clients isolés ; deux projets retrouvables ; brouillon distinct du partagé ; version finale intelligible | 4–7 j |
| **7 — Clôture et exploitation durable** | Fin métier à préciser ; clôture/réouverture, archive, politique de conservation, erreurs et reprises visibles | Accompagnement terminé proprement et récupérable | Clôture ne supprime rien implicitement ; obligations ouvertes visibles ; restauration testée | 3–5 j |
| **8 — Pilote et ajustements** | Validation en usage avec 5–10 dossiers représentatifs | Version adoptable au quotidien | Recette complète, retours téléphone, correction des blocages et procédure de retour arrière | 2–4 j |

**Enveloppe initiale : 30–52 jours de travail**, à réestimer après le lot 1 et le premier essai mobile. Ce n’est ni un devis ni une durée calendaire garantie. La première version quotidienne cohérente vise les lots 0–3, soit **15–25 jours** selon les rapprochements nécessaires ; l’agenda, les séances et le commerce existants restent disponibles pendant ce travail.

**Ajustement après description de votre activité :** ces chiffres décrivent le programme complet, pas le minimum nécessaire pour mieux travailler. Essayer d’abord la fiche et le format de note rapide sur quelques accompagnements. Après les réparations, la première livraison métier doit réunir la fiche d’entretien, le dossier partagé et la note rapide, même si cela avance une petite partie du lot 4. Réestimer alors le programme ; un agenda avancé ou des rapports détaillés ne doivent pas retarder ces trois fonctions essentielles.

Pour votre forfait principal, le cadrage du résultat et du périmètre doit être visible dès le lot 1 ; le lot 5 complète les liens commerciaux et le pilotage interne. Si les fonctionnalités de suivi existantes suffisent une fois corrigées, des parties des lots 4, 6 et 7 peuvent être retirées. Aucun lot ne doit être rempli de fonctions simplement pour respecter cette enveloppe.

Le dossier client partagé de base fait partie du lot 1 : son ouverture et les premiers éléments visibles ne sont pas repoussés au lot 6. Le lot 6 apporte les raffinements de versions, de progression et de consultation après usage du socle.

### Premier lot détaillé

1. Constituer des fixtures anonymes et neutraliser les intégrations sortantes pour les essais.
2. Corriger le rendu des invitations, circuits et révisions.
3. Corriger les champs effacés et conversions monétaires ; vérifier les formulaires reliés.
4. Aligner invitation et durée réelle, contact et contenu reçu.
5. Rendre les mises à jour partagées atomiques et journaliser les suppressions pertinentes.
6. Aligner les limites de fichiers et conserver une erreur exploitable.
7. Sécuriser la purge et les reprises de confirmation avec le plan de données requis.
8. Rejouer les scénarios critiques et documenter ce qui reste non validé sur la production.

Les lignes historiques potentiellement affectées par les budgets ou les effacements seront examinées séparément en lecture autorisée. Aucune correction massive déduite d’une simple règle multiplicative.

## 9. Évolution technique et des données

La première implémentation conserve la pile actuelle et les fonctionnalités en production. Les pages administrateur lourdes sont découpées au fil des changements nécessaires. Les opérations métier restent dans les services avec validations serveur ; les composants interactifs sont limités aux interactions réelles.

Avant toute modification de `schema.prisma`, rédiger un plan spécifique dans les documents techniques existants. Ce document produit ne constitue pas à lui seul une migration approuvée.

Le plan de données devra préciser :

- Les liens entre prospect, client, projet coaching, accompagnement, commandes et documents ; cardinalités réelles, pas une relation un-à-un supposée pour tous les clients.
- Le modèle existant choisi pour les futures séances et la façon de lire les anciennes sans les compter deux fois.
- L’origine d’un règlement et le lien facture/commande pour éviter les doubles montants.
- L’état durable des demandes entrantes, événements et effets à reprendre.
- Le minimum à conserver pour une clôture, un avertissement de purge et un instantané traçable.
- Les invariants de conversion, mises à jour concurrentes et double soumission.
- Les migrations additives, les champs facultatifs au départ, la vérification des anciens dossiers, les sauvegardes et le retour arrière.

L’identité et l’authentification existantes sont réutilisées ; aucun nouveau profil client parallèle n’est proposé. Les offres `REQUEST_ONLY` conservent leur parcours contact/devis. Ce plan ne transforme pas le panier en plateforme universelle de services.

Les écarts déjà constatés entre le guide historique et le code, notamment pour les stockages, sont à clarifier dans la décision technique. Ils ne justifient pas une migration de tous les fichiers dans le premier lot. Les nouveaux actifs numériques vendus doivent respecter les règles du dépôt ; les documents privés du coaching doivent rester autorisés côté serveur.

## 10. Déploiement progressif et recette

### Mise en service

1. Préparer un environnement isolé avec base et fichiers fictifs ; les pages qui écrivent à la lecture doivent aussi y être contrôlées.
2. Vérifier les sauvegardes et la correspondance entre code local et version déployée avant un changement de production.
3. Déployer un lot à la fois, avec migrations compatibles et accès aux anciens chemins pendant la transition.
4. Pour les rapprochements, commencer par quelques dossiers vérifiés manuellement ; aucune fusion automatique par nom.
5. Observer les erreurs, les notifications en attente et les tâches non reliées après chaque lot.
6. Retirer un ancien écran uniquement lorsque ses usages et ses données ont une destination validée.

### Scénarios obligatoires avant adoption

| Scénario | Résultat attendu |
|---|---|
| Prospect Facebook sans e-mail | Suivi possible ; e-mail demandé seulement au moment nécessaire |
| Premier MP initié par le coach | Contact et relance suivis, sans envoi automatique |
| Entretien avec bilan incomplet | Informations conservées et manquants visibles ; fiche réutilisée au démarrage |
| Visio spontanée de 3 minutes | Note rapide et décision enregistrées, sans rendez-vous à créer |
| Plusieurs messages WhatsApp sur un même point | Synthèse utile et prochaine action retrouvables dans le dossier |
| Contact web, panne de notification | Demande retrouvable et alerte retentable |
| Client existant qui achète un complément | Achat visible, rattachement contrôlé, pas de second dossier créé aveuglément |
| Deux projets du même client | Bonne action et bon document associés au bon projet |
| Dossier complété progressivement des deux côtés | Informations enregistrées retrouvables sans recopies ; notes internes toujours privées |
| Coach prépare une nouvelle version | Ancienne version partagée encore visible, brouillon non exposé |
| Deux sauvegardes coach/client | Conflit explicite ; aucune perte silencieuse |
| Lien expiré ou session expirée | Reconnexion compréhensible ; récupération de la saisie selon le mécanisme retenu |
| Séance déplacée puis réalisée | Agenda et compteur cohérents |
| Forfait à 199 € sans quota d’heures | Avancement fondé sur les points convenus ; aucune alerte fictive de crédit épuisé |
| Résultat intermédiaire partagé | Document retrouvable ; accompagnement toujours actif jusqu’à votre clôture |
| Projet long ou momentanément arrêté | Attente ou poursuite explicite ; aucune clôture automatique à 90 jours |
| Client cherche son matériel | Références et propositions ajoutées au dossier ; distinction entre proposé, à revoir et décision retenue |
| Nouveau besoin en cours d’accompagnement | Changement visible et décision consignée, aucun supplément automatique |
| Document trop gros ou format non accepté | Explication avant perte du contexte et nouvelle tentative possible |
| Modification après relecture | Relecture signalée comme à reprendre, y compris après retrait |
| Paiement rejoué ou notification échouée | Une seule conséquence métier, reprise contrôlée |
| Clôture puis reprise | Ancien livrable conservé et nouveau travail identifié |
| Purge interrompue | Pas de suppression sans préavis garanti ; fichiers restants retrouvables |
| Client A tente d’ouvrir un document de B | Accès refusé côté serveur, y compris via URL directe |

Les tests commerce requis par le dépôt restent nécessaires si ces chemins sont touchés. Les calculs purs déjà testés ne dispensent pas des essais de formulaire jusqu’à la persistance. Le rapport de recette distingue lecture, simulation et essai réel.

## 11. Ce qui reste facultatif

À réexaminer seulement après utilisation du socle : réservation autonome de créneaux, synchronisation bidirectionnelle d’agenda, messages automatiques aux prospects, synchronisation Messenger complète, transcription de séances, suggestions par IA, portail de discussion intégré et application native.

Pour chacun, exiger un problème concret observé, une fréquence, un gain attendu et le coût d’exploitation. À ce volume, le temps d’entretien d’une intégration peut dépasser le temps de saisie qu’elle économise ; cela reste à mesurer.

## 12. Décisions métier à prendre au bon moment

| Décision | Hypothèse de travail proposée | Nécessaire avant |
|---|---|---|
| Modèle commercial principal | **Confirmé : forfait à 199 € avec résultat attendu, pour projet déjà avancé.** Points à résoudre et périmètre au premier plan | Direction du plan fixée |
| Répartition du travail | **Confirmé : suivi de bout en bout, client réalisant le gros du travail et recherchant son matériel ; coach s’adaptant au projet.** | Direction du plan fixée |
| Fil conducteur et échanges | **Confirmé : entretien de 45–60 min, bilan souvent fait ensemble, suivi surtout WhatsApp et petites visios.** Trame et note rapide prioritaires | Première livraison métier |
| Mise au propre du schéma | **Confirmé : selon le travail nécessaire et l’accord avec le client.** Conserver cet accord et harmoniser l’option à 99 € actuellement affichée | Texte commercial et lot 5 |
| Paiement et démarrage | **Confirmé : paiement sur le site via Stripe.** Moment du démarrage par rapport au paiement non précisé ; aucun blocage automatique supposé | Lot 5 |
| Conditions affichées du pack | Harmoniser la page commerciale, notamment les 90 jours, avec votre fonctionnement ; vérifier séparément options et accès inclus. Aucun quota ni délai bloquant à introduire | Lot 1 et préparation de l’espace client |
| Circuit principal visé | **Confirmé : prospects et coaching dans le dashboard, même dossier projet enrichi progressivement dans le compte client.** Rapprochement des données historiques à examiner | Lot 1 |
| Quand l’accord devient-il actif ? | Accord, paiement et démarrage affichés séparément | Lots 2 et 5 |
| Reports et annulations du pack | Replanifier le suivi ; aucune nouvelle règle de supplément automatique. Temps interne facultatif | Lot 4 |
| Ce qui est visible du client | Notes internes privées ; partage explicite du compte rendu et des livrables | Lots 4 et 6 |
| Fin et conservation | Fin décidée manuellement avec le client ; archive sans suppression implicite. La durée de conservation des fichiers reste une décision distincte | Purge du lot 0, puis lot 7 |
| Communications automatiques | Alertes internes d’abord, messages sortants préparés | Toute activation d’envoi nouveau |

**Recommandation de départ : valider la direction générale, puis réaliser le lot 0.** Il apporte des améliorations démontrables sans attendre toutes les décisions produit. La fiche client et l’accueil mobile deviennent ensuite le centre du travail ; les fonctions supplémentaires arrivent seulement lorsqu’elles simplifient le suivi réel.

Lors de sa rédaction initiale, ce plan n’avait modifié ni le code, ni les données, ni la configuration. Les corrections locales commencées ensuite et leur validation sont consignées dans `PLAN_EXECUTION_CRM_CLAUDE.md`. Aucune publication ou action externe effectuée.
