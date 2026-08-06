# FabSystem Roadmap

## Statut du document

- Date de reference: 2026-08-05
- Principe: chaque sprint doit etre independant, deployable et validable
- Regle: aucune suppression de fonctionnalite existante pendant cette phase

## Strategie generale

La roadmap suit trois idees simples:

1. stabiliser l'existant avant d'ajouter du commerce
2. construire un socle numerique `BUY_NOW` uniquement
3. reporter les sujets plus complexes dans une roadmap future separee

## Sprint 0 - Stabilisation minimale

### Objectif

Reduire les risques de regression avant tout ajout commerce.

### Perimetre

- corriger ESLint
- completer `.env.example`
- corriger les incoherences de variables d'environnement
- documenter et securiser les telechargements actuels
- preparer les snapshots historiques necessaires
- ajouter les tests indispensables avant migration

### Hors perimetre

- pas de nouvelle fonctionnalite commerce
- pas de migration Prisma
- pas de refonte d'auth

### Validation

- lint vert
- tests critiques verts
- contrat d'environnement documente
- telechargement ebook actuel audite et cadre

## Sprint 1 - Catalogue numerique

### Objectif

Ajouter le premier vrai socle catalogue pour les produits numeriques.

### Perimetre

- `Product`
- `ProductPrice`
- `DigitalAsset`
- administration minimale du catalogue
- page boutique
- fiches produits

### Regles

- uniquement `EBOOK`, `DIGITAL_DOWNLOAD`, `BUNDLE`
- uniquement `BUY_NOW` dans le nouveau catalogue MVP
- les offres `REQUEST_ONLY` restent sur les parcours actuels

### Validation

- un admin peut publier un produit numerique
- la boutique lit le catalogue depuis la base
- aucune regression sur le tunnel ebook existant

## Sprint 2 - Panier numerique

### Objectif

Introduire un panier multi-produits pour les seuls produits `BUY_NOW`.

### Perimetre

- panier multi-produits
- validation serveur
- persistance adaptee
- resume de commande

### Regles

- plusieurs ebooks et telechargements autorises
- bundles autorises
- produits `REQUEST_ONLY` interdits
- abonnements interdits
- produits physiques interdits
- quantite superieure a `1` pour un ebook interdite tant qu'aucune regle metier contraire n'est definie

### Validation

- ajout, retrait et recalcul fiables
- aucun montant client n'est considere comme source de verite
- le panier est pret pour Stripe Checkout

## Sprint 3 - Commandes et Stripe generique

### Objectif

Remplacer la logique mono-produit par un socle de commande et paiement generique.

### Perimetre

- `Order`
- `OrderItem`
- `Payment`
- Stripe Checkout generique
- webhook idempotent
- journal des evenements Stripe

### Regles

- la redirection navigateur ne confirme jamais seule le paiement
- seul un evenement Stripe valide peut confirmer une commande
- les traitements critiques doivent etre durables et rejouables

### Validation

- une commande `PENDING_PAYMENT` est creee avant l'envoi chez Stripe
- le webhook met a jour `Order` et `Payment` sans doublon
- les evenements sont journalises

## Sprint 4 - Livraison numerique

### Objectif

Livrer les produits payes sans exposer les fichiers prives.

### Perimetre

- `DownloadGrant`
- telechargements securises
- email transactionnel
- rejouabilite des traitements

### Regles

- aucun asset prive dans `/public`
- chaque droit de telechargement est controle cote serveur
- les echecs de livraison peuvent etre rejoues

### Validation

- un achat paye donne acces au bon fichier
- les liens sont temporaires ou derives d'une route autorisee
- l'email peut etre rejoue sans recreer la commande

## Sprint 5 - Espace client

### Objectif

Donner au client un acces simple a ses achats.

### Perimetre

- connexion client
- commandes
- telechargements
- rattachement securise des achats invites

### Regles

- `User` est l'identite de connexion
- `Customer` reste l'identite commerciale
- un client ne voit que ses propres commandes et droits

### Validation

- un client connecte retrouve ses achats
- un achat invite peut etre rattache de maniere verifiee
- le dashboard admin existant n'est pas casse

## Sprint 6 - Facturation et remboursements

### Objectif

Relier proprement le commerce MVP aux documents et aux remboursements.

### Perimetre

- generation de facture
- snapshots
- remboursements
- synchronisation des statuts

### Regles

- `Order` ne remplace pas `Invoice`
- une facture peut etre generee depuis une commande
- une facture ne doit jamais recalculer son contenu depuis le catalogue courant

### Validation

- une commande payee peut produire une facture fiable
- un remboursement met a jour les statuts locaux
- les historiques restent immuables

## Sprint 7 - Promotions et bundles avances

### Objectif

Renforcer le marketing prix du MVP numerique sans l'alourdir excessivement.

### Perimetre

- codes promotionnels
- prix promotionnels
- packs
- regles anti-cumul

### Regles

- la verite prix reste cote serveur
- toute promotion doit etre traquable
- aucun mecanisme ne doit casser les snapshots de commande

### Validation

- une promotion autorisee s'applique correctement
- le bundle produit les bons droits
- les cas de cumul interdits sont bloques

## Roadmap future separee

Les chantiers suivants sont volontairement repousses apres le MVP numerique:

- produits physiques
- abonnements
- formations
- reservations
- prestations standardisees
- parcours `REQUEST_ONLY` avances

Ils feront l'objet d'une feuille de route distincte quand le MVP numerique sera stabilise.

## Ordre de priorite strict

1. Sprint 0 - Stabilisation minimale
2. Sprint 1 - Catalogue numerique
3. Sprint 2 - Panier numerique
4. Sprint 3 - Commandes et Stripe generique
5. Sprint 4 - Livraison numerique
6. Sprint 5 - Espace client
7. Sprint 6 - Facturation et remboursements
8. Sprint 7 - Promotions et bundles avances

## Definition de done d'un sprint

Un sprint n'est pas termine tant que:

- le site actuel continue de fonctionner
- le perimetre est teste
- les decisions sont documentees
- le rollback est compris
- la documentation reste coherente avec le code
