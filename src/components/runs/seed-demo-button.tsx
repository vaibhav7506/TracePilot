"use client";

import { DatabaseZap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SeedDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/seed", { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { runId?: string };
        error?: string;
      };
      if (!response.ok || !body.data?.runId)
        throw new Error(body.error || "Could not create demo run.");
      router.push(`/runs/${body.data.runId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create demo run.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button onClick={seed} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
        Seed demo run
      </Button>
      {error ? (
        <p role="alert" className="max-w-72 text-right text-xs text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
