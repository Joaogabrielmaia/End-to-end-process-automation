import { FallbackExtractionProvider, LlmExtractionProvider } from "./llm";
import type { ExtractionProvider } from "./provider";
import { RulesExtractionProvider } from "./rules";

export * from "./provider";
export { RulesExtractionProvider } from "./rules";
export { FixtureExtractionProvider } from "./fixture";
export { LlmExtractionProvider, FallbackExtractionProvider } from "./llm";

export function createExtractionProvider(env: NodeJS.ProcessEnv = process.env): ExtractionProvider {
  const rules = new RulesExtractionProvider();
  if (env.EXTRACTION_PROVIDER === "rules+llm" && env.ANTHROPIC_API_KEY) {
    return new FallbackExtractionProvider(rules, new LlmExtractionProvider(env.ANTHROPIC_API_KEY));
  }
  return rules;
}
