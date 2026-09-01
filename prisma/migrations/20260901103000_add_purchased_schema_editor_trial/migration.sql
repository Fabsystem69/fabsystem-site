-- Codes issus d'un achat : lien de commande unique pour l'idempotence Stripe
-- et adresse destinataire pour empecher le transfert a un autre compte.
-- Les deux champs restent nullable afin de conserver les codes communautaires.
ALTER TABLE "TrialAccessCode"
ADD COLUMN "sourceOrderId" TEXT,
ADD COLUMN "recipientEmail" TEXT;

CREATE UNIQUE INDEX "TrialAccessCode_sourceOrderId_key"
ON "TrialAccessCode"("sourceOrderId");

CREATE INDEX "TrialAccessCode_recipientEmail_idx"
ON "TrialAccessCode"("recipientEmail");
