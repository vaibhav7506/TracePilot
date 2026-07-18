-- Reconcile legacy completed runs whose stored score predates the small,
-- deterministic AI-failure penalty. Browser findings remain authoritative.
WITH deterministic_scores AS (
  SELECT
    run.id,
    GREATEST(
      0,
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
      ) - 5
    )::INTEGER AS score
  FROM "QaRun" AS run
  LEFT JOIN "Finding" AS finding ON finding."runId" = run.id
  WHERE run.status = 'COMPLETED' AND run."aiAnalysisStatus" = 'FAILED'
  GROUP BY run.id
)
UPDATE "QaRun" AS run
SET score = deterministic.score
FROM deterministic_scores AS deterministic
WHERE run.id = deterministic.id;
