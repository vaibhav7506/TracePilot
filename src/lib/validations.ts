import { z } from "zod";

/**
 * Shared Zod schemas — used by API routes (authoritative) and by the client
 * forms (fast inline feedback). Keep messages user-facing: they render in the
 * UI verbatim.
 */

const httpUrl = z
  .string()
  .trim()
  .min(1, "Enter a URL.")
  .url("Enter a full URL, including https://.")
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "URL must start with http:// or https://.",
  })
  .refine((value) => value.length <= 2048, { message: "URL is too long." });

/** Treat empty strings from optional form inputs as "not provided". */
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name needs at least 2 characters.")
    .max(80, "Project name must be 80 characters or fewer."),
  baseUrl: httpUrl,
});

export const createRunSchema = z.object({
  projectId: z.string().trim().min(1, "Choose a project."),
  goal: z
    .string()
    .trim()
    .min(10, "Describe the goal in at least 10 characters.")
    .max(1000, "Keep the goal under 1,000 characters."),
  // Login context is optional and is NEVER persisted — see /api/runs.
  loginUrl: z.preprocess(emptyToUndefined, httpUrl.optional()),
  loginEmail: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Enter a valid email address.").optional(),
  ),
  loginPassword: z.preprocess(
    emptyToUndefined,
    z.string().min(1).max(256, "Password is too long.").optional(),
  ),
});

/**
 * Body for POST /api/runs/[id]/execute. All fields optional — the agent can run
 * without login. Credentials here are used ONLY to drive the browser for this
 * execution and are never stored or logged.
 */
export const executeRunSchema = z.object({
  loginUrl: z.preprocess(emptyToUndefined, httpUrl.optional()),
  loginEmail: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Enter a valid email address.").optional(),
  ),
  loginPassword: z.preprocess(
    emptyToUndefined,
    z.string().min(1).max(256, "Password is too long.").optional(),
  ),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateRunInput = z.infer<typeof createRunSchema>;
export type ExecuteRunInput = z.infer<typeof executeRunSchema>;

/** Flatten a ZodError into { field: message } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
