# PHASE-1-AUDIT — FabSystem

**Date : 10/08/2026**
**Portée : audit du dépôt réel, comparé à `MASTER-00-GLOBAL.md`, `MASTER-10-ARCHITECTURE-TECHNIQUE.md`, `MASTER-11-ROADMAP.md` (et lecture ponctuelle de MASTER-04, MASTER-09 pour contextualiser l'auth et l'Admin).**
**Aucune implémentation, aucune modification de fichier métier n'a été réalisée pendant cet audit.**

---

# Résumé exécutif

Le dépôt correspond fidèlement à la description « Couche 1 — Infrastructure existante » du MASTER-11 : un socle commerce/Admin/auth en production, sans aucune trace du futur socle SaaS (`Project`, capabilities, accompagnement, Volta, recommandations). Les descriptions de MASTER-10 sur la « production actuelle » et la « dette technique » sont vérifiées comme exactes dans le code, à une exception près : **la dette critique A (magic link créant un `Customer` inconnu) n'est PAS corrigée** — c'est l'écart le plus important trouvé pendant cet audit, et il contredit une règle absolue du MASTER-00 (§6, §16.4) et du MASTER-10 (§17, dette « priorité haute »).

Le reste du socle (webhook Stripe signé, `payment_status === "paid"`, purge des commandes `PENDING_PAYMENT`, téléchargements via signed URL Supabase avec contrôle d'ownership, session Admin HMAC, WebAuthn, rate limiting mémoire) est conforme à ce que MASTER-10 documente comme production actuelle.

Aucun élément de l'architecture cible (`Project`, `Accompagnement`, `capabilities/entitlements`, `deleteScheduledAt`, recommandations Fabien, Volta) n'existe dans le schéma Prisma ni dans le code — ce qui est normal et attendu par le MASTER, pas une anomalie.

---

# Architecture actuelle

- **Framework** : Next.js 16 (App Router), React 19, TypeScript, build webpack (`npm run build` → `prisma generate && next build --webpack`). Un script `build:turbopack` existe en parallèle mais n'est pas le build de référence documenté (MASTER-10 §3).
- **Hébergement** : Vercel (`vercel.json` minimal : framework nextjs, installCommand, buildCommand). `.vercel/project.json` présent → projet lié.
- **Base de données** : PostgreSQL via Prisma, `DATABASE_URL` / `DIRECT_URL` / `SHADOW_DATABASE_URL` définis dans `.env.example`, cohérent avec Neon (MASTER-10 §3, §8).
- **Stockage fichiers** : Supabase Storage exclusivement (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET_EBOOKS`). Aucune référence active à Vercel Blob (`BLOB_READ_WRITE_TOKEN`, `EBOOK_ACCESS_TOKEN_SECRET` : zéro occurrence dans `app/`, `lib/`, `scripts/`) — conforme à MASTER-10 §6.
- **Paiement** : Stripe (`stripe`, webhook signé sur `app/api/stripe/webhook/route.ts`).
- **Auth** : deux systèmes distincts et volontairement séparés — session Admin HMAC (cookie signé) + WebAuthn/passkey d'un côté, magic link + session opaque Customer de l'autre. Pas de Supabase Auth, pas de NextAuth.
- **Structure `app/`** : site public (boutique, prestations, formations, outils, réalisations…), `app/dashboard/*` (Admin), `app/mon-compte` (espace client, une seule page), `app/api/*` (routes serveur), `app/sign/[id]` (signature de devis).
- **Structure `lib/`** : pas de séparation formelle en couches nommées `domain/infra`, mais une convention `lib/services/*` (logique métier orchestrée), `lib/server/*` (wrappers `server-only` : Prisma adapter, Stripe, Supabase Storage, nodemailer, env, sessions), `lib/client/*` (code exécuté côté navigateur : cart drawer context, tracking, stockage localStorage des besoins prestations). Le reste de `lib/` (racine) mélange schémas Zod, payloads, PDF, helpers génériques.
- **Composants** : `components/{cart,customer,dashboard,dashboard-preview,prestations,sign}` — pas de dossier `components/ui` générique ni de design system consolidé détecté.
- **Hooks React personnalisés** : aucun dossier `hooks/` ni fichier `use-*.ts(x)` trouvé dans le dépôt applicatif. Toute la logique d'état vit dans les composants ou dans `lib/client/*`.
- **Middleware** : un seul `middleware.ts` à la racine, protège uniquement `/dashboard/:path*` en vérifiant le cookie de session Admin HMAC (SHA-256, expiration dans le payload). L'espace client (`/mon-compte`) n'a pas de middleware dédié — la protection semble donc reposer sur des vérifications au niveau des routes/pages elles-mêmes (à confirmer lors de l'audit détaillé du domaine Compte Client, hors périmètre strict de cette phase).
- **Jobs** : aucun cron/scheduler détecté dans le dépôt (pas de `vercel.json` cron, pas de dossier jobs). La purge des commandes `PENDING_PAYMENT` (`lib/services/order-purge.ts`) est exposée comme action Admin manuelle (`purgeAllEligiblePendingOrders`), pas un job planifié — cohérent avec le commit récent `feat(dashboard): purge manuelle des commandes PENDING_PAYMENT abandonnees`.
- **`ebook/` (racine, hors `app/`)** : contient encore des fichiers `.epub`/`.html` d'ebooks. Il ne s'agit pas de code (pas de route qui les sert directement d'après la recherche effectuée), probablement des sources statiques pour génération d'assets — à vérifier si utilisé par un script de build ou totalement orphelin.

---

# État de Prisma

Le schéma (`prisma/schema.prisma`, 45 modèles/enums) correspond exactement à l'inventaire du MASTER-10 §7 :

**Présents** : `Customer`, `Quote`/`QuoteItem`, `Invoice`/`InvoiceItem`, `Product`/`ProductPrice`, `DigitalAsset`/`ProductAsset`, `Cart`/`CartItem`, `Order`/`OrderItem`, `Payment`, `DownloadGrant`, `DiscountCode`/`DiscountRedemption`, `MagicLoginToken`, `CustomerSession`, `Testimonial`, plus des modèles commerce historiques (`Remise`, `ItemTemplate`, `DocumentSequence`, `BundleItem`).

**Absents (conforme à MASTER-10 §7, ce sont des cibles, pas de la dette)** :
- `Project` — inexistant.
- Modèle d'accompagnement Projet — inexistant.
- Entitlements/capabilities — inexistants.
- Recommandations de Fabien — inexistantes.
- Modèle de suppression différée Projet (`deleteScheduledAt` ou équivalent) — inexistant.

**Champ d'origine du compte (`PURCHASE`/`ADMIN`)** : confirmé absent du modèle `Customer` (aucune référence trouvée dans le schéma ni dans le code). Conforme à ce que MASTER-10 §10-11 décrit comme cible non encore implémentée.

**Migrations** : 23 migrations horodatées de `20260227` à `20260807`, nommage cohérent, pas de doublon apparent. La plus récente (`20260807190259_drop_legacy_ebook_order`) confirme le décommissionnement effectif de l'ancien tunnel ebook au niveau base de données, cohérent avec MASTER-10 §6.

**Pas de table `StripeEvent`** — conforme à MASTER-10 §24-25 (non requise sans besoin identifié).

---

# État de l'authentification

## Admin (session HMAC + WebAuthn)
- `middleware.ts` : vérifie un cookie signé HMAC-SHA256 avec expiration dans le payload, redirige vers `/login` si absent/invalide/expiré. Conforme à MASTER-10 §12.
- `app/api/auth/login/route.ts` : rate limiting (5 tentatives / 15 min, blocage 30 min), comparaison bcrypt, utilise **`AUTH_ADMIN_EMAIL`**.
- `app/api/auth/webauthn/options/route.ts` : utilise **`ADMIN_EMAIL`** (`process.env.ADMIN_EMAIL || "admin@fabsystem.fr"`).
- → **Confirme exactement la dette technique B décrite au MASTER-10 §14/§77.B** : deux variables différentes pour la même identité Admin selon le flux.
- WebAuthn : routes `options`/`verify` présentes, `@simplewebauthn/server` en dépendance — pas de second système passkey détecté.

## Client (magic link + session opaque)
- `lib/services/customer-auth.ts` : implémente token brut jamais persisté (seul le hash SHA-256 est stocké), révocation des tokens actifs précédents à chaque nouvelle demande, TTL magic link = **15 min** (`MAGIC_LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000`), TTL session = **30 jours** (`CUSTOMER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000`). Conforme à MASTER-10 §15-16, §81.
- Réponse publique anti-énumération (`lib/customer-auth-request.ts`) : message générique identique que le compte existe ou non. Conforme à MASTER-10 §18.
- **Écart critique** : dans `requestMagicLoginLink()` (`lib/services/customer-auth.ts`), lorsque `findCustomerByEmail` ne retourne rien, le code exécute :
  ```ts
  } else {
    customer = await tx.createCustomer({
      email: normalizedEmail,
      name: normalizedName ?? null,
      status: "ACTIVE",
    });
  }
  ```
  Une adresse email inconnue **crée bien un `Customer`** avant d'envoyer le lien. C'est exactement le comportement que MASTER-00 §16.4 interdit (« Ne pas créer d'inscription publique libre ») et que MASTER-10 §17 qualifie de dette technique **priorité haute**, à corriger avant tout chantier Project (MASTER-11 §9, §79.1, §93.1).

---

# État de l'Admin

- Protection globale via middleware sur `/dashboard/:path*`.
- Domaines couverts : `customers`, `accounting`, `invoices`, `quotes`, `catalog` (+ `assets`, `new`, `[productId]`), `discounts` (+ `new`, `remises`), `content/testimonials`, `orders` (+ `[orderId]`).
- Services associés dans `lib/services/` : `admin-orders.ts`, `admin-refunds.ts`, `customers.ts`, `invoices.ts`, `quotes.ts`, `remises.ts`, `discounts.ts`, `testimonials.ts`, `ecommerce-stats.ts`.
- Purge des commandes `PENDING_PAYMENT` : suppression individuelle sans seuil d'ancienneté mais avec les mêmes garde-fous absolus (paiement réussi, téléchargement déjà accordé, remise consommée, paiement Stripe encore `PENDING`, commande gratuite déjà finalisée) ; purge groupée limitée aux commandes ≥ 5 jours. Correspond exactement à MASTER-10 §27-30.
- Pas de dashboard Accompagnement/Vue Fabien/Project — normal, ces objets n'existent pas encore (MASTER-11 §61).

---

# État des API

Domaines de routes API observés sous `app/api/` : `auth` (login, logout, webauthn), `cart` (+ `discounts`, `items`), `checkout`, `client-auth` (`logout`, `me`, `request-link`, `verify`), `contact`, `downloads/[grantId]`, `internal/*` (accounting, customers, invoices, item-templates, orders, quotes, remises — API interne pour le back-office historique devis/factures), `orders`, `public/sign`, `stripe/webhook`.

- **Webhook Stripe** (`app/api/stripe/webhook/route.ts`) : lit le corps brut (`req.text()`), vérifie la signature avant tout traitement, ignore tout événement autre que `checkout.session.completed`/`checkout.session.expired`, ignore les sessions sans metadata commerce (`orderId`/`orderNumber`/`paymentId` — legacy ebook proprement neutralisé), vérifie `session.payment_status === "paid"` dans `handleCommerceCheckoutCompleted` avant tout effet de bord. Conforme point par point à MASTER-10 §22-23.
- **Téléchargements** (`lib/services/download-access.ts`) : vérifie éligibilité du grant (statut ACTIVE, non expiré, quota non atteint, commande `PAID`, asset actif, provider Supabase, bucket attendu), vérifie l'ownership (`assertGrantBelongsToCustomer`) **avant** de générer la signed URL, incrémentation atomique du compteur via `UPDATE ... RETURNING` conditionnel (protection contre race condition sur `maxDownloads`). Conforme à MASTER-10 §65, §82.
- **Rate limiting** (`lib/rate-limit.ts`) : `Map` en mémoire au niveau du process (clé globale sur `globalThis`), fenêtre + blocage, pas de dépendance externe. Conforme au constat MASTER-10 §36-38 (« best-effort », pas distribué). Utilisé au moins sur `/api/auth/login`.
- Pas de route liée à `Project`, capabilities, accompagnement — normal.

---

# État du Frontend

- Boutique (`app/boutique`, `[slug]`), panier (`app/panier`, `app/panier/projet`), checkout, page merci commande.
- Espace client (`app/mon-compte`) : **une seule page** (`page.tsx`), pas de sous-routes. C'est cohérent avec l'absence totale de `Project`/SaaS côté données — le compte client actuel n'affiche vraisemblablement que des informations liées aux achats/téléchargements, pas un espace « Projet ».
- Composants organisés par domaine (`cart`, `customer`, `dashboard`, `dashboard-preview`, `prestations`, `sign`), pas de bibliothèque de composants UI générique isolée détectée — risque de duplication de patterns visuels au fil du temps (à confirmer via MASTER-12 Design System, hors périmètre ici).
- Aucun hook React personnalisé partagé (`hooks/`) : logique probablement dupliquée ou concentrée dans quelques composants/contexts (`lib/client/cart-drawer-context.tsx`).
- Outils publics (`app/outils`, formations) existent en parallèle du reste — cohérent avec MASTER-11 §65-66 (chantiers transverses autorisés sans attendre le SaaS).

---

# État des services

`lib/services/` (23 fichiers) couvre : cart, catalog, checkout, customer-account, customer-auth (+ request-link), customer-email, customers, discounts, download-access, download-grant, ecommerce-stats, invoices, order (+ access, purge), prestations-notify, prestations-packs-catalog, quotes, remises, stripe-webhook-commerce, testimonials, admin-orders, admin-refunds.

Points notables :
- **Séparation service/DB via interfaces injectées** (`XxxDb` types + `createXxxService(db, deps)`) systématique sur les modules critiques (`customer-auth`, `stripe-webhook-commerce`, `order-purge`, `download-access`) — bon niveau de testabilité, cohérent avec la présence de tests unitaires dédiés à chacun de ces services dans `tests/`.
- `finalizeDiscountRedemptionForOrder` (référencé depuis `stripe-webhook-commerce.ts`) est appelé **au moment du paiement confirmé**, pas à la création du panier — cohérent avec le commit récent `fix(commerce): consomme les codes de reduction uniquement au paiement reel` et avec la mémoire déjà enregistrée sur le sujet (Stripe ignore la remise sur montants partiels — non ré-audité en détail ici, hors périmètre de cette phase).
- 40 fichiers de tests dans `tests/` couvrant la quasi-totalité des services listés ci-dessus (auth admin non explicitement testée côté route, mais session/webauthn indirectement via `session.test.ts`).

---

# Dette technique

| # | Constat | Statut réel dans le code | Sévérité (MASTER-10/11) |
|---|---|---|---|
| A | Magic link crée un `Customer` pour une adresse inconnue | **Confirmé présent** — `lib/services/customer-auth.ts`, branche `else` de `requestMagicLoginLink` | **Haute** (MASTER-10 §17.A, §77.A ; MASTER-11 §9) |
| B | `ADMIN_EMAIL` vs `AUTH_ADMIN_EMAIL` | **Confirmé présent** — `webauthn/options/route.ts` utilise `ADMIN_EMAIL`, `auth/login/route.ts` utilise `AUTH_ADMIN_EMAIL` | Moyenne/haute (MASTER-10 §14, §77.B) |
| C | Origine `PURCHASE`/`ADMIN` absente du `Customer` | **Confirmé absent** du schéma | Évolution de modèle, non bloquante seule |
| D | Rate limiting en mémoire, non distribué | **Confirmé** — `Map` sur `globalThis`, un seul process | Dette assumée/temporaire (MASTER-10 §38) |
| E | Fichiers ebooks bruts (`ebook/*.epub`, `*.html`) à la racine du dépôt, hors `app/`/`public/` | Présents, utilité/consommateur non confirmés dans cet audit | À investiguer (non documenté par MASTER-10) |
| F | Absence de middleware dédié pour `/mon-compte` (protection au niveau page/route uniquement, à confirmer) | Observé au niveau du `middleware.ts` (matcher `/dashboard/:path*` seulement) | À creuser dans un audit dédié MASTER-04 |

Rien à signaler comme dette « fantôme » : conformément à MASTER-10 §78, l'absence de `Project`, d'Accompagnement/capabilities et de job 72h n'est **pas** comptée comme dette technique.

---

# Écarts avec les MASTER

1. **Écart majeur — magic link crée un compte pour email inconnu.** Contredit MASTER-00 §6 (« Aucune inscription publique libre ») et sa règle anti-dérive §16.4, ainsi que MASTER-10 §17/§81 (critère d'acceptation « adresse inconnue ne crée aucun Customer » — non rempli aujourd'hui) et le workflow cible explicite du MASTER-10 §17.
2. **Écart confirmé — dualité `ADMIN_EMAIL`/`AUTH_ADMIN_EMAIL`.** Contredit la cible MASTER-10 §14 (variable canonique unique) ; actuellement les deux flux (login mot de passe vs WebAuthn) peuvent diverger si les deux variables ne sont pas maintenues identiques manuellement en environnement.
3. **Pas d'écart** sur le reste des critères d'acceptation « production » (§80), « stockage » (§82) et « auth client » restants (§81, hors point magic link) : tous vérifiés conformes dans le code lu.
4. **Aucun écart** sur les critères « Project futur » (§83) et « suppression 72h » (§84) — sans objet puisque ces couches n'existent pas encore, ce qui est attendu à ce stade de la roadmap (MASTER-11, Couche 1 uniquement en production).
5. **Point à signaler sans conclusion tranchée** : l'espace `/mon-compte` (une seule page) et l'absence de middleware dédié à cette zone n'est documentée dans aucun MASTER audité ici (relève de MASTER-04, non lu en détail dans cette phase) — à vérifier avant de bâtir dessus la Couche 2 (Identité client et droits) du MASTER-11.

---

# Risques

- **Risque de conformité/RGPD et de confusion métier** : chaque tentative de magic link sur une adresse email non cliente crée silencieusement un `Customer` `ACTIVE` en base — accumulation de faux comptes, incohérence avec la règle « pas d'inscription publique », et incompatibilité directe avec la Couche 2 du MASTER-11 (« Identité client et droits ») qui doit être un prérequis stable avant `Project`.
- **Risque opérationnel faible mais réel** sur `ADMIN_EMAIL`/`AUTH_ADMIN_EMAIL` : une divergence de configuration entre les deux variables entre environnements (local/preview/prod) casserait silencieusement soit le login classique, soit WebAuthn, sans erreur explicite côté utilisateur autre qu'un refus d'authentification.
- **Risque de dérive d'architecture si Project est démarré maintenant** : MASTER-11 §75 fixe explicitement comme checkpoint « avant Project » que l'auth client soit stable et que l'email inconnu ne crée aucun compte. Ce checkpoint n'est pas atteint tant que la dette A n'est pas corrigée — commencer le SaaS Project sans corriger cela ferait porter les futures capabilities/ownership sur un socle Customer imparfait (comptes fantômes potentiellement dotés de droits par erreur d'un futur script d'attribution).
- **Risque de sécurité mineur, best-effort assumé** : rate limiting mémoire non distribué sur Vercel (plusieurs instances, pas de persistance) — déjà objectivé et accepté par MASTER-10 §36-38 comme dette temporaire, pas une régression à corriger en urgence.
- **Risque de dette invisible** : fichiers `ebook/*.epub/html` à la racine sans confirmation d'utilisation — à clarifier pour éviter qu'ils ne deviennent une seconde source de vérité pour un contenu déjà géré via Supabase Storage / catalogue Produit.

---

# Dépendances

Conformément à la chaîne MASTER-11 §10 et à l'ordre §79/§93 du MASTER-10 :

```
Production existante (Couche 1, en place)
        ↓
Correction dette A (magic link) — bloquant avant Couche 2
        ↓
Correction dette B (ADMIN_EMAIL) — recommandé avant Couche 2, non strictement bloquant
        ↓
Couche 2 — Identité client et droits (origine PURCHASE/ADMIN, capabilities)
        ↓
Couche 3 — Project (additif, ownership serveur)
        ↓
... (moteurs métier, Circuits, Schéma, Volta, Accompagnement — hors périmètre de cette phase)
```

La dette A dépend uniquement du service `lib/services/customer-auth.ts` et de son test associé (`tests/customer-auth-service.test.ts`) — périmètre de correction contenu, sans dépendance externe.
La dette B dépend de deux routes (`app/api/auth/login/route.ts`, `app/api/auth/webauthn/options/route.ts`) et de la configuration d'environnement (Vercel + local) — nécessite une coordination de déploiement (les deux variables doivent être alignées avant bascule complète).

---

# Ordre recommandé des modifications

1. Corriger la dette A (magic link ne crée plus de `Customer` pour une adresse inconnue) — priorité haute, bloquant pour la Couche 2.
2. Harmoniser `ADMIN_EMAIL`/`AUTH_ADMIN_EMAIL` vers une variable canonique unique (`AUTH_ADMIN_EMAIL`), avec alias legacy temporaire assumé pendant la transition (MASTER-10 §14).
3. Clarifier et si nécessaire nettoyer les fichiers `ebook/*.epub/html` à la racine (statut, consommateur réel).
4. Vérifier/documenter la stratégie de protection de `/mon-compte` (middleware ou vérification par route) avant d'y adosser la future logique Project.
5. Introduire le champ d'origine `PURCHASE`/`ADMIN` sur `Customer` (migration additive) dès que la Couche 2 démarre réellement.
6. Poursuivre l'ordre du MASTER-11 §93 pour tout ce qui suit (capabilities → Project → moteurs métier → Circuits → Schéma → Volta → Accompagnement → recommandations → documents/livrables → notifications).

Cet ordre ne constitue pas un plan d'implémentation détaillé — il reprend l'ordre déjà fixé par les MASTER, confirmé pertinent par cet audit du code réel.

---

# Plan de migration

Aucune migration Prisma n'est requise pour corriger les dettes A et B (ce sont des corrections de logique applicative et de configuration, pas de schéma).

Pour la suite documentée par MASTER-11 (hors périmètre d'implémentation de cette phase) :
- l'ajout du champ d'origine `Customer` (dette C) sera une migration additive simple (nouvelle colonne avec valeur par défaut) ;
- l'introduction de `Project` devra suivre le principe additif du MASTER-10 §8-9 (ajouter avant de retirer, jamais de migration destructive simultanée au code et au schéma) ;
- aucune migration destructive n'est nécessaire ni recommandée à ce stade.

---

# Arbitrages éventuellement nécessaires

1. **Fichiers `ebook/*.epub/html` à la racine** : conserver, déplacer sous `public/`/`docs/`, ou supprimer ? Nécessite de vérifier si un script ou un contenu Markdown y fait encore référence avant toute décision — signalé mais non tranché ici (hors périmètre : audit, pas d'implémentation).
2. **Protection de `/mon-compte`** : faut-il un middleware dédié (comme pour `/dashboard`) ou la stratégie actuelle par route est-elle jugée suffisante ? Cette question relève de MASTER-04 (Compte Client), non intégralement lu pendant cette phase — à trancher avant la Couche 2.
3. **`build:turbopack` vs build webpack de référence** : le script existe dans `package.json` mais MASTER-10 §3 documente le build webpack comme référence. Faut-il retirer ce script pour éviter toute confusion, ou le garder comme option expérimentale documentée ?
4. **Décision de correction immédiate ou groupée des dettes A et B** : elles sont indépendantes techniquement, mais MASTER-11 §9 les mentionne ensemble comme prérequis de la Couche 2 — à confirmer si elles doivent être livrées dans le même chantier ou séparément.

Aucun de ces points n'a été tranché ni implémenté dans le cadre de cet audit, conformément à la consigne.

---

# Conclusion

Le dépôt réel correspond fidèlement à ce que MASTER-10 et MASTER-11 décrivent comme la Couche 1 (Infrastructure existante) : un socle commerce/Admin/auth solide, testé, et globalement conforme aux règles de sécurité et d'architecture fixées par les MASTER. Aucun élément du futur socle SaaS (Project, capabilities, Accompagnement, Volta) n'a été trouvé — c'est attendu, pas une anomalie.

Le point réellement bloquant pour enclencher la Phase 1 d'implémentation (au sens du MASTER-11, Couche 2 — Identité client et droits) est la dette technique A : le magic link crée encore un `Customer` pour une adresse email inconnue, en contradiction directe avec une règle absolue du MASTER-00. Cette correction est petite en périmètre (un seul service, déjà couvert par des tests unitaires à adapter) mais elle est un prérequis explicite avant toute évolution du modèle Customer/Project selon MASTER-11 §75.

La dette B (variable Admin dupliquée) est un risque de configuration à corriger mais n'empêche pas techniquement de démarrer la Couche 2.

**Niveau de conformité aux MASTER : 90 %**
(le socle production est conforme sur la quasi-totalité des critères d'acceptation vérifiables ; les deux écarts identifiés sont documentés et attendus par les MASTER eux-mêmes comme dette à corriger, pas comme surprises.)

**Niveau de préparation pour commencer l'implémentation de la Phase 1 (Couche 2 — Identité client et droits) : 70 %**
(le socle est stable et bien testé, mais le prérequis explicite du MASTER-11 §75 — « email inconnu ne crée aucun compte » — n'est pas encore rempli ; corriger les dettes A et B avant de démarrer la Couche 2 est recommandé plutôt qu'optionnel.)

---

**Fin — PHASE-1-AUDIT / FabSystem**
