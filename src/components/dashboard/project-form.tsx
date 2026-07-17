"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/dashboard/form-field";
import { createProjectSchema, fieldErrors } from "@/lib/validations";

export function ProjectForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCreated(null);

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const parsed = createProjectSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as {
        error?: string;
        fields?: Record<string, string>;
        project?: { name: string };
      };

      if (!res.ok) {
        setErrors(json.fields ?? {});
        setFormError(json.fields ? null : (json.error ?? "Could not create the project."));
        return;
      }

      setCreated(json.project?.name ?? parsed.data.name);
      form.reset();
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Project name" htmlFor="project-name" error={errors.name}>
        <Input id="project-name" name="name" placeholder="Acme storefront" maxLength={80} />
      </Field>

      <Field label="Website URL" htmlFor="project-base-url" error={errors.baseUrl}>
        <Input
          id="project-base-url"
          name="baseUrl"
          type="url"
          inputMode="url"
          placeholder="https://staging.acme.dev"
        />
      </Field>

      <FormError message={formError} />
      {created ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          Project “{created}” created.
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
