# Audit e-commerce FabSystem — 2026-08-06

## Verdict global

Note sur 100 :

- architecture : 82/100
- sécurité : 74/100
- robustesse paiement : 78/100
- expérience client : 52/100
- readiness production : 61/100

Note globale : 69/100

Verdict :

Le socle serveur du commerce numérique est déjà sérieux :

- le catalogue, le panier, la commande, le paiement Stripe, les grants et l’espace client existent ;
- les sources de vérité principales sont plutôt claires (`Product`, `Cart`, `Order`, `Payment`, `DownloadGrant`, `Customer`) ;
- les services sont bien découpés et largement couverts par des tests unitaires.

En revanche, le parcours client réellement exploitable présente encore des ruptures majeures :

- le lien magique client pointe vers une URL non servie ;
- le checkout Stripe commerce existe côté API mais n’est pas branché dans l’UI publique actuelle ;
- la page merci et la route de téléchargement ne racontent plus exactement la même histoire produit depuis le durcissement par session.

Le moteur n’est donc pas loin d’un MVP exploitable, mais le parcours “client réel de bout en bout” n’est pas encore suffisamment fiable pour une mise en production commerce sans correctifs ciblés.

## Parcours complet audité

### 1. `/boutique`

Le catalogue public existe bien via :

- `app/boutique/page.tsx`
- `app/boutique/[slug]/page.tsx`
- `lib/services/catalog.ts`

Points observés :

- seuls les produits `ACTIVE` + `BUY_NOW` sont exposés ;
- le prix actif est relu côté serveur ;
- `notFound()` est bien utilisé pour les slugs absents ou non achetables.

### 2. Fiche produit -> ajout panier

Le bouton `Ajouter au panier` existe via :

- `components/cart/AddToCartButton.tsx`
- `app/api/cart/items/route.ts`
- `lib/services/cart.ts`

Points observés :

- le client n’envoie ni montant ni quantité ;
- le service recalcule les règles d’éligibilité ;
- les doublons sont évités ;
- la quantité reste forcée à `1`.

### 3. `/panier`

Le panier public existe via :

- `app/panier/page.tsx`
- `components/cart/CartView.tsx`
- `app/api/cart/route.ts`
- `app/api/cart/items/[productId]/route.ts`

Points observés :

- le résumé est recalculé côté serveur ;
- la suppression est idempotente ;
- le panier anonyme est bien porté par le cookie `fabsystem_cart`.

Rupture actuelle :

- l’UI affiche encore “Paiement bientôt disponible” alors que le backend commerce possède déjà `POST /api/orders` et `POST /api/checkout`.

### 4. Création de commande

La route interne existe via :

- `app/api/orders/route.ts`
- `lib/services/order.ts`

Points observés :

- `Order` est créée en `PENDING_PAYMENT` ;
- `Payment` est créée en `PENDING` ;
- le panier est marqué `CONVERTED` ;
- `Customer` est créé ou réutilisé dans la même transaction.

### 5. Checkout Stripe

Le checkout commerce existe via :

- `app/api/checkout/route.ts`
- `lib/services/checkout.ts`
- `lib/server/stripe.ts`

Points observés :

- les line items Stripe sont construits depuis les snapshots `OrderItem` ;
- la `checkout.session` reçoit les metadata `orderId`, `orderNumber`, `paymentId` ;
- le backend empêche de recréer un checkout sur une `Payment` ayant déjà un `stripeCheckoutSessionId`.

Rupture actuelle :

- ce checkout n’est pas branché dans l’UI publique commerce au moment de l’audit.

### 6. Webhook Stripe commerce

Le webhook partagé existe via :

- `app/api/stripe/webhook/route.ts`
- `lib/services/stripe-webhook-commerce.ts`

Points observés :

- la signature Stripe est vérifiée sur le corps brut ;
- le routage commerce vs legacy se fait par metadata ;
- `payment_status === "paid"` est explicitement vérifié ;
- les mismatches metadata / amount / currency sont refusés ;
- `Payment` passe à `SUCCEEDED` et `Order` à `PAID` dans une transaction ;
- `DownloadGrant` est créée ensuite de façon rejouable.

### 7. Téléchargements

Le flux download commerce existe via :

- `lib/services/download-grant.ts`
- `lib/services/download-access.ts`
- `app/api/downloads/[grantId]/route.ts`
- `lib/server/supabase-storage.ts`

Points observés :

- aucun lien signé n’est stocké en base ;
- le bucket Supabase privé est vérifié ;
- le grant doit être `ACTIVE` ;
- la commande doit être `PAID` ;
- l’asset doit être `ACTIVE` et `SUPABASE` ;
- l’accès est maintenant lié à la session client et à la propriété de la commande.

### 8. Connexion client

Le système de login existe via :

