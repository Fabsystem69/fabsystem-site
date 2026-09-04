# FabSystem Stripe Strategy

## Statut du document

- Date de reference: 2026-08-05
- Portee: integration actuelle et cible Stripe du MVP commerce numerique

## Existant

### Etat Sprint 8.9 — legacy decompose

Le tunnel ebook historique mono-produit a ete decommissionne au Sprint 8.9 (voir
`docs/audits/ecommerce-legacy-decommission-2026-08-06.md`). Il n'existe plus:

- `app/api/ebook/checkout/route.ts`
- `app/api/ebook/download/route.ts`
- `app/ebook/acces/[token]/page.tsx`
- le modele `EbookOrder` n'est plus lu ni ecrit par aucun code applicatif (la table
  reste presente en base, sans migration de suppression, voir la note Prisma
  ci-dessous)

Point d'entree actuel unique pour le paiement:

- [lib/stripe.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/stripe.ts:1) — client Stripe utilise par le webhook pour la verification de signature
- [lib/server/stripe.ts](/Users/fabienlages/Desktop/fabsystem-site/lib/server/stripe.ts:1) — client Stripe serveur du nouveau commerce (checkout, remboursement)
- [app/api/stripe/webhook/route.ts](/Users/fabienlages/Desktop/fabsystem-site/app/api/stripe/webhook/route.ts:1) — traite exclusivement le nouveau commerce ; toute session sans metadata `orderId`/`orderNumber`/`paymentId` est desormais ignoree proprement (`200`), sans effet de bord

Variables existantes:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Limites du flux actuel

Le flux legacy mono-produit (checkout Stripe direct sans panier, `EbookOrder`
specialise) a ete retire au Sprint 8.9. Le nouveau checkout generique couvre
desormais tous les achats numeriques (panier multi-produits, `Order`/`Payment`
generiques, webhook commerce idempotent).

## Perimetre Stripe du MVP

Le futur checkout generique Stripe doit couvrir uniquement:

- `EBOOK`
- `DIGITAL_DOWNLOAD`
- `BUNDLE`

ayant tous:

- `purchaseMode = BUY_NOW`
- paiement unique
- livraison numerique apres confirmation webhook

Le commerce numerique MVP ne couvre pas encore:

- abonnements
- shipping
- taxes internationales complexes
- paiements pour offres `REQUEST_ONLY`

## Source de verite

Regles figees:

- `Product` et `ProductPrice` (Prisma) sont la verite du catalogue courant
- `Cart` est l'etat temporaire
- `Order` est la verite d'un achat
- `Payment` est la verite locale du statut de paiement
- Stripe est le processeur de paiement, pas le catalogue : aucun `Price`/`Product`
  Stripe n'est synchronise ni utilise comme source de verite (`price_data`
  dynamique uniquement)
- Supabase Storage est le stockage prive des fichiers numeriques vendus, pas une
  source de verite metier (`DigitalAsset` et `DownloadGrant` restent la verite)

Stripe ne doit pas etre la seule source necessaire pour reconstituer une commande.

## Strategie Stripe retenue

Pour le MVP, la strategie la plus pragmatique est:

1. garder le flux ebook historique en place le temps de la transition
2. introduire un nouveau checkout generique pour les produits numeriques
3. construire les line items a partir des snapshots locaux
4. journaliser les evenements Stripe en base
5. rendre le traitement idempotent et rejouable

## Politique de prix pour le nouveau checkout

Le catalogue courant vit en base locale via `ProductPrice`.

Pour le checkout MVP, les line items Stripe doivent etre derives du prix local valide cote serveur au moment du checkout.

Consequence:

- le navigateur n'envoie jamais de montant fiable
- le serveur recalcule toutes les lignes
- `Order` et `OrderItem` stockent le snapshot qui fera foi ensuite

Le `STRIPE_PRICE_ID_EBOOK` existant reste utile uniquement pour le tunnel historique tant qu'il n'est pas remplace.

## Flux cible

1. Le client remplit son panier avec des produits `BUY_NOW`.
2. Le serveur relit `Product` et `ProductPrice`.
3. Le serveur verifie les regles panier:
   - pas de `REQUEST_ONLY`
   - pas de produit physique
   - pas d'abonnement
4. Le serveur cree ou met a jour une `Order` en `PENDING_PAYMENT`.
5. Le serveur cree un `Payment` en `PENDING`.
6. Le serveur cree la `checkout.session` Stripe.
7. Stripe redirige le client.
8. Le webhook confirme le paiement.
9. Un job durable cree les `DownloadGrant` et envoie les emails.

## Donnees a envoyer a Stripe

### Obligatoire

- line items
- `mode = payment`
- `success_url`
- `cancel_url`
- email client si connu

### Metadata minimales recommandees

- `orderId`
- `orderNumber`
- `environment`

### A ne pas mettre

- secrets
- snapshots complets sensibles
- informations inutiles pour la reconciliation

## Webhook: politique minimale obligatoire

Le webhook doit:

1. verifier la signature
2. parser l'evenement Stripe
3. enregistrer `StripeEvent` avec un identifiant unique
4. ignorer proprement les doublons
5. mettre a jour `Order` et `Payment` dans une transaction
6. creer un `BackgroundJob` pour les effets de bord
7. repondre rapidement en HTTP

## Pourquoi `after()` ou la memoire ne suffisent pas

Pour les operations critiques, il ne faut pas dependre de:

- stockage memoire
- execution best effort en fin de reponse
- etat local d'une instance serverless

