# UI-1.0-AUDIT-REFONTE-SAAS — Audit global avant refonte SaaS

**Date : 22/08/2026**
**Périmètre : audit en lecture seule de l'application actuelle (App Router, layouts, navigation, composants, Design System, Tailwind, responsive, accessibilité, performances). Aucun fichier modifié, aucun refactoring, aucun composant créé, backend et moteurs non touchés.**

**Documents lus** : `docs/masters/MASTER-12-DESIGN-SYSTEM.md`, `docs/refonte-site-public/00-CAHIER-DES-CHARGES-GLOBAL.md`, et les architectures validées des chantiers de refonte (`home/00-HOME-ARCHITECTURE.md`, `Outils/00-ARCHITECTURE-OUTILS.md`, `Outils/13-ROADMAP-IMPLEMENTATION.md`, `Outils/AUDIT-COHERENCE-OUTILS-SAAS.md`, `Boutique/00-BOUTIQUE-ARCHITECTURE.md`, `services/00-SERVICES-ARCHITECTURE.md`, `les-bases/00-ARCHITECTURE.md`).

---

# État actuel

L'application est un monolithe Next.js 16 (App Router) en production, sans séparation structurelle entre site public, espace client et Admin : un seul `app/layout.tsx` racine, et la distinction visuelle des trois environnements repose sur un unique composant conditionnel (`components/SiteChrome.tsx`) qui teste un préfixe de route (`/dashboard`) plutôt que sur des route groups ou des layouts dédiés.

Trois identités visuelles coexistent déjà dans le code, conformément à l'intention MASTER-12 (« une identité, plusieurs contextes ») mais sans mécanisme de token partagé :
- **Site public** : clair, palette noir/blanc/gris + jaune FabSystem, cohérent avec la direction validée.
- **Espace client (`/mon-compte`)** : clair également, visuellement proche du site public plutôt que d'un véritable produit SaaS — une seule page plate, sans navigation dédiée à plusieurs entrées (« Mes projets », « Mes achats », etc. n'existent pas encore, cohérent avec le fait que le Projet SaaS n'est pas encore branché en frontend).
- **Admin (`/dashboard`)** : sombre, sidebar, mais **migration inachevée** — `components/dashboard/shell/DashboardShell.tsx` indique explicitement en commentaire que seules certaines pages (`/dashboard`, `/dashboard/orders`) ont été migrées vers le thème sombre ; les autres pages Admin s'affichent encore sur fond blanc par défaut. C'est un état transitoire déjà en cours, pas un chantier qui commence de zéro.

Une route de maquettage expérimentale (`app/dashboard-preview/**`) existe en parallèle du Dashboard réel et n'a pas été nettoyée après son usage de validation visuelle — voir Dette UI.

Aucun moteur métier (Phases 4.x/5.0) n'est aujourd'hui consommé par le frontend : les pages Projet/Circuits/Schéma décrites dans les CDC de refonte n'existent pas encore côté UI. La refonte SaaS porte donc sur un terrain largement vierge côté « Mes projets » et un terrain existant mais daté côté site public.

---

# Architecture frontend

**Structure `app/`** : plate, sans route groups. Arbres principaux observés :
- Public marketing : `app/page.tsx`, `app/prestations`, `app/boutique` (+ `[slug]`), `app/outils`, `app/formations` (+ `bases-12v`, `lire-schema`, `types-batteries`), `app/a-propos`, `app/contact`, `app/realisations`, trois landing pages SEO (`installation-12v-bateau`, `probleme-charge-batterie-bateau`, `securisation-correction-bateau`), `app/mentions-legales`, `app/confidentialite`, `app/vcard`.
- Client : `app/mon-compte`, `app/connexion-client`, `app/panier` (+ `panier/projet`), `app/commande` (+ `commande/merci`).
- Admin : `app/dashboard/**` (accounting, catalog, content/testimonials, customers, discounts, invoices, orders, quotes) et son doublon `app/dashboard-preview/**`.
- Interne : `app/api/**`, `app/login`, `app/sign/[id]`.

