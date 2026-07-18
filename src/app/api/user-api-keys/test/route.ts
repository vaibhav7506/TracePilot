import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";
import { generateStructuredObject } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/current-user";
import { decryptSecret } from "@/lib/security/encryption";
import { prisma } from "@/lib/prisma";
import { testUserApiKeySchema } from "@/lib/validations/byok";
import { fieldErrors } from "@/lib/validations";
import { assertPubliclyResolvedUrl } from "@/lib/runner/network-guard";

const responseSchema = z.object({ ok: z.literal(true) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const parsed = testUserApiKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError("Check the connection fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  try {
    let config: {
      provider: "openai" | "groq" | "anthropic" | "gemini";
      model: string;
      apiKey: string;
      baseUrl?: string;
    };
    if (parsed.data.id) {
      const saved = await prisma.userApiKey.findFirst({
        where: { id: parsed.data.id, userId: user.id },
        select: { provider: true, model: true, encryptedApiKey: true, baseUrl: true },
      });
      if (!saved) return apiError("Provider key not found.", 404);
      config = {
        provider: saved.provider,
        model: saved.model,
        apiKey: decryptSecret(saved.encryptedApiKey),
        baseUrl: saved.baseUrl ?? undefined,
      };
    } else {
      config = {
        provider: parsed.data.provider!,
        model: parsed.data.model!,
        apiKey: parsed.data.apiKey!,
        baseUrl: parsed.data.baseUrl,
      };
    }
    if (config.baseUrl) await assertPubliclyResolvedUrl(config.baseUrl);
    const result = await generateStructuredObject({
      ...config,
      systemPrompt: "Return only strict JSON matching the requested schema.",
      userPrompt: 'Connection check. Return exactly {"ok":true}.',
      schema: responseSchema,
      temperature: 0,
      maxTokens: 40,
    });
    return apiSuccess({ provider: result.provider, model: result.model, connected: true });
  } catch {
    return apiError("Connection test failed. Verify the key, model, and provider endpoint.", 400);
  }
}
