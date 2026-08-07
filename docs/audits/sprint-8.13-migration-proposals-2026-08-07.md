# Sprint 8.13 — Propositions de migration (non appliquées)

Ce document couvre les deux points de la mission Sprint 8.13 qui touchent au
schéma Prisma. Aucune migration n'a été créée ni appliquée : ce sont des
propositions en attente de validation.

## 1. Coupons configurables

### Ce qui est déjà supporté par le modèle actuel, sans migration

Le modèle `DiscountCode` (voir `prisma/schema.prisma`) couvre déjà la
majorité des besoins listés dans la mission :

| Besoin mission                          | Champ existant                         |
| ---------------------------------------- | --------------------------------------- |
| Montant fixe                             | `amountOffCents` + `type: FIXED_AMOUNT` |
| Pourcentage                              | `percentOff` + `type: PERCENTAGE`       |
| Nombre d'utilisations total              | `maxRedemptions` / `redeemedCount`      |
| Produit ciblé ou tous produits           | `productId` nullable                    |
| Réservé à un email ou ouvert à tous      | `customerEmail` nullable                |
| Date de début                            | `startsAt`                              |
| Date d'expiration                        | `expiresAt`                             |
| Statut actif/inactif                     | `status` (`ACTIVE` / `DISABLED` / `EXPIRED`) |
| Description interne                      | `reason`                                |

Ces champs sont exploités par `lib/services/discounts.ts`. **Rien n'a été codé
dans ce sprint pour les exposer dans une UI d'admin générique** : le formulaire
actuel (`app/dashboard/discounts/new`) reste volontairement restreint au cas
d'usage "code coaching ebook" (100% du prix, un seul usage, un email, deux
mois) — c'est un choix produit existant, pas une limite technique. Construire
un formulaire générique qui expose tous ces champs est faisable sans migration
et peut être fait dans un sprint dédié si validé.

### Ce qui manque réellement (nécessite une migration)

Le point non couvert : **« nombre d'utilisations par client/email »** en tant
que paramètre *configurable par coupon*, distinct du `maxRedemptions` global.
Aujourd'hui, un coupon ouvert à tous n'a aucune limite par acheteur individuel
(seul le total `maxRedemptions` compte, et `customerEmail` restreint le
coupon à un seul email s'il est renseigné — ce n'est pas un plafond
"N utilisations par client").

Proposition de migration (non appliquée) :

```prisma
model DiscountCode {
  // ... champs existants inchangés ...
  maxRedemptionsPerCustomer Int? // null = pas de plafond par client
}
```

- Colonne nullable, valeur par défaut `null` → aucun changement de
  comportement pour les coupons existants.
- Application : dans `lib/services/discounts.ts`, la validation compterait
  les lignes `DiscountRedemption` existantes pour `(discountCodeId,
  customerEmail)` et comparerait au plafond si défini.
- Aucune donnée existante à migrer, `expand`/`contract` non nécessaire.

**Cette migration n'a pas été créée.** À valider avant exécution de
`prisma migrate dev`.

## 2. EventTracking (statistiques de clics)

Aucun modèle de tracking d'événements n'existe actuellement. Les statistiques
livrées dans ce sprint (voir `/dashboard`) sont calculées uniquement à partir
des données transactionnelles déjà en base (`Order`, `Payment`,
`DiscountRedemption`, `DownloadGrant`) : achats, CA, coupons utilisés,
téléchargements approximatifs. Les événements de type `view_boutique`,
`view_product`, `add_to_cart`, `apply_discount`, `click_checkout`,
`download_clicked`, `home_to_boutique_click` ne sont pas trackés et ne
peuvent pas l'être sans nouvelle table.

Proposition de modèle (non appliquée) :

```prisma
model EventTracking {
  id            String   @id @default(cuid())
  eventType     String   // view_boutique | view_product | add_to_cart | apply_discount
                          // | click_checkout | order_created | download_clicked
                          // | home_to_boutique_click
  productId     String?
  orderId       String?
  customerEmail String?
  sessionId     String?
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([eventType])
  @@index([createdAt])
  @@index([productId])
}
```

Notes :
- Table additive, aucune relation obligatoire vers des tables existantes
  (FK optionnelles ou absentes) pour rester simple à instrumenter côté
  client/serveur sans risque de casser le tunnel existant.
- Volume : à surveiller si le trafic augmente (prévoir purge/agrégation
  périodique plus tard, hors scope de la migration initiale).
- Une fois validée, l'instrumentation se ferait progressivement (un event à
  la fois) sans bloquer le reste du site.

**Ce modèle n'a pas été créé.** À valider avant exécution de
`prisma migrate dev`.

## Limitation actuelle des statistiques "téléchargements du mois"

En l'absence d'`EventTracking`, la carte "Téléchargements ce mois" du
dashboard (`lib/services/ecommerce-stats.ts`) compte le nombre de
`DownloadGrant` dont `lastDownloadedAt` tombe ce mois-ci — c'est une
approximation du nombre de *grants touchés*, pas un compteur de clics réel
(un même grant téléchargé 3 fois ce mois ne compte que pour 1). Un événement
`download_clicked` dans `EventTracking` donnerait un chiffre exact.