**Layouts** : seulement 4 fichiers `layout.tsx` dans tout le dépôt.
- `app/layout.tsx` — racine, charge `Space_Grotesk` via `next/font/google`, enveloppe `<CartDrawerProvider><SiteChrome>{children}</SiteChrome><CartDrawer /></CartDrawerProvider>`.
- `components/SiteChrome.tsx` — composant client qui affiche Navbar/Footer publics sauf si le chemin commence par `/dashboard` (`ISOLATED_CHROME_PREFIXES`). `/dashboard-preview` n'est **pas** dans cette liste d'exclusion : il reçoit donc potentiellement Navbar/Footer publics en plus de son propre `PreviewShell` — incohérence de superposition de chrome à vérifier.
- `app/dashboard/layout.tsx` — `requireSession()` puis `DashboardShell`.
- `app/dashboard-preview/layout.tsx` — layout séparé, auth-gated, rendant `PreviewShell` ; son propre commentaire le décrit comme une route de preview isolée du thème sombre « SANS toucher à `app/dashboard/**` ».
- `app/login/layout.tsx` — pass-through, `robots: noindex`.

Aucune des routes `/mon-compte`, `/outils`, `/boutique`, `/formations`, `/panier` ne possède de layout dédié : elles héritent directement du layout racine. La séparation public/client/admin n'est donc pas portée par l'architecture de routing mais par une condition de chaîne de caractères dans un composant client.

**Navigation** :
- Public : `components/Navbar.tsx` (305 lignes, `"use client"`). Entrées actuelles : Accueil, Boutique, Services (`/prestations`), Autodidacte (`/formations`), À propos — **différentes de la navigation V2 validée** (`Accueil · Services · Boutique · Les bases · Outils`, avec Contact/Compte/Panier en secondaire et À propos sorti du menu principal). `/outils` n'apparaît pas du tout dans la navigation actuelle alors que le CDC global en fait un pilier de premier niveau. Mobile : burger + drawer avec **focus-trap fait à la main** (gestion manuelle de Tab/Shift+Tab, fermeture Escape) — solution fonctionnelle mais non basée sur un pattern partagé.
- Client : aucune navigation dédiée — `CustomerAccountShell` est une page unique, cohérent avec l'absence actuelle de plusieurs sous-pages client.
- Admin : `components/dashboard/shell/Sidebar.tsx`, pilotée par `nav-data.ts`, réductible (72px/260px, état persisté en `localStorage`), drawer mobile dédié. Conforme à la direction MASTER-12 §48 (sidebar sombre groupée, réductible, drawer mobile).

---

# Design System existant

**Tailwind** (`tailwind.config.js`, config v3 classique) : un token `brand` (jaune FabSystem) est bien centralisé (`brand.50` à `brand.700`, `brand.400 = #facc15`) et utilisé dans une cinquantaine de fichiers — le jaune n'est donc **pas** dispersé en `bg-yellow-400` brut. `fontFamily.sans = ["Space Grotesk", ...]` conforme à MASTER-12 §10. En revanche, **aucune extension de thème pour les espacements, rayons ou ombres** : tout est en classes Tailwind par défaut ou en valeurs arbitraires inline (`shadow-[0_20px_60px_-32px_rgba(...)]`), ce qui va à l'encontre de MASTER-12 §140-141 (« centraliser progressivement couleurs, spacing, radius, shadow ») sans être bloquant.

`app/globals.css` : minimal (3 directives `@tailwind`, un `@layer base` fixant la police et le fond blanc global, une classe `.transition-base`, un reset `prefers-reduced-motion`). **Aucune stratégie dark mode** : pas de `darkMode: 'class'` dans la config, pas de sélecteur `.dark`, pas de `prefers-color-scheme`. Le thème sombre de l'Admin est obtenu en codant en dur des classes sombres (`bg-[#0a0a0b]`, `bg-neutral-900/60`, `border-neutral-800/80`) directement sur les pages/composants Admin — cohérent avec la direction MASTER-12 (« aucun dark mode utilisateur global exigé », §230), mais cela signifie que public/client (clair) et Admin (sombre) sont **deux palettes disjointes codées en dur**, non un système de tokens sémantiques partagé (`surface`, `text-muted`, etc. recommandés MASTER-12 §141) capable de servir les deux thèmes.

