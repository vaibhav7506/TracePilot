import { z } from "zod";
import { modelSchema, providerSchema } from "@/lib/settings/provider-config";
import { isPrivateHostname } from "@/lib/security/network-address";

const optionalBaseUrl = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? undefined : value),
  z
    .string()
    .trim()
    .url("Base URL must be a valid URL.")
    .max(2048)
    .superRefine((value, context) => {
      const url = new URL(value);
      if (url.protocol !== "https:") {
        context.addIssue({ code: "custom", message: "User provider base URLs must use HTTPS." });
      }
      if (url.username || url.password) {
        context.addIssue({ code: "custom", message: "Base URLs must not contain credentials." });
      }
      if (url.search || url.hash) {
        context.addIssue({ code: "custom", message: "Base URLs must not contain a query or hash." });
      }
      if (isPrivateHostname(url.hostname)) {
        context.addIssue({
          code: "custom",
          message: "Private and local provider endpoints are not allowed for user keys.",
        });
      }
    })
    .optional(),
);

export const apiKeySchema = z
  .string()
  .trim()
  .min(8, "API key is too short.")
  .max(4096, "API key is too long.");

export const createUserApiKeySchema = z.object({
  provider: providerSchema,
  model: modelSchema,
  apiKey: apiKeySchema,
  baseUrl: optionalBaseUrl,
  isDefault: z.boolean().default(false),
}).strict();

export const updateUserApiKeySchema = z
  .object({
    model: modelSchema.optional(),
    apiKey: apiKeySchema.optional(),
    baseUrl: optionalBaseUrl,
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "No changes supplied.",
  );

export const testUserApiKeySchema = z
  .object({
    id: z.string().trim().min(1).max(128).optional(),
    provider: providerSchema.optional(),
    model: modelSchema.optional(),
    apiKey: apiKeySchema.optional(),
    baseUrl: optionalBaseUrl,
  })
  .strict()
  .refine((value) => Boolean(value.id || (value.provider && value.model && value.apiKey)), {
    message: "Choose a saved provider or enter provider, model, and API key.",
  });
