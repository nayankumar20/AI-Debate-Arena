import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { getDashboardAnalyticsApi } from '@/services/analyticsService';
import { formatApiError } from '@/utils/errors';
import type { DashboardAnalytics, PersonalInsights } from '@/types/debate';

const PIE_COLORS = ['#38bdf8', '#8b5cf6', '#22d3ee', '#a78bfa', '#94a3b8'];

function modelShort(id: string) {
  const parts = id.split('/');
  return parts[parts.length - 1] || id;
}

const emptyPersonal: PersonalInsights = {
  heatOnMyDebates: 0,
  votesOnMyDebates: 0,
  commentsOnMyDebates: 0,
  voteSidePreference: { A: 0, B: 0 },
  reactionSignature: { fire: 0, smart: 0, insight: 0, bias: 0 },
  myCategoryMix: [],
  favoriteTopics: [],
  judgeAgreementPercent: null,
  judgeAgreements: 0,
  judgeComparableDebates: 0,
};

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const a = await getDashboardAnalyticsApi();
        if (!cancelled) setData(a);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, 'Unable to load analytics'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const judgeChart = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Side A wins', value: data.judgeWins.A },
      { label: 'Side B wins', value: data.judgeWins.B },
      { label: 'Ties', value: data.judgeWins.tie },
    ];
  }, [data]);

  const modelChart = useMemo(() => {
    if (!data) return [];
    return data.modelUsage.map((m) => ({
      name: modelShort(m.modelId),
      picks: m.count,
    }));
  }, [data]);

  const personal = data?.personalInsights ?? emptyPersonal;

  const votePrefChart = useMemo(
    () => [
      { side: 'Side A', votes: personal.voteSidePreference.A },
      { side: 'Side B', votes: personal.voteSidePreference.B },
    ],
    [personal.voteSidePreference]
  );

  const reactionChart = useMemo(
    () => [
      { name: 'Strong', v: personal.reactionSignature.fire },
      { name: 'Smart', v: personal.reactionSignature.smart },
      { name: 'Insight', v: personal.reactionSignature.insight },
      { name: 'Bias', v: personal.reactionSignature.bias },
    ],
    [personal.reactionSignature]
  );

  const chartTooltip = {
    borderRadius: 12,
    background: 'rgba(11,17,32,0.95)',
    color: '#f8fafc',
    border: '1px solid rgba(148,163,184,0.2)',
  } as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400/90">Personal</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-ink-muted sm:text-base">
          Your debates, judge alignment, model usage, and voting patterns. Community-wide pulse lives on{' '}
          <Link to="/arena-pulse" className="font-semibold text-sky-400 underline-offset-2 hover:underline">
            Arena Pulse
          </Link>
          .
        </p>
      </motion.div>

      {error ? <p className="mt-6 text-sm text-rose-400">{error}</p> : null}

      {loading || !data ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'My debates', value: data.totalDebates, hint: 'All lifecycle states' },
              { label: 'Completed', value: data.completedDebates, hint: 'Ready for judge + votes' },
              { label: 'Active', value: data.activeDebates, hint: 'Drafting or live' },
              { label: 'My votes', value: data.votesCast, hint: 'Ballots you cast' },
            ].map((tile) => (
              <Card key={tile.label} className="relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.06] via-transparent to-violet-500/[0.05]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{tile.label}</p>
                <p className="mt-3 font-display text-4xl font-bold text-ink">{tile.value}</p>
                <p className="mt-2 text-xs text-ink-muted">{tile.hint}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="relative overflow-hidden p-5 lg:col-span-1">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] to-transparent" />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">My win rate vs judge</p>
              <p className="mt-2 font-display text-4xl font-bold text-sky-400">
                {personal.judgeAgreementPercent != null ? `${personal.judgeAgreementPercent}%` : '—'}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                When you voted on completed debates with a decisive judge, you matched the verdict{' '}
                {personal.judgeAgreements} / {personal.judgeComparableDebates || '—'} times.
              </p>
            </Card>
            <Card className="relative overflow-hidden p-5 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Engagement heat (your sessions)</p>
              <p className="mt-2 font-display text-4xl font-bold text-ink">{personal.heatOnMyDebates}</p>
              <p className="mt-2 text-xs text-ink-muted">
                Votes ×2 + comments ×3 on debates you created ({personal.votesOnMyDebates} votes ·{' '}
                {personal.commentsOnMyDebates} comments).
              </p>
            </Card>
          </div>

          <Card className="mt-8 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Favorite debate topics</h2>
            <p className="text-xs text-ink-muted">Most repeated resolutions you authored</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!personal.favoriteTopics?.length ? (
                <p className="text-sm text-ink-muted">No repeats yet — run a few sessions to see patterns.</p>
              ) : (
                personal.favoriteTopics.map((t) => (
                  <span
                    key={t.topic.slice(0, 48)}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-ink"
                  >
                    <span className="truncate">{t.topic}</span>
                    <span className="shrink-0 font-semibold text-sky-400">×{t.count}</span>
                  </span>
                ))
              )}
            </div>
          </Card>

          <Card className="mt-8 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Your voting fingerprint</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={votePrefChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" vertical={false} />
                    <XAxis dataKey="side" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="votes" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reactionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="v" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-0">
              <div className="border-b border-white/[0.06] px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-ink">My judge outcomes</h2>
                <p className="text-xs text-ink-muted">Completed debates only</p>
              </div>
              <div className="h-[280px] px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={judgeChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-0">
              <div className="border-b border-white/[0.06] px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-ink">My AI usage</h2>
                <p className="text-xs text-ink-muted">Model appearances on your sides</p>
              </div>
              <div className="h-[280px] px-2 pb-4 pt-2">
                {modelChart.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-ink-muted">No model data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modelChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltip} />
                      <Legend />
                      <Line type="monotone" dataKey="picks" name="Selections" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-8 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">My category mix</h2>
            <div className="mt-4 h-[260px]">
              {!personal.myCategoryMix.length ? (
                <div className="flex h-full items-center justify-center text-sm text-ink-muted">Tag debates to see mix</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={personal.myCategoryMix.map((c) => ({ name: c.category, value: c.count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {personal.myCategoryMix.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
                <p className="text-sm text-ink-muted">Jump back into live arenas or results.</p>
              </div>
              <Link to="/debates/history">
                <Button variant="secondary" className="px-4 py-2 text-sm">
                  View all
                </Button>
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {data.recentDebates.length === 0 ? (
                <p className="text-sm text-ink-muted">No debates yet — start your first session.</p>
              ) : (
                data.recentDebates.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{d.topic}</p>
                      <p className="text-xs text-ink-muted">
                        {d.sideALabel} vs {d.sideBLabel} ·{' '}
                        <span className="capitalize">{d.status.replace(/_/g, ' ')}</span>
                        {d.category ? ` · ${d.category}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {d.status === 'completed' ? (
                        <Link to={`/debate/${d.id}/results`}>
                          <Button className="px-3 py-1.5 text-xs">Results</Button>
                        </Link>
                      ) : null}
                      <Link to={`/debate/${d.id}`}>
                        <Button variant="secondary" className="px-3 py-1.5 text-xs">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/debate/create">
              <Button className="px-5 py-2.5 text-sm">Launch new debate</Button>
            </Link>
            <Link to="/arena-pulse">
              <Button variant="secondary" className="px-5 py-2.5 text-sm">
                Arena Pulse
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="secondary" className="px-5 py-2.5 text-sm">
                Profile
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
