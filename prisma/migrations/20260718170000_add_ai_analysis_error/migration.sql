-- Store only a sanitized internal analysis failure reason. Provider response
-- bodies, credentials, and raw error messages must never be persisted.
ALTER TABLE "QaRun" ADD COLUMN "aiAnalysisError" TEXT;

-- Remove previously stored generated files that predate the read-only safety
-- boundary. Affected runs can be regenerated through the existing UI and will
-- then receive the deterministic safe suite if provider output is rejected.
DELETE FROM "GeneratedTest"
WHERE concat_ws(' ', "title", "fileName", "code") ~* '(payment|checkout|purchase|\mbuy\M|confirm[[:space:]]+order|transfer|withdraw|delete|remove|unsubscribe|cancel[[:space:]]+subscription|credit[[:space:]]+card|card[[:space:]]+number|\mcvv\M|\mcvc\M)';

UPDATE "QaRun" AS run
SET "generatedTestStatus" = 'NOT_GENERATED'
WHERE run."generatedTestStatus" = 'GENERATED'
  AND NOT EXISTS (SELECT 1 FROM "GeneratedTest" AS test WHERE test."runId" = run.id);