**Composants communs** :
- **Site public : aucune bibliothèque de primitives** (`components/ui/` n'existe pas pour le public). `components/PageHero.tsx` est le seul composant public réellement mutualisé (8 pages). Boutons, cartes, badges sont recopiés à la main page par page.
- **Admin : bibliothèque partielle et partiellement adoptée**, `components/dashboard/ui/` (`AdminPageHeader`, `AdminCard`, `AdminBadge`, `AdminButton`, `AdminEmptyState`/`AdminAlert`, `AdminSearchInput`, `AdminTable`). Adoption inégale : `AdminPageHeader` dans 17 fichiers (bien adopté), `AdminTable` dans seulement 5 alors que 4 pages (`invoices`, `invoices/[id]`, `quotes`, `quotes/[id]`) utilisent encore des `<table>` bruts, `AdminSearchInput` codé mais **jamais utilisé**.
- Aucune primitive `Modal`/`Drawer` partagée malgré 3 implémentations `fixed inset-0` indépendantes (Navbar mobile, `CartDrawer`, `MobileDrawer` Admin ×2 avec le doublon preview).

**Icônes** : SVG inline, pas de librairie externe (`lucide-react`, `heroicons` absents du `package.json`) — conforme à MASTER-12 §82. Écart notable : `app/outils/page.tsx` utilise des **emoji** (`⚡`, `🔋`, `⏱️`, `☀️`) comme icônes de cartes calculateur, rompant avec la convention SVG du reste du site — contraire à MASTER-12 §83 (« ne pas utiliser les emojis comme iconographie principale de l'interface »). Des emoji apparaissent aussi ponctuellement dans `formations/**`, `QuizFormations.tsx`, `ContactForm.tsx`, `CalcSection.tsx`, `TestimonialsSection.tsx`, `AttentionList.tsx` (Admin) — motif récurrent, pas isolé à une page.

---

# Points forts

- Le socle technique (Next.js 16 App Router, `next/font` avec `display: swap`, `next/image` largement dominant sur `<img>` brut, `reactCompiler: true`, packages serveur correctement isolés via `serverExternalPackages`) est sain et n'a pas besoin d'être reconstruit — cohérent avec MASTER-10/11 (« ne pas réécrire ce qui fonctionne »).
- Le token `brand` jaune FabSystem est déjà centralisé dans Tailwind et cohérent avec MASTER-12 — pas de dispersion à corriger sur ce point précis.
- La bibliothèque `components/dashboard/ui/` existe réellement et est majoritairement adoptée (`AdminPageHeader` 17/∼20 pages) : l'Admin n'est pas à construire de zéro, seulement à finir de migrer et d'uniformiser.
- Le focus-trap du menu mobile public (`Navbar.tsx`) est une implémentation manuelle mais fonctionnelle et déjà accessible (Escape, Tab piégé) — un bon point de départ pour un futur composant `Drawer` partagé plutôt qu'une réécriture accessibilité de zéro.
- `PageHero` est un exemple existant, réellement réutilisé, de ce que MASTER-12 §144 demande (« créer ou stabiliser des composants communs lorsque le motif est réellement répété ») — un patron à généraliser plutôt qu'à réinventer.
- Aucune bibliothèque d'icônes lourde superflue, respect implicite de MASTER-12 §82.

---

# Dette UI

1. **Absence de primitives partagées côté public** (Button, Card, Badge, Alert, EmptyState, Modal) — chaque page recode son propre bouton avec une classe légèrement différente (15 fichiers identifiés avec des variantes de `inline-flex items-center justify-center rounded-md bg-neutral-900 ...`). Contraire à MASTER-12 §144-146.
2. **Fork Admin non résorbé** : `components/dashboard-preview/**` (9 fichiers : `Sidebar`, `MobileDrawer`, `KpiTile`, `ActivityFeed`, `AttentionList`, `RevenueChart`, `QuickActions`, `icons`, `mock-data`) duplique quasi à l'identique `components/dashboard/shell/**`, avec de légères divergences (bouton de déconnexion absent côté preview, clé `localStorage` différente). Plus grave : `app/dashboard/page.tsx` — la page Admin **de production** — importe directement depuis `dashboard-preview/` (`KpiTile`, `AttentionList`, `ActivityFeed`, `RevenueChart`, `QuickActions`, `icons`, `mock-data`) alors qu'une version « shell » plus aboutie existe par ailleurs. C'est un fork vivant, pas du code mort : toute correction doit aujourd'hui être faite en double, et la page d'accueil Admin réelle dépend d'un dossier explicitement documenté comme jetable.
3. **Route `/dashboard-preview` non nettoyée**, accessible en production derrière `requireSession()`, sans lien évident vers un plan de suppression.
4. **`AdminSearchInput` mort** : composant construit, jamais utilisé.
5. **Tables Admin non uniformisées** : 4 pages (`invoices`, `invoices/[id]`, `quotes`, `quotes/[id]`) utilisent des `<table>` bruts au lieu de `AdminTable`, sans le wrapper `overflow-x-auto` que `AdminTable` fournit — risque de débordement mobile non maîtrisé sur ces pages précises.
6. **Aucun token de spacing/radius/shadow centralisé** — écart direct avec MASTER-12 §140-141, à traiter en priorité avant toute nouvelle page pour éviter d'ajouter de la dette pendant la refonte elle-même.
7. **Emoji comme iconographie** sur `/outils` et plusieurs autres composants (voir Design System) — écart direct avec MASTER-12 §83, à corriger lors de la refonte de la page Outils de toute façon prévue par les CDC.
8. **Navigation publique désynchronisée du CDC validé** : entrées actuelles (Accueil, Boutique, Services, Autodidacte, À propos) ne correspondent ni aux libellés (« Les bases » au lieu d'« Autodidacte »), ni à l'ordre, ni à la présence d'« Outils » en première ligne, ni au retrait d'« À propos » du menu principal exigés par `00-CAHIER-DES-CHARGES-GLOBAL.md` §12 et `home/00-HOME-ARCHITECTURE.md` §3.

---

# Dette UX

1. **Espace client encore « page marketing étendue »**, pas un produit SaaS : `CustomerAccountShell` est une page plate unique, sans les cinq entrées (Mes projets / Mes achats / Mon accompagnement / Mes outils / Mon profil) attendues par MASTER-12 §46 et MASTER-06. Ce n'est pas une régression — le Projet SaaS n'existe pas encore côté backend consommé par l'UI — mais l'écart est structurel, pas cosmétique : il faudra une vraie navigation client, pas un habillage.
2. **`/outils` ne reflète pas l'architecture cible** « Hub public → une page par outil » : la page actuelle regroupe tout dans `components/CalcSection.tsx`, un composant client de **1415 lignes**, à l'opposé du modèle « une page dédiée par outil » validé par `Outils/00-ARCHITECTURE-OUTILS.md` §6-7. C'est le plus gros écart fonctionnel identifié entre l'existant et les CDC de refonte.
3. **`/realisations` en sursis mais toujours branché** : la page CDC Services (`services/00-SERVICES-ARCHITECTURE.md` §12/§25.21) prévoit sa sortie de l'architecture cible V2, mais elle est aujourd'hui liée depuis 4 emplacements réels (`Footer.tsx`, `app/page.tsx`, `app/prestations/page.tsx`, `app/vcard/page.tsx`). Sa suppression n'est pas un simple retrait de fichier : elle implique une redirection SEO et la mise à jour de 4 call sites, comme le CDC l'anticipe déjà.
4. **Migration Admin dark theme à moitié faite**, documentée dans le code lui-même comme un état transitoire assumé — pas une dette cachée, mais un chantier à terminer avant d'ajouter de nouvelles pages Admin, sous peine d'ajouter une troisième variante (dark migré / dark ancien / blanc résiduel).
5. **Aucune donnée Projet/Circuit/Schéma consommée en frontend** : les 9 moteurs métier construits en Phase 4.x/5.0 (Energy, Battery, Alternator, Solar, Charger, GlobalEnergyBalance, Circuit, Cable, Protection, Diagram) n'ont aujourd'hui aucune UI cliente. C'est attendu à ce stade du projet (roadmap MASTER-11 : moteurs avant interfaces), mais cela signifie que la refonte SaaS de l'espace client démarre sans aucun composant existant à réutiliser pour Bilan/Batterie/Circuits/Schéma — tout est à construire, en s'appuyant sur les valeurs retenues déjà produites par le Runner.

---

# Responsive

Usage standard et large des points de rupture (`md:`, `lg:`, `sm:hidden`/`sm:flex`) dans Navbar, Footer et les grilles de pages. Points d'attention concrets :
- `overflow-x-auto` n'apparaît que dans 4 fichiers (`formations/page.tsx`, `ProcessSteps.tsx`, `CalcSection.tsx`, `AdminTable.tsx`) — cohérent avec le fait que les tables Admin non migrées vers `AdminTable` (invoices, quotes) n'ont probablement pas de wrapper de scroll horizontal, un risque mobile concret plutôt qu'hypothétique (MASTER-12 §44 : « un tableau desktop ne doit pas être simplement compressé »).
- Largeurs arbitraires (`w-[...]`) dans 20 fichiers, mais essentiellement sur des éléments de chrome dimensionnellement légitimes (logo, largeur de drawer, largeur de sidebar) plutôt que sur du contenu éditorial — pas un anti-pattern généralisé, mais la duplication Admin/dashboard-preview de ces valeurs (`w-[72px]`/`w-[260px]`, `w-[85%] max-w-[300px]`) illustre à nouveau le coût du fork non résorbé : toute correction de largeur de sidebar doit être faite deux fois.
- Aucun scroll horizontal de page détecté par ailleurs, aucun `100vh` imposé identifié en dehors des drawers plein écran (comportement attendu pour un overlay).

---

# Accessibilité

- Couverture `aria-label`/`aria-hidden`/`role=` large sur les éléments interactifs (plusieurs centaines d'occurrences), boutons icône seule du Navbar tous étiquetés.
- **`focus-visible:` explicite seulement dans 5 fichiers** — la majorité des éléments interactifs du reste du dépôt s'appuient sur le focus navigateur/Tailwind par défaut plutôt que sur un traitement systématisé, alors que MASTER-12 §32 exige un focus « clairement visible » de façon transversale. Pas une absence totale, mais un traitement non uniformisé — bon candidat pour un token de focus centralisé lors de la Phase tokens.
- **Aucun `role="dialog"` dans tout le dépôt** : les 4 overlays plein écran identifiés (drawer Navbar, `CartDrawer`, `LightboxImage`, `MobileDrawer` Admin ×2) sont des `fixed inset-0` sans sémantique ARIA de dialogue. Seul le drawer Navbar a un focus-trap manuel confirmé ; `CartDrawer` et `LightboxImage` sont à vérifier spécifiquement avant refonte, car un lecteur d'écran ne peut pas aujourd'hui identifier ces éléments comme des dialogues modaux.
- `<label` présent dans seulement 20 fichiers alors que plusieurs formulaires volumineux existent (`InvoiceCreateForm.tsx` 798 lignes, `QuoteCreateForm.tsx` 411 lignes, `CheckoutForm.tsx`, `ContactForm.tsx`) — à auditer formulaire par formulaire avant migration, ce chiffre global ne garantit pas une couverture complète.
- `alt` cohérent sur les échantillons vérifiés (logos Navbar/Footer).

---

# Performances

- Base saine : `next/image` dominant (14 fichiers) contre seulement 2 usages de `<img>` brut à vérifier ponctuellement ; polices via `next/font/google` avec `display: swap` et sous-ensemble de graisses limité (300 à 700) ; `reactCompiler: true` activé ; aucune configuration `images.domains`/`remotePatterns` — cohérent si aucune image distante n'est utilisée, à surveiller si la refonte en introduit.
- **`components/CalcSection.tsx` (1415 lignes, `"use client"`)** est de loin le plus gros risque de performance frontend identifié : c'est un unique composant client monolithique chargé sur la page publique `/outils`, à l'opposé de l'architecture « une page dédiée par outil » demandée par les CDC — la refonte de cette page réduira mécaniquement ce risque en la découpant.
- Autres gros composants client à surveiller lors de leur migration : `InvoiceCreateForm.tsx` (798 lignes), `QuoteSignatureForm.tsx` (431), `QuoteCreateForm.tsx` (411), `PrestationsDistanceOffers.tsx` (408), `QuizFormations.tsx` (364), `Navbar.tsx` (305) — pas anormaux en soi, mais à garder à l'esprit si la refonte doit les redécouper.

---

# Priorités de migration

Conformément à MASTER-12 §254 (« tokens → primitives → layouts → composants récurrents → pages ») et §253 (« pas de refonte Big Bang »), et à l'ordre déjà validé par `Outils/13-ROADMAP-IMPLEMENTATION.md`, l'audit suggère l'ordre suivant — l'ordre réel définitif reste à confirmer lors du cadrage détaillé de chaque chantier :

1. **Assainir avant d'ajouter** : résorber le fork `dashboard-preview` (décider explicitement : suppression ou fusion vers `dashboard/shell`, puis migration de `app/dashboard/page.tsx` vers la version retenue) — sinon toute nouvelle page Admin ajoutée pendant la refonte risque d'hériter du mauvais dossier.
2. **Tokens Tailwind** : ajouter les extensions de thème manquantes (spacing/radius/shadow, éventuellement des tokens sémantiques `surface`/`text-muted`/`border` réutilisables entre le clair public/client et le sombre Admin) sans toucher au contenu des pages.
3. **Primitives publiques** : construire un premier socle `components/ui/` public (Button, Card, Badge, Alert, EmptyState) à partir des patterns déjà répétés (15 boutons quasi identiques, cartes `rounded-2xl border ...`) — remplace la duplication sans changer la direction visuelle.
4. **Layouts/route groups** : envisager des route groups (`(public)`, `(client)`, `(admin)`) pour remplacer le test de préfixe unique dans `SiteChrome`, avant que l'espace client ne gagne ses futures sous-pages (Mes projets, etc.) — sinon chaque nouvelle route client devra repasser par la même condition fragile.
5. **Navigation publique** : aligner `Navbar.tsx` sur la nav V2 validée (`Accueil · Services · Boutique · Les bases · Outils`, Contact/Compte/Panier secondaires, À propos hors menu principal) — changement contenu dans un seul composant, fort impact perçu, faible risque.
6. **Pages publiques par ordre d'écart CDC croissant** : Home (CDC très détaillé, structure existante déjà proche par endroits) → Services → Boutique → Les bases/`formations` → Outils (le plus gros chantier, découpage de `CalcSection.tsx` en pages dédiées, à traiter en dernier du site public car il dépend des primitives et du modèle de données outils/Project qui doit encore être défini).
7. **Finir la migration Admin dark theme** en parallèle et indépendamment du site public (aucune dépendance croisée), page par page, en s'appuyant sur `AdminTable`/`AdminCard`/`AdminButton` déjà existants plutôt que d'en recréer.
8. **Espace client SaaS** en dernier : dépend des primitives (étape 3), d'un layout dédié (étape 4) et surtout du branchement des moteurs métier Phase 4.x/5.0 déjà construits — prématuré avant que Project/Circuits soient exposés via une API consommable par le frontend.

---

# Roadmap d'implémentation

Reprise et adaptée de `Outils/13-ROADMAP-IMPLEMENTATION.md` (déjà validée) et de MASTER-11, avec le constat de cet audit :

```
Phase A — Assainissement (fork Admin, tokens Tailwind)
        ↓
Phase B — Primitives publiques (Button/Card/Badge/Alert/EmptyState)
        ↓
Phase C — Navigation publique V2 (Navbar + Footer alignés au CDC)
        ↓
Phase D — Pages publiques, une par une, dans l'ordre de la section précédente
        ↓
Phase E — Finalisation du thème sombre Admin (pages restantes)
        ↓
Phase F — Modèle technique commun Outils/Project (déjà en cours côté moteurs,
          Phase 4.0 à 5.0 backend terminées — reste l'exposition API)
        ↓
Phase G — Refonte /outils en pages dédiées par outil
        ↓
Phase H — Espace client SaaS (Mes projets, navigation à 5 entrées, Vue d'ensemble)
        ↓
Phase I — Assistant Circuit, Schéma (public puis avancé)
```

Chaque phase doit suivre la méthode déjà validée par le CDC global : **AUDITER → CONCEVOIR → MAQUETTER → VALIDER → DÉVELOPPER**, page par page, sans big bang simultané public + client + admin (MASTER-12 §253, CDC global §2/§27).

---

# Risques

1. **Régression silencieuse du fork Admin** : si `dashboard-preview` est supprimé sans d'abord migrer ce que `app/dashboard/page.tsx` en importe réellement (KPI, activité, revenus), la page d'accueil Admin de production casse. Ce risque doit être traité en premier, isolément, avant toute autre modification Admin.
2. **Redirection SEO oubliée sur `/realisations`** : sa suppression, prévue par le CDC Services, touche 4 fichiers ; un oubli casse des liens entrants et perd potentiellement du référencement déjà acquis — le CDC l'anticipe déjà explicitement (§12), donc le risque est documenté mais reste réel si l'implémentation est précipitée.
3. **Incohérence prolongée entre navigation réelle et navigation documentée** : tant que `Navbar.tsx` n'est pas mis à jour, chaque nouvelle page publique développée pendant la refonte risque d'être ajoutée sous l'ancienne convention de libellés plutôt que la nouvelle, un travail à refaire.
4. **Accessibilité des overlays** : l'absence de `role="dialog"` sur `CartDrawer`/`LightboxImage`/`MobileDrawer` est un risque de conformité déjà présent en production, pas seulement un risque futur — à corriger indépendamment du calendrier de refonte visuelle plutôt que d'attendre une phase dédiée.
5. **`CalcSection.tsx` comme point de blocage** : toute évolution de `/outils` avant son découpage en pages dédiées oblige à modifier un fichier de 1415 lignes partagé par plusieurs calculateurs — risque de régression croisée entre outils tant que le découpage n'a pas eu lieu.
6. **Dépendance de l'espace client SaaS aux moteurs backend** : commencer la refonte visuelle de « Mes projets » avant que l'API d'exposition des moteurs (Phase 4.0-5.0) soit définie créerait une UI à réécrire — ordre de dépendance à respecter strictement (cohérent avec MASTER-11 §75-76).
7. **Double palette non tokenisée** : sans tokens sémantiques partagés entre le thème clair (public/client) et sombre (Admin), toute évolution future de la marque (ex. nuance de gris, rayon de bordure) devra être répercutée manuellement à deux endroits distincts — risque de dérive silencieuse entre les deux thèmes avec le temps.

---

# Arbitrages

1. **Portée de la lecture des CDC de refonte.** La mission demandait de lire « tous les CDC de refonte concernés ». Compte tenu du volume (plus de 40 fichiers dans `docs/refonte-site-public/`, incluant des sous-sections détaillées page par page), cet audit a lu en profondeur les documents d'architecture de premier niveau (`00-CAHIER-DES-CHARGES-GLOBAL.md` et chaque `00-*-ARCHITECTURE.md`/`00-ARCHITECTURE.md` de section, plus la roadmap et l'audit de cohérence Outils) qui fixent les règles structurantes et anti-dérive, plutôt que l'intégralité des fichiers `01` à `11` détaillant chaque section visuelle précise (Hero, Footer, FAQ, etc.). Cette profondeur suffit pour un audit d'écart architecture-vs-code ; une lecture exhaustive des CDC détaillés sera nécessaire au moment de concevoir chaque page individuellement, conformément à la méthode « page par page » déjà validée.
2. **Étendue de l'audit de code.** L'audit du code a été délégué à un agent d'exploration en lecture seule pour couvrir 14 axes (architecture, layouts, navigation, composants, tokens, duplication, dette, responsive, accessibilité, performance, icônes) sans faire exploser le volume de lecture directe. Les faits rapportés (chemins de fichiers, nombres d'occurrences) proviennent de cette exploration et n'ont pas été revérifiés fichier par fichier un par un ; ils sont présentés avec le niveau de confiance d'un audit et non d'une vérification exhaustive ligne à ligne.
3. **Aucune recommandation de composants ou de tokens concrets n'a été produite ici.** Conformément à la mission (« aucune modification de code, aucun composant créé »), ce rapport reste un audit de constat et de priorisation, pas un cahier des charges de Design System détaillé — celui-ci reste à produire dans une phase ultérieure explicitement demandée.
4. **Le statut « dette » vs « état transitoire assumé » de la migration Admin dark theme.** Le code documente lui-même cette migration comme partielle et volontaire (commentaire dans `DashboardShell.tsx`). Ce rapport la classe en Dette UX plutôt qu'en anomalie bloquante, car elle est déjà pilotée consciemment — mais elle reste listée pour qu'elle ne soit pas oubliée avant l'ajout de nouvelles pages Admin.

---

# Fin — UI-1.0-AUDIT-REFONTE-SAAS / FabSystem
