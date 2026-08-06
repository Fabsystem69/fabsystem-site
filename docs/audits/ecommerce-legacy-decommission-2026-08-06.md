# Décommission du legacy ebook — Sprint 8.9 — 2026-08-06

## Statut du document

- Objectif : supprimer proprement le tunnel ebook legacy sans casser le nouveau commerce
- Aucune migration créée, aucun schéma Prisma modifié
- Aucune base prod touchée, aucun paiement live lancé, aucun remboursement live lancé
- Aucun commit, aucun push effectué dans ce sprint
- Aucune clé secrète affichée

---

## 1. Traces legacy trouvées (cartographie avant suppression)

| Fichier | Rôle | Décision |
|---|---|---|
| `app/api/ebook/checkout/route.ts` | Créait une session Stripe legacy via `STRIPE_PRICE_ID_EBOOK` | Supprimé |
| `app/api/ebook/download/route.ts` | Servait le fichier via token signé + Vercel Blob | Supprimé |
| `app/ebook/acces/[token]/page.tsx` | Page d'accès legacy par token | Supprimé |
| `app/ebook/annule/page.tsx` | Page d'annulation du checkout legacy (`cancel_url`) | Supprimé |
| `app/ebook/merci/page.tsx` | Page de remerciement du checkout legacy (`success_url`) | Supprimé |
| `lib/ebook-token.ts` | Signature/vérification du token d'accès legacy | Supprimé |
| `lib/ebook-blob.ts` | Upload/signed URL Vercel Blob legacy | Supprimé |
| `lib/ebook-html.ts` | Génération HTML filigrané legacy | Supprimé |
| `components/EbookCheckoutForm.tsx` | Formulaire POST vers `/api/ebook/checkout` | Supprimé |
| `components/EbookCheckoutModal.tsx` | Popup + `BuyButton` legacy | Supprimé |
| `scripts/resend-ebook-email.ts` | Renvoi manuel email `EbookOrder` | Supprimé |
| `scripts/upload-ebook-master.mjs` | Upload manuel fichier maître vers Vercel Blob | Supprimé |
| `scripts/verify-ebook-master.mjs` | Vérification présence blob maître | Supprimé |
| `app/api/stripe/webhook/route.ts` | Contenait une branche `else` legacy (génération `EbookOrder`, upload Blob, email token) en plus de la branche commerce | Modifié — branche legacy retirée |
| `lib/stripe.ts` | Client Stripe non `server/`, utilisé par le checkout legacy **et** par le webhook (vérification de signature) | Conservé — toujours nécessaire au webhook |
| `prisma/schema.prisma` (`EbookOrder`, `EbookOrderStatus`) | Modèle legacy | Conservé en base, code applicatif retiré (voir §4) |
| `app/ebook/page.tsx` | Page catalogue marketing (liste des ebooks) | Conservé, aucune dépendance au tunnel legacy |
| `app/ebook/cabler-son-van/page.tsx` | Page produit marketing, contenait le bouton d'achat legacy | Modifié — bouton redirigé vers `/boutique` |
| `.env.example` | Documentait les 3 variables legacy | Modifié |
| `package.json` (`@vercel/blob`) | Dépendance utilisée uniquement par les 3 fichiers legacy supprimés | Retirée |
| `docs/04-STRIPE.md`, `docs/06-DEPLOYMENT.md`, `docs/07-SECURITY.md` | Documentaient le legacy comme actif | Mis à jour |
| `docs/audits/ecommerce-production-readiness-2026-08-06.md`, `docs/audits/ecommerce-production-configuration-plan-2026-08-06.md` | Listaient les variables legacy comme obligatoires | Annotés (historique conservé, statut corrigé) |

### Point bloquant découvert pendant l'audit (résolu avec validation de Fabien)

