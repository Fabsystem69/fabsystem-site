# FabSystem Architecture

## Statut du document

- Date de reference: 2026-08-05
- Portee: architecture existante et cible MVP commerce numerique

## Architecture actuelle

Le projet repose aujourd'hui sur quatre zones fonctionnelles deja en production.

### 1. Site marketing

Le site public vit dans `app/` et sert notamment:

- la home
- les pages de prestations et contenus
- les pages ebook
- les formulaires de contact
- les pages SEO

Le layout racine [app/layout.tsx](/Users/fabienlages/Desktop/fabsystem-site/app/layout.tsx:1) contient aujourd'hui le `Navbar`, le `Footer` et les metadata globales.

### 2. Dashboard interne

Le back-office actuel est sous `app/dashboard/*` avec une protection a deux niveaux:

- `middleware.ts`
- `requireSession()` dans [app/dashboard/layout.tsx](/Users/fabienlages/Desktop/fabsystem-site/app/dashboard/layout.tsx:1)

Il couvre deja:

- clients
- devis
- factures
- remises
- recap comptable

### 3. Tunnel ebook existant

Le projet vend deja un ebook via:

- [app/api/ebook/checkout/route.ts](/Users/fabienlages/Desktop/fabsystem-site/app/api/ebook/checkout/route.ts:1)
- [app/api/stripe/webhook/route.ts](/Users/fabienlages/Desktop/fabsystem-site/app/api/stripe/webhook/route.ts:1)
- [lib/stripe.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/stripe.ts:1)
- `EbookOrder`

Ce flux doit rester fonctionnel pendant la transition.

### 4. Domaine documents

Le coeur metier historique reste oriente documents:

- `Customer`
- `Quote`
- `Invoice`
- `Remise`
- PDF
- signatures

Ce domaine ne doit pas etre remplace brutalement par le futur domaine commerce.

## Arborescence actuelle utile

```text
app/
components/
lib/
prisma/
public/
tests/
docs/
```

### Observations structurelles

- `app/` melange encore marketing, dashboard et ebook commerce
- `components/` contient a la fois du public, du dashboard et du commerce ponctuel
- `lib/` centralise deja Prisma, Stripe, mail, PDF et plusieurs helpers metier
- plusieurs lectures Prisma sont encore faites directement dans des pages ou routes

## Familles d'API actuelles

