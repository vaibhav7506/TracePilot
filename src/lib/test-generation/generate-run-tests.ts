import { generatePlaywrightTests } from "@/lib/ai/run-analysis";
import { describeAiFailure } from "@/lib/ai/errors";
import { prisma } from "@/lib/prisma";
import { generateFallbackTests, type TestFile } from "@/lib/test-generation/fallback";
import { getPlatformSettings } from "@/lib/settings/config";
import { uniqueSafeSpecFileNames } from "@/lib/test-generation/file-name";
import {
  containsUnsafeTestIntent,
  generatedTestIsSafe,
  type GeneratedTestSafetyContext,
} from "@/lib/test-generation/safety";

function safeStructuredEvidence(value: unknown): unknown {
  if (value == null) return null;
  try {
    return containsUnsafeTestIntent(JSON.stringify(value)) ? null : value;
  } catch {
    return null;
  }
}

export async function generateRunTests(runId: string) {
  const generationSettings = getPlatformSettings().testGeneration;
  const run = await prisma.qaRun.findUnique({
    where: { id: runId },
    include: {
      project: { select: { baseUrl: true } },
      steps: { orderBy: { order: "asc" } },
      findings: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!run) return { kind: "not-found" as const };
  if (run.status !== "COMPLETED") return { kind: "not-completed" as const };

  await prisma.qaRun.update({
    where: { id: runId },
    data: { generatedTestStatus: "GENERATING" },
  });

  const safeSteps = run.steps.filter(
    (step) =>
      !containsUnsafeTestIntent(step.action, step.target, step.url, step.result),
  );
  const safeFindings = run.findings.filter(
    (finding) =>
      !containsUnsafeTestIntent(
        finding.title,
        finding.description,
        finding.url,
        finding.selector,
        ...(Array.isArray(finding.reproductionSteps) ? finding.reproductionSteps : []),
      ),
  );
  const discoveredRoutes = Array.from(
    new Set([
      run.project.baseUrl,
      ...safeSteps.flatMap((step) => (step.url ? [step.url] : [])),
      ...safeFindings.flatMap((finding) => (finding.url ? [finding.url] : [])),
    ]),
  );
  const evidence = {
    goal: containsUnsafeTestIntent(run.goal)
      ? "Verify discovered routes and non-destructive browser behavior."
      : run.goal,
    baseUrl: run.project.baseUrl,
    usedLoginCredentials: run.usedLoginCredentials,
    generationSettings,
    discoveredRoutes,
    discoveredSelectors: safeFindings.flatMap((finding) =>
      finding.selector ? [finding.selector] : [],
    ),
    testPlan: safeStructuredEvidence(run.aiTestPlan),
    analysis: safeStructuredEvidence(run.aiAnalysis),
    steps: safeSteps.map((step) => ({
      order: step.order,
      action: step.action,
      target: step.target,
      url: step.url,
      result: step.result,
      consoleErrors: step.consoleErrors,
      networkErrors: step.networkErrors,
    })),
    findings: safeFindings.map((finding) => ({
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      category: finding.category,
      url: finding.url,
      selector: finding.selector,
      reproductionSteps: finding.reproductionSteps,
    })),
  };

  let files: TestFile[] | null = null;
  let provider: string | null = null;
  let model: string | null = null;
  const safetyContext: GeneratedTestSafetyContext = {
    baseUrl: run.project.baseUrl,
    discoveredRoutes,
    authUsed: run.usedLoginCredentials,
  };
  try {
    const generated = await generatePlaywrightTests(evidence, run.userId);
    const safeAiOutput =
      generated?.object.tests.every((file) => generatedTestIsSafe(file, safetyContext)) ?? false;
    if (generated && safeAiOutput) {
      const enabledKinds = new Set([
        ...(generationSettings.includeSmokeTests ? ["smoke"] : []),
        ...(generationSettings.includeNavigationTests ? ["navigation"] : []),
        ...(generationSettings.includeFormTests ? ["form"] : []),
        ...(generationSettings.includeRegressionTests ? ["regression"] : []),
        ...(run.usedLoginCredentials ? ["auth"] : []),
      ]);
      files = generated.object.tests.filter((file) => enabledKinds.has(file.kind));
      provider = generated.provider;
      model = generated.model;
    } else if (generated) {
      console.error("[test-generation] Unsafe or invented AI test content rejected", {
        runId,
        provider: generated.provider,
      });
    }
  } catch (error) {
    const failure = describeAiFailure(error);
    console.error("[test-generation] AI output rejected; using deterministic fallback", {
      runId,
      provider: failure.provider,
      code: failure.code,
      reason: failure.reason,
    });
  }

  const generationMode = files?.length ? "AI" : "FALLBACK";
  if (!files?.length) {
    files = generateFallbackTests(
      {
        baseUrl: run.project.baseUrl,
        usedLoginCredentials: run.usedLoginCredentials,
        routes: discoveredRoutes,
        findings: safeFindings,
      },
      generationSettings,
    ).filter((file) => generatedTestIsSafe(file, safetyContext));
  }
  if (files.length === 0) {
    await prisma.$transaction([
      prisma.generatedTest.deleteMany({ where: { runId } }),
      prisma.qaRun.update({ where: { id: runId }, data: { generatedTestStatus: "NOT_GENERATED" } }),
    ]);
    return {
      kind: "generated" as const,
      tests: [],
      generationMode: "FALLBACK" as const,
      provider: null,
      model: null,
    };
  }

  const safeFileNames = uniqueSafeSpecFileNames(files.map((file) => file.fileName));
  const finalizedFiles: TestFile[] = files.map((file, index) => ({
    ...file,
    fileName: safeFileNames[index] ?? "generated.spec.ts",
  }));

  const records = await prisma.$transaction(async (tx) => {
    await tx.generatedTest.deleteMany({ where: { runId } });
    await tx.generatedTest.createMany({
      data: finalizedFiles.map((file) => ({
        runId,
        title: file.title,
        fileName: file.fileName,
        framework: "playwright",
        code: file.code,
        provider,
        model,
        generationMode,
      })),
    });
    await tx.qaRun.update({ where: { id: runId }, data: { generatedTestStatus: "GENERATED" } });
    return tx.generatedTest.findMany({ where: { runId }, orderBy: { createdAt: "asc" } });
  });

  return { kind: "generated" as const, tests: records, generationMode, provider, model };
}
