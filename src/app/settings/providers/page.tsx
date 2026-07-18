import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserProviderManager } from "@/components/settings/user-provider-manager";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Your AI providers" };

export default async function ProvidersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/providers");
  return (
    <Section spacing="md">
      <SectionHeader
        eyebrow="Encrypted BYOK"
        title="Your AI providers"
        description="Connect a provider for AI planning, analysis, and Playwright generation. Deterministic browser QA remains available without one."
        actions={
          <Button asChild variant="outline">
            <Link href="/settings">Platform settings</Link>
          </Button>
        }
      />
      <div className="mt-7 flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.045] p-5">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your key is encrypted before storage and only decrypted server-side during AI analysis.
          TracePilot QA never exposes your key in the browser, generated tests, screenshots, or
          logs.
        </p>
      </div>
      <div className="mt-9">
        <UserProviderManager />
      </div>
    </Section>
  );
}
