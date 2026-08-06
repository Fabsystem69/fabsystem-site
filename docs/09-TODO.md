# FabSystem TODO

## Statut du document

- Date de reference: 2026-08-05
- Usage: backlog priorise du MVP commerce numerique

## Bloc 0 - Stabilisation et decisions finales

- [ ] Corriger les erreurs `eslint` actuelles
- [ ] Completer `.env.example` avec toutes les variables observees dans le code
- [ ] Resoudre l'incoherence `AUTH_ADMIN_EMAIL` vs `ADMIN_EMAIL`
- [x] Stabiliser le workflow Prisma local avec `fabsystem_dev` et `fabsystem_shadow`
- [ ] Documenter le flux ebook actuel comme `LEGACY`
- [ ] Figer la decision Supabase Storage
- [ ] Choisir les variables Supabase cibles
- [ ] Preparer la securite des telechargements futurs
- [ ] Definir les snapshots minimums necessaires pour commandes et factures
- [ ] Ajouter les tests indispensables avant evolution du schema

## Bloc 1 - Supabase Storage foundation

- [ ] Documenter la configuration serveur Supabase
- [ ] Documenter le bucket prive cible
- [ ] Documenter le helper serveur de signed URL
- [ ] Interdire Vercel Blob pour les nouveaux assets commerce

## Bloc 2 - Catalogue numerique propre

- [x] Ajouter un seed local idempotent pour un premier ebook de developpement
- [ ] Documenter precisement les champs MVP de `Product`
- [ ] Documenter precisement les champs MVP de `ProductPrice`
- [ ] Documenter precisement les champs MVP de `DigitalAsset`
- [ ] Definir la strategie de publication `DRAFT` / `ACTIVE` / `ARCHIVED`
- [ ] Definir la composition d'un bundle
- [ ] Definir l'administration minimale du catalogue

## Bloc 3 - Panier numerique

- [ ] Definir la persistance du panier invite
- [ ] Definir la persistance du panier connecte
- [ ] Verifier les regles d'incompatibilite `BUY_NOW` / `REQUEST_ONLY`
- [ ] Definir la regle de quantite pour les ebooks
- [ ] Definir le recalcul serveur des montants
- [ ] Definir le resume de commande

## Bloc 4 - Stripe generique

- [ ] Definir `Order`
- [ ] Definir `OrderItem`
- [ ] Definir `Payment`
- [ ] Definir la creation de `Order` avant Stripe Checkout
- [ ] Definir `StripeEvent`
- [ ] Definir `BackgroundJob`
- [ ] Definir les tests d'idempotence webhook

## Bloc 5 - DownloadGrant

- [ ] Definir `DownloadGrant`
- [ ] Definir la verification serveur avant telechargement
- [ ] Definir les signed URLs Supabase a duree courte
- [ ] Definir la politique de rejeu email et fulfillment
- [ ] Definir la revocation en cas de remboursement

## Bloc 6 - Migration / abandon ancien ebook

- [ ] Desactiver l'ancien flux comme chemin principal
- [ ] Basculer l'ebook actuel dans le nouveau systeme
- [ ] Conserver les anciennes routes uniquement si necessaire pour les anciens acheteurs
- [ ] Preparer la suppression des variables legacy inutiles
- [ ] Preparer la suppression des scripts legacy

## Bloc futur - Espace client, facturation et promotions

- [ ] Definir `User`
- [ ] Definir le lien `Customer` <-> `User`
- [ ] Definir le parcours de creation de compte
- [ ] Definir le rattachement securise des achats invites
- [ ] Definir les pages commandes et telechargements
- [ ] Definir le lien entre `Order` et `Invoice`
- [ ] Definir les snapshots facture issus de la commande
- [ ] Definir la synchronisation remboursement Stripe -> statuts locaux
- [ ] Definir la politique de revocation des droits
- [ ] Definir les codes promotionnels
- [ ] Definir les prix promotionnels
- [ ] Definir les regles anti-cumul
- [ ] Definir les cas limites des bundles

## Bloc futur - Hors MVP

- [ ] Abonnements
- [ ] Produits physiques
- [ ] Formations
- [ ] Reservations
- [ ] Prestations standardisees
- [ ] Evolution du domaine `REQUEST_ONLY`

## Regle de priorisation

On ne commence pas un bloc si:

- le bloc precedent n'est pas cadre
- la documentation n'est pas coherente
- les risques de regression ne sont pas compris
