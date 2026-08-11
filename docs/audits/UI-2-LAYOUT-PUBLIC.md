# UI-2-LAYOUT-PUBLIC — Layout public & Design System

**Date : 22/08/2026**
**Périmètre : socle commun du site public (Header, Footer, primitives de mise en page). Aucune page publique redessinée, aucun contenu de page modifié, aucun changement backend/moteur/API/Prisma, Dashboard et espace client non touchés.**

**Documents lus** : `docs/masters/MASTER-12-DESIGN-SYSTEM.md`, `docs/refonte-site-public/00-CAHIER-DES-CHARGES-GLOBAL.md`, `docs/audits/UI-1-RAPPORT.md`, `docs/refonte-site-public/home/01-HEADER-HERO.md`, `docs/refonte-site-public/home/11-FOOTER.md`, et les architectures `00-*` déjà lues en Phase UI-1.0 (home, Outils, Boutique, services, les-bases) pour vérifier que le Layout couvre bien les besoins de chacune.

---

# Architecture

Le Layout public reste porté par les mêmes points d'entrée qu'avant cette phase — aucun nouveau mécanisme de routing, aucune duplication :

```
app/layout.tsx (racine, inchangé)
  └─ components/SiteChrome.tsx (inchangé depuis UI-1)
       ├─ components/Navbar.tsx   ← Header, réécrit dans cette phase
       │   {page}
       └─ components/Footer.tsx  ← Footer, réécrit dans cette phase
```

Deux nouvelles primitives de structure sont ajoutées dans `components/layout/` :

