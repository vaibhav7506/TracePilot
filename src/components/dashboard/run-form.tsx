"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createRunSchema, fieldErrors } from "@/lib/validations";
import { cn } from "@/lib/utils";

export interface ProjectOption {
  id: string;
  name: string;
  baseUrl: string;
}

export function RunForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [queuedId, setQueuedId] = useState<string | null>(null);

  const hasProjects = projects.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setQueuedId(null);

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const parsed = createRunSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { run?: { id: string } };
        error?: string;
        fields?: Record<string, string>;
      };

      if (!res.ok) {
        setErrors(json.fields ?? {});
        setFormError(json.fields ? null : (json.error ?? "Could not queue the run."));
        return;
      }

      setQueuedId(json.data?.run?.id ?? null);
      form.reset();
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field label="Project" hint="required" htmlFor="run-project" error={errors.projectId}>
        <div className="relative">
          <select
            id="run-project"
            name="projectId"
            defaultValue=""
            disabled={!hasProjects}
            className={cn(
              "h-10 w-full appearance-none rounded-md border border-input bg-background/60 px-3 pr-9 text-sm",
              "text-foreground shadow-subtle transition-colors",
              "hover:border-primary/30",
              "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <option value="" disabled>
              {hasProjects ? "Choose a project" : "Create a project first"}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} — {project.baseUrl.replace(/^https?:\/\//, "")}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </Field>

      <Field label="Testing goal" hint="required" htmlFor="run-goal" error={errors.goal}>
        <Textarea
          id="run-goal"
          name="goal"
          maxLength={1000}
          placeholder="Sign up, add a paid plan, and confirm the receipt page renders."
        />
      </Field>

      <FormError message={formError} />
      {queuedId ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          Run queued.{" "}
          <Link href={`/runs/${queuedId}`} className="text-primary underline-offset-2 hover:underline">
            View it →
          </Link>
        </p>
      ) : null}

      <div className="flex items-center justify-end border-t border-border pt-5">
        <Button type="submit" size="lg" disabled={submitting || !hasProjects}>
          {submitting ? "Queuing…" : "Queue QA run"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
