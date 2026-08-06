# FabSystem Coding Standards

## Statut du document

- Date de reference: 2026-08-05
- Portee: standards obligatoires pour les prochains sprints

## Principes directeurs

1. Ne rien casser.
2. Preferer l'architecture la plus simple compatible avec le besoin reel.
3. Eviter les abstractions universelles prematurees.
4. Documenter avant de generaliser.
5. Garder la compatibilite avec la production existante.

## Regle de perimetre

Tant que le MVP n'est pas stabilise:

- on code le commerce numerique `BUY_NOW`
- on ne fait pas entrer `REQUEST_ONLY` dans le panier
- on ne modele pas pleinement les abonnements, le shipping, le stock, la formation ou le booking

Si un futur domaine n'est pas necessaire maintenant, on le documente au lieu de le coder.

## Standards Next.js

- App Router obligatoire pour toute nouvelle route
- Server Components par defaut
- `"use client"` uniquement en cas de vrai besoin interactif
- un route handler valide ses entrees et delegue a un service
- toute page ou route sensible a l'auth doit expliciter son comportement de cache
- ne pas transformer le dashboard actuel en espace client par opportunisme

## Standards React

- composants petits et centres sur une responsabilite
- separer affichage, orchestration et logique metier
- extraire les composants lourds avant de leur ajouter une nouvelle responsabilite
- accessibilite minimale obligatoire:
  - labels relies
  - navigation clavier
  - gestion du focus
  - messages d'etat

## Standards TypeScript

- `strict` reste la reference
- pas de `any` sans justification locale
- types de domaine explicites pour panier, commande, paiement et telechargement
- eviter les objets ad hoc repetes entre route, service et UI

## Standards Prisma

- evolutions additives uniquement tant que l'ancien domaine documents coexiste
- montants stockes en centimes entiers
- IDs externes indexables et uniques si necessaire
- snapshots immuables sur `Order` et `OrderItem`
- `User` = identite de connexion
- `Customer` = identite commerciale
- pas de `CustomerProfile` dans le MVP
- pas de modele `Product` rempli de dizaines de flags

### Noyau catalogue autorise

Le coeur catalogue MVP doit rester:

- `Product`
- `ProductPrice`
- `DigitalAsset`

Des tables de jointure minimales sont autorisees pour:

- rattacher des assets a un produit
- composer un bundle

## Standards API

- validation Zod cote serveur
- aucun montant client n'est fiable
- les reponses d'erreur sont stables et exploitables
- pas de logique de paiement critique directement dans la route
- tout endpoint sensible doit etre rate-limited avec une strategie compatible Vercel

## Standards Stripe

- un seul checkout MVP pour les produits `BUY_NOW`
- aucun produit `REQUEST_ONLY` dans la session Stripe
- `Order` creee avant confirmation de paiement
- webhook signe, idempotent et journalise
- effets critiques sortis du temps de reponse via `BackgroundJob`
- aucun secret dans logs ni metadata

## Standards de securite

- aucun fichier payant prive dans `/public`
- tout telechargement payant controle cote serveur
- cookies securises en production
- verifications de possession cote serveur pour l'espace client
- politique de rollback documentee avant toute migration commerce

## Standards de logs

- logs structures cote serveur
- pas de secret, mot de passe, token brut ou donnee carte
- journaliser les transitions critiques:
  - login
  - checkout
  - webhook
  - creation de droits
  - remboursement

## Standards de tests

### Minimum attendu

- test unitaire ou integration pour chaque service critique
- test d'idempotence webhook
- test de recalcul panier
- test de creation de commande
- test d'autorisation telechargement
- test de snapshots historiques

### Avant un merge commerce

Verifier:

- lint
- tests
- parcours manuel minimum
- coherence documentaire

## Standards de documentation

- toute decision stable va dans `docs/08-DECISIONS.md`
- toute evolution du modele va dans `docs/03-DATABASE.md`
- toute evolution du flux paiement va dans `docs/04-STRIPE.md`
- toute evolution du perimetre MVP va dans `docs/13-MVP-SCOPE.md`

## Definition d'une bonne solution

Une bonne solution pour FabSystem n'est pas la plus generique.

C'est une solution:

- lisible
- testable
- reversible
- compatible avec l'existant
- suffisamment solide pour vendre quelques produits numeriques sans impasse evidente
