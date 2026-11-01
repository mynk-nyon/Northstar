import {
  LLMProvider,
  SimulationNarrativeInput,
  SimulationNarrativeOutput,
  VendorDraftInput,
  VendorDraftOutput,
} from "@/lib/ai/types";
import { DeterministicRuleBasedPlanner } from "@/lib/ai/deterministic-planner";
import {
  SimulationNarrativeOutputSchema,
  VendorDraftOutputSchema,
} from "@/lib/ai/schemas";
import {
  SYSTEM_PROMPT_SIMULATION,
  SYSTEM_PROMPT_VENDOR,
  buildSimulationPrompt,
  buildVendorPrompt,
} from "@/lib/ai/prompts";
import {
  validateAndCorrectNarrativeOutput,
  validateAndCorrectVendorDraft,
} from "@/lib/ai/validator";

/**
 * OpenAI-compatible implementation of LLMProvider with automatic schema validation,
 * repair retry, and fallback to the deterministic rule-based planner.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  public readonly providerName = "OpenAI-Compatible LLM Provider";
  public readonly isDemoMode = false;

  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private fallbackPlanner: DeterministicRuleBasedPlanner;

  constructor(apiKey: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.model = model || process.env.LLM_MODEL || "gpt-4o-mini";
    this.baseUrl = (baseUrl || process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    this.fallbackPlanner = new DeterministicRuleBasedPlanner();
  }

  private async callChatCompletion(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    timeoutMs: number = 8000
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.2, // Low temperature for deterministic adherence
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content returned in OpenAI response choices");
      }
      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateSimulationNarrative(
    input: SimulationNarrativeInput
  ): Promise<SimulationNarrativeOutput> {
    const prompt = buildSimulationPrompt(input);
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT_SIMULATION },
      { role: "user", content: prompt },
    ];

    try {
      const rawJson = await this.callChatCompletion(messages);
      let parsed = JSON.parse(rawJson);
      let validation = SimulationNarrativeOutputSchema.safeParse(parsed);

      // Retry once with repair prompt on schema failure
      if (!validation.success) {
        console.warn("LLM output schema failure. Retrying with repair prompt...", validation.error.format());
        const repairMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          ...messages,
          { role: "assistant", content: rawJson },
          {
            role: "user",
            content: `Schema validation failed: ${JSON.stringify(
              validation.error.issues
            )}. Please output strictly valid JSON matching the required schema.`,
          },
        ];
        const repairJson = await this.callChatCompletion(repairMessages);
        parsed = JSON.parse(repairJson);
        validation = SimulationNarrativeOutputSchema.safeParse(parsed);
      }

      if (validation.success) {
        // Enforce deterministic math verification
        return validateAndCorrectNarrativeOutput(validation.data, input.consequenceReport);
      }

      console.warn("Repair attempt failed. Gracefully falling back to rule-based planner.");
      return this.fallbackPlanner.generateSimulationNarrative(input);
    } catch (err) {
      console.warn("LLM API call failed or timed out. Falling back to rule-based planner:", err);
      return this.fallbackPlanner.generateSimulationNarrative(input);
    }
  }

  public async generateVendorDraft(
    input: VendorDraftInput
  ): Promise<VendorDraftOutput> {
    const prompt = buildVendorPrompt(input);
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT_VENDOR },
      { role: "user", content: prompt },
    ];

    try {
      const rawJson = await this.callChatCompletion(messages);
      let parsed = JSON.parse(rawJson);
      let validation = VendorDraftOutputSchema.safeParse(parsed);

      if (!validation.success) {
        console.warn("Vendor draft schema failure. Retrying with repair prompt...");
        const repairMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          ...messages,
          { role: "assistant", content: rawJson },
          {
            role: "user",
            content: `Schema validation failed: ${JSON.stringify(
              validation.error.issues
            )}. Please output strictly valid JSON.`,
          },
        ];
        const repairJson = await this.callChatCompletion(repairMessages);
        parsed = JSON.parse(repairJson);
        validation = VendorDraftOutputSchema.safeParse(parsed);
      }

      if (validation.success) {
        return validateAndCorrectVendorDraft(
          validation.data,
          input.budgetCeiling,
          input.currency
        );
      }

      return this.fallbackPlanner.generateVendorDraft(input);
    } catch (err) {
      console.warn("LLM vendor draft failed. Falling back to rule-based planner:", err);
      return this.fallbackPlanner.generateVendorDraft(input);
    }
  }
}

/**
 * Factory that returns the configured LLMProvider.
 * If OPENAI_API_KEY is not configured, automatically selects DeterministicRuleBasedPlanner.
 */
export function getLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return new DeterministicRuleBasedPlanner();
  }
  return new OpenAICompatibleProvider(apiKey);
}
