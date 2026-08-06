# Recette locale e-commerce — 2026-08-06

## Contexte

- Projet : FabSystem
- Environnement : local uniquement
- Date de recette : 2026-08-06
- Base utilisée : `localhost / fabsystem_dev`
- Objectif : vérifier que les briques e-commerce fonctionnent ensemble sans ajouter de nouvelle fonctionnalité

## Corrections minimales appliquées pendant la recette

1. `lib/services/order.ts`
   - correction du wiring Prisma de création de commande
   - cause : `POST /api/orders` tombait en `500` car `prisma.order.create()` recevait des relations scalaires incompatibles avec le runtime réellement chargé
   - effet : la création de commande depuis le panier fonctionne de nouveau

2. `app/api/checkout/route.ts`
3. `lib/services/checkout.ts`
   - ajout d’un passage explicite du `baseUrl` côté route serveur
   - cause : en développement, `POST /api/checkout` ne réutilisait pas le fallback `request.url` déjà présent ailleurs
   - effet : le checkout n’échoue plus sur `Missing NEXT_PUBLIC_BASE_URL`

## Parcours testés

### 1. Accès admin

- `GET /login` : OK
- `POST /api/auth/login` avec l’admin local : OK
- `GET /dashboard` après login : OK
- hiérarchie dashboard homepage :
  - `Catalogue / e-commerce` visible : OK
  - `Compta / administratif` visible en secondaire : OK

### 2. Dashboard e-commerce

- `GET /dashboard/catalog` : OK
- `GET /dashboard/catalog/assets` : OK
- `GET /dashboard/discounts` : OK
- `GET /dashboard/orders` : OK
- `GET /dashboard/orders/[orderId]` sur une commande offerte : OK

### 3. Catalogue public

- `GET /boutique` : OK
- produit `Ebook Électricité Van` visible : OK
- prix `29,00 €` visible : OK
- `GET /boutique/ebook-electricite-van` : OK

### 4. Panier et création de commande

- `DELETE /api/cart` : OK
- `POST /api/cart/items` : OK
- `POST /api/orders` sans remise : OK après correctif
- résultat observé :
  - `status: PENDING_PAYMENT`
  - `totalCents: 2900`

### 5. Checkout Stripe normal

- `POST /api/checkout` : KO environnement
- état après correctif `baseUrl` :
  - la route appelle bien Stripe
  - le blocage restant vient de la clé locale Stripe expirée
- erreur observée côté serveur :
  - `Expired API Key provided`

Conclusion :
- le flux applicatif local va maintenant jusqu’à l’appel Stripe
- le blocage restant n’est pas un bug métier FabSystem mais une configuration Stripe locale invalide

### 6. Code coaching offert 100 %

Méthode de recette :
- création d’une fixture locale de code coaching dans la base dev, sans migration ni modification de schéma
- email de recette : `acceptance.20260806@example.com`
- code créé : `COACH-ERFBJK`

Vérifications :
- `POST /api/orders` avec code coaching : OK
- résultat :
  - `status: PAID`
  - `totalCents: 0`
  - `requiresPayment: false`
- vérification base locale : OK
  - commande `FS-20260806-SLHPCC`
  - `discountTotalCents = 2900`
  - `DownloadGrant` créé : 1
  - statut grant : `ACTIVE`

### 7. Page merci

- `GET /commande/merci?order=FS-20260806-SLHPCC` : OK
- comportement constaté :
  - la commande payée est retrouvée
  - la page n’expose pas d’URL Supabase signée
  - la page demande une connexion client avant d’afficher les téléchargements : OK

### 8. Espace client

- `GET /connexion-client` : OK
- `GET /mon-compte` sans session client : OK
  - redirection vers `/connexion-client`

#### Demande de lien magique

- `POST /api/client-auth/request-link` : KO environnement
- erreur observée :
  - `500`
  - `Customer email configuration is incomplete`

Conclusion :
- la couche UI existe
- la redirection de protection existe
- le flux complet de connexion client ne peut pas être validé localement tant que la configuration email locale reste incomplète

### 9. Téléchargement protégé

- `GET /api/downloads/cmshtuplp000nhtxuvci2ax5w` sans session client : OK
- résultat :
  - `401 Unauthorized`
  - code `UNAUTHORIZED`
  - message `Customer session not found`

