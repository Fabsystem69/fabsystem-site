# Notes manuscrites et fiche de decouverte (CRM coaching)

Domaine : accompagnement `REQUEST_ONLY`. Aucun lien avec le panier, les
commandes, Stripe ni le flux ebook legacy.

## Decision de donnees

**Aucune modification de `prisma/schema.prisma` pour ce lot.** Les modeles
existants couvrent le besoin ; on les reutilise tels quels.

| Besoin | Stockage existant |
| --- | --- |
| Compte rendu d'un echange | `CoachingSession` (`REALISEE`, `sharedWithClient = false`), champs `sujetsAbordes` (resume + decisions) et `prochaineEtape` (points a reprendre) |
| Actions (Fabien / client, echeance) | `CoachingActionItem` (`responsible` COACH/CLIENT, `dueDate`) |
| Trace d'origine, informations ajoutees, incertitudes | `CoachingProjectEvent` type `NOTES_IMPORT` (texte interne, jamais expose au client) |
| Notes sur un prospect | `ProspectEvent` type `NOTE` + `Prospect.nextAction` / `nextActionAt` |
| Fiche de decouverte (client ou coach) | Champs existants de `CoachingProject` (vehicule, usages, implantation, entretien), `CoachingDevice` / `CoachingDeviceUsage` pour les appareils, `CoachingProjectDocument` pour les pieces jointes privees |

Si un besoin futur exige une colonne (par exemple un marqueur d'envoi de
notification), il fera l'objet d'un plan de donnees valide avant toute
migration.

## Regles du parcours « Notes en vrac / compte rendu »

1. Le dossier destinataire est **toujours choisi par Fabien**. L'IA ne
   propose que des avertissements (nom cite different du dossier choisi).
2. L'IA propose, Fabien relit, corrige, decoche, puis valide en **une seule
   transaction** : seance, actions et trace d'origine sont enregistrees
   ensemble ou pas du tout.
3. **Idempotence** : chaque proposition porte un `submissionKey` (UUID). Il
   est porte par le **type** de l'evenement (`NOTES_IMPORT:<cle>` cote projet,
   `NOTE:<cle>` cote prospect, comparaison exacte : reformuler le texte de la
   note ne peut pas casser la detection ; la marque `ref:<cle>` reste dans la
   note comme simple trace lisible) ; un verrou `pg_advisory_xact_lock`
   serialise les requetes simultanees ; rejouer la meme cle ne cree rien.
4. **Rien n'est ecrase** : les champs existants du dossier ne sont pas
   modifies par les notes. Les informations nouvelles sont historisees dans la
   trace. Pour un prospect, l'ancienne « prochaine action » remplacee est
   mentionnee dans la note.
5. **Engagements vs suggestions** : chaque action est marquee `NOTES` (ecrite
   par Fabien) ou `SUGGESTION` (idee de l'IA, decochee par defaut, signalee
   « suggestion » dans la trace).
6. **Dates** : dates relatives resolues a partir de la date de l'echange
   (modifiable) ; la date obtenue est affichee a la relecture. Les dates sont
   stockees a midi UTC pour rester le bon jour calendaire a Paris quel que
   soit le fuseau du serveur.
7. **Temps d'accompagnement** : la duree saisie de la seance est comptee dans
   le solde de temps du projet (`REALISEE`). Elle est donc demandee
   explicitement (5 min par defaut).
8. **Aucun message** n'est envoye au client par cette fonctionnalite.

## Photos

Les photos de notes sont envoyees a l'API Anthropic pour lecture, **puis
abandonnees : elles ne sont pas conservees** (ni stockage, ni base). La trace
indique seulement leur nombre. Si une conservation devient necessaire, elle
devra utiliser un stockage prive (Supabase Storage, URLs signees courtes) avec
une duree de conservation explicite, definie avant l'implementation.

Les notes (texte et images) transitent par un fournisseur d'IA tiers : a
mentionner dans la politique de confidentialite.

## Fiche de decouverte commune

Une seule trame, deux formes, memes champs metier. La source unique des
sections, libelles, options et cles stables est `lib/crm/discovery-sheet-spec.ts`
(version `DISCOVERY_SHEET_VERSION`) ; les options partagees avec le formulaire
client vivent dans `lib/coaching-form-options.ts`.

- **Papier** : page imprimable `/dashboard/crm/fiche-decouverte`. La photo
  d'une fiche remplie passe par le meme parcours de relecture/validation
  (mode « fiche manuscrite »).
- **Compte client** : formulaire « Mon van » (`/mon-compte/mon-van/[id]`),
  qui alimente les memes champs de `CoachingProject`.

Origine identifiable : chaque modification de section est journalisee dans
`CoachingProjectEvent` avec `authorName` (`Client` ou `FabSystem`).

### Ecarts resolus

1. **« Depannage »** : ajoute aux choix de `projectStage` (champ texte libre,
   aucune migration). Les 6 choix sont identiques sur le papier et dans le
   formulaire client : Idee, Vehicule achete, Amenagement en cours,
   Installation partielle, Installation existante a modifier, Depannage
   (+ « Je ne sais pas encore » = champ vide, jamais une valeur inventee).
