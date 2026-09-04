-- Etat local des abonnements Stripe Billing pour Éditeur Plus. Les droits
-- restent dérivés côté application de cette projection locale synchronisée
-- par webhook, jamais de la seule redirection Checkout.
CREATE TYPE "EditorSubscriptionStatus" AS ENUM (
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'UNPAID',
  'INCOMPLETE',
  'CANCELED'
);

CREATE TABLE "EditorSubscription" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "status" "EditorSubscriptionStatus" NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "currentPeriodEndsAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EditorSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EditorSubscription_stripeSubscriptionId_key"
ON "EditorSubscription"("stripeSubscriptionId");
CREATE INDEX "EditorSubscription_customerId_idx" ON "EditorSubscription"("customerId");
CREATE INDEX "EditorSubscription_stripeCustomerId_idx" ON "EditorSubscription"("stripeCustomerId");
CREATE INDEX "EditorSubscription_status_idx" ON "EditorSubscription"("status");
CREATE INDEX "EditorSubscription_currentPeriodEndsAt_idx" ON "EditorSubscription"("currentPeriodEndsAt");

ALTER TABLE "EditorSubscription"
ADD CONSTRAINT "EditorSubscription_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
