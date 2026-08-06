# FabSystem MVP Scope

## Statut du document

- Date de reference: 2026-08-05
- Portee: perimetre fige du MVP commerce numerique

## Ce que le MVP doit livrer

Le MVP doit permettre de vendre plusieurs produits numeriques avec un seul checkout Stripe.

### Produits concernes

- ebooks
- packs d'ebooks
- fichiers numeriques complementaires

### Fonctions obligatoires

- catalogue
- panier multi-produits
- validation serveur des prix
- Stripe Checkout
- commandes
- paiements
- codes de reduction coaching ebook
- telechargements securises
- historique d'achats
- espace client minimal
- administration minimale du catalogue

## Ce que le MVP ne doit pas inclure

- abonnements
- produits physiques
- stock
- expedition
- formations
- creneaux de reservation
- marketplace
- multi-vendeur
- moteur fiscal international complexe

## Rappel de frontiere metier

### `BUY_NOW`

Entre dans le panier MVP.

### `REQUEST_ONLY`

N'entre pas dans le panier MVP.

Passe par:

- contact
- devis
- reservation

## Compatibilites exigees

Le MVP doit rester compatible avec:

- le site vitrine
- le dashboard interne
- le domaine clients / devis / factures
- le tunnel ebook existant tant que la bascule n'est pas faite

## Decision legacy

Le tunnel ebook existant est `LEGACY`.

Il peut survivre temporairement pour la continuite de service, mais:

- il ne doit plus etre etendu
- il ne doit plus servir de base au MVP
- les nouveaux ebooks et assets numeriques doivent passer par le nouveau moteur

## Incompatibilites assumees

Le MVP ne doit pas essayer de gerer dans une meme commande:

- un ebook
- un produit physique
- un abonnement
- une prestation `REQUEST_ONLY`

La promesse n'est pas un panier universel.

La promesse est un panier numerique `BUY_NOW` fiable.

## Regles panier

- plusieurs ebooks autorises
- plusieurs telechargements autorises
- bundles autorises
- un seul paiement Stripe par commande
- remise coaching ebook usage unique possible
- aucun `REQUEST_ONLY`
- aucune quantite ebook > `1` sans nouvelle regle metier explicite

## Regles de stockage et telechargement

- aucun nouvel ebook dans `/public`
- aucun nouveau flux numerique sur Vercel Blob
- bucket prive Supabase Storage pour les nouveaux assets
- signed URLs courtes
- generation serveur uniquement
- verification prealable de `DownloadGrant`

## Livrables visibles pour le client

Le client doit pouvoir:

1. consulter la boutique
2. voir la fiche produit
3. ajouter au panier
4. payer
5. recevoir un email
6. retrouver ses achats
7. telecharger ses fichiers

## Livrables visibles pour l'admin

L'admin doit pouvoir:

1. creer ou publier un produit numerique
2. definir son prix
3. attacher les assets necessaires
4. suivre les commandes et paiements
5. relancer un traitement de livraison si besoin
6. rembourser totalement une commande payee depuis le dashboard admin
7. creer un code coaching ebook unique

## Etat de l'admin catalogue MVP

L'admin catalogue MVP permet desormais:

- la lecture des `Product`
- la lecture des `ProductPrice`
- la lecture des `DigitalAsset` lies
- la lecture globale des `DigitalAsset`
- les changements de statut simples `DRAFT` / `ACTIVE` / `ARCHIVED`
- la creation d'un produit numerique avec un prix actif initial
- l'edition des informations produit depuis le dashboard
- la mise a jour du prix courant avec archivage de l'ancien prix actif
- la creation d'une reference `DigitalAsset`
- la modification des metadonnees `DigitalAsset`
- la liaison et deliaison `ProductAsset` depuis le dashboard
- une vue dashboard `Commandes` en lecture seule
- une vue detail commande avec paiements et `DownloadGrant`
- un remboursement total admin manuel avec revocation des `DownloadGrant`
- une vue dashboard `Codes reduction` et une creation rapide de code coaching ebook

Il ne permet pas encore:

- l'upload d'asset
- la suppression physique d'asset
- l'association d'assets depuis l'interface
- la suppression produit ou asset
- le remboursement partiel

## Regle prix admin

- `ProductPrice` garde l'historique des anciens montants
- un changement de prix ne reecrit pas les `OrderItem` historiques
- le dashboard doit conserver au maximum un seul prix `ACTIVE` par produit

## Definition de succes du MVP

Le MVP est considere suffisant si FabSystem peut vendre quelques produits numeriques a faible cout:

- sans intervention manuelle sur chaque vente
- sans exposer les fichiers payants
- sans casser l'existant
- sans devoir deja resoudre stock, shipping, abonnement ou booking
- sans reposer sur le systeme ebook legacy pour le nouveau commerce
