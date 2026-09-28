# Complément pour Claude — efficacité coach et parcours client guidé

## Décision de Fabien et ordre de traitement

Fabien demande un outil efficace, accessible et compréhensible. Il constate que sa clientèle coaching est principalement composée de personnes de plus de 60 ans, souvent peu à l’aise avec l’informatique lorsqu’elles ne sont pas guidées. Cette observation décrit sa clientèle, pas les capacités de toutes les personnes de cet âge.

Intègre ce complément au plan de reprise :

1. Termine le lot cohérent actuellement engagé et ses tests, sans laisser de modification à moitié faite.
2. Poursuis la consolidation en un seul système décrite dans `PROMPT_REPRISE_CLAUDE_CRM.md`.
3. Applique `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md` : van/fourgon, camping-car, bateau, autre, dans le même dossier.
4. Pour les écrans communs à ces travaux, applique les exigences de ce document dans la même modification. Ne programme pas trois refontes successives des mêmes écrans.
5. Livre le fil conducteur d’entretien, la note rapide et le parcours client guidé dans le système commun ; teste le parcours complet avant d’ajouter des automatisations facultatives.

Préserve les fonctionnalités utiles, les données et les modifications locales existantes. Ce complément autorise les modifications locales nécessaires et les tests isolés. Il n’autorise aucun push, déploiement, migration distante, message réel, paiement ni modification des données de production. Respecte AGENTS.md et documente le plan de données avant modification Prisma.

## Résultat attendu

Le client doit pouvoir répondre sans aide à ces trois questions :

- Où en est mon projet ?
- Qu’ai-je à faire maintenant ?
- Où retrouver le dernier document que Fabien m’a transmis ?

Fabien doit pouvoir suivre 5–10 accompagnements depuis son téléphone et son PC, sans recopier les informations entre plusieurs fiches. Le dossier peut être renseigné ensemble pendant un entretien ; le client ne doit pas remplir un long questionnaire pour accéder à son accompagnement.

Ce document définit une cible à implémenter et vérifier, pas des fonctions déjà présentes.

## 1. Entretien : une fiche qui devient le dossier

Construis sur les champs existants une fiche progressive, utilisable par Fabien pendant l’appel de 45–60 minutes :

- Support et projet, avancement, matériel déjà présent.
- Aisance en bricolage, préoccupations et besoin principal.
- Bilan disponible, informations manquantes, photos ou schéma existants.
- Ce qui est convenu pour l’accompagnement, prix réel et travail prévu sur le schéma.
- Prochaine action, personne responsable et date si utile.

Permets « Je ne sais pas encore », « À voir ensemble » et un enregistrement incomplet. Distingue explicitement les inconnus de zéro, « non » ou « terminé ». Ne rends obligatoire que ce qui est nécessaire à l’action en cours, avec validation côté serveur.

Réutilise les informations lors de la conversion prospect/client et dans le dossier ; pas de second formulaire à recopier. Les notes internes restent privées. La synthèse destinée au client doit être clairement identifiée et partagée selon les règles du système commun.

## 2. Accueil client : orienter avant de montrer le détail

Organise l’accueil autour d’un résumé lisible :

- Titre du projet et support, avec sélection simple si plusieurs projets.
- Prochaine action concrète, formulée avec un verbe : par exemple « Ajouter une photo de votre batterie », lorsque cette action existe réellement.
- État compréhensible lorsque le client n’a rien à faire : par exemple « Fabien doit relire votre dossier » si cet état est effectivement enregistré.
- Dernier message ou compte rendu partagé et dernier document partagé.
- Accès visible à l’aide et aux coordonnées de contact déjà utilisées par Fabien.

Ne fabrique pas de fausse progression, de pourcentage arbitraire ni de promesse de réponse dans un délai non convenu. Ne déduis pas une validation technique d’un champ rempli ou d’un document envoyé.

Les informations techniques restent accessibles par sections courtes et clairement nommées. Évite une page d’accueil saturée de tableaux, onglets et cartes sans ordre de priorité. Ne cache pas un dossier plus ancien simplement parce qu’un autre est plus récent.

