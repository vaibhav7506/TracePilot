"use client";

import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fieldErrors } from "@/lib/validations";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (isSignup ? signupSchema : loginSchema).safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok) {
        setErrors(body.fields ?? {});
        setFormError(body.fields ? null : (body.error ?? "Authentication failed."));
        return;
      }
      const requested = search.get("next");
      const destination =
        requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Email" htmlFor={`${mode}-email`} error={errors.email}>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={`${mode}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className="pl-9"
            placeholder="you@example.com"
          />
        </div>
      </Field>
      <Field
        label="Password"
        htmlFor={`${mode}-password`}
        hint={isSignup ? "8+ characters" : undefined}
        error={errors.password}
      >
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={`${mode}-password`}
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="pl-9"
          />
        </div>
      </Field>
      <FormError message={formError} />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy
          ? isSignup
            ? "Creating account…"
            : "Signing in…"
          : isSignup
            ? "Create account"
            : "Sign in"}
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to TracePilot QA?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-primary underline-offset-4 hover:underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
