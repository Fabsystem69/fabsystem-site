# Sprint — Ebook offert, fiches boutique, anti double-vente, panier en drawer

## Mission 1 — Badge "ebook offert" sur les packs

Ajouté sur `components/prestations/PrestationsDistanceOffers.tsx`, juste sous
le prix. Dérivé de `getPrestationsPackDefinitionBySlug(slug).grantsEbookSlug`
— la même source unique déjà utilisée pour l'octroi réel côté webhook — donc
zéro risque de divergence entre ce qui est affiché et ce qui est
effectivement accordé. Amarrage et Camping-car : jamais de badge (vérifié en
HTTP local, aucun texte n'apparaît sur ces cartes).

**Bonus signalé pendant la session** : le badge "Le plus choisi" sur
PASSERELLE a été remplacé par "Recommandé" — l'ancien texte prétendait une
statistique de vente qui n'existe pas encore pour des packs tout juste
lancés, jugé trop superficiel/malhonnête.

## Mission 2 — Pages ebook en boutique

`app/boutique/[slug]/page.tsx` enrichi :
- **Ebook Van** (`ebook-electricite-van`) : couverture `/ebook/couverture.jpg`
  (déjà présente dans le repo, aucune génération) + sommaire des 8 parties,
  repris tel quel depuis `app/ebook/cabler-son-van/page.tsx` (contenu
  existant, rien inventé).
- **Ebook Bateau** (`ebook-electricite-bateau`) : aucun visuel ni contenu
  détaillé équivalent trouvé dans le repo — laissé volontairement sans
  sommaire/couverture plutôt que d'inventer du contenu. Reste fonctionnel
  avec sa description Stripe courte/longue existante.
- Sur les deux fiches (si un pack les inclut) : bandeau "Déjà inclus si tu
  prends un pack Cap, Passerelle ou Grand Large [Van/Bateau]" avec lien vers
  `/prestations#accompagnement-distance`, dérivé de la nouvelle fonction
  `findPrestationsPackIncludingEbook()` (testée).

## Mission 3 — Anti double-vente

Réutilise exclusivement le mécanisme `DownloadGrant` déjà en place (aucune
nouvelle table, aucune vérification par email en dur) :
- Si un client est connecté (`getCustomerSessionFromCookie`, déjà utilisé
  par `/mon-compte`) et possède un grant actif sur l'un des assets de la
  fiche ebook consultée, le bouton d'achat est remplacé par un message
  "Tu as déjà accès à cet ebook via ton pack {nom du pack}" (ou "Tu as déjà
  accès à cet ebook" pour un achat direct antérieur), avec lien vers
  `/mon-compte`.
- Si le client n'est pas connecté ou qu'aucun grant ne correspond, l'achat
  reste possible normalement — aucun blocage sur une supposition.
- Non testé en conditions réelles pour le cas "via pack" : nécessiterait un
  vrai paiement de pack suivi d'une connexion client, hors de portée d'un
  test HTTP simple ; la logique de correspondance (mêmes `assetId`) est en
  revanche directe et déjà exercée par les tests existants du mécanisme
  `DownloadGrant`.

## Mission 4 — Ergonomie /panier

`CheckoutForm.tsx` restructuré : une seule carte à sections divisées
(Récapitulatif / Code promo / Coordonnées / Validation) au lieu de
carte-dans-carte-dans-carte. Ligne code promo : input `flex-1` + bouton,
tous deux `h-11`, alignés `items-stretch`. `CartView.tsx` simplifié
(lignes produits en une ligne compacte nom + prix + retirer, bouton
"Vider le panier" déplacé en en-tête sobre). Bouton de validation passé en
jaune FabSystem (`bg-brand-400`), cohérent avec le reste du site.

## Mission 5 — Panier en drawer

- `lib/client/cart-drawer-context.tsx` : contexte React global
  (`CartDrawerProvider`/`useCartDrawer`), monté dans `app/layout.tsx`.
- `components/cart/CartDrawer.tsx` : drawer latéral, réutilise tel quel
  `CheckoutForm`, `ClearCartButton`, `RemoveCartItemButton` (mêmes routes
  API, même logique de gating formulaire de besoin pour les packs — aucun
  second système panier). Focus trap + Échap, cohérent avec le drawer mobile
  déjà existant dans `Navbar.tsx`.
- Ouverture : clic sur l'icône panier navbar (desktop et mobile) **et**
  automatiquement à l'ajout d'un produit (`AddToCartButton` déclenche un
  nouvel événement `CART_ITEM_ADDED_EVENT`, distinct du `CART_CHANGED_EVENT`
  qui sert uniquement au badge).
- Fermeture automatique à tout changement de route (paiement, clic vers une
  fiche produit, etc.).
- **`/panier` n'a pas été supprimée** : cohérent avec la contrainte
  implicite du projet de ne jamais retirer de route existante. Elle reste un
  repli fonctionnel complet (lien en bas du drawer, accès direct par URL) —
  à signaler si vous préférez la faire disparaître complètement.

## Vérifications (HTTP local, pas de rendu visuel réel — voir note ci-dessous)

- Badge ebook offert présent uniquement sur Cap/Passerelle/Grand Large ×
  Van/Bateau, absent sur Amarrage et Camping-car (vérifié dans le HTML brut).
- `/boutique/ebook-electricite-van` : couverture + sommaire + mention pack
  présents.
- `/boutique/ebook-electricite-bateau` : 404 en local (produit absent de ma
  base de dev, existe en production — cf. sprint précédent) ; le mécanisme
  fonctionnera automatiquement une fois le déploiement en prod.
- `/panier` : ajout d'un pack, récapitulatif et code promo bien alignés sur
  une seule ligne, une seule carte.
- Navbar : icône panier = bouton (aucun `href="/panier"` résiduel), ouvre le
  drawer.
- `npm run build` : toutes les routes précédentes présentes, aucune
  supprimée.

**Limite du test** : aucun outil Chrome/capture d'écran n'est connecté à
cette session (tu avais proposé de le faire ; pas encore actif). Tout ce qui
précède est vérifié par le HTML généré et le code, pas par un rendu visuel
réel. Un vrai audit visuel (alignement pixel, responsive mobile du drawer,
rendu du badge) nécessitera soit ce plugin, soit une vérification manuelle
de ta part une fois déployé.

## Confirmations

- Aucune migration, aucune modification `prisma/schema.prisma`.
- Aucune modification Stripe.
- Aucune route supprimée.
- Aucun contenu inventé (sommaire ebook bateau volontairement absent).
- Pas de `as any`, pas de `@ts-ignore`.

## Résultats des commandes

- `npx prisma generate` ✅ / `npx prisma validate` ✅ (schéma inchangé)
- `npm run lint` ✅
- `npx tsc --noEmit` ✅
- `npm test` ✅ 369/369 (6 nouveaux tests sur `findPrestationsPackIncludingEbook`)
- `npm run build` ✅
