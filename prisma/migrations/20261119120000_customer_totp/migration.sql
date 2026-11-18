-- Additive only. Existing customer rows stay. Columns are unused while
-- sign-in still reads data/runtime/customers.json. Do not reset this database.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecretEnc" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpActivatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpLastStep" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpPendingEnc" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpPendingExpiresAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "TotpRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TotpRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TotpRecoveryCode_userId_idx" ON "TotpRecoveryCode"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TotpRecoveryCode_userId_fkey'
  ) THEN
    ALTER TABLE "TotpRecoveryCode"
      ADD CONSTRAINT "TotpRecoveryCode_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
