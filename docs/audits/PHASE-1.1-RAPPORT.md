# PHASE-1.1-RAPPORT — Stabilisation de l'authentification (Dette A + B)

**Date : 10/08/2026**
**Périmètre : correction exclusive des deux dettes techniques identifiées par `docs/audits/PHASE-1-AUDIT.md`.**
**Aucune autre fonctionnalité n'a été développée. Aucun refactoring hors périmètre n'a été effectué.**

---

## Fichiers modifiés

| Fichier | Nature de la modification |
|---|---|
| `lib/services/customer-auth.ts` | **Dette A.** `requestMagicLoginLink` ne crée plus de `Customer` pour un email inconnu ; `RequestMagicLoginLinkResult` devient une union discriminée (`"created"` / `"customer_not_found"`). |
| `lib/services/customer-auth-request-link.ts` | **Dette A.** Nouvelle branche `customer_not_found` : retourne la même réponse publique générique, sans envoyer d'email, avec un simple log serveur interne. |
| `app/api/auth/webauthn/options/route.ts` | **Dette B.** `userName` du WebAuthn admin lit désormais `AUTH_ADMIN_EMAIL` en priorité, `ADMIN_EMAIL` en compatibilité temporaire uniquement. |
| `.env.example` | **Dette B.** Commentaire mis à jour : `ADMIN_EMAIL` est documenté comme alias legacy de secours, `AUTH_ADMIN_EMAIL` comme variable canonique unique. |
| `tests/customer-auth-service.test.ts` | Tests adaptés/ajoutés pour la Dette A. |
| `tests/customer-auth-request-link-service.test.ts` | Tests adaptés/ajoutés pour la Dette A (réponse publique identique, aucun email envoyé). |

Aucun fichier Prisma, Stripe, Checkout, Dashboard, `CustomerSession`, `DownloadGrant`, `Order`, `Product` ou `middleware.ts` n'a été touché — aucune dépendance directe ne l'a rendu nécessaire.

`app/api/auth/login/route.ts` n'a pas été modifié : il utilisait déjà exclusivement `AUTH_ADMIN_EMAIL`.

---

## Résumé des corrections

### Dette A — Magic link créant un Customer inconnu

**Avant** : dans `requestMagicLoginLink()`, si `findCustomerByEmail` ne trouvait aucun `Customer`, le code en créait un (`status: "ACTIVE"`) avant de générer un token de connexion.

**Après** :
- Le type de retour `RequestMagicLoginLinkResult` est désormais une union discriminée par `status` :
  - `{ status: "created"; customerId; email; token; expiresAt; magicLink? }` — comportement inchangé pour un `Customer` existant ;
  - `{ status: "customer_not_found"; email }` — nouveau cas, pour un email inconnu.
- Quand aucun `Customer` n'est trouvé, la fonction s'arrête immédiatement dans la transaction : **aucun `Customer` n'est créé, aucun `MagicLoginToken` n'est créé**, aucune autre écriture n'a lieu.
- `lib/services/customer-auth-request-link.ts` (appelé par la route `POST /api/client-auth/request-link` et par l'action Admin de renvoi de lien) traite ce nouveau cas en amont de l'envoi d'email : **aucun email n'est envoyé**, et la fonction retourne exactement la même forme de réponse publique que pour un compte existant (`{ ok: true, message: "Si cette adresse peut accéder à un espace client, un lien de connexion sera envoyé." }`, avec `magicLink` optionnel uniquement hors production comme avant) — conforme à la règle anti-énumération de MASTER-00 §18 et MASTER-04 §6.
- Un log serveur interne (`logServerEvent`) trace la tentative sur un email inconnu, sans jamais être exposé au client — utile pour l'observabilité sans casser l'anti-énumération.
- Le comportement pour un `Customer` existant (actif, `DISABLED`, révocation des tokens précédents, token à usage unique 15 min, session 30 jours) est **strictement inchangé**.

Le compte client ne peut donc plus être créé que via les deux voies prévues par MASTER-04 §3-4 : premier achat Boutique réel (flux commande, non touché ici) ou création Admin explicite (flux Admin, non touché ici).

### Dette B — `ADMIN_EMAIL` vs `AUTH_ADMIN_EMAIL`

**Avant** : `app/api/auth/login/route.ts` lisait `AUTH_ADMIN_EMAIL`, `app/api/auth/webauthn/options/route.ts` lisait `ADMIN_EMAIL` — deux variables distinctes pour la même identité Admin.

**Après** : `AUTH_ADMIN_EMAIL` est la seule variable canonique. `app/api/auth/webauthn/options/route.ts` la lit désormais en priorité (`process.env.AUTH_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@fabsystem.fr"`), avec `ADMIN_EMAIL` conservé uniquement comme repli temporaire pour éviter une rupture si un environnement de déploiement n'a pas encore été mis à jour. `.env.example` documente désormais explicitement ce statut d'alias legacy.

**Note d'utilisation observée** : `userName` dans les options WebAuthn n'est qu'une métadonnée d'affichage transmise à l'authenticator (pas une donnée de vérification cryptographique) — la correction n'a donc aucun impact sur la sécurité de la vérification WebAuthn elle-même, seulement sur la cohérence documentaire de l'identité affichée.

---

## Tests exécutés

Commande : `npm test` (`node --import tsx --test tests/*.test.ts`)

Nouveaux tests / tests adaptés couvrant explicitement les critères demandés :

**Magic link**
- ✅ `requestMagicLoginLink does not create a Customer for an unknown email` — aucun `Customer`, aucun `MagicLoginToken` créé.
- ✅ `requestMagicLoginLink reuses an existing Customer` — Customer existant inchangé.
- ✅ `requestMagicLoginLink refuses a DISABLED Customer` (préexistant, inchangé).
- ✅ `requestMagicLoginLink creates an ACTIVE MagicLoginToken`, `never stores the raw token`, `revokes previous ACTIVE tokens`, `includes the raw token in magicLink when baseUrl is provided` (préexistants, adaptés à la nouvelle forme de résultat, comportement inchangé).
- ✅ `requestLink returns the generic public response and sends no email for an unknown Customer` (nouveau) — 0 appel à l'envoi d'email, réponse publique générique.
- ✅ `requestLink returns the same public response shape for known and unknown Customers` (nouveau) — vérifie que les clés et le message de réponse sont identiques entre un compte existant et un email inconnu (anti-énumération).
- ✅ `requestLink hides magicLink in production responses`, `requestLink returns magicLink in development without SMTP config`, `requestLink sends an email after a valid magic-link request`, `requestLink returns a sanitized error if email sending fails`, `requestLink keeps SMTP mandatory in production` (préexistants, adaptés, comportement inchangé).

**Admin**
- ✅ Tests existants de session Admin (`tests/session.test.ts`) — inchangés, toujours verts (login mot de passe et session HMAC non modifiés dans cette phase).
- WebAuthn : aucun test unitaire dédié n'existait avant cette phase pour la route `options` (elle dépend de cookies/`generateRegistrationOptions`, testée jusqu'ici manuellement / via build) ; le changement porte sur une seule ligne d'ordre de résolution de variable d'environnement, à risque minimal, vérifié par la compilation TypeScript et par une relecture manuelle du diff.