- `lib/services/customer-auth.ts`
- `lib/services/customer-auth-request-link.ts`
- `lib/services/customer-email.ts`
- `app/api/client-auth/*`

Points observés :

- token brut jamais stocké en base ;
- seul le hash SHA-256 est stocké ;
- session client dédiée via cookie `fabsystem_customer_session`.

Rupture actuelle :

- le magic link est généré vers `/connexion-client/verification?token=...` ;
- aucune route ni page `app/connexion-client/verification/*` n’existe ;
- la route réelle de consommation est `GET /api/client-auth/verify`.

### 9. `/mon-compte`

La page existe via :

- `app/mon-compte/page.tsx`
- `lib/services/customer-account.ts`
- `components/customer/CustomerAccountShell.tsx`

Points observés :

- redirection vers `/connexion-client` si session absente ;
- récupération des commandes par `customerId`, avec fallback temporaire par `customerEmail` ;
- les téléchargements visibles excluent les grants `REVOKED` et `EXPIRED`.

### 10. Peut-on récupérer un achat sans manipulation technique ?

Pas encore de façon fiable pour un client réel.

Aujourd’hui :

- le compte client existe ;
- les téléchargements sécurisés existent ;
- mais le lien magique email ne cible pas la bonne URL ;
- et le checkout commerce n’est pas branché publiquement depuis le panier.

## Points solides

- Le modèle de données commerce est cohérent et suffisamment modulaire pour le MVP numérique.
- Les services serveur sont bien isolés par domaine : catalogue, panier, commande, checkout, webhook, auth client, téléchargement.
- Le panier et la commande ne font pas confiance au client pour les prix.
- Le webhook commerce vérifie la signature Stripe, les metadata, le montant et la devise.
- `DownloadGrant` est correctement séparé du stockage physique Supabase.
- La route download ne renvoie pas d’URL signée directement au client avant contrôle serveur.
- La séparation legacy ebook / nouveau commerce est globalement bonne.
- Le runtime Prisma applicatif est stabilisé sur le client généré local.
- La couverture de tests service est déjà large et utile.

## Risques critiques

### 1. Le magic link client pointe vers une URL non servie

- description : le lien généré par `lib/services/customer-auth.ts` cible `/connexion-client/verification?token=...`, mais aucune page ni route correspondante n’existe ; la route réelle est `GET /api/client-auth/verify`.
- fichier(s) concerné(s) :
  - `lib/services/customer-auth.ts`
  - `app/api/client-auth/verify/route.ts`
  - `app/connexion-client/page.tsx`
- impact : un client recevant l’email ne peut probablement pas se connecter via le lien magique réel.
- recommandation : unifier immédiatement l’URL émise et l’endpoint réellement servi, idéalement via une page `/connexion-client/verification` qui consomme le token côté serveur ou redirige proprement vers la route API réelle.
- priorité : P0 avant ouverture réelle du compte client.

### 2. Le checkout commerce n’est pas exposé dans l’UI publique actuelle

- description : le backend possède `POST /api/orders` et `POST /api/checkout`, mais `components/cart/CartView.tsx` affiche encore un état désactivé “Paiement bientôt disponible”.
- fichier(s) concerné(s) :
  - `components/cart/CartView.tsx`
  - `app/panier/page.tsx`
  - `app/api/orders/route.ts`
  - `app/api/checkout/route.ts`
- impact : le parcours commerce public est interrompu avant le paiement ; le moteur existe, mais le client ne peut pas l’utiliser.
- recommandation : brancher le parcours `/panier -> create order -> create checkout -> redirect Stripe` avec gestion d’erreurs minimale.
- priorité : P0 avant toute communication ou trafic réel sur la nouvelle boutique.

## Risques importants

### 1. La page merci n’est plus alignée avec la sécurité actuelle des téléchargements

- description : `app/commande/merci/page.tsx` affiche des boutons “Télécharger”, mais `GET /api/downloads/[grantId]` exige désormais une session client authentifiée.
- fichier(s) concerné(s) :
  - `app/commande/merci/page.tsx`
  - `app/api/downloads/[grantId]/route.ts`
- impact : après paiement, un client peut voir une page laissant penser que le téléchargement est immédiat alors qu’un login client est requis ; fort risque de confusion support.
- recommandation : soit afficher un CTA clair vers `/connexion-client` / `/mon-compte`, soit documenter explicitement que l’accès passe maintenant par le compte client.
- priorité : P1.

### 2. Le projet documente `StripeEvent` et `BackgroundJob`, mais le runtime ne les implémente pas

- description : `docs/11-SOURCE-OF-TRUTH.md` et `docs/04-STRIPE.md` présentent `StripeEvent` et `BackgroundJob` comme références cibles, mais ni le schéma Prisma ni le webhook actuel ne les portent.
- fichier(s) concerné(s) :
  - `docs/11-SOURCE-OF-TRUTH.md`
  - `docs/04-STRIPE.md`
  - `prisma/schema.prisma`
  - `lib/services/stripe-webhook-commerce.ts`