- **`Container`** — largeur de contenu unique (`narrow` / `default` / `wide`), remplace les `mx-auto max-w-6xl px-6` recopiés à la main (36 occurrences relevées par l'audit UI-1.0). Utilisée dès cette phase par `Navbar` et `Footer`.
- **`Section`** — rythme vertical unique (tokens `spacing.section` ajoutés en UI-1) avec un `tone` explicite (`light` / `muted` / `dark`), prête pour les futures sections de page (Home, Services, Boutique...) mais **non câblée dans une page existante** — conforme à la mission (« cette phase ne consiste pas à refaire les pages »).

C'est le **shell unique** demandé : Header et Footer le consomment déjà ; toute future page publique pourra le réutiliser sans le modifier, exactement comme le prescrit la mission (« toutes les pages publiques devront ensuite réutiliser ce Layout sans le modifier »).

Aucun fichier `app/*/page.tsx` n'a été touché. Seuls trois fichiers composants existants ont été modifiés (`Navbar.tsx`, `Footer.tsx`) et deux nouveaux créés (`components/layout/Container.tsx`, `Section.tsx`, plus leur barrel `index.ts`).

---

# Header

Réécriture complète de `components/Navbar.tsx` (le fichier reste nommé ainsi pour ne pas toucher à `SiteChrome.tsx` ni multiplier les points d'entrée — « un seul Layout public » vaut pour le composant rendu, pas pour son nom de fichier), strictement alignée sur `home/01-HEADER-HERO.md` §2-9 :

**Desktop** — structure `LOGO | NAVIGATION PRINCIPALE | CONTACT · COMPTE · PANIER` :
- Navigation principale inchangée depuis UI-1 (Accueil / Services / Boutique / Les bases / Outils).
- **Contact redevient explicite** : c'était un manquement identifié en relisant le CDC pendant cette phase — Contact était réduit à une icône seule (`aria-label` uniquement, pas de texte visible), alors que `01-HEADER-HERO.md` §6 l'interdit explicitement (« ne pas le réduire à une icône enveloppe seule »). Contact affiche désormais une icône **et** le mot « Contact ».
- Ordre des actions secondaires aligné sur le schéma exact du CDC (`CONTACT · COMPTE · PANIER`), alors que l'ordre précédent était Compte, Panier, Contact.
- État actif : remplacement du remplissage plein (`bg-neutral-100`) par un traitement plus sobre — texte renforcé + fin trait d'accent jaune sous l'entrée active (`after:h-0.5 after:bg-brand-400`), plus proche de « soulignement fin + petit accent jaune » (§5) que d'un onglet de dashboard, et ajout de `aria-current="page"`.

**Mobile** — structure `LOGO | PANIER | BURGER` (§8) :
- **Le Panier est désormais accessible directement dans la barre mobile** (bouton icône avec badge de quantité) — avant cette phase, il n'était accessible qu'en ouvrant le menu burger, ce qui contredisait la structure validée.
- Le Compte n'apparaît plus dans la barre mobile (conforme : « le Compte n'a pas besoin d'être exposé directement »), il reste dans le menu.
- Menu burger : les cinq rubriques principales d'abord, puis une **zone secondaire visuellement distincte** (séparée par une bordure) contenant Contact et Mon compte (§9) — le bouton Panier redondant, présent avant cette phase dans le tiroir, a été retiré puisqu'il est maintenant accessible directement dans la barre.

**Accessibilité additionnelle** (§21, MASTER-12 §32/§88) :
- `role="dialog" aria-modal="true" aria-label="Menu"` sur le panneau mobile (absent avant cette phase — aucun overlay du site n'avait de sémantique de dialogue, point relevé par l'audit UI-1.0).
- `aria-expanded` et `aria-controls` sur le bouton burger.
- **Retour de focus explicite sur le bouton burger à la fermeture du menu** (§9 : « retour du focus sur le bouton burger après fermeture ») — implémenté via une référence dédiée, avec garde explicite pour ne jamais voler le focus au chargement initial de la page (un piège fréquent de ce pattern, vérifié et évité).
- Fermeture automatique du menu à chaque changement de route (évite un tiroir resté ouvert au-dessus d'une nouvelle page après un clic sur un lien).
- Le focus-trap manuel déjà présent (Tab/Shift+Tab piégés, fermeture Escape) est conservé tel quel — il fonctionnait déjà correctement (UI-1.0 l'avait noté comme un des rares points forts d'accessibilité du code existant).

**Sticky** (§4) : comportement conservé à l'identique (`sticky top-0`, fond blanc légèrement transparent avec flou, bordure basse discrète) — il respectait déjà « rester accessible sans prendre trop de hauteur », « séparation légère », « aucun changement brutal ». Aucune logique de scroll-listener n'a été ajoutée pour un effet supplémentaire au scroll : cela aurait ajouté du JavaScript pour un gain visuel marginal, contraire à l'objectif Performance de cette phase (« le Layout doit rester très léger »).

**Non modifié** : le texte du Hero, la photographie, le logo (asset utilisé tel quel), les autres sections de la Home — tous explicitement hors périmètre de cette phase (Header/Footer uniquement).

---

# Footer

Réécriture complète de `components/Footer.tsx`, alignée sur `home/11-FOOTER.md` :

**Avant** : thème clair (`bg-white`), trois colonnes (Marque / Navigation mêlant plusieurs niveaux dont « Réalisations » et une ancre `#accompagnement-distance` / Contact avec CTA emails-téléphone proéminents), pas de réseaux sociaux, lien « Accès interne » en bas.

**Après**, conforme à la structure à quatre zones du CDC (§2, règle anti-dérive #2) :
1. **Marque** (sans intitulé textuel, le logo tient ce rôle) : logo + phrase de référence exacte du CDC (« Électricité embarquée pour bateaux, vans et camping-cars. ») + email en texte discret (coordonnées autorisées par §15, présentées sobrement plutôt qu'en gros CTA — le Footer ne devient pas une page Contact, cf. §15 in fine).
2. **Explorer** : Services, Outils, Les bases, Boutique — les quatre piliers publics validés par le CDC global §12, à la place de l'ancienne liste (qui incluait Réalisations et Prestations avec des libellés différents).
3. **FabSystem** : À propos, Contact, Mon compte (§2) — « Mon compte » est autorisé explicitement (§12), aucun « Créer un compte » n'a été ajouté (interdit §12).
4. **Informations** : Mentions légales, Politique de confidentialité. **Pas de CGV** : la page n'existe pas dans le site actuel, et le CDC interdit explicitement d'inventer une page légale vide (§19) — vérifié par un parcours des routes existantes avant d'écrire ce composant.

**Ligne basse** (§3) : copyright + année + réseaux sociaux. Seuls **Facebook et Instagram** sont affichés — ce sont les deux seuls profils officiellement déclarés (présents dans les données structurées `schema.org` de `app/layout.tsx`, champ `sameAs`), aucun autre réseau n'a été ajouté ni inventé (§14). Le lien « Accès interne » vers `/login` a été conservé en bas de page, discret — ce n'était ni exigé ni interdit par le CDC, et sa suppression aurait dégradé un chemin d'accès existant vers l'authentification Admin sans qu'aucune instruction ne le demande (voir Arbitrages).

**Thème** : fond `bg-neutral-950`, texte blanc pour les titres de groupe, gris clair pour les liens (§5) — conforme à « fond noir ou gris très foncé », distinct du reste du site public qui reste clair, cohérent avec la logique « une identité, plusieurs contextes » de MASTER-12 §2.

**Ce qui a été retiré consciemment** : le bloc CTA « Écrire un message / Voir le numéro / Demander un diagnostic » très visible de l'ancien Footer. Le CDC décrit une structure de liens sobres, pas un second bloc de conversion (§11 : « ne pas ajouter un nouveau gros CTA commercial dans le Footer », « le Footer doit rester calme »). La page `/contact` reste le point d'entrée pour ces actions.

**Non ajouté** : newsletter (interdit §10), Bateau/Van/Camping-car (§9, non ajoutés par défaut), Volta (interdit §21), accordéons mobile (interdit §8 en l'état actuel du nombre de liens).

---

# Layout

- **Container** (`components/layout/Container.tsx`) : trois tailles nommées plutôt que des valeurs dispersées — `narrow` (`max-w-3xl`, lecture longue), `default` (`max-w-6xl`, déjà la convention dominante du code, utilisée par Header et Footer), `wide` (`max-w-7xl`, compositions). Accepte un prop `as` pour changer la balise sémantique (`div` par défaut) sans dupliquer le composant.
- **Section** (`components/layout/Section.tsx`) : enveloppe `<section>` avec rythme vertical (`py-section`, token ajouté en UI-1) et un `tone` explicite (`light` / `muted` / `dark`) — empêche une alternance clair/sombre mécanique non justifiée (MASTER-12 §212 : « pas d'alternance mécanique clair/noir toutes les deux sections », chaque section sombre doit avoir une fonction). Composé au-dessus de `Container`, pas dupliqué.
- **Grilles/rythme** : aucune grille générique supplémentaire n'a été créée — les CDC de pages (Home, Services, Boutique...) définissent des compositions différentes section par section (ex. Hero 50/50, trois univers en grandes photos, cartes Boutique) qu'un composant de grille unique ne pourrait pas anticiper sans inventer leur contenu. Cohérent avec la mission (« ne pas créer de composants qui ne seront pas utilisés immédiatement »).
- **Cohérence avec le Design System UI-1** : Header et Footer utilisent déjà `Container` ; le composant `Card` (UI-1) exerce déjà `rounded-card`/`shadow-card` ; le drawer mobile du Header utilise désormais `shadow-elevated` (au lieu de `shadow-xl`) — troisième composant à exercer réellement les tokens ajoutés en UI-1, qui ne restent donc pas inertes.

---

# Responsive

Vérifié par lecture de code (classes Tailwind, comportement des breakpoints) et par un test de rendu réel (serveur de développement démarré, page d'accueil récupérée par requête HTTP, présence confirmée de toutes les entrées de navigation et de toutes les rubriques du Footer dans le HTML généré). **Aucun outil de capture visuelle par navigateur n'est configuré dans ce dépôt** (ni Playwright ni Puppeteer dans `package.json`) : la validation « ultra large / desktop / tablette / mobile » ci-dessous est donc une revue de code et de rendu HTML, pas une vérification visuelle pixel par pixel — limite transparente, à confirmer visuellement lors d'une prochaine revue humaine.

- **Mobile étroit/large** : Header à deux zones (logo + actions), navigation principale entièrement déplacée dans le tiroir ; aucune colonne miniaturisée, aucun scroll horizontal introduit.
- **Tablette** : le point de bascule reste `sm:` (640 px, convention déjà en place avant cette phase) — au-delà, la navigation desktop complète s'affiche. Aucune régression introduite : c'était déjà le comportement du Header précédent, seul son contenu a changé.
- **Desktop/laptop** : `Container` en largeur `default` (`max-w-6xl`) centre le contenu du Header et du Footer, cohérent avec la quasi-totalité des pages existantes.
- **Ultra large** : `Container` empêche le contenu de s'étirer au-delà de sa largeur maximale (MASTER-12 §86 : « ne pas étirer artificiellement le contenu sur les très grands écrans ») — vérifié par lecture du composant (`max-w-*` + `mx-auto`), pas de valeur en `vw` ou en pixels fixes.
- Aucun `overflow-x` introduit ; le tiroir mobile utilise désormais `overflow-y-auto` (ajouté) pour rester utilisable si son contenu dépasse un très petit écran, conformément à « scroll interne uniquement si réellement nécessaire » (§9).

---

# Accessibilité

- **Overlay mobile** : ajout de `role="dialog"`, `aria-modal="true"`, `aria-label="Menu"` — comblant une lacune identifiée par l'audit UI-1.0 (« aucun `role="dialog"` dans tout le dépôt »). Le focus-trap manuel préexistant est conservé et reste fonctionnel.
- **Focus** : retour de focus au déclencheur (bouton burger) après fermeture, `aria-expanded`/`aria-controls` sur ce même bouton, `focus-visible:outline` sur tous les éléments interactifs du Header et du Footer (liens de navigation, icônes d'action, réseaux sociaux).
- **État actif** : `aria-current="page"` ajouté sur l'entrée de navigation active (desktop et mobile) — absent avant cette phase, l'état actif n'était porté que par la couleur/le fond.
- **Contact accessible** : le passage d'une icône seule à icône + texte visible améliore aussi l'accessibilité (pas seulement la conformité CDC) : un intitulé textuel est toujours plus robuste qu'une icône seule pour la compréhension, y compris en lecture assistée.
- **Réseaux sociaux** : chaque icône du Footer porte un `aria-label` explicite (« FabSystem sur Facebook », « FabSystem sur Instagram ») — jamais une information portée uniquement par l'icône (MASTER-12 §94/§155).
- **Couleur non exclusive** : l'accent jaune de l'état actif s'ajoute à un texte plus gras, jamais seul (MASTER-12 §91/§213).
- **Ordre logique / clavier** : la structure DOM suit l'ordre visuel (logo → navigation → actions), aucun `tabindex` positif n'a été introduit ; le bouton `overlay` du tiroir mobile reste `tabIndex={-1}` (agit comme zone de fermeture au clic, jamais comme arrêt de tabulation).

---

# Performance

- **Aucune nouvelle dépendance.** Les deux nouvelles primitives (`Container`, `Section`) sont des composants serveur triviaux (pas de `"use client"`), sans état, sans effet — un simple wrapper de classes. Elles n'ajoutent aucun JavaScript côté client.
- **`Navbar.tsx` reste le seul composant client du Layout** (`"use client"` déjà présent avant cette phase, pour le panier/le menu/le scroll) — aucun nouveau composant client n'a été introduit à côté. `Footer.tsx` reste un composant serveur.
- **Pas de sur-rendu ajouté** : les nouveaux `useEffect` (fermeture au changement de route, retour de focus) sont bornés par des dépendances précises (`[pathname]`, `[open]`), pas de recalcul à chaque rendu.
- **Pas de librairie d'icônes ajoutée** pour les deux icônes sociales du Footer : SVG inline, cohérent avec la convention déjà en place (Header, Admin) plutôt que d'introduire une dépendance pour deux pictogrammes.
- **Aucun scroll-listener ajouté** au Header pour un effet supplémentaire au scroll (voir section Header) — décision explicitement guidée par l'objectif de légèreté du Layout.

---

# Visuels à produire

Un seul besoin visuel identifié pour le Header et le Footer, conformément à l'instruction de ne pas utiliser de placeholder :

1. **Variante claire (fond blanc/neutre) du logo FabSystem, destinée aux fonds sombres.** Constat : `public/FabSystem-Logo.svg` est un wordmark en `fill="black"` (plus un motif en `pattern` probablement coloré pour le symbole) — il n'existe qu'une seule variante, prévue pour un fond clair. Le Footer défini par le CDC est sombre (`home/11-FOOTER.md` §4 : « utiliser une variante officielle adaptée au fond sombre **si elle existe** »). Faute d'une telle variante, cette phase a choisi une solution non destructive et réversible : le logo existant est posé tel quel sur un petit fond blanc arrondi à l'intérieur du Footer sombre (`bg-white` autour du `<Image>`), sans recolorer ni modifier le fichier source. **Ce visuel n'est cependant pas une tâche DALL·E** : le CDC interdit explicitement toute génération IA du logo (`home/01-HEADER-HERO.md` §18, `home/11-FOOTER.md` §4 — « interdit : générer une variante IA »). La vraie solution est qu'un asset officiel (fichier vectoriel blanc/inversé du même logo) soit fourni par Fabien depuis les sources de la marque, puis substitué au traitement actuel dans le Footer. À signaler avant toute prochaine itération visuelle du Footer.

Aucun autre visuel n'est requis par cette phase : le Hero (photographie, illustrations) appartient au contenu de la page Home, explicitement hors périmètre du Layout.

---

# Arbitrages

1. **Libellé « Les bases » retenu plutôt que « Apprendre » dans le groupe Footer « Explorer ».** `home/11-FOOTER.md` §2 liste littéralement « Apprendre » comme intitulé, alors que `00-CAHIER-DES-CHARGES-GLOBAL.md` §12, `home/00-HOME-ARCHITECTURE.md` et `home/01-HEADER-HERO.md` §9 utilisent tous « Les bases » pour désigner la même page (`/formations`). C'est une incohérence terminologique résiduelle entre deux documents CDC (le Footer semble conserver un intitulé de travail antérieur). MASTER-12 §134 est explicite : « un même concept utilise le même nom ». Choix retenu : « Les bases » dans le Footer, pour rester cohérent avec le Header et éviter qu'un même lien porte deux noms différents selon l'endroit de la page — signalé ici plutôt que traité silencieusement.
2. **Lien « Accès interne » (`/login`) conservé dans la ligne basse du Footer.** Ni exigé ni interdit explicitement par `11-FOOTER.md`. Il existait avant cette phase et constitue le seul point d'entrée découvrable vers l'authentification Admin (aucune autre page publique n'y renvoie). Le retirer aurait dégradé silencieusement l'accès de Fabien à `/dashboard` sans qu'aucune instruction ne le demande — contraire à l'esprit de « ne pas modifier le Dashboard » (l'accès au Dashboard fait implicitement partie de ce qui ne doit pas régresser). Conservé, en position discrète (texte gris clair, taille réduite), cohérent avec « informations secondaires » plutôt que mis en avant.
3. **Coordonnées (email) conservées dans le Footer, sous une forme minimale.** `11-FOOTER.md` §15 autorise mais ne rend pas obligatoires les coordonnées directes (« si cela améliore réellement l'usage »), et précise que leur présence exacte pourra être ajustée lors d'une preview finale. Choix retenu : garder l'email en texte simple sous la phrase de marque plutôt que de le supprimer entièrement ou de reproduire l'ancien bloc de CTA — compromis jugé conforme à « ne pas transformer le Footer en page Contact » tout en gardant un service réel déjà présent avant cette phase.
4. **Logo sur fond blanc dans le Footer sombre, plutôt qu'un filtre CSS d'inversion.** Une inversion de couleurs (`filter: invert()`) aurait permis d'afficher le texte noir en blanc sans toucher au fichier, mais aurait aussi inversé la teinte du symbole coloré du logo (probablement le jaune de la marque), produisant une couleur non maîtrisée et non validée — un risque plus grand qu'un simple fond clair autour du logo inchangé. Voir section Visuels à produire pour la solution définitive recommandée.
5. **Aucun composant de grille publique générique créé.** La mission demande d'« uniformiser... les grilles » mais aussi de ne pas refaire les pages. Les grilles réellement nécessaires (cartes Boutique, trois univers Home, familles Je confie sur Services...) sont trop spécifiques à leur contenu pour être anticipées sans l'inventer avant que la page correspondante soit conçue. Seuls `Container` et `Section`, génériques et déjà utiles au Header/Footer, ont été créés — cohérent avec « pas de sur-ingénierie » et « ne pas créer de composants qui ne seront pas utilisés immédiatement ».
6. **Validation responsive/accessibilité par revue de code et rendu HTML réel, pas par capture visuelle navigateur.** Aucun outil de test visuel (Playwright/Puppeteer) n'est installé dans ce dépôt. Un serveur de développement a été démarré et une requête réelle a confirmé la présence de tous les éléments de navigation attendus dans le HTML rendu, mais aucune vérification pixel (chevauchement, débordement visuel réel à un viewport donné) n'a été effectuée. Signalé explicitement plutôt que présenté comme une validation visuelle complète.

---

# Fin — UI-2-LAYOUT-PUBLIC / FabSystem
