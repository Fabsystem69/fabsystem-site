# FabSystem Source Of Truth

## Statut du document

- Date de reference: 2026-08-05
- Portee: matrice des sources de verite du MVP

## Principe general

Chaque domaine critique doit avoir une source de verite claire.

Sans cela, les bugs de synchro et les regressions historiques deviennent probables.

## Matrice

| Objet | Source de verite | Pourquoi | Ce qui ne doit pas faire foi |
| --- | --- | --- | --- |
| Catalogue courant | `Product`, `ProductPrice` | definit ce qui est vendable maintenant | ancienne commande, metadata Stripe |
| Asset numerique | `DigitalAsset` | definit le fichier livrable courant | fichier expose dans `/public`, Blob legacy |
| Composition d'un produit | `ProductAsset`, `BundleItem` | definit ce qui est livre pour un produit ou bundle | heuristique cote client |
| Panier | `Cart`, `CartItem` | etat temporaire avant paiement | local storage seul, UI seule |
| Remise | `DiscountCode`, `DiscountRedemption` | definit l'eligibilite, le montant fige et la consommation d'un code | calcul client seul, coupon Stripe seul |
| Achat finalise | `Order` | reference metier d'une vente | redirection navigateur apres Stripe |
| Ligne historique | `OrderItem` | snapshot immuable produit + prix | lecture du catalogue courant |
| Paiement | `Payment` | statut local du paiement Stripe | simple succes de page `merci` |
| Evenement Stripe | `StripeEvent` | idempotence, audit, rejeu | logs volatils |
| Travail asynchrone | `BackgroundJob` | execution durable et rejouable | memoire ou `after()` |
| Droit de telechargement | `DownloadGrant` | autorisation effective d'acces | URL brute ou parametre client |
| Stockage physique des nouveaux assets | Supabase Storage | porte les fichiers prives du nouveau commerce | Vercel Blob legacy, `/public` |
| Identite de connexion | `User` | authentification | `Customer` seul |
| Identite commerciale | `Customer` | commandes, devis, factures | `User` seul |
| Proposition commerciale | `Quote` | domaine devis existant | `Order` |
| Document comptable | `Invoice` | domaine facturation | `Order` ou Stripe seuls |
| Flux ebook historique | `EbookOrder` | sert uniquement au legacy temporaire | nouveau commerce MVP |

## Regles de lecture

### Produit et prix

- le checkout lit le catalogue courant
- la commande snapshotte ensuite ce qui a ete vendu
- le dashboard catalogue lit Prisma pour les statuts, prix et assets
- Stripe ne fait pas foi pour l'etat du catalogue

### Paiement

- Stripe informe
- `Payment` enregistre l'etat local
- `Order` change selon les evenements valides
- `DiscountCode` et `DiscountRedemption` restent la verite de la remise appliquee
- le dashboard commandes lit `Order`, `OrderItem`, `Payment` et `DownloadGrant` sans modifier ces sources
- la preparation du remboursement reste lecture seule tant que le Sprint 8.4 n'est pas implemente

### Codes coaching

- un code coaching est cree dans Prisma avec un montant fige au moment de la creation
- le code est lie a un email et a un ebook cibles
- la duree de vie MVP est de deux mois
- `OrderItem` garde les montants bruts historiques
- `Order.discountTotalCents` garde l'impact total de la remise
- `Payment.amountCents` ne porte que le total final apres remise
- si le total final tombe a `0`, la commande devient `PAID` sans session Stripe

### Telechargement

- l'asset brut ne suffit pas
- le droit provient de `DownloadGrant`
- la signed URL est generee cote serveur uniquement
- Supabase Storage porte le fichier physique du nouveau commerce

## Admin catalogue MVP

Pour l'administration MVP:

- `Product` reste la verite du statut de publication
- `ProductPrice` reste la verite du prix courant
- `DigitalAsset` reste la verite des fichiers lies
- l'ecran `/dashboard/catalog` permet la lecture, la creation, l'edition et les changements de statut
- l'ecran `/dashboard/catalog/assets` gere uniquement les references Prisma des assets
- aucune URL signee Supabase n'est generee dans l'admin
- un changement de prix cree un nouveau `ProductPrice` actif et archive l'ancien
- `OrderItem` reste le snapshot historique et ne doit jamais etre recalcule depuis le prix courant
- un `EBOOK` ne devient activable que s'il a un prix actif unique et au moins un asset `ACTIVE` lie

### Facturation

- une facture peut etre generee a partir d'une commande
- elle ne doit jamais recalculer ses montants depuis le catalogue courant

## Erreurs a eviter

1. Considerer Stripe comme la seule verite d'une vente.
2. Recalculer une facture depuis `ProductPrice`.
3. Autoriser un telechargement depuis une simple URL publique.
4. Attacher directement un achat a `User` sans `Customer`.
5. Reutiliser `EbookOrder` ou Vercel Blob legacy comme fondation du nouveau commerce.
