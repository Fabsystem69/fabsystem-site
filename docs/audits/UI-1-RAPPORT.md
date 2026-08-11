# UI-1-RAPPORT — Assainissement du frontend

**Date : 22/08/2026**
**Périmètre : nettoyage de la dette UI identifiée par `docs/audits/UI-1.0-AUDIT-REFONTE-SAAS.md`, sans modification de comportement métier, sans nouvelle fonctionnalité, sans refonte graphique des pages. Backend, moteurs, API, Prisma et logique métier non touchés.**

---

# Nettoyage réalisé

1. **Fusion définitive de `dashboard-preview` dans le Dashboard réel** (voir section Dashboard).
2. **Navigation publique mise en conformité** avec `docs/refonte-site-public/00-CAHIER-DES-CHARGES-GLOBAL.md` §12 (voir section Navigation).
3. **Fondations du Design System public créées** : `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Alert.tsx` (voir section Design System).
4. **Tokens Tailwind complétés** : `borderRadius.card`, `boxShadow.card`/`elevated`, `spacing.section` (voir section Tokens).
5. **Suppression de code mort vérifié individuellement** : `components/ProcessSteps.tsx`, `components/dashboard/QuoteSignatureLinkButton.tsx` (voir section Fichiers supprimés).

Aucune page publique, cliente ou Admin n'a été redessinée : seules la structure de fichiers, les imports, la navigation (libellés/ordre/entrées) et l'outillage Design System ont été touchés.

---

# Dashboard

**Constat de départ** (audit UI-1.0) : `components/dashboard-preview/**` dupliquait quasi à l'identique `components/dashboard/shell/**` (Sidebar, MobileDrawer, KpiTile, AttentionList, ActivityFeed, RevenueChart, QuickActions), tout en étant la seule source de la bibliothèque d'icônes (`icons.tsx`) — dont dépendait aussi `components/dashboard/shell/**` et la page d'accueil Admin réelle `app/dashboard/page.tsx`. C'était un fork vivant, pas du code mort : la production dépendait déjà en partie du dossier « preview ».

**Résolution retenue** :
- `components/dashboard-preview/icons.tsx` a été déplacé (et non recopié) vers `components/dashboard/shell/icons.tsx` — c'est la seule pièce du dossier preview qui était une véritable dépendance partagée, pas un doublon.
- Les 5 imports qui pointaient vers `@/components/dashboard-preview/icons` ont été réécrits vers `@/components/dashboard/shell/icons` : `components/dashboard/shell/KpiTile.tsx`, `MobileDrawer.tsx`, `Sidebar.tsx`, `nav-data.ts`, et `app/dashboard/page.tsx`.
- Le reste de `components/dashboard-preview/**` (Sidebar, MobileDrawer, KpiTile, AttentionList, ActivityFeed, RevenueChart, QuickActions, `PreviewShell.tsx`, `mock-data.ts`, `nav-data.ts`) a été supprimé : chaque fichier avait un équivalent réel et plus complet dans `components/dashboard/shell/**`, déjà utilisé par `app/dashboard/page.tsx`.
- La route `app/dashboard-preview/**` (layout + page) a été supprimée : elle n'était accessible que derrière `requireSession()`, ne servait plus qu'à afficher des données de démonstration (`mock-data.ts`), et n'était référencée nulle part ailleurs dans l'application.
- Le commentaire de `components/SiteChrome.tsx` mentionnant explicitement `/dashboard-preview` a été mis à jour pour ne plus référencer une route qui n'existe plus (le comportement d'isolation du chrome public sur `/dashboard` était déjà correct — `/dashboard-preview` était déjà couvert par le test de préfixe `startsWith("/dashboard")`, ce n'était pas un bug fonctionnel, seulement un commentaire obsolète après suppression de la route).

