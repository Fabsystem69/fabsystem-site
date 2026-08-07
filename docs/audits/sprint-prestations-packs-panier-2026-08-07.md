# Sprint — Packs Amarrage/Cap/Passerelle/Grand Large dans le panier

## Écart constaté avant de coder

`lib/prestations-pricing.ts` et les "12 produits Stripe live avec metadata
palier/categorie" décrits dans la mission n'existent pas dans ce dépôt :
recherche exhaustive (`grep -rl` sur `amarrage|passerelle|priceId|STRIPE_PRICE`)
sans résultat côté infra. De plus, `.env.example` documente explicitement que
le commerce actuel construit ses line items via `price_data` dynamique,
sans aucun Price Stripe préexistant (le legacy `STRIPE_PRICE_ID_EBOOK` a été
supprimé). Question posée et tranchée par toi avant de commencer : **les
packs sont modélisés comme les ebooks** (catalogue `Product`/`ProductPrice`
existant, Stripe Checkout en `price_data` dynamique) — aucun produit Stripe
n'a été créé, modifié ou consulté.

## Incident de build production (traité en aparté)

Le build Vercel a échoué (`Testimonial does not exist`) parce que la
migration `20260807070850_add_testimonial` d'un sprint précédent n'avait été
appliquée qu'en local, sans étape `prisma migrate deploy` vers la
production. Je n'ai pas les identifiants de la base de production pour
l'appliquer moi-même — la commande à lancer côté production a été indiquée
en cours de conversation. Aucune migration n'a été touchée dans ce sprint.

## Fichiers créés

- `lib/prestations-packs.ts` — source unique : 12 définitions de pack
  (slug, palier, catégorie, prix, ebook associé), table de prix exacte de la
  mission 5, règle d'octroi ebook.
- `lib/prestations-needs.ts` — types et validation Zod du formulaire de
  besoin (partagés client/serveur).
- `lib/client/prestations-needs-storage.ts` — sessionStorage (jamais de
  persistance base) pour ne pas redemander le formulaire après un
  aller-retour Stripe.
- `lib/services/prestations-packs-catalog.ts` — résout les productId réels
  des packs pour la page `/prestations` (tolérant si un pack n'existe pas
  encore en base).
- `lib/services/prestations-notify.ts` — construit et envoie l'email de
  recontact à Fabien.
- `scripts/seed-prestations-packs.ts` — enregistre les 12 packs dans le
  catalogue `Product`/`ProductPrice`/`ProductAsset` (idempotent, pas une
  migration).
- `app/panier/projet/page.tsx` + `components/prestations/PrestationsNeedsForm.tsx`
  — étape "Parlez-nous de votre projet".
- Tests : `tests/prestations-packs.test.ts`, `tests/prestations-notify.test.ts`.

## Fichiers modifiés

- `components/prestations/PrestationsDistanceOffers.tsx` — CTA "Ajouter au
  panier" (ou repli "Voir en boutique" si le pack n'est pas encore en base).
- `components/cart/AddToCartButton.tsx` — label/style personnalisables
  (réutilisé tel quel pour les packs).
- `components/cart/CheckoutForm.tsx` — détecte un pack dans le panier,
  redirige vers `/panier/projet` si le formulaire n'a pas encore été rempli
  pour ce panier.
- `lib/checkout-flow.ts`, `lib/checkout-request.ts`, `app/api/checkout/route.ts`
  — transportent les réponses du formulaire jusqu'à la session Stripe.
- `lib/services/checkout.ts` — **blocage serveur** si un pack est présent
  sans réponses valides ; réponses ajoutées aux metadata Stripe.
- `lib/services/stripe-webhook-commerce.ts` — appelle la notification
  Fabien après paiement confirmé.
- `app/boutique/page.tsx` — exclut les packs de la grille boutique (ils se
  vendent depuis `/prestations`, les ebooks restent inchangés).
- `app/prestations/page.tsx` — résout les productId des packs, `revalidate = 300`.
- `package.json` — script `seed:prestations-packs`.
- `tests/checkout-service.test.ts`, `tests/stripe-webhook-commerce.test.ts` — étendus.

## Mission 1 — Ajout au panier

Chaque CTA de palier appelle désormais `POST /api/cart/items` (via
`AddToCartButton`, déjà utilisé par la boutique ebook — **même store, même
logique**, aucun second système créé). Le badge panier de la navbar se met
à jour via le bus d'événements déjà en place (`notifyCartChanged`). Si un
pack n'a pas encore de `Product` correspondant en base (seed pas encore
lancé dans l'environnement), le bouton retombe sur un lien "Voir en
boutique" plutôt que de casser la page.

