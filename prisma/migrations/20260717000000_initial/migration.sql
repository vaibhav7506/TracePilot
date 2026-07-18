CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "FindingCategory" AS ENUM ('CONSOLE', 'NETWORK', 'ROUTE', 'UI', 'ACCESSIBILITY', 'AUTH', 'FORM', 'UNKNOWN');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QaRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "goal" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "summary" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QaRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "category" "FindingCategory" NOT NULL DEFAULT 'UNKNOWN',
    "url" TEXT,
    "selector" TEXT,
    "screenshotPath" TEXT,
    "reproductionSteps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrowserStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "url" TEXT,
    "result" TEXT,
    "screenshotPath" TEXT,
    "consoleErrors" JSONB,
    "networkErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrowserStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedTest" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "framework" TEXT NOT NULL DEFAULT 'playwright',
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedTest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX "QaRun_projectId_idx" ON "QaRun"("projectId");
CREATE INDEX "QaRun_status_createdAt_idx" ON "QaRun"("status", "createdAt");
CREATE INDEX "Finding_runId_severity_idx" ON "Finding"("runId", "severity");
CREATE INDEX "Finding_runId_category_idx" ON "Finding"("runId", "category");
CREATE UNIQUE INDEX "BrowserStep_runId_order_key" ON "BrowserStep"("runId", "order");
CREATE INDEX "BrowserStep_runId_idx" ON "BrowserStep"("runId");
CREATE INDEX "GeneratedTest_runId_idx" ON "GeneratedTest"("runId");

ALTER TABLE "QaRun" ADD CONSTRAINT "QaRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QaRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrowserStep" ADD CONSTRAINT "BrowserStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QaRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedTest" ADD CONSTRAINT "GeneratedTest_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QaRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
