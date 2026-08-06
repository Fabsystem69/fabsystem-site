# Diagnostic Prisma migrate status — 2026-08-06

## Verdict court

Cause identifiée :

- `npx prisma migrate status --schema prisma/schema.prisma` échoue dans l'environnement sandboxé de Codex, mais réussit hors sandbox sur la même machine et la même base locale.

Cause probable :

- le moteur Prisma `schema-engine` ne parvient pas à accéder correctement à PostgreSQL local depuis le sandbox, alors que PostgreSQL lui-même est joignable hors sandbox.

Cause non retenue à ce stade :

- problème d'historique Prisma en base ;
- migration manquante ;
- base distante ;
- drift métier ;
- schéma Prisma invalide.

## Environnement détecté

- `DATABASE_URL` : présent, protocole `postgresql`, host `localhost`, port `5432`, base `fabsystem_dev`, local
- `DIRECT_URL` : présent, protocole `postgresql`, host `localhost`, port `5432`, base `fabsystem_dev`, local
- `SHADOW_DATABASE_URL` : présent, protocole `postgresql`, host `localhost`, port `5432`, base `fabsystem_shadow`, local
- `.env.local` : présent mais ne redéfinit aucune de ces variables

Conclusion :

- Prisma pointe bien vers la base locale attendue ;
- aucun indicateur ne montre une base distante ou de production.

## PostgreSQL local

- serveur PostgreSQL local : joignable hors sandbox
- base `fabsystem_dev` : accessible hors sandbox
- table `"_prisma_migrations"` : accessible hors sandbox
- nombre de migrations en base : `20`

Commandes de vérification utiles :

- `pg_isready -h localhost -p 5432` -> `accepting connections`
- `SELECT current_database();` -> `fabsystem_dev`
- `SELECT version();` -> PostgreSQL 16.14
- `SELECT count(*) FROM "_prisma_migrations";` -> `20`

Important :

- les mêmes vérifications échouent dans le sandbox sur le socket local avec `Operation not permitted`, ce qui confirme un problème d'environnement d'exécution plutôt qu'un problème de schéma.

## Comparaison filesystem / DB

- nombre de dossiers de migration Prisma : `20`
- nombre de migrations en base : `20`
- `migration.sql` présent pour chaque migration
- aucun dossier de migration vide détecté
- aucun `rolled_back_at` non nul détecté
- aucune migration absente du filesystem dans la base
- aucune migration absente de la base dans le filesystem

Ordre filesystem observé :

1. `20260227_init_documents`
2. `20260228_add_customer_assets`
3. `20260228_add_document_sequence`
4. `20260228_add_invoice_payments`
5. `20260228_add_invoice_source_quote`
6. `20260228_add_item_templates`
7. `20260228_add_quote_signature`
8. `20260228_add_service_type_delivery_mode`
9. `20260314_add_invoice_einvoice_fields`
10. `20260507_add_remise`
11. `20260727_add_ebook_order`
12. `20260728_add_ebook_download_count`
13. `20260728_add_ebook_email_tracking`
14. `20260806030000_add-digital-catalog-foundation`
15. `20260806040000_add-digital-cart-foundation`
16. `20260806050000_add-order-payment-foundation`
17. `20260806113000_fix_document_sequence_updated_at_default`
18. `20260806122905_add_download_grant_foundation`
19. `20260806140000_add-customer-auth-foundation`
20. `20260806150000_normalize-customer-for-client-auth`

Historique DB observé :

- les `20` migrations existent aussi en base ;
- aucune migration n'est marquée rollback ;
- l'historique est cohérent ;
- la migration `20260806113000_fix_document_sequence_updated_at_default` a un `started_at` antérieur à certaines migrations suivantes, mais cela ne bloque pas `migrate status` hors sandbox.

Élément annexe non bloquant :

- le dossier `20260806030000_add-digital-catalog-foundation` contient aussi un `README.txt` en plus de `migration.sql`, ce qui n'empêche pas Prisma de considérer l'historique comme sain.

