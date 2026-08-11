# UI-9.1 — Unifier réellement tous les Hero publics

**Statut :** Implémenté — aucun commit (mission explicite : "Puis arrêter. Aucun commit.").
**Décision utilisateur en cours de mission** : la mission demandait initialement 2 variantes ("standard" et "home", cette dernière légèrement plus ample avec une photo à côté du texte). L'utilisateur a explicitement demandé **un seul Hero, sans branche de variante** — Home utilise donc exactement le même composant, les mêmes proportions et le même fond photo que toutes les autres pages, y compris la disparition de sa mise en page "texte + photo côte à côte".
**Ajout en cours de mission** : indicateur de scroll (chevrons discrets) intégré au composant commun.

---

# Inventaire avant

5 systèmes visuels différents coexistaient, tous rendant un `<h1>` mais avec des structures, hauteurs et rythmes différents :

| Page(s) | Composant | Fond | Overlay | Padding vertical | H1 | Largeur texte | CTA | Eyebrow |
|---|---|---|---|---|---|---|---|---|
| Services (prestations), À propos, 4 landers SEO (installation-12v-bateau, sécurisation-correction-bateau, réalisations, problème-charge-batterie) | `components/PageHero.tsx` | Photo `/hero-fabsystem.png` | `bg-black/55` **ou** `bg-black/60` selon la page (jamais le même partout) | `py-8 sm:py-10` | `text-2xl font-bold sm:text-3xl lg:text-4xl` | `max-w-2xl` | Boutons `rounded-xl`, `font-bold` | Non supporté |
| Home | `components/home/Hero.tsx` | Aucun (fond blanc) | Aucun | `py-12 sm:py-16 lg:py-20` | `text-3xl font-bold sm:text-4xl lg:text-5xl` | `max-w-xl` | Composant `Button` partagé, `rounded-lg`, `font-semibold`, `h-10` | Non |
| Boutique | `components/boutique/Hero.tsx` | Aucun (fond blanc), photo à droite en grille 50/50 | Aucun | `py-12 sm:py-16 lg:py-20` | `text-3xl font-bold sm:text-4xl lg:text-5xl` | `max-w-xl` | `Button` partagé | Oui (`text-neutral-500`) + checklist ✓ supplémentaire |
| Les Bases | `components/lesbases/Hero.tsx` | Photo `/hero-fabsystem.png` | `bg-black/60` | `py-14 sm:py-20` | `text-3xl font-bold sm:text-4xl lg:text-5xl` | `max-w-2xl`/`max-w-xl` | `Button` partagé | Oui (`text-brand-400`) |
| Outils | `components/outils/Hero.tsx` | Photo `/hero-fabsystem.png` | `bg-black/60` | `py-14 sm:py-20` | `text-3xl font-bold sm:text-4xl lg:text-5xl` | idem | `Button` partagé | Oui (`text-brand-400`) |
| Contact | inline dans `app/contact/page.tsx` | Photo `/hero-fabsystem.png` | `bg-black/55` | `py-14 sm:py-16 lg:py-20` **+ `min-h-[48vh]` arbitraire** | `text-2xl font-semibold sm:text-3xl lg:text-4xl` (`font-semibold`, pas `font-bold` — seule occurrence) | `max-w-2xl` | Aucun (slot `ServiceAssurance` uniquement) | Non |

Constats déjà notés par UI-9A et confirmés ici : 3 familles de mise en page (fond photo+overlay / fond blanc+grille) et jusqu'à 4 valeurs de padding vertical différentes, 3 échelles de H1, un `min-height` en viewport-unit totalement isolé (Contact), deux valeurs d'overlay concurrentes sur la même famille de composant (0.55 vs 0.60), et deux systèmes de bouton CTA distincts (le renderer interne de `PageHero` vs le composant `Button` partagé).

---

# Système commun retenu

**Un seul composant : `components/public/PublicHero.tsx`.** Pas de prop `variant` — Home utilise le composant à l'identique de toutes les autres pages, sur décision explicite de l'utilisateur en cours de mission (voir "Arbitrages"). Toutes les pages partagent désormais :

