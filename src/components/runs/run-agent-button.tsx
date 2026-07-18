"use client";

import { Loader2, Lock, Play, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRunSchema, fieldErrors } from "@/lib/validations";

/** Execute a queued run, optionally passing credentials that never leave this request. */
export function RunAgentButton({
  runId,
  onStarted,
}: {
  runId: string;
  onStarted?: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = executeRunSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setState("running");
    setMessage(null);
    onStarted?.();
    const requestBody = JSON.stringify(parsed.data);
    const passwordInput = form.elements.namedItem("loginPassword");
    if (passwordInput instanceof HTMLInputElement) passwordInput.value = "";

    try {
      const response = await fetch(`/api/runs/${runId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
        data?: { summary?: { status: string; summary: string } };
      };

      if (!response.ok) {
        setState("error");
        setErrors(json.fields ?? {});
        setMessage(json.error ?? "The run could not be completed.");
        router.refresh();
        return;
      }

      const completed = json.data?.summary?.status === "COMPLETED";
      setState(completed ? "idle" : "error");
      if (!completed) {
        setMessage(json.data?.summary?.summary ?? "The run did not complete successfully.");
      }
      router.refresh();
    } catch {
      setState("error");
      setMessage("Could not reach the server. Check that the app is running and try again.");
    }
  }

  return (
    <form onSubmit={run} className="flex w-full max-w-xl flex-col gap-3" noValidate>
      <details className="rounded-md border border-border bg-background/45 p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-eyebrow text-muted-foreground">
          Optional login credentials
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Login URL" htmlFor="execute-login-url" error={errors.loginUrl}>
              <Input id="execute-login-url" name="loginUrl" type="url" inputMode="url" />
            </Field>
          </div>
          <Field label="Email" htmlFor="execute-login-email" error={errors.loginEmail}>
            <Input id="execute-login-email" name="loginEmail" type="email" autoComplete="off" />
          </Field>
          <Field label="Password" htmlFor="execute-login-password" error={errors.loginPassword}>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="execute-login-password"
                name="loginPassword"
                type="password"
                autoComplete="new-password"
                className="pl-9"
              />
            </div>
          </Field>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Used only for this execution. Credentials are never stored, logged, or sent to AI.
        </p>
      </details>

      <div className="flex justify-end">
        <Button type="submit" disabled={state === "running"}>
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
      </div>

      {state === "running" ? (
        <p className="text-right font-mono text-[0.7rem] text-muted-foreground">
          Driving a real browser — this can take up to ~90s. Keep this tab open.
        </p>
      ) : null}

      {state === "error" && message ? (
        <p role="alert" className="flex items-start justify-end gap-1.5 text-right text-xs text-primary">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}
    </form>
  );
}
