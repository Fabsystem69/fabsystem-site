# État des lieux — Module codes de réduction (2026-08-08)

Audit réalisé avant toute décision d'évolution. Aucune modification de code associée à ce document — pur état des lieux.

## 1. Schéma Prisma `DiscountCode` et `DiscountRedemption`

`prisma/schema.prisma:526-570`

```prisma
model DiscountCode {
  id              String               @id @default(cuid())
  code            String               @unique
  status          DiscountCodeStatus   @default(ACTIVE)   // ACTIVE | DISABLED | EXPIRED
  type            DiscountCodeType                          // FIXED_AMOUNT | PERCENTAGE
  amountOffCents  Int?
  percentOff      Int?
  currency        String               @default("EUR")
  maxRedemptions  Int                  @default(1)
  redeemedCount   Int                  @default(0)
  startsAt        DateTime?
  expiresAt       DateTime?
  productId       String?
  customerEmail   String?
  reason          String?
  product         Product?             @relation(...)
  orders          Order[]
  redemptions     DiscountRedemption[]
  createdAt / updatedAt

  @@index([status]) @@index([productId]) @@index([customerEmail]) @@index([expiresAt])
}

model DiscountRedemption {
  id, discountCodeId, orderId, customerEmail,
  productId, amountDiscountedCents, redeemedAt
  @@unique([discountCodeId, orderId])   // 1 code ne peut être redeemed qu'une fois par commande
}
```

**Point important : le schéma est déjà générique et flexible.** `type` (FIXED_AMOUNT/PERCENTAGE), `percentOff`, `maxRedemptions`, `startsAt`/`expiresAt`, `productId` et `customerEmail` nullable existent déjà en base. Rien dans le schéma n'impose les contraintes actuelles (montant figé, 1 usage, 2 mois, ebooks uniquement) — ce sont **des choix faits dans une seule fonction métier**, pas des limites du modèle de données.

## 2. Pourquoi le montant est figé au prix de l'ebook

`lib/services/discounts.ts:343-377` — `createCoachingEbookDiscountCode()` :

```ts
const activePrice = assertSingleActivePrice(await db.findActivePricesByProductId(product.id));
...
return db.createDiscountCode({
  ...
  type: "FIXED_AMOUNT",
  amountOffCents: activePrice.unitAmountCents,   // le prix actif de l'ebook, en dur
  percentOff: null,
  maxRedemptions: 1,                             // en dur
  expiresAt: addMonths(createdAt, 2),             // en dur
  ...
});
```

C'est **la seule fonction de création de code qui existe** (appelée par la seule action dashboard `createCoachingDiscountAction`). Elle a été conçue pour un cas unique : "offrir l'ebook en avance de l'accompagnement, remboursé ensuite en le rendant gratuit". Le formulaire dashboard (`app/dashboard/discounts/new/page.tsx`) ne propose même pas de champ montant — juste email, ebook, raison. Le texte affiché à l'admin le dit explicitement : *"Le montant de remise est figé à partir du prix actif actuel de l'ebook, pour deux mois, avec un seul usage."*

## 3. Pourquoi seuls les ebooks sont ciblables

Deux verrous, tous deux dans le code métier (pas dans le schéma) :

- `lib/services/discounts.ts:173-183` — `assertCoachingProduct()` lève une erreur si `product.productType !== "EBOOK"`.
- `app/dashboard/discounts/new/page.tsx:14` — le `<select>` filtre `products.filter(p => p.productType === "EBOOK")`.

