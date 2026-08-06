# FabSystem Glossary

## Statut du document

- Date de reference: 2026-08-05
- Portee: definitions communes pour les prochains sprints

## `BUY_NOW`

Produit payable immediatement via le panier et Stripe Checkout.

Dans le MVP:

- ebook
- bundle d'ebooks
- telechargement numerique

## `REQUEST_ONLY`

Offre qui ne passe pas par le panier MVP.

Elle necessite:

- contact
- qualification
- devis
- reservation

## `Product`

Fiche catalogue commune contenant les informations partagees par tous les produits du MVP.

## `ProductPrice`

Prix actif ou historique d'un produit.

Il permet de ne pas ecraser les anciennes commandes.

## `DigitalAsset`

Fichier numerique livrable apres paiement.

Exemples:

- PDF
- ZIP
- fichier bonus

## `Bundle`

Produit de type `BUNDLE` donnant acces a plusieurs produits numeriques ou assets.

## `Cart`

Etat temporaire avant paiement.

Il ne constitue pas une vente.

## `Order`

Source de verite commerciale d'un achat finalise.

Une `Order` n'est ni un devis ni une facture.

## `OrderItem`

Ligne immuable d'une commande.

Elle contient le snapshot du produit et du prix au moment de l'achat.

## `Payment`

Representation locale de l'etat du paiement Stripe.

## `DownloadGrant`

Droit effectif de telecharger un asset.

Sans `DownloadGrant`, pas d'acces prive.

## `Quote`

Proposition commerciale existante du domaine documents.

## `Invoice`

Document comptable existant ou futur issu d'une commande.

## `Snapshot`

Copie immuable des donnees au moment d'un evenement critique.

Exemples:

- client sur une commande
- produit et prix sur un `OrderItem`
- lignes d'une facture

## `StripeEvent`

Evenement webhook Stripe stocke localement pour idempotence, audit et rejeu.

## `BackgroundJob`

Travail durable a executer hors du temps de reponse HTTP.

Exemples:

- creer des `DownloadGrant`
- envoyer un email transactionnel

## `Guest order`

Commande passee sans compte utilisateur preexistant.

Elle appartient quand meme a un `Customer`.

## `Claim flow`

Procedure verifiee permettant de rattacher des achats invites a un nouveau `User`.
