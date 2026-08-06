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
