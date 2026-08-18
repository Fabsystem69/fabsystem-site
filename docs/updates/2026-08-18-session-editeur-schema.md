# Suivi des mises à jour — session du 17-18 août 2026

Récapitulatif de tout ce qui a été fait sur l'éditeur de schéma électrique et le catalogue de composants pendant cette session. Organisé par thème, pas par ordre chronologique.

## Statut au moment de la rédaction

- Tout ce qui est listé jusqu'à la section **"Commercial"** incluse a été **commit et poussé**.
- Tout ce qui suit (**"Ménage éditeur"**, **"Zones épinglables"**, **"Coaching 30 min"**) est fait localement, testé (typecheck + 921 tests), mais **pas encore poussé** — en attente de feu vert.
- **Action en attente** : la migration Prisma + le produit "Coaching 30 min" ont été créés en base **locale uniquement**. Il faut encore les appliquer en **production** avant que le pack coaching soit réellement achetable en ligne.

---

## 1. Sécurité & anti-abus

- Rate limiting migré vers Upstash Redis (les compteurs en mémoire ne survivaient pas au serverless Vercel).
- Alertes email + push en cas d'abus détecté et à chaque vente.

## 2. Freemium v2.1 — éditeur de schéma

- Palier gratuit : 3 consommateurs max par projet.
- Déblocage payant : 9,90€ / 60 jours, par projet, checkout Stripe dédié.
- Code de réduction ebook/coaching généré automatiquement à l'achat.
- Codes promo communautaires (7 jours, compte entier), gérables depuis l'admin.
- Code `BETA_TESTEUR` créé (200 utilisations, expire le 1er septembre 2026, 7 jours d'accès à l'activation).
- Emails de relance avant expiration (ton différent selon déblocage payant vs essai gratuit).

## 3. Compte client & authentification

- Fiche profil éditable : prénom/nom, téléphone, adresse, véhicule, niveau en électricité (pour cibler le mailing).
- Remplacement du lien magique par un login classique email + mot de passe (retour utilisateur : "pas très conventionnel, les gens ne comprennent pas") — le lien magique est réutilisé comme mécanisme de définition/réinitialisation de mot de passe.

## 4. UX éditeur — vagues successives

- Correction du bug de placement hors zone visible.
- Description en langage courant sur chaque composant (bibliothèque + panneau propriétés).
- Recherche élargie : synonymes de marque/modèle (BMV → shunt, onduleur → inverter...).
- Détection d'un branchement +/− direct (court-circuit probable) avec câble rouge en pointillés.
- Couleur des bornes corrigée : seules les bornes réellement polarisées gardent une couleur fixe rouge/noir ; les autres prennent la couleur du câble branché.
- Bug shunt corrigé (les deux bornes étaient à tort marquées positives).
- Sous-catégories dans la bibliothèque (Shunts, Écrans de contrôle, Coupe-batterie & BatteryProtect...).
- Ajout d'un composant par glisser-déposer ou clic simple ; sélecteur de marque/modèle systématique avant placement pour les composants qui en ont.
- Suppression du bandeau de propriétés permanent → popup ouverte au double-clic sur un composant ou un câble.
- Widget Volta ("À vérifier") toujours visible en bas à droite, avec compteur, informations projet, et recentrage automatique sur l'élément au clic.
- Zoom vignette (×1 à ×5) pour la famille batterie, les boîtiers (chargeurs/régulateurs/convertisseurs) et le tableau de distribution.
- Boutons rapides sur la vignette sélectionnée : info, rotation, zoom +/−.
- Sursaut visuel quand deux câbles non reliés se croisent (pour ne pas les confondre avec une épissure).
- Câbles à plusieurs points de coude (ajout/suppression individuel), plus seulement un point unique.
- Insertion sur câble existant élargie (fusible, disjoncteur, interrupteur, coupe-batterie, relais, busbar, épissure) avec surbrillance du câble pendant le glisser.
- Nouveaux composants : Relais, interrupteur 3 positions, Épissure, platine de fusibles avec variante +/−.
- Busbar revu : toutes les bornes sur une même face, plus de borne "IN" dédiée (toutes équivalentes).
- Champ "Isolation" sur le chargeur DC/DC (isolé/non isolé) — le Victron Orion XS est réglé par défaut sur non isolé (masse commune, 3 bornes IN/GND/OUT) suite à vérification du produit réel.
- GX Touch 70 : une seule borne de communication (pas de +/− à câbler).
- Clic droit désactivé sur le canvas (menu contextuel du navigateur inutile ici).

## 5. Catalogue composants & marques

- Nouvelles marques : EcoWorthy, Creabest, Sunology, Cristec, EPEVER, Énergie Mobile.
- Gamme Victron élargie : batteries AGM/GEL/Lead Carbon/Lithium SuperPack/NG (dont variante 24V), GX (Cerbo GX, Color Control GX, GX Touch 70), Blue Smart IP67, Phoenix Inverter Smart 1600W, gamme MultiPlus étendue.
- Voltinov ajouté puis retiré (pas de site officiel, donc pas de visuel disponible).
- Plus de 50 visuels produit récupérés, détourés/recadrés et vérifiés un par un contre leur fiche produit réelle (plusieurs erreurs de correspondance détectées et corrigées en cours de route, ex. Orion XS, chargeur DC-DC Cristec).
- Quand une seule photo existe pour toute une gamme (EcoWorthy, Victron, Sunology panneaux), elle est réutilisée sur toutes les puissances plutôt que de laisser certaines sans icône.

## 6. Commercial

- Code promo `BETA_TESTEUR` (voir section 2).

---

## Ménage éditeur *(pas encore poussé)*

- Suppression de l'option "Organiser" (tri automatique du schéma, jugée chaotique et inutile) — code mort retiré.
- Recalcul en masse des sections de câble et calibres de fusible : ne peut plus réduire une valeur surdimensionnée que d'un cran par recalcul (ex. 6mm² → 4mm² max, jamais plus bas d'un coup) ; augmenter reste sans limite. Toujours basé sur le consommateur en aval.
- Les deux boutons de recalcul déplacés du menu Fichier vers le widget Volta (leur place naturelle, liée à la vérification du schéma).

## Zones épinglables *(pas encore poussé)*

- Bouton 🔒/🔓 sur une zone sélectionnée pour bloquer déplacement et redimensionnement accidentels.
- Cadenas visible en permanence sur une zone verrouillée, même non sélectionnée.

## Coaching 30 min — 59€ *(pas encore poussé, migration prod en attente)*

- Nouveau produit : créneau de conseil ponctuel (30 min, visio ou téléphone), 59€, checkout Stripe dédié séparé de la boutique classique.
- Popup "Besoin d'un coup de main ?" déclenché par deux signaux :
  - inactivité de 90 secondes ou plus alors que le schéma a du contenu et des points "À vérifier" non résolus ;
  - 3 annulations d'affilée du sélecteur de marque/modèle sans rien choisir (signal d'hésitation).
- Un seul affichage par session ; si refusé, silence pendant 7 jours (mémorisé localement).
- Aucune réservation de créneau automatique : la vente déclenche l'alerte email/push déjà existante pour toute commande payée, à recontacter manuellement.

---

## Décisions produit en attente pour la v2.2

- **Composants créés par les utilisateurs** : plan détaillé discuté (voir échange du 18/08), pas commencé. Décisions à trancher avant de coder : composants privés par compte vs bibliothèque communautaire partagée ; fonctionnalité gratuite ou réservée aux comptes débloqués ; upload d'icône libre vs choix dans une liste prédéfinie.
