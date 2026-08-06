# Plan de configuration production — Sprint 8.8 — 2026-08-06

## Statut du document

- Portée : **plan et checklist d'actions manuelles**, aucune exécution dangereuse
- Aucune migration créée, aucun schéma Prisma modifié
- Aucune base prod touchée (hors lecture explicitement décrite comme telle)
- Aucun paiement live lancé, aucun remboursement live lancé
- Aucun produit/prix Stripe créé automatiquement, aucune synchronisation
  products/prices
- Legacy ebook non touché, Vercel Blob non modifié
- Aucune clé secrète ni ID sensible affiché — tout est décrit par nom de variable
  ou masqué

> **Mise à jour Sprint 8.9** : le tunnel ebook legacy a depuis été décommissionné
> (`docs/audits/ecommerce-legacy-decommission-2026-08-06.md`). Les lignes
> concernant `STRIPE_PRICE_ID_EBOOK`, `EBOOK_ACCESS_TOKEN_SECRET` et
> `BLOB_READ_WRITE_TOKEN` ci-dessous datent du Sprint 8.8 et sont conservées
> pour l'historique ; ces variables ne sont plus nécessaires en production.
- Ce sprint n'a **pas** utilisé de connecteur Stripe/Supabase pour lire ou modifier
  un compte réel : toutes les actions décrites ci-dessous restent **à exécuter
  manuellement par Fabien**, dans l'ordre recommandé en fin de document

---

## 1. Résumé de l'état actuel

Acquis (Sprints 8.4 → 8.7b, validés localement) :

- MVP e-commerce fonctionnel en local : catalogue, panier, commande, checkout Stripe
  test, webhook, compte client, magic link dev, remise coaching, remboursement Stripe
  test — recette complète documentée dans
  `docs/audits/ecommerce-local-acceptance-2026-08-06.md` et la recette remboursement
  associée.
- 303 tests automatisés passants, lint propre, schéma Prisma valide.
- Document de readiness production existant :
  `docs/audits/ecommerce-production-readiness-2026-08-06.md` (variables, Stripe,
  Supabase, procédure produit, smoke test, risques, Go/No-Go).
- Contrôle sécurité effectué (Sprint 8.7b) : `.env.example` nettoyé, aucun secret
  réel ni ambigu détecté dans l'historique git local, `.gitignore` renforcé.
- Correction technique appliquée : `lib/services/download-access.ts` ne résout plus
  la configuration Supabase avant d'avoir vérifié que le `DownloadGrant` est actif
  (évite de masquer un rejet métier derrière une erreur de config).

Ce qui manque encore pour un lancement réel, confirmé par relecture de
`lib/server/env.ts`, `lib/server/stripe.ts`, `lib/server/supabase-storage.ts`,
`app/api/stripe/webhook/route.ts` :

1. **Aucune variable Supabase n'existe nulle part en dehors du poste local** — le
   provider cible des téléchargements privés n'est pas encore provisionné.
2. **Aucun endpoint webhook Stripe live n'est configuré** côté dashboard Stripe.
3. **Aucune variable de production n'est confirmée dans Vercel** pour ce sprint —
   ce plan liste ce qui doit y être créé, sans le faire à la place de Fabien.
4. Le code est prêt côté logique : `buildCheckoutSessionParams`
   (`lib/services/checkout.ts`) construit les `line_items` via `price_data`
   dynamique — aucune dépendance à un `Price` Stripe préexistant, donc aucune
   synchronisation produit/prix n'est nécessaire ni souhaitable.
5. Le webhook (`app/api/stripe/webhook/route.ts`) route déjà correctement les deux
   flux : `isCommerceCheckoutSession()` teste la présence de `orderId` /
   `orderNumber` / `paymentId` dans les metadata Stripe pour distinguer le nouveau
   commerce du tunnel legacy ebook, qui reste intact dans la branche `else`.

---

## 2. Variables Vercel Production à configurer

Aucune variable réelle n'a été modifiée. Tableau de référence pour la saisie
manuelle dans Vercel → Project Settings → Environment Variables → **Production**.

### Base de données

