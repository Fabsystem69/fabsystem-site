# FabSystem Database Evolution

## Statut du document

- Date de reference: 2026-08-05
- Ce document ne modifie pas `prisma/schema.prisma`
- Ce document ne cree aucune migration

## Schema actuel observe

Le schema Prisma actuel contient:

- `Customer`
- `Quote`
- `QuoteItem`
- `Invoice`
- `InvoiceItem`
- `Remise`
- `ItemTemplate`
- `DocumentSequence`
- `EbookOrder`

Il sait deja bien gerer:

- les clients
- les devis
- les factures
- les remises
- la numerotation documentaire
- un achat ebook mono-produit

## Limites actuelles

Le schema actuel ne couvre pas proprement:

- un catalogue multi-produits
- un panier
- une commande generique
- un paiement multi-lignes
- des snapshots de commande
- des droits de telechargement revoquables
- des traitements Stripe durables et rejouables

## Principes d'evolution

1. Ne pas casser les tables existantes.
2. Ajouter de nouvelles tables commerce sans deformer `EbookOrder`.
3. Garder `Customer` comme identite commerciale.
4. Introduire `User` comme identite de connexion.
5. Conserver `Quote` et `Invoice` comme domaine documentaire distinct.
6. Snapshotter les donnees critiques au moment de la commande.

## Workflow Prisma local recommande

Pour les migrations de developpement:

- utiliser une base dediee comme `fabsystem_dev`
- utiliser une shadow database dediee comme `fabsystem_shadow`
- ne jamais utiliser `template1`
- ne jamais utiliser une base de production pour `prisma migrate dev`

Configuration cible recommandee:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_dev`
- `DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_dev`
- `SHADOW_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_shadow`

Point d'attention:

- le datasource Prisma actuel declare `url` et `directUrl`
- le datasource Prisma declare maintenant aussi `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")`
- `prisma migrate dev` doit utiliser `DATABASE_URL` ou `DIRECT_URL` vers `fabsystem_dev`
- `SHADOW_DATABASE_URL` doit pointer vers `fabsystem_shadow`
- la production doit utiliser `prisma migrate deploy`, pas `prisma migrate dev`

## Seed de developpement

Le projet peut embarquer un seed local idempotent pour le catalogue numerique MVP.

Regles:

- seed reserve au developpement local
- aucune vraie donnee de production
- utiliser `prisma db seed` sur `fabsystem_dev` uniquement
- ne jamais l'executer contre une base de production
- le premier ebook de dev peut utiliser un `DigitalAsset` fictif Supabase avec `sizeBytes = 0` tant que la taille reelle n'est pas connue

## Decision identite

Le MVP retient la regle suivante:

- `User` represente l'identite de connexion
- `Customer` represente l'identite commerciale
- un `Customer` peut etre relie a zero ou un `User`
- une `Order` appartient toujours a un `Customer`
- un achat invite peut creer un `Customer` sans compte
- un compte cree plus tard peut rattacher des commandes existantes via une procedure verifiee

Le MVP ne cree pas de `CustomerProfile`.

## Modeles cibles du MVP

## 1. Identite

### `User`

Raison d'exister:

- porter la connexion client future
- separer l'auth de la fiche commerciale

Champs recommandes:

- `id`
- `email`
- `passwordHash` nullable si le mode de connexion final n'est pas encore fixe
- `role`
- `status`
- `emailVerifiedAt` nullable
- `lastLoginAt` nullable
- `createdAt`
- `updatedAt`

Contraintes:

- `email` unique
- `role` simple pour le MVP:
  - `ADMIN`
  - `CUSTOMER`

Note:

Un modele multi-role plus complexe pourra arriver plus tard si necessaire. Il n'est pas requis pour ce MVP.

### `Customer`

Le modele existe deja et reste la verite commerciale.

Evolution documentaire cible:

- ajouter un lien nullable `userId`
- conserver l'historique existant de devis et factures
- reutiliser `Customer` pour les commandes commerce

Contraintes cibles:

- `userId` nullable et unique si present
- email indexe

## 2. Catalogue

Le noyau catalogue doit rester petit.

### `Product`

Champs cibles:

- `id`
- `slug`
- `name`
- `shortDescription`
- `description`
- `status`
- `purchaseMode`
- `productType`
- `featuredImage`
- `createdAt`
- `updatedAt`

Enums cibles:

- `productType`
  - `EBOOK`
  - `DIGITAL_DOWNLOAD`
  - `BUNDLE`
- `purchaseMode`
  - `BUY_NOW`
  - `REQUEST_ONLY`
- `status`
  - `DRAFT`
  - `ACTIVE`
  - `ARCHIVED`

Contraintes:

- `slug` unique
- `BUY_NOW` reserve au commerce MVP
- `REQUEST_ONLY` documente pour le futur, sans passer par le panier

### `ProductPrice`

Raison d'exister:

- definir le prix courant sans ecraser l'historique
- permettre un remplacement futur

Champs cibles:

- `id`
- `productId`
- `currency`
- `unitAmount`
- `compareAtAmount` nullable
- `isActive`
- `startsAt` nullable
- `endsAt` nullable
- `createdAt`
- `updatedAt`

Contraintes:

