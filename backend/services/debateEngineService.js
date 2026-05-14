import { openRouterChat } from './openRouterService.js';
import { buildFallbackTurn } from '../utils/fallbackDebate.js';
import { getModelLabel, getModelVoiceHint } from '../config/aiModels.js';
import { judgeToClient } from './judgeService.js';

function totalTurns(totalRounds) {
  return totalRounds * 2;
}

export function computeNextTurn(debate) {
  const n = debate.turns.length;
  const cap = totalTurns(debate.totalRounds);
  if (n >= cap) return null;
  const round = Math.floor(n / 2) + 1;
  const side = n % 2 === 0 ? 'A' : 'B';
  return { round, side };
}

function buildMessages({ debate, round, side }) {
  const topic = debate.topic;
  const modelForThisTurn = side === 'A' ? debate.sideAModelId : debate.sideBModelId;
  const modelLabel = side === 'A' ? debate.sideALabel || getModelLabel(modelForThisTurn) : debate.sideBLabel || getModelLabel(modelForThisTurn);
  const voice = getModelVoiceHint(modelForThisTurn);

  const prior = debate.turns
    .map(
      (t) =>
        `[R${t.round} | Side ${t.side} | ${t.modelLabel || t.modelId}]\n${t.content}`
    )
    .join('\n\n');

  const last = debate.turns.length ? debate.turns[debate.turns.length - 1] : null;
  const opponentJustSpoke = last && last.side !== side;

  const opponentAnchor =
    opponentJustSpoke && last
      ? [
          'IMMEDIATE PRIORITY — respond to what they *just* said (do not reset the topic):',
          `Opponent: Side ${last.side} (${last.modelLabel || last.modelId}), Round ${last.round}.`,
          `Their last message (verbatim excerpt, may truncate): """${last.content.slice(0, 1400)}${last.content.length > 1400 ? '…' : ''}"""`,
          'Open with 1–2 sentences that name their claim and either rebut it, qualify it, or flip the framing.',
        ].join('\n')
      : side === 'B'
        ? 'Side B: you are answering Side A in the same round — rebut their opening directly.'
        : 'Side A: set up a crisp thesis and one tangible stake — keep it inviting for a sharp cross-examination.';

  const system = [
    'You are in a LIVE timed debate (not a classroom essay).',
    'Hard format: 2–4 SHORT paragraphs total (each paragraph 1–3 sentences). No bullet lists unless absolutely necessary.',
    'Tone: conversational, energetic, slightly competitive — like a strong podcast debate segment.',
    'Do not write introductions like "In conclusion" or "Overall". Do not mention being an AI.',
    'You may use **double asterisks** to emphasize 1–3 short key phrases across the whole answer.',
    `You are ${modelLabel}. ${voice}`,
    'Stay roughly under ~170 words (shorter is better if you can keep the clash).',
  ].join(' ');

  const user = [
    `Topic: "${topic}".`,
    `Round ${round}. You are Side ${side}.`,
    opponentAnchor,
    prior ? `\nFull transcript so far (oldest → newest):\n${prior}` : '\nNo transcript yet (your opening).',
    side === 'A' && round > 1
      ? '\nSide A: extend your case but start by answering Side B’s strongest challenge from the last exchange.'
      : '',
    side === 'B'
      ? '\nSide B: be pointed — challenge mechanisms, incentives, or missing evidence. End with a memorable challenge question if it fits naturally.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    model: modelForThisTurn,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
}

/**
 * Produces the next turn content, never throws — falls back to demo text on any failure.
 */
export async function produceNextTurnContent(debate, { round, side }) {
  const priorB =
    side === 'B'
      ? [...debate.turns].reverse().find((t) => t.side === 'A' && t.round === round) ?? null
      : null;

  try {
    const { model, messages } = buildMessages({ debate, round, side });
    const text = await openRouterChat({ model, messages, maxTokens: 420 });
    return { content: text, usedFallback: false };
  } catch {
    const content = buildFallbackTurn({
      topic: debate.topic,
      side,
      round,
      priorTurn: priorB,
    });
    return { content, usedFallback: true };
  }
}

export function debateSummaryToClient(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const turns = o.turns || [];
  return {
    id: o._id.toString(),
    topic: o.topic,
    category: o.category || 'Technology',
    status: o.status,
    totalRounds: o.totalRounds,
    createdAt: o.createdAt,
    sideALabel: o.sideALabel || getModelLabel(o.sideAModelId),
    sideBLabel: o.sideBLabel || getModelLabel(o.sideBModelId),
    hasAnyFallback: turns.some((t) => Boolean(t.usedFallback)),
    judgeWinner: o.judgeEvaluation?.winner ?? null,
    judgeReady: o.judgeEvaluation?.status === 'complete',
  };
}

export function debateToClient(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id.toString(),
    topic: o.topic,
    category: o.category || 'Technology',
    sideAModelId: o.sideAModelId,
    sideBModelId: o.sideBModelId,
    sideALabel: o.sideALabel || getModelLabel(o.sideAModelId),
    sideBLabel: o.sideBLabel || getModelLabel(o.sideBModelId),
    totalRounds: o.totalRounds,
    turns: (o.turns || []).map((t) => ({
      id: t._id?.toString(),
      round: t.round,
      side: t.side,
      modelId: t.modelId,
      modelLabel: t.modelLabel,
      content: t.content,
      usedFallback: Boolean(t.usedFallback),
      completedAt: t.completedAt,
    })),
    hasAnyFallback: (o.turns || []).some((t) => Boolean(t.usedFallback)),
    judge: judgeToClient(o.judgeEvaluation),
    status: o.status,
    processing: Boolean(o.processing),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}
