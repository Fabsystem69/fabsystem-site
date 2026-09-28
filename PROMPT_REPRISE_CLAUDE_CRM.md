# Prompt de reprise pour Claude — FabSystem

Tu reprends le dépôt `/Users/fabienlages/fabsystem-site`. Continue le travail local déjà commencé. Ne repars pas de zéro et n’écrase pas les changements non commités.

## Résultat demandé par Fabien

**Fusionner les deux systèmes de suivi existants en un seul système simple, utilisable sur téléphone et PC.** Fabien ne veut ni un troisième CRM, ni deux outils reliés par des liens, ni une simple page qui juxtapose deux dossiers.

La cible : prospection → entretien → offre convenue → paiement sur le site → accompagnement → clôture, avec un dossier par accompagnement, une vue coach et une vue client. Un client peut avoir plusieurs projets distincts dans ce même système. Les achats, factures et droits aux produits gardent leur responsabilité propre : unifier le coaching ne signifie pas fusionner toutes les tables de commerce.

Fabien vise 5–10 clients simultanés. « Niveau Salesforce » signifie ici un suivi fiable et complet, avec une utilisation simple, pas une reproduction de ses modules ni un changement de technologie.

## Commence par lire

1. `AGENTS.md` et les éventuelles instructions locales : protéger la production, changements incrémentaux, plan de données avant modification Prisma.
2. `git status --short` et `git diff` : préserver tout le travail existant.
3. `PLAN_EXECUTION_CRM_CLAUDE.md` : journal, fichiers changés, tests et limites.
4. `PLAN_AMELIORATION_CRM_FABSYSTEM.md` : décisions métier et cible.
5. `AUDIT_INDEPENDANT_FABSYSTEM.md` : constats et preuves de l’état audité, pas description garantie du code après corrections.
6. `FICHE_ENTRETIEN_ET_SUIVI_COACHING.md` : trame métier proposée.

Ces documents sont des points de reprise. Vérifie le code actuel ; ne traite pas les anciennes maquettes/prompts ou intentions non implémentées comme des fonctionnalités existantes. Lis les guides locaux Next.js pertinents avant toute modification Next.js.

## Activité réelle confirmée

- Fabien approche souvent les prospects en MP après une question ou un schéma incorrect sur Facebook/groupes.
- Premier entretien de 45–60 minutes : projet, avancement, niveau de bricolage, inquiétudes, présentation de l’offre ; bilan souvent fait ensemble.
- Pack principal à 199 €, réglé sur le site via Stripe. Le client effectue le gros du travail et cherche son matériel.
- Fabien accompagne de bout en bout et s’adapte ; aucun quota d’heures ou arrêt à 90 jours n’a été confirmé.
- Mise au propre du schéma selon le travail et l’accord avec le client : ni systématiquement incluse ni automatiquement facturée 99 €.
- Suivi surtout par WhatsApp et petites visios de 2–3 minutes pour rassurer et vérifier ; rendez-vous plus longs au besoin.
- Besoin majeur : fil conducteur d’entretien, prochaines actions, dossier commun qui s’enrichit progressivement.
- Tarifs et offre évolueront : conserver le prix et le périmètre réellement convenus pour chaque client.
- Notes internes privées ; documents et synthèses partagés selon une règle explicite. Ne pas exposer les notes internes en consolidant les historiques.

## Les deux systèmes à consolider

| Circuit existant | Modèles et points d’entrée | À reprendre dans le système commun |
|---|---|---|
| Prestations après achat | `DossierClient`, `DossierEvent`, `DossierDocument`, `DossierAppointment` ; `lib/services/dossier-client.ts` ; `/dashboard/accompagnements/*` ; `/mon-compte/mon-accompagnement` | Commande d’origine, offre, besoin initial, WhatsApp, étapes et compte rendu, livraison, fichiers, historique, rendez-vous et consentements |
| CRM et dossier technique partagé | `Prospect`, `CoachingProject` et modèles associés ; `lib/services/coaching-project.ts`, `coaching-van-dossier.ts` ; `/dashboard/crm/*` ; `/mon-compte/mon-van/*` | Prospection, projet, dossier véhicule, usages, bilan, matériel, circuits, révisions, actions, séances, documents et droits client |

