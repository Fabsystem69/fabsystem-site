# Audit indépendant FabSystem — activité de coaching

Date : 27 septembre 2026. Référence locale : commit `e5af90e`, arbre de travail initialement propre.

Audit du code présent et de traitements exécutés isolément avec des données fictives. Ce rapport ne certifie ni le déploiement en production ni le fonctionnement des services externes. Aucune application, donnée métier ou configuration n’a été modifiée ; aucun message, paiement, webhook, cron ou téléchargement externe n’a été déclenché.

Les références `fichier:ligne` désignent le dépôt à cette révision. Les commentaires historiques, anciens prompts, maquettes et documents d’intention n’ont pas servi de critères produit. Les instructions techniques d’AGENTS.md ont été respectées. Les comportements décrits ci-dessous proviennent des instructions exécutables, des formulaires, du schéma et des tests, pas des intentions inscrites dans les commentaires.

## 1. Synthèse de l’état actuel

FabSystem possède déjà une base substantielle pour gérer le coaching : saisie de prospects Facebook, historique, relances datées, conversion en client, projets de coaching, séances, comptes rendus, actions, propositions commerciales manuelles, compteur de temps, dossier van partagé et suivi de relecture. Ces éléments méritent d’être conservés.

Le parcours n’est cependant pas unifié. Deux circuits existent réellement :

- **CRM coaching** : `Prospect → Customer → CoachingProject`, avec séances et propositions manuelles ; côté client, « Mon van ».
- **Offres d’accompagnement achetées** : `Order → DossierClient`, avec étapes, rendez-vous, documents, livraison et notifications ; côté client, « Mon accompagnement ».

Ils partagent l’identité `Customer`, mais pas leurs séances, leurs dossiers ni leur clôture. Le code ne permet pas de déterminer si cette séparation correspond à deux activités distinctes dans votre pratique. La fusion n’est donc pas une recommandation acquise.

La priorité est la fiabilité de ce qui existe. Des défauts démontrés concernent le rendu de la fiche coaching, la perte de champs, les budgets, l’invitation client, les fichiers et la reprise après erreur. Une utilisation entièrement fiable depuis le téléphone ne peut pas être affirmée : des dispositions mobiles existent, mais aucun parcours sur appareil réel n’a été exécuté ici.

**Conclusion opérationnelle :** le projet n’appelle pas, sur les preuves disponibles, une refonte générale. Il appelle d’abord des corrections ciblées, puis un choix métier sur l’articulation des deux circuits.

### Architecture et périmètre effectivement présents

| Ensemble | Implémentation observée | Rôle dans l’activité |
|---|---|---|
| Site public | Accueil `app/(home)`, prestations, contact, boutique, contenus, outils et éditeur | Informer, recueillir une demande, proposer une offre ou un outil |
| Application serveur | Next.js App Router, pages serveur, Server Actions et routes API ; services dans `lib/services` | Traitement métier et rendu |
| Administration | `/dashboard`, connexion administrateur, garde de layout et proxy ; API internes avec gardes dédiées | Coach/administrateur ; pas de rôle séparé de coach dans le CRM examiné |
| Compte client | `/mon-compte`, mot de passe et liens de connexion ; sessions stockées | Client authentifié, accès aux ressources et dossiers lui appartenant |
| Prospection | `Prospect`, `ProspectEvent`, `ProspectMessageTemplate` | Saisie manuelle des contacts Facebook et suivi des échanges |
| Coaching | `CoachingProject`, `CoachingSession`, `CoachingActionItem`, `CoachingProposal` | Suivi pédagogique et commercial manuel |
| Dossier technique partagé | Appareils, usages par scénario, matériel, circuits, révisions, événements, documents | Préparation et relecture du projet van |
| Accompagnement acheté | `DossierClient`, `DossierAppointment`, `DossierEvent`, `DossierDocument` | Exécution des prestations vendues sur le site |
| Commerce et documents | Produits, prix, panier, commandes, paiements, droits ; devis et factures séparés | Vente, accès et documents commerciaux |
| Intégrations | Stripe, Nodemailer, Vercel Blob privé pour les documents coaching, code de stockage Supabase, Redis selon configuration, flux calendrier ICS | Paiement, e-mails, fichiers, limitation des requêtes, agenda |

Sources : `package.json:1`, `prisma/schema.prisma:214`, `:437`, `:648`, `:779`, `:901`, `:1245`, `:1388`, `:1465`, `:1609`, `:1679` ; `proxy.ts:82` ; `app/dashboard/layout.tsx:30` ; `app/mon-compte/layout.tsx:13` ; `lib/server/coaching-project-storage.ts:4`.

Le guide historique ne décrit plus tout l’existant : commerce générique, abonnements éditeur et CRM sont présents ; l’ancien ebook est décommissionné dans le webhook (`app/api/stripe/webhook/route.ts:103`). Cet écart documentaire n’a pas été utilisé pour disqualifier ces fonctions ou proposer leur suppression.

## 2. Parcours réellement reconstitué

### A. Entrée, qualification et transformation du prospect

| Étape | Intervenant et informations | Enregistrement réel et action suivante | Attente, erreur ou changement |
|---|---|---|---|
| Découverte du site | Prospect ; accès d’origine Facebook supposé d’après votre contexte, URL d’arrivée inconnue | Pages publiques, offres et contact. La page accompagnement propose aussi l’éditeur et les exemples | Aucune donnée de conversion examinée. Impossible de connaître les pages réellement utilisées depuis Facebook |
| Demande via le site | Prospect ; nom, e-mail, message, détails facultatifs | `/api/contact` valide et envoie un e-mail. **Aucune création de Prospect dans cette route** | Erreur affichée et adresse e-mail de secours ; formulaire conservé en cas d’erreur côté client. Pas de suivi durable de demande dans l’application sur ce chemin |
| Contact Facebook | Coach ; nom, source, lien de conversation, besoin, coordonnées facultatives | Création manuelle de `Prospect` dans le CRM | L’e-mail n’est pas nécessaire à cette étape. Aucun import automatique Messenger trouvé dans les parcours examinés |
| Qualification/relance | Coach ; notes d’échange, statut, prochaine action et date | Modification du prospect ; notes et changements de statut dans `ProspectEvent` | Relances dues remontées dans « Aujourd’hui ». Une action sans date ne figure pas dans la liste des relances datées. `GAGNE` et `SANS_SUITE` sont exclus |
| Conversion | Coach ; e-mail et titre du projet | Transaction : réutilise/crée `Customer` par e-mail, crée `CoachingProject`, marque le prospect `GAGNE`, journalise | Conversion déjà réalisée refusée lors d’une demande ultérieure ordinaire. L’historique demeure sur le prospect. L’acquisition de l’accord commercial réel n’est pas déductible de ce clic |