- index sur `productId`
- index sur `isActive`
- montants en centimes entiers
- une regle metier doit garantir un seul prix actif par produit et devise

### `DigitalAsset`

Raison d'exister:

- representer les fichiers telechargeables

Champs cibles:

- `id`
- `storageKey`
- `fileName`
- `mimeType`
- `sizeBytes`
- `checksum` nullable
- `isActive`
- `createdAt`
- `updatedAt`

Regles:

- aucun asset prive dans `/public`
- `storageKey` pointe vers un stockage prive

### `ProductAsset`

Join table minimale.

Raison d'exister:

- un produit simple peut donner acces a un ou plusieurs assets

Champs cibles:

- `id`
- `productId`
- `digitalAssetId`
- `sortOrder`

Contraintes:

- unicite sur `(productId, digitalAssetId)`

### `BundleItem`

Join table minimale pour les packs.

Raison d'exister:

- un bundle peut donner acces a plusieurs produits ou directement a plusieurs assets

Champs cibles:

- `id`
- `bundleProductId`
- `childProductId` nullable
- `digitalAssetId` nullable
- `sortOrder`

Regle critique:

- exactement un des deux champs `childProductId` ou `digitalAssetId` doit etre renseigne

Note:

Cette table reste acceptable dans le MVP car elle sert un besoin reel de pack numerique sans introduire un modele universel de composition.

## 3. Panier

### `Cart`

Raison d'exister:

- stocker l'etat temporaire avant achat

Champs cibles:

- `id`
- `userId` nullable
- `anonymousToken` nullable
- `currency`
- `status`
- `createdAt`
- `updatedAt`
- `expiresAt` nullable

Enums cibles:

- `ACTIVE`
- `CHECKOUT_LOCKED`
- `CONVERTED`
- `ABANDONED`

Contraintes:

- `anonymousToken` unique si present
- index sur `userId`

### `CartItem`

Raison d'exister:

- stocker les intentions d'achat, pas la verite prix finale

Champs cibles:

- `id`
- `cartId`
- `productId`
- `quantity`
- `createdAt`
- `updatedAt`

Regles:

- quantite par defaut `1`
- quantite > `1` interdite pour les ebooks tant qu'aucune regle contraire n'est definie
- le prix n'est jamais considere fiable depuis le panier client

## 4. Commandes

### `Order`

Raison d'exister:

- devenir la source de verite d'un achat finalise

Champs cibles:

- `id`
- `number`
- `customerId`
- `status`
- `currency`
- `subtotalAmount`
- `discountAmount`
- `totalAmount`
- `customerEmailSnapshot`
- `customerNameSnapshot`
- `billingAddressSnapshot` nullable
- `source`
- `paidAt` nullable
- `cancelledAt` nullable
- `createdAt`
- `updatedAt`

Enums cibles:

- `source`
  - `SHOP_MVP`
  - `LEGACY_EBOOK`
- `status`
  - `DRAFT`
  - `PENDING_PAYMENT`
  - `PAID`
  - `CANCELLED`
  - `REFUNDED`

Contraintes:

- `number` unique
- index sur `customerId`
- index sur `status`

### `OrderItem`

Raison d'exister:

- stocker le snapshot immuable des lignes

Champs cibles:

- `id`
- `orderId`
- `productId` nullable
- `productSlugSnapshot`
- `productNameSnapshot`
- `productTypeSnapshot`
- `purchaseModeSnapshot`
- `unitAmount`
- `compareAtAmount` nullable
- `quantity`
- `lineTotalAmount`
- `assetSnapshotJson`
- `createdAt`

Regles:

- `OrderItem` ne depend pas du catalogue courant pour etre interpretable
- le produit courant peut rester relie pour le confort admin, mais la verite historique est dans les snapshots

## 5. Paiements

### `Payment`

Raison d'exister:

- representer localement l'etat du paiement Stripe

Champs cibles:

- `id`
- `orderId`
- `provider`
- `status`
- `currency`
- `amount`
- `stripeCheckoutSessionId` nullable
- `stripePaymentIntentId` nullable
- `lastStripeEventId` nullable
- `lastStripeEventType` nullable
- `paidAt` nullable
- `createdAt`
- `updatedAt`

Enums cibles:

- `provider`
  - `STRIPE`
- `status`
  - `PENDING`
  - `SUCCEEDED`
  - `FAILED`
  - `REFUNDED`
  - `PARTIALLY_REFUNDED`

Contraintes:

- index sur `orderId`
- unicite sur `stripeCheckoutSessionId` si present
- unicite sur `stripePaymentIntentId` si present

## 6. Livraison numerique

### `DownloadGrant`

Raison d'exister:

- representer le droit effectif de telecharger un asset

Champs cibles:

- `id`
- `orderId`
- `orderItemId`
- `customerId`
- `digitalAssetId`
- `status`
- `downloadCount`
- `maxDownloads` nullable
- `expiresAt` nullable
- `revokedAt` nullable
- `lastDownloadedAt` nullable
- `createdAt`
- `updatedAt`

Statuts cibles:

- `PENDING`
- `PROCESSING`
- `FULFILLED`
- `FAILED`
- `REVOKED`

Contraintes:

