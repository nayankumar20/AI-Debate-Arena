export type AiModelOption = {
  id: string;
  label: string;
  family: string;
};

/** Keep aligned with `backend/config/aiModels.js` */
export const AI_MODELS: AiModelOption[] = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', family: 'GPT' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', family: 'Claude' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', family: 'Gemini' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', family: 'DeepSeek' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', family: 'Llama' },
];

export const ROUND_OPTIONS = [3, 5, 7] as const;