Preuves : `components/services/OnFaitEnsemble.tsx:29`, `components/prestations/AccompagnementOfferPaths.tsx:4`, `components/ContactForm.tsx:54`, `app/api/contact/route.ts:44`, `:115`, `lib/services/prospect.ts:27`, `:49`, `:100`, `:135`, `:156`.

La conversion conserve le besoin en description du projet. Si le client existe déjà, l’upsert ne remplace pas ses coordonnées (`lib/services/prospect.ts:172`). Cela protège sa fiche, mais une nouvelle information téléphonique reste à rapprocher manuellement. Les conversations Facebook elles-mêmes restent externes ; le projet ne démontre pas une copie intégrale de leur contenu.

### B. Circuit CRM coaching

| Étape | Intervenant et informations | Enregistrement réel et action suivante | Attente, erreur ou changement |
|---|---|---|---|
| Proposition | Coach ; intitulé, montant, durée | `CoachingProposal` ; statut brouillon/envoyée/acceptée/refusée, paiement et montant reçu saisis manuellement | Le statut « envoyée » n’envoie pas de message ; « payée » ne déclenche pas de paiement. Aucune liaison devis/facture/commande dans ce modèle |
| Accès client | Coach génère un lien, puis le transmet lui-même ; client l’ouvre | Jeton de connexion, puis session client ; accès au dossier van via le compte | Défauts de rendu et de durée annoncée détaillés en D1/D5. La génération révoque les liens de connexion actifs antérieurs du client |
| Préparation partagée | Coach et client ; véhicule, objectifs, usages, appareils, matériel, implantation | Champs du `CoachingProject`, appareils/usages/scénarios et matériel ; sauvegarde par formulaire | Sections partiellement protégées contre un formulaire ancien ; conflits et erreurs redirigent sans réafficher la saisie rejetée |
| Demande de relecture | Client clique « Envoyer pour relecture » | `readyForReviewAt` ; remontée au tableau de bord du coach | Le bouton agit sur les données déjà enregistrées ; ce n’est pas une sauvegarde du formulaire voisin |
| Relecture et travail technique | Coach ; circuits, statuts, révisions | `lastReviewedAt`, drapeau de modification, `CoachingCircuit`, `CoachingSchemaRevision` | Alertes présentes, mais suppressions non couvertes et instantané partiel, voir D8/D12 |
| Séances | Coach ; date, durée, statut et compte rendu | `CoachingSession` ; agenda et fiche projet | Prévue/réalisée/annulée. Les séances réalisées diminuent le temps restant. Fonction de report présente au serveur, mais sans contrôle de report relié dans la fiche examinée |
| Travail entre séances | Coach ; questions, préparation, actions datées | Texte du projet et `CoachingActionItem` | Actions en retard remontées. Pas de preuve que ces actions constituent une liste de tâches partagée avec le client |
| Fin | Coach sélectionne `TERMINE` | Statut du `CoachingProject` | Le client peut encore modifier son dossier ; pas de clôture coordonnée avec `DossierClient`, facture ou droits. Est-ce voulu ? À confirmer, pas automatiquement un défaut |

Preuves : `lib/services/coaching-project.ts:96`, `:128`, `:150`, `:177`, `:197`, `:237`, `:256`, `:278` ; `app/dashboard/crm/actions.ts:463` ; `app/mon-compte/mon-van/actions.ts:53`, `:60` ; `lib/services/coaching-van-dossier.ts:144`, `:152` ; `app/dashboard/crm/projects/[projectId]/page.tsx:131`, `:514`, `:633`.

Le temps « acheté » est exactement la somme des durées **acceptées**, indépendamment du paiement ; le temps consommé est celui des séances **réalisées**. Le solde peut être négatif. C’est une règle actuelle du logiciel, pas une conclusion sur votre règle commerciale.

### C. Circuit des offres achetées et fin d’accompagnement

| Étape | Intervenant et informations | Enregistrement réel et action suivante | Attente, erreur ou changement |
|---|---|---|---|
| Offre | Prospect/client ; choix de prestation | Pages découverte, conseil, guidé, conception ; CTA de contact ou ajout au panier selon offre | L’appel découverte débouche sur un contact pour convenir d’un créneau, pas une réservation ferme |
| Achat | Client et Stripe ; panier, identité, prix | `Order`/`Payment` ; webhook signé vérifiant montant et métadonnées | Commande en attente jusqu’au paiement reconnu ; rejeu prévu sur les traitements commerce, mais effets secondaires partiellement fragiles |
| Création du suivi | Serveur après paiement des slugs concernés | `DossierClient`, unique par commande ; copie des besoins contenus dans les métadonnées ; confirmation par e-mail | Une création manuelle existe aussi. Aucun `CoachingProject` créé par ce service |
| Suivi | Coach ; WhatsApp, notes, étapes, itérations, rendez-vous, fichiers | Dossier et événements ; espace `/mon-compte/mon-accompagnement` | Appels simples : `A_VENIR`/`FAIT`. Offres longues : étapes. Notes internes séparées des éléments affichés au client |
| Agenda téléphone | Coach ; abonnement privé au flux ICS | `DossierAppointment` exporté ; secret dans l’URL de calendrier | Rafraîchissement périodique. Les `CoachingSession` du CRM ne sont pas incluses |
| Livraison | Coach marque livré, action annulable | `dateLivraison` et événement | Cette date pilote les traitements après livraison, distinctement des autres statuts |
| Après livraison | Cron configuré ; client destinataire | Prise de nouvelles à J+30, demande de témoignage à J+15, avertissement/purge de fichiers après environ 11/12 mois | Activation réelle du cron et délivrabilité non vérifiées ; défaut de conditionnement de purge D4 |

Preuves : `app/contact/page.tsx:100` ; `components/prestations/OfferPurchaseCta.tsx:5` ; `lib/services/stripe-webhook-commerce.ts:334`, `:409` ; `lib/services/dossier-client.ts:65`, `:133`, `:151`, `:172`, `:248`, `:371` ; `app/api/calendar/accompagnements.ics/route.ts:16` ; `lib/services/dossier-notifications.ts:76`, `:99`, `:120`, `:141` ; `vercel.json:1`.

