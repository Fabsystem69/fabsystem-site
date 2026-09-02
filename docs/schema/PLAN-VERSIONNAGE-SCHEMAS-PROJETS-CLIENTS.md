# Plan de donnees - Schemas admin et projets clients

## Statut

- Date : 2026-09-02
- Statut : valide pour implementation avant le prochain push
- Portee : schemas electriques, brouillons admin, accompagnements clients

## Decision produit

FabSystem dispose de deux espaces de travail distincts :

- un brouillon admin prive, cree sans client ni projet ;
- un schema rattache a un projet client, modifiable par le client et l'admin.

L'admin peut copier un brouillon prive vers un projet client. Le brouillon
source reste disponible pour reutilisation. Le projet client devient alors la
source de verite du travail partage.

## Controle d'acces

| Action | Client proprietaire | Admin dashboard |
| --- | --- | --- |
| Lire/modifier son projet | Oui | Oui |
| Creer/restaurer une version | Oui | Oui |
| Creer/modifier un brouillon admin | Non | Oui |
| Rattacher un brouillon a un client | Non | Oui |
| Lire un lien public | Lecture seule | Lecture seule |

Les routes de projet resolvent un acteur `customer` ou `admin` cote serveur.
Un parametre `projectId` seul ne donne jamais de droit. L'admin ouvre un projet
depuis le dashboard, jamais depuis une URL librement saisie dans l'editeur.

## Modeles Prisma cibles

`ProjectSchema` reste le brouillon courant du projet client.

### `ProjectSchemaVersion`

- `projectSchemaId`, relation au schema parent, suppression en cascade ;
- `versionNumber`, unique avec `projectSchemaId` ;
- `authorType` (`ADMIN` ou `CUSTOMER`) et `authorCustomerId` nullable ;
- `label` nullable ;
- snapshots immuables : `projectName`, `nodes`, `edges`, `thumbnail` ;
- `createdAt`.

Les versions ne sont ni modifiees ni supprimees individuellement. Restaurer
une version copie son snapshot dans le brouillon courant et ne supprime rien.

### `AdminSchemaDraft`

- `id`, `name`, `nodes`, `edges`, `thumbnail` ;
- `createdAt`, `updatedAt` ;
- aucune relation `Customer` ou `Project` ;
- visible uniquement avec une session dashboard admin.

Le rattachement est une copie explicite du brouillon vers un `ProjectSchema`.
Une premiere `ProjectSchemaVersion` est creee dans la meme transaction afin de
conserver l'etat qui a ete envoye au client.

## Regles de versionnage

1. L'autosauvegarde met a jour uniquement le brouillon courant.
2. `Creer une version` est une action explicite avec note facultative.
3. L'envoi par l'admin vers un projet client cree automatiquement une V1.
4. Une restauration necessite une confirmation explicite.
5. Une version affiche date, auteur et note, sans annoncer une conformite
   electrique ou VASP.

## Routes et interface cibles

- espace dashboard `Schemas FabSystem` : liste, creation et edition des
  brouillons admin ;
- action `Associer a un projet client` : choix client puis projet ;
- panneau `Historique` dans l'editeur du projet : creation, apercu et
  restauration de versions ;
- ruban admin : badge `Mode administration`, client et projet actifs, retour
  dashboard, deconnexion admin ;
- espace client : schema courant, historique et lien public lecture seule.

## Migration et securite

1. Migration Prisma additive : aucun brouillon ni projet existant n'est
   modifie ou supprime.
2. Les schemas existants restent des brouillons courants sans V1 retroactive.
3. Les snapshots ne sont jamais places dans les logs serveur.
4. Les creations/restaurations sont journalisees avec projet, acteur et
   identifiant de version.
5. Les tests couvrent ownership client, acces admin, creation de version,
   restauration non destructive et rattachement de brouillon.

## Criteres d'acceptation

- L'admin peut creer un schema sans projet client.
- Le client peut modifier un schema envoye dans son projet.
- Chaque version importante est recuperable et attribuee a son auteur.
- Restaurer une version ne supprime jamais l'historique.
- Un lien public ne permet ni edition ni consultation de l'historique.
## Déploiement

La base historique a été initialisée avant la mise en place des migrations Prisma: `prisma migrate dev` ne peut donc pas construire une shadow database depuis l'historique présent dans le dépôt. La migration `20260902000000_admin_schema_drafts_and_versions` est strictement additive.

Avant de déployer le code qui utilise les versions, l'exécuter une seule fois sur la base de production avec l'URL de production, puis vérifier les deux tables:

```bash
psql "$DIRECT_URL" -f prisma/migrations/20260902000000_admin_schema_drafts_and_versions/migration.sql
psql "$DIRECT_URL" -c 'SELECT to_regclass('"'"'public."AdminSchemaDraft"'"'"'), to_regclass('"'"'public."ProjectSchemaVersion"'"'"');'
```

Ne pas lancer `prisma migrate deploy` tant qu'une migration baseline de tout l'historique n'a pas été créée et marquée comme appliquée sur les bases existantes. Une étape dédiée de baselining devra être planifiée avant d'adopter ce flux pour les prochaines migrations.
