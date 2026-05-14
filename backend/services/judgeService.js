import { openRouterChat } from './openRouterService.js';
import { buildFallbackJudgeEvaluation } from '../utils/fallbackJudge.js';
import { Debate } from '../models/Debate.js';

const JUDGE_MODEL = process.env.OPENROUTER_JUDGE_MODEL || 'openai/gpt-4o-mini';

function buildTranscript(debate) {
  return (debate.turns || [])
    .map(
      (t) =>
        `Round ${t.round} | Side ${t.side} | ${t.modelLabel || t.modelId}\n${t.content}`
    )
    .join('\n\n---\n\n');
}

function extractJsonObject(text) {
  const trimmed = String(text).trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeScores(raw) {
  const d = (v) => (typeof v === 'number' && !Number.isNaN(v) ? Math.max(0, Math.min(10, Math.round(v))) : 5);
  const pair = (obj) => ({
    A: d(obj?.A ?? obj?.a),
    B: d(obj?.B ?? obj?.b),
  });
  return {
    logic: pair(raw?.logic),
    clarity: pair(raw?.clarity),
    relevance: pair(raw?.relevance),
    persuasiveness: pair(raw?.persuasiveness),
  };
}

/**
 * Persists judge evaluation on the debate document.
 */
export async function evaluateAndSaveJudge(debateId) {
  const debate = await Debate.findById(debateId);
  if (!debate || debate.status !== 'completed') return;

  if (debate.judgeEvaluation?.status === 'complete') return;

  const transcript = buildTranscript(debate);
  const system = [
    'You are an impartial debate judge for an AI-vs-AI arena.',
    'Return ONLY valid JSON (no markdown fences, no commentary).',
    'JSON shape:',
    '{"winner":"A"|"B"|"tie","summary":"one tight paragraph","reasoning":"2-3 short paragraphs max","scores":{"logic":{"A":0-10,"B":0-10},"clarity":{"A":0-10,"B":0-10},"relevance":{"A":0-10,"B":0-10},"persuasiveness":{"A":0-10,"B":0-10}}}',
    'Score each side independently. Pick winner by overall strength; ties are allowed if genuinely close.',
  ].join(' ');

  const user = [
    `Topic: "${debate.topic}"`,
    `Side A model label: ${debate.sideALabel || debate.sideAModelId}`,
    `Side B model label: ${debate.sideBLabel || debate.sideBModelId}`,
    '',
    'Transcript:',
    transcript,
  ].join('\n');

  try {
    const raw = await openRouterChat({
      model: JUDGE_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      maxTokens: 700,
    });
    const parsed = extractJsonObject(raw);
    if (!parsed || !['A', 'B', 'tie'].includes(parsed.winner)) {
      throw new Error('Judge JSON invalid');
    }
    debate.judgeEvaluation = {
      status: 'complete',
      winner: parsed.winner,
      summary: String(parsed.summary || '').slice(0, 1200),
      reasoning: String(parsed.reasoning || '').slice(0, 4000),
      scores: normalizeScores(parsed.scores),
      usedFallback: false,
      evaluatedAt: new Date(),
    };
    await debate.save();
  } catch {
    const fb = buildFallbackJudgeEvaluation(debate);
    debate.judgeEvaluation = fb;
    await debate.save();
  }
}

export function judgeToClient(j) {
  if (!j || !j.status) return null;
  return {
    status: j.status,
    winner: j.winner,
    summary: j.summary,
    reasoning: j.reasoning,
    scores: j.scores,
    usedFallback: Boolean(j.usedFallback),
    evaluatedAt: j.evaluatedAt,
  };
}