- même fond (`/hero-fabsystem.png`) et même overlay (`bg-black/60`, fixé une fois pour toutes — plus de `bg-black/55` résiduel) ;
- même conteneur (`mx-auto max-w-6xl px-6`) ;
- même rythme vertical (`pt-8 sm:pt-10`, plus `pb-16 sm:pb-14` si l'indicateur de scroll est affiché, sinon `pb-8 sm:pb-10`) ;
- même échelle de titre (`text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl`) ;
- même largeur de texte (`max-w-2xl` pour la description) ;
- même logique de CTA (un seul renderer `HeroAction`, boutons `rounded-xl px-4 py-2.5 text-sm font-bold`, variantes `primary`/`secondary`) ;
- même comportement mobile (CTA empilés `flex-col`, puis `sm:flex-row`) ;
- un `eyebrow` optionnel (utilisé par Boutique, Les Bases, Outils), une ligne `micro` optionnelle (utilisée par les landers SEO), un slot `assurance` optionnel (utilisé par Contact, À propos, landers SEO).

---

# Variante Standard

Il n'y a plus de variante nommée : la mise en page ci-dessus **est** le Hero, appliqué identiquement partout. Services (`/prestations`) a servi de référence de proportions comme demandé par la mission (`py-8 sm:py-10`, `text-2xl/3xl/4xl`, overlay `bg-black/60`) — c'est exactement ce jeu de valeurs qui a été généralisé à toutes les pages, y compris celles qui avaient auparavant un rythme différent (Les Bases/Outils passent de `py-14/py-20` à `py-8/py-10` ; Contact perd son `min-h-[48vh]`).

---

# Variante Home

**Supprimée sur demande explicite de l'utilisateur.** La Home n'a plus de traitement différencié : plus de fond blanc, plus de mise en page 50/50 avec photo à droite, plus d'échelle de titre `text-3xl/4xl/5xl`. Le composant `Button` partagé n'est plus utilisé dans le Hero de la Home (remplacé par le même `HeroAction` que toutes les autres pages). La photo `/hero-fabsystem.png`, auparavant affichée à côté du texte sur la Home, sert désormais de fond du Hero — comme sur toutes les autres pages — donc aucune perte d'usage réel de cet asset.

---

# Migration page par page

| Page | Avant | Après |
|---|---|---|
| `/` (Home) | `components/home/Hero.tsx`, mise en page 50/50 + photo | `PublicHero` avec `title` (JSX avec `<br/>` conservé), `description`, `primaryAction`/`secondaryAction`, `scrollTargetId="apres-hero"` |
| `/prestations` | `PageHero` | `PublicHero`, `scrollTargetId="parcours"` (ancre déjà existante, réutilisée) |
| `/boutique` | `components/boutique/Hero.tsx` (grille + checklist ✓) | `PublicHero` compact : `eyebrow="Je fais seul"`, titre + description fusionnés depuis l'ancien H1 + sous-ligne, checklist ✓ retirée (mission §5 : "pas de Hero marketing surdimensionné"), `scrollTargetId="guides-disponibles"` |
| `/formations` (Les Bases) | `components/lesbases/Hero.tsx` | `PublicHero`, `scrollTargetId="modules"` |
| `/outils` | `components/outils/Hero.tsx` | `PublicHero`, `scrollTargetId="calculateurs"` |
| `/contact` | Hero inline avec `min-h-[48vh]` | `PublicHero` avec `assurance={<ServiceAssurance tone="inverse" />}`, nouvel `id="apres-hero"` ajouté à la section suivante, `scrollTargetId="apres-hero"` |
| `/a-propos` | `PageHero` | `PublicHero`, nouvel `id="apres-hero"` ajouté à la section suivante |
| `/installation-12v-bateau` | `PageHero` | `PublicHero`, nouvel `id="apres-hero"` |
| `/securisation-correction-bateau` | `PageHero` | `PublicHero`, nouvel `id="apres-hero"` |
| `/realisations` | `PageHero` | `PublicHero`, nouvel `id="apres-hero"` |
| `/probleme-charge-batterie-bateau` | `PageHero` | `PublicHero`, nouvel `id="apres-hero"` |

Aucun texte éditorial modifié sauf : la checklist Boutique retirée (redondante avec la description, contraire au format compact demandé), et "Comment FabSystem peut m'aider" → "Comment Fabien peut m'aider" sur la Home (incohérence identité relevée par UI-9A, corrigée au passage puisque cette ligne était de toute façon réécrite).

---

# Indicateur de scroll (ajout en cours de mission)

Intégré directement dans `PublicHero.tsx`, pas de composant séparé à dupliquer par page :

- **Rendu** : deux chevrons SVG fins (`stroke-width: 2`, pas d'emoji, pas de pastille), le chevron du bas plus opaque que celui du haut — aucun texte "scroll".
- **Position** : `absolute inset-x-0 mx-auto`, centré horizontalement, `bottom-8` (32px) en mobile pour éviter la barre d'outils des navigateurs mobiles, `sm:bottom-6` (24px) en desktop — dans la fourchette 20-28px demandée.
- **Animation** : `animate-hero-scroll-hint` (nouveau, `tailwind.config.js`), 6px de déplacement vertical sur 2.2s, `ease-in-out infinite` — volontairement plus lent et discret que `animate-bounce` (Tailwind par défaut), pas de clignotement. Appliqué via `motion-safe:` ; de toute façon `app/globals.css` neutralise déjà globalement `animation-duration`/`transition-duration` sous `prefers-reduced-motion: reduce`, donc aucune régression possible même sans le préfixe.
- **Interaction** : vrai `<a href="#id">` — fonctionne sans JavaScript, navigable au clavier nativement (pas de `<button>`/`onClick` custom nécessaire), scroll fluide via `scroll-behavior: smooth` déjà globalement actif (`app/globals.css`). `aria-label="Voir la suite de la page"` explicite ; les deux `<path>` du SVG sont `aria-hidden`.
- **Cible réelle par page** : nouvelle prop `scrollTargetId` (id sans `#`), jamais une cible générique inventée — réutilise les ancres déjà existantes quand elles existaient (`#parcours`, `#guides-disponibles`, `#modules`, `#calculateurs`), et un nouvel `id="apres-hero"` ajouté sur la première section réelle des 6 pages qui n'avaient aucune ancre (Home, Contact, À propos, 3 landers SEO — le 4ᵉ lander en avait besoin aussi, soit 6 pages au total avec ce nouvel id).
- **Prop `showScrollIndicator`** : `true` par défaut. Non désactivée sur aucune page — aucun Hero du site public n'est aujourd'hui "anormalement court" ou en situation d'ambiguïté fonctionnelle justifiant de le masquer.
- **Espacement réservé** : quand l'indicateur est affiché, le padding bas du contenu passe de `pb-8 sm:pb-10` à `pb-16 sm:pb-14` pour qu'il ne chevauche jamais le dernier élément (CTA ou `assurance`) sur les Hero les plus courts (Contact, À propos).

---

# Composants supprimés / mutualisés

Supprimés (aucun autre usage restant, vérifié par grep avant suppression) :

- `components/PageHero.tsx`
- `components/home/Hero.tsx`
- `components/boutique/Hero.tsx`
- `components/lesbases/Hero.tsx`
- `components/outils/Hero.tsx`

Créé :

- `components/public/PublicHero.tsx` (unique point d'entrée Hero pour tout le site public)

`tailwind.config.js` étendu avec `keyframes.hero-scroll-hint` / `animation.hero-scroll-hint` (seul ajout de configuration nécessaire, pas de nouvelle dépendance).

---

# Responsive

Vérifié par lecture des classes (pas de navigateur réel disponible dans cet environnement — même méthodologie que les audits précédents) et par un smoke test réel (serveur de développement local, toutes les pages) :

- **375px** : padding horizontal `px-6` identique partout, CTA empilés `flex-col` avant `sm:flex-row`, H1 `text-2xl` de base (jamais la plus grande taille), image de fond en `bg-cover bg-center` (recadrage cohérent, pas de logique différente par page). Indicateur de scroll à `bottom-8`, hors de la zone où l'UI système mobile (barre d'adresse/outils) est susceptible d'intercepter le tap.
- **Desktop (1440)** : même hauteur `pt-8 sm:pt-10` sur toutes les pages sans exception (Home comprise) ; indicateur à `bottom-6` (24px), dans la fourchette demandée.

---

# Validation

- `npx tsc --noEmit` : aucune erreur.
- `npm test` : **872/872** tests passants, aucune régression.
- `npm run build` : build de production réussi, les 11 pages concernées listées sans erreur.
- Smoke test réel (serveur de développement local) :
  - Les 11 pages répondent `200`.
  - `bg-black/60` est désormais la seule valeur d'overlay trouvée sur les 7 pages échantillonnées (`/`, `/prestations`, `/boutique`, `/formations`, `/outils`, `/contact`, `/a-propos`) — zéro occurrence résiduelle de `bg-black/55` ou de `min-h-[48vh]` dans leur Hero.
  - Le H1 rendu a la classe **exactement identique** (`text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl`, plus `mt-3` si `eyebrow` présent) sur les 7 pages échantillonnées, Home comprise.
  - L'indicateur de scroll ("Voir la suite de la page") est présent exactement une fois sur chacune des 11 pages, et son `href="#<id>"` correspond bien à un élément `id="<id>"` réellement présent dans le HTML rendu, vérifié individuellement sur les 7 pages échantillonnées.

Checklist finale de la mission :

- [x] Inventaire complet des Hero existants avant migration.
- [x] Système commun défini et documenté (un seul composant, pas de duplication).
- [x] Services utilisé comme référence de proportions.
- [x] Boutique ramenée à un Hero compact, sans marketing surdimensionné.
- [x] Home harmonisée — décision utilisateur : identique au reste, pas de traitement "légèrement plus ample".
- [x] Composant commun créé (`components/public/PublicHero.tsx`), API simple (pas de prop `variant`).
- [x] Divergences supprimées : 5 anciens composants supprimés, `min-h-[48vh]` supprimé, double valeur d'overlay unifiée.
- [x] Comparaison visuelle "même site" confirmée par smoke test (classes identiques sur toutes les pages échantillonnées).
- [x] Responsive vérifié (375px et desktop).
- [x] Indicateur de scroll : chevrons sobres, animation légère et lente, `prefers-reduced-motion` respecté, ancre réelle par page, clavier accessible, `aria-label` explicite.
- [x] TypeScript OK, tests OK (872/872), build OK.

---

# Arbitrages

1. **Suppression de la distinction Home/Standard, contrairement à la demande initiale de la mission.** La mission textuelle demandait explicitement 2 variantes maximum avec une Home "légèrement plus ample". En cours de mission, l'utilisateur a demandé un seul Hero sans aucune branche de style, Home comprise. C'est ce second arbitrage, plus strict, qui a été appliqué — la Home a donc perdu sa mise en page 50/50 avec photo à côté du texte, remplacée par le même fond photo plein cadre que toutes les autres pages.
2. **Checklist ✓ de l'ancien Hero Boutique retirée**, pas migrée. Elle n'a pas d'équivalent dans le composant commun (aucune autre page n'en avait) et sa réintroduction comme prop dédiée aurait recréé une divergence rien que pour une seule page — contraire à l'objectif de la mission. Le contenu qu'elle portait (Concret / Accessible / Pensé pour le terrain) est déjà largement repris par la description et par les sections suivantes de la page Boutique.
3. **`scrollTargetId` nouveau plutôt qu'une résolution automatique du "prochain élément du DOM".** Une résolution générique (`nextElementSibling`) aurait évité d'ajouter des `id="apres-hero"` sur 6 pages, mais aurait rendu le composant dépendant du DOM environnant plutôt que d'une vraie ancre nommée — la mission demande explicitement "une vraie ancre/target propre à la page". Les ancres déjà existantes (`#parcours`, `#guides-disponibles`, `#modules`, `#calculateurs`) ont été réutilisées telles quelles ; seules les pages qui n'avaient strictement aucune ancre en ont reçu une nouvelle, minimale (`id="apres-hero"`, un seul id générique réutilisé partout où aucun nom plus spécifique n'existait déjà).
4. **Animation custom (`hero-scroll-hint`) plutôt que `animate-bounce` de Tailwind.** `animate-bounce` est conçu pour attirer l'attention ponctuellement (notifications, etc.), pas pour un élément visible en permanence sur toutes les pages publiques — trop rapide et trop marqué pour "discret" (mission). Une keyframe dédiée, plus lente (2.2s) et de plus faible amplitude (6px), a été ajoutée à `tailwind.config.js`.
5. **Le sous-titre "Les bonnes bases pour bien faire." de l'ancien Hero Boutique n'a pas été conservé comme ligne séparée** (n'existe pas dans l'API du composant commun, qui n'a qu'un `title` et une `description`) — fusionné implicitement dans le message porté par le H1 et la description, cohérent avec le format compact demandé par la mission §5.
