# FabSystem Security

## Statut du document

- Date de reference: 2026-08-05
- Portee: securite actuelle et pre requis minimum avant commerce

## Posture actuelle

Le projet possede deja plusieurs garde-fous utiles:

- cookie de session admin signe
- verification serveur de session
- validation Zod sur plusieurs endpoints
- verification de signature Stripe
- tokens signes pour certains liens (magic link client)
- Supabase Storage prive pour les assets numeriques du nouveau commerce (le
  Blob prive legacy a ete retire au Sprint 8.9)

Mais cette posture reste insuffisante pour un commerce multi-produits sans durcissement cible.

## Risques observes

### 1. Authentification admin limitee

Le systeme actuel est adapte a un login admin simple, pas a un espace client commerce:

- pas de table `User`
- pas de separation claire admin / client
- pas de RBAC reel

### 2. WebAuthn non durable

Le stockage actuel en `/tmp` n'est pas un socle de production durable.

Ce sujet doit rester dans la roadmap securite, sans bloquer Sprint 0.

### 3. Rate limiting insuffisant

Une protection memoire-process n'est pas suffisante sur Vercel pour:

- login
- contact
- signature
- endpoints commerce sensibles

### 4. Contrat d'environnement incomplet

Les variables d'environnement sont utilisees de maniere partiellement incoherente, notamment entre:

- `AUTH_ADMIN_EMAIL`
- `ADMIN_EMAIL`

### 5. Historique juridique insuffisant

Sans snapshots immuables:

- une commande peut devenir ambigue
- une facture peut dependre du catalogue courant
- l'audit devient fragile

## Pre requis minimum avant commerce

Les points suivants sont consideres obligatoires avant de lancer le nouveau commerce en production:

1. correction du lint bloquant
2. contrat complet des variables d'environnement
3. verification des secrets Stripe
4. cookies securises
5. protection des routes compte et administration
6. rate limiting distribue ou compatible Vercel pour les endpoints sensibles
7. journalisation des evenements Stripe
8. idempotence des webhooks
9. aucun fichier numerique prive dans `/public`
10. liens temporaires ou route de telechargement autorisee
11. controle serveur du droit de telechargement
12. snapshots immuables pour commandes et documents
13. aucun SQL dynamique non necessaire
14. sauvegarde et procedure de rollback

## Regles de securite pour le MVP

## Auth et identite

- `User` porte la connexion
- `Customer` porte l'identite commerciale
- un client ne peut voir que ses propres `Order` et `DownloadGrant`
- le dashboard admin conserve sa protection dediee

## Paiement

- les montants sont recalcules cote serveur
- la redirection Stripe ne confirme jamais seule un paiement
- le webhook signe confirme le paiement
- les traitements webhook sont idempotents

## Fichiers numeriques

- les assets prives restent hors `/public`
- l'acces final passe par une verification serveur
- les liens signes ont une duree de vie courte
- le droit provient d'un `DownloadGrant`, pas d'un simple parametre URL
- les nouveaux fichiers numeriques vendus utilisent un bucket prive Supabase Storage
- aucune generation de signed URL privee cote client
- aucune signed URL longue duree
- l'application importe Supabase Storage via `lib/server/supabase-storage.ts` uniquement
- `lib/supabase-storage.ts` reste reserve a la logique pure testable et aux tests
- audit des telechargements recommande
- revocation possible via `DownloadGrant`

## Journalisation

Il faut tracer au minimum:

- creation de checkout
- reception webhook
- changement d'etat `Order`
- changement d'etat `Payment`
- creation ou echec de `DownloadGrant`
- telechargements sensibles si necessaire

Les logs ne doivent jamais contenir:

- mot de passe
- secret
- token brut
- donnee carte
- magicLink complet
- cookie brut
- signed URL Supabase complete

### Etat apres Sprint 7.2

Le projet applique maintenant une redaction defensive dans le logger serveur pour:

- les champs nommes `token`, `secret`, `password`, `cookie`, `authorization`, `session`
- les URLs contenant `?token=...`
- les en-tetes `Authorization: Bearer ...`
- les chaines de type cookie

## Routes a proteger fortement

### Admin

- `/dashboard/*`
- `/api/internal/*`

### Compte client futur

- `/compte/*`
- `/api/commerce/orders/*`
- `/api/commerce/downloads/*`

### Paiement

- `/api/commerce/checkout`
- `/api/stripe/webhook`

## Recommandations de mise en oeuvre

### Rate limiting

Adopter une solution compatible Vercel pour:

- login
- contact
- checkout
- downloads sensibles

### Etat MVP actuel

Un rate limiter memoire-process existe deja et protege desormais:

- `POST /api/client-auth/request-link`
- `GET /api/client-auth/verify`
- `POST /api/orders`
- `POST /api/checkout`
- `GET /api/downloads/[grantId]`

Limite connue:

- ce rate limiter n'est pas distribue
- il reste acceptable pour le MVP et le developpement
- il devra etre remplace ou complete avant une forte exposition multi-instance

### Verification d'environnement

Documenter et verifier:

- presence des variables obligatoires
- coherence des noms
- separation test / production

### Defense en profondeur

- validation Zod en entree
- verification d'autorisation avant tout acces prive
- transactions pour les changements d'etat critiques
- contraintes d'unicite pour deduplication Stripe

### Legacy

- le tunnel ebook (checkout direct, telechargement par token, Vercel Blob) a
  ete decommissionne au Sprint 8.9 — voir
  `docs/audits/ecommerce-legacy-decommission-2026-08-06.md`
- ses mecanismes Blob/token ne doivent pas etre reutilises pour le nouveau commerce
- la table `EbookOrder` reste presente en base (aucune migration de suppression
  ce sprint) mais n'est plus lue ni ecrite par aucun code applicatif

## Ce qui peut rester separe du lancement Sprint 0

Peut rester dans une piste securite distincte:

- MFA admin
- WebAuthn durable
- architecture d'audit plus avancee

Important:

ces sujets sont importants, mais ils ne doivent pas retarder le cadrage et la stabilisation du MVP numerique.
