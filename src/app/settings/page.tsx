import { Database, KeyRound, Palette, Server } from "lucide-react";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";
import { env, isConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings",
  description: "Provider, database, and appearance configuration.",
};

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{value}</p>
      </div>
      <Badge variant={ok ? "neutral" : "outline"} dot={ok}>
        {ok ? "Configured" : "Not set"}
      </Badge>
    </div>
  );
}

/** Mask a secret, revealing only that it exists. */
function mask(value: string): string {
  return isConfigured(value) ? "•••••••••••• (set via env)" : "Add AI_API_KEY to .env";
}

export default function SettingsPage() {
  const { ai, databaseUrl, appUrl } = env;

  return (
    <Section spacing="md">
      <SectionHeader
        eyebrow="Configuration"
        title="Settings"
        description="TracePilot reads its configuration from environment variables. Values below reflect the current server environment — secrets are never shown."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
              <Server className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">AI provider</CardTitle>
              <CardDescription>OpenAI-compatible endpoint used for planning.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <StatusRow
              label="Provider"
              value={ai.provider || "AI_PROVIDER not set"}
              ok={isConfigured(ai.provider)}
            />
            <StatusRow
              label="Base URL"
              value={ai.baseUrl || "AI_BASE_URL not set"}
              ok={isConfigured(ai.baseUrl)}
            />
            <StatusRow label="API key" value={mask(ai.apiKey)} ok={isConfigured(ai.apiKey)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
              <Database className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">Infrastructure</CardTitle>
              <CardDescription>PostgreSQL and app origin.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <StatusRow
              label="Database"
              value={isConfigured(databaseUrl) ? "DATABASE_URL is set" : "DATABASE_URL not set"}
              ok={isConfigured(databaseUrl)}
            />
            <StatusRow label="App URL" value={appUrl} ok={isConfigured(appUrl)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
              <Palette className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Switch between light and dark themes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-0">
            <p className="text-sm text-muted-foreground">Theme is remembered on this device.</p>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="bg-card/60">
          <CardHeader className="flex-row items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
              <KeyRound className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">Credentials</CardTitle>
              <CardDescription>How login details are handled during a run.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Credentials entered for a run are used only for that session and are never persisted in
            plain text. Secret storage lands with the agent in a later phase.
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