Conclusion :
- la protection serveur du téléchargement est bien active

### 10. Remboursement total

- KO non testé complètement
- raison :
  - aucune session Stripe test valide n’a pu être créée localement
  - donc aucune commande Stripe réellement payée n’était disponible pour valider le remboursement end-to-end depuis l’UI

### 11. Régressions rapides

- `/boutique` : OK
- `/panier` : OK
- `/connexion-client` : OK
- `/mon-compte` : OK redirection
- `/dashboard/catalog` : OK
- `/dashboard/catalog/assets` : OK
- `/dashboard/discounts` : OK
- `/dashboard/orders` : OK

## Résultats OK / KO synthétiques

| Parcours | Résultat | Note |
|---|---|---|
| Login admin local | OK | session admin fonctionnelle |
| Dashboard homepage e-commerce prioritaire | OK | conforme |
| Catalogue public | OK | produit visible |
| Ajout panier | OK | API fonctionnelle |
| Création order normale | OK | corrigée pendant la recette |
| Checkout Stripe normal | KO environnement | clé Stripe locale expirée |
| Commande offerte 0 € | OK | `PAID` direct |
| Création DownloadGrant après commande offerte | OK | grant actif créé |
| Page merci | OK | accès minimal + prompt login |
| Demande lien magique client | KO environnement | config email locale incomplète |
| /mon-compte sans session | OK | redirection correcte |
| Téléchargement sans session client | OK | `401` attendu |
| Remboursement Stripe réel | KO non testé | pas de paiement Stripe test exploitable |

## Bugs trouvés

### Bug 1 — `POST /api/orders` en 500

- gravité : bloquante
- cause : création Prisma Order incompatible avec le runtime réellement utilisé
- statut : corrigé

### Bug 2 — `POST /api/checkout` échouait localement sur `Missing NEXT_PUBLIC_BASE_URL`

- gravité : bloquante en local
- cause : la route checkout ne transmettait pas le `baseUrl` serveur, contrairement à d’autres flux déjà compatibles dev
- statut : corrigé

## Points non testés ou partiellement testés

1. Checkout Stripe jusqu’au retour réel `/commande/merci`
   - non validé
   - raison : clé Stripe locale expirée

2. Webhook Stripe commerce local
   - non validé end-to-end
   - raison : pas de checkout Stripe test complet disponible

3. Connexion client complète par magic link
   - non validée end-to-end
   - raison : configuration email locale incomplète

4. Téléchargement authentifié complet avec URL Supabase signée
   - non validé end-to-end
   - raison : absence de session client obtenue via le flux officiel

5. Remboursement admin Stripe réel
   - non validé end-to-end
   - raison : pas de paiement Stripe test réellement abouti

## Commandes utiles utilisées pendant la recette

```bash
npx prisma generate
npx prisma validate
npm run lint
npm test
curl -i http://127.0.0.1:3000/boutique
curl -i http://127.0.0.1:3000/connexion-client
curl -i http://127.0.0.1:3000/mon-compte
curl -i "http://127.0.0.1:3000/commande/merci?order=FS-20260806-SLHPCC"
curl -i http://127.0.0.1:3000/api/downloads/cmshtuplp000nhtxuvci2ax5w
```

## Résultats automatisés

- `npx prisma generate` : OK
- `npx prisma validate` : OK
- `npm run lint` : OK
- `npm test` : OK
  - 299 tests passants

## Décision finale

### Prêt pour test réel : NON

Raison :
- le socle e-commerce local est désormais cohérent sur les flux internes principaux
- la commande standard et la commande offerte fonctionnent côté application
- le grant de téléchargement est bien créé sur une commande offerte
- mais un test réel n’est pas encore prêt tant que :
  - la configuration Stripe locale/test n’est pas valide
  - la configuration email client locale n’est pas complète
  - le flux authentifié client + téléchargement signé n’a pas été validé end-to-end

## Recommandation immédiate

1. Remplacer la clé Stripe locale expirée par une vraie clé Stripe test valide.
2. Compléter la configuration email locale pour `client-auth/request-link`.
3. Rejouer la recette :
   - checkout Stripe test réel
   - webhook commerce
   - login client via lien magique
   - téléchargement authentifié
   - remboursement admin end-to-end