| Variable | Obligatoire | Portée | Risque si absente | Vérification sans exposer la valeur |
|---|---|---|---|---|
| `DATABASE_URL` | Oui | Serveur uniquement | Toute requête Prisma échoue au runtime (`lib/prisma.ts` lève `Missing DATABASE_URL`) | Déployer un environnement Preview avec la variable définie et vérifier qu'une page qui lit la base (ex. `/boutique`) charge sans erreur 500 |
| `DIRECT_URL` | Oui pour le build/déploiement | Serveur uniquement (migrations) | `prisma migrate deploy` échoue au déploiement (`prisma.config.ts` lève `Missing DATABASE_URL`/`DIRECT_URL`) | Vérifier que le build Vercel se termine sans erreur Prisma dans les logs de build |
| `SHADOW_DATABASE_URL` | **Non** | — | Aucun — non lue en runtime prod, uniquement par `prisma migrate dev` en local/CI | Ne pas la définir en Production ; la garder uniquement en local/CI |

### App

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Oui | **Publique** (préfixe `NEXT_PUBLIC_`, exposée au navigateur intentionnellement) | Erreur explicite `Missing NEXT_PUBLIC_BASE_URL` en production (`lib/server/env.ts::getRequiredBaseUrl` — aucun fallback `request.url` autorisé hors développement) ; sans elle, magic links et redirections Stripe `success_url`/`cancel_url` sont cassés | Ouvrir `https://www.fabsystem.fr` et vérifier qu'un lien de retour Stripe (visible en Preview via une session test) pointe vers le bon domaine |

Valeur attendue : `https://www.fabsystem.fr` (ou domaine prod réel confirmé par
Fabien).

### Admin

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `AUTH_ADMIN_EMAIL` | Oui | Serveur | Login admin impossible | Tenter `/login` avec l'email attendu, sans jamais logger la valeur |
| `AUTH_ADMIN_PASSWORD_HASH` | Oui | Serveur (hash bcrypt, jamais le mot de passe en clair) | Login admin impossible | Idem — un login réussi confirme la présence/cohérence sans exposer le hash |
| `AUTH_SESSION_SECRET` | Oui | Serveur | Toute vérification de session échoue (`lib/session.ts`, `middleware.ts`) | Un login admin réussi suivi d'un accès `/dashboard` confirme la présence |

### Stripe — nouveau commerce

| Variable | Obligatoire | Portée | Risque si absente/incorrecte | Vérification |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Oui | Serveur uniquement (`lib/server/stripe.ts`, `import "server-only"`) | Aucun checkout ni remboursement possible ; **si une clé `sk_test_` est utilisée en prod par erreur, les paiements « réussissent » sans jamais encaisser réellement** | Vérifier le préfixe `sk_live_` côté dashboard Vercel au moment de la saisie (jamais en le collant dans un log applicatif) |
| `STRIPE_WEBHOOK_SECRET` | Oui | Serveur uniquement | Tous les webhooks Stripe live rejetés en `400` (signature invalide) — aucune commande ne passe jamais `PAID` | Envoyer un événement de test depuis le dashboard Stripe (bouton dédié) et vérifier un `200` dans les logs Vercel, sans loguer le secret |

### Stripe — legacy encore actif

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `STRIPE_PRICE_ID_EBOOK` | **Non — retiré au Sprint 8.9** | — | ~~Le tunnel ebook historique casse~~ route supprimée | — |
| `EBOOK_ACCESS_TOKEN_SECRET` | **Non — retiré au Sprint 8.9** | — | ~~Les liens legacy deviennent invalides~~ route supprimée | — |

### Email

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `SMTP_HOST` | Oui | Serveur | Envoi d'email impossible | Smoke test Partie 6 (demande de magic link) |
| `SMTP_PORT` | Oui | Serveur | Idem | Idem |
| `SMTP_SECURE` | Oui (`true`/`false` explicite — `lib/server/env.ts::parseSmtpSecure` rejette toute autre valeur) | Serveur | Erreur explicite au premier envoi si mal formée | Idem |
| `SMTP_USER` | Oui | Serveur | Envoi d'email impossible | Idem |
| `SMTP_PASS` | Oui | Serveur | Envoi d'email impossible | Idem — ne jamais logger |
| `CONTACT_FROM` | Oui | Serveur | Fallback incomplet selon le flux | Vérifier l'expéditeur de l'email reçu lors du smoke test |
| `CONTACT_TO` | Oui si le formulaire de contact public reste actif | Serveur | Les messages de contact public ne sont reçus nulle part | Tester le formulaire de contact séparément si dans le périmètre du déploiement |