**Résultat** : une seule implémentation du Dashboard existe désormais (`components/dashboard/shell/**` + `components/dashboard/ui/**`). `grep -r "dashboard-preview"` sur `app/`, `components/` et `lib/` ne retourne plus aucun résultat.

**Non traité dans cette phase** (hors périmètre UI-1, signalé pour une phase ultérieure) : la migration du thème sombre Admin reste partielle — certaines pages `/dashboard/*` affichent encore un fond blanc par défaut, comme documenté dans `components/dashboard/shell/DashboardShell.tsx`. La mission interdisait explicitement de toucher au « Dashboard fonctionnel (hors fusion dashboard-preview) » : ce point n'a donc pas été traité ici.

---

# Navigation

**Avant** (`components/Navbar.tsx`) : Accueil, Boutique, Services, Autodidacte, À propos — ordre et libellés non conformes au CDC, `/outils` absent du menu principal alors qu'il en constitue un pilier (`00-CAHIER-DES-CHARGES-GLOBAL.md` §13).

**Après**, conforme à `00-CAHIER-DES-CHARGES-GLOBAL.md` §12 et `home/00-HOME-ARCHITECTURE.md` §3 :

| Avant | Après |
|---|---|
| Accueil | Accueil |
| Boutique | Services |
| Services | Boutique |
| Autodidacte | Les bases |
| À propos | Outils |