## 3. Guider chaque tâche sans infantiliser

- Une action principale clairement nommée par écran ou section. Boutons avec du texte, pas des icônes seules.
- Phrases courtes, français courant, exemples adaptés au support. Évite côté client CRM, pipeline, snapshot, upload, ID ou noms de modèles.
- Labels toujours visibles, pas uniquement des placeholders. Explique brièvement pourquoi une information est demandée lorsqu’elle n’est pas évidente.
- Petites étapes avec titre, position compréhensible et retour possible. Le coaching reste souple : ne transforme pas ces étapes d’interface en procédure métier rigide.
- Bouton explicite « Enregistrer et continuer » si adapté, et possibilité de reprendre plus tard. Ne présente pas un brouillon comme enregistré tant que le serveur ne l’a pas confirmé.
- Après une action : confirmation près de la zone concernée, prochaine étape compréhensible, pas de message furtif comme seul retour.
- Après erreur : conserve les valeurs, explique le problème et comment le résoudre. Ne renvoie pas brutalement le client au début.
- En cas de conflit coach/client, préserve la saisie et propose une récupération compréhensible sans écrasement silencieux.
- Si une session expire, indique comment se reconnecter et reprendre. Ne stocke pas par défaut des notes ou documents privés dans le navigateur pour contourner ce problème ; choisis une solution minimale compatible avec la confidentialité et les règles d’accès.

## 4. Documents, photos et connexion

Documents :

- « Ajouter une photo ou un document » ouvre le sélecteur de fichiers habituel ; sur téléphone, permettre la prise de photo lorsque le navigateur et le format accepté le permettent, sans imposer la caméra.
- Avant l’envoi, expliquer les formats et limites réellement acceptés. Montrer le nom du fichier et son état ; empêcher les doubles envois accidentels.
- Distinguer fichier sélectionné, envoi en cours et document réellement enregistré. Une erreur réseau doit permettre de réessayer sans doublon.
- Conserver la liste des documents déjà envoyés et reçus ; identifier clairement la dernière version partagée sans effacer les versions utiles.
- Prévisualisation si disponible et sûre, avec alternative de téléchargement. Ne pas bâtir un éditeur de documents supplémentaire.

Connexion :

- Examiner le parcours existant avant d’ajouter un mécanisme. Réutiliser l’authentification actuelle.
- Lien expiré ou déjà utilisé : explication simple et action pour en obtenir un nouveau selon le fonctionnement autorisé.
- Ne pas réduire les contrôles d’accès ni allonger arbitrairement les jetons pour simplifier l’usage.
- Ne pas confondre « ouvrir le dossier » et « créer un compte » si le compte existe déjà.

Aide :

- Un accès « Besoin d’aide ? » visible, avec le canal de contact réellement utilisé par Fabien.
- Un lien WhatsApp/téléphone peut ouvrir le canal existant ; aucune transmission automatique de données ni message automatique.
- Prévoir que Fabien remplisse les informations avec le client pendant l’appel depuis sa vue coach. Aucun compte client partagé ni usurpation de session.

## 5. Lisibilité et accessibilité dans les deux vues

Objectifs de conception à vérifier, sans les présenter comme une certification :

- Texte principal confortable, au moins 18 px côté client lorsque la mise en page le permet ; champs au moins 16 px sur téléphone ; interligne aéré.
- Cibles principales d’au moins 44 × 44 px, espacées pour éviter les erreurs de toucher.
- Contrastes vérifiés ; pas de gris pâle pour une information indispensable ; aucune information portée uniquement par une couleur.
- Focus visible, ordre clavier cohérent, labels associés, erreurs reliées aux champs, annonces des résultats utiles aux lecteurs d’écran.
- Navigation et dialogues utilisables au clavier : entrée du focus, confinement adapté, fermeture et restitution du focus.
- Pas de défilement horizontal de page aux petites largeurs ; si un tableau technique exige un défilement, le contenir et l’indiquer.
- Agrandissement du texte et zoom sans couper le contenu ou masquer les actions ; écrans en portrait et paysage lorsque pertinent.
- Pas d’instructions dépendant uniquement du survol ou d’un geste difficile à deviner. Respecter la réduction des animations.
- Messages courts et ton adulte, respectueux. Ne pas afficher « mode senior » ou traiter l’âge comme une incapacité.