**Important** : en production, il n'existe **aucun fallback** « pas de SMTP → magic
link renvoyé en clair dans la réponse JSON » — ce fallback n'existe qu'en
`development` (`lib/services/customer-auth-request-link.ts`). Une config SMTP prod
incomplète casse silencieusement toute connexion client par lien magique.

### Supabase

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `SUPABASE_URL` | Oui | Serveur uniquement (`lib/server/supabase-storage.ts`, `import "server-only"`) | Tout téléchargement échoue avec une erreur de configuration explicite | Tenter un téléchargement authentifié sur un grant actif de test et vérifier l'absence d'erreur `Missing SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | **Strictement serveur** — ne jamais définir sans le préfixe serveur, jamais en `NEXT_PUBLIC_*` | Idem | Idem — ne jamais logger cette valeur, même partiellement |
| `SUPABASE_STORAGE_BUCKET_EBOOKS` | Oui | Serveur | Signed URL générée pour le mauvais bucket, ou erreur si le bucket configuré n'existe pas | Vérifier que le nom correspond exactement au bucket créé dans Supabase (Partie 4) |

### Legacy Blob

| Variable | Obligatoire | Portée | Risque si absente | Vérification |
|---|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | **Non — retiré au Sprint 8.9** | — | ~~SDK Vercel Blob~~ `@vercel/blob` retiré de `package.json` | — |

### Règle de sécurité transverse (déjà vérifiée dans le code, Sprint 8.7)

- Aucune variable sensible n'est exposée via `NEXT_PUBLIC_*` autre que
  `NEXT_PUBLIC_BASE_URL`.
- `STRIPE_SECRET_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ne sont lues que dans des
  modules marqués `import "server-only"`.

**Aucune variable Vercel réelle n'a été créée ni modifiée dans ce sprint.** La
saisie reste une action manuelle de Fabien dans le dashboard Vercel.

---

## 3. Stripe live — webhook sans paiement

### Endpoint à créer côté dashboard Stripe (live)

```
https://www.fabsystem.fr/api/stripe/webhook
```

### Événements à cocher au minimum

- `checkout.session.completed`
- `checkout.session.expired`

### Événements que le code accepte sans effet métier (peuvent être cochés sans risque)

- `payment_intent.succeeded`
- `payment_intent.created`
- `charge.succeeded`
- `charge.updated`

Le handler (`app/api/stripe/webhook/route.ts`) filtre explicitement sur
`event.type` : seuls `checkout.session.completed` et `checkout.session.expired`
déclenchent un traitement ; tout autre type reçoit un `200 { ok: true }`
immédiat sans effet de bord — les cocher ou non dans le dashboard Stripe est donc
sans conséquence fonctionnelle, seulement une question de volumétrie de logs.

### Règles impératives à respecter à la configuration

