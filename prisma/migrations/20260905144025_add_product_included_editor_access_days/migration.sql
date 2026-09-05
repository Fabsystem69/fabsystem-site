-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "includedEditorAccessDays" INTEGER;

-- Backfill : les 2 offres qui incluaient deja 365 jours d'acces editeur
-- (accordes jusque-la via lib/prestations-offers.ts, code en dur) doivent
-- conserver ce benefice maintenant que la duree vient de cette colonne.
-- Sans ce backfill, un achat de ces offres en production n'accorderait plus
-- aucun acces editeur des la mise en prod de cette migration.
UPDATE "Product"
SET "includedEditorAccessDays" = 365
WHERE "slug" IN ('accompagnement-guide', 'accompagnement-conception-complete')
  AND "includedEditorAccessDays" IS NULL;