**Résultat global**

```
# tests 413
# suites 0
# pass 413
# fail 0
# cancelled 0
# skipped 0
```

Autres vérifications :
- ✅ `npx tsc --noEmit` — aucune erreur.
- ✅ `npm run build` (`prisma generate && next build --webpack`) — succès, toutes les routes (dont `/api/client-auth/request-link`, `/api/auth/webauthn/options`, `/login`, `/connexion-client`) compilées sans erreur.
- ⚠️ `npm run lint` — n'a pas pu s'exécuter : `node_modules/@eslint-community/eslint-utils` a une dépendance imbriquée (`eslint-visitor-keys`) dont le dossier `dist/` est manquant. C'est un problème d'installation `node_modules` **préexistant à cette mission** (aucun fichier de dépendances n'a été modifié) — voir section Difficultés.

---

## Difficultés rencontrées

- **`npm run lint` indisponible** : l'installation locale de `node_modules` a une dépendance imbriquée cassée (`eslint-visitor-keys` sans son dossier `dist/`), non liée aux fichiers modifiés dans cette mission ni à `package.json`/`package-lock.json` (non touchés). Le lint n'a donc pas pu être exécuté pour confirmer ce critère de sortie. La compilation TypeScript stricte (`tsc --noEmit`) et le build Next.js complet ont en revanche réussi sans aucun avertissement, ce qui couvre l'essentiel des règles de style/qualité vérifiées par ce projet. Une réinstallation de `node_modules` (`npm install`) résoudrait probablement ce problème, mais cette action a été volontairement écartée car hors du périmètre strict demandé (« ne rien développer d'autre ») et parce qu'elle modifierait l'état de l'environnement sans autorisation explicite.
- **Typage TypeScript de l'union discriminée** : plusieurs tests existants accédaient directement à `result.email`/`result.token`/`result.magicLink` sur le résultat de `requestMagicLoginLink`. Le passage à une union discriminée a nécessité l'ajout de gardes `if (result.status !== "created") { throw ... }` dans ces tests pour permettre le rétrécissement de type (narrowing) — changement mécanique, sans impact sur le comportement testé.
- Aucune autre difficulté bloquante.

---

## Confirmation de fermeture des dettes

**Dette A — fermée.**
Une adresse email inconnue transmise à `/api/client-auth/request-link` (ou à l'action Admin de renvoi de lien) ne crée plus aucun `Customer` ni `MagicLoginToken`, et reçoit exactement la même réponse publique générique qu'une adresse connue — conforme à MASTER-00 §6/§16.4 et MASTER-04 §6/§42.5.

**Dette B — fermée.**
`AUTH_ADMIN_EMAIL` est désormais la seule variable lue en priorité par les deux flux Admin (login mot de passe et WebAuthn). `ADMIN_EMAIL` reste un repli temporaire documenté, sans risque de rupture de déploiement si un environnement n'a pas encore été aligné.

**Critères de sortie**
- ✅ Build OK
- ✅ TypeScript OK
- ⚠️ Lint : non exécutable pour une raison d'environnement préexistante et non liée à cette mission (voir ci-dessus) — aucune régression de style introduite à la relecture manuelle du diff.
- ✅ Tests OK (413/413)
- ✅ Aucun MASTER contredit (MASTER-00, MASTER-04, MASTER-10, MASTER-11 relus avant implémentation)
- ✅ Aucun nouveau TODO introduit
- ✅ Dettes A et B closes

---

**Fin — PHASE-1.1-RAPPORT / FabSystem**