Les devis, signature publique, PDF, conversion en facture et enregistrement de règlement existent parallèlement (`lib/services/quotes.ts:25`, `lib/quote-signature-service.ts:1`, `lib/services/invoices.ts:107`, `app/api/internal/invoices/[id]/payment/route.ts:1`). Aucun passage automatique de `CoachingProposal` à ces documents n’est établi. L’audit ne suppose pas que toutes vos prestations nécessitent aujourd’hui de passer par ces écrans.

## 3. Points solides à conserver

| Élément vérifié | Bénéfice concret et preuve | Certitude et réserve |
|---|---|---|
| Prospect léger, sans e-mail obligatoire au départ | Compatible avec un échange Messenger ; source, lien, besoin, prochaine action. `lib/services/prospect.ts:49` | Élevée, lecture ; pas de mesure du temps de saisie réel |
| Conversion transactionnelle et identité réutilisée | Évite la ressaisie systématique et conserve l’historique. `lib/services/prospect.ts:171` | Élevée ; concurrence non garantie par cette seule transaction |
| Vue d’attention déjà construite | Relances, séances, retards, relectures et temps bas regroupés. `lib/services/coaching-dashboard.ts:10` | Élevée sur les requêtes, utilité quotidienne à confirmer |
| Solde de temps recalculé | Évite un compteur manuel divergent, conserve un dépassement visible. `lib/services/coaching-project.ts:278` | Calcul pur couvert par les tests exécutés ; rapprochement du paiement à clarifier |
| Dossier réellement partagé | Même service de sauvegarde des sections côté coach/client. `app/dashboard/crm/actions.ts:375`, `app/mon-compte/mon-van/actions.ts:66` | Élevée ; défauts d’écrasement à corriger sans supprimer le partage |
| Calculs signalant les entrées manquantes | Tests sur consommation, quantités et inconnues ; `tests/coaching-consumption.test.ts:1` | Tests passants, pas une validation physique des installations ni de tous les parcours de saisie |
| Contrôles d’accès serveur | Propriété vérifiée avant les modifications client et téléchargements de dossier ; gardes admin. `app/mon-compte/mon-van/actions.ts:53`, `app/api/dossiers/documents/[documentId]/route.ts:14` | Élevée sur les chemins lus ; pas un test d’intrusion exhaustif |
| Stockage privé et flux serveur | Fichiers servis après contrôle, upload `access: private`. `lib/server/vercel-blob-storage.ts:12`, `app/api/internal/coaching-projects/documents/[documentId]/route.ts:9` | Code vérifié, configuration distante non vérifiée |
| Paiement vérifié au serveur | Signature webhook, montants/métadonnées, mise à jour transactionnelle et traitement d’un rejeu. `app/api/stripe/webhook/route.ts:20`, `lib/services/stripe-webhook-commerce.ts:334` | Tests simulés passants ; les notifications ne disposent pas des mêmes garanties |
| Premiers choix mobiles pertinents | Menu mobile, champs souvent en taille de texte de base, disposition sur une colonne et boutons larges pour la saisie prospect. `components/dashboard/shell/MobileDrawer.tsx:95`, `app/dashboard/crm/prospects/[prospectId]/page.tsx:123` | Lecture des classes, pas de validation visuelle sur téléphone |
| Erreur de contact récupérable | Saisie conservée en cas d’erreur et e-mail de secours ; états annoncés avec `role=status`. `components/ContactForm.tsx:76`, `:215` | Élevée, lecture ; labels à corriger |

Ces qualités peuvent être conservées sans changement de technologie. Aucun chantier n’est requis simplement pour les remplacer par une autre solution.

## 4. Problèmes constatés, classés par impact

Les efforts ci-dessous sont indicatifs, en jours de développement et de vérification, sans engagement de délai ni correction des données historiques. « Démontré » désigne un comportement établi dans le code, éventuellement reproduit isolément ; cela ne signifie pas qu’un incident de production a été observé.

### Impact élevé : blocage, perte ou altération d’information

#### D1 — La fiche CRM contient des événements navigateur dans un composant serveur

- **Classe : défaut démontré.** L’affichage d’un lien d’invitation, d’un circuit ou d’une révision rend respectivement un `onFocus` ou un `onChange` dans la page serveur. Dès qu’une de ces branches est rendue, le rendu RSC rencontre une fonction d’événement non sérialisable.
- **Preuves :** `app/dashboard/crm/projects/[projectId]/page.tsx:206`, `:453`, `:494`, sans directive client. Reproduction P5 : les trois éléments correspondants, rendus par le moteur RSC installé, produisent `Event handlers cannot be passed to Client Component props.`
- **Impact :** une fiche vide peut sembler fonctionner, puis devenir inaccessible après ajout d’un circuit/révision ou génération d’invitation. La mutation peut avoir réussi avant l’échec d’affichage.
- **Certitude : élevée.** Erreur du moteur reproduite ; page complète avec vraie base non exécutée.
- **Correction proportionnée :** supprimer l’événement de sélection automatique du lien ; employer un bouton explicite pour les changements de statut, ou un petit composant client isolé si l’autosoumission est conservée.
- **Effort/dépendances :** 0,5–1 j ; vérifier les trois branches avec fixtures. Aucun changement de modèle nécessaire.

#### D2 — Sauvegarder « Véhicule & projet » efface objectifs et niveau client

- **Classe : défaut démontré.** Le formulaire administrateur n’envoie pas `objectifs` et `niveauClient`, mais son action les transforme en `null` et les transmet au service.
- **Preuves :** formulaire `app/dashboard/crm/projects/[projectId]/page.tsx:211–241` ; action `app/dashboard/crm/actions.ts:390`, `:393` ; écriture `lib/services/coaching-van-dossier.ts:59`. P2 reproduit les deux valeurs nulles transmises depuis un formulaire équivalent.
- **Impact :** des informations saisies par le client ou dans « Fiche projet » disparaissent après une simple correction du véhicule. Le journal de section n’enregistre pas les anciennes valeurs permettant une restauration.
- **Certitude : élevée.** Adaptateur testé avec service simulé ; écriture finale vérifiée par lecture.
- **Correction :** ne transmettre que les champs éditables de ce formulaire ; une absence de champ ne doit pas signifier une demande d’effacement. Examiner séparément les valeurs historiques avant toute restauration.
- **Effort/dépendances :** 0,5–1 j ; test croisant les deux formulaires ; aucune migration pour la correction du code.

#### D3 — Les budgets en euros sont enregistrés comme des centimes