Réutilise les composants existants et améliore-les progressivement. N’ajoute pas une deuxième interface « simplifiée » indépendante à maintenir : une vue client claire et une vue coach adaptée suffisent.

## 6. Efficacité quotidienne du coach

Priorités fonctionnelles, à réutiliser si elles existent déjà après fusion :

- Vue « Aujourd’hui » : réponses à donner, dossiers à relire, relances, rendez-vous, actions en retard et accompagnements sans prochaine action. États dérivés des sources de vérité existantes, sans doublons.
- Recherche simple par nom ou projet ; accès rapide à chaque accompagnement actif.
- Note rapide WhatsApp/visio : sujet, conclusion, action éventuelle, responsable, visibilité et pièce si nécessaire. Une visio de 2–3 minutes ne doit pas nécessiter une réservation préalable ni la création d’une proposition commerciale.
- Les notes rapides sont privées par défaut ; partager volontairement une synthèse utile au client. Ne pas afficher les commentaires de gestion interne dans le fil client.
- La situation commerciale reste distincte de l’avancement technique. Le pack à 199 € n’impose ni quota horaire inventé ni fin automatique à 90 jours.
- Clôture/réouverture explicites avec conservation du dossier et de l’accord commercial. Bilan interne léger pour apprendre : travail réalisé, difficultés, ajustements futurs, temps approximatif facultatif.

Pas de graphiques ou automatisations supplémentaires avant que ce socle fonctionne. Pas de synchronisation complète Messenger/WhatsApp, chatbot ou nouvelle application mobile native dans ce complément.

## 7. Recette observable et critères de sortie

Utilise des données fictives et des services simulés. Vérifie de bout en bout, pas seulement la présence des boutons :

1. Prospect issu de Facebook → fiche d’entretien partielle → client/projet sans ressaisie ni duplication.
2. Même dossier accessible au coach et au client, avec notes privées absentes de la réponse client, pas seulement masquées en CSS.
3. Client peu à l’aise : ouvrir son dossier, identifier l’action attendue, envoyer une photo et retrouver le document partagé.
4. « Je ne sais pas » et sections incomplètes enregistrables ; interruption puis reprise sans perte de ce qui a été enregistré.
5. Envoi réseau échoué, double clic, erreur de validation, conflit de modification et expiration de session : résultat compréhensible, absence d’écrasement ou de double création.
6. Note de courte visio saisie rapidement par le coach, action visible à la bonne personne, aucun message externe déclenché pendant le test.
7. Van, camping-car et bateau dans le même parcours ; deux projets d’un même client restent distincts ; deux clients ne peuvent accéder aux données l’un de l’autre.
8. Navigation au clavier et lecteur d’écran si disponible ; affichages 360/390/768/1440 px, zoom 200 % et agrandissement du texte. Distingue ces essais d’un test réel sur iPhone/Android.

Après la recette technique, préparer un scénario d’essai court avec quelques utilisateurs représentatifs : les laisser chercher seuls leur prochaine action, déposer une photo et retrouver un document. Ne contacte personne et n’invente pas les résultats. Noter où ils hésitent, les erreurs et l’aide nécessaire ; améliorer à partir de ces observations. Aucun score arbitraire de satisfaction ou d’accessibilité.

## Livrable

Actualise le plan et le journal existants, puis implémente par lots cohérents dans le système unifié. À chaque livraison, précise ce qui a changé, ce qui a été réellement testé, ce qui reste à vérifier et la prochaine étape. Ne déclare pas le parcours « accessible » ou « adapté aux clients » uniquement sur la base du CSS ou des tests unitaires.
