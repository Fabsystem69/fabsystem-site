# Refonte /prestations — audit témoignages et proposition Testimonial

## Audit

Aucun modèle `Testimonial` (ou équivalent) n'existe dans `prisma/schema.prisma`.
Aucune table d'avis clients n'est présente en base.

La page `/prestations` contenait, avant cette mission, une section "Ce
qu'ils en disent" avec trois témoignages **codés en dur** dans le fichier
(`Pascal M.`, `Isabelle & François`, `Thierry D.`) — aucune trace de ces
avis dans une base de données, un CMS, ou un export externe. Impossible de
confirmer qu'il s'agit d'avis clients réels et vérifiés plutôt que de
contenu de démonstration laissé par un développement antérieur.

**Décision prise dans cette mission** : conformément à la consigne "ne pas
inventer de faux témoignages", cette section a été retirée et remplacée par
un emplacement sobre ("Avis clients — Bientôt ici") sans aucun avis
affiché, en attendant soit la confirmation que ces témoignages sont réels
(auquel cas ils pourront être réintégrés tels quels, sans modèle), soit la
mise en place du modèle ci-dessous avec de vrais avis.

## Proposition de migration (non appliquée)

```prisma
enum TestimonialCustomerType {
  VAN
  CAMPING_CAR
  BOAT
  OTHER
}

model Testimonial {
  id                  String                   @id @default(cuid())
  displayName         String
  customerType        TestimonialCustomerType  @default(OTHER)
  vehicleModel        String?
  region              String?
  rating              Int
  quote               String
  relatedOffer        String?
  isVerifiedPurchase  Boolean                  @default(false)
  isPublished         Boolean                  @default(false)
  isFeatured          Boolean                  @default(false)
  displayOrder        Int                      @default(0)
  createdAt           DateTime                 @default(now())
  updatedAt           DateTime                 @updatedAt

  @@index([isPublished])
  @@index([displayOrder])
}
```

Notes :
- `isPublished` par défaut à `false` : rien ne s'affiche tant qu'un admin ne
  valide pas explicitement l'avis — évite toute publication accidentelle.
- Table additive, aucune relation obligatoire vers `Order`/`Customer` (un
  avis peut être saisi manuellement sans lien direct avec une commande),
  ce qui garde la migration simple et sans risque sur les données
  existantes.
- `relatedOffer` en `String?` libre (ex. "PASSERELLE", "Refit 12V") plutôt
  qu'une relation stricte vers un futur modèle d'offres, pour rester simple
  tant que les packs eux-mêmes ne sont pas en base (voir Stripe, mission
  séparée).

## Dashboard admin proposé (non codé)

`/dashboard/content/testimonials` — liste, création, édition, publier/
masquer (`isPublished`), mettre en avant (`isFeatured`), réordonner
(`displayOrder`), suppression réservée aux avis jamais publiés (sinon
préférer masquer, pour garder une trace).

**Ce dashboard n'a pas été codé dans cette mission** : il dépend du modèle
`Testimonial`, qui n'existe pas encore. À construire une fois la migration
validée et appliquée.

**Cette migration n'a pas été créée ni appliquée.** À valider avant
exécution de `prisma migrate dev`.