`Customer` est déjà l’identité métier commune. `CoachingProject` est le point de départ envisagé pour le dossier principal : confirmer le plan de reprise champ par champ avant migration. Ne pas créer un nouveau modèle universel « CRM » pour contourner les deux existants.

Dépendances à suivre jusqu’au traitement réel :

- `lib/services/stripe-webhook-commerce.ts` appelle la création de `DossierClient` après paiement. Une consolidation qui oublie ce chemin recréera des doublons.
- `lib/services/dossier-notifications.ts` et son cron gèrent notifications et purge.
- `/api/calendar/accompagnements.ics` dépend des rendez-vous du premier circuit : préserver les UID existants ou documenter leur reprise pour éviter les doublons dans les calendriers.
- Routes de téléchargement sous `/api/dossiers/documents`, `/api/internal/dossiers/documents` et `/api/internal/coaching-projects/documents` : conserver autorisation et accès aux fichiers.
- `app/mon-compte/page.tsx` expose actuellement les deux parcours ; `components/dashboard/shell/nav-data.ts` expose les deux entrées administrateur.
- Vérifier aussi les appels, exports, impressions, liens d’e-mails et créations manuelles par recherche dans le dépôt.

## État exact du travail à reprendre

La première tranche locale corrige les budgets euros/centimes, la conservation des champs absents, les événements navigateur dans la page serveur, le lien d’invitation et son expiration, les détails perdus dans le message de contact, des labels et le menu mobile, ainsi que la limite de transport des uploads.

**La fusion n’est pas encore implémentée.** Aucun schéma modifié ni migration exécutée pour elle. Pas de déploiement ni action distante.

Dernières vérifications : 45 tests ciblés réussis au total ; lint ciblé réussi ; TypeScript global échoue sur 45 diagnostics dans des tests existants, identiques avec les versions HEAD des fichiers modifiés. Pas de recette navigateur ou téléphone réel. Ne pas déclarer le site prêt pour la production sur cette seule base.

## Défauts à traiter avant la bascule

1. **Suppression hors du projet autorisé — repéré au dernier examen, pas encore corrigé.** Dans `app/mon-compte/mon-van/actions.ts`, `deleteDeviceAction` et `deleteMaterialAction` vérifient la propriété du `projectId` fourni, puis transmettent seulement `deviceId`/`materialId`. Les services suppriment par cet ID seul. Un formulaire falsifié peut donc viser une ressource d’un autre projet. Passer le projet autorisé au service et contraindre la mutation par ressource ET projet ; conserver l’authentification, tester avec deux clients et deux projets. Étendre la recherche aux autres mutations et lectures par ID. Constat par lecture, pas exploitation sur données réelles.
2. **Écrasements concurrents.** `coaching-van-dossier.ts` vérifie les versions avant la transaction, puis écrit par ID seul : rendre la condition ID+version atomique. Couvrir aussi `updateCoachingProject` qui modifie objectifs/niveau en dehors du marqueur véhicule. Le refus de conflit doit permettre de récupérer la saisie.
3. **Suppressions non journalisées.** Appareils/usages/matériel peuvent disparaître sans actualiser l’historique et le besoin de relecture. Suppression, événement et marqueur doivent former une opération cohérente.
4. **Purge dangereuse.** Un avertissement échoué n’empêche pas actuellement la purge ; une suppression physique échouée peut perdre sa référence DB. Corriger avant toute reprise automatique, avec preuve durable de l’avertissement et délai effectif. Ne jamais exécuter la purge réelle comme test.
5. **Confirmation après achat.** L’existence du dossier interrompt le rejeu même si l’e-mail initial a échoué. Réutiliser une mécanique durable/rejouable adaptée au dépôt, sans créer un second moteur de paiement.