Sur Vercel, ce serait fragile pour:

- l'idempotence
- le rejeu
- les pannes intermediaires
- la reprise apres erreur

## Pattern asynchrone retenu

Pattern MVP documente:

- table `StripeEvent`
- table `BackgroundJob`
- jobs rejouables avec statut et nombre de tentatives

Cette solution reste compatible avec un petit budget et pourra plus tard etre completee par:

- Inngest
- Trigger.dev
- Upstash
- une queue dediee

Mais le MVP ne doit pas en dependre immediatement.

## Evenements Stripe utiles pour le MVP

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Tout autre evenement doit etre soit ignore, soit journalise sans effet metier si inutile.

## Regles de confirmation de paiement

- Une redirection navigateur ne marque jamais seule la commande comme payee.
- Seul un evenement Stripe valide et traite idempotemment peut marquer:
  - `Order` en `PAID`
  - `Payment` en `SUCCEEDED`

## Resilience checkout MVP

Comportement actuellement retenu:

- une `Order` `PENDING_PAYMENT` ne peut pas creer de checkout si elle est deja `PAID`, `CANCELLED` ou `REFUNDED`
- si la `Payment` `PENDING` n'a pas encore de `stripeCheckoutSessionId`, une session Stripe est creee
- si la `Payment` `PENDING` pointe deja vers une session Stripe `open`, l'URL existante est retournee sans creer une seconde session
- si la session Stripe est `complete`, le backend refuse de creer un nouveau checkout et attend la finalisation webhook
- si la session Stripe est `expired`, la `Payment` courante passe en `FAILED`, une nouvelle `Payment` `PENDING` est creee, puis une nouvelle session Stripe est ouverte

Ce choix permet un retry paiement sans migration, tout en conservant l'historique des tentatives.

## Remises et total gratuit

- Stripe ne doit recevoir que le montant final apres remise
- les codes coaching ebook sont stockes et verifies dans Prisma
- le montant de remise reste fige au moment de la creation du code
- si le total final reste superieur a `0`, le checkout Stripe suit le flux normal
- si le total final tombe a `0`, aucune session Stripe n'est creee
- une commande gratuite passe directement en `PAID`
- aucune `Payment STRIPE` a `0` n'est creee

## Regles de remboursement

Pour le MVP:

- un remboursement Stripe doit synchroniser `Payment`
- la commande peut passer en `REFUNDED` si tout est rembourse
- les droits de telechargement peuvent etre revoques si la politique metier le prevoit

### Etat Sprint 8.4

Le dashboard admin permet maintenant un remboursement total manuel et securise:

- vue detail commande admin
- calcul local `refundReadiness`
- confirmation manuelle explicite `REMBOURSER`
- appel `Stripe Refund` serveur avec cle d'idempotence stable `order-refund-full:{orderId}`
- synchronisation locale `Payment -> REFUNDED`
- synchronisation locale `Order -> REFUNDED`
- revocation des `DownloadGrant` actifs associes a la commande

Limites actuelles:

- aucun remboursement partiel
- aucun email client automatique de remboursement
- aucun job de reconciliation si Stripe reussit mais que l'ecriture locale echoue ensuite

## Telechargements et fulfillment

Le webhook ne doit pas lui-meme tout faire.

Il doit surtout:

- confirmer le paiement
- poser un travail durable

Le job de fulfillment numerique devra:

- creer les `DownloadGrant`
- dedupliquer les grants deja existants
- envoyer l'email transactionnel
- enregistrer les erreurs et autoriser le rejeu

## Variables d'environnement Stripe

### Etat Sprint 8.9

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_BASE_URL`

`STRIPE_PRICE_ID_EBOOK` n'est plus necessaire depuis le Sprint 8.9 (legacy
decommissionne) : le nouveau checkout construit ses `line_items` via `price_data`
dynamique, jamais via un `Price` Stripe preexistant.

Optionnel plus tard:

- variable(s) promotionnelles
- configuration facture ou taxe plus avancee

## Compatibilite avec l'existant

Ordre suivi pour la transition:

1. fiabiliser le webhook actuel et sa journalisation — fait
2. ajouter le nouveau checkout generique a cote — fait
3. basculer progressivement les ventes numeriques vers le nouveau domaine `Order` — fait
4. retirer le tunnel historique — fait au Sprint 8.9 cote code applicatif

Point restant hors code : les pages marketing publiques `/ebook` et
`/ebook/cabler-son-van` existent toujours et renvoient desormais vers `/boutique`
au lieu d'ouvrir l'ancien formulaire de paiement direct.

## Editeur Plus

L'editeur de schema utilise Stripe Billing uniquement pour deux prix simples :

- `6,90 EUR / mois`
- `59 EUR / an`

Le Checkout est cree avec un `Price` Stripe recurrent preconfigure. Les
webhooks `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated` et `customer.subscription.deleted` mettent a
jour `EditorSubscription`, la source locale de l'etat de l'abonnement. Une
redirection navigateur ne donne jamais le droit d'acces a elle seule.

Les identifiants de prix sont fournis par les variables serveur :

- `STRIPE_PRICE_ID_SCHEMA_EDITOR_PLUS_MONTHLY`
- `STRIPE_PRICE_ID_SCHEMA_EDITOR_PLUS_YEARLY`

## Ce qui est volontairement reporte

Cette strategie ne traite pas encore:

- les abonnements complexes avec plusieurs sieges ou usage metre
- moyens de livraison
- taxes internationales complexes
- shipping rates

Ces sujets feront l'objet d'une extension future dediee.