## Erreur migrate status

Commande sandboxée :

```bash
npx prisma migrate status --schema prisma/schema.prisma
```

Extrait utile :

```text
Datasource "db": PostgreSQL database "fabsystem_dev", schema "public" at "localhost:5432"
Error: Schema engine error:
```

Commande sandboxée avec debug :

```bash
DEBUG="prisma:*" npx prisma migrate status --schema prisma/schema.prisma
```

Extraits utiles :

```text
prisma:cli:checkpoint Error from runCheckpointClientCheck()
code: "EPERM"
path: "/Users/.../Library/Caches/checkpoint-nodejs/..."
```

```text
Datasource "db": PostgreSQL database "fabsystem_dev", schema "public" at "localhost:5432"
Error: Schema engine error:
```

Commandes hors sandbox :

```bash
pg_isready -h localhost -p 5432
npx prisma migrate status --schema prisma/schema.prisma
```

Résultat hors sandbox :

```text
20 migrations found in prisma/migrations
Database schema is up to date!
```

Interprétation :

- le problème ne vient pas du contenu des migrations ;
- le problème ne vient pas d'une base mal ciblée ;
- le problème n'est pas reproduit hors sandbox ;
- le périmètre le plus probable est une restriction sandbox sur l'accès local nécessaire au `schema-engine` Prisma, possiblement combinée à des restrictions d'accès à certains fichiers de cache utilisateur.

## Hypothèses classées

1. Cause la plus probable

- le sandbox Codex bloque ou perturbe l'accès local requis par `schema-engine` Prisma pour `migrate status`, alors que `prisma generate` et `prisma validate` n'ont pas les mêmes besoins runtime.

2. Cause alternative

- interaction spécifique entre Prisma 6.19.2, le `schema-engine` et l'environnement sandboxé macOS, incluant des accès refusés sur des chemins de cache utilisateur.

3. Cause peu probable

- incohérence réelle de l'historique des migrations ou du schéma local ; cette hypothèse est affaiblie par le succès de `migrate status` hors sandbox et par l'égalité filesystem/DB (`20` vs `20`).

## Correction recommandée

Correction recommandée sans action destructive :

- considérer l'échec actuel comme un problème d'environnement d'exécution sandboxé, pas comme un problème métier ou Prisma schema ;
- exécuter les commandes Prisma liées aux migrations locales hors sandbox quand un diagnostic DB réel est nécessaire ;
- conserver le schéma et l'historique de migrations en l'état.

Si une stabilisation supplémentaire est souhaitée plus tard :

- documenter explicitement dans le workflow local que `prisma migrate status` peut nécessiter un accès non sandboxé à PostgreSQL local ;
- éventuellement vérifier une mise à jour future de Prisma si ce comportement sandbox reste fréquent.

Correction non recommandée dans ce sprint :

- aucune réécriture de migration ;
- aucune modification de `schema.prisma` ;
- aucun reset Prisma ;
- aucune opération SQL de correction.

## Commandes sûres à relancer

Commandes non destructives :

```bash
npx prisma generate
npx prisma validate
npx prisma migrate status --schema prisma/schema.prisma
DEBUG="prisma:*" npx prisma migrate status --schema prisma/schema.prisma
pg_isready -h localhost -p 5432
psql "postgresql://USER@localhost:5432/fabsystem_dev" -c "select current_database();"
psql "postgresql://USER@localhost:5432/fabsystem_dev" -c "select count(*) from \"_prisma_migrations\";"
```

Note :

- pour un diagnostic fiable sur cette machine, `migrate status` doit être relancé hors sandbox.

## Ce qui n’a pas été fait

- pas de `prisma migrate reset`
- pas de `dropdb`
- pas de migration créée
- pas de modification de base
- pas de modification du schéma métier Prisma
- pas de modification du flux e-commerce
- pas de modification Stripe / Supabase / Vercel Blob / legacy ebook