- **Classe : défaut démontré.** Saisir 2 000 € transmet `materialBudgetCents: 2000`, puis la vue divise cette valeur par 100 et affiche 20 €.
- **Preuves :** `app/dashboard/crm/projects/[projectId]/page.tsx:235–236` ; `app/dashboard/crm/actions.ts:396–397` ; service `lib/services/coaching-van-dossier.ts:61`. P1 reproduit la transmission erronée.
- **Impact :** budget cent fois trop petit ; une sauvegarde ultérieure peut amplifier l’erreur ou rencontrer les contraintes numériques du formulaire. Le phénomène ne concerne pas, sur cette preuve, les montants Stripe ou toutes les propositions.
- **Certitude : élevée.** Adaptateur exécuté isolément.
- **Correction :** conversion explicite euros → centimes, validation et affichage cohérents ; ne pas multiplier aveuglément toutes les anciennes valeurs, dont l’origine n’a pas été contrôlée.
- **Effort/dépendances :** 0,5–1 j pour le code ; examen des données existantes à autoriser séparément.

#### D4 — La purge peut supprimer les documents sans avertissement préalable réussi

- **Classe : défaut démontré.** La sélection de purge dépend de la date de livraison, pas de la réussite ni de la date de l’avertissement. Un premier passage à plus de 365 jours peut avertir et supprimer dans la même exécution. Un échec d’e-mail n’empêche pas la suppression.
- **Preuves :** `lib/services/dossier-notifications.ts:143–174`, `:180–198`. P6 : échec SMTP simulé, puis appels de suppression du fichier et de sa référence quand même observés.
- **Impact :** perte d’accès aux livrables sans délai réel pour les récupérer. En outre, une suppression Blob en erreur est absorbée, puis la référence en base est supprimée : fichier orphelin possible et absence de reprise par cette liste.
- **Certitude : élevée sur le mécanisme.** Aucune purge distante déclenchée ; existence de dossiers concernés inconnue.
- **Correction :** enregistrer un avertissement réussi et imposer un délai à partir de celui-ci ; garder une trace et une possibilité de reprise pour chaque fichier non supprimé. Avant correction, une suspension ciblée de la purge serait une option conservatoire à décider, sans supprimer les autres notifications.
- **Effort/dépendances :** 1–3 j ; règle de conservation à confirmer ; plan de données préalable si ajout d’un champ/état durable, conformément au dépôt.

#### D5 — Le lien d’invitation est annoncé valable 24 h mais expire en 15 min

- **Classe : défaut démontré.** L’écran demande de copier un lien pour Messenger et annonce 24 h. L’action utilise le service de connexion dont la durée est 15 min.
- **Preuves :** `app/dashboard/crm/projects/[projectId]/page.tsx:205`, `app/dashboard/crm/actions.ts:469`, `lib/services/customer-auth.ts:28`, `:347–367`.
- **Impact :** le destinataire qui ouvre plus tard reçoit un lien expiré malgré la promesse affichée. Générer un nouveau lien invalide les précédents liens actifs. Le jeton est aussi transporté dans l’URL du dashboard (`actions.ts:473`), donc susceptible de rester dans l’historique ou une URL partagée ; aucune fuite réelle constatée.
- **Certitude : élevée**, lecture concordante ; aucun vrai jeton créé.
- **Correction :** annoncer la durée réelle et expliquer la reconnexion ; afficher le résultat sans placer le secret dans l’URL de la fiche. N’allonger la durée qu’après décision sur le besoin, sans changer indistinctement tous les liens de connexion.
- **Effort/dépendances :** 0,25–1 j pour clarification/affichage ; dépend de D1. Une invitation durable distincte serait un travail supplémentaire facultatif.

#### D6 — Des renseignements du formulaire contact ne parviennent jamais au coach

- **Classe : défaut démontré.** Type de demande, urgence et contexte sont recueillis et validés, mais absents de la sélection des champs utilisée pour construire l’e-mail.
- **Preuves :** `components/ContactForm.tsx:171`, `:188`, `:195` ; `lib/contact-request.ts:47` ; `app/api/contact/route.ts:63–87`. P3 : réponse 200 simulée, aucun des trois contenus dans le message capturé.
- **Impact :** le prospect pense avoir transmis ces informations, le coach ne les reçoit pas ; nécessité de redemander ou risque de mal qualifier une demande urgente.
- **Certitude : élevée**, route exécutée avec parseur et envoi simulés.
- **Correction :** inclure ces champs dans l’e-mail, ou retirer les champs inutiles si vous ne les utilisez pas. Aucun besoin de construire un nouveau CRM pour corriger cette perte.
- **Effort/dépendances :** 0,25–0,5 j ; test du contenu produit, sans SMTP réel.

#### D7 — La protection contre les modifications concurrentes reste incomplète

- **Classe : défaut démontré pour la fenêtre de concurrence.** La version est lue avant la transaction ; l’update filtre seulement sur l’ID. Deux sauvegardes ayant lu la même version peuvent toutes deux réussir.
- **Preuves :** `lib/services/coaching-van-dossier.ts:52–65`, `:94–107`, `:126–139`. P4 impose deux lectures simultanées avec Prisma simulé : deux succès et seule la dernière valeur conservée. La « Fiche projet » écrit aussi `objectifs`/`niveauClient` sans modifier `vehicleInfoUpdatedAt` (`lib/services/coaching-project.ts:110–122`).
- **Impact :** écrasement possible entre téléphone et ordinateur ou entre coach et client. Le contrôle actuel détecte certains formulaires périmés, mais ne garantit pas l’absence de perte.
- **Certitude : élevée sur l’algorithme ; fréquence inconnue.** Pas de test concurrent sur PostgreSQL réel.
- **Correction :** écriture conditionnelle atomique sur ID et version ; toutes les voies modifiant les mêmes champs doivent respecter ce contrôle. Renvoyer les valeurs rejetées pour permettre leur rapprochement.
- **Effort/dépendances :** 1–2 j ; versions déjà présentes, revue des voies d’écriture partagées.

#### D8 — Supprimer un appareil ou du matériel ne déclenche pas la relecture attendue

