/** Curated OpenRouter slugs — keep in sync with frontend `constants/aiModels.ts`. */
export const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', family: 'GPT' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', family: 'Claude' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', family: 'Gemini' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', family: 'DeepSeek' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', family: 'Llama' },
];

export function getModelLabel(modelId) {
  return OPENROUTER_MODELS.find((m) => m.id === modelId)?.label ?? modelId;
}

export function assertValidModelId(modelId) {
  if (!OPENROUTER_MODELS.some((m) => m.id === modelId)) {
    const err = new Error('Invalid model selection');
    err.statusCode = 400;
    throw err;
  }
}

/** Short style cue so different model families keep distinct debating voices. */
export function getModelVoiceHint(modelId) {
  const id = String(modelId).toLowerCase();
  if (id.includes('gpt')) {
    return 'Voice: plainspoken, analogy-forward, confident — short hooks, then evidence. Avoid essay tone.';
  }
  if (id.includes('claude')) {
    return 'Voice: calm, surgical, humane skepticism — name the tradeoff, then the consequence. No theatrics.';
  }
  if (id.includes('gemini')) {
    return 'Voice: fast, pattern-led, slightly playful — vary cadence; crisp contrasts over dense prose.';
  }
  if (id.includes('deepseek')) {
    return 'Voice: tight logical steps, minimal adjectives — occasional sharp one-liner is welcome.';
  }
  if (id.includes('llama')) {
    return 'Voice: direct, frontier-frank, builder-minded — practical stakes first.';
  }
  return 'Voice: distinct human debater — punchy, timeboxed, never a lecture.';
}
