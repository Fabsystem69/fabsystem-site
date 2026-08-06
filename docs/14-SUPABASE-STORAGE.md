# FabSystem Supabase Storage

## Statut du document

- Date de reference: 2026-08-05
- Portee: provider cible pour les nouveaux assets numeriques du commerce MVP

## Decision actee

Supabase Storage devient le provider cible pour:

- ebooks
- bundles numeriques
- fichiers telechargeables complementaires

Le flux ebook historique sur Vercel Blob reste `LEGACY` uniquement.

## Regles cibles

- bucket prive obligatoire
- aucun asset prive dans `/public`
- aucun lien permanent public
- signed URLs temporaires
- generation cote serveur uniquement
- verification obligatoire de `DownloadGrant` avant emission d'un lien

## Bucket cible

Nom documentaire initial:

- `SUPABASE_STORAGE_BUCKET_EBOOKS`

Usage:

- ebooks
- bonus numeriques
- packs et fichiers derives du MVP numerique

## Variables d'environnement cibles

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_EBOOKS`

### Regles de securite

- `SUPABASE_SERVICE_ROLE_KEY` est strictement serveur
- ne jamais l'exposer au client
- ne pas utiliser `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour ce flux prive
- la signed URL est creee cote serveur seulement

## Helper serveur attendu

Le helper minimal cible vit cote serveur uniquement, par exemple:

- `lib/server/supabase-storage.ts`

Regle d'import:

- l'application importe uniquement `lib/server/supabase-storage.ts`
- `lib/supabase-storage.ts` reste un module interne de logique pure pour les tests
- ne jamais importer `lib/supabase-storage.ts` dans un composant client
- aucune cle Supabase de ce flux ne doit etre exposee via `NEXT_PUBLIC_*`

Fonction de reference:

- `createPrivateAssetSignedUrl(path: string, expiresInSeconds?: number)`

Regles du helper:

- refuser un path vide
- refuser un path commencant par `/`
- utiliser `SUPABASE_STORAGE_BUCKET_EBOOKS`
- expiration par defaut: 300 secondes
- expiration maximale: 600 secondes
- lever une erreur explicite si Supabase retourne une erreur

## Modele `DigitalAsset`

Champs cibles recommandes:

- `id`
- `provider = SUPABASE`
- `bucket`
- `path`
- `filename`
- `contentType`
- `sizeBytes`
- `version`
- `status`
- `createdAt`
- `updatedAt`

## Flux cible

1. Le client est connecte ou dispose d'un lien autorise.
2. Le serveur verifie `DownloadGrant`.
3. Le serveur verifie l'asset local `DigitalAsset`.
4. Le serveur genere une signed URL Supabase.
5. La signed URL expire rapidement.
6. Le client telecharge le fichier.

## Duree de vie cible des liens

Valeur recommandee:

- 5 a 10 minutes

But:

- limiter le partage de lien
- limiter l'exposition d'une URL temporaire

## Ce que Supabase Storage ne remplace pas

Supabase Storage est le stockage physique.

Il ne remplace pas:

- `DigitalAsset` comme source locale des fichiers vendables
- `DownloadGrant` comme source de verite du droit
- `Order` et `Payment` comme sources de verite commerciales

## Migration des assets

Le passage vers Supabase Storage doit suivre cet ordre:

1. creer les nouveaux produits numeriques
2. uploader les nouveaux fichiers dans le bucket prive
3. creer les `DigitalAsset`
4. connecter les produits et assets
5. activer les `DownloadGrant`
6. basculer les parcours d'achat vers le nouveau moteur

## Etat dashboard actuel

Le dashboard admin gere maintenant:

- la creation de references `DigitalAsset`
- l'edition de `bucket`, `path`, `filename`, `status`
- la liaison des assets aux produits

Le dashboard ne fait toujours pas:

- l'upload du fichier vers Supabase Storage
- la generation de signed URL
- la lecture directe du fichier prive
