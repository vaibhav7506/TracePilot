import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { maskSecret } from "./mask-secret";

const VERSION = "v1";

export class EncryptionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionConfigurationError";
  }
}

function encryptionKey(): Buffer {
  const configured = process.env.APP_ENCRYPTION_KEY?.trim();
  if (!configured) {
    throw new EncryptionConfigurationError(
      "APP_ENCRYPTION_KEY is required before encrypted BYOK operations can be used.",
    );
  }
  const encoding = /^[a-f\d]{64}$/i.test(configured) ? "hex" : "base64";
  const key = Buffer.from(configured, encoding);
  if (key.length !== 32) {
    throw new EncryptionConfigurationError(
      "APP_ENCRYPTION_KEY must contain exactly 32 bytes encoded as hex or base64.",
    );
  }
  return key;
}

/** Encrypt a future BYOK secret with AES-256-GCM authenticated encryption. */
export function encryptSecret(secret: string): string {
  if (!secret) throw new Error("Secret must not be empty.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/** Decrypt a value produced by encryptSecret, rejecting modified ciphertext. */
export function decryptSecret(encryptedSecret: string): string {
  const [version, ivValue, tagValue, ciphertextValue, ...extra] = encryptedSecret.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue || extra.length > 0) {
    throw new Error("Encrypted secret has an invalid format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export { maskSecret };