## Ordre d’exécution

Travaille en lots cohérents, chacun terminé et vérifié avant le suivant. Actualise le journal pour qu’une interruption ne laisse pas un état incompréhensible.

1. Sécuriser les mutations et les risques de perte listés ci-dessus ; tests isolés. Finir la recette des premières corrections.
2. Écrire le plan de consolidation dans les documents techniques existants (`docs/03-DATABASE.md`, `docs/02-ARCHITECTURE.md`, décisions et sources de vérité concernées), AVANT le schéma : correspondances champs/états, visibilité privée/partagée, événements, commandes, fichiers, rendez-vous, traitement des conflits et retour arrière.
3. Préparer une reprise idempotente, avec simulation à blanc, correspondances explicites, comptages et cas ambigus signalés. Ne pas fusionner deux accompagnements sur le seul nom/e-mail. Ne pas écraser des valeurs divergentes ni déplacer des fichiers seulement pour changer leur écran. Une prestation distincte reste un dossier distinct dans le même système.
4. Basculer les créations et mises à jour vers un seul parcours métier : achat confirmé, création manuelle, conversion prospect, modification coach et modification client. Pas de double écriture permanente.
5. Réunir les écrans coach/client ; préserver toutes les fonctions utiles des deux circuits. Retirer les entrées et traitements doublons APRÈS la bascule vérifiée ; rediriger les anciennes URLs avec contrôle d’accès. La coexistence est temporaire, avec critères de sortie précis. La suppression physique des anciennes tables est une étape séparée et documentée.
6. Ajouter dans ce système commun la fiche d’entretien, la note rapide WhatsApp/visio, les prochaines actions et une vue quotidienne adaptée à 5–10 clients. Réutiliser les modèles/composants existants ; ne pas enrichir durablement deux systèmes concurrents.
7. Compléter clôture/réouverture, historique de l’accord commercial, bilan de l’accompagnement et recette du parcours complet.

## Téléphone et PC : exigences de validation

- Vérifier 360/390/768/1440 px, puis distinguer clairement simulation de viewport et test sur appareil réel.
- Pas de défilement horizontal de page ; contrôles principaux de 44 px ; saisie lisible à 16 px sur téléphone.
- Clavier, labels, focus visible et correctement restitué, fermeture des dialogues, zoom et erreurs compréhensibles.
- Retrouver le client, noter un échange court, joindre une photo, consulter la dernière version partagée et enregistrer une prochaine action sans naviguer entre deux outils.
- Préserver la saisie en cas d’erreur/conflit et afficher un résultat de sauvegarde fiable ; ne pas promettre un fonctionnement hors ligne sans l’implémenter.
- Deux clients fictifs : aucune lecture/modification/suppression croisée ni exposition de note privée.
- Paiement rejoué : un seul accompagnement concerné ; aucune double notification ni duplication des droits.
- Historique/fichiers/rendez-vous retrouvables après reprise ; ancienne URL autorisée vers le bon dossier ; plusieurs projets accessibles.

## Autorisation et garde-fous

Tu peux poursuivre les modifications locales nécessaires et les tests isolés. Pas de déploiement, push, paiement, message réel, migration distante, purge ou modification de données de production. Ne charge pas une base réelle pour une recette supposée en lecture seule : certaines pages créent des données au chargement.

Ne demande pas à Fabien de redéfinir la solution. Les décisions ci-dessus sont confirmées. Pose seulement les questions métier devenues bloquantes après examen et continue les tâches indépendantes. Préfère une correction simple et l’existant ; n’installe pas une nouvelle plateforme CRM.

À chaque fin de lot : fichiers modifiés, résultat concret, tests exécutés et leurs limites, statut de la consolidation, prochaine tâche précise. Ne présente pas un regroupement visuel comme une fusion achevée, ni une migration préparée comme appliquée. En cas de limite de contexte, termine le petit lot commencé et actualise le journal avant de passer la main.
