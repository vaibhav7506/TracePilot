import {
  Bot,
  Check,
  Clock3,
  Code2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MonitorCog,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProviderTestButton } from "@/components/settings/provider-test-button";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { env, isConfigured } from "@/lib/env";
import { getPlatformSettings } from "@/lib/settings/config";
import {
  getAllProviderDisplays,
  providerSchema,
  type ProviderConfigurationStatus,
} from "@/lib/settings/provider-config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings",
  description: "Provider health, runner safety, test generation, and appearance configuration.",
};

const statusLabels: Record<ProviderConfigurationStatus, string> = {
  connected: "Connected",
  "missing-key": "Missing key",
  "missing-model": "Missing model",
  "invalid-configuration": "Invalid configuration",
};

function ToggleRow({
  label,
  description,
  enabled,
  icon: Icon,
}: {
  label: string;
  description: string;
  enabled: boolean;
  icon: typeof Check;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background/50 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${enabled ? "border-primary/35 bg-primary/20" : "border-border bg-muted"}`}
        aria-label={`${label}: ${enabled ? "enabled" : "disabled"}`}
      >
        <span
          className={`absolute top-0.5 grid h-4 w-4 place-items-center rounded-full transition-all ${enabled ? "left-[1.35rem] bg-primary text-primary-foreground" : "left-0.5 bg-muted-foreground/50 text-background"}`}
        >
          {enabled ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
        </span>
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const providers = getAllProviderDisplays();
  const { runner, testGeneration } = getPlatformSettings();
  const activeName = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const activeProviderValid = providerSchema.safeParse(activeName).success;
  const encryptionReady = isConfigured(process.env.APP_ENCRYPTION_KEY);

  return (
    <Section spacing="md">
      <SectionHeader
        eyebrow="Platform control center"
        title="Settings"
        description="Inspect server-side provider health, browser safety policy, test generation coverage, and local appearance. Environment secrets remain server-only."
        actions={<ThemeToggle />}
      />

      {!activeProviderValid ? (
        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/[0.06] p-5">
          <p className="font-medium text-primary">Invalid AI_PROVIDER configuration</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use openai, groq, anthropic, or gemini in the server environment.
          </p>
        </div>
      ) : null}

      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Platform AI</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Provider configuration</h2>
          </div>
          <Badge variant="outline">Environment managed</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Platform keys are configured through environment variables and remain read-only here. Your
          encrypted user-level credentials are managed separately.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/settings/providers">
            <KeyRound className="h-4 w-4" />
            Manage encrypted BYOK
          </Link>
        </Button>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {providers.map((provider) => {
            const ready = provider.status === "connected";
            return (
              <Card
                key={provider.provider}
                className={`overflow-hidden transition-colors hover:border-primary/20 ${provider.active ? "border-primary/30" : ""}`}
              >
                {provider.active ? <div className="h-1 bg-primary" /> : null}
                <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/70">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/55 font-display text-sm font-semibold text-primary">
                      {provider.label.slice(0, 2)}
                    </span>
                    <div>
                      <CardTitle className="text-base">{provider.label}</CardTitle>
                      <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">
                        {provider.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {provider.active ? <Badge variant="ruby">Active</Badge> : null}
                    <Badge
                      variant={
                        ready
                          ? "neutral"
                          : provider.status === "invalid-configuration"
                            ? "ruby"
                            : "muted"
                      }
                    >
                      {statusLabels[provider.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <ConfigValue label="Model" value={provider.model || "Not configured"} />
                  <ConfigValue
                    label="Base URL"
                    value={provider.baseUrl || "Default provider endpoint"}
                  />
                  <ConfigValue
                    label="API key"
                    value={provider.hasApiKey ? "Configured · hidden" : "Not configured"}
                    secret={provider.hasApiKey}
                  />
                  <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
                    <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                      Health checks run server-side and never return or log credentials.
                    </p>
                    <ProviderTestButton provider={provider.provider} disabled={!ready} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-10 grid items-start gap-6 xl:grid-cols-2">
        <section>
          <div>
            <p className="eyebrow">Browser policy</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Runner settings</h2>
          </div>
          <Card className="mt-4">
            <CardHeader className="border-b border-border/70">
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Max steps" value={String(runner.maxSteps)} />
                <Metric label="Max runtime" value={`${Math.round(runner.maxRuntimeMs / 1000)}s`} />
                <Metric
                  label="Nav timeout"
                  value={`${Math.round(runner.navigationTimeoutMs / 1000)}s`}
                />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-1 pt-0">
              <ToggleRow
                label="Screenshot capture"
                description="Save visual evidence after each browser action."
                enabled={runner.captureScreenshots}
                icon={Eye}
              />
              <ToggleRow
                label="Console error capture"
                description="Record uncaught exceptions and console error signals."
                enabled={runner.captureConsoleErrors}
                icon={Code2}
              />
              <ToggleRow
                label="Network failure capture"
                description="Record failed requests and HTTP error responses."
                enabled={runner.captureNetworkFailures}
                icon={Network}
              />
              <ToggleRow
                label="Same-domain only"
                description="Prevent exploration from leaving the project hostname."
                enabled={runner.sameDomainOnly}
                icon={Route}
              />
              <ToggleRow
                label="Destructive action protection"
                description="Block purchase, deletion, transfer, checkout, and account mutation actions."
                enabled={runner.destructiveActionProtection}
                icon={ShieldCheck}
              />
              <ToggleRow
                label="Private network targets"
                description="Allowed only when explicitly enabled in development mode."
                enabled={runner.allowPrivateNetwork}
                icon={LockKeyhole}
              />
            </CardContent>
          </Card>
        </section>

        <section>
          <div>
            <p className="eyebrow">Regression output</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Test generation</h2>
          </div>
          <Card className="mt-4">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/50 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Playwright coverage policy</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied to AI output and deterministic fallback files.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-1 pt-0">
              <ToggleRow
                label="Smoke tests"
                description="Homepage availability and critical console health."
                enabled={testGeneration.includeSmokeTests}
                icon={MonitorCog}
              />
              <ToggleRow
                label="Navigation tests"
                description="Discovered important internal routes remain reachable."
                enabled={testGeneration.includeNavigationTests}
                icon={Route}
              />
              <ToggleRow
                label="Form tests"
                description="Required fields expose safe, visible validation behavior."
                enabled={testGeneration.includeFormTests}
                icon={Code2}
              />
              <ToggleRow
                label="Regression tests"
                description="High and critical findings receive targeted coverage where possible."
                enabled={testGeneration.includeRegressionTests}
                icon={Bot}
              />
            </CardContent>
          </Card>

          <Card className="mt-6 border-primary/20 bg-primary/[0.035]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Encrypted BYOK security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground">
                User-owned keys are encrypted with AES-256-GCM before storage and only decrypted
                server-side for a provider request. Platform fallback is an explicit deployment
                choice and is currently{" "}
                {process.env.ALLOW_PLATFORM_AI_FALLBACK === "true" ? "enabled" : "disabled"}.
              </p>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/35 px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">APP_ENCRYPTION_KEY</span>
                <Badge variant={encryptionReady ? "neutral" : "muted"}>
                  {encryptionReady ? "Configured" : "Not configured"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="mt-10">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Theme</h2>
        </div>
        <Card className="mt-4">
          <CardContent className="grid items-center gap-6 p-5 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/50 text-primary">
                  <MonitorCog className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">Interface preference</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose light, dark, or follow the operating system.
                  </p>
                </div>
              </div>
            </div>
            <ThemeSettings />
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <div>
          <p className="eyebrow">Infrastructure</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Runtime status</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Database className="h-4 w-4 text-primary" />
              <Badge variant={isConfigured(env.databaseUrl) ? "neutral" : "muted"}>
                {isConfigured(env.databaseUrl) ? "Configured" : "Missing"}
              </Badge>
            </div>
            <p className="mt-5 font-medium">PostgreSQL</p>
            <p className="mt-1 text-xs text-muted-foreground">DATABASE_URL remains server-only.</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Clock3 className="h-4 w-4 text-primary" />
              <Badge variant="outline">{env.appUrl}</Badge>
            </div>
            <p className="mt-5 font-medium">Application origin</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Used for server-generated absolute URLs.
            </p>
          </Card>
        </div>
      </section>
    </Section>
  );
}

function ConfigValue({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="eyebrow">{label}</span>
      <span className="flex max-w-[68%] items-center gap-1.5 truncate font-mono text-xs text-foreground">
        {secret ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : null}
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3 text-center">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="eyebrow mt-1">{label}</p>
    </div>
  );
}
