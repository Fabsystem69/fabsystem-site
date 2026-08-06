# FabSystem Deployment

## Statut du document

- Date de reference: 2026-08-05
- Portee: deploiement actuel, contrat d'environnement et garde-fous avant commerce

## Infrastructure actuelle

Le projet est aujourd'hui prepare pour:

- Vercel pour l'application Next.js
- PostgreSQL compatible Neon
- Stripe pour les paiements
- Vercel Blob pour le flux ebook legacy uniquement
- SMTP externe pour les emails transactionnels

## Decision CTO actee

Pour le futur commerce numerique:

- Vercel reste l'hebergeur applicatif
- la base actuelle est conservee pour l'instant
- Stripe reste le processeur de paiement
- Supabase Storage devient le provider cible des nouveaux assets numeriques prives

Le flux ebook actuel sur Vercel Blob reste temporairement en place comme `LEGACY`.

## Fichiers de configuration a connaitre

- [package.json](/Users/fabienlages/Desktop/fabsystem-site/package.json:1)
- [vercel.json](/Users/fabienlages/Desktop/fabsystem-site/vercel.json:1)
- [next.config.ts](/Users/fabienlages/Desktop/fabsystem-site/next.config.ts:1)
- [prisma.config.ts](/Users/fabienlages/Desktop/fabsystem-site/prisma.config.ts:1)
- [docs/build-notes.md](/Users/fabienlages/Desktop/fabsystem-site/docs/build-notes.md:1)
- [docs/production-hardening.md](/Users/fabienlages/Desktop/fabsystem-site/docs/production-hardening.md:1)

## Build actuel de reference

Le build de reference est:

- `npm run build`

Ce script execute:

- `prisma generate`
- `next build --webpack`

Version runtime documentee:

- Next.js `16.2.1`

Le build de production de reference reste Webpack tant que le comportement Turbopack n'est pas valide sur ce projet.

## Contrat d'environnement observe dans le code

### Auth admin actuelle

- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD_HASH`
- `AUTH_SESSION_SECRET`
- `AUTH_COOKIE_NAME`

### Incoherence a corriger en Sprint 0

Le code WebAuthn utilise `ADMIN_EMAIL` alors que le login principal utilise `AUTH_ADMIN_EMAIL`.

Cette incoherence doit etre traitee avant tout chantier commerce.

En attendant l'alignement du code:

- `.env.example` doit documenter les deux variables
- `ADMIN_EMAIL` doit rester un alias legacy de compatibilite
- les deux valeurs doivent rester identiques sur chaque environnement

### Base de donnees

- `DATABASE_URL`
- `DIRECT_URL`
- `SHADOW_DATABASE_URL` pour les migrations Prisma locales

### Email et contact

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_FROM`
- `CONTACT_TO`
- `MAIL_TO`

Important pour le commerce client:

- `SMTP_*` et `CONTACT_FROM` sont requis pour les emails de lien magique
- `SMTP_SECURE` doit etre explicitement defini a `true` ou `false`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

`STRIPE_PRICE_ID_EBOOK` n'est plus necessaire depuis le Sprint 8.9 (legacy
ebook decommissionne, voir `docs/audits/ecommerce-legacy-decommission-2026-08-06.md`).
Le nouveau checkout construit ses `line_items` via `price_data` dynamique a
partir de `Product`/`ProductPrice` (Prisma) — aucun `Price` Stripe preexistant
n'est requis, et Stripe n'est jamais la source de verite du catalogue.

Important pour le nouveau commerce:

- `NEXT_PUBLIC_BASE_URL` est requis en production pour:
  - les liens magic link client
  - les redirections Stripe success/cancel

### Telechargement et liens legacy (retire au Sprint 8.9)

`EBOOK_ACCESS_TOKEN_SECRET` et `BLOB_READ_WRITE_TOKEN` ne sont plus necessaires :
le tunnel ebook legacy (Vercel Blob + lien token signe) a ete decommissionne.
Le nouveau commerce livre les fichiers numeriques via Supabase Storage
(`SUPABASE_*`, section suivante), pas Vercel Blob.

### Stockage numerique (Supabase Storage)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_EBOOKS`

Supabase Storage est le stockage prive de tous les fichiers numeriques vendus
par le nouveau commerce — Vercel Blob n'est plus utilise pour aucun flux actif.

### WebAuthn

- `WEBAUTHN_ORIGIN`
- `WEBAUTHN_RP_ID`

### Runtime

- `NODE_ENV`

Note:

- `NODE_ENV` est lu dans le code, mais il est normalement gere par Next.js et Vercel
- il n'a pas besoin d'etre defini manuellement dans `.env.example`

### Variable d'infrastructure implicite (retiree au Sprint 8.9)