### Auth

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/webauthn/options`
- `/api/auth/webauthn/verify`

### Public

- `/api/contact`
- `/api/public/sign/quotes/[id]`
- `/api/ebook/checkout`
- `/api/ebook/download`
- `/api/stripe/webhook`

### Interne

- `/api/internal/customers/*`
- `/api/internal/quotes/*`
- `/api/internal/invoices/*`
- `/api/internal/remises`
- `/api/internal/item-templates`
- `/api/internal/accounting/*`

## Limites de l'architecture actuelle

1. Pas de domaine catalogue.
2. Pas de domaine panier.
3. Pas de domaine commande generique.
4. Pas d'identite client distincte de l'admin actuel.
5. Pas de mecanisme durable pour les traitements asynchrones critiques.
6. Le tunnel ebook est specialise mono-produit.

## Cible MVP retenue

La cible immediate n'est pas un univers commerce generaliste.

La cible immediate est un domaine commerce numerique `BUY_NOW` limite a:

- ebooks
- bundles d'ebooks
- telechargements numeriques

## Separation des domaines

### Domaine `marketing`

Responsable de:

- pages publiques
- acquisition
- SEO
- contact

### Domaine `documents`

Responsable de:

- clients
- devis
- factures
- remises
- PDF

### Domaine `commerce-mvp`

Responsable de:

- catalogue numerique
- panier `BUY_NOW`
- checkout Stripe
- commandes
- paiements
- droits de telechargement
- espace client minimal

### Domaine `request-only`

Responsable de:

- diagnostics complexes
- prestations qualifiees
- offres qui demandent devis ou reservation

Important:

- ce domaine ne partage pas le panier MVP
- il continue a utiliser les parcours actuels de contact, devis ou reservation

## Architecture cible pour les nouveaux developpements

La cible est une architecture logique. Elle ne force pas une reorganisation brutale des fichiers existants.

```text
app/
  (marketing)/
  (shop)/
    boutique/
    panier/
    checkout/
    merci/
  (account)/
    compte/
      commandes/
      telechargements/
  dashboard/
  api/
    commerce/
      cart/
      checkout/
      orders/
      downloads/
    stripe/
      webhook/
    internal/

components/
  shop/
  account/
  dashboard/
  shared/

lib/
  auth/
  catalog/
  cart/
  checkout/
  orders/
  downloads/
  stripe/
  documents/
  server/
```

## Services cibles

Les nouveaux services doivent etre petits et explicites.

### `lib/catalog/*`

- lecture catalogue public
- lecture catalogue admin
- resolution du prix actif
- resolution des assets et bundles

### `lib/cart/*`

- lecture et persistance panier
- validation d'eligibilite `BUY_NOW`
- recalcul serveur des lignes

### `lib/checkout/*`

- creation ou rafraichissement de commande
- construction des line items Stripe
- preparation du contexte client

### `lib/orders/*`

- creation de `Order`
- snapshots immuables
- synchronisation des statuts

### `lib/downloads/*`

- creation de `DownloadGrant`
- verification des droits
- emission de liens temporaires

### `lib/stripe/*`

- verification webhook
- journalisation des evenements
- idempotence
- creation de jobs rejouables

## Routes cibles du MVP

### Pages

- `/boutique`
- `/boutique/[slug]`
- `/panier`
- `/checkout`
- `/merci`
- `/compte/commandes`
- `/compte/telechargements`

### APIs

- `POST /api/commerce/cart`
- `PATCH /api/commerce/cart`
- `POST /api/commerce/checkout`
- `GET /api/commerce/orders/[id]`
- `POST /api/commerce/downloads/[grantId]`
- `POST /api/stripe/webhook`

Ces routes sont cibles pour les prochains sprints. Elles ne remplacent pas les APIs existantes tant que la bascule n'est pas faite.

## Flux MVP cible

1. Le client parcourt la boutique numerique.
2. Il ajoute uniquement des produits `BUY_NOW` au panier.
3. Le serveur recalcule le panier et cree une `Order` en `PENDING_PAYMENT`.
4. Stripe Checkout est cree a partir des snapshots locaux.
5. Le webhook Stripe confirme le paiement de maniere idempotente.
6. Un job durable cree les `DownloadGrant` et envoie les emails.
7. Le client retrouve ses achats dans son espace.

## Regles d'architecture a respecter

1. Ne pas faire rentrer `REQUEST_ONLY` dans le panier MVP.
2. Ne pas faire du dashboard actuel le futur espace client.
3. Ne pas remplacer les devis et factures par `Order`.
4. Ne pas cacher de logique metier profonde dans les route handlers.
5. Ne pas dependre d'un traitement memoire ou d'un `after()` non durable pour les etapes critiques.

## Extensions futures documentees, non modelisees completement

### Formations

Ajouter plus tard:

- enrollment
- contenu protege
- progression

### Produits physiques

Ajouter plus tard:

- adresse de livraison
- shipping rates
- shipment
- stock

### Prestations standardisees

Ajouter plus tard:

- disponibilite
- booking
- confirmation

### Prestations personnalisees

Restent en `REQUEST_ONLY` avec contact et devis.

### Abonnements

Ajouter plus tard:

- Stripe Billing
- modele de souscription distinct
- renouvellement et statut d'abonnement

## Conclusion

L'architecture cible est desormais volontairement etroite:

- assez modulaire pour le commerce numerique
- assez simple pour etre livrable vite
- sans confusion entre catalogue `BUY_NOW` et offres `REQUEST_ONLY`