- impact : l’idempotence actuelle repose sur l’état `Payment` / `Order`, ce qui est correct pour le MVP, mais il n’existe ni journal métier durable des événements Stripe ni file de rattrapage asynchrone explicite.
- recommandation : soit réduire la documentation à l’existant MVP, soit implémenter réellement `StripeEvent` et un mécanisme de job durable avant une montée en charge.
- priorité : P1.

### 3. Pas de rate limiting visible sur les nouveaux endpoints commerce sensibles

- description : le legacy ebook checkout applique un rate limiting mémoire-process, mais pas les nouvelles routes `client-auth`, `orders`, `checkout` ou `downloads`.
- fichier(s) concerné(s) :
  - `app/api/client-auth/request-link/route.ts`
  - `app/api/orders/route.ts`
  - `app/api/checkout/route.ts`
  - `app/api/downloads/[grantId]/route.ts`
- impact : exposition au spam de magic links, au bruit applicatif et aux tentatives de scraping/abuse en environnement serverless.
- recommandation : introduire un rate limiting compatible Vercel sur les routes auth, checkout et download.
- priorité : P1.

### 4. Un checkout Stripe déjà créé ne semble pas réémissible

- description : `lib/services/checkout.ts` bloque toute recréation si `stripeCheckoutSessionId` est déjà présent sur la `Payment`, sans stratégie de relance si la session Stripe expire ou est abandonnée.
- fichier(s) concerné(s) :
  - `lib/services/checkout.ts`
  - `prisma/schema.prisma` (`Payment.stripeCheckoutSessionId`)
- impact : un panier peut devenir commercialement bloqué si la session Checkout initiale n’aboutit pas et qu’aucune relance n’est prévue.
- recommandation : définir une politique explicite de réutilisation, d’expiration ou de recréation de checkout.
- priorité : P1.

### 5. Le fallback temporaire par email reste un compromis de sécurité et de cohérence métier

- description : `/mon-compte` récupère encore les commandes via `OR: [{ customerId }, { customerEmail }]` et `DownloadGrant.customerEmail` existe toujours comme filet historique.
- fichier(s) concerné(s) :
  - `lib/services/customer-account.ts`
  - `lib/services/download-grant.ts`
  - `prisma/schema.prisma`
- impact : ce fallback aide la transition, mais il maintient un couplage historique par email qui devra être refermé pour obtenir une propriété stricte 100 % par `customerId`.
- recommandation : prévoir un sprint de backfill/normalisation pour réduire progressivement le fallback email.
- priorité : P1.

## Risques moyens / faibles

### 1. Duplication de configuration cookie dans la route verify

- description : `app/api/client-auth/verify/route.ts` réécrit en dur le nom et les options du cookie au lieu d’utiliser `setCustomerSessionCookie`.
- impact : risque faible d’écart futur de configuration.
- recommandation : centraliser la pose du cookie via le helper serveur existant.
- priorité : P2.

### 2. La page merci expose encore des métadonnées de commande par `orderNumber`

- description : `app/commande/merci/page.tsx` reste un accès minimal basé sur `orderNumber`.
- impact : fuite limitée de métadonnées commerciales si un numéro de commande est connu ou deviné.
- recommandation : garder ce comportement temporaire seulement si assumé, sinon le réserver rapidement au compte client authentifié.
- priorité : P2.

### 3. Les expirations existent dans les services mais pas de mécanisme visible de maintenance planifiée

- description : `markExpiredDownloadGrants()` et `expireOldCustomerSessions()` existent, mais aucun déclenchement planifié n’apparaît dans le runtime audité.
- impact : faible à moyen ; l’accès reste protégé à la lecture, mais les statuts peuvent rester obsolètes tant qu’aucun job de maintenance ne passe.
- recommandation : ajouter une tâche planifiée ou un cron léger.
- priorité : P2.

### 4. Le compteur de téléchargement est consommé avant la réussite réelle du transfert

- description : `GET /api/downloads/[grantId]` valide l’accès, génère le lien, puis incrémente le compteur avant la redirection effective vers Supabase.
- impact : quelques téléchargements peuvent être comptés alors que le client n’a pas réellement récupéré le fichier.
- recommandation : décider si ce compromis est acceptable pour le MVP ou s’il faut tracer plus finement.
- priorité : P3.

### 5. L’UI publique garde encore un discours de chantier

- description : plusieurs textes utilisateur parlent encore de fonctionnalités “bientôt disponibles” alors que le backend existe partiellement ou totalement.
- impact : confusion produit, pas faille technique.
- recommandation : réaligner les messages avec l’état réel du sprint.
- priorité : P3.

