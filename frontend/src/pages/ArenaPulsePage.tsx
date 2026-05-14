import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getArenaPulseApi } from '@/services/analyticsService';
import { formatApiError } from '@/utils/errors';
import type { ArenaPulsePayload, LeaderboardRow, TopicCard } from '@/types/debate';

function LeaderTable({ title, rows, valueKey }: { title: string; rows: LeaderboardRow[]; valueKey: string }) {
  return (
    <Card className="p-4">
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 max-h-52 space-y-2 overflow-y-auto text-xs">
        {!rows.length ? (
          <p className="text-ink-muted">No data yet</p>
        ) : (
          rows.map((r) => (
            <div
              key={`${title}-${r.modelId}`}
              className="flex justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.04] px-2 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <span className="truncate font-medium text-ink">{r.label}</span>
              <span className="shrink-0 font-semibold text-sky-400">
                {r[valueKey as keyof LeaderboardRow] as number}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TopicStrip({ title, items }: { title: string; items: TopicCard[] }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.map((item, idx) => {
          const q = new URLSearchParams({
            topic: item.topic,
            category: item.category ?? 'Technology',
          });
          return (
            <Link
              key={`${title}-${idx}`}
              to={`/debate/create?${q.toString()}`}
              className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm transition hover:border-sky-500/30 hover:bg-sky-500/[0.06]"
            >
              <p className="font-medium leading-snug text-ink">{item.topic}</p>
              {item.blurb ? <p className="mt-1 text-xs text-ink-muted">{item.blurb}</p> : null}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

const emptyPulse: ArenaPulsePayload = {
  community: {
    categoryPopularity: [],
    trendingDebates: [],
    mostActiveUsers: [],
    activityFeed: [],
  },
  leaderboards: {
    mostPersuasiveWhenWinning: [],
    mostLogicalWhenWinning: [],
    highestJudgeCompositeWhenWinning: [],
    highestAudienceApproval: [],
    mostJudgeWins: [],
  },
  trendingTopics: { trending: [], popular: [], controversial: [] },
};

export function ArenaPulsePage() {
  const [pulse, setPulse] = useState<ArenaPulsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getArenaPulseApi();
        if (!cancelled) setPulse(p);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, 'Unable to load Arena Pulse'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = pulse ?? emptyPulse;
  const { community, leaderboards, trendingTopics } = data;

  const categoryChart = useMemo(
    () =>
      community.categoryPopularity.map((c) => ({
        name: c.category.length > 14 ? `${c.category.slice(0, 12)}…` : c.category,
        debates: c.count,
      })),
    [community.categoryPopularity]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400/90">Community</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Arena Pulse</h1>
        <p className="mt-3 max-w-3xl text-sm text-ink-muted sm:text-base">
          Global signal: leaderboards, heat, active creators, category mix, and curated topic momentum — separate from
          your personal dashboard.
        </p>
      </motion.div>

      {error ? <p className="mt-6 text-sm text-rose-400">{error}</p> : null}

      {loading ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold text-ink">Category popularity</h2>
              <p className="text-xs text-ink-muted">Completed debates platform-wide</p>
              <div className="mt-4 h-[280px]">
                {!categoryChart.length ? (
                  <div className="flex h-full items-center justify-center text-sm text-ink-muted">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart} layout="vertical" margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={96} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          background: 'rgba(11,17,32,0.95)',
                          color: '#f8fafc',
                          border: '1px solid rgba(148,163,184,0.2)',
                        }}
                      />
                      <Bar dataKey="debates" fill="#38bdf8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <TopicStrip title="Momentum topics" items={trendingTopics.trending} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TopicStrip title="Popular prompts" items={trendingTopics.popular} />
            <TopicStrip title="High-friction / controversial" items={trendingTopics.controversial} />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold text-ink">Trending debates (heat)</h2>
              <div className="mt-4 space-y-2 text-sm">
                {!community.trendingDebates.length ? (
                  <p className="text-ink-muted">No completed debates yet.</p>
                ) : (
                  community.trendingDebates.map((t) => (
                    <div
                      key={t.debateId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <span className="font-medium text-ink line-clamp-2">{t.topic}</span>
                      <span className="text-xs font-semibold text-sky-400">🔥 {t.heatScore}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-display text-lg font-semibold text-ink">Most active creators</h2>
              <div className="mt-4 space-y-2 text-sm">
                {!community.mostActiveUsers.length ? (
                  <p className="text-ink-muted">No creators yet.</p>
                ) : (
                  community.mostActiveUsers.map((u) => (
                    <div
                      key={u.userId}
                      className="flex justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <span className="font-medium text-ink">{u.name}</span>
                      <span className="text-xs text-ink-muted">{u.debates} debates</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-8 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Community activity feed</h2>
            <p className="text-xs text-ink-muted">Latest sessions across the arena</p>
            <div className="mt-4 space-y-2">
              {!community.activityFeed.length ? (
                <p className="text-sm text-ink-muted">No activity yet.</p>
              ) : (
                community.activityFeed.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-ink line-clamp-1">{d.topic}</span>
                    <span className="text-xs capitalize text-ink-muted">{d.status.replace(/_/g, ' ')}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">Global AI leaderboards</h2>
            <p className="mt-1 text-sm text-ink-muted">Judge-weighted performance and audience picks.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LeaderTable title="Most persuasive (on judge wins)" rows={leaderboards.mostPersuasiveWhenWinning} valueKey="value" />
              <LeaderTable title="Most logical (on judge wins)" rows={leaderboards.mostLogicalWhenWinning} valueKey="value" />
              <LeaderTable
                title="Highest composite judge score"
                rows={leaderboards.highestJudgeCompositeWhenWinning}
                valueKey="value"
              />
              <LeaderTable title="Audience picks (votes)" rows={leaderboards.highestAudienceApproval} valueKey="audienceVotes" />
              <LeaderTable title="Judge wins (count)" rows={leaderboards.mostJudgeWins} valueKey="judgeWins" />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="secondary" className="px-5 py-2.5 text-sm">
                Personal dashboard
              </Button>
            </Link>
            <Link to="/debate/create">
              <Button className="px-5 py-2.5 text-sm">Launch debate</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