## Mission 2 — Formulaire de besoin

- `/panier` → clic "Payer maintenant" : si le panier contient un pack ET
  qu'aucune réponse n'est stockée pour ce panier → redirection vers
  `/panier/projet` (email/nom/code promo conservés en `sessionStorage` le
  temps du détour).
- `/panier/projet` : formulaire à 5 champs (véhicule, description,
  avancement, délai optionnel, autre optionnel). Soumission → réponses
  stockées en `sessionStorage` (jamais en base) → checkout déclenché
  directement, redirection Stripe.
- Panier ebook seul : `hasPack` est faux, aucune redirection, flow
  strictement inchangé.
- Retour depuis Stripe (paiement annulé) : `sessionStorage` survit à
  l'aller-retour dans le même onglet → le formulaire n'est pas redemandé.
- **Blocage serveur réel** (pas seulement l'UX) : `createCheckoutSessionForOrder`
  refuse (400) toute commande contenant un pack sans réponses valides —
  testé explicitement, y compris via appel direct de l'API sans passer par
  la page.

## Mission 3 — Octroi ebook automatique

Aucune ligne de code de grant écrite : le mécanisme `createDownloadGrantsForOrder`
déjà utilisé pour les ebooks (webhook → grant par `ProductAsset` lié) est
**réutilisé tel quel**. Le script de seed lie le `ProductAsset` de l'ebook
van/bateau uniquement aux packs Cap/Passerelle/Grand Large de la catégorie
correspondante — jamais à Amarrage, jamais à camping-car. Règle vérifiée
par test pour les 12 combinaisons (`tests/prestations-packs.test.ts`).

Limite réelle : **aucun produit "ebook bateau" n'existe dans le catalogue**
(seul `ebook-electricite-van` existe). Le seed le cherche par slug
conventionnel `ebook-electricite-bateau` et, s'il est absent, log un
avertissement et n'établit aucun lien — pas d'erreur, pas d'octroi tant que
ce produit n'est pas créé. Achats van : octroi confirmé et testé de bout en
bout via le catalogue local.

## Mission 4 — Notification Fabien

Réutilise l'infra email déjà en place (`lib/server/nodemailer.ts`, la même
que `/api/contact` et les magic links) — `CONTACT_TO` (repli
`fabien.lages@fabsystem.fr`). Déclenchée dans le webhook `checkout.session.completed`,
uniquement si la commande contient au moins un pack. Contient nom/email
client, commande, montant payé, chaque pack (nom, palier, catégorie), et
toutes les réponses du formulaire — lues depuis les **metadata Stripe** de
la session (jamais persistées en base, conformément à la solution
temporaire acceptée). Appelée aussi sur une redelivery webhook déjà traitée
(`already_processed`) pour ne jamais perdre silencieusement la
notification si un envoi précédent avait échoué — risque accepté : un
doublon d'email possible dans ce cas rare, documenté.

## Limitations et proposition de migration (non appliquée)

1. **Réponses du formulaire non persistées** (solution temporaire demandée) :
   elles ne sont donc visibles que dans l'email envoyé à Fabien, jamais dans
   le dashboard commandes. Si souhaité, proposition : un modèle
   `PrestationsProjectBrief` (orderId unique, vehicle, description,
   progress, deadline, other) — migration additive, à valider avant
   application.
