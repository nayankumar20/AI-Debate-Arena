const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * @param {{ model: string; messages: { role: string; content: string }[]; maxTokens?: number }} opts
 * @returns {Promise<string>}
 */
export async function openRouterChat({ model, messages, maxTokens = 420 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENROUTER_API_KEY is not configured');
    err.code = 'NO_OPENROUTER_KEY';
    throw err;
  }

  const referer = process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:5173';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'AI Debate Arena',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.72,
      max_tokens: maxTokens,
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    const err = new Error(`OpenRouter HTTP ${res.status}: ${rawText.slice(0, 280)}`);
    err.code = 'OPENROUTER_HTTP_ERROR';
    throw err;
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    const err = new Error('OpenRouter returned non-JSON');
    err.code = 'OPENROUTER_BAD_JSON';
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    const err = new Error('OpenRouter returned an empty completion');
    err.code = 'OPENROUTER_EMPTY';
    throw err;
  }

  return content;
}