Les packs `/prestations` utilisent `productType: "DIGITAL_DOWNLOAD"` (réutilisation de l'enum existant faute de type dédié — voir `scripts/seed-prestations-packs.ts:57-60`), donc ils sont mécaniquement exclus par ce check. Rien d'architectural : `DiscountCode.productId` pointe vers n'importe quel `Product`, packs inclus.

## 4. Usage de l'email client

**Obligatoire, à deux niveaux différents :**

- **Comme identité de la commande** : `validateDiscountCodeForCartInputSchema` et `createOrderFromCartInputSchema` exigent tous les deux un `customerEmail` au format email (`lib/services/discounts.ts:25-29`) — impossible d'appeler la validation d'un code sans email, même si le code lui-même n'est restreint à personne.
- **Comme restriction optionnelle du code** : si `discountCode.customerEmail` est renseigné à la création, `lib/services/discounts.ts:409-414` vérifie que l'email saisi au panier correspond exactement (normalisé). Si `customerEmail` est `null` sur le code, n'importe quel email passe (affiché "Tous" dans le dashboard).

Aujourd'hui, la seule voie de création (coaching) force toujours un email — donc en pratique tous les codes existants sont nominatifs, mais ce n'est pas une contrainte du modèle.

## 5. Pourquoi 1 usage

Pas une contrainte technique — juste `maxRedemptions: 1` en dur dans `createCoachingEbookDiscountCode` (voir point 2). La logique de vérification (`lib/services/discounts.ts:405-407` et dupliquée dans `lib/services/order.ts:334-336`) compare `redeemedCount >= maxRedemptions` — générique, fonctionnerait avec n'importe quel entier. Le dashboard affiche déjà `redeemedCount / maxRedemptions` (`app/dashboard/discounts/page.tsx:86-88`), prêt pour un usage multiple.

## 6. Durée de validité de 2 mois

En dur également : `expiresAt: addMonths(createdAt, 2)` (`lib/services/discounts.ts:372`, fonction `addMonths` définie ligne 124-128). Le statut `EXPIRED` de l'enum n'est en réalité **jamais écrit en base** — aucune occurrence dans le code métier (contrairement à `EXPIRED` sur `MagicLoginToken` ou `DownloadGrant` qui, eux, sont vraiment mis à jour). L'expiration est purement calculée à la volée en comparant `expiresAt` à `Date.now()` au moment de la validation (`lib/services/discounts.ts:401-403` et `lib/services/order.ts:330-332`). Le dashboard affiche "Jamais" si `expiresAt` est `null` — une durée illimitée est déjà supportée par le modèle, juste jamais produite par le seul créateur de code existant.

## 7. Flow complet de validation sur `/panier`

Il y a **deux implémentations parallèles et redondantes** de la même logique de calcul de remise :

**A. Preview en direct (aperçu, ne touche pas la base)**
`CheckoutForm.tsx` → bouton "Appliquer" → `POST /api/cart/discounts/validate` (`app/api/cart/discounts/validate/route.ts`) → `applyDiscountToCartSummary()` → `validateDiscountCodeForCart()` dans `lib/services/discounts.ts:379-468`. Calcule `subtotalCents`/`discountTotalCents`/`totalCents` à partir des lignes du panier, **sans rien écrire en base**. Sert uniquement à mettre à jour l'affichage du récapitulatif.

**B. Application réelle (au moment de la commande)**
Au submit, `createCheckoutFromCart()` (`lib/checkout-flow.ts`) → `POST /api/orders` → `createOrderFromCart()` dans `lib/services/order.ts:584-699` :
- ré-exécute **une deuxième fois**, indépendamment, toutes les validations du code (`prepareDiscountForOrder()`, lignes 302-371 — logique quasi identique à `validateDiscountCodeForCart` mais dupliquée, pas partagée)
- calcule `order.totalCents = subtotal - discount`, stocké sur la commande
- **incrémente `redeemedCount` et crée le `DiscountRedemption`** dans la même transaction Prisma que la création de commande (lignes 680-698) — c'est ici, et seulement ici, que l'usage est consommé
- si `totalCents === 0` → commande directement `status: "PAID"`, grants de téléchargement créés immédiatement, **aucun passage par Stripe**
- si `totalCents > 0` → commande `status: "PENDING_PAYMENT"`, un `Payment` `PENDING` est créé pour `amountCents: totalCents`

**Ce qui se passe côté Stripe — point critique :**
`POST /api/checkout` → `createCheckoutSessionForOrder()` → `buildCheckoutSessionParams()` dans `lib/services/checkout.ts:124-154` :

```ts
line_items: order.items.map((item) => ({
  price_data: { ..., unit_amount: item.unitAmountCents },  // prix PLEIN de chaque item
  quantity: item.quantity,
})),
```

**Le prix envoyé à Stripe est reconstruit ligne par ligne à partir du prix plein de chaque `OrderItem`, jamais depuis `order.totalCents` ou `order.discountTotalCents`.** Aucun paramètre `discounts`/`coupon` Stripe nulle part dans le fichier. Ça ne pose aucun problème aujourd'hui uniquement parce que le seul type de code existant (COACH-) couvre toujours 100% du prix d'un panier à un seul ebook → `totalCents` tombe systématiquement à 0 → la branche "commande gratuite" s'applique et **on ne passe jamais par Stripe checkout**.

## 8. Limitations pour faire évoluer le module

| Évolution souhaitée | Ce qui bloque aujourd'hui | Complexité |
|---|---|---|
| Montant libre (fixe ou %) | Rien dans le schéma. Juste exposer `type`/`amountOffCents`/`percentOff` dans le formulaire dashboard au lieu de les calculer automatiquement. | Faible |
| Cibler les packs prestations | Juste retirer/assouplir `assertCoachingProduct()` et le filtre `productType === "EBOOK"` du formulaire. Le modèle et `validateDiscountCodeForCart`/`prepareDiscountForOrder` gèrent déjà `productId` générique. | Faible |
| Email optionnel | Le schéma le permet déjà (`customerEmail String?`, déjà géré comme "Tous" partout en lecture). Il faudrait rendre le champ optionnel dans le formulaire de création + adapter `createCoachingEbookDiscountCodeInputSchema` (actuellement `.email()` requis) et la validation panier (qui exige aussi un email pour appeler l'API, même pour un code non-nominatif). | Faible-moyen |
| Limite d'usage configurable | Juste exposer `maxRedemptions` dans le formulaire. Toute la logique de comptage est déjà générique. | Faible |
| Durée configurable | Juste exposer `startsAt`/`expiresAt` dans le formulaire au lieu du calcul `addMonths(createdAt, 2)`. | Faible |
| Remise partielle avec paiement Stripe du reste | **Le vrai point dur.** `buildCheckoutSessionParams()` ignore totalement la remise et reconstruit les `line_items` au prix plein. Dès qu'un code ne couvre pas 100% d'un panier (ex : 20% sur un pack à 300€, ou -49€ sur un panier à 150€), Stripe facturera le montant plein, pas `order.totalCents`. Il faudra soit répercuter la remise sur les `unit_amount` des lignes (proratisée entre les lignes si plusieurs produits), soit utiliser un `discounts: [{ coupon }]` Stripe créé dynamiquement. **Personne n'a jamais testé ce chemin** puisqu'il n'a jamais été emprunté. | Élevée |
| Logique dupliquée | `validateDiscountCodeForCart` (`discounts.ts`) et `prepareDiscountForOrder` (`order.ts`) réimplémentent séparément les mêmes règles (statut, dates, usage, email, devise, produit). Toute évolution des règles de validation doit être répliquée aux deux endroits, sinon l'aperçu panier et la validation réelle à la commande divergent. | — (dette à surveiller) |

## Résumé

Le modèle de données et la couche de lecture (dashboard, validation panier) sont déjà quasi prêts pour la plupart des évolutions envisagées — c'est la couche de *création* (une seule fonction rigide, un seul formulaire) qui est volontairement restreinte au cas d'usage "coaching ebook". Le seul vrai risque technique à anticiper est le lien Stripe : tant qu'un code ne couvre pas 100% du panier, le paiement Stripe facturera le mauvais montant en l'état actuel du code.