- **Classe : défaut démontré.** Les créations/modifications journalisent et mettent à jour le drapeau de changement ; les suppressions d’appareil, d’usage et de matériel appellent directement `delete`.
- **Preuves :** `lib/services/coaching-van-dossier.ts:280–283`, `:324–327` ; `lib/services/coaching-material.ts:92–95` ; drapeau `lib/services/coaching-project-events.ts:12–17` ; alerte `lib/services/coaching-schema-revision.ts:70–76`.
- **Impact :** après relecture, le contenu peut changer sans alerte « modifié depuis la dernière relecture » ni trace de suppression. Le coach peut croire travailler sur les données relues.
- **Certitude : élevée**, lecture des chemins appelés par les boutons de retrait.
- **Correction :** journaliser la suppression et actualiser le drapeau dans la même transaction, avec le projet et l’auteur. Ne pas transformer cette alerte en certification technique.
- **Effort/dépendances :** 0,5–1,5 j ; réutiliser le mécanisme d’événements existant.

### Impact significatif : livraison, continuité du suivi et usage mobile

#### D9 — Des fichiers autorisés à 2 Mo sont bloqués avant le traitement

- **Classe : défaut démontré par configuration/code.** Les documents passent par des Server Actions. Le validateur accepte 2 Mo, tandis que Next.js installé limite par défaut le corps complet à 1 Mo ; `next.config.ts` ne relève pas cette limite.
- **Preuves :** `lib/server/coaching-project-storage.ts:10`, `:20–27` ; `app/mon-compte/mon-van/[projectId]/page.tsx:378` ; `app/dashboard/crm/actions.ts:309` ; `next.config.ts:1` ; documentation locale `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`, section `bodySizeLimit` ; contrôle effectif `node_modules/next/dist/server/app-render/action-handler.js:568–578`.
- **Impact :** une photo de 1,5 Mo passe les règles métier mais peut être rejetée par le framework avant le retour d’erreur prévu. Les photos HEIC ou de plus de 2 Mo sont également refusées par les formats/limites métier ; leur fréquence depuis votre téléphone reste inconnue.
- **Certitude : élevée sur la contradiction**, aucun upload HTTP réel exécuté.
- **Correction :** aligner la limite de transport avec la limite de fichier et la surcharge multipart ; annoncer format/taille avant sélection. Compression/conversion facultative après essai sur vos photos réelles.
- **Effort/dépendances :** 0,5–1 j ; vérifier ensuite la limite de la plateforme d’hébergement, sans la supposer identique à Next.js.

#### D10 — Une confirmation d’accompagnement échouée n’est pas retentée au rejeu

- **Classe : défaut démontré.** Le dossier est créé avant l’envoi ; l’erreur SMTP est journalisée puis absorbée. Au rejeu, « dossier déjà existant » arrête la fonction avant l’envoi.
- **Preuves :** `lib/services/dossier-client.ts:90–125`. P7 : deux appels, échec du premier envoi, une seule tentative d’e-mail. Les effets du webhook se succèdent après la transaction paiement (`lib/services/stripe-webhook-commerce.ts:409–442`), sans file durable dédiée visible dans cette chaîne.
- **Impact :** commande et dossier peuvent exister sans confirmation client. Une erreur d’une étape précédente peut aussi retarder la création du dossier jusqu’à un rejeu ; les tests paiement ne prouvent pas la délivrabilité de tous les effets.
- **Certitude : élevée pour la confirmation perdue**, fonctionnement réel des reprises Stripe non testé.
- **Correction :** distinguer « dossier créé » de « confirmation envoyée », conserver les tentatives et permettre une reprise explicite. Pour les effets critiques après paiement, un travail durable et rejouable répond aussi à la règle technique du dépôt.
- **Effort/dépendances :** 1–3 j pour ce chemin ; plan de données si état durable ajouté. Éviter les renvois aveugles à tous les clients.

#### D11 — Le second dossier d’accompagnement masque le précédent dans l’espace client

- **Classe : défaut démontré, impact conditionnel à plusieurs dossiers.** La création permet plusieurs dossiers par client, mais la page choisit uniquement le dernier par date de création, sans sélecteur.
- **Preuves :** `lib/services/dossier-client.ts:133`, `:357–365` ; `app/mon-compte/mon-accompagnement/page.tsx:62–67` ; schéma `prisma/schema.prisma:1245`.
- **Impact :** après un nouvel achat ou une création manuelle, le client ne retrouve plus depuis cet écran l’ancien suivi et ses fichiers. Les données ne sont pas supprimées. Cela peut aussi masquer un accompagnement encore en cours derrière une nouvelle prestation courte.
- **Certitude : élevée sur la sélection ; nombre de clients concernés inconnu.**
- **Correction :** proposer un choix simple si les accompagnements multiples sont pratiqués ; sinon rendre la règle « un dossier courant » explicite et éviter les créations ambiguës.
- **Effort/dépendances :** 0,5–1,5 j ; décision sur les prestations successives/simultanées, contrôle de propriété pour tout ID sélectionné.

#### D12 — « Figer une révision » ne conserve qu’une partie du dossier

- **Classe : défaut démontré relativement au libellé affiché.** L’instantané conserve quelques champs du véhicule, des appareils/matériels résumés et les résultats de bilan ; il ne conserve pas les circuits, les entrées détaillées des usages ni l’ensemble des hypothèses/sections du dossier.
- **Preuves :** promesse `app/dashboard/crm/projects/[projectId]/page.tsx:471` ; construction `lib/services/coaching-dossier-snapshot.ts:42–58` ; stockage `lib/services/coaching-schema-revision.ts:22–36`. L’export CSV relit la version courante (`lib/services/coaching-dossier-export.ts:23–30`).
- **Impact :** le résultat ancien peut être retrouvé en base, mais pas toutes les données nécessaires pour expliquer pourquoi il avait été retenu. Une révision n’est donc pas une archive complète du dossier tel qu’il existait.
- **Certitude : élevée**, structure sérialisée lue ; aucune restauration de révision exécutée.
- **Correction :** renommer en « instantané résumé » si cela suffit ; sinon figer seulement les entrées/hypothèses nécessaires à la traçabilité attendue et rendre leur consultation explicite. Ne pas promettre une restauration que l’interface ne fournit pas.
- **Effort/dépendances :** 0,25 j de clarification ou 1–3 j pour un instantané utile et consultable ; décision sur le livrable final et compatibilité des anciennes versions JSON.

#### D13 — Erreur serveur ou changement d’étape : la saisie en cours n’est pas reprise

