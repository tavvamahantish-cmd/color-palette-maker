import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const Input = z.object({ brief: z.string().trim().min(1).max(1000) });

const Schema = z.object({
  palettes: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      colors: z.array(z.object({ hex: z.string(), role: z.string() })),
    }),
  ),
});

export type HarmonyResult = z.infer<typeof Schema>;

const HEX = /^#[0-9a-fA-F]{6}$/;

export const generateHarmony = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; result: HarmonyResult } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };

    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        maxRetries: 0,
        output: Output.object({ schema: Schema }),
        system:
          "You are an expert colour designer. Given a colour, palette or design brief, create exactly 3 distinct, harmonious palettes (e.g. analogous, complementary, triadic, or mood-based). Each palette has 5 colours as 6-digit uppercase hex codes like #1A2B3C, with a short role (background, primary, accent, text, highlight). Ensure good text contrast. Names are 2-3 words; descriptions under 25 words.",
        prompt: data.brief,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      const palettes = out.palettes.slice(0, 3).map((p) => ({
        ...p,
        colors: p.colors.filter((c) => HEX.test(c.hex)).slice(0, 6),
      })).filter((p) => p.colors.length > 0);
      if (!palettes.length) return { ok: false, error: "The AI returned no usable colours. Try again." };
      return { ok: true, result: { palettes } };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        return { ok: false, error: "The AI response couldn't be read. Please try again." };
      }
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429) return { ok: false, error: "Too many requests right now — wait a moment and try again." };
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in workspace settings." };
      if (status === 403) return { ok: false, error: "AI access was denied for this request." };
      console.error(err);
      return { ok: false, error: "Something went wrong generating colours." };
    }
  });