- index sur `customerId`
- index sur `orderId`
- unicite recommandee sur `(orderItemId, digitalAssetId)`

## 7. Stripe et jobs durables

### `StripeEvent`

Raison d'exister:

- journaliser chaque evenement webhooks critique
- garantir l'idempotence

Champs cibles:

- `id`
- `stripeEventId`
- `type`
- `livemode`
- `status`
- `payloadJson`
- `receivedAt`
- `processedAt` nullable
- `attemptCount`
- `lastError` nullable

Statuts cibles:

- `RECEIVED`
- `PROCESSED`
- `FAILED`

Contraintes:

- `stripeEventId` unique

### `BackgroundJob`

Raison d'exister:

- sortir les effets de bord critiques du temps de reponse webhook
- rejouer les echecs

Champs cibles:

- `id`
- `type`
- `status`
- `payloadJson`
- `attemptCount`
- `availableAt`
- `lockedAt` nullable
- `lastError` nullable
- `createdAt`
- `updatedAt`

Statuts cibles:

- `PENDING`
- `RUNNING`
- `SUCCEEDED`
- `FAILED`

Exemples de jobs:

- `FULFILL_DIGITAL_ORDER`
- `SEND_ORDER_EMAIL`
- `RETRY_DOWNLOAD_DELIVERY`

## Articulation avec les documents existants

Le domaine commerce n'efface pas le domaine documents.

Regles figees:

- `Quote` reste une proposition commerciale
- `Invoice` reste un document comptable
- `Order` reste la verite d'achat
- une `Order` peut conduire a une `Invoice`
- une `Invoice` ne doit jamais recalculer ses lignes depuis `Product` ou `ProductPrice`

## Index et contraintes prioritaires

Pour le MVP, les contraintes suivantes sont considerees structurantes:

1. `User.email` unique
2. `Customer.userId` unique si present
3. `Product.slug` unique
4. `Order.number` unique
5. `Payment.stripeCheckoutSessionId` unique si present
6. `Payment.stripePaymentIntentId` unique si present
7. `StripeEvent.stripeEventId` unique
8. `ProductAsset(productId, digitalAssetId)` unique
9. `DownloadGrant(orderItemId, digitalAssetId)` unique

## Ce qui est volontairement reporte

Le MVP ne modele pas encore:

- `Inventory`
- `Shipment`
- `ShippingRate`
- `Subscription`
- `CourseEnrollment`
- `BookingSlot`
- `ServiceBooking`

Ils seront traites plus tard, par domaine, quand ils deviendront des besoins reels.

## Correctif ponctuel (27 septembre 2026) : preuve durable de l'avertissement de purge

Contexte : `lib/services/dossier-notifications.ts` purge les documents d'un
`DossierClient` livre depuis ~12 mois, avec un avertissement cense partir un
mois avant. Constat d'audit repris dans `PROMPT_REPRISE_CLAUDE_CRM.md` :

- La purge effective (etape 4b) ne verifie que `dateLivraison`, jamais si
  l'avertissement a reellement ete envoye avec succes. Le seul garde-fou
  cote avertissement etait un cooldown (`tryAcquireCooldown`) consomme
  *avant* la tentative d'envoi : un envoi qui echoue laisse quand meme le
  cooldown pose pour ~12 mois, sans aucune preuve durable en base et sans
  jamais bloquer la purge (qui ne consulte pas ce cooldown de toute facon).
- Une suppression physique de fichier qui echoue n'empechait pas la
  suppression du `DossierDocument` correspondant : le fichier restait
  orphelin sur le stockage, sans plus aucune reference en base pour le
  retrouver ou reessayer.

Decision : ajouter un champ additif nullable `purgeWarningSentAt DateTime?`
sur `DossierClient`, ecrit uniquement apres un envoi reussi (jamais avant
tentative). La purge effective exige desormais `purgeWarningSentAt` non nul
et vieux d'au moins le delai annonce, en plus du critere existant sur
`dateLivraison`. Un document dont la suppression physique echoue n'est plus
retire de la base : seuls les documents reellement supprimes du stockage
sortent de `DossierDocument`, et le dossier n'est compte comme purge que
si tous ses documents ont ete traites avec succes.

Migration : additive uniquement (`ADD COLUMN` nullable, pas de
`NOT NULL`/`DEFAULT` retroactif, aucune donnee existante modifiee) —
voir `prisma/migrations/20260927160000_add_dossier_purge_warning_marker/`.
Retour arriere : supprimer la colonne ne perd que la preuve d'avertissement
la plus recente, jamais les documents ni le dossier.

## Correctif ponctuel (27 septembre 2026) : preuve durable de l'e-mail de confirmation post-achat

Meme famille de defaut que le correctif de purge ci-dessus. Constat d'audit :
`createDossierClientForOrder` (`lib/services/dossier-client.ts`, appele par
le webhook Stripe a chaque `checkout.session.completed`, y compris en
redelivery) verifiait `existing` (le `DossierClient` deja cree pour cette
commande, idempotent par `orderId` unique) et retournait immediatement des
que ce dossier existait deja — AVANT meme d'essayer d'envoyer l'e-mail de
confirmation. Si l'envoi initial avait echoue (le `catch` ne faisait que
logger, sans jamais faire echouer la creation du dossier), aucune
redelivery Stripe ulterieure ne pouvait plus jamais reessayer cet envoi :
le dossier existant coupait court avant d'atteindre le code d'envoi.