- Le `whsec_...` **live** (généré au moment de la création de l'endpoint dans le
  dashboard Stripe) est **différent** du `whsec_...` **local** généré par
  `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Ne jamais copier
  l'un à la place de l'autre.
- Ne jamais utiliser `sk_test_...` en production.
- Ne jamais utiliser `sk_live_...` en local ou en environnement de test/preview.
- Le routage nouveau commerce / legacy repose sur `isCommerceCheckoutSession()`
  (`lib/services/stripe-webhook-commerce.ts`), qui teste la présence de
  `metadata.orderId`, `metadata.orderNumber` et `metadata.paymentId` sur la
  session Stripe : si ces trois clés sont absentes, l'événement est traité par la
  branche legacy historique (`EbookOrder`), inchangée. Vérifier après tout test
  webhook que le bon flux a été emprunté (log serveur `flow: "commerce"` ou
  `flow: "legacy_ebook"`, déjà en place dans le handler).

### Vérification sans paiement

- Utiliser exclusivement le bouton « Envoyer un événement de test » du dashboard
  Stripe (payload synthétique, aucun mouvement d'argent) pour confirmer que
  l'endpoint répond `200` avec la bonne signature.
- Ne jamais dérouler un parcours de paiement réel jusqu'au bouton de paiement en
  configuration live pendant ce sprint.

### Option connecteur Stripe (non utilisée dans ce sprint)

Un accès Stripe en lecture aurait permis de vérifier à distance la présence et la
configuration de l'endpoint webhook live et son `livemode`, sans créer ni
rembourser aucun paiement. **Ce sprint ne l'a pas fait** : aucune connexion à un
compte Stripe réel n'a été établie, pour rester strictement dans le périmètre
« plan sans exécution dangereuse ». Si Fabien souhaite cette vérification assistée
lors d'un prochain sprint, elle devra rester strictement en lecture (présence de
l'endpoint, événements cochés, `livemode: true`) — aucune création, modification ou
suppression d'objet Stripe.

---

## 4. Supabase production — procédure

Aucune action exécutée dans ce sprint. Procédure à dérouler manuellement par
Fabien :

1. Créer ou vérifier l'existence d'un projet Supabase dédié (ou partagé, selon
   décision de Fabien — non tranché ici).
2. Créer un bucket **privé** pour les ebooks. Nom conseillé : `ebooks-private`
   (cohérent avec `.env.example` et la documentation existante).
3. Uploader le fichier ebook réel dans ce bucket.
4. Chemin recommandé, cohérent avec le seed/les tests existants :
   ```
   ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf
   ```
5. Vérifier explicitement dans les réglages du bucket qu'il est **privé** (pas de
   lecture publique anonyme).
6. Créer/récupérer la clé **service role** — jamais la clé publique `anon` pour ce
   flux — et ne la manipuler que côté serveur (jamais collée dans un fichier
   versionné, jamais dans un message partagé en clair).
7. Ajouter dans Vercel (Production) :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET_EBOOKS=ebooks-private`

### Vérifications déjà faites dans le code (Sprint 8.7, reconfirmées ici)

- `SUPABASE_SERVICE_ROLE_KEY` n'est lue que dans `lib/supabase-storage.ts`, importé
  uniquement via le wrapper serveur `lib/server/supabase-storage.ts`
  (`import "server-only"`) — jamais accessible côté client.
- Signed URL à durée courte : 300 secondes par défaut, 600 secondes maximum
  (`SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS` /
  `_MAX_TTL_SECONDS`, `lib/supabase-storage.ts`).
- Aucune URL signée n'est jamais persistée en base : `getDownloadAccessForGrant`
  la génère à la demande et la retourne directement, sans écriture sur
  `DownloadGrant`.
- Aucune variable `NEXT_PUBLIC_SUPABASE_*` n'est utilisée pour les téléchargements
  privés (recherche effectuée dans `lib/` et `app/`, aucune occurrence).
- Depuis la correction Sprint 8.7 (`lib/services/download-access.ts`), la
  résolution de la configuration Supabase est différée après la vérification que
  le `DownloadGrant` est actif — aucun appel Supabase prématuré pour un grant
  révoqué/expiré/inactif.

**Aucun bucket créé, aucun fichier uploadé, aucune clé Supabase générée ou saisie
dans ce sprint.**

---

## 5. Procédure produit réel (dashboard, sans exécution automatique)

Catalogue FabSystem = source de vérité dans Prisma (`Product`, `ProductPrice`,
`DigitalAsset`). Stripe reste uniquement le processeur de paiement via
`price_data` dynamique — **aucune synchronisation Stripe products/prices**, conforme
à la contrainte du sprint.

### Ebook van

| Champ | Valeur recommandée |
|---|---|
| Slug | `ebook-electricite-van` |
| Nom | Ebook Électricité Van |
| Type | `EBOOK` |
| `purchaseMode` | `BUY_NOW` |
| Prix | **à confirmer par Fabien** — non fixé dans ce plan |
| Statut initial | `DRAFT` |

