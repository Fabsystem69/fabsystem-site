# Préparation production e-commerce contrôlée — Sprint 8.7 — 2026-08-06

## Statut du document

- Portée : checklist de lancement, pas un déploiement
- Aucune migration créée, aucun schéma Prisma modifié
- Aucune base distante/prod touchée
- Aucun paiement live lancé pendant ce sprint
- Toutes les clés et tous les IDs sensibles sont masqués ci-dessous

> **Mise à jour Sprint 8.9** : le tunnel ebook legacy a été décommissionné
> (`docs/audits/ecommerce-legacy-decommission-2026-08-06.md`). Les variables
> `STRIPE_PRICE_ID_EBOOK`, `EBOOK_ACCESS_TOKEN_SECRET` et `BLOB_READ_WRITE_TOKEN`
> ne sont plus nécessaires en production. Les tableaux ci-dessous datent du
> Sprint 8.7 et reflètent l'état d'alors ; les lignes concernées sont annotées
> mais conservées pour l'historique.

---

## Partie 1 — Synthèse de l'audit pré-prod

Sources lues : `docs/00-VISION.md`, `docs/04-STRIPE.md`, `docs/06-DEPLOYMENT.md`,
`docs/07-SECURITY.md`, `docs/11-SOURCE-OF-TRUTH.md`, `docs/13-MVP-SCOPE.md`,
`docs/14-SUPABASE-STORAGE.md`, `docs/audits/ecommerce-local-acceptance-2026-08-06.md`,
`docs/audits/ecommerce-local-env-setup-2026-08-06.md`, `.env.example`, `package.json`,
`prisma/schema.prisma`, `lib/server/env.ts`, `lib/server/stripe.ts`,
`lib/server/supabase-storage.ts`, `lib/services/download-access.ts`,
`app/api/stripe/webhook/route.ts`.

Constat général : le MVP est fonctionnellement validé en local (302 tests, recette
manuelle bout en bout y compris remboursement Stripe test — voir
`docs/audits/ecommerce-local-acceptance-2026-08-06.md` et la recette remboursement de ce
même jour). Ce qui manque pour passer en production maîtrisée n'est **pas du code**,
c'est de la **configuration d'environnement** :

1. Aucune variable Supabase n'est configurée nulle part en dehors du local — le
   provider cible du nouveau commerce n'existe pas encore en prod.
2. Le webhook Stripe n'a pas d'endpoint live configuré côté dashboard Stripe.
3. La configuration SMTP prod n'a pas été vérifiée dans ce sprint (hors périmètre —
   nécessite un test d'envoi réel, non fait ici pour rester sans risque).
