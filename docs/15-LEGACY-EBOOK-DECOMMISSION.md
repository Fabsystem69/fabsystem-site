# FabSystem Legacy Ebook Decommission

## Statut du document

- Date de reference: 2026-08-05
- Portee: plan de sortie propre de l'ancien systeme ebook

## Perimetre legacy

Le systeme ebook legacy inclut notamment:

- `EbookOrder`
- `/api/ebook/checkout`
- `/api/ebook/download`
- `/ebook/acces/[token]`
- Vercel Blob
- `STRIPE_PRICE_ID_EBOOK`
- `EBOOK_ACCESS_TOKEN_SECRET`
- les scripts specifiques ebook

## Regle immediate

Ce systeme peut rester temporairement dans le code et en production.

Mais:

- il ne doit plus etre etendu
- il ne doit plus etre pris comme reference d'architecture
- il doit etre remplace progressivement par le nouveau moteur commerce

## Phase A - Maintenant

- documenter comme legacy
- ne plus l'etendre
- ne plus construire dessus

## Phase B - Apres creation du nouveau catalogue

- creer les nouveaux produits numeriques
- uploader les fichiers dans Supabase Storage
- connecter les assets a `DigitalAsset`

## Phase C - Apres validation du nouveau paiement

- desactiver l'ancien bouton d'achat ebook
- rediriger vers la nouvelle boutique
- conserver les anciennes routes uniquement si necessaire pour les anciens acheteurs

## Phase D - Apres periode de transition

- supprimer ou archiver les routes legacy
- supprimer les variables legacy inutiles
- supprimer les scripts legacy
- supprimer la dependance Vercel Blob si elle n'est plus utilisee ailleurs

## Conditions de sortie

Le legacy ne doit etre retire qu'une fois:

- le nouveau checkout numerique stable
- les nouveaux telechargements prives operationnels
- le support client des anciens acheteurs clarifie
- la periode de coexistence terminee
