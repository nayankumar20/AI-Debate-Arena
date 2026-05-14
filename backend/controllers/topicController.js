import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openRouterChat } from '../services/openRouterService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticPath = path.join(__dirname, '../data/topicRecommendations.json');

let cachedStatic = null;

function loadStatic() {
  if (!cachedStatic) {
    const raw = fs.readFileSync(staticPath, 'utf8');
    cachedStatic = JSON.parse(raw);
  }
  return cachedStatic;
}

/** For Arena Pulse / internal composition (no HTTP). */
export function readTopicCatalog() {
  return loadStatic();
}

export async function getTopicSuggestions(_req, res) {
  const data = loadStatic();
  res.json({
    success: true,
    categories: data.categories,
    trending: data.trending,
    popular: data.popular,
    controversial: data.controversial,
  });
}

/**
 * Optional: asks OpenRouter for a few fresh debate prompts and returns them
 * without persisting (keeps curated JSON as source of truth).
 */
export async function refreshTopicIdeas(req, res) {
  const model = process.env.TOPIC_SUGGEST_MODEL || 'openai/gpt-4o-mini';
  const prompt = `Return exactly 5 short debate resolution prompts (one line each, max 140 chars), diverse and provocative, no numbering. Topics only.`;

  try {
    const raw = await openRouterChat({
      model,
      messages: [
        { role: 'system', content: 'You output only plain lines, no bullets.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 320,
    });
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^\d+[\).\s]+/, '').trim())
      .filter((l) => l.length > 8)
      .slice(0, 5)
      .map((topic) => ({ topic, category: 'Technology', blurb: 'AI-generated' }));

    res.json({ success: true, generated: lines });
  } catch (err) {
    res.status(502).json({
      success: false,
      message: err.message || 'Unable to refresh topics',
      code: err.code,
    });
  }
}
