# FabSystem State Machines

## Statut du document

- Date de reference: 2026-08-05
- Portee: etats metier MVP et transitions autorisees

## Regle structurante

Une redirection navigateur apres Stripe Checkout ne marque jamais seule une commande comme payee.

Seul un evenement Stripe valide, verifie et traite de maniere idempotente peut confirmer le paiement.

## `OrderStatus`

Valeurs:

- `DRAFT`
- `PENDING_PAYMENT`
- `PAID`
- `CANCELLED`
- `REFUNDED`

### Sens des etats

- `DRAFT`: commande interne non prete a partir chez Stripe
- `PENDING_PAYMENT`: commande envoyee ou preparee pour paiement
- `PAID`: paiement confirme
- `CANCELLED`: commande abandonnee ou annulee avant paiement final
- `REFUNDED`: commande totalement remboursee

### Transitions autorisees

- `DRAFT` -> `PENDING_PAYMENT`
- `DRAFT` -> `CANCELLED`
- `PENDING_PAYMENT` -> `PAID`
- `PENDING_PAYMENT` -> `CANCELLED`
- `PAID` -> `REFUNDED`

### Transitions interdites

- `PAID` -> `DRAFT`
- `REFUNDED` -> `PAID`
- `CANCELLED` -> `PAID` sans nouvelle commande explicite

## `PaymentStatus`

Valeurs:

- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

### Sens des etats

- `PENDING`: paiement cree localement, non confirme
- `SUCCEEDED`: paiement confirme par Stripe
- `FAILED`: paiement echoue
- `REFUNDED`: remboursement total
- `PARTIALLY_REFUNDED`: remboursement partiel

### Transitions autorisees

- `PENDING` -> `SUCCEEDED`
- `PENDING` -> `FAILED`
- `SUCCEEDED` -> `PARTIALLY_REFUNDED`
- `SUCCEEDED` -> `REFUNDED`
- `PARTIALLY_REFUNDED` -> `REFUNDED`

### Transitions interdites

- `FAILED` -> `SUCCEEDED` sur le meme paiement sans nouvel enregistrement ou nouvelle tentative explicite
- `REFUNDED` -> `SUCCEEDED`

### Regle de retry checkout MVP

- un retry paiement ne reutilise pas une `Payment` deja `FAILED`
- si une session Stripe expire, la `Payment` `PENDING` associee passe en `FAILED`
- une nouvelle tentative cree une nouvelle `Payment` `PENDING`
- `Order` reste `PENDING_PAYMENT` tant qu'aucun webhook valide n'a confirme le paiement

## `FulfillmentStatus`

Pour le MVP numerique, ce statut peut etre porte par `DownloadGrant`.

Valeurs:

- `PENDING`
- `PROCESSING`
- `FULFILLED`
- `FAILED`
- `REVOKED`

### Sens des etats

- `PENDING`: droit pas encore cree ou pas encore pret
- `PROCESSING`: creation de droit ou email en cours
- `FULFILLED`: droit cree et exploitable
- `FAILED`: livraison en erreur
- `REVOKED`: droit retire

### Transitions autorisees

- `PENDING` -> `PROCESSING`
- `PROCESSING` -> `FULFILLED`
- `PROCESSING` -> `FAILED`
- `FAILED` -> `PROCESSING`
- `FULFILLED` -> `REVOKED`

### Transitions interdites

- `REVOKED` -> `FULFILLED` sans nouvelle decision metier explicite

## Scenario nominal

1. `Order = DRAFT`
2. `Order = PENDING_PAYMENT`
3. `Payment = PENDING`
4. webhook valide
5. `Payment = SUCCEEDED`
6. `Order = PAID`
7. `DownloadGrant = PENDING`
8. `DownloadGrant = PROCESSING`
9. `DownloadGrant = FULFILLED`

## Scenario echec fulfillment

1. paiement confirme
2. creation du job de fulfillment
3. `DownloadGrant = PROCESSING`
4. erreur technique
5. `DownloadGrant = FAILED`
6. nouveau job
7. `DownloadGrant = PROCESSING`
8. `DownloadGrant = FULFILLED`

## Scenario remboursement total

1. `Payment = SUCCEEDED`
2. `Order = PAID`
3. remboursement Stripe confirme
4. `Payment = REFUNDED`
5. `Order = REFUNDED`
6. `DownloadGrant` peut passer en `REVOKED` selon la politique metier

## Scenario code coaching

1. `DiscountCode = ACTIVE`
2. panier valide cote serveur
3. total final recalcule apres remise
4. si total `> 0`, `Order = PENDING_PAYMENT` puis Stripe
5. si total `= 0`, `Order = PAID` immediatement
6. `DiscountRedemption` est creee une seule fois
7. `DiscountCode.redeemedCount` est incremente
8. `DownloadGrant = ACTIVE` pour une commande gratuite numerique

## Etat dashboard Sprint 8.4

Le dashboard admin expose maintenant:

- la liste des `Order`
- le detail `Order` + `OrderItem`
- les `Payment`
- les `DownloadGrant`
- une evaluation `refundReadiness`
- une action admin de remboursement total avec confirmation manuelle

Cette action declenche maintenant:

- remboursement total
- `Payment -> REFUNDED`
- `Order -> REFUNDED`
- revocation des `DownloadGrant`

Le remboursement partiel reste hors perimetre a ce stade.