- **Classe : défaut démontré pour le retour d’erreur ; difficulté probable pour les interruptions mobiles.** Les actions redirigent avec le seul message d’erreur ; la page recharge les valeurs stockées. Les liens d’étape et « Envoyer pour relecture » sont indépendants du formulaire en cours.
- **Preuves :** `app/mon-compte/mon-van/actions.ts:89–94`, `:125–130` ; `app/mon-compte/mon-van/[projectId]/page.tsx:93–106`, `:405–410` ; `app/dashboard/crm/prospects/actions.ts:50–53`.
- **Impact :** texte rejeté non restitué par l’application ; un client peut demander la relecture des anciennes valeurs en pensant envoyer sa saisie. La récupération éventuelle par le navigateur ne constitue pas une garantie applicative.
- **Certitude : élevée sur le traitement**, comportement précis après suspension d’iOS non testé.
- **Correction :** garder les valeurs lors des erreurs, signaler les modifications non enregistrées et clarifier ce que soumet le bouton de relecture. Un brouillon local est facultatif et implique de traiter les données laissées sur l’appareil.
- **Effort/dépendances :** 1–3 j sur les formulaires principaux ; à combiner avec D7. Pas de nécessité de rendre tout le site hors ligne.

#### D14 — Accessibilité incomplète du contact et de la navigation mobile

- **Classe : défaut démontré dans le balisage.** Les labels visibles du contact sont des frères des champs sans `htmlFor`/`id` ; le tiroir mobile n’a ni sémantique de dialogue, ni gestion du focus ou de la touche Échap. Des suppressions CRM sont nommées seulement « ✕ ».
- **Preuves :** `components/ContactForm.tsx:115–135`, `:151–158` ; `components/dashboard/shell/MobileDrawer.tsx:23–76` ; `app/dashboard/crm/projects/[projectId]/page.tsx:331`, `:624`.
- **Impact :** association label/champ et navigation assistée moins fiables ; libellés des retraits peu explicites. Aucune conclusion chiffrée sur le contraste ou conformité globale.
- **Certitude : élevée sur les omissions**, lecteur d’écran non utilisé.
- **Correction :** associer les labels, nommer les actions, gérer focus/fermeture du menu ; conserver les états `role=status` déjà présents.
- **Effort/dépendances :** 0,5–1,5 j ; essai clavier et VoiceOver sur téléphone après correction.

### Difficultés probables à confirmer en usage

| ID | Observation et preuve | Impact possible, certitude | Recommandation proportionnée, effort et dépendances |
|---|---|---|---|
| U1 — Deux suivis et deux agendas | L’achat crée `DossierClient` (`lib/services/dossier-client.ts:97`), la conversion crée `CoachingProject` (`lib/services/prospect.ts:183`). Le flux ICS ne lit que `DossierAppointment` (`lib/services/dossier-client.ts:447`) ; l’agenda CRM lit `CoachingSession` (`lib/services/coaching-project.ts:312`) | Séparation certaine ; oublis/ressaisies probables seulement si vous utilisez les deux pour les mêmes clients. Une séance CRM n’apparaît pas dans ce flux iPhone | Confirmer quel écran fait autorité ; commencer par une clarification et des liens, ou inclure les deux types d’événements dans la lecture calendrier si nécessaire. 0,5–2 j pour repérage/liens/lecture, davantage pour rapprochement de données. Aucune fusion préalable imposée |
| U2 — Suivi financier manuel ambigu | « Payé » et montant reçu indépendants (`lib/services/coaching-project.ts:256–270`) ; temps acheté fondé sur `ACCEPTEE` (`:278`). Proposition distincte de facture/commande (`prisma/schema.prisma:1679`) | Un « payé, 0 € reçu » est autorisé ; incohérence possible, mais une règle de gratuité/crédit peut l’expliquer. Aucun écart comptable réel observé | Clarifier les libellés et signaler les contradictions ; ne dériver automatiquement les statuts qu’après choix métier. 0,5–1 j ; règle acompte, gratuité et heures engagées à préciser |
| U3 — Reprogrammation non accessible et retraits définitifs | Action de report existante (`app/dashboard/crm/actions.ts:171`) sans appel dans la fiche ; boutons de suppression directe (`app/dashboard/crm/projects/[projectId]/page.tsx:577`, `lib/services/coaching-project.ts:189`) | Reporter pousse potentiellement à supprimer/recréer. Supprimer une séance réalisée enlève le compte rendu et modifie le solde. Fréquence de cette manipulation inconnue | Relier le formulaire de report déjà supporté ; confirmer le retrait d’une séance réalisée ou privilégier son annulation selon vos règles. 0,5–1 j ; vérifier ce que signifie « annulée » pour le temps consommé |
| U4 — Longue fiche coach et allers-retours | La même page empile fiche, véhicule, usages, bilan, matériel, implantation, circuits, révisions, séances, actions, commercial et documents (`app/dashboard/crm/projects/[projectId]/page.tsx:131–733`) | Défilement et perte de contexte probables sur téléphone ; non mesurés. Les retours de sauvegarde visent la page sans section précise (`app/dashboard/crm/actions.ts:140`, `:164`) | Observer d’abord trois tâches fréquentes ; essayer ancres et retours à la section avant onglets/refonte. 0,5–1 j pour une simplification ciblée ; essai téléphone nécessaire |
| U5 — Contact et échanges restent dispersés | `/api/contact` envoie seulement un e-mail ; l’historique prospect est manuel (`app/api/contact/route.ts:115`, `lib/services/prospect.ts:135`). Le dossier « Mon van » permet l’upload mais n’affiche pas une liste de ses documents (`app/mon-compte/mon-van/[projectId]/page.tsx:375–383`) | Risque de demande oubliée ou d’envoi en double ; cela peut aussi correspondre à votre organisation actuelle par Messenger/e-mail | Confirmer où vous traitez votre boîte d’entrée et restituez les fichiers ; une procédure simple peut suffire. Afficher les fichiers déjà déposés seulement si utile. 0,25 j de clarification, 0,5–2 j pour une liaison/liste minimale avec autorisation serveur |

## 5. Améliorations recommandées et compromis

Les corrections D1 à D10 protègent des comportements déjà proposés ; elles ne demandent pas de choisir un nouveau parcours. D11 à D14 visent la continuité, la clarté des promesses et l’accessibilité.