Decision : ajouter un champ additif nullable `confirmationEmailSentAt
DateTime?` sur `DossierClient`, ecrit uniquement apres un envoi reussi.
Quand le dossier existe deja mais que ce champ est encore nul, le service
retente l'envoi au lieu de s'arreter au seul test d'existence — en
reutilisant la redelivery Stripe deja en place comme mecanique de rejeu
(aucun second moteur de paiement, aucune file d'attente ajoutee).

Migration : additive uniquement, meme forme que le champ precedent — voir
`prisma/migrations/20260927163000_add_dossier_confirmation_email_marker/`.
Retour arriere : supprimer la colonne ne perd que la preuve d'envoi la plus
recente, jamais la commande, le paiement ni le dossier.

## Plan de consolidation CRM (27 septembre 2026)

**Statut : plan de donnees uniquement. Aucun champ ajoute, aucune migration
ecrite, aucun ecran modifie par ce plan a la date ci-dessus. C'est le
document a valider/ajuster AVANT toute modification de `schema.prisma` pour
la fusion — voir `PROMPT_REPRISE_CLAUDE_CRM.md`, `PLAN_AMELIORATION_CRM_FABSYSTEM.md`
(cible produit, deja confirmee par Fabien), `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md`,
`NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md` et `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md`.**

Contexte : trois systemes distincts existent aujourd'hui pour un meme
accompagnement, sans lien entre eux au niveau donnees :

1. `DossierClient` + `DossierEvent`/`DossierDocument`/`DossierAppointment` —
   cree automatiquement par le webhook Stripe apres achat d'une offre
   `accompagnement-*`, etapes figees par offre, `orderId` unique.
2. `CoachingProject` + son groupe de modeles (`CoachingSession`,
   `CoachingActionItem`, `CoachingProposal`, `CoachingScenario`,
   `CoachingDevice(Usage)`, `CoachingMaterial`, `CoachingCircuit`,
   `CoachingSchemaRevision`, `CoachingProjectDocument`, `CoachingProjectEvent`) —
   cree depuis le CRM (`/dashboard/crm`), issu d'un `Prospect` ou cree
   directement pour un `Customer` existant, sans lien avec une commande.
3. `Project` + `ProjectSchema`/`ProjectSchemaVersion` (+ `ProjectRetainedValue`,
   `ProjectValueDependency`, `ProjectFollowUpReview/Event`) — l'editeur de
   schema electrique reel (canevas nœuds/cables), attribuable a un client
   par l'admin (`createProjectForCustomerByAdmin`) ou cree par le client,
   totalement independant des deux systemes ci-dessus (confirme par lecture,
   `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md`).

### 1. Modele pivot

**Decision (deja actee dans `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §3, confirmee ici) :
`CoachingProject` reste le dossier d'accompagnement unique.** Raison : c'est
deja le modele le plus riche (entretien, materiel, circuits, evenements,
seances, propositions), il autorise deja plusieurs projets par client sans
etape figee, et son propietaire (`Customer`) est la meme ancre d'identite
que `DossierClient`. `Project`/`ProjectSchema` n'est **pas** absorbe dans
`CoachingProject` : il reste l'editeur technique, relie par une reference
explicite (§4). Aucun troisieme modele « dossier universel » n'est cree.

`DossierClient` et ses trois tables satellites (`DossierEvent`,
`DossierDocument`, `DossierAppointment`) sont **repris** dans
`CoachingProject` et son groupe de modeles existant, puis conserves
temporairement en lecture seule pendant la coexistence (etape 5 de l'ordre
d'execution), avant suppression physique dans une migration separee et
documentee — jamais dans ce lot.

### 2. Table de correspondance des champs

| Champ/notion `DossierClient` | Devenir dans `CoachingProject` | Regle de reprise |
|---|---|---|
| `orderId` (unique, nullable) | Nouveau champ additif `CoachingProject.orderId String? @unique` | Copie telle quelle. Un `CoachingProject` issu du CRM (sans achat) garde `orderId = null`. Jamais invente. |
| `offre` (`DossierOffre`: DECOUVERTE/CONSEIL/GUIDE/CONCEPTION) | Nouveau champ additif `CoachingProject.offre DossierOffre?` | Copie telle quelle ; `null` pour un dossier CRM sans offre figee. Ne remplace pas `CoachingProposal` (accord negocie manuellement) — les deux peuvent coexister (§6). |
| `whatsapp` | Fusionne avec l'equivalent implicite deja porte par le suivi CoachingProject (aucun champ dedie actuellement) → nouveau champ additif `CoachingProject.whatsapp String?` | Copie telle quelle si present. |
| `statutSimple`/`compteRendu` (offre CONSEIL) | Conserves tels quels en champs additifs, **non fusionnes** avec `status` (`CoachingProjectStatus`) qui a une semantique differente | Copie telle quelle ; a lire ensemble a l'affichage, jamais l'un ecrase l'autre. |
| `etapeActuelle`/`etapeOverride`/`iterationCount` (timeline figee par offre GUIDE/CONCEPTION) | Additifs sur `CoachingProject`, **distincts** de `CoachingProject.status` | Copie telle quelle. La timeline a etapes fixes de `lib/dossier-client.ts` (`getDossierSteps`) reste utilisable pour les dossiers qui l'utilisaient deja ; ne pas la forcer sur un `CoachingProject` cree hors achat. |
| `dateLivraison` | Additif `CoachingProject.dateLivraison DateTime?` | Copie telle quelle ; pilote purge/J+30/temoignage (§7). |
| `consentementPartage`/`consentementPartageAt` | Additifs | Copie telle quelle — ne pas confondre avec la visibilite privee/partagee au niveau du contenu (§8), qui est une regle de code, pas ce consentement commercial. |
| `temoignageDemande`/`temoignageRecu`/`j30MessageEnvoye` | Additifs | Copie telle quelle ; `lib/services/dossier-notifications.ts` lit desormais `CoachingProject` au lieu de `DossierClient` pour ces trois flags (a livrer avec la bascule d'ecriture, §9). |
| `purgeWarningSentAt`/`confirmationEmailSentAt` (ajoutes ce lot) | Additifs identiques | Copie telle quelle ; memes garanties (§ correctifs ci-dessus) a preserver a l'identique sur le nouveau champ. |
| `besoinVehicule`/`besoinDescription`/`besoinProgress`/`besoinDeadline`/`besoinAutre` (formulaire de besoin pre-achat) | Additifs, **distincts** de `objectifs`/`threePriorities`/`coachingTopics` deja presents sur `CoachingProject` | Copie telle quelle. Les deux jeux de champs peuvent legitimement differer (besoin exprime avant paiement vs. entretien realise apres) — ne jamais ecraser l'un par l'autre a la reprise. |
| `notesInternes` | `CoachingProject.notesInternes` existe deja | Concatener les deux si un meme `CoachingProject` recoit les deux sources (cas de rapprochement, rare), avec un separateur horodate explicite ; ne jamais silencieusement en perdre un. |
| `DossierEvent` | Reprend dans `CoachingProjectEvent` (meme forme : `type` texte libre, `authorName`, `note`, `createdAt`) | Import direct ligne a ligne, `type` prefixe si besoin de distinguer l'origine (ex. `LEGACY_DOSSIER:<type>`) pour l'audit, jamais perdu. |
| `DossierDocument` | Reprend dans `CoachingProjectDocument` (memes champs : filename/bucket/path/contentType/sizeBytes/uploadedBy) | Import direct ; **ne jamais deplacer les fichiers physiques eux-memes**, seulement les lignes qui pointent dessus (regle explicite de `PROMPT_REPRISE_CLAUDE_CRM.md`). Verifier la contrainte `@@unique([bucket, path])` deja partagee par les deux tables avant l'import (memes valeurs `bucket`/`path` possibles cote coaching → detecter les collisions, ne pas les fusionner aveuglement). |
| `DossierAppointment` | Reprend dans `CoachingSession` (`scheduledAt`, `durationMinutes`, `status` a deduire de `compteRendu` rempli ou non, `prochaineEtape`/`sujetsAbordes` a defaut vide) | Import direct ; **conserver l'UID ICS existant** (`app/api/calendar/accompagnements.ics`) en ajoutant un champ additif `legacyDossierAppointmentId String? @unique` sur `CoachingSession` pour ne jamais dupliquer un abonnement webcal deja installe sur un telephone. |

### 3. Prospect → conversion

`Prospect.convertedCustomerId` pointe deja vers `Customer`, pas vers un
projet — inchange. La conversion (`lib/services/prospect.ts`) doit devenir
le point d'entree unique de creation d'un `CoachingProject` a partir d'un
prospect (deja largement le cas). Rien a fusionner ici, seulement confirmer
qu'aucun second chemin de conversion n'existe (`DossierClient` n'a pas
d'equivalent prospect — un achat direct sans prospect prealable cree
directement le `CoachingProject`, §9).

### 4. Integration `Project`/`ProjectSchema` (editeur), sans fusion

D'apres `NOTE_CLAUDE_REUTILISER_EDITEUR_EXISTANT.md` : conserver l'editeur
existant tel quel, ne jamais dupliquer nœuds/cables dans le CRM. Decision :

- Nouveau champ additif `CoachingProject.linkedProjectId String? @unique` +
  relation optionnelle vers `Project` (`onDelete: SetNull` : la suppression
  d'un `Project` ne doit jamais entrainer celle de l'accompagnement).
  **Cardinalite proposee 1:1 optionnelle** (un accompagnement a au plus un
  espace de travail schema actif a la fois) — a confirmer avec Fabien si un
  besoin reel de plusieurs `Project` actifs par accompagnement apparaît
  (ex. deux circuits totalement independants sur le meme vehicule) ; rien
  n'empeche techniquement de passer a une relation 1:N plus tard (migration
  additive supplementaire), mais ne pas l'anticiper sans besoin observe.
- Les actions cote CRM/compte client reutilisent **telles quelles** les
  actions existantes (`createProjectForCustomerAction`/
  `createProjectForCustomerByAdmin`, ouverture `/outils/schema/editeur?projectId=...`),
  simplement invoquees depuis le dossier unifie avec `linkedProjectId` mis a
  jour au lieu de dupliquer la creation. Si un `Project` existe deja pour ce
  client et ce besoin, le proposer au rattachement plutot que d'en creer un
  second (deja demande explicitement par la note).
- `CoachingCircuit`/`CoachingSchemaRevision` ne sont **pas** remplaces par
  `Project`/`ProjectSchema` : ce sont des enregistrements structures de
  dimensionnement/bilan fige (courant calcule, section de cable, protection,
  snapshot du bilan de consommation), pas un canevas visuel — role
  different et complementaire de `ProjectSchema` (nœuds/cables/miniature).
  Les deux peuvent coexister sous le meme `CoachingProject` sans creer un
  second parcours concurrent, conformement a la note (« plusieurs tables
  specialisees peuvent subsister »).
- La proposition anterieure de Codex (« brouillon prive → version figee
  partagee ») **n'est pas retenue par defaut** : `ProjectSchemaVersion`
  existe deja pour figer des etapes, et `ShareSchemaDialog`/`shareToken`
  gerent deja un partage explicite. Le plan de consolidation reutilise ces
  mecanismes existants sans les dupliquer ; toute evolution de ce modele de
  partage doit d'abord verifier ces ecrans reels, pas partir d'une
  hypothese non confirmee.

### 5. Type de support (van/camping-car/bateau/autre)

D'apres `PROMPT_CLAUDE_APRES_FUSION_SUPPORTS.md` : le type doit etre porte
par le dossier accompagne, pas par le client. Decision :

- Nouveau champ additif `CoachingProject.assetType ProjectAssetType?`
  (reutilise l'enum **existant** de l'editeur : `BOAT`/`VAN`/`MOTORHOME`/`OTHER`,
  deja plus granulaire que `Customer.assetType`/`AssetType` qui melange
  VAN et MOTORHOME sous `VEHICLE` — confirme par lecture du schema).
  **Nullable = inconnu**, aucune valeur par defaut : un ancien
  `CoachingProject` (implicitement « van » aujourd'hui) n'est **jamais**
  reecrit automatiquement a la reprise ; le coach peut le preciser
  ulterieurement.
- Aucune extension d'enum necessaire dans l'immediat (contrairement a ce
  que le document suggerait en prevoyant une extension minimale) : le
  caractere nullable du champ couvre deja « pas encore su » sans avoir
  besoin d'une valeur `UNKNOWN` dans `ProjectAssetType` — a revoir seulement
  si l'UI a besoin de distinguer explicitement « jamais demande » de
  « demande, client ne sait pas », ce qui n'est pas confirme comme
  necessaire.
- `Customer.assetType` **n'est pas touche** : il garde son sens actuel de
  fiche profil generale, distinct du support d'un accompagnement precis
  (confirme par Fabien : « Customer.assetType a un autre sens »).
- Les champs `vehicleBrand`/`vehicleModel`/`vehicleYear`/`vehicleEngine`/
  `vehicleFormat`/`vehicleDimensions`/`registrationCountry`/`usageCountry`/
  `homologationNotes` existants restent le socle commun (marque/modele/
  annee/contexte) reutilisable pour van, camping-car ou bateau sans
  renommage — leurs libelles a l'ecran deviennent conditionnels a
  `assetType` (ex. « immatriculation » n'a pas de sens pour un bateau sans
  numero de coque ; l'ecran adapte le libelle, le champ reste generique en
  base). Aucun champ specifique nautique n'est ajoute sans besoin observe
  (interdiction explicite d'inventer un questionnaire nautique complet).

### 6. Commercial : deux parcours preserves, jamais fusionnes

`Order`/`Payment` (achat Stripe, `DossierClient.orderId` d'origine) et
`CoachingProposal` (accord negocie manuellement, deja sur `CoachingProject`)
restent deux mecanismes distincts et **continuent de coexister** sur le
meme `CoachingProject` : un accompagnement peut avoir ete propose
manuellement (`CoachingProposal`) puis effectivement paye sur le site
(`orderId` renseigne ensuite), ou l'inverse (achat direct sans proposition
prealable). Aucune ecriture ne doit inventer l'un a partir de l'autre.
`Quote`/`Invoice` gardent leur role documentaire propre, retrouvables
depuis le dossier sans qu'il en fabrique une seconde version (deja acte
dans `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §3).

### 7. Notifications/cron

`lib/services/dossier-notifications.ts` (inactivite, J+30, temoignage,
avertissement+purge — corriges ce lot sur `DossierClient`) doit, apres la
bascule d'ecriture (§9), lire/ecrire les memes flags sur `CoachingProject`.
**Ne pas dupliquer le cron** : une seule execution quotidienne, sur la
table qui fait foi a ce moment de la transition (voir §9 sur la coexistence
temporaire).

### 8. Visibilite privee/partagee

Regle unique proposee, reprise de `PLAN_AMELIORATION_CRM_FABSYSTEM.md` §4.5 :
un champ que le client renseigne dans les rubriques communes est visible au
coach ; les brouillons/notes internes du coach (`notesInternes`,
`CoachingProposal` en `BROUILLON`, sections privees futures de la fiche
d'entretien) restent prives par construction serveur (jamais un simple
masquage CSS) ; un document/compte-rendu devient visible au client
seulement par une action de partage explicite. Ce plan ne cree pas de
nouveau champ de visibilite generique : chaque type de contenu garde sa
propre regle de filtrage cote service, comme c'est deja le cas pour
`notesInternes` aujourd'hui (jamais renvoye aux routes `mon-compte/*`).

### 9. Bascule d'ecriture et coexistence temporaire

Ordre propose (detaille en code lors de l'implementation, pas ici) :

1. Migration additive (tous les champs/relations ci-dessus), aucune
   donnee deplacee.
2. Script de reprise idempotent (a blanc d'abord) : pour chaque
   `DossierClient`, trouver ou creer le `CoachingProject` correspondant
   (rapprochement par `customerId` + `orderId` si un `CoachingProject` a
   deja ete cree manuellement pour ce client avant l'achat — **jamais par
   nom/e-mail seul**), copier les champs et satellites selon le tableau du
   §2, avec comptage des cas ambigus (plusieurs `CoachingProject` possibles
   pour un meme client) signales pour resolution manuelle plutot
   qu'automatique.
3. Webhook Stripe (`createDossierClientForOrder`) et actions CRM bascules
   pour ecrire uniquement sur `CoachingProject` (derriere un idempotence
   par `orderId` unique, meme garantie qu'aujourd'hui).
4. Ecrans dashboard/compte client reunis sur un seul jeu de routes ; les
   anciennes (`/dashboard/accompagnements/*`, `/mon-compte/mon-accompagnement`)
   redirigent avec controle d'acces vers le dossier `CoachingProject`
   correspondant.
5. Periode de coexistence : `DossierClient` et satellites restent en base
   (lecture seule, plus aucune ecriture) pour permettre un retour arriere
   sans perte, avec un critere de sortie explicite avant suppression
   physique (ex. : N jours sans acces en lecture aux anciennes routes,
   verification manuelle des comptages de reprise).
6. Suppression physique des anciennes tables : migration separee et
   documentee, hors de ce lot.

### 10. Conflits et retour arriere

Reprend le meme motif que les correctifs de ce lot : toute ecriture
partagee coach/client sur un champ repris doit passer par la meme
verification version+ID atomique (`updateMany` conditionne, jamais
lecture-puis-ecriture separees) deja appliquee a
`updateVehicleInfo`/`updateUsagesInfo`/`updateImplantationInfo`. Les
nouveaux champs additifs commerciaux (`orderId`, `offre`, `dateLivraison`,
etc.) n'ont pas besoin d'un marqueur de version dedie : ils ne sont
ecrits que par le webhook/l'admin, jamais concurrentiellement par le
client. Retour arriere : chaque etape ci-dessus est une migration additive
distincte, reversible independamment (supprimer une colonne ne perd que
cette colonne, jamais les tables sources tant que l'etape 6 n'est pas
executee).

### 11. Accessibilite/guidage : exigence transverse, pas une etape separee

Conformement a `PROMPT_CLAUDE_ACCESSIBILITE_ET_GUIDAGE.md` (point 4 : « ne
programme pas trois refontes successives des memes ecrans »), les ecrans du
dossier unifie (§9 point 4) doivent etre concus directement selon ces
exigences (une action principale par ecran, francais courant, labels
visibles, confirmations explicites, conservation de la saisie en cas
d'erreur/conflit, cibles tactiles ≥44px, contrastes et clavier verifies) —
pas ecrits une premiere fois puis retouches ensuite. Ce plan de donnees
n'impose aucune contrainte de schema supplementaire pour cela ; c'est une
exigence d'implementation d'ecran, notee ici pour qu'elle soit prise en
compte des la conception des memes ecrans que la fusion, pas apres.

### 12. Ce que ce plan ne decide pas (a confirmer avant migration)

- Cardinalite exacte `CoachingProject` ↔ `Project` si un besoin reel de
  plusieurs schemas actifs simultanes apparait (§4).
- Sort exact de `etapeActuelle`/`etapeOverride` (timeline figee par offre)
  une fois le dossier commun en place : rester un mode d'affichage
  alternatif pour les dossiers issus d'achat, ou etre progressivement
  remplace par le suivi libre de `CoachingProject` — non tranche, a device
  avec Fabien a l'usage du lot 1 de `PLAN_AMELIORATION_CRM_FABSYSTEM.md`.
  volume ambigu.
- Politique de conservation post-cloture (`PLAN_AMELIORATION_CRM_FABSYSTEM.md`
  §4.6 : « Clôturer, archiver et supprimer sont trois operations
  distinctes ») applicable au `CoachingProject` unifie — la purge actuelle
  (§ correctif ci-dessus) ne concerne que `DossierClient` et devra etre
  reportee/adaptee explicitement, pas suppposee identique.
- Date/critere de sortie precis de la coexistence temporaire (§9 point 5).

Ce plan n'est pas fige : toute decision ci-dessus peut changer avant
migration, tant que le changement est documente ici avant d'etre code.

## Lot 3 dashboard client (2 octobre 2026) : historique automatique et auteur du schéma

Contexte : `PROMPT_CLAUDE_DASHBOARD_CLIENT_V1.md` Lot 3 — avant chaque
sauvegarde qui change réellement le dessin, conserver atomiquement l'état
complet remplacé, et savoir distinguer l'auteur de l'état sauvegardé de
l'auteur de la modification qui le remplace. Travail local uniquement,
migration préparée et appliquée sur la base de développement locale
(`fabsystem_dev`) pour être réellement testée, **jamais sur la prod**.

**Constat du code existant** (vérifié avant de modifier) :
`lib/services/project-schema.ts:saveProjectSchema` fait un `upsert` nu, sans
aucun instantané préalable ni aucune trace de l'auteur — seule la création
EXPLICITE d'une version (`lib/services/project-schema-version.ts:create`,
geste volontaire via un bouton) écrit dans `ProjectSchemaVersion`
aujourd'hui, et seule `restore` snapshotte déjà correctement l'état remplacé
avant d'écraser (bon comportement existant, non modifié ici).
`ProjectSchema` n'a aucun champ d'auteur : impossible de savoir qui a écrit
l'état actuel avant ce lot.

**Changements additifs proposés** :

1. `ProjectSchema` : deux nouveaux champs nullables, `lastModifiedByType
   ProjectSchemaVersionAuthor?` et `lastModifiedByName String?`. Nullable
   = inconnu — un schéma déjà existant avant ce lot n'a jamais son auteur
   réellement connu, jamais une valeur inventée (ADMIN par défaut aurait
   été une fabrication, pas une donnée).
2. `enum ProjectSchemaVersionAuthor` : ajout de la valeur `UNKNOWN`, pour
   permettre de snapshotter honnêtement l'état remplacé d'un schéma legacy
   dont l'auteur n'a jamais été enregistré, sans jamais lui attribuer à
   tort ADMIN ou CUSTOMER. Changement additif sur un enum déjà utilisé
   uniquement par `ProjectSchemaVersion.authorType` (vérifié : aucun autre
   usage dans le code) — aucune ligne existante n'est affectée, chaque
   version déjà créée garde sa valeur concrète actuelle.
3. Aucun nouveau champ de concurrence stocké en base : la protection contre
   l'écrasement concurrent (§ ci-dessous) s'appuie sur `ProjectSchema.updatedAt`,
   déjà existant et déjà maintenu automatiquement par Prisma (`@updatedAt`).

**Mécanique de sauvegarde revue** (`saveProjectSchema`, dans une seule
transaction) :

1. Lire l'état actuel de `ProjectSchema` (s'il existe).
2. Si le contenu significatif (nodes/edges/projectName — jamais la
   miniature seule, cosmétique/dérivée, ni les horodatages) diffère
   réellement de ce qui va être écrit : créer une `ProjectSchemaVersion` de
   l'état REMPLACÉ, attribuée à `lastModifiedByType`/`lastModifiedByName`
   du schéma actuel (`UNKNOWN`/"Auteur inconnu" si jamais enregistré —
   jamais deviné). Une sauvegarde identique au contenu déjà en base ne crée
   aucune copie.
3. Écrire le nouvel état via une mise à jour conditionnée sur
   `updatedAt` (lu à l'étape 1) — `updateMany` avec ce filtre, jamais une
   lecture puis écriture séparées (même garde que celle déjà appliquée à
   `updateVehicleInfo`/`updateUsagesInfo`, §10). Si aucune ligne n'est
   affectée, c'est qu'une autre écriture a eu lieu entre la lecture et
   l'écriture : conflit explicite, jamais un écrasement silencieux.
4. Le nouvel état enregistre son propre auteur
   (`lastModifiedByType`/`lastModifiedByName`, fournis par l'appelant —
   admin ou client, résolus depuis `OwnershipActor`, même source que
   `createProjectSchemaVersion`/`restore` déjà existants).

**Phase scindée volontairement** : la détection de conflit ci-dessus exige
que l'appelant transmette l'`updatedAt` qu'il a lu en dernier (paramètre
`expectedUpdatedAt`, optionnel). Le contrat actuel du PUT
(`app/api/projects/[projectId]/schema/route.ts`) ne transmet aujourd'hui
AUCUN marqueur de ce type — l'éditeur client (React, autosave) ne le suit
pas non plus. Rendre ce paramètre optionnel permet d'activer tout de suite
l'instantané automatique (valeur sûre, aucun changement de contrat) sans
risquer une régression sur le chemin de sauvegarde déjà utilisé en
production par l'éditeur réel, en modifiant son comportement de
concurrence dans le même geste qu'une réécriture plus large de son état
React (zone à risque distincte, nécessitant son propre test de bout en
bout) — voir le journal `PLAN_EXECUTION_CRM_CLAUDE.md` pour la suite
explicitement prévue (câblage du client une fois ce socle validé).

**`setCableLengths`** (même fichier) écrit aussi directement sur
`ProjectSchema` en contournant toute trace d'auteur — basculé sur le même
mécanisme pour ne pas laisser un deuxième chemin d'écriture non protégé
(le prompt demande explicitement de vérifier TOUTES les voies d'écriture,
pas seulement un bouton).
