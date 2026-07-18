CREATE TYPE "TestGenerationMode" AS ENUM ('AI', 'FALLBACK');

ALTER TABLE "QaRun"
ADD COLUMN "usedLoginCredentials" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "GeneratedTest"
ADD COLUMN "fileName" TEXT NOT NULL DEFAULT 'generated.spec.ts',
ADD COLUMN "provider" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "generationMode" "TestGenerationMode" NOT NULL DEFAULT 'FALLBACK';