Asset associé :

| Champ | Valeur recommandée |
|---|---|
| `provider` | `SUPABASE` |
| `bucket` | `ebooks-private` |
| `path` | `ebooks/ebook-electricite-van/v1/ebook-electricite-van.pdf` |
| `filename` | `ebook-electricite-van.pdf` |
| `status` | `ACTIVE` — uniquement une fois le fichier réellement présent dans Supabase |

### Étapes (dashboard `/dashboard/catalog`)

1. Créer le produit en `DRAFT`.
2. Créer un `ProductPrice` actif unique (prix confirmé par Fabien).
3. Créer la référence `DigitalAsset` — `status = ACTIVE` seulement après upload
   réel du fichier (Partie 4, étape 3).
4. Lier `DigitalAsset` au produit.
5. Activer le produit (`ACTIVE`) seulement quand **toutes** ces conditions sont
   réunies :
   - un unique prix `ACTIVE`
   - un asset `ACTIVE` lié
   - le fichier réellement présent dans le bucket Supabase au chemin déclaré
   - smoke test admin OK (édition/lecture du produit dans le dashboard sans
     erreur)
6. Vérifier `/boutique` : le produit apparaît avec le bon prix.
7. Vérifier `/boutique/[slug]` : la fiche produit s'affiche correctement.

### Futur ebook bateau

Même logique (`slug`, `path` Supabase distincts), **non créé dans ce sprint** —
préparé uniquement si/quand Fabien le demande explicitement.

---

## 6. Smoke test prod sans encaissement

À dérouler après déploiement et configuration des variables (Parties 2 à 5),
**sans jamais finaliser un paiement Stripe live** :

- [ ] Page d'accueil charge
- [ ] `/boutique` charge, produit(s) actif(s) visible(s)
- [ ] `/boutique/[slug]` charge pour un produit actif
- [ ] Ajout au panier fonctionne
- [ ] `/panier` charge, contenu cohérent
- [ ] Formulaire email de checkout visible et utilisable
- [ ] Création de commande : **selon la stratégie retenue par Fabien**, soit
      testée (voir avertissement ci-dessous), soit simplement vérifiée comme
      accessible sans être déclenchée
- [ ] Ne pas finaliser le paiement Stripe live à aucun moment de ce test
- [ ] `/connexion-client` charge
- [ ] Demande de lien magique avec une adresse email contrôlée par Fabien
- [ ] Email reçu (confirme SMTP prod fonctionnel)
- [ ] `/mon-compte` charge après connexion
- [ ] `/dashboard` login fonctionne
- [ ] `/dashboard/catalog` charge
- [ ] `/dashboard/orders` charge
- [ ] `/dashboard/discounts` charge

### Avertissement — commande créée sans paiement

