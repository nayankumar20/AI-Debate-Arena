/**
 * Deterministic judge when OpenRouter fails — JSON-shaped output aligned with judgeService.
 */

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function buildFallbackJudgeEvaluation(debate) {
  const topic = debate.topic || '';
  const seed = hashSeed(`${topic}|${debate.turns?.length ?? 0}`);
  const aChars = (debate.turns || []).filter((t) => t.side === 'A').reduce((s, t) => s + (t.content?.length || 0), 0);
  const bChars = (debate.turns || []).filter((t) => t.side === 'B').reduce((s, t) => s + (t.content?.length || 0), 0);
  const aFb = (debate.turns || []).some((t) => t.side === 'A' && t.usedFallback);
  const bFb = (debate.turns || []).some((t) => t.side === 'B' && t.usedFallback);

  let winner = 'tie';
  if (aChars + bChars > 0) {
    const bias = (seed % 7) - 3;
    const score = aChars - bChars + bias * 40;
    if (score > 120) winner = 'A';
    else if (score < -120) winner = 'B';
    else if (aFb && !bFb) winner = 'B';
    else if (bFb && !aFb) winner = 'A';
    else winner = seed % 2 === 0 ? 'A' : 'B';
  }

  const baseA = 6 + (seed % 3);
  const baseB = 6 + ((seed >> 2) % 3);
  const logicA = clamp(winner === 'A' ? baseA + 1 : baseA, 4, 9);
  const logicB = clamp(winner === 'B' ? baseB + 1 : baseB, 4, 9);
  const clarityA = clamp(logicA + (seed % 2) - 1, 4, 9);
  const clarityB = clamp(logicB + ((seed >> 1) % 2) - 1, 4, 9);

  return {
    status: 'complete',
    winner,
    summary: `Demo judge: compared argument density and resilience on “${topic.slice(0, 80)}${topic.length > 80 ? '…' : ''}”.`,
    reasoning: `Fallback evaluation (OpenRouter unavailable). Side A cumulative length ${aChars}, Side B ${bChars}. Tie-break uses lightweight heuristics — treat as entertainment, not legal advice.`,
    scores: {
      logic: { A: logicA, B: logicB },
      clarity: { A: clarityA, B: clarityB },
      relevance: { A: clamp(6 + (seed % 4), 4, 9), B: clamp(6 + ((seed >> 3) % 4), 4, 9) },
      persuasiveness: { A: clamp(6 + ((seed >> 4) % 4), 4, 9), B: clamp(6 + ((seed >> 5) % 4), 4, 9) },
    },
    usedFallback: true,
    evaluatedAt: new Date(),
  };
}
