-- Repair legacy QA scores that were persisted from an unnormalized AI value.
-- Higher is always healthier; deterministic finding penalties are authoritative
-- when a stored value is outside the valid range or suspiciously near zero.
WITH base_scores AS (
  SELECT
    run.id,
    run.status,
    run."aiAnalysisStatus",
    100 - COALESCE(
      SUM(
        CASE finding.severity
          WHEN 'CRITICAL' THEN 30
          WHEN 'HIGH' THEN 20
          WHEN 'MEDIUM' THEN 10
          WHEN 'LOW' THEN 5
          ELSE 0
        END
      ),
      0
    ) AS deterministic_score,
    COUNT(finding.id) AS finding_count
  FROM "QaRun" AS run
  LEFT JOIN "Finding" AS finding ON finding."runId" = run.id
  GROUP BY run.id, run.status, run."aiAnalysisStatus"
), normalized_scores AS (
  SELECT
    id,
    finding_count,
    GREATEST(
      0,
      LEAST(
        100,
        CASE
          WHEN status = 'FAILED' THEN LEAST(deterministic_score, 30)
          ELSE deterministic_score
        END - CASE
          WHEN status = 'COMPLETED' AND "aiAnalysisStatus" = 'FAILED' THEN 5
          ELSE 0
        END
      )
    )::INTEGER AS score
  FROM base_scores
)
UPDATE "QaRun" AS run
SET score = normalized.score
FROM normalized_scores AS normalized
WHERE run.id = normalized.id
  AND (
    run.score IS NULL
    OR run.score < 0
    OR run.score > 100
    OR (run.score <= 1 AND normalized.finding_count > 0)
    OR (run.status = 'FAILED' AND run.score > 30)
  );
