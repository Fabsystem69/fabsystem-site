# FabSystem Vision

## Statut du document

- Date de reference: 2026-08-05
- Statut: vision figee pour le demarrage du Sprint 0
- Portee: cible court terme realiste, compatible avec la production actuelle

## Situation actuelle

FabSystem est deja en production avec:

- un site vitrine Next.js 16
- des formulaires d'acquisition et de contact
- un dashboard interne protege
- une gestion de clients, devis, factures et remises
- un tunnel Stripe existant pour un seul ebook

Le site fonctionne. La priorite absolue est de ne rien casser.

## Vision retenue

FabSystem ne va pas devenir tout de suite une plateforme universelle.

La prochaine etape est un MVP commerce numerique simple et robuste capable de vendre:

- des ebooks
- des packs d'ebooks
- des fichiers numeriques complementaires

avec:

- un catalogue
- un panier multi-produits
- Stripe Checkout
- des commandes
- des telechargements securises
- un historique d'achats
- un espace client minimal
- une administration minimale du catalogue

## Perimetre volontairement exclu du MVP

Les sujets suivants ne doivent pas etre modelises completement maintenant:

- abonnements
- formations
- produits physiques
- stock
- expedition
- creneaux de reservation
- marketplace
- multi-vendeur
- fiscalite internationale complexe

Ils doivent etre documentes comme extensions futures, rien de plus.

## Frontiere metier officielle

FabSystem adopte des maintenant une distinction simple.

### `BUY_NOW`

Produit ajoutable directement au panier et payable sans intervention humaine.

Dans le MVP:

- `EBOOK`
- `DIGITAL_DOWNLOAD`
- `BUNDLE`

### `REQUEST_ONLY`

Offre qui demande un contact, une qualification, un devis ou une reservation avant paiement.

Exemples:

- diagnostic personnalise
- prestation sur site
- accompagnement complexe
- installation physique

Ces offres restent sur les parcours actuels de contact, devis ou reservation.

Elles n'entrent pas dans le panier MVP.

## Pourquoi cette vision est coherente

Cette vision est realiste pour une petite structure car elle:

- capitalise sur le tunnel ebook deja en place
- ajoute le minimum de modele necessaire pour vendre plusieurs produits numeriques
- evite d'introduire trop tot des contraintes de stock, shipping, booking ou abonnement
- garde les devis et factures existants intacts
- laisse de la place a des extensions futures sans imposer leur complexite aujourd'hui

## Principes non negociables

1. Zero regression sur les parcours existants.
2. Migration par sprints deployables et validables.
3. Compatibilite avec les tables et routes actuelles.
4. Snapshots immuables pour les commandes et documents.
5. Stripe comme processeur de paiement, pas comme source de verite metier.
6. Operations critiques durables et rejouables.

## Architecture produit cible a court terme

Le noyau MVP attendu est le suivant:

- `Product`: fiche catalogue commune
- `ProductPrice`: prix courant et historique
- `DigitalAsset`: fichier livrable
- `Cart`: etat temporaire avant achat
- `Order`: achat finalise
- `Payment`: etat local du paiement Stripe
- `DownloadGrant`: droit de telecharger un asset

## Ce que le MVP doit prouver

Le MVP sera considere reussi s'il permet de:

1. vendre plusieurs produits numeriques dans un seul checkout Stripe
2. enregistrer une commande locale fiable avant et apres paiement
3. livrer les fichiers sans les exposer dans `/public`
4. laisser un client retrouver ses achats dans un espace minimal
5. generer plus tard une facture sans recalculer depuis le catalogue courant

## Ce que le MVP ne doit pas pretendre resoudre

Le MVP ne doit pas pretendre offrir des reponses generiques pour:

- la logistique physique
- la gestion de stock
- la pedagogie de formations
- les parcours de prestation complexes
- les abonnements recurrents

Chaque domaine devra etre traite plus tard avec ses propres regles.

## Vision long terme

A plus long terme, FabSystem pourra ajouter:

- formations avec controle d'acces
- prestations standardisees avec reservation
- prestations complexes `REQUEST_ONLY`
- produits physiques avec expedition
- abonnements avec Stripe Billing

Mais le principe reste le meme:

- ajouter ces domaines progressivement
- sans reecriture brutale
- sans deformer le MVP numerique
- sans casser les documents existants

## Conclusion

La vision est donc volontairement asymetrique:

- simple et executable a court terme
- compatible avec l'existant
- extensible plus tard
- sans promesse trompeuse de panier universel immediat
