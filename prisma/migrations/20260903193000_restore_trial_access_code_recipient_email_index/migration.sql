-- La migration de suivi projet precedente supprimait cet index sans lien
-- fonctionnel avec le dashboard. On le restaure afin de garder les recherches
-- nominatives de codes d'acces performantes en production.
CREATE INDEX IF NOT EXISTS "TrialAccessCode_recipientEmail_idx" ON "TrialAccessCode"("recipientEmail");
