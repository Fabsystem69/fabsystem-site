# UI-9A — Audit global complet avant finition

**Statut :** Audit uniquement — aucune correction de code, aucun commit (mission explicite).
**Méthode :** lecture des MASTER-00 à MASTER-12, des rapports UI-1 à UI-8, puis 5 revues de code en parallèle couvrant l'intégralité du périmètre demandé (site public, Services, Boutique, Les Bases, Outils, SaaS client, navigation, responsive, accessibilité, SEO, performance, contrôle rapide Admin), plus une vérification fonctionnelle du parcours moteur/dépendances.
**Portée non couverte en profondeur** (budget d'audit, à signaler honnêtement) : vérification visuelle réelle en navigateur (aucun outil de capture d'écran disponible dans cet environnement — l'analyse responsive/visuelle repose sur la lecture des classes Tailwind et de la structure JSX, pas sur un rendu observé) ; audit exhaustif champ par champ de tous les formulaires Admin (devis, factures, création produit).

---

# Synthèse

Le produit est dans un état globalement solide : aucun bug fonctionnel bloquant n'a été trouvé sur les deux parcours principaux (public et client), la chaîne de dépendances moteur (Énergie → Batterie → ... → obsolescence) fonctionne correctement de bout en bout, la table des noms d'accompagnement (Amarrage/Cap/Passerelle/Grand Large et déclinaisons Van/Camping-car) est 100 % conforme aux MASTERs partout dans le code, et les états vides principaux (aucun projet, aucun achat, catégorie Boutique vide) sont déjà rédigés en français clair et orientés action.

**Aucun problème P0 (bloquant/bug/sécurité) n'a été identifié.** C'est en soi un résultat positif à noter : les phases UI-1 à UI-8 ont construit une base fonctionnellement saine.

Le gisement de correction se concentre sur trois zones :

1. **L'identité éditoriale** (section 2 de la mission) : 9 occurrences réelles où "FabSystem" porte une action humaine (intervenir, accompagner, conseiller) qui devrait être portée par "Fabien" — concentrées sur les pages Services/Prestations, Home, Outils et Boutique, plus une incohérence de sujet à l'intérieur même de la page `/prestations`.
2. **Le SaaS client (UI-8)** : deux points d'ergonomie identifiés explicitement par la mission comme prioritaires — des identifiants techniques bruts (`energy.dailyConsumption`, `battery.usefulCapacity`) affichés tels quels à l'utilisateur, et deux champs de saisie texte libre (catalogue de protections, sections de câble) trop techniques pour un client non-électricien.
3. **Le visuel** : absence de photo humaine crédible de Fabien (la page "À propos" utilise une photo de matériel avec un texte alternatif mensonger `alt="Fabien Lages"`), Hero réutilisé 4 fois sans différenciation, univers Van/Camping-car sans photo sur la Home, et une iconographie emoji incohérente concentrée dans les modules Les Bases (absente du hub).

Rien dans cet audit ne remet en cause l'architecture technique ; toutes les corrections recommandées sont des ajustements de contenu, de copy ou de composant UI — cohérent avec la demande explicite de ne pas relancer une refonte.

---

# P0 — Bloquants

Aucun trouvé. Voir "Synthèse" ci-dessus.

---

# P1 — Corrections importantes

**Identité éditoriale (9 occurrences + 1 incohérence interne) :**
1. `components/services/TroisFacons.tsx:26` — *"FabSystem intervient et réalise l'intervention pour moi."* → doit être Fabien.
2. `components/services/TroisFacons.tsx:20` — *"FabSystem m'aide à préparer, vérifier et débloquer mon projet."* → doit être Fabien.
3. `components/home/Parcours.tsx:32` — *"Je préfère que FabSystem intervienne directement sur mon installation."* → doit être Fabien.
4. `components/services/Faq.tsx:13` — *"FabSystem intervient directement sur les installations électriques..."* → doit être Fabien.
5. `components/services/Faq.tsx:37` — *"FabSystem intervient principalement dans le Rhône..."* + *"contactez FabSystem"* → Fabien / "contactez-moi".
6. `components/services/Faq.tsx:41` — *"FabSystem intervient aussi bien sur des projets neufs..."* → doit être Fabien.
7. `components/services/OnFaitEnsemble.tsx:32` — *"...FabSystem vous accompagne là où **son** expertise vous est utile."* → l'expertise est celle de Fabien.
8. `components/home/Accompagnement.tsx:27 vs 30` — incohérence interne au même bloc : titre au "je" (Fabien, correct) puis corps en "FabSystem vous aide..." → harmoniser sur Fabien.
9. `components/outils/Accompagnement.tsx:17` — *"FabSystem peut vous accompagner à distance..."* → doit être Fabien.
10. `components/boutique/PasserelleAccompagnement.tsx:20` — *"...FabSystem peut prendre le relais avec vous."* → doit être Fabien.
11. **Incohérence de parcours "Je confie" sur une seule page** : `/prestations` attribue l'intervention à FabSystem en haut de page (`TroisFacons.tsx:26`) puis à Fabien au "je" en bas de la même page (`JeConfie.tsx:63`, `ServicesCtaFinal.tsx`) — un même visiteur lit deux discours différents en scrollant.
12. `components/lesbases/BonsGestes.tsx:58` — *"Le conseil de Volta"* : "conseil" personnifie Volta comme un conseiller humain (registre de Fabien), doit repasser en registre automatique ("Point de vigilance", "Rappel Volta").

**SaaS client (UI-8), point explicitement signalé par la mission :**
13. `app/mon-compte/projets/[projectId]/page.tsx:176-191` (section "Informations retenues") — les clés brutes du moteur (`energy.dailyConsumption`, `battery.usefulCapacity`, `energyBalance.global`...) sont affichées telles quelles, sans traduction — jargon d'implémentation visible par un client final. Voir section "SaaS client".
14. `components/customer/dashboard/engines/ProtectionModule.tsx` (catalogue `"fusible:10, fusible:16, ..."`) et `CableModule.tsx` (sections `"1.5,2.5,4,6,10,16,25"`) — champs texte libre à syntaxe imposée, silencieusement filtrés sans erreur en cas de faute de frappe (`parseCatalog`, `.filter(Number.isFinite)`). Signalé explicitement par la mission comme point prioritaire.
15. `lib/engines/errors.ts` + tous les `throw new ValidationError/DependencyError(...)` — messages d'erreur exclusivement en anglais, écrits pour des développeurs, transmis bruts jusqu'à l'UI (`EngineActionBar.tsx:42`). Ex. *"No 'energy.dailyConsumption' retained value found for this Project — run the Energy Engine before the Battery Engine"* visible par un client qui ouvre Batterie avant Énergie.
16. `components/customer/dashboard/engines/useEngineRun.ts` — les erreurs métier non bloquantes (`EngineResult.errors`, ex. "puissance non calculable pour tel appareil") sont calculées côté moteur mais jamais lues ni affichées côté client ; seul un message générique apparaît ("Certains appareils manquent de données"), sans dire lesquels.
17. `app/mon-compte/projets/[projectId]/page.tsx` — le bloc "Structure technique" (grille de 10 cartes) fait doublon avec les statuts déjà affichés dans les `<summary>` de chaque chaîne juste en dessous — même information répétée jusqu'à 3 fois, source de surcharge cognitive.
18. `components/customer/dashboard/engines/EnergyBalanceModule.tsx` — aucun texte n'explique que ce module n'a volontairement aucun champ de saisie (il agrège les autres) avant que l'utilisateur ouvre l'accordéon et découvre un bouton "Calculer" sans aucun formulaire, ce qui peut se lire comme une page cassée.
19. Statuts "À recalculer" affichés sans jamais indiquer la cause (quelle donnée modifiée en amont a déclenché l'obsolescence) — l'utilisateur sait qu'il doit recalculer mais pas pourquoi ni où regarder.
20. `app/mon-compte/projets/nouveau/page.tsx` — aucune vérification de la limite de 3 projets avant affichage du formulaire (elle n'existe que sur la liste) ; un client qui accède directement à l'URL découvre l'erreur (en anglais, voir #15) seulement après avoir rempli le formulaire.

**Visuel :**
21. `app/a-propos/page.tsx:31-40` — la photo utilisée avec `alt="Fabien Lages"` est en réalité `fab-bateau.png`, la même image utilisée ailleurs comme "installation électrique embarquée sur un bateau" — texte alternatif mensonger sur la page censée établir la crédibilité humaine.
22. `components/services/JeConfie.tsx:55-65` — le bloc "Fabien — FabSystem" (parcours le plus engageant commercialement) est entièrement textuel, sans aucune photo, alors que c'est la zone où la preuve humaine compte le plus.

**SEO :**
23. `/mon-compte/**`, `/connexion-client`, `/panier`, `/commande/merci` ne déclarent pas `robots: { index: false }` et ne sont pas listés dans `public/robots.txt` (seuls `/dashboard`, `/login`, `/sign/`, `/api/` le sont). Pas de fuite de données (ces pages redirigent si non authentifié) mais des URL privées/transactionnelles indexables sans valeur SEO.

---

# P2 — Polish

- Outils publics : aucun lien vers Les Bases ni Services depuis le shell commun (`CalculatorPageShell.tsx`) ; maillage borgne entre les 5 calculateurs (chacun ne renvoie que vers un seul autre) ; avertissements hétérogènes en forme (alertes colorées vs simple note de bas de page) ; formulaires Câble/Protection potentiellement longs sur mobile avec plusieurs lignes.
- Distinction "Calculer" (aperçu) vs "Utiliser pour mon projet" (rétention réelle) bien conçue au niveau composant mais jamais expliquée au premier contact — risque qu'un utilisateur pressé ne comprenne pas la portée du second bouton.
- `components/Navbar.tsx` — lien "Mon compte" en icône seule sur desktop (aria-label présent, donc accessible, mais MASTER-12 recommande texte+icône pour les fonctions essentielles côté client).
- `app/boutique/[slug]/page.tsx` — double appel à `getPublicProduct()` (dans `generateMetadata` et dans la page) sans `cache()` de React : 4 requêtes DB au lieu de 2 par rendu.
- `components/TestimonialsSection.tsx:13` — étoiles en `text-yellow-400`, contraste faible sur fond clair (un filet de sécurité texte `aria-label` existe déjà, donc non bloquant).
- Hero réutilisé à l'identique (`/hero-fabsystem.png`) sur Home, Prestations, Contact et Les Bases — effet "template", aucune identité visuelle propre par page.
- `app/a-propos/page.tsx` — trois cartes blanches/grises de structure strictement identique empilées (Expertise/Positionnement/Conclusion), contraire à MASTER-12 §21-22 ("pas une grille infinie de cartes").
- `components/home/TroisUnivers.tsx` — Van et Camping-car retombent sur une tuile noire unie faute de photo, alors que Bateau a une vraie photo : asymétrie visuelle entre les 3 univers présentés à parité.
- `/prestations` — page longue et dense (Hero + 3 façons + On fait ensemble + Je confie + Déroulement + Preuves + FAQ 9 questions + CTA), alternance de tons soutenue, nombreux blocs à bordure identique répétés (dérive légère vers l'effet dashboard).
- Emojis utilisés comme substituts d'icônes (classés B, à remplacer par une icône sobre) : `💡` (`app/boutique/[slug]/page.tsx:253`, `components/boutique/UsageEtAcces.tsx:38`), `⚠️` répété 3 fois à l'identique (`bases-12v`, `lire-schema`, `types-batteries` — corrigeable en un seul composant Alert réutilisé), `📏`/`🔶` (`bases-12v`).
- Répétition de blocs passerelle quasi identiques (Home → Les Bases → Boutique → Services) — sens différent à chaque fois mais composition visuelle trop similaire.
- Boutique : aucune preuve sociale propre (avis, extrait) contrairement à Home/Services qui ont une section Confiance dédiée.
- Les Bases : rupture de cohérence entre le hub (aucun emoji) et les 3 modules (plusieurs emojis comme icônes) — la rupture la plus visible du parcours pédagogique.
- Institutionnel limite : `app/a-propos/page.tsx:24`, `app/prestations/page.tsx:22,47` — "FabSystem accompagne/aide" en position de méta-description/hero, tolérable en positionnement général mais reste un accompagnement humain déguisé.
- Absence de tag visuel "Je fais seul" cohérent sur `/formations` et `/outils`, alors que la Boutique l'affiche en surtitre de Hero.
- Confidentialité (`app/confidentialite/page.tsx:28`) mentionne un "formulaire de demande de visio" qui n'a pas de route dédiée (`/visio` n'existe pas).

---

# P3 — Facultatif

- Différence de niveau de soin entre les outils Bilan/Autonomie (presets, export PDF) et Section câble/MPPT (plus sobres mais complets) — écart justifiable (cœur de funnel vs compléments techniques), pas urgent.
- Absence de contexte "à qui s'adresse cet outil" sur les 5 calculateurs — uniforme, pas un défaut isolé.
- `app/vcard/page.tsx:115` — libellé "Prestations" alors que le reste du site dit "Services" pour la même page.
- `app/vcard/page.tsx:100` — tag "Formation" (singulier) au lieu de "Les Bases".
- Ambiguïté de nommage interne (code, jamais visible utilisateur) entre "Passerelle" (composants de transition UX) et "Passerelle" (nom commercial du 3ᵉ palier d'accompagnement bateau).
- `components/services/Deroulement.tsx:15` / `Faq.tsx:21` — "FabSystem qualifie la demande" : registre administratif plutôt qu'action de coaching typée Fabien, limite acceptable.
- Burger mobile (focus trap, Escape, restitution du focus) : déjà bien fait, rien à corriger.
- Pas de retour explicite "vers le site public" depuis la coquille `/mon-compte` (seulement via déconnexion/logo absent du header client).
- Pages Admin sans `metadata` individuel (28 fichiers) — sans impact SEO réel (non indexées), cosmétique pour l'onglet navigateur.

---

# Identité FabSystem / Fabien / Volta

Règle rappelée (MASTER-00 §4) : FabSystem = entreprise/marque ("FabSystem propose...", "Les services FabSystem", "Votre espace FabSystem") ; Fabien = humain, sujet de toute action de conseil/intervention/accompagnement personnel ; Volta = automatisation logicielle, jamais personnifiée comme un conseiller humain.

**9 occurrences P1 + 1 incohérence de page + 3 occurrences P2** détaillées ci-dessus (sections P1/P2) où "FabSystem" porte une action humaine. Deux familles de cas :
- **Intervention terrain** ("FabSystem intervient...") : `TroisFacons.tsx` (×2), `Parcours.tsx` (Home), `Faq.tsx` (×3) — le motif le plus fréquent, concentré sur les pages Services.
- **Accompagnement/conseil** ("FabSystem vous accompagne/aide") : `OnFaitEnsemble.tsx`, `Accompagnement.tsx` (Home), `outils/Accompagnement.tsx`, `boutique/PasserelleAccompagnement.tsx`.

Volta : une seule occurrence problématique trouvée (`BonsGestes.tsx:58`, "Le conseil de Volta") — sur l'ensemble du site, Volta n'est mentionnée qu'à cet endroit en dehors des MASTERs eux-mêmes, ce qui est cohérent avec "ne pas construire Volta graphiquement" (déjà respecté), mais le mot "conseil" doit repasser en registre automatique/déterministe.

**Bons exemples à répliquer tels quels** (confirmant que le bon registre existe déjà dans le code, ce n'est pas une règle à inventer) : `app/a-propos/page.tsx:47` ("Fabien Lages intervient sur des systèmes électriques embarqués..."), `components/services/JeConfie.tsx` (l.16, 19, 63, "j'interviens personnellement"), `components/services/ServicesCtaFinal.tsx` (l.35, 56).

**Cohérence commerciale (parcours "Je fais seul / On fait ensemble / Je confie")** : ordre et libellés cohérents partout, triade "Préparer / Vérifier / Débloquer" identique mot pour mot entre Home et Services — aucune divergence trouvée en dehors de l'incohérence de sujet listée en P1 (#11).

**Noms d'accompagnement** : table vérifiée dans `lib/prestations-packs.ts:44-50` contre MASTER-00 §8 / MASTER-08 §67-70 — **conformité à 100 %**, aucune ancienne appellation ni divergence trouvée (Bateau : Amarrage/Cap/Passerelle/Grand Large ; Van : Départ/Itinéraire/Copilote/Roadbook ; Camping-car : Étape/Feuille de route/Relais/Carnet de route).

**Terminologie transverse** : "Les Bases" utilisé systématiquement côté visible (jamais "Formations" en libellé utilisateur) — cohérent. Seules exceptions : la page `/vcard` (P3, voir ci-dessus), hors parcours principal.

---

# Site public

Pages auditées : Home, Prestations, Boutique (hub + fiche produit), Formations/Les Bases (hub + 3 modules), Contact, À propos, mentions légales, confidentialité, connexion client, panier.

Points forts confirmés : pas de faux témoignage, pas de faux produit, empty states réels et honnêtes (Boutique catégorie Camping-car), Les Bases sans progression fictive ni pourcentage inventé, indispensables sans prix/marque inventés.

Problèmes identifiés (détaillés en P1/P2/P3 ci-dessus) : photo "À propos" mensongère (P1), Hero réutilisé 4 fois sans différenciation (P2), cartes répétitives sur À propos (P2), page `/prestations` dense avec forte alternance de tons (P2), mentions d'un formulaire "visio" inexistant en page confidentialité (P2).

---

# Services

`/prestations` concentre à elle seule 5 des 9 occurrences P1 d'identité éditoriale (`TroisFacons.tsx` ×2, `Faq.tsx` ×3) plus l'incohérence de sujet "Je confie" entre le haut et le bas de la même page (#11) — c'est la page qui nécessite le plus de relecture éditoriale de tout le site. Le bloc "Fabien — FabSystem" (`JeConfie.tsx`) manque de photo (P1, #22) alors qu'il porte la promesse la plus engageante commercialement. Densité de contenu élevée mais structure cohérente (P2).

---

# Boutique

Filtres univers, cartes produit, gestion de la possession déjà achetée et état vide Camping-car sont tous conformes et bien faits — aucun finding structurel. Corrections identifiées : emoji `💡` dissonant sur la fiche produit et `UsageEtAcces.tsx` (P2, classé B), absence de preuve sociale propre à la Boutique (P2), répétition de blocs passerelle visuellement similaires en provenance de Home/Les Bases (P2), texte "FabSystem peut prendre le relais" à corriger en Fabien (P1, #10).

---

# Les Bases

Hub, modules, quiz, bons gestes et indispensables sont cohérents et pédagogiquement solides, sans contenu inventé. Seul point de correction structurel : rupture de cohérence emoji entre le hub (aucun) et les 3 modules (plusieurs emojis utilisés comme icônes, notamment une grille de 4 emojis différents dans `lire-schema` — classé A, à remplacer intégralement) (P2). Le bloc "Le conseil de Volta" (`BonsGestes.tsx`) est le bon emplacement pour Volta à terme, mais le mot "conseil" doit être reformulé (P1, #12).

---

# Outils

5 pages auditées (section câble, bilan consommation, autonomie batterie, MPPT, AWG) — structure commune via `CalculatorPageShell`, cohérente sur les 5. Aucun lien vers Les Bases ni Services depuis aucun des 5 calculateurs (P2) ; maillage inter-outils borgne, chaque page ne renvoyant que vers un seul autre outil (P2) ; avertissements présents partout mais hétérogènes en forme visuelle (P2). Écart de soin réel mais justifiable entre Bilan/Autonomie (plus riches : presets, export PDF, transfert de données) et Section câble/MPPT (plus sobres, complets) (P3) — AWG est un outil de référence différent par nature, la comparaison ne s'applique pas.

---

# SaaS client

Voir le détail complet en P1 (#13 à #20). Résumé : la mécanique de fond (dépendances, obsolescence, ownership, retain vs preview) fonctionne correctement de bout en bout — aucun bug logique trouvé dans `lib/engines/runner.ts` ni `lib/services/project-dependencies.ts`. Les corrections nécessaires sont uniquement côté présentation :
- traduire les clés brutes affichées dans "Informations retenues" ;
- remplacer les deux champs texte libre (catalogue de protections, sections de câble) par des composants structurés (liste de lignes répétées avec `<select>`/`<input number>`, ou chips de sections prédéfinies) sans toucher aux moteurs métier, qui continueront de recevoir exactement les mêmes types de données ;
- traduire ou remplacer les messages d'erreur moteur anglais avant affichage ;
- afficher les erreurs métier non bloquantes (`EngineResult.errors`) déjà calculées mais actuellement ignorées côté client ;
- supprimer la redondance entre le bloc "Structure technique" et les résumés `<summary>` des deux chaînes ;
- expliquer que le Bilan énergétique n'a pas de formulaire propre ;
- indiquer la cause d'un passage à "À recalculer" ;
- vérifier la limite de 3 projets avant d'afficher le formulaire de création directe.

L'ordre des moteurs (Énergie→Batterie→Alternateur→Solaire→Chargeur→Bilan, puis Circuit→Câble→Protection→Schéma) est jugé pédagogiquement correct et n'a pas besoin d'être changé.

---

# Navigation

Aucun lien mort, aucun doublon, aucune ancre obsolète trouvés (Header, Footer, `DashboardNav` vérifiés contre les routes réelles). Cohérence de funnel confirmée (Boutique → achat direct, Outils → gratuit, Prestations → choix des 3 voies). Deux points mineurs : lien "Mon compte" en icône seule sur desktop (P2) et absence de retour explicite vers le site public depuis la coquille `/mon-compte` (P3).

---

# Responsive

Analyse par lecture des classes Tailwind (pas de rendu navigateur disponible dans cet environnement). Home Hero et formulaire de checkout bien structurés (CTA `flex-col`→`sm:flex-row`, champs `w-full`). Aucun débordement ni tableau brut problématique détecté hors Admin. Point à vérifier manuellement lors de la finition : fiche produit Boutique (zone prix + CTA, non vérifiée visuellement) et longueur des formulaires Câble/Protection SaaS sur mobile avec plusieurs lignes ajoutées (P2).

---

# Accessibilité

Un seul H1 par page confirmé sur les pages principales. Modales conformes (`role="dialog"` + `aria-modal`). Aucun bouton icon-only sans `aria-label` détecté sur Admin. Point réel identifié : contraste des étoiles jaunes (`TestimonialsSection.tsx`) sur fond clair, atténué par un `aria-label` texte de secours déjà présent (P2). Audit exhaustif de tous les formulaires métier (devis, facture) non réalisé faute de budget — à compléter si un audit formulaires dédié n'existe pas déjà.

---

# SEO

Trou réel identifié : `/mon-compte/**`, `/connexion-client`, `/panier`, `/commande/merci` ne sont ni `noindex` ni listés dans `robots.txt`, contrairement à `/dashboard` et `/login` qui sont bien protégés (P1, #23). Pas de fuite de données (ces pages sont protégées par redirection d'authentification), mais des URL privées/transactionnelles indexables sans valeur SEO. `app/sitemap.ts` cohérent, ne référence que des pages publiques réelles. Pages Admin sans `metadata` individuel — cosmétique, sans impact (P3).

---

# Performance

Un point réel : double appel à `getPublicProduct()` sur la fiche Boutique (`generateMetadata` + composant de page) sans déduplication via `cache()` de React — 4 requêtes DB au lieu de 2 par rendu (P2). Usage de `force-dynamic` systématiquement justifié par commentaire explicite (catalogue lu en base à chaque requête). `<img>` bruts trouvés seulement dans 3 endroits légitimes (export PDF/impression, `next/image` non applicable). Pas d'anomalie flagrante détectée sur les 64 fichiers `"use client"` du dépôt sans revue composant par composant plus poussée (hors budget de cet audit).

---

# Visuels à produire

Aucune image générée, liste uniquement :

1. **Portrait réel de Fabien en situation professionnelle** — pages À propos (remplace la photo mensongère actuelle) et Services/"Je confie" (bloc actuellement 100 % textuel). Format : 4:3 ou 3:4, cohérent avec le traitement photo déjà en place (bordure fine, `rounded-2xl`).
2. **Photo Van** — Home (`TroisUnivers`, actuellement tuile noire) et Services. Format 4:3, cadrage installation électrique van.
3. **Photo Camping-car** — même besoin que Van, Home/Services/Boutique.
4. **Photo Boutique dédiée** — le Hero Boutique réutilise une photo de chantier générique (`/preuves/cable.png`) ; un visuel montrant réellement les guides/ebooks renforcerait la crédibilité éditoriale.
5. **Différenciation des Hero réutilisés** — au minimum une photo distincte pour Contact et Les Bases plutôt que le fichier de la Home (`/hero-fabsystem.png` utilisé 4 fois à l'identique).

---

# Volta — emplacements futurs

**Pertinents plus tard** (sans les construire maintenant) :
- `components/lesbases/BonsGestes.tsx` — "Le conseil de Volta" existe déjà en texte seul, bon candidat pour une illustration sobre à côté du texte une fois le registre corrigé.
- `components/boutique/UsageEtAcces.tsx` — le bloc "💡 Le saviez-vous ?" (explication ponctuelle sur l'espace client) est un bon candidat, remplacerait aussi l'emoji signalé.
- `app/connexion-client/page.tsx` — état de confirmation "lien envoyé", pour rassurer un utilisateur peu technophile sur le principe du lien magique.
- Empty states (panier vide, futur empty state Camping-car en Boutique) — emplacements typiques où Volta a un rôle défini (expliquer la prochaine action).

**À éviter absolument** :
- Hero de la Home, de Prestations, de Contact, des Les Bases (ne doit jamais concurrencer le message principal ni remplacer Fabien).
- Le bloc "Fabien — FabSystem" de `JeConfie.tsx` — zone où l'expertise humaine doit dominer sans ambiguïté.
- Chaque carte produit Boutique, chaque CTA principal — deviendrait un outil d'upsell déguisé.
- La FAQ Services — contenu déjà autosuffisant.

---

# Cohérence éditoriale

Voir "Identité FabSystem / Fabien / Volta" ci-dessus pour le détail complet. Point de synthèse additionnel : la terminologie transverse ("Les Bases", "Services", "Accompagnement", "Projet", "Installation", "Diagnostic") est cohérente sur l'ensemble du parcours principal ; les seules divergences trouvées (P3) sont sur la page `/vcard`, hors parcours principal, et n'affectent donc pas l'expérience du site lui-même.

---

# Parcours utilisateur

**Parcours PUBLIC** (Accueil → Services → Boutique/Visio/Outils) : vérifié réellement dans le code, aucune rupture trouvée. Aucune route `/visio` dédiée n'existe — l'offre visio est vendue comme produit via `/boutique`, cohérent avec le reste du code (mais la page confidentialité mentionne un "formulaire de demande de visio" qui n'existe pas, P2).

**Parcours CLIENT** (Connexion → Dashboard → Création Project → moteur → Calculer → Retenir → recalcul dépendant) : vérifié réellement dans le code jusqu'au niveau de la logique de dépendances — le mécanisme fonctionne correctement (une nouvelle valeur retenue déclenche bien `markDependentsObsolete`, qui marque les dépendants `OBSOLETE` si l'edge existe déjà). Aucun bug logique trouvé. Les points d'amélioration de ce parcours sont uniquement des questions de clarté du message à l'utilisateur, déjà détaillées en P1 (#13-#20), pas des ruptures fonctionnelles.

---

# Recommandation de regroupement UI-9 FINAL

Plutôt qu'une liste de micro-phases, ces corrections se regroupent naturellement en **4 lots cohérents**, exécutables indépendamment :

## Lot 1 — Relecture éditoriale FabSystem / Fabien / Volta (le plus urgent, le plus rapide)
Corriger les 9 occurrences P1 + l'incohérence "Je confie" + le "conseil de Volta" (#1 à #12). Purement du texte, aucun composant à modifier, aucun risque de régression technique. Peut être traité en une seule passe de relecture ciblée par grep sur "FabSystem" + verbe d'action humaine.

## Lot 2 — Finition SaaS client (le plus gros, le plus attendu par la mission)
Les 8 points UI-8 (#13 à #20) : traduction des clés retenues, remplacement des deux champs texte libre par des composants structurés (sans toucher aux moteurs), traduction/affichage des erreurs moteur, suppression de la redondance "Structure technique", clarification du Bilan énergétique et de la cause "À recalculer", garde-fou sur la limite de 3 projets. C'est le lot avec le plus d'impact utilisateur réel puisque c'est le produit payant/central du SaaS.

## Lot 3 — Crédibilité visuelle et humaine
Photo réelle de Fabien (remplace l'`alt` mensonger sur À propos, comble le vide sur `JeConfie.tsx`), photos Van/Camping-car, différenciation des Hero réutilisés, photo Boutique dédiée. Nécessite une production photo réelle en amont (aucune génération d'image) — à planifier en parallèle des lots 1/2 pendant qu'ils avancent, puis intégrer une fois les visuels disponibles.

## Lot 4 — Polish technique transverse
SEO (`noindex` sur les zones privées), performance (`cache()` sur la fiche produit), cohérence emoji (harmoniser `⚠️`/`💡` en composants sobres, remplacer la grille d'emojis de `lire-schema`), petits ajustements de navigation (lien retour SaaS→public, libellé "Mon compte"). Lot de fond, sans urgence commerciale, à faire en une passe technique groupée plutôt qu'en tickets séparés.

Ordre conseillé : Lot 1 puis Lot 2 en priorité (impact direct sur la conversion et sur le produit payant), Lot 3 dès que les photos sont disponibles, Lot 4 en tâche de fond.

Puis arrêter. Aucun commit.
