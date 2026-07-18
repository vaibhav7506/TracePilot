import { createOpenAiCompatibleAdapter } from "@/lib/ai/providers/openai";

export const groqAdapter = createOpenAiCompatibleAdapter("https://api.groq.com/openai/v1", "groq");
