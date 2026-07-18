"use client";

import {
  Check,
  Clipboard,
  Download,
  FileArchive,
  FileCode2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type GeneratedTestView = {
  id: string;
  title: string;
  fileName: string;
  framework: string;
  code: string;
  provider: string | null;
  model: string | null;
  generationMode: "AI" | "FALLBACK";
};

export function GeneratedTestsPanel({
  runId,
  canGenerate,
  isDemo,
  tests,
  generationStatus,
}: {
  runId: string;
  canGenerate: boolean;
  isDemo: boolean;
  tests: GeneratedTestView[];
  generationStatus: "NOT_GENERATED" | "GENERATING" | "GENERATED" | "FAILED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/generate-tests`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Could not generate tests.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate tests.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(test: GeneratedTestView) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(test.code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = test.code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Copy command was rejected.");
      }
      setCopiedId(test.id);
      window.setTimeout(() => setCopiedId(null), 3000);
    } catch {
      setError("Clipboard access was unavailable. Select the code and copy it manually.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Generated tests</CardTitle>
          <Badge variant="outline">Playwright</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {tests.length > 1 && !isDemo ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/runs/${runId}/generated-tests/download-all`}>
                <FileArchive className="h-3.5 w-3.5" aria-hidden />
                Download all
              </a>
            </Button>
          ) : null}
          {canGenerate && !isDemo ? (
            <Button variant="outline" size="sm" onClick={regenerate} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              {tests.length > 0 ? "Regenerate" : "Generate tests"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {error ? (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        ) : null}
        {generationStatus === "GENERATING" && tests.length === 0 ? (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium">Generating Playwright coverage</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Building safe smoke, navigation, form, and regression tests.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <span className="block h-3 w-full animate-pulse rounded bg-muted" />
              <span className="block h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : tests.length === 0 ? (
          <EmptyState
            icon={FileCode2}
            eyebrow={generationStatus === "FAILED" ? "Generation failed" : "Regression coverage"}
            title={generationStatus === "FAILED" ? "Test generation failed" : "Tests not generated"}
            description={
              generationStatus === "FAILED"
                ? "The previous generation attempt did not complete. Deterministic browser evidence is unaffected, and you can try again."
                : canGenerate
                  ? "Generate safe Playwright coverage from this completed run."
                  : "Tests become available after the run completes."
            }
            className="py-10"
          />
        ) : (
          tests.map((test) => (
            <article
              key={test.id}
              className="overflow-hidden rounded-md border border-border bg-muted/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{test.title}</p>
                  <p className="mt-0.5 font-mono text-[0.7rem] text-muted-foreground">
                    {test.fileName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={test.generationMode === "FALLBACK" ? "muted" : "outline"}>
                    {test.generationMode === "FALLBACK"
                      ? "Deterministic fallback"
                      : `${test.provider || "AI"}${test.model ? ` · ${test.model}` : ""}`}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => copy(test)}>
                    {copiedId === test.id ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {copiedId === test.id ? "Copied" : "Copy"}
                  </Button>
                  {!isDemo ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/api/runs/${runId}/generated-tests/${test.id}/download`}>
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Download
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
              <pre className="max-h-[32rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                <code>{test.code}</code>
              </pre>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
