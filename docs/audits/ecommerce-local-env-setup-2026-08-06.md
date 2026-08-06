# Stabilisation environnement local e-commerce — 2026-08-06

## Objectif

Permettre une vraie recette locale des flux suivants:

- checkout Stripe test
- webhook Stripe local
- magic link client
- espace client
- téléchargement
- remboursement Stripe test

Sans modifier le métier e-commerce ni les migrations.

## Audit local actuel

### Base

- `DATABASE_URL`
  - présent
  - attendu en local dev
  - forme détectée: Postgres local `localhost`
- `DIRECT_URL`
  - présent
  - attendu en local dev
  - forme détectée: Postgres local `localhost`
- `SHADOW_DATABASE_URL`
  - présent
  - attendu pour Prisma local
  - forme détectée: Postgres local `localhost`

### Application

- `NEXT_PUBLIC_BASE_URL`
  - absent dans l’environnement local actuel
  - attendu:
    - local: recommandé
    - production: obligatoire
  - exemple local:
    - `http://localhost:3000`

Note:
- le checkout local ne casse plus sur cette absence grâce au fallback serveur via `request.url`
- malgré cela, il reste recommandé de définir explicitement `NEXT_PUBLIC_BASE_URL=http://localhost:3000` dans `.env.local`

### Auth admin

- `AUTH_ADMIN_EMAIL`
  - présent
  - attendu en local
- `AUTH_ADMIN_PASSWORD_HASH`
  - présent
  - attendu en local
- `AUTH_SESSION_SECRET`
  - présent
  - attendu en local

### Auth client / magic link

Variables réellement nécessaires d’après le code:

- `NEXT_PUBLIC_BASE_URL`
  - facultatif en local grâce au fallback
  - obligatoire en production
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_FROM` ou à défaut `SMTP_USER`

État local actuel:

- `SMTP_HOST` absent
- `SMTP_PORT` absent
- `SMTP_SECURE` absent
- `SMTP_USER` absent
- `SMTP_PASS` absent
- `CONTACT_FROM` absent

Conséquence avant correction:

- `POST /api/client-auth/request-link` renvoyait `500 Customer email configuration is incomplete`

Conséquence après correction minimale:

- en développement, si SMTP est absent, la route retourne quand même `magicLink`
- en production, aucun fallback similaire n’est autorisé

### Stripe

Variables réellement utilisées:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_EBOOK` pour le flux legacy ebook uniquement

État local détecté:

- `STRIPE_SECRET_KEY` présent
  - préfixe détecté: `sk_live_`
  - problème:
    - ce n’est pas une clé test locale
    - l’erreur runtime observée confirme qu’elle est expirée/invalide pour le test local actuel
- `STRIPE_WEBHOOK_SECRET` présent
  - préfixe détecté: `whsec_`
- `STRIPE_PRICE_ID_EBOOK` présent

Conclusion Stripe locale:

- il faut remplacer la clé actuellement chargée localement par une vraie clé test:
  - `sk_test_...`
- la variable doit être définie dans `.env.local` pour surcharger proprement `.env`

### Email

Variables attendues:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_FROM`
- `CONTACT_TO` pour le formulaire de contact public

État local:

- toutes les variables SMTP utiles au magic link sont absentes
- `CONTACT_FROM` absent
- `CONTACT_TO` absent

### Supabase

Variables utilisées:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_EBOOKS`

État local:

- absentes dans l’environnement local actuel

Impact:

- cela ne bloque pas le fallback dev du magic link
- cela bloquera un test réel end-to-end du téléchargement signé si la route atteint effectivement Supabase

## Correctif minimal appliqué

### Magic link en développement sans SMTP

Le comportement a été durci ainsi:

- en `development`, si la configuration email client est absente:
  - la route `POST /api/client-auth/request-link` ne plante plus
  - elle retourne la réponse standard avec `magicLink`
  - aucun email n’est envoyé
- en `production`:
  - l’email reste obligatoire
  - `magicLink` n’est jamais exposé
  - l’erreur reste générique et non sensible

Résultat local validé:

- `POST /api/client-auth/request-link` -> `200`
- `magicLink` présent en développement

## Variables `.env.local` recommandées

Exemples sans secrets réels:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000

AUTH_ADMIN_EMAIL=fabien.lages@fabsystem.fr
AUTH_ADMIN_PASSWORD_HASH=\$2b\$12\$replace_with_bcrypt_hash
AUTH_SESSION_SECRET=replace_with_long_local_secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@example.com
SMTP_PASS=replace_with_smtp_password
CONTACT_FROM=no-reply@example.com

SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_service_role_key
SUPABASE_STORAGE_BUCKET_EBOOKS=ebooks-private
```

## Où corriger localement

### Stripe

Dans `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
```

Important:

- ne pas utiliser la clé actuellement chargée avec préfixe `sk_live_`
- récupérer une vraie clé test depuis le dashboard Stripe

### Webhook Stripe local

Commande à lancer:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Puis copier le secret affiché:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email / magic link

Deux options:

1. Option A — config SMTP réelle locale
   - renseigner `SMTP_*` et `CONTACT_FROM`
   - permet d’envoyer de vrais emails de test

2. Option B — mode dev sans SMTP
   - maintenant supporté
   - `POST /api/client-auth/request-link` renvoie `magicLink` directement en développement
   - suffisant pour la recette locale

## Procédure locale Stripe

1. Définir dans `.env.local`:
   - `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
   - `STRIPE_SECRET_KEY=sk_test_...`
2. Lancer:

```bash
npm run dev
```

3. Dans un autre terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Depuis le site:
   - aller sur `/boutique`
   - ajouter le produit au panier
   - créer la commande
   - lancer le checkout
   - payer avec une carte test Stripe
5. Vérifier:
   - `Order` passe en `PAID`
   - `Payment` passe en `SUCCEEDED`
   - `DownloadGrant` est créé

## Procédure locale magic link

Avec fallback dev sans SMTP:

1. Lancer:

```bash
npm run dev
```

2. Requête de test:

```bash
curl -X POST http://localhost:3000/api/client-auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","name":"Client Test"}'
```

3. Récupérer `magicLink` dans la réponse JSON.
4. Ouvrir le lien dans le navigateur.
5. Vérifier:
   - connexion client
   - accès `/mon-compte`
   - accès aux téléchargements autorisés

## Commandes utiles

```bash
npm run dev
npx prisma generate
npx prisma validate
npm run lint
npm test
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Points restant dépendants de vrais secrets

1. Checkout Stripe réel
   - nécessite une vraie clé `sk_test_...`

2. Webhook Stripe réel local
   - nécessite un vrai `whsec_...` issu de Stripe CLI

3. Envoi réel d’email client
   - nécessite une vraie configuration SMTP

4. Téléchargement Supabase signé end-to-end
   - nécessite `SUPABASE_URL`
   - nécessite `SUPABASE_SERVICE_ROLE_KEY`
   - nécessite `SUPABASE_STORAGE_BUCKET_EBOOKS`