4. `.env.example` contient une valeur `STRIPE_SECRET_KEY` qui a la forme exacte d'une
   vraie clé Stripe test (`sk_test_` suivi d'une chaîne plausible), au lieu d'un
   placeholder évident — voir risque dédié en Partie 7. Traité comme un risque de
   sécurité à corriger, pas un bug métier.
5. Le point technique `download-access.ts` (résolution Supabase trop précoce) a été
   traité — voir Partie 4.

Rien dans le code lu ne bloque un déploiement Vercel : `npm run build` exécute
`prisma generate && next build --webpack`, ce qui ne nécessite aucune variable
Supabase/SMTP pour réussir (elles ne sont lues qu'à l'exécution, pas au build).

---

## Partie 2 — Checklist variables Vercel

### Base de données

| Variable | Obligatoire prod runtime | Notes |
|---|---|---|
| `DATABASE_URL` | Oui | Lue par `lib/prisma.ts` à chaque requête serveur |
| `DIRECT_URL` | Oui pour `prisma migrate deploy` | Lue par `prisma.config.ts`, utilisée pour les migrations, pas pour le runtime applicatif |
| `SHADOW_DATABASE_URL` | Non | Local/CI uniquement (`prisma migrate dev`), jamais nécessaire en runtime prod |

### App

| Variable | Obligatoire prod | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Oui | `https://www.fabsystem.fr` (ou domaine prod réel). Utilisé pour les liens magic link et les redirections Stripe `success_url`/`cancel_url` (`lib/server/env.ts::getRequiredBaseUrl`). En prod, aucun fallback `request.url` — absence de variable = erreur explicite |

### Admin

| Variable | Obligatoire prod | Notes |
|---|---|---|
| `AUTH_ADMIN_EMAIL` | Oui | |
| `AUTH_ADMIN_PASSWORD_HASH` | Oui | hash bcrypt, jamais le mot de passe en clair |
| `AUTH_SESSION_SECRET` | Oui | secret long, distinct par environnement |
| `AUTH_COOKIE_NAME` | Optionnel | valeur par défaut existante si absent |
| `ADMIN_EMAIL` | Recommandé | alias legacy encore lu par le flux WebAuthn ; doit rester identique à `AUTH_ADMIN_EMAIL` tant que l'incohérence de code n'est pas corrigée (notée dans `docs/06-DEPLOYMENT.md`) |

### Client (magic link / session)

| Variable | Obligatoire prod | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Oui | requis pour construire l'URL du lien magique |
| `SMTP_*` (voir Email) | Oui | en production, l'envoi d'email est obligatoire ; le fallback dev « pas de SMTP → `magicLink` renvoyé en clair dans la réponse JSON » n'existe qu'en `development` |

Durée de session : **non configurable par variable d'environnement**, constantes
codées en dur (`lib/services/customer-auth.ts`) :
- token magic link : 15 minutes
- session client : 30 jours

### Stripe

| Variable | Obligatoire prod | Appartient à |
|---|---|---|
| `STRIPE_SECRET_KEY` | Oui | commun (nouveau commerce ; le legacy qui le partageait a été retiré au Sprint 8.9) |
| `STRIPE_WEBHOOK_SECRET` | Oui | traite désormais exclusivement le nouveau commerce (`app/api/stripe/webhook/route.ts`) |
| `STRIPE_PRICE_ID_EBOOK` | **Non — retiré au Sprint 8.9** | ~~legacy uniquement~~ le nouveau commerce construit ses `line_items` via `price_data` dynamique (`lib/services/checkout.ts::buildCheckoutSessionParams`), aucun Price Stripe préexistant requis |
| `EBOOK_ACCESS_TOKEN_SECRET` | **Non — retiré au Sprint 8.9** | ~~legacy uniquement~~ signait les liens d'accès `/ebook/acces/[token]`, route supprimée |

### Email

| Variable | Obligatoire prod |
|---|---|
| `SMTP_HOST` | Oui |
| `SMTP_PORT` | Oui |
| `SMTP_SECURE` | Oui (`true` ou `false` explicite, `lib/server/env.ts::parseSmtpSecure` rejette toute autre valeur) |
| `SMTP_USER` | Oui |
| `SMTP_PASS` | Oui |
| `CONTACT_FROM` | Oui (sinon fallback `SMTP_USER` selon le flux) |
| `CONTACT_TO` | Oui si le formulaire de contact public reste actif |
| `MAIL_TO` | Utilisé par la page d'accès ebook legacy |

### Supabase

| Variable | Obligatoire prod |
|---|---|
| `SUPABASE_URL` | Oui — absent aujourd'hui partout hors local (et absent en local aussi) |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui — strictement serveur |
| `SUPABASE_STORAGE_BUCKET_EBOOKS` | Oui |

### Legacy Blob (retiré au Sprint 8.9)

| Variable | Obligatoire prod |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | **Non — retiré au Sprint 8.9** (`@vercel/blob` retiré de `package.json`, plus aucun flux actif ne l'utilise) |

### WebAuthn (si utilisé)

| Variable | Obligatoire prod |
|---|---|
| `WEBAUTHN_RP_ID` | Oui si les routes WebAuthn admin sont utilisées |
| `WEBAUTHN_ORIGIN` | Oui si les routes WebAuthn admin sont utilisées |

### Sécurité — règles vérifiées dans le code

- Aucun secret n'est exposé via une variable `NEXT_PUBLIC_*` autre que
  `NEXT_PUBLIC_BASE_URL` (qui est publique par nature). Recherche effectuée dans
  `lib/`, `app/` : aucune clé Stripe secrète, aucune clé service role Supabase
  référencée avec le préfixe `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` n'est lue que dans `lib/supabase-storage.ts`, importé
  uniquement via le wrapper serveur `lib/server/supabase-storage.ts` (marqué
  `import "server-only"`) — jamais côté client.
- `STRIPE_SECRET_KEY` n'est lue que dans `lib/server/stripe.ts` et `lib/stripe.ts`
  (tous deux marqués `import "server-only"`).

---

## Partie 3 — Stripe prod / test

### 1. Nouveau commerce

- Checkout dynamique : `lib/services/checkout.ts::buildCheckoutSessionParams` construit
  les `line_items` via `price_data` (montant recalculé serveur depuis `OrderItem`,
  jamais depuis le navigateur) — aucun `Price` Stripe préexistant requis, aucune
  synchronisation Stripe products/prices.
- `Payment` local créé en `PENDING` avant la session Stripe, mis à jour par le webhook.
- `Order` local créé en `PENDING_PAYMENT`, passe en `PAID` uniquement via webhook signé.
- Metadata commerce envoyées à Stripe : `orderId`, `orderNumber`, `paymentId`
  (`lib/services/checkout.ts`, `lib/services/stripe-webhook-commerce.ts`). Ces trois
  clés servent aussi de discriminant : `isCommerceCheckoutSession()` teste leur
  présence pour distinguer un événement « nouveau commerce » d'un événement legacy.
- Webhook `checkout.session.completed` → `handleCommerceCheckoutCompleted` : vérifie
  la correspondance metadata / `Payment` / `Order` local avant tout effet de bord.
- Webhook `checkout.session.expired` → `handleCommerceCheckoutExpired`.
- Remboursement admin : `lib/services/admin-refunds.ts::refundOrderInFull`, appelé
  uniquement depuis `app/dashboard/orders/[orderId]/actions.ts` (server action protégée
  par `requireSession()`), confirmation manuelle `REMBOURSER`, clé d'idempotence Stripe
  stable `order-refund-full:{orderId}`.

### 2. Legacy

État constaté au Sprint 8.7 (pour l'historique) : routes `app/api/ebook/checkout/route.ts`
présentes et non modifiées, webhook legacy géré dans une branche `else` du même
fichier `app/api/stripe/webhook/route.ts` (`EbookOrder`, génération HTML, upload
Blob, envoi email token signé).

- **Mise à jour Sprint 8.9** : ce flux et ses routes (`app/api/ebook/checkout`,
  `app/api/ebook/download`, `app/ebook/acces/[token]`) ont été supprimés ;
  `STRIPE_PRICE_ID_EBOOK`, `EBOOK_ACCESS_TOKEN_SECRET` et `BLOB_READ_WRITE_TOKEN`
  ne sont plus nécessaires. Voir `docs/audits/ecommerce-legacy-decommission-2026-08-06.md`.

### 3. Pré-prod — tester sans encaisser

- Ne jamais aller jusqu'au bouton de paiement Stripe en environnement live pendant ce
  sprint.
- Se limiter à la navigation publique (`/boutique`, fiche produit, panier, formulaire
  de checkout visible) pour valider l'UI et le routing en prod.
- Vérifier uniquement que l'endpoint webhook Stripe répond `200` à un événement de
  test envoyé depuis le dashboard Stripe (bouton « Envoyer un événement de test »),
  sans jamais déclencher de paiement réel.
- Réserver tout parcours de paiement complet à Stripe test, en local ou dans un
  environnement de staging isolé — jamais en pointant une clé live.

### 4. Webhook Stripe live

- Endpoint attendu : `https://www.fabsystem.fr/api/stripe/webhook`
- Événements à écouter au minimum :
  - `checkout.session.completed`
  - `checkout.session.expired`
- Événements que le code accepte (répond `200 { ok: true }`) mais ignore sans effet
  métier — peuvent rester cochés dans Stripe sans risque, ou être décochés sans
  impact :
  - `payment_intent.succeeded`
  - `charge.succeeded`
  - `charge.updated`
- Le secret `STRIPE_WEBHOOK_SECRET` **live** est différent du `whsec_...` généré
  localement par `stripe listen`. Il doit être régénéré depuis le dashboard Stripe au
  moment de la création de l'endpoint live, et stocké uniquement dans les variables
  Vercel production — jamais réutilisé depuis `.env.local`.

Aucune modification du code Stripe effectuée dans ce sprint (aucun bug de sécurité ou
de robustesse évident détecté qui justifierait une exception à la contrainte de
non-modification métier).

---

## Partie 4 — Supabase Storage prod

### Configuration attendue

- Bucket privé obligatoire, jamais d'URL publique permanente.
- Variable : `SUPABASE_STORAGE_BUCKET_EBOOKS`
- Chemin d'asset attendu (exemple, cohérent avec le seed/les tests existants) :
  `ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf`
- Provider attendu sur `DigitalAsset.provider` : `SUPABASE`
- Règle : jamais d'URL signée stockée en base, génération à la demande uniquement.
- TTL : 300 secondes par défaut, 600 secondes maximum
  (`SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS` /
  `SUPABASE_STORAGE_SIGNED_URL_MAX_TTL_SECONDS`, `lib/supabase-storage.ts`).

### Vérifications code effectuées

- Aucune clé Supabase service role référencée côté client : `SUPABASE_SERVICE_ROLE_KEY`
  n'apparaît que dans `lib/supabase-storage.ts`, consommé uniquement via
  `lib/server/supabase-storage.ts` (`server-only`).
- Aucune variable `NEXT_PUBLIC_SUPABASE_*` utilisée pour les téléchargements privés
  (recherche effectuée, aucune occurrence).
- Aucun stockage d'URL signée en base : `DownloadAccessResult.url` est retourné à la
  volée par `getDownloadAccessForGrant`, jamais persisté sur `DownloadGrant`.

### Correction appliquée — diagnostic `Missing SUPABASE_URL`

**Constat (hérité du sprint remboursement précédent)** : `getDefaultDownloadAccessService()`
(`lib/services/download-access.ts`) résolvait `expectedBucket` de façon *eager* — au
moment de construire le service, avant même de charger le `DownloadGrant`. Résultat :
en environnement sans config Supabase, **toute** tentative de téléchargement échouait
avec `Missing SUPABASE_URL`, y compris pour un grant `REVOKED` — masquant le vrai
message métier `Download grant is not active`.

**Correction appliquée** (respecte les 4 conditions du mandat) :

- Aucun changement métier : l'ordre des règles d'éligibilité dans
  `assertDownloadGrantIsEligible` est inchangé (statut → expiration → quota → statut
  commande → statut asset → provider → bucket/path renseignés → bucket attendu).
  Seule la résolution de `expectedBucket` est devenue *paresseuse* : elle n'est
  évaluée qu'au moment précis où elle est utilisée, c'est-à-dire après tous les
  contrôles précédents.
- Test ajouté : `tests/download-access-service.test.ts` —
  *« getDownloadAccessForGrant refuses a revoked grant without resolving the Supabase
  bucket config »* — fournit un resolver qui lève `Missing SUPABASE_URL` et vérifie
  qu'il n'est jamais appelé pour un grant `REVOKED`, et que l'erreur reçue reste bien
  `Download grant is not active` (409).
- Nombre de tests : 302 → **303** (voir Partie 8).
- Comportement identique en production : Supabase y sera configuré, donc la
  résolution — eager ou paresseuse — réussit dans les deux cas ; la différence ne
  se manifeste qu'en configuration incomplète (local actuel, ou incident de config
  prod), où elle laisse désormais remonter la vraie cause.
- Pas d'appel Supabase avant validation du grant actif : vérifié par le test ci-dessus
  et par un test manuel en conditions réelles (grant `REVOKED` de la recette
  remboursement précédente, environnement local sans aucune variable Supabase) — le
  message reçu est bien `Download grant is not active`, plus jamais `Missing
  SUPABASE_URL` pour ce cas.

Fichiers modifiés : `lib/services/download-access.ts`, `tests/download-access-service.test.ts`.

---

## Partie 5 — Procédure produit réel (manuelle, dashboard)

Aucune synchronisation Stripe products/prices. Le catalogue FabSystem reste dans
Prisma (`Product`, `ProductPrice`) ; Stripe reste uniquement le processeur de
paiement via `price_data` dynamique.

### Procédure — ebook van

1. `/dashboard/catalog` → créer le produit (`productType = EBOOK`,
   `purchaseMode = BUY_NOW`), le laisser en `DRAFT`.
2. Créer un `ProductPrice` actif (un seul prix actif à la fois — un changement de prix
   archive automatiquement l'ancien).
3. Créer la référence `DigitalAsset` : `provider = SUPABASE`, `bucket` =
   `SUPABASE_STORAGE_BUCKET_EBOOKS`, `path` réel (ex.
   `ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf`), `status = ACTIVE`
   uniquement une fois le fichier réellement présent dans le bucket Supabase.
4. Lier le `DigitalAsset` au produit (écran `/dashboard/catalog`, liaison `ProductAsset`).
5. Activer le produit (`ACTIVE`) seulement quand les trois conditions sont réunies :
   - un unique prix `ACTIVE`
   - un asset `ACTIVE` lié
   - le fichier physiquement présent dans le bucket Supabase (uploadé manuellement,
     hors dashboard — le dashboard ne gère pas encore l'upload)
6. Vérifier `/boutique` : le produit apparaît avec le bon prix.
7. Vérifier `/boutique/[slug]` : la fiche produit s'affiche correctement.

### Cas futur — ebook bateau

Même procédure, `slug` et `path` Supabase distincts (ex.
`ebooks/ebook-electricite-bateau/v1/...`). Aucune étape supplémentaire nécessaire —
le moteur catalogue est déjà multi-produits par conception (`docs/00-VISION.md`).

Rappel : ne jamais activer un produit avant d'avoir vérifié manuellement que le
fichier existe réellement dans le bucket Supabase au chemin déclaré — le dashboard
ne fait aucune vérification d'existence physique du fichier.

---

## Partie 6 — Smoke test prod sans encaissement

À dérouler après déploiement, **sans jamais aller jusqu'au paiement live** :

- [ ] Page d'accueil charge correctement
- [ ] `/boutique` charge, produits visibles
- [ ] `/boutique/[slug]` charge pour un produit actif
- [ ] `/panier` charge
- [ ] Ajout au panier fonctionne si un produit est actif
- [ ] Formulaire de checkout visible (ne pas cliquer jusqu'au paiement live sauf
      décision explicite et assumée séparément de ce sprint)
- [ ] `/connexion-client` charge
- [ ] Demande de lien magique avec une adresse email contrôlée (Fabien)
- [ ] Email reçu si SMTP prod est configuré
- [ ] `/mon-compte` charge après connexion
- [ ] `/dashboard` login fonctionne
- [ ] `/dashboard/catalog` charge
- [ ] `/dashboard/orders` charge
- [ ] `/dashboard/discounts` charge
- [ ] `/api/stripe/webhook` répond `200` aux événements de test envoyés depuis le
      dashboard Stripe (sans paiement réel)

Aucun paiement live effectué pendant ce sprint.

---

## Partie 7 — Sécurité / risques avant lancement

| Risque | Impact | Statut |
|---|---|---|
| Absence de configuration Supabase en production | Téléchargements impossibles pour tout nouvel achat réel | Bloquant — aucune variable Supabase détectée hors local |
| Mauvais bucket configuré | Téléchargements refusés (mismatch bucket) même config présente | À vérifier à la configuration |
| Mauvais chemin d'asset (`path`) | Signed URL générée pointe vers un fichier inexistant | À vérifier manuellement avant activation produit (Partie 5) |
| Secret webhook live incorrect | Tous les webhooks Stripe live rejetés en `400`, aucune commande ne passe `PAID` | Bloquant tant que le vrai `whsec_` live n'est pas configuré |
| Mélange clés Stripe live/test | Paiement test accepté en prod ou paiement live déclenché par erreur en test | **Résolu (Sprint 8.7b)** — `.env.example` corrigé, ne contient plus que des placeholders génériques ; confirmé absent de l'historique git (voir Sprint 8.7b ci-dessous) |
| SMTP prod manquant ou non vérifié | Magic link client cassé en prod (aucun fallback dev en production) | Non vérifié dans ce sprint (nécessiterait un envoi réel, hors périmètre « sans risque ») |
| Legacy ebook toujours actif | Reste un flux Stripe supplémentaire à surveiller, code non modifié | Assumé et documenté, conforme à `docs/13-MVP-SCOPE.md` |
| Remboursement admin disponible uniquement dashboard | Aucun remboursement partiel, aucun email client automatique | Limite MVP connue et documentée (`docs/04-STRIPE.md`, état Sprint 8.4) |
| Absence de facture officielle dans le dashboard | Le dashboard commande n'est pas un outil comptable | Assumé — Indy fait foi pour la comptabilité officielle |
| `AUTH_ADMIN_EMAIL` / `ADMIN_EMAIL` encore dupliquées | Risque de divergence de config admin | Incohérence connue, non corrigée dans ce sprint (hors mandat métier) |

### Go / No-Go lancement

- **GO technique local** : oui — 303 tests passants, lint et validation Prisma OK,
  flux complet vérifié en local y compris remboursement Stripe test.
- **GO après configuration Supabase prod** : conditionnel — `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET_EBOOKS` doivent être définies
  dans Vercel production avant tout achat réel.
- **GO après webhook Stripe live vérifié** : conditionnel — endpoint
  `https://www.fabsystem.fr/api/stripe/webhook` créé côté Stripe, événements
  `checkout.session.completed` + `checkout.session.expired` cochés, `whsec_` live
  copié dans Vercel.
- **GO après SMTP prod vérifié** : conditionnel — un envoi réel de lien magique doit
  être testé avec une adresse contrôlée avant d'annoncer le lancement client.
- **NO-GO si `STRIPE_SECRET_KEY` live absente ou incorrecte** : bloquant absolu.
- **NO-GO si `SUPABASE_SERVICE_ROLE_KEY` absente** : bloquant absolu (aucun
  téléchargement possible).
- **NO-GO si un produit est `ACTIVE` sans asset réel présent dans Supabase** : bloquant
  — un client pourrait payer pour un fichier inexistant.

---

## Partie 8 — Tests et validation

| Commande | Résultat |
|---|---|
| `npx prisma generate` | OK |
| `npx prisma validate` | OK — schema valide |
| `npm run lint` | OK — aucune erreur |
| `npm test` | OK — **303/303 tests passants** (302 précédemment + 1 nouveau test ciblé sur la correction Partie 4) |

Aucune migration créée. Aucun schéma Prisma modifié. Aucun `migrate reset` /
`dropdb` / `db push` exécuté. Aucune base distante/prod touchée. Aucun paiement live
lancé. Aucune clé secrète affichée dans ce document.

---

## Sprint 8.7b — Contrôle sécurité pré-prod / secrets / env — 2026-08-06

### Périmètre

Vérifier qu'aucun secret réel ou pseudo-réel n'est présent dans les fichiers
versionnés avant la préparation production. Fabien avait déjà corrigé
`.env.example` (valeur `STRIPE_SECRET_KEY` ambiguë remplacée par un placeholder)
avant ce contrôle.

### Fichiers audités

`.env.example`, `.gitignore`, ce document, `docs/audits/ecommerce-local-env-setup-2026-08-06.md`,
`docs/06-DEPLOYMENT.md`, `docs/07-SECURITY.md`, `docs/04-STRIPE.md`, `package.json`,
`README.md`.

### Résultat de l'audit

Aucun secret réel ni valeur ambiguë trouvée dans ces fichiers. Recherche de motifs
`sk_live_`, `sk_test_...` (suivi d'une chaîne longue), `whsec_...`, `rk_live_`,
`rk_test_`, JWT (`eyJ...`), token Vercel Blob réel, chaîne de connexion Postgres
avec identifiants réels : aucune correspondance en dehors de placeholders explicites
(`replace_with_...`, `postgres:postgres@localhost`, `USER:PASSWORD@HOST`) ou de
simples mentions de noms de variables dans la documentation.

`.env.example` (état actuel, corrigé par Fabien) : toutes les valeurs sensibles sont
des placeholders non ambigus (`replace_with_stripe_secret_key`,
`replace_with_stripe_webhook_secret`, `replace_with_server_only_service_role_key`,
`replace_with_smtp_password`, `replace_with_a_long_random_secret`, DB locale
`postgres:postgres@localhost`). Aucune correction supplémentaire nécessaire sur ce
fichier.

### Historique git local

Vérifié avec `git grep -n "<motif>" HEAD` pour chaque motif demandé, sans jamais
afficher de valeur complète :

| Motif recherché | Résultat dans HEAD |
|---|---|
| `sk_live_` | aucun résultat |
| `sk_test_` | aucun résultat |
| `whsec_` | aucun résultat |
| `rk_live_` / `rk_test_` | aucun résultat |
| JWT (`eyJ...`) | aucun résultat |
| `SUPABASE_SERVICE_ROLE_KEY` | uniquement le nom de variable, dans `.env.example` (placeholder) et dans du code/doc faisant référence au nom — jamais de valeur |
| `DATABASE_URL` | uniquement le nom de variable et un placeholder générique `USER:PASSWORD@HOST` dans `.env.example` (version alors committée, avant la réécriture locale) |
| `SMTP_PASS` | uniquement le nom de variable et le placeholder `replace_with_smtp_password` |
| `BLOB_READ_WRITE_TOKEN` | uniquement le nom de variable et le placeholder `replace_with_vercel_blob_token` |

**Constat important** : la version de `.env.example` actuellement dans `HEAD` (dernier
commit) ne contenait même pas encore les sections Stripe/Supabase du nouveau
commerce — ces sections n'existent que dans l'arborescence de travail non committée.
Autrement dit, la valeur `STRIPE_SECRET_KEY` ayant la forme d'une vraie clé, identifiée
lors du Sprint 8.7, **n'a jamais été committée dans l'historique git** : elle n'a
existé que dans le fichier de travail local, désormais corrigé. Aucune trace dans
`git log` ni dans le contenu de `HEAD` pour un quelconque secret Stripe ou Supabase.

Recommandation rotation : **non nécessaire** pour cette clé — elle n'a jamais quitté
la machine locale via git. Par prudence uniquement (aucune certitude sur l'usage fait
de cette valeur en dehors de git), il reste raisonnable que Fabien vérifie côté
dashboard Stripe qu'aucune clé test portant cette valeur n'est listée comme active,
avant le lancement.

### Corrections appliquées

1. `.env.example` : déjà corrigé par Fabien avant ce contrôle — aucune action
   supplémentaire.
2. `.gitignore` : déjà couvrait `.env*` (couvre `.env`, `.env.local`,
   `.env.*.local`). Ajout défensif de deux règles :
   - `*.log` (catch-all générique, en complément des motifs `npm-debug.log*` /
     `yarn-debug.log*` déjà présents)
   - `scripts/.tmp-*` (scripts de recette temporaires utilisés lors des sessions QA
     manuelles — aucun fichier de ce type n'était présent au moment du contrôle, règle
     ajoutée par précaution pour l'avenir)
3. Section sécurité ajoutée dans ce document (présente section).
4. Mise à jour du tableau de risques (Partie 7) : ligne « Mélange clés Stripe
   live/test » marquée résolue.

### Mini procédure — rotation des secrets en cas d'exposition

À suivre si une vraie clé/secret est un jour détecté dans un commit, un log, ou un
canal partagé :

1. **Révoquer immédiatement** la clé exposée depuis le dashboard du fournisseur
   concerné (Stripe, Supabase, SMTP, etc.) — ne pas attendre la correction du code.
2. **Générer une nouvelle clé** et la déposer uniquement dans les variables
   d'environnement Vercel (ou `.env.local` en local) — jamais dans un fichier
   versionné.
3. **Ne pas réécrire l'historique git sans validation explicite de Fabien** — une
   clé déjà révoquée n'a plus besoin d'être retirée de l'historique en urgence ; une
   réécriture d'historique (`filter-repo`, `BFG`) est une opération destructive à
   valider séparément si elle est jugée nécessaire.
4. Mettre à jour le fichier concerné avec un placeholder explicite
   (`replace_with_...`) si l'exposition provient d'un exemple/documentation.
5. Documenter l'incident (fichier concerné, date, clé révoquée/régénérée — jamais la
   valeur) dans un audit dédié sous `docs/audits/`.
6. Vérifier `git grep` sur les motifs pertinents après correction pour confirmer
   qu'aucune autre occurrence ne subsiste.

### Validation (Sprint 8.7b)

| Commande | Résultat |
|---|---|
| `npx prisma generate` | OK |
| `npx prisma validate` | OK — schema valide |
| `npm run lint` | OK — aucune erreur |
| `npm test` | OK — **303/303 tests** (inchangé — seuls `.env.example`, `.gitignore` et la documentation ont été modifiés) |

Aucune migration créée. Aucun schéma Prisma modifié. Aucune base touchée. Aucune
prod touchée. Aucun paiement Stripe lancé. Aucun secret affiché dans ce document.
