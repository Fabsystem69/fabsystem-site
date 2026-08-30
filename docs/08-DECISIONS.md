# FabSystem Architecture Decisions

## Statut du document

- Date de reference: 2026-08-05
- Usage: journal des decisions figees pour le MVP commerce

## ADR-001 - Pas de reecriture du projet

### Decision

Le site en production ne sera pas reecrit.

### Consequence

Le commerce est ajoute par couches, a cote de l'existant, avec coexistence temporaire des anciens et nouveaux flux.

## ADR-002 - Le prochain objectif est un MVP commerce numerique

### Decision

Le premier objectif commerce couvre uniquement:

- ebooks
- packs d'ebooks
- fichiers numeriques complementaires

### Consequence

Les autres domaines ne pilotent pas le modele du MVP.

## ADR-003 - Distinction `BUY_NOW` / `REQUEST_ONLY`

### Decision

FabSystem introduit deux modes d'achat:

- `BUY_NOW`
- `REQUEST_ONLY`

### Consequence

Pour le MVP:

- seuls les produits `BUY_NOW` vont dans le panier
- les offres `REQUEST_ONLY` restent sur les parcours contact, devis ou reservation existants

## ADR-004 - Noyau catalogue minimal

### Decision

Le noyau catalogue du MVP reste centre sur:

- `Product`
- `ProductPrice`
- `DigitalAsset`

Des tables de jointure minimales sont autorisees pour:

- associer des assets a un produit
- composer un bundle

### Consequence

Le modele `Product` n'est pas surcharge de flags de shipping, stock, booking ou abonnement.

## ADR-005 - Identite: `User` et `Customer`

### Decision

- `User` represente l'identite de connexion
- `Customer` represente l'identite commerciale
- un `Customer` peut etre lie a zero ou un `User`
- une commande appartient toujours a un `Customer`

### Consequence

Le MVP ne cree pas de `CustomerProfile`.

## ADR-006 - Sources de verite figees

### Decision

- `Product` et `ProductPrice` = catalogue courant
- `DigitalAsset` = source locale du fichier vendable
- `Cart` = etat temporaire
- `Order` = achat finalise
- `Payment` = etat local du paiement
- `OrderItem` = snapshot immuable
- `DownloadGrant` = droit effectif de telechargement
- `Invoice` = document comptable
- `Quote` = proposition commerciale

### Consequence

Stripe n'est pas la source de verite metier principale.

## ADR-007 - `Order` ne remplace pas `Invoice` ni `Quote`

### Decision

Le domaine commerce et le domaine documents restent distincts.

### Consequence

- une commande peut generer une facture
- une facture ne doit pas recalculer son contenu depuis le catalogue courant
- les tables actuelles restent en place

## ADR-008 - State machines simples et explicites

### Decision

Les etats MVP sont limites a:

- `OrderStatus`
  - `DRAFT`
  - `PENDING_PAYMENT`
  - `PAID`
  - `CANCELLED`
  - `REFUNDED`
- `PaymentStatus`
  - `PENDING`
  - `SUCCEEDED`
  - `FAILED`
  - `REFUNDED`
  - `PARTIALLY_REFUNDED`
- `FulfillmentStatus`
  - `PENDING`
  - `PROCESSING`
  - `FULFILLED`
  - `FAILED`
  - `REVOKED`

### Consequence

Les transitions sont bornees et documentees dans `docs/12-STATE-MACHINES.md`.

## ADR-009 - Webhook durable et idempotent

### Decision

Le webhook Stripe doit:

- verifier la signature
- enregistrer chaque evenement
- etre idempotent
- repondre vite
- deleguer les effets de bord a des jobs durables

### Consequence

Le socle minimal documente est:

- `StripeEvent`
- `BackgroundJob`

Un simple traitement memoire ou `after()` non durable n'est pas acceptable pour les etapes critiques.

## ADR-010 - Panier MVP restreint

### Decision

Le panier MVP accepte uniquement:

- ebooks
- telechargements numeriques
- bundles

### Consequence

Il exclut:

- `REQUEST_ONLY`
- abonnements
- produits physiques

## ADR-011 - Le flux ebook actuel devient legacy

### Decision

Le tunnel ebook historique reste actif tant que le nouveau checkout generique n'est pas prouve en production.

### Consequence

Pas de bascule brutale.

Le flux est desormais officiellement `LEGACY`.

Il inclut:

- `EbookOrder`
- `/api/ebook/checkout`
- `/api/ebook/download`
- `/ebook/acces/[token]`
- Vercel Blob
- `STRIPE_PRICE_ID_EBOOK`
- `EBOOK_ACCESS_TOKEN_SECRET`

Il peut survivre temporairement, mais il ne doit plus etre etendu ni servir de base au nouveau commerce.

## ADR-012 - Supabase Storage devient le provider cible des nouveaux assets numeriques

### Decision

Les nouveaux ebooks et fichiers numeriques du MVP doivent utiliser Supabase Storage.

### Consequence

- bucket prive obligatoire
- aucun asset prive dans `/public`
- signed URLs courtes
- generation cote serveur uniquement
- verification prealable d'un `DownloadGrant`

## ADR-013 - Les futurs domaines sont reportes

### Decision

Les domaines suivants sont documentes mais non modelises completement dans le MVP:

- abonnements
- produits physiques
- formations
- reservations

### Consequence

Ils feront l'objet d'extensions dediees plus tard.

## ADR-014 - Preconditions securite avant commerce

### Decision

Avant mise en production du commerce MVP, il faut au minimum:

- corriger le lint bloquant
- completer le contrat d'environnement
- verifier les secrets Stripe
- proteger les routes compte et admin
- mettre en place une strategie de rate limiting compatible Vercel
- garantir l'idempotence webhook
- garantir les telechargements prives et autorises
- garantir que les nouveaux assets prives utilisent Supabase Storage
- garantir qu'aucune signed URL privee n'est generee cote client

### Consequence

La stabilisation precede les sprints fonctionnels.
# Partage public des schémas (2026-08-30)

Un schéma de projet peut recevoir un jeton public opaque et révocable. Le
lien `/schema/partage/[jeton]` donne uniquement une vue du schéma: aucune
authentification, modification, sauvegarde ou donnée client/projet n'y est
exposée. Le jeton ne reprend jamais l'identifiant du projet.
