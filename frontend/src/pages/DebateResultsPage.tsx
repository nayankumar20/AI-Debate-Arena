import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DebateTurnCard } from '@/components/debate/DebateTurnCard';
import { getDebateApi, postDebateCommentApi, requestJudgeApi, voteDebateApi } from '@/services/debateService';
import { formatApiError } from '@/utils/errors';
import { exportDebatePdf } from '@/utils/exportDebatePdf';
import type { AudienceReaction, Debate, JudgeEvaluation } from '@/types/debate';
import { cn } from '@/utils/cn';

function totalTurns(d: Debate) {
  return d.totalRounds * 2;
}

function winnerLabel(w: string | undefined, aLabel: string, bLabel: string) {
  if (w === 'A') return `${aLabel} (Side A)`;
  if (w === 'B') return `${bLabel} (Side B)`;
  return 'Split decision — tie';
}

const REACTIONS: { id: AudienceReaction; emoji: string; label: string }[] = [
  { id: 'fire', emoji: '🔥', label: 'Strong argument' },
  { id: 'smart', emoji: '🧠', label: 'Smart rebuttal' },
  { id: 'insight', emoji: '💡', label: 'Insightful' },
  { id: 'bias', emoji: '🤖', label: 'AI bias' },
];

export function DebateResultsPage() {
  const { id } = useParams();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [judgeBusy, setJudgeBusy] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [voteSide, setVoteSide] = useState<'A' | 'B' | null>(null);
  const [comment, setComment] = useState('');
  const [threadComment, setThreadComment] = useState('');
  const [reaction, setReaction] = useState<AudienceReaction | null>(null);
  const judgeRequestedRef = useRef(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const d = await getDebateApi(id);
      setDebate(d);
      if (d.userVote) {
        setVoteSide(d.userVote.side);
        setComment(d.userVote.comment || '');
        setReaction(d.userVote.audienceReaction ?? null);
      } else {
        setReaction(null);
      }
    } catch (e) {
      setError(formatApiError(e, 'Unable to load debate'));
      setDebate(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id || !debate) return;
    const complete = debate.status === 'completed' && debate.turns.length >= totalTurns(debate);
    if (!complete) return;
    if (debate.judge?.status === 'complete') return;
    if (judgeRequestedRef.current >= 2) return;
    judgeRequestedRef.current += 1;
    setJudgeBusy(true);
    void requestJudgeApi(id)
      .then((d) => setDebate(d))
      .catch(() => {
        judgeRequestedRef.current -= 1;
      })
      .finally(() => setJudgeBusy(false));
  }, [debate, id]);

  const complete = debate ? debate.status === 'completed' && debate.turns.length >= totalTurns(debate) : false;

  const chartData = useMemo(() => {
    const j = debate?.judge;
    if (!j || j.status !== 'complete' || !j.scores) return [];
    const s = j.scores;
    return [
      { name: 'Logic', A: s.logic.A, B: s.logic.B },
      { name: 'Clarity', A: s.clarity.A, B: s.clarity.B },
      { name: 'Relevance', A: s.relevance.A, B: s.relevance.B },
      { name: 'Persuasion', A: s.persuasiveness.A, B: s.persuasiveness.B },
    ];
  }, [debate?.judge]);

  async function submitVote(side: 'A' | 'B') {
    if (!id) return;
    setVoteBusy(true);
    setError('');
    try {
      const d = await voteDebateApi(id, {
        side,
        comment: comment.trim(),
        audienceReaction: reaction ?? undefined,
      });
      setDebate(d);
      setVoteSide(side);
    } catch (e) {
      setError(formatApiError(e, 'Unable to save vote'));
    } finally {
      setVoteBusy(false);
    }
  }

  async function setAudienceReaction(next: AudienceReaction) {
    if (!id || !voteSide) {
      setError('Vote for Side A or B first — reactions attach to your pick.');
      return;
    }
    const prev = reaction;
    const toggled = prev === next ? null : next;
    setReaction(toggled);
    setVoteBusy(true);
    setError('');
    try {
      const d = await voteDebateApi(id, {
        side: voteSide,
        comment: comment.trim(),
        audienceReaction: toggled,
      });
      setDebate(d);
    } catch (e) {
      setError(formatApiError(e, 'Unable to save reaction'));
      setReaction(prev);
    } finally {
      setVoteBusy(false);
    }
  }

  async function submitThreadComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !threadComment.trim()) return;
    setCommentBusy(true);
    setError('');
    try {
      const d = await postDebateCommentApi(id, threadComment.trim());
      setDebate(d);
      setThreadComment('');
    } catch (err) {
      setError(formatApiError(err, 'Unable to post comment'));
    } finally {
      setCommentBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex min-h-[40vh] max-w-sm flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-300" />
          <p className="text-sm text-ink-muted">Preparing your results…</p>
        </div>
      </div>
    );
  }

  if (error && !debate) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          ← Dashboard
        </Link>
      </div>
    );
  }

  if (!debate || !id) return null;

  const judge: JudgeEvaluation | null = debate.judge;
  const judgeReady = judge?.status === 'complete';
  const totals = debate.voteSummary ?? { A: 0, B: 0, total: 0 };
  const eng = debate.engagement;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
          Results
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{debate.topic}</h1>
        <p className="mt-3 text-sm text-ink-muted sm:text-base">
          {debate.sideALabel} <span className="text-ink">vs</span> {debate.sideBLabel} · {debate.category ?? 'Technology'}{' '}
          · {debate.totalRounds} rounds · {debate.turns.length}/{totalTurns(debate)} turns
        </p>
      </motion.div>

      {complete && judgeReady ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            className="text-sm"
            onClick={() => {
              try {
                exportDebatePdf(debate);
              } catch (e) {
                setError(formatApiError(e, 'PDF export failed'));
              }
            }}
          >
            Download PDF transcript
          </Button>
        </div>
      ) : null}

      {!complete ? (
        <Card className="mt-8 border border-amber-200/70 bg-amber-50/60 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          This debate is still in progress or was interrupted. Open the live view to resume the sequence.
          <div className="mt-4">
            <Link to={`/debate/${id}`}>
              <Button className="px-4 py-2 text-sm">Open live debate</Button>
            </Link>
          </div>
        </Card>
      ) : debate.hasAnyFallback ? (
        <Card className="mt-8 border border-amber-200/70 bg-amber-50/60 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <span className="font-semibold">Resilience mode was used</span> — at least one turn used scripted fallback
          while the arena stayed live. Judge scores still reflect transcript quality.
        </Card>
      ) : (
        <Card className="mt-8 border border-emerald-200/70 bg-emerald-50/60 text-sm text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-50">
          <span className="font-semibold text-emerald-800 dark:text-emerald-100"></span> Debate session completed with live AI responses
          
        </Card>
      )}

      {complete && judgeBusy && !judgeReady ? (
        <Card className="mt-6 flex items-center gap-3 text-sm text-ink-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-300" />
          AI Judge is synthesizing scores and rationale…
        </Card>
      ) : null}

      {complete && eng ? (
        <Card className="mt-8">
          <h3 className="font-display text-lg font-semibold text-ink">Arena energy</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Heat blends votes, threaded comments, and reactions — same formula as your dashboard analytics.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ringline bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Heat score</p>
              <p className="mt-2 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-300">{eng.heatScore}</p>
            </div>
            <div className="rounded-2xl border border-ringline bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Thread comments</p>
              <p className="mt-2 font-display text-3xl font-bold text-ink">{eng.commentCount}</p>
            </div>
            <div className="rounded-2xl border border-ringline bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Reactions logged</p>
              <p className="mt-2 font-display text-3xl font-bold text-ink">
                {eng.reactionTotals.fire +
                  eng.reactionTotals.smart +
                  eng.reactionTotals.insight +
                  eng.reactionTotals.bias}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {complete && eng && judgeReady ? (
        <Card className="mt-6 border border-indigo-200/50 bg-indigo-50/40 dark:border-indigo-500/25 dark:bg-indigo-500/10">
          <h3 className="font-display text-lg font-semibold text-ink">Audience vs AI Judge</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">AI Judge winner</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {winnerLabel(eng.judgeVersusAudience.judgeWinner, debate.sideALabel, debate.sideBLabel)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Audience winner</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {eng.judgeVersusAudience.audienceWinner === 'tie'
                  ? 'Audience split'
                  : eng.judgeVersusAudience.audienceWinner === 'A'
                    ? `${debate.sideALabel} (Side A)`
                    : `${debate.sideBLabel} (Side B)`}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Verdict alignment:{' '}
            <span className="font-semibold text-ink">
              {eng.judgeVersusAudience.aligned ? 'Crowd and judge agree' : 'Crowd and judge disagree — rich signal.'}
            </span>
          </p>
        </Card>
      ) : null}

      {complete && judgeReady && judge ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative mt-8 overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-indigo-600 via-sky-500 to-violet-600 p-[1px] shadow-2xl dark:border-white/10"
          >
            <div className="rounded-[22px] bg-slate-950/90 px-6 py-8 text-white sm:px-10 sm:py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">AI Judge verdict</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                {winnerLabel(judge.winner, debate.sideALabel, debate.sideBLabel)}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">{judge.summary}</p>
              {judge.usedFallback ? (
                <p className="mt-4 text-xs text-amber-200/90">
                  Judge evaluation used offline scoring — the live evaluation path was unavailable for this summary.
                </p>
              ) : null}
            </div>
          </motion.div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="relative overflow-hidden p-0">
              <div className="border-b border-black/5 px-6 py-4 dark:border-white/10">
                <h3 className="font-display text-lg font-semibold text-ink">Score comparison</h3>
                <p className="text-xs text-ink-muted">1–10 per category · higher is stronger</p>
              </div>
              <div className="h-[320px] px-2 pb-4 pt-2 sm:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.35)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgb(99 102 241 / 0.08)' }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgb(226 232 240 / 0.4)',
                        background: 'rgba(15,23,42,0.92)',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="A" name={debate.sideALabel} fill="#818cf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="B" name={debate.sideBLabel} fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {(['logic', 'clarity', 'relevance', 'persuasiveness'] as const).map((key, idx) => {
                const row = judge.scores?.[key] ?? { A: 0, B: 0 };
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + idx * 0.04 }}
                    className="glass rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{key}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-ink-muted">Side A</p>
                        <p className="font-display text-3xl font-bold text-indigo-600 dark:text-indigo-300">{row.A}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-ink-muted">Side B</p>
                        <p className="font-display text-3xl font-bold text-sky-600 dark:text-sky-300">{row.B}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <Card className="mt-8">
            <h3 className="font-display text-lg font-semibold text-ink">Judge reasoning</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              {(judge.reasoning || '')
                .split(/\n\n+/)
                .filter(Boolean)
                .map((p) => (
                  <p key={p.slice(0, 32)} className="text-ink">
                    {p}
                  </p>
                ))}
            </div>
          </Card>
        </>
      ) : complete && !judgeReady && !judgeBusy ? (
        <Card className="mt-8 text-sm text-ink-muted">
          Judge data is still syncing.{' '}
          <Button variant="secondary" className="ml-2 px-3 py-1 text-xs" onClick={() => void load()}>
            Refresh
          </Button>
        </Card>
      ) : null}

      {complete ? (
        <Card className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Community vote</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Side A · {totals.A} &nbsp;·&nbsp; Side B · {totals.B} &nbsp;·&nbsp; {totals.total} total
              </p>
            </div>
            {debate.userVote ? (
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-100">
                Your pick: Side {debate.userVote.side}
              </span>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant={voteSide === 'A' ? 'primary' : 'secondary'}
              className="min-w-[120px]"
              loading={voteBusy}
              onClick={() => void submitVote('A')}
            >
              Vote Side A
            </Button>
            <Button
              type="button"
              variant={voteSide === 'B' ? 'primary' : 'secondary'}
              className="min-w-[120px]"
              loading={voteBusy}
              onClick={() => void submitVote('B')}
            >
              Vote Side B
            </Button>
          </div>
          <div className="mt-6">
            <Input
              label="Vote note (optional, shown with your ballot)"
              name="voteComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What convinced you?"
            />
          </div>

          <div className="mt-8 border-t border-black/5 pt-6 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Audience reactions</p>
            <p className="mt-1 text-sm text-ink-muted">Tap to attach to your vote. Tap again to clear.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => void setAudienceReaction(r.id)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-xs font-semibold transition',
                    reaction === r.id
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:border-indigo-400 dark:text-indigo-50'
                      : 'border-ringline bg-white/70 text-ink-muted hover:border-indigo-200 dark:border-white/10 dark:bg-slate-950/50'
                  )}
                >
                  <span className="mr-1">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
            {eng ? (
              <p className="mt-4 text-xs text-ink-muted">
                Totals — 🔥 {eng.reactionTotals.fire} · 🧠 {eng.reactionTotals.smart} · 💡 {eng.reactionTotals.insight} · 🤖{' '}
                {eng.reactionTotals.bias}
              </p>
            ) : null}
          </div>

          <form className="mt-8 border-t border-black/5 pt-6 dark:border-white/10" onSubmit={submitThreadComment}>
            <h4 className="font-display text-base font-semibold text-ink">Community thread</h4>
            <p className="mt-1 text-sm text-ink-muted">Short takes visible to anyone reviewing this results page.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Your comment"
                  name="thread"
                  value={threadComment}
                  onChange={(e) => setThreadComment(e.target.value)}
                  placeholder="Add nuance the models missed…"
                />
              </div>
              <Button type="submit" className="shrink-0" loading={commentBusy} disabled={threadComment.trim().length < 2}>
                Post
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {(debate.comments ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">No thread comments yet — start the conversation.</p>
            ) : (
              (debate.comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-ringline bg-white/50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/40"
                >
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{c.user.name}</p>
                  <p className="mt-1 text-ink">{c.body}</p>
                  <p className="mt-2 text-[10px] text-ink-muted">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              ))
            )}
          </div>

          {error && debate ? <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        </Card>
      ) : null}

      <div className="mt-12">
        <h3 className="font-display text-lg font-semibold text-ink">Full transcript</h3>
        <p className="mt-1 text-sm text-ink-muted">Turns play back in original order.</p>
        <div className="mt-6 space-y-5">
          {debate.turns.map((turn, idx) => (
            <DebateTurnCard
              key={turn.id ?? `${turn.round}-${turn.side}-${idx}`}
              turn={turn}
              index={idx}
              showFallbackChip={Boolean(turn.usedFallback)}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/debate/create">
          <Button className="px-5 py-2.5 text-sm">Start another debate</Button>
        </Link>
        <Link to="/debates/history">
          <Button variant="secondary" className="px-5 py-2.5 text-sm">
            Debate history
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary" className="px-5 py-2.5 text-sm">
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