## Points à corriger avant production

- Corriger l’URL réellement envoyée dans le magic link client.
- Brancher le checkout commerce depuis le panier public.
- Réaligner la page merci avec la sécurité actuelle des téléchargements.
- Ajouter un rate limiting compatible Vercel sur `client-auth`, `orders`, `checkout`, `downloads`.
- Définir une stratégie de relance ou de recréation d’une session Checkout expirée/abandonnée.
- Clarifier la divergence documentation/runtime autour de `StripeEvent` et `BackgroundJob`.
- Vérifier en environnement preview le flux complet réel : panier -> Stripe -> webhook -> compte client -> téléchargement.

## Points qui peuvent attendre

- Suppression progressive du fallback email au profit de `customerId` strict partout.
- Cron de maintenance pour marquer sessions et grants expirés.
- Journal d’audit plus riche sur les téléchargements.
- Durcissement plus poussé des remboursements et de la révocation automatique des grants.
- Tests E2E navigateur complets.

## Legacy ebook

État global : isolation plutôt correcte.

Éléments legacy confirmés :

- modèle `EbookOrder`
- `app/api/ebook/checkout/route.ts`
- `app/api/ebook/download/route.ts`
- `app/ebook/acces/[token]/page.tsx`
- `lib/ebook-token.ts`
- `lib/ebook-blob.ts`
- usage Vercel Blob

Points de contact avec le nouveau flux :

- même endpoint Stripe webhook partagé dans `app/api/stripe/webhook/route.ts`
- même secret Stripe
- même application Prisma

Constat :

- la séparation commerce vs legacy par metadata dans le webhook est claire ;
- le legacy continue cependant d’utiliser `after()` et un traitement best-effort, contrairement au commerce plus structuré ;
- aucun mélange direct de `EbookOrder` avec `Order`, `Payment` ou `DownloadGrant` n’a été observé.

## Variables env à vérifier

Variables réellement critiques pour le commerce audité :

- `DATABASE_URL`
- `DIRECT_URL`
- `SHADOW_DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_EBOOKS`
- `CONTACT_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

Variables critiques pour le legacy encore présent :

- `STRIPE_PRICE_ID_EBOOK`
- `EBOOK_ACCESS_TOKEN_SECRET`
- `BLOB_READ_WRITE_TOKEN`

Variables auth/admin à maintenir cohérentes :

- `AUTH_ADMIN_EMAIL`
- `ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD_HASH`
- `AUTH_SESSION_SECRET`
- `AUTH_COOKIE_NAME`
- `WEBAUTHN_RP_ID`
- `WEBAUTHN_ORIGIN`

Vérifications spécifiques recommandées :

- `NEXT_PUBLIC_BASE_URL` correct en preview et production ;
- magic link dev visible uniquement hors production ;
- cookie client `secure: true` en production ;
- clé Supabase service role strictement serveur ;
- aucune variable `NEXT_PUBLIC_SUPABASE_*` pour le flux privé.

## Tests

Résumé couverture :

- 25 fichiers de test Node ;
- 192 tests passent au moment de l’audit ;
- excellente couverture service pour : catalogue, panier, commande, checkout, webhook commerce, grants, accès download, auth client, compte client, Supabase helper.

Zones bien couvertes :

- règles métier panier ;
- création de commande ;
- création checkout ;
- validation webhook commerce ;
- création/rejeu des `DownloadGrant` ;
- sécurité service des téléchargements ;
- auth client par magic link ;
- wiring Prisma commerce.

Zones peu ou non testées :

- route handlers App Router en conditions réelles ;
- parcours navigateur de bout en bout ;
- rendu UI et transitions client ;
- intégration réelle du lien magique ;
- intégration réelle du checkout commerce depuis la page panier.

Test critique manquant :

- un test E2E minimal du parcours :
  - `/boutique/[slug]`
  - ajout panier
  - panier
  - création order
  - création checkout
  - webhook simulé
  - connexion client
  - `/mon-compte`
  - téléchargement.

## Recommandation de prochains sprints

1. Sprint 7.1 — Corriger le parcours client réel
   - réparer le magic link ;
   - réaligner `/commande/merci` ;
   - brancher le checkout depuis `/panier`.

2. Sprint 7.2 — Durcir l’exposition production
   - rate limiting Vercel-compatible ;
   - revue logs ;
   - vérification stricte des variables d’environnement commerce.

3. Sprint 7.3 — Résilience paiement
   - stratégie de réémission/reprise de checkout ;
   - clarification runtime/documentation sur `StripeEvent` / `BackgroundJob`.

4. Sprint 7.4 — Réduction de dette d’identité
   - diminuer le fallback email ;
   - renforcer le rattachement strict `Order.customerId`.

5. Sprint 7.5 — E2E commerce minimal
   - ajouter un test automatisé de parcours client complet.