2. **« Present / absent / je ne sais pas »** (installation existante : batterie,
   panneaux solaires, recharge en roulant, branchement secteur, convertisseur) :
   aucun champ existant ne sait representer l'absence ou l'inconnu (un
   `CoachingDevice` ne dit que ce qui EXISTE). **Migration additive proposee** :

   - `CoachingProject.existingInstallation Json?` (nullable, sans defaut).
   - Forme versionnee :
     `{ "version": 1, "items": { "battery": { "status": "PRESENT"|"ABSENT"|"UNKNOWN", "detail": string|null }, "solar": ..., "driving_charge": ..., "shore_power": ..., "inverter": ... } }`.
     Une cle absente = non renseigne (different de `UNKNOWN` = « je ne sais pas »).
   - Meme section et meme jeton de concurrence que l'implantation
     (`implantationUpdatedAt`) : pas de nouveau mecanisme.
   - Non interrogee par requete SQL : un champ JSON suffit, pas de table.
   - **Deploiement** : `vercel.json` execute `prisma migrate deploy` au build.
     Ajouter une colonne nullable est sans risque pour l'ancien code (qui
     l'ignore) ; l'ordre migration -> code est donc sans danger.
   - **Retour arriere** : l'ancien code continue de fonctionner colonne
     presente ; supprimer la colonne ne perd que les reponses de cette
     nouvelle question.
   - La migration est creee et appliquee uniquement sur la base locale
     `fabsystem_dev` pour ce lot ; rien n'est deploye.

### Partie reservee au coach (strictement privee)

`notesInternes`, `questionsEnAttente`, `actionsAPreparer`, les actions CRM et
la trace `NOTES_IMPORT` / `FICHE_IMPORT` ne sont jamais lus par les pages
`/mon-compte`. Le resume transmis par e-mail au coach ne contient que des
reponses du client.

## Transmission du projet par le client

Parcours : le client remplit sa fiche (brouillon permanent par section) ->
**apercu en lecture seule** -> bouton « Transmettre mon projet a Fabien » ->
confirmation de reception visible dans le compte.

**Aucune migration** : la transmission est un enregistrement durable
d'abord, la notification ensuite.

1. Dans UNE transaction : `readyForReviewAt` + evenement
   `REVIEW_SUBMITTED:<readyForReviewAt ISO>` (l'enregistrement durable et la
   reference d'idempotence). Retransmettre alors qu'une transmission est deja
   en attente de relecture ne cree rien de nouveau (pas de doublon).
2. Apres la transaction, envoi du mail au coach (resume + lien vers le
   dossier protege du dashboard). Un echec est journalise et n'annule rien.
3. Succes -> evenement `REVIEW_NOTIFIED:<meme horodatage>` (marqueur d'envoi).
4. **Retentable** : un projet dont le dernier `REVIEW_SUBMITTED` n'a pas de
   `REVIEW_NOTIFIED` correspondant est « a renvoyer ». Trois portes : relance
   automatique au moment d'une nouvelle visite de l'apercu, liste du CRM avec
   bouton « Renvoyer la notification », et tache planifiee interne.
5. Verrou transactionnel par transmission pour eviter deux envois
   simultanes. Garantie « au moins une fois » : un crash exactement entre
   l'envoi et l'ecriture du marqueur peut produire un second mail, jamais une
   perte.

Une creation ou une transmission de projet n'est ni une commande, ni un
paiement, ni une reservation confirmee : elle reste dans le parcours
`REQUEST_ONLY`.

## Extraction de la fiche manuscrite

- Cible : un projet coaching choisi par Fabien (jamais deduit par l'IA).
- L'IA lit les cases/champs selon les cles stables de la fiche et renvoie, par
  cle, une valeur et un etat `lu | illisible | vide`.
- La proposition n'affiche en « modification » que les champs lus ET
  differents de l'existant. Un champ vide ou illisible ne propose **jamais**
  d'effacer une valeur enregistree.
- Validation en une transaction, idempotente (`FICHE_IMPORT:<cle>`), qui
  n'ecrit que les champs coches ; section coach = ajout horodate a
  `notesInternes`, jamais un remplacement.

## Versionnement de ce document

`docs/` est exclu par `.gitignore` (`/docs/`) mais les documents 00 a 16 sont
suivis car ajoutes de force. Ce document suit la meme convention : il est
ajoute avec `git add -f docs/17-NOTES-MANUSCRITES-ET-FICHE-DECOUVERTE.md`,
sans modifier la regle d'exclusion et sans rendre visibles les autres
documents locaux.

## Etat de verification (2026-10-04)

Verifie dans un navigateur (mobile 390 px) sur une base LOCALE de test, avec
un client de test, un recepteur SMTP local et de vrais appels IA sur du
contenu fictif :

- Parcours client : saisie (dont « Depannage » et installation existante
  tri-etat), apercu, transmission (double clic = une seule transmission),
  confirmation de reception.
- Notification : echec SMTP -> projet conserve, bloc « Notifications a
  renvoyer » dans le CRM ; relance -> un seul mail, lien du dashboard, aucun
  champ coach ; revisite -> aucun doublon.
- Aucune note coach visible dans les pages `/mon-compte`.
- Compte rendu d'un echange : analyse IA, relecture, validation, une seule
  seance malgre le double clic, non partagee au client.
- Import de fiche : contradictions non appliquees par defaut, champs nouveaux
  ecrits, ecriture illisible ignoree, observations coach ajoutees sans
  remplacement.
- Impression A4 (emulation Chromium) : 9 pages, en-tete sur chacune, aucune
  section coupee, aucune page vide.

Defauts trouves uniquement grace a ces essais reels (invisibles avec une
fausse base ou un faux client IA) et corriges :

1. `pg_advisory_xact_lock` via `$queryRaw` echoue sur Postgres reel (colonne
   `void`) -> `lib/server/advisory-lock.ts` (`$executeRaw`).
2. `tool_choice: tool` refuse par le modele -> `tool_choice: auto` + consigne
   d'appel d'outil dans le prompt.

**Non verifie** : lecture d'une vraie ecriture manuscrite (l'image de test
utilise une police « manuscrite »), impression sur une vraie imprimante, envoi
via le vrai SMTP, tache planifiee Vercel (quotidienne : `30 9 * * *`).
