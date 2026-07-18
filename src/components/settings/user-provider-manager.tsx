"use client";

import { Check, KeyRound, Loader2, PlugZap, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError } from "@/components/dashboard/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createUserApiKeySchema } from "@/lib/validations/byok";
import { fieldErrors } from "@/lib/validations";

type Provider = "openai" | "groq" | "anthropic" | "gemini";
type KeyMetadata = {
  id: string;
  provider: Provider;
  keyPreview: string;
  model: string;
  baseUrl: string | null;
  isDefault: boolean;
};

const providers: Array<{ id: Provider; label: string; hint: string }> = [
  { id: "openai", label: "OpenAI", hint: "GPT and compatible models" },
  { id: "groq", label: "Groq", hint: "Fast hosted inference" },
  { id: "anthropic", label: "Anthropic", hint: "Claude models" },
  { id: "gemini", label: "Gemini", hint: "Google Gemini models" },
];

export function UserProviderManager() {
  const formRef = useRef<HTMLFormElement>(null);
  const [keys, setKeys] = useState<KeyMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/user-api-keys", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as {
      data?: { keys?: KeyMetadata[] };
      error?: string;
    };
    if (response.ok) setKeys(body.data?.keys ?? []);
    else setFormError(body.error ?? "Could not load connected providers.");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    const parsed = createUserApiKeySchema.safeParse({ ...raw, isDefault: raw.isDefault === "on" });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError(null);
    setMessage(null);
    setBusy("save");
    try {
      const response = await fetch("/api/user-api-keys", {
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
        setFormError(body.fields ? null : (body.error ?? "Could not save the key."));
        return;
      }
      form.reset();
      setMessage("Provider key encrypted and saved.");
      await load();
    } catch {
      setFormError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function action(key: KeyMetadata, kind: "test" | "default" | "delete") {
    if (kind === "delete" && !window.confirm(`Delete the saved ${key.provider} key?`)) return;
    setBusy(`${kind}:${key.id}`);
    setFormError(null);
    setMessage(null);
    const response = await fetch(
      kind === "test" ? "/api/user-api-keys/test" : `/api/user-api-keys/${key.id}`,
      kind === "test"
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: key.id }),
          }
        : kind === "default"
          ? {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isDefault: true }),
            }
          : { method: "DELETE" },
    );
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) setFormError(body.error ?? `Could not ${kind} this provider.`);
    else {
      setMessage(
        kind === "test"
          ? "Connection succeeded."
          : kind === "default"
            ? "Default provider updated."
            : "Provider key deleted.",
      );
      await load();
    }
    setBusy(null);
  }

  function prepareReplace(key: KeyMetadata) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("provider") as HTMLSelectElement).value = key.provider;
    (form.elements.namedItem("model") as HTMLInputElement).value = key.model;
    (form.elements.namedItem("baseUrl") as HTMLInputElement).value = key.baseUrl ?? "";
    (form.elements.namedItem("apiKey") as HTMLInputElement).focus();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Connected providers</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Your AI providers</h2>
          </div>
          <Badge variant="outline">
            <ShieldCheck className="h-3 w-3" /> Server encrypted
          </Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {providers.map((provider) => {
            const key = keys.find((item) => item.provider === provider.id);
            return (
              <Card
                key={provider.id}
                className={cn("overflow-hidden", key?.isDefault && "border-primary/30")}
              >
                {key?.isDefault ? <div className="h-1 bg-primary" /> : null}
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{provider.label}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{provider.hint}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={key ? "neutral" : "muted"}>
                      {key ? "Connected" : "Not connected"}
                    </Badge>
                    {key?.isDefault ? <Badge variant="ruby">Default</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {loading ? (
                    <div className="h-14 animate-pulse rounded bg-muted" />
                  ) : key ? (
                    <>
                      <dl className="grid gap-2 text-xs">
                        <Meta label="Key" value={key.keyPreview} mono />
                        <Meta label="Model" value={key.model} />
                        <Meta label="Base URL" value={key.baseUrl || "Provider default"} />
                      </dl>
                      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => action(key, "test")}
                          disabled={Boolean(busy)}
                        >
                          {busy === `test:${key.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlugZap className="h-3.5 w-3.5" />
                          )}
                          Test
                        </Button>
                        {!key.isDefault ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => action(key, "default")}
                            disabled={Boolean(busy)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Set default
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => prepareReplace(key)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary"
                          onClick={() => action(key, "delete")}
                          disabled={Boolean(busy)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add a key below to use this provider for AI analysis and generated tests.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="overflow-hidden border-primary/15">
        <div className="h-1 bg-primary" />
        <CardHeader>
          <p className="eyebrow">Add or replace</p>
          <CardTitle className="mt-1">Provider key</CardTitle>
          <p className="text-sm text-muted-foreground">
            Saving the same provider replaces its encrypted credential. The original key is never
            returned.
          </p>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={save} noValidate className="grid gap-5 md:grid-cols-2">
            <Field label="Provider" htmlFor="byok-provider" error={errors.provider}>
              <select
                id="byok-provider"
                name="provider"
                defaultValue="openai"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model" htmlFor="byok-model" error={errors.model}>
              <Input
                id="byok-model"
                name="model"
                placeholder="Model identifier"
                autoComplete="off"
              />
            </Field>
            <Field label="API key" htmlFor="byok-key" error={errors.apiKey}>
              <Input
                id="byok-key"
                name="apiKey"
                type="password"
                autoComplete="new-password"
                placeholder="Stored encrypted, never displayed again"
              />
            </Field>
            <Field label="Base URL" hint="optional" htmlFor="byok-base-url" error={errors.baseUrl}>
              <Input
                id="byok-base-url"
                name="baseUrl"
                type="url"
                placeholder="Use provider default"
              />
            </Field>
            <label className="flex items-center gap-3 text-sm text-muted-foreground md:col-span-2">
              <input type="checkbox" name="isDefault" className="h-4 w-4 accent-primary" />
              Use as my default AI provider
            </label>
            <div className="space-y-3 md:col-span-2">
              <FormError message={formError} />
              {message ? (
                <p
                  role="status"
                  className="rounded-md border border-primary/20 bg-primary/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  {message}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end border-t border-border pt-5 md:col-span-2">
              <Button type="submit" disabled={Boolean(busy)}>
                {busy === "save" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Encrypt and save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("max-w-[68%] truncate text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