Si une commande est créée en production dans le cadre de ce smoke test sans aller
au bout du paiement Stripe, elle restera en base avec `Order.status =
PENDING_PAYMENT` indéfiniment (aucun job de nettoyage automatique identifié dans le
code lu). C'est **acceptable** pour un test ponctuel mais doit être **documenté** —
et, si souhaité, cette commande de test pourra être identifiée et laissée telle
quelle (elle n'a aucun effet tant qu'aucun paiement n'est confirmé par webhook).

---

## 7. Risques restants

| Risque | Impact | Statut |
|---|---|---|
| Aucune variable Supabase en production | Tout téléchargement réel impossible | Bloquant tant que Partie 4 n'est pas exécutée |
| Aucun endpoint webhook Stripe live configuré | Aucune commande ne peut jamais passer `PAID` en prod | Bloquant tant que Partie 3 n'est pas exécutée |
| Variables Vercel non confirmées comme présentes | Risque de démarrage en erreur silencieuse selon la variable | À vérifier une à une (Partie 2) avant tout smoke test |
| Mauvais bucket ou mauvais chemin d'asset | Téléchargement d'un fichier inexistant ou refusé | À vérifier manuellement avant toute activation produit (Partie 5) |
| Confusion `whsec` live / local | Tous les webhooks live rejetés en `400` | Rappel explicite en Partie 3 |
| SMTP prod non vérifié avant lancement client | Magic link cassé silencieusement, aucun fallback en prod | Couvert par le smoke test (Partie 6), pas encore exécuté |
| Commande `PENDING_PAYMENT` orpheline après smoke test | Bruit dans `/dashboard/orders`, aucun risque fonctionnel | Acceptable si documenté (voir avertissement Partie 6) |
| Legacy ebook toujours actif | Surface Stripe supplémentaire à surveiller | Assumé, non modifié, conforme à `docs/15-LEGACY-EBOOK-DECOMMISSION.md` (Phase A) |

---

## 8. Go / No-Go

- **GO technique local** : oui — 303 tests passants, lint et Prisma OK, flux
  complet vérifié en local (Sprints 8.4 → 8.7b).
- **GO après Partie 2 complétée** : conditionnel — toutes les variables Vercel
  Production listées doivent être créées et vérifiées une à une.
- **GO après Partie 3 complétée** : conditionnel — endpoint webhook Stripe live
  créé, `whsec_` live copié (jamais le local), test d'événement `200` confirmé.
- **GO après Partie 4 complétée** : conditionnel — bucket privé créé, fichier
  réel uploadé, variables Supabase renseignées.
- **GO après Partie 5 complétée pour au moins un produit** : conditionnel — sans
  cela, `/boutique` reste vide en production.
- **NO-GO si `STRIPE_SECRET_KEY` absente ou non `sk_live_`** : bloquant absolu.
- **NO-GO si `SUPABASE_SERVICE_ROLE_KEY` absente** : bloquant absolu.
- **NO-GO si un produit passe `ACTIVE` sans fichier réellement présent dans
  Supabase** : bloquant — un client pourrait payer pour un fichier inexistant.

---

## 9. Actions manuelles à faire par Fabien

Aucune de ces actions n'a été exécutée par Claude dans ce sprint — toutes
nécessitent un accès direct aux dashboards Vercel/Stripe/Supabase ou une décision
métier (prix, domaine, timing).

1. Créer/vérifier les variables Vercel Production listées en Partie 2.
2. Créer l'endpoint webhook Stripe live et copier le `whsec_` live dans Vercel
   (Partie 3).
3. Créer le bucket Supabase privé, uploader le fichier ebook réel, créer la
   service role key, renseigner les variables Supabase dans Vercel (Partie 4).
4. Confirmer le prix de vente de l'ebook van.
5. Créer le produit réel dans `/dashboard/catalog` en suivant la Partie 5,
   l'activer seulement une fois toutes les conditions réunies.
6. Dérouler le smoke test de la Partie 6 après déploiement, en confirmant au
   préalable s'il faut ou non tester la création d'une commande `PENDING_PAYMENT`.
7. Décider si le connecteur Stripe doit être utilisé lors d'un prochain sprint
   pour une vérification en lecture seule du webhook live (optionnel, non fait ici).

---

## 10. Ordre recommandé d'exécution

1. Variables Vercel Production (Partie 2) — base, app, admin, email d'abord (rien
   ne dépend de Stripe/Supabase pour ces briques).
2. Bucket et variables Supabase (Partie 4) — nécessaire avant d'activer un produit
   réel.
3. Webhook Stripe live + variables Stripe nouveau commerce (Partie 3) — nécessaire
   avant tout test de checkout, même sans paiement.
4. Produit réel dans le dashboard (Partie 5) — dépend des étapes 1 et 2.
5. Déploiement production.
6. Smoke test complet sans encaissement (Partie 6).
7. Décision finale Go / No-Go pour l'ouverture au paiement live (hors périmètre de
   ce sprint).

---

## Validation (Sprint 8.8)

| Commande | Résultat |
|---|---|
| `npx prisma generate` | OK |
| `npx prisma validate` | OK — schema valide |
| `npm run lint` | OK — aucune erreur |
| `npm test` | OK — **303/303 tests** (inchangé — ce sprint n'a modifié que de la documentation) |

Aucune migration créée. Aucun schéma Prisma modifié. Aucune base prod touchée.
Aucun paiement live lancé. Aucun remboursement live lancé. Aucun secret affiché
dans ce document.
