"use client";

import { CheckCircle2, Loader2, PlugZap, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AiProvider } from "@/lib/ai";

type TestState =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function ProviderTestButton({
  provider,
  disabled,
}: {
  provider: AiProvider;
  disabled: boolean;
}) {
  const [state, setState] = useState<TestState>({ kind: "idle" });

  async function testProvider() {
    setState({ kind: "testing" });
    try {
      const response = await fetch("/api/settings/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { message?: string; latencyMs?: number };
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || "Provider test failed.");
      setState({
        kind: "success",
        message: `${body.data?.message || "Connection successful"}${body.data?.latencyMs ? ` · ${body.data.latencyMs} ms` : ""}`,
      });
    } catch (cause) {
      setState({
        kind: "error",
        message: cause instanceof Error ? cause.message : "Provider test failed.",
      });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || state.kind === "testing"}
        onClick={testProvider}
      >
        {state.kind === "testing" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <PlugZap className="h-3.5 w-3.5" />
        )}
        Test connection
      </Button>
      {state.kind === "success" ? (
        <p className="flex items-center gap-1.5 text-right text-xs text-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {state.message}
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p
          role="alert"
          className="flex max-w-80 items-center gap-1.5 text-right text-xs text-primary"
        >
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
