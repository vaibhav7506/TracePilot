import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your workspace"
      description="Save projects, keep QA reports private, and optionally connect an encrypted AI provider key."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