| Choix | Bénéfice attendu | Compromis |
|---|---|---|
| Corriger les formulaires et leur rendu avant d’ajouter des fonctions | Retrouver une fiche utilisable, ne plus perdre des données | Moins visible qu’une refonte, mais directement vérifiable avec des cas de régression |
| Conserver les deux circuits en les nommant clairement tant que leur usage n’est pas établi | Évite une migration et préserve les prestations en cours | Navigation encore séparée ; U1 doit être tranché par votre usage réel |
| Ajouter des liens ou une vue de lecture transversale avant une fusion | Accès aux rendez-vous et suivis depuis le téléphone | Ne synchronise pas les statuts ; il faut indiquer leurs sources |
| Rendre les erreurs et changements explicites | Moins de ressaisie et d’écrasement | Petits composants interactifs et états de formulaire supplémentaires |
| Rendre les effets après paiement et la purge rejouables | Traçabilité des échecs et reprise ciblée | État durable à concevoir ; tout changement de schéma nécessite un plan documenté |
| Ajuster les promesses à ce qui est conservé | Invitation et révision compréhensibles sans surdéveloppement | Peut réduire une promesse existante ; à privilégier si la fonction plus ambitieuse n’est pas nécessaire |

**Opportunités facultatives, sans défaut démontré justifiant leur lancement immédiat :**

- **Entrée directe depuis Facebook vers le bon point de contact.** La page accompagnement met d’abord des liens vers l’éditeur/exemples (`components/services/OnFaitEnsemble.tsx:35–41`). Cela peut aider un prospect autonome ou détourner quelqu’un souhaitant simplement parler. Vérifier votre lien Facebook réel et observer quelques arrivées ; éventuellement modifier seulement ce lien ou un CTA. Effort 0,25–0,5 j après observation. Aucun gain de conversion affirmé.
- **Import automatique des contacts.** Le caractère manuel du CRM est établi, mais son coût réel ne l’est pas. Ne lancer une intégration Messenger que si le volume/les oublis le justifient. Une convention de saisie peut suffire. Effort technique non chiffrable sérieusement sans canal et permissions à examiner ; dépend d’un besoin métier confirmé.
- **Bilan de fin partagé.** Le CRM possède un statut terminé, les accompagnements une livraison et des relances (`lib/services/coaching-project.ts:117`, `lib/services/dossier-client.ts:248`). Une nouvelle étape n’est utile que si votre bilan final actuel est dispersé ou oublié. Commencer par un libellé ou une note structurée ; 0,5–1 j si cela suffit. Dépend du livrable réellement promis.

Aucun changement de prestataire de stockage, d’authentification, de paiement ou de framework n’est proposé sur la seule base de cet audit. Les écarts entre le guide historique et les intégrations présentes doivent être clarifiés avant un futur chantier architectural ; ils ne démontrent pas, à eux seuls, un défaut d’usage du coaching.

## 6. Questions métier encore ouvertes

Ces questions deviennent utiles après l’examen de l’existant ; aucune ne vous demande de choisir une technologie.

1. **Quels écrans utilisez-vous aujourd’hui pour un client réel : CRM coaching, Accompagnements, ou les deux ?** Une prestation achetée doit-elle ensuite devenir un projet CRM ? Détermine la réponse à U1.
2. **Quel lien partagez-vous sur Facebook, et où traitez-vous les demandes reçues par le site ?** Messenger, boîte mail ou CRM font-ils actuellement office de liste « à répondre » ? Détermine U5 et l’intérêt d’un rattachement des contacts.
3. **À quel moment considérez-vous le prospect comme client ?** Accord verbal, réservation, devis accepté ou paiement ? Le clic « Convertir » et le choix manuel « Gagné » peuvent aujourd’hui diverger.
4. **Le temps doit-il être disponible dès l’acceptation ou après règlement ?** Comment gérez-vous acompte, temps offert, report, annulation et dépassement ? Détermine les libellés et contrôles de U2/U3.
5. **Un client peut-il avoir plusieurs accompagnements en même temps ou acheter un complément ?** Détermine la priorité de D11 et les liens entre dossiers.
6. **Que doit pouvoir retrouver le client à la fin ?** Comptes rendus, schéma, hypothèses, bilan, fichiers sources ? Sur le site, par e-mail ou Messenger ? Détermine le minimum utile de D12/U5.
7. **Quand un accompagnement est-il réellement terminé, et les modifications doivent-elles rester possibles ?** Le statut CRM terminé et la date de livraison sont distincts et n’entraînent pas la même suite.
8. **La suppression des fichiers après un an correspond-elle à un engagement réel auprès de vos clients ?** Quels fichiers doivent rester conservés et quel préavis souhaitez-vous garantir ? Nécessaire pour corriger D4 sans inventer de politique.
9. **Quelles sont vos trois tâches les plus fréquentes sur téléphone et votre mode d’accès ?** Navigateur, icône d’écran d’accueil, agenda iPhone ; quelles photos envoyez-vous habituellement ? Nécessaire pour prioriser U3/U4 et vérifier D9 en pratique.

## 7. Vérifications effectuées et limites

### Lecture et vérification des chaînes

- Inventaire des routes, composants, services, modèles, scripts et tests ; lecture des instructions du dépôt et de `package.json`.
- Chaînes examinées : contact → validation → e-mail ; prospect → événements → conversion ; formulaires coaching → actions → services → Prisma ; invitation → jeton ; relecture → drapeaux/événements ; séances → agenda/temps ; commande → paiement → dossier ; documents → validation/stockage/téléchargement ; livraison → notifications/purge.
- Contrôle ciblé des gardes admin/client, propriété des dossiers et fichiers, cookies sécurisés en production (`lib/customer-session-cookie.ts:4`, `app/api/auth/login/route.ts:110`) et cache dynamique des espaces privés.
- Comparaison des formulaires et des champs effectivement écrits, et des appels utilisés par les différents agendas.
- Lecture de la documentation Next.js installée et du limiteur effectif des Server Actions. Le skill technique Next.js a servi de guide de lecture, pas de cahier des charges produit.

### Tests exécutés

Commande locale, sans chargement volontaire d’un fichier d’environnement :

```sh
node --import tsx --test \
  tests/coaching-time-balance.test.ts \
  tests/coaching-consumption.test.ts \
  tests/contact-request.test.ts \
  tests/session.test.ts \
  tests/ownership.test.ts \
  tests/stripe-webhook-commerce.test.ts
```

**Résultat : 54 tests, 54 réussites, 0 échec, 0 ignoré.** Le webhook utilise une base et des effets simulés ; ce résultat ne prouve pas un paiement réel, un envoi SMTP ni une transaction concurrente PostgreSQL.

### Reproductions ciblées sans connexion externe

Les modules TypeScript concernés ont été transpilés en mémoire avec TypeScript installé, puis exécutés dans un contexte isolé où Prisma, l’envoi, la navigation et le stockage étaient remplacés par des doubles contrôlés. Aucun vrai module Prisma/SMTP/Blob n’a été appelé par ces sondes.