L'audit a révélé une dépendance non listée dans le périmètre initial de la
mission : **`/ebook`** est un lien actif dans `components/Navbar.tsx` ("Le
manuel") et sur la page d'accueil, et **`/ebook/cabler-son-van`** est une page
marketing déjà committée dans `HEAD` (donc en production), avec un bouton
"Acheter l'ebook — 49,99 €" qui POSTait sur `/api/ebook/checkout`. `/formations`
renvoie également vers `/ebook`. Le dernier commit du dépôt avant ce sprint
concernait justement ce bouton d'achat, confirmant qu'il s'agissait d'une
fonctionnalité active.

Supprimer directement `/api/ebook/checkout` aurait cassé ce bouton en
production dès le prochain déploiement, sans que le nouveau commerce n'ait
encore de produit actif confirmé pour le remplacer. **Validation demandée et
obtenue de Fabien** : rediriger le bouton et les pages marketing vers le
nouveau catalogue `/boutique` avant de supprimer le back-end legacy.

## 2. Fichiers supprimés

Liste complète : voir tableau §1, colonne "Décision = Supprimé" (13 fichiers).

## 3. Fichiers modifiés

- `app/ebook/cabler-son-van/page.tsx` : retrait de `EbookCheckoutProvider`/`BuyButton`
  (composants désormais supprimés), les deux boutons "Acheter l'ebook" pointent
  maintenant vers `/boutique` via un `<Link>` standard.
- `app/api/stripe/webhook/route.ts` : retrait complet de la branche legacy
  (imports `after`, `uploadEbookFile`, `renderEbookHtml`, `signEbookToken`,
  `prisma`, `sendMail` retirés ; fonction `generateAndDeliver` supprimée).
  Comportement conservé pour le commerce : idempotence, vérification de
  signature, traitement `checkout.session.completed`/`checkout.session.expired`
  strictement identique à avant. Nouveau comportement : toute session
  `checkout.session.completed`/`expired` **sans** metadata commerce
  (`orderId`/`orderNumber`/`paymentId`) est désormais ignorée proprement avec
  `200 { ok: true }`, journalisée `flow: "ignored_non_commerce"`, sans jamais
  tenter de créer un `EbookOrder`.
- `.env.example` : retrait de `STRIPE_PRICE_ID_EBOOK`, `BLOB_READ_WRITE_TOKEN`,
  `EBOOK_ACCESS_TOKEN_SECRET` ; ajout d'une note expliquant la décommission ;
  commentaire de `MAIL_TO` corrigé (n'est plus lu par aucune route depuis la
  suppression de la page d'accès legacy — variable conservée par prudence, hors
  périmètre explicite de ce sprint).
- `package.json` / `package-lock.json` : retrait de `@vercel/blob` (`npm install`
  relancé pour resynchroniser le lockfile).
- `docs/04-STRIPE.md`, `docs/06-DEPLOYMENT.md`, `docs/07-SECURITY.md` : sections
  legacy mises à jour (variables retirées, tunnel décrit comme décommissionné,
  précision Prisma = catalogue / Stripe = paiement / Supabase = stockage privé).
- `docs/audits/ecommerce-production-readiness-2026-08-06.md`,
  `docs/audits/ecommerce-production-configuration-plan-2026-08-06.md` : lignes
  concernant les 3 variables legacy annotées "Non — retiré au Sprint 8.9",
  contenu historique conservé en biffé plutôt que supprimé.

## 4. Variables retirées

- `BLOB_READ_WRITE_TOKEN`
- `STRIPE_PRICE_ID_EBOOK`
- `EBOOK_ACCESS_TOKEN_SECRET`

Retirées de `.env.example` uniquement. **Aucune variable Vercel réelle n'a été
modifiée** — si ces variables existent encore dans Vercel Production, elles
peuvent être retirées par Fabien quand il le souhaite (elles ne sont plus lues
par aucun code depuis ce sprint, leur laisser une valeur périmée ne casse rien).

## 5. Dépendances retirées ou conservées

- **Retirée** : `@vercel/blob` (`^2.6.1`) — confirmé par `rg "@vercel/blob"`
  qu'elle n'était utilisée que dans les 3 fichiers legacy supprimés
  (`lib/ebook-blob.ts`, `scripts/upload-ebook-master.mjs`,
  `scripts/verify-ebook-master.mjs`). `package-lock.json` resynchronisé
  (`npm install`, 25 paquets retirés au total avec les sous-dépendances).
- **Conservée** : aucune autre dépendance n'était liée exclusivement au legacy.

## 6. Décision Prisma / `EbookOrder`

Conformément à la recommandation de la mission :

- **Option retenue : Option A** — le modèle `EbookOrder` (et l'enum
  `EbookOrderStatus`) reste présent dans `prisma/schema.prisma` et en base,
  **sans migration de suppression** ce sprint.
- Tout le code applicatif qui lisait/écrivait `prisma.ebookOrder` a été retiré
  (confirmé par recherche `rg -ni "ebookOrder" app lib scripts components tests`
  — plus aucune occurrence en dehors du client Prisma généré).
- Aucune commande `prisma migrate` exécutée. `npx prisma generate` régénère
  simplement le client à partir du schéma inchangé (le modèle `EbookOrder`
  reste dans les types générés, sans effet puisque plus rien ne l'importe).
- **Option B (suppression de table via migration)** reste ouverte pour un sprint
  ultérieur, après validation explicite de Fabien — non traitée ici.

## 7. Tests

- Recherche exhaustive (`rg`) confirmant qu'aucun test existant n'importait un
  fichier legacy supprimé — les 303 tests existants passent sans modification.
- Test déjà existant couvrant le comportement demandé côté webhook :
  `tests/stripe-webhook-commerce.test.ts` → `isCommerceCheckoutSession detects
  commerce metadata` vérifie déjà qu'une session avec des metadata de type
  legacy (`email`/`name`, sans `orderId`/`orderNumber`/`paymentId`) est
  correctement identifiée comme non-commerce — c'est exactement la fonction qui
  pilote la nouvelle branche "ignorer proprement" du webhook.
- Nouveau fichier ajouté : `tests/legacy-ebook-decommission.test.ts` (3 tests) :
  1. les 13 fichiers legacy n'existent plus sur disque ;
  2. `.env.example` ne documente plus les 3 variables legacy ;
  3. `package.json` ne dépend plus de `@vercel/blob`.
- **303 → 306 tests**, tous passants.

## 8. Risques restants

| Risque | Détail |
|---|---|
| `MAIL_TO` orpheline | N'est plus lue par aucune route depuis la suppression de la page d'accès legacy ; conservée dans `.env.example` par prudence, hors périmètre explicite de ce sprint — à trancher séparément |
| `lib/stripe.ts` vs `lib/server/stripe.ts` | Deux clients Stripe distincts coexistent (l'un pour la vérification de signature webhook, l'autre pour le checkout/remboursement commerce) — duplication pré-existante, non traitée ici car hors périmètre (pas de refonte du code métier commerce demandée) |
| Variables Vercel réelles non nettoyées | Si `BLOB_READ_WRITE_TOKEN`, `STRIPE_PRICE_ID_EBOOK`, `EBOOK_ACCESS_TOKEN_SECRET` existent encore dans Vercel Production/Preview, elles restent inertes mais non supprimées (aucune action Vercel réalisée dans ce sprint) |
| `EbookOrder` toujours en base | Table et données historiques toujours présentes ; aucun risque fonctionnel immédiat, mais nécessitera une décision de suppression ou d'archivage plus tard |
| Anciens acheteurs ebook | Les liens `/ebook/acces/[token]` déjà envoyés par email aux acheteurs legacy sont maintenant des 404 — aucun repli automatique n'a été mis en place (hors périmètre de ce sprint, à decider avec Fabien si un support manuel est nécessaire pour les anciens acheteurs) |

## 9. Validation

| Commande | Résultat |
|---|---|
| `npx prisma generate` | OK |
| `npx prisma validate` | OK — schema valide |
| `npm run lint` | OK — aucune erreur |
| `npm test` | OK — **306/306 tests** (303 existants + 3 nouveaux) |

Aucune migration créée. Aucun schéma Prisma modifié. Aucune base touchée.
Aucune prod touchée. Aucun paiement live lancé. Aucun remboursement live lancé.
Aucune clé secrète affichée. Aucun commit, aucun push effectué.