`BLOB_READ_WRITE_TOKEN` n'est plus necessaire : le SDK Vercel Blob n'est plus une
dependance du projet (`@vercel/blob` retire de `package.json`), le tunnel ebook
legacy qui l'utilisait ayant ete decommissionne.

## Variables Supabase cibles

### `SUPABASE_URL`

- URL du projet Supabase
- necessaire aux appels serveur vers Storage

### `SUPABASE_SERVICE_ROLE_KEY`

- strictement serveur
- ne jamais exposer cote client
- ne jamais remplacer par une cle publique pour les telechargements prives

### `SUPABASE_STORAGE_BUCKET_EBOOKS`

- nom du bucket prive cible pour les ebooks et assets numeriques vendus

## Politique d'environnement cible

### Local

Usage:

- developpement
- tests manuels
- validation des sprints

Regle Prisma locale recommandee:

- ne jamais pointer `DATABASE_URL` ou `DIRECT_URL` vers `template1`
- ne jamais lancer `prisma migrate dev` contre une base de production
- utiliser une base dediee de developpement, par exemple `fabsystem_dev`
- utiliser une base shadow dediee, par exemple `fabsystem_shadow`

Exemple local Postgres:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_dev`
- `DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_dev`
- `SHADOW_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/fabsystem_shadow`

Exemple Neon:

- `DATABASE_URL` peut pointer vers l'URL pooler applicative
- `DIRECT_URL` doit pointer vers l'URL directe non pooler pour Prisma
- `SHADOW_DATABASE_URL` doit pointer vers une base de developpement dediee
- ne jamais utiliser la base de production Neon pour `migrate dev`

Regle Prisma:

- `prisma migrate dev` est reserve au developpement local ou a une base de dev isolee
- `prisma migrate deploy` est la commande cible pour la production

### Preview

Usage:

- recette
- verification des parcours Stripe test
- verification des telechargements

### Production

Usage:

- trafic reel
- webhooks reels
- supervision active

Regles supplementaires MVP commerce:

- ne pas compter sur le fallback `request.url` pour construire les magic links en production
- verifier que `NEXT_PUBLIC_BASE_URL` pointe vers le domaine public final
- verifier que `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` correspondent bien au bon environnement
- verifier que `SUPABASE_SERVICE_ROLE_KEY` est configuree uniquement cote serveur

## Exigences avant commerce

Avant toute mise en production du nouveau domaine commerce:

- `.env.example` doit etre complet
- les variables doivent etre homogenes entre local, preview et production
- Stripe test et Stripe production doivent etre separes
- les secrets doivent etre verifies
- le comportement de webhook doit etre teste sur l'environnement cible
- la configuration Supabase Storage doit etre isolee par environnement
- le bucket prive cible doit etre defini
- le workflow Prisma local doit utiliser une shadow database explicite
- le rate limiting memoire actuel doit etre considere comme temporaire sur Vercel

## Checklist de build

Avant deploy:

- `npm run lint`
- `npm test`
- `npm run build`

Verifier ensuite:

- site public
- login admin
- dashboard
- pages marketing `/ebook` et `/ebook/cabler-son-van` (renvoient vers `/boutique`
  depuis le Sprint 8.9, le tunnel legacy est retire)
- webhooks Stripe touches par le sprint

## Checklist de validation pour le futur commerce MVP

Quand les sprints commerce demarreront, la checklist devra inclure:

- boutique charge correctement
- panier recalcule cote serveur
- creation `Order` en `PENDING_PAYMENT`
- webhook signe et journalise
- creation des `DownloadGrant`
- email transactionnel
- acces compte client
- generation de signed URLs Supabase
- verification qu'aucun asset prive n'est servi depuis `/public`

## Sauvegarde et rollback

Le minimum attendu avant commerce:

- procedure de rollback applicatif documentee
- verification que la base peut etre restauree selon les procedures equipe
- migration additive avec compatibilite descendante temporaire
- strategie de retour arriere pour les webhooks et jobs en erreur

## Points de vigilance Vercel

### Serverless

Il ne faut pas supposer:

- persistance memoire
- execution garantie apres la reponse HTTP
- traitement fiable base uniquement sur une instance vivante

### Consequence architecture

Les traitements critiques doivent reposer sur:

- la base de donnees
- des enregistrements durables
- des jobs rejouables

## Recommandations pratiques

1. Le flux ebook legacy a ete decommissionne au Sprint 8.9 (code applicatif) —
   ne plus le reconstruire ni le reutiliser comme reference d'architecture.
2. Ne pas lier un deploy commerce a une refonte simultanee du dashboard documents.
3. Journaliser les evenements Stripe et les echecs de livraison.
4. Verifier les telechargements prives apres chaque deploy touchant Stripe, Supabase Storage ou auth.