2. **`productType: DIGITAL_DOWNLOAD` réutilisé pour les packs** faute d'un
   type "pack/service" dédié (en ajouter un nécessiterait une migration
   d'enum `ProductType`) — purement cosmétique côté admin catalogue,
   n'affecte aucun comportement.
3. **Codes de réduction sur un pack à 0€** : dans ce cas précis, le flux
   actuel ne passe jamais par `/api/checkout` (commande gratuite immédiate),
   donc le blocage formulaire ne s'applique pas. Cas non couvert par la
   mission, signalé par prudence.
4. **Ebook bateau** : produit à créer dans le catalogue avant que l'octroi
   automatique catégorie bateau soit effectif (voir ci-dessus).
5. **Script de seed non exécuté en production** : `npm run seed:prestations-packs`
   a été lancé et vérifié sur la base de développement locale uniquement.
   À exécuter contre la production après validation, comme pour toute
   migration.

## Vérifications

- Ajout panier pack seul / ebook seul / mix : couvert par la logique
  `isPrestationsPackSlug` (testée) + réutilisation du panier existant.
- Blocage paiement pack sans formulaire : testé (`checkout-service.test.ts`).
- Amarrage → aucun ebook, Cap/Passerelle/Grand Large van → ebook van,
  bateau → ebook bateau (si le produit existe), camping-car → jamais :
  testé pour les 12 combinaisons.
- Retour Stripe sans re-demander le formulaire : conçu et revu
  manuellement (sessionStorage clé par cartId) ; **non vérifié en conditions
  réelles via navigateur** (voir ci-dessous).
- Email notification : testé unitairement (contenu, déclenchement sur pack
  uniquement, absence sur commande ebook seule).

### Test HTTP de bout en bout — exécuté (retenté avec succès)

Ton `npm run dev` n'était plus actif ; j'ai relancé un serveur local
(`npm run seed:prestations-packs` puis `npm run dev`) et testé en HTTP réel
contre `localhost:3000` :

| Cas | Résultat |
| --- | --- |
| `GET /prestations` | 200, les 12 packs résolus avec un vrai `productId`, 0 repli "Voir en boutique" |
| Ajout pack seul au panier (`POST /api/cart/items`) | 200, panier avec le bon prix (Amarrage/Van = 89,00 €) |
| Ajout ebook seul (nouveau panier) | 200, inchangé |
| Panier mixte pack + ebook | 200, les deux lignes présentes, total correct (349 € + 29 € = 378 €) |
| `POST /api/checkout` sur commande **pack seul, sans formulaire** | **400** `"Le formulaire de projet est requis..."` — bloqué |
| `POST /api/checkout` sur commande **mixte pack+ebook, sans formulaire** | **400**, même blocage — confirmé même avec un ebook dans le même panier |
| `POST /api/checkout` sur commande **ebook seul, sans formulaire** | Pas de blocage métier — passe la validation, échoue ensuite uniquement sur l'appel Stripe (voir ci-dessous) |
| `POST /api/checkout` sur commande **pack + formulaire rempli** | Passe la validation serveur, atteint l'appel Stripe réel |
| `GET /panier` (panier non converti) | 200, affiche le pack ajouté avec son nom et son prix, bouton "Payer maintenant" présent |
| `GET /boutique` | 200, uniquement l'ebook, aucun pack — exclusion confirmée |
| `GET /dashboard/content/testimonials` sans session | 307 (redirection auth normale) — **pas** d'erreur "Testimonial does not exist" : le Prisma Client local est à jour |

**Seul point non atteignable** : l'appel Stripe réel échoue avec
`Error: Expired API Key provided: sk_live_***...j5wUSW` — la clé Stripe
configurée dans l'environnement local a expiré. C'est un problème
d'environnement, pas un bug : l'erreur survient *après* que la validation
serveur (formulaire requis, montants, devise) ait été franchie avec succès,
donc tout le pipeline applicatif jusqu'à la frontière Stripe est vérifié.
Je n'ai pas touché à cette clé (hors scope : "ne pas toucher à Stripe").

**Non testé en conditions réelles** : le comportement JavaScript de
`/panier/projet` (redirection automatique si pas de pack ou pas
d'inputs en attente, lecture/écriture `sessionStorage`, "ne pas
redemander le formulaire après retour Stripe") — ceci nécessite un vrai
navigateur avec JS exécuté ; curl ne peut valider que le rendu HTML initial
(200, formulaire présent). Revu manuellement en détail à l'écriture, mais
recommandé de le confirmer une fois en navigateur avant mise en prod.

Serveur de test arrêté et fichiers temporaires nettoyés après validation.

## Confirmations

- Aucune migration créée ni appliquée.
- Aucune modification de `prisma/schema.prisma`.
- Aucune modification, création ou lecture de produit/prix Stripe.
- Aucune route supprimée ; flow ebook boutique inchangé (vérifié par les
  tests existants, tous toujours au vert).
- Pas de `as any`, pas de `@ts-ignore`, pas de désactivation TypeScript.

## Résultats des commandes

- `npx prisma generate` ✅ / `npx prisma validate` ✅ (schéma inchangé)
- `npm run lint` ✅
- `npx tsc --noEmit` ✅
- `npm test` ✅ 366/366
- `npm run build` ✅ — toutes les routes précédentes présentes, plus
  `/panier/projet` ; `/prestations` en ISR (revalidate 5 min)
