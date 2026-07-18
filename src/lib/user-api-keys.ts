import type { UserApiKey } from "@prisma/client";

export type SafeUserApiKey = Pick<
  UserApiKey,
  "id" | "provider" | "keyPreview" | "model" | "baseUrl" | "isDefault" | "createdAt" | "updatedAt"
>;

export const safeUserApiKeySelect = {
  id: true,
  provider: true,
  keyPreview: true,
  model: true,
  baseUrl: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;