| Sonde | Résultat réellement obtenu | Ce qui n’a pas été testé |
|---|---|---|
| P1 | 2 000 € du formulaire deviennent 2 000 centimes dans l’appel de service, soit 20 € à l’affichage | Persistance PostgreSQL réelle |
| P2 | Absence de champs niveau/objectifs → deux valeurs `null` transmises | Consultation d’une fiche client réelle |
| P3 | Route contact renvoie 200 ; e-mail capturé sans type, urgence, contexte | Validation réelle dans cette sonde, remplacée par une entrée validée ; SMTP remplacé |
| P4 | Deux lectures de la même version, puis deux succès et dernière valeur conservée | Ordonnancement exact d’une base réelle |
| P5 | Rendu RSC des trois motifs d’événements rejeté avec le message du framework | Navigation complète et authentifiée vers la page |
| P6 | Échec d’avertissement simulé puis suppressions fichier/référence appelées | Toute suppression réelle |
| P7 | Échec de confirmation, puis rejeu : une seule tentative d’e-mail | Fournisseur SMTP et livraison réelle |

P5 a utilisé `node --conditions=react-server`, React installé et `next/dist/compiled/react-server-dom-webpack/server.node`, en rendant les éléments `input onFocus` et `select onChange` présents dans la fiche. Il s’agit d’un test du motif de rendu, pas d’une affirmation de navigation sur le site déployé.

Les sondes et la sortie des tests ont été placées uniquement sous `/tmp` (`fabsystem-audit-probes.cjs`, `fabsystem-audit-tests.txt`). Elles sont temporaires ; les résultats et limites sont consignés ici. Aucun test n’a été ajouté à l’application.

### Pourquoi l’application complète n’a pas été lancée

Un environnement de test isolé, avec fixtures et intégrations neutralisées, n’a pas été établi dans cette session. Certaines **lectures de pages écrivent** : ouverture de la fiche coaching → `ensureDefaultScenario` (`app/dashboard/crm/projects/[projectId]/page.tsx:89`, `lib/services/coaching-van-dossier.ts:181`) ; ouverture des modèles de messages → création des modèles si la table est vide (`lib/services/prospect.ts:236`). Une simple navigation authentifiée n’aurait donc pas été garantie en lecture seule.

Le build configuré pour Vercel exécute aussi une migration (`vercel.json:4`). Aucun build, démarrage applicatif, migration, seed ou cron n’a été lancé. Les valeurs des secrets et les données clients n’ont pas été consultées. L’audit a privilégié les reproductions isolées pour respecter la consigne de non-modification.

### Limites précises

- Pas de parcours visuel exécuté sur iPhone/Android, navigateur Facebook, clavier virtuel, VoiceOver ou réseau interrompu. Pas de mesure des débordements, du contraste, du temps de chargement ou du nombre réel de manipulations.
- Pas de vérification de la correspondance entre ce commit et la production, des migrations appliquées, produits/prix actifs, secrets, cookies réellement servis, configuration Blob/Supabase/Redis, cron activé, délivrabilité e-mail, sauvegardes ou capacité de restauration.
- Pas d’analyse des statistiques de conversion, de la satisfaction, de la fréquence des erreurs ou du volume des clients. Aucun fichier client ou journal réel exploité.
- Pas de suite complète, lint global, compilation complète ou audit exhaustif de sécurité. Les deux fichiers de tests nommés coaching couvrent surtout les calculs ; ils ne couvrent pas à eux seuls les formulaires, la purge et les transitions CRM examinées.
- Pas de validation réglementaire, comptable ou technique des installations électriques. Les calculs purs testés ne remplacent pas la vérification de leurs entrées et de leur usage.
- Les efforts de réparation de données antérieures, de migration et d’accompagnement au changement ne sont pas inclus dans les fourchettes de correction du code.

## 8. Ordre d’action proposé

| Ordre | Action et constats concernés | Bénéfice attendu | Risque/effort et condition de sortie |
|---|---|---|---|
| 1 | Corriger les événements serveur D1, l’effacement D2 et les budgets D3 | Fiche accessible et données saisies préservées | Corrections locales, environ 1–2 j groupés ; fixtures avec invitation, circuit, révision et sauvegardes successives |
| 2 | Examiner et sécuriser la purge D4 | Empêcher une perte de livrables sans préavis garanti | 1–3 j ; commencer par connaître l’activation et les dossiers éligibles via une lecture autorisée, puis décider la règle ; tests échec SMTP/Blob et délai de préavis |
| 3 | Corriger invitation D5 et transmission contact D6 | Prospect correctement qualifié et accès compréhensible | 0,5–1 j groupés ; tests du message produit et de l’expiration réellement affichée |
| 4 | Fermer les pertes lors du travail partagé D7/D8 et traiter la reprise D13 | Éviter écrasements et relectures silencieusement périmées | 2–4 j groupés ; conflits entre deux acteurs, suppressions après relecture, récupération des saisies rejetées |
| 5 | Aligner uploads D9 et confirmation rejouable D10 | Pièces et entrée en accompagnement plus fiables | 1,5–4 j ; fichier proche de la limite et échec/reprise des effets après paiement dans un environnement isolé |
| 6 | Trancher les questions métier U1/U2/U5 et le multi-dossier D11 | Définir où regarder chaque matin et où ranger la suite de l’accompagnement | Pas de migration avant réponse ; commencer par les liens, libellés et lectures transversales nécessaires |
| 7 | Ajuster révisions D12, accessibilité D14 et tâches mobiles U3/U4 | Fin d’accompagnement traçable et gestes quotidiens plus simples | Effort selon l’option retenue ; séance de vérification sur téléphone avec client/projet fictif |

Les fourchettes ne s’additionnent pas mécaniquement : plusieurs corrections et vérifications se recouvrent. Si la purge n’est pas active, sa sécurisation reste nécessaire avant activation mais peut suivre les réparations immédiates du contact et de l’invitation.

Pour valider le résultat d’un futur lot, utiliser un environnement sans effets externes et un client fictif : contact ou saisie Facebook, conversion, invitation, préparation partagée, relecture, proposition, séance/report, compte rendu, document et fin. Vérifier séparément une offre achetée et son dossier, puisque ce sont aujourd’hui deux circuits différents.

**Aucune implémentation n’est engagée par cet audit. Le prochain lot reste à votre choix.**