- **« Les bases »** remplace le libellé « Autodidacte » pour la même route `/formations` — la route elle-même n'a pas été changée : `les-bases/00-ARCHITECTURE.md` §18 autorise explicitement de conserver temporairement `/formations` tant que la migration vers une route dédiée n'a pas été décidée et accompagnée d'une redirection.
- **« Outils »** ajouté, pointant vers `/outils` (page déjà existante, simplement absente du menu jusqu'ici).
- **« À propos »** retiré du menu principal, conformément au CDC (« sort du Header et reste accessible notamment depuis le Footer »). Vérifié avant retrait : `components/Footer.tsx` linke déjà `/a-propos`, la page reste donc atteignable.
- Le menu mobile (drawer) utilise le même tableau `nav` que le menu desktop (`...nav`) : la mise à jour se propage automatiquement, aucune duplication à corriger séparément.
- Les actions secondaires (Mon compte, Panier, Contact) n'ont pas été modifiées : elles existaient déjà comme actions icône distinctes du menu principal, déjà conformes à la répartition principale/secondaire du CDC.

**Non modifié, conformément à la mission** : le contenu des pages elles-mêmes (aucune page renommée, aucun titre éditorial changé). Le libellé « Autodidacte » subsiste tel quel dans `app/formations/page.tsx` (titre de page) : ce n'est pas une entrée de navigation, la mission interdisait explicitement de toucher au contenu des pages.

---

# Design System

Quatre primitives créées dans `components/ui/` (thème clair, site public/client — distinctes de `components/dashboard/ui/` qui reste le Design System du thème sombre Admin, conforme à MASTER-12 §142 : un token de marque partagé, des surfaces différentes par contexte) :

- **`Button.tsx`** — variantes `primary` / `secondary` / `tertiary` / `destructive`, conformes à la hiérarchie MASTER-12 §25-29. Accepte `href` (rend un `Link`) ou les props natives d'un `<button>`. Hauteur `h-10` (40 px, taille tactile confortable, MASTER-12 §30), focus visible (`focus-visible:outline`, MASTER-12 §32).
- **`Card.tsx`** — reprend le motif déjà répété manuellement dans plusieurs fichiers (`rounded-2xl border border-neutral-200 bg-white shadow-sm`, ex. `CustomerAccountShell.tsx`), désormais centralisé et utilisant les nouveaux tokens `rounded-card`/`shadow-card` (voir Tokens).
- **`Badge.tsx`** — tons `neutral` / `success` / `warning` / `danger` / `info`, miroir clair de `AdminBadge` (même principe de tons sémantiques, palette claire au lieu de sombre). Toujours accompagné d'un texte, jamais de la seule couleur (MASTER-12 §91).
- **`Alert.tsx`** — tons `info` / `success` / `warning` / `danger`, avec un libellé textuel par défaut (« Information », « Succès », « Attention », « Erreur ») garanti même sans titre explicite fourni par l'appelant (MASTER-12 §238 : « sémantique avant couleur »). Utilise `role="alert"` pour le ton `danger`, `role="status"` sinon.

**Portée volontairement limitée** : seules ces quatre primitives ont été créées, conformément à la mission (« ne pas créer de composants qui ne seront pas utilisés immédiatement », « pas de sur-ingénierie »). Aucune primitive `Modal`/`Drawer`/`Table`/`EmptyState` n'a été ajoutée malgré leur mention dans l'audit UI-1.0 : leur besoin réel (contenu, comportement) ne sera connu qu'au moment de la refonte des pages qui les utiliseront, et cette phase ne devait pas anticiper ce contenu.

**Non câblé dans les pages existantes** : conformément à la mission (« ne pas commencer la refonte graphique des pages »), ces primitives ne remplacent aucun bouton/carte existant dans le code actuel. Elles sont disponibles pour la prochaine phase (refonte page par page) mais n'ont aujourd'hui aucun consommateur — c'est un état transitoire attendu, pas un oubli.

---

# Tokens

Extension additive de `tailwind.config.js` (`theme.extend`), sans suppression ni modification d'aucune valeur existante :

```js
borderRadius: { card: "1rem" },
boxShadow: {
  card: "0 10px 30px -26px rgba(10, 10, 10, 0.25)",
  elevated: "0 20px 60px -32px rgba(10, 10, 10, 0.35)",
},
spacing: { section: "5rem" },
```

**Justification, pas d'invention de valeurs** :
- `boxShadow.card`/`elevated` reprennent exactement les deux seules valeurs d'ombre jusqu'ici codées en arbitraire (`shadow-[0_10px_30px_-26px_rgba(10,10,10,0.25)]` et `shadow-[0_20px_60px_-32px_rgba(10,10,10,0.35)]`, identifiées par l'audit) — elles sont maintenant nommées et réutilisables sans dupliquer la valeur brute.
- `borderRadius.card` (1rem) est un alias sémantique de `rounded-2xl` (valeur Tailwind par défaut identique), pour que le composant `Card` référence un rôle plutôt qu'un nombre — conforme à MASTER-12 §141 (« préférer des rôles... plutôt que de lier toute l'UI à une valeur brute »).
- `spacing.section` (5rem) reprend la valeur `py-20` déjà utilisée une fois dans le code pour le rythme vertical d'une section publique.

**Ce qui n'a volontairement pas été étendu** : l'audit et une vérification par `grep` (occurrences de `py-10/12/14/16`, largeurs `max-w-*`) montrent que l'échelle de spacing et de radius par défaut de Tailwind couvre déjà correctement l'usage réel du code (aucune valeur arbitraire répétée en dehors des deux ombres déjà citées). Étendre davantage la configuration aurait ajouté des tokens sans réduire de dispersion réelle — contraire à la consigne « ne pas refaire entièrement la configuration » et à l'esprit anti-sur-ingénierie de la mission.

**Design System opérationnel, vérifié** : `components/ui/Card.tsx` utilise déjà `rounded-card` et `shadow-card` — les tokens ne sont donc pas des ajouts inertes, ils sont exercés par au moins un composant réel dès cette phase.

---

# Fichiers supprimés

## Dossier `dashboard-preview` (fusion, 12 fichiers)
- `app/dashboard-preview/layout.tsx`
- `app/dashboard-preview/page.tsx`
- `components/dashboard-preview/ActivityFeed.tsx`
- `components/dashboard-preview/AttentionList.tsx`
- `components/dashboard-preview/KpiTile.tsx`
- `components/dashboard-preview/MobileDrawer.tsx`
- `components/dashboard-preview/PreviewShell.tsx`
- `components/dashboard-preview/QuickActions.tsx`
- `components/dashboard-preview/RevenueChart.tsx`
- `components/dashboard-preview/Sidebar.tsx`
- `components/dashboard-preview/mock-data.ts`
- `components/dashboard-preview/nav-data.ts`

(`components/dashboard-preview/icons.tsx` n'a pas été supprimé mais déplacé vers `components/dashboard/shell/icons.tsx` — c'était une dépendance réelle, pas un doublon.)

## Code mort vérifié individuellement (2 fichiers)
- **`components/ProcessSteps.tsx`** — composant complet, fonctionnel, mais sans aucun import nulle part dans le dépôt (`grep` sur le chemin d'import exact, confirmé à zéro résultat avant suppression).
- **`components/dashboard/QuoteSignatureLinkButton.tsx`** — fonctionnalité (« copier le lien de signature ») entièrement dupliquée et supersédée par `components/dashboard/QuoteSignatureActions.tsx`, qui appelle la même route API (`/api/internal/quotes/[id]/signature-link`) et n'était lui-même importé nulle part.

## Explicitement conservé après vérification (non supprimé)
- **`components/dashboard/ui/AdminSearchBar.tsx`** (`AdminSearchInput`) — l'audit UI-1.0 le signalait comme mort (« zéro usage »). Vérification faite dans cette phase : il est en réalité utilisé dans `app/dashboard/customers/page.tsx:78`. Ce constat de l'audit était incorrect (ou périmé) ; le composant n'a pas été touché.
- **`components/FormationsEssentialTools.tsx`** et **`lib/formations-tools.ts`** — non importés nulle part, mais explicitement documentés comme travail préparatoire en attente dans `app/formations/page.tsx:346-347` (« Section "Outils essentiels" masquée : contenu pas encore finalisé. Voir components/FormationsEssentialTools.tsx et lib/formations-tools.ts. »). Ce n'est pas du code oublié : c'est un composant fini, prêt, volontairement non branché en attendant un contenu validé — le supprimer aurait détruit un travail de préparation légitime plutôt que de la dette. Signalé ici plutôt que supprimé (voir Arbitrages).

---

# Compatibilité

- **Aucun changement de comportement métier** : aucune route API, aucun modèle Prisma, aucun service, aucun moteur (`lib/engines/**`) n'a été touché.
- **Aucune régression fonctionnelle du Dashboard** : `app/dashboard/page.tsx` produit exactement le même rendu (mêmes composants `KpiTile`/`AttentionList`/`ActivityFeed`/`RevenueChart`/`QuickActions`, seule la provenance des icônes a changé de chemin d'import, pas de comportement).
- **Aucune destination cassée** : toutes les routes existantes (`/`, `/prestations`, `/boutique`, `/formations`, `/outils`, `/a-propos`, `/contact`, `/mon-compte`) existaient déjà avant cette phase ; la navigation ne fait que réorganiser des liens vers des pages déjà réelles, jamais vers une destination inventée (MASTER-12 §19 : « pas de fonctionnalité fictive »).
- **`/dashboard-preview` n'est plus accessible** (404) : c'était une route de démonstration derrière authentification, jamais liée depuis l'application ni exposée publiquement — sa disparition ne casse aucun lien entrant.
- **Build de production intégralement fonctionnel** après suppression : confirmé par `npm run build`, qui ne liste plus `/dashboard-preview` parmi les routes générées.

---

# Tests

```
npx tsc --noEmit         → aucune erreur
npm test                 → # tests 844 / # pass 844 / # fail 0   (inchangé avant/après — aucune logique métier modifiée)
npm run build             → succès (prisma generate && next build --webpack), /dashboard-preview absent des routes générées
```

`npm run lint` reste indisponible pour la même cause préexistante que toutes les phases précédentes (dépendance imbriquée `eslint-visitor-keys` incomplète dans `node_modules`, sans rapport avec cette mission).

Aucun test automatisé n'existait pour les composants frontend concernés (Navbar, Dashboard shell, primitives UI) avant cette phase ; aucun n'a donc été perdu. Le nombre de tests (844) est strictement identique à l'issue de la Phase 5.0, confirmant qu'aucune logique testée n'a été affectée par ce nettoyage frontend.

---

# Arbitrages

1. **`FormationsEssentialTools.tsx` / `lib/formations-tools.ts` non supprimés malgré zéro import.** La mission demande de supprimer les « composants morts » et « fichiers inutilisés ». Ce cas est ambigu : le code est inutilisé au sens strict (zéro import), mais un commentaire explicite dans `app/formations/page.tsx` documente qu'il s'agit d'une section volontairement masquée en attendant un contenu finalisé, avec un pointeur direct vers ces deux fichiers. Les supprimer aurait détruit un travail de préparation légitime plutôt que de la dette technique accumulée par erreur — à la différence de `ProcessSteps.tsx` et `QuoteSignatureLinkButton.tsx`, qui n'avaient aucune documentation indiquant un usage futur prévu. Choix retenu : conserver et signaler, plutôt que supprimer silencieusement un travail non encore intégré.
2. **`AdminSearchInput` non supprimé malgré le signalement de l'audit UI-1.0.** L'audit (Phase UI-1.0) l'avait classé comme mort. Une revérification directe dans cette phase a montré qu'il est utilisé dans `app/dashboard/customers/page.tsx`. Ce rapport corrige ce point plutôt que de propager une information obsolète ou incorrecte de l'audit précédent.
3. **Aucune primitive supplémentaire créée au-delà de Button/Card/Badge/Alert.** La mission cite ces quatre comme « exemples attendus » sans en imposer la liste exacte. L'audit UI-1.0 mentionnait aussi des besoins de `Modal`/`Drawer` partagés (trois implémentations `fixed inset-0` indépendantes existent). Choix retenu : ne pas les construire maintenant, car un composant `Modal`/`Drawer` générique correctement accessible (focus trap, `role="dialog"`) mérite sa propre conception dédiée plutôt que d'être ajouté rapidement dans une phase d'assainissement — cohérent avec la consigne explicite « ne pas créer de composants qui ne seront pas utilisés immédiatement » et « pas de sur-ingénierie ».
4. **Aucune extension de l'échelle Tailwind `spacing`/`borderRadius` au-delà des trois tokens ajoutés.** Une vérification par `grep` des valeurs `py-*`/`max-w-*` réellement utilisées dans le code a montré que l'échelle par défaut de Tailwind couvre déjà l'essentiel des usages observés, sans dispersion notable à corriger. Ajouter davantage de tokens sans dispersion réelle à résorber aurait été une extension de configuration non justifiée par un besoin observé, contraire à « ne pas refaire entièrement la configuration ».
5. **Primitives `components/ui/` non branchées dans les pages existantes.** Conformément à la mission (« ne pas commencer la refonte graphique des pages », « cette phase prépare uniquement le terrain »), aucun bouton, carte ou badge existant n'a été remplacé par les nouvelles primitives. Elles sont donc, à l'issue de cette phase, disponibles mais sans consommateur dans le code applicatif (à l'exception de `Card.tsx` qui exerce déjà les nouveaux tokens `rounded-card`/`shadow-card`) — état transitoire attendu, à lever lors de la prochaine phase de refonte page par page.
6. **Thème sombre Admin partiellement migré non traité.** La mission excluait explicitement le « Dashboard fonctionnel (hors fusion dashboard-preview) » du périmètre. La migration inachevée du thème sombre (documentée dans le code de `DashboardShell.tsx`) reste donc en l'état, signalée mais non corrigée ici.

---

# Fin — UI-1-RAPPORT / FabSystem
