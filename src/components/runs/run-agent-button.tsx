"use client";

import { Loader2, Play, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Triggers POST /api/runs/[id]/execute for a queued run. The request is
 * long-running (the browser agent can take up to ~90s), so this shows a busy
 * state throughout and refreshes the server component on completion to render
 * the freshly-saved steps and findings.
 */
export function RunAgentButton({ runId }: { runId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setState("running");
    setMessage(null);
    try {
      const res = await fetch(`/api/runs/${runId}/execute`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        summary?: { status: string; summary: string };
      };

      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? json.summary?.summary ?? "The run could not be completed.");
        router.refresh();
        return;
      }

      setState("idle");
      router.refresh();
    } catch {
      setState("error");
      setMessage("Could not reach the server. Check that the app is running and try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={run} disabled={state === "running"}>
        {state === "running" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Running the agent…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" aria-hidden />
            Run agent
          </>
        )}
      </Button>

      {state === "running" ? (
        <p className="max-w-[16rem] text-right font-mono text-[0.7rem] text-muted-foreground">
          Driving a real browser — this can take up to ~90s. Keep this tab open.
        </p>
      ) : null}

      {state === "error" && message ? (
        <p
          role="alert"
          className="flex max-w-[18rem] items-start gap-1.5 text-right text-xs text-primary"
        >
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}
