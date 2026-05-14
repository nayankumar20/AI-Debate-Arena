/**
 * Deterministic demo copy when OpenRouter is unavailable — keeps the debate flowing.
 * Styled to match the live UI: short paragraphs + **highlights**.
 */

const OPENERS_A = [
  `Here’s the core claim in one breath: **this resolution is workable** because the upside is concentrated and the downside is containable.\n\nSecond beat: the scary stories assume worst-case rollout. The right comparison is **a disciplined pilot**, not fantasy perfection.\n\nIf you only remember one thing: **measure outcomes early** — or we’re debating ghosts, not plans.`,
  `Opening stance: **the burden is on the skeptic** to show a realistic failure mode, not a vibes-based veto.\n\nI’ll make it concrete: incentives, feedback loops, and a rollback switch. That trio is what makes this topic **boring-in-a-good-way** — boring systems ship.\n\nPushback welcome — but tie it to **a specific mechanism**, not generalized caution.`,
  `Side A starts hot but honest: **we can defend this without hand-waving**.\n\nThe affirmative isn’t “trust the magic box.” It’s **trust the audit trail + staged exposure + human choke points** where it matters.\n\nSo the debate should land on tradeoffs, not theater — and I’m ready to name mine.`,
];

const REBUTTALS_B = [
  `Hold on — Side A smuggled in **“disciplined pilot”** like it’s free. Pilots cost money, attention, and political capital.\n\nMy first cut: **coordination tax**. The plan understates how often “staged rollout” becomes permanent limbo.\n\nAsk yourself: **who pays when the monitor blinks**? If you can’t answer that in one sentence, the rebuttal lands.`,
  `I’m not vetoing optimism — I’m attacking **hidden assumptions**.\n\nSide A leaned on incentives without naming **data quality, latency, or misuse** — the unglamorous trio that kills pretty diagrams.\n\nHere’s the challenge: show me **a falsifiable checkpoint** in week six, not a roadmap moodboard.`,
  `Counter: “upside concentrated” can still be **ethically lopsided** if benefits accrue to a narrow cohort.\n\nI want Side A to engage **distribution** — who gets lifted, who gets surveilled, who gets blamed when it drifts.\n\nUntil then, I’m treating the thesis as **underspecified**, not disproven.`,
];

const DEEP_A = [
  `Round push: Side B wants mechanisms — fair. Here’s mine: **a tight OODA loop** — observe, decide, act, audit — with public metrics.\n\nOn “coordination tax”: yes — which is why we **cap surface area** and expand only on evidence, not hype.\n\nIf B’s critique is “people are imperfect,” I agree — and that’s why we **design for imperfection**, not pretend it away.`,
  `Let me tighten the causal chain: **constraints → selection pressure → robustness**.\n\nB’s “limbo” risk is real — so we bake in **sunset clauses** and automatic reviews tied to measurable harm, not vibes.\n\nNet: I’m not asking for faith — I’m asking for **a controlled bet** with a kill switch.`,
];

const DEEP_B = [
  `Deepening the cross: **sunset clauses sound lovely** until politics freezes the sunset.\n\nInstitutions drift — so “automatic review” becomes checkbox theater unless **power competes with power** (adversarial audits, rival teams, leak-safe channels).\n\nMy ask stays: show me **who gets fired** when metrics rot — otherwise it’s a TED talk.`,
  `I’ll be blunt: **bounded downside** stories often hide correlated failures — the kind where everything breaks together.\n\nSide A’s loop is cute on a whiteboard; in the wild, monitors blink late, blame migrates, and users absorb harm.\n\nSo yes — I want **a falsifiable week-six checkpoint**, but I also want **a credible enforcement story**, not vibes.`,
];

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function hashSeed(topic, round, side) {
  let h = 0;
  const s = `${topic}|${round}|${side}`;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function buildFallbackTurn({ topic, side, round, priorTurn }) {
  const seed = hashSeed(topic, round, side);
  const topicLine = `Topic: “${topic}”.`;

  if (side === 'A') {
    if (round === 1) {
      return `${topicLine}\n\n${pick(OPENERS_A, seed)}`;
    }
    return `${topicLine}\n\nRound ${round} — Side A answers the heat.\n\n${pick(DEEP_A, seed)}`;
  }

  const opponentLine = priorTurn?.content
    ? `They just said (excerpt): “${priorTurn.content.slice(0, 280)}${priorTurn.content.length > 280 ? '…' : ''}”\n\n`
    : '';

  if (round === 1) {
    return `${topicLine}\n\n${opponentLine}${pick(REBUTTALS_B, seed)}`;
  }
  return `${topicLine}\n\nRound ${round} — Side B keeps the pressure on.\n\n${opponentLine}${pick(DEEP_B, seed)}`;
}
