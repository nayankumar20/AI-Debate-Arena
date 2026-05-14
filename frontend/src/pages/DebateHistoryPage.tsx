import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { listDebatesApi } from '@/services/debateService';
import { formatApiError } from '@/utils/errors';
import type { DebateListItem, DebateStatus } from '@/types/debate';

const STATUS_OPTIONS: Array<{ value: '' | DebateStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'pending', label: 'Pending' },
];

export function DebateHistoryPage() {
  const [draftSearch, setDraftSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState<'' | DebateStatus>('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DebateListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listDebatesApi({
        search: appliedSearch.trim() || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setItems(data.debates);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      setError(formatApiError(e, 'Unable to load debates'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(e?: FormEvent) {
    e?.preventDefault();
    setAppliedSearch(draftSearch);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
          Library
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Debate history</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
          Search transcripts, filter by lifecycle state, and reopen premium results with judge scores and community
          votes.
        </p>
      </motion.div>

      <Card className="mt-8 space-y-4">
        <form className="space-y-4" onSubmit={applyFilters}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                label="Search topics"
                name="search"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="e.g. autonomous agents"
              />
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</span>
              <select
                className="w-full rounded-xl border border-ringline bg-white/85 px-4 py-3 text-sm font-medium text-ink shadow-inner outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as DebateStatus | '');
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="px-4 py-2 text-sm">
              Apply filters
            </Button>
            <Link to="/debate/create">
              <Button type="button" variant="secondary" className="px-4 py-2 text-sm">
                New debate
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {error ? (
        <p className="mt-6 text-sm text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-300" />
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center text-sm text-ink-muted">No debates match these filters yet.</Card>
        ) : (
          items.map((d, idx) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.2) }}
            >
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{d.topic}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {d.sideALabel} vs {d.sideBLabel} · {d.totalRounds} rounds ·{' '}
                    <span className="capitalize">{d.status.replace(/_/g, ' ')}</span>
                    {d.judgeReady ? (
                      <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                        Judge ready
                      </span>
                    ) : null}
                    {d.hasAnyFallback ? (
                      <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-100">
                        Fallback used
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.status === 'completed' ? (
                    <Link to={`/debate/${d.id}/results`}>
                      <Button className="px-4 py-2 text-sm">Results</Button>
                    </Link>
                  ) : null}
                  <Link to={`/debate/${d.id}`}>
                    <Button variant="secondary" className="px-4 py-2 text-sm">
                      {d.status === 'completed' ? 'Transcript' : 'Resume'}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-8 flex items-center justify-between text-sm text-ink-muted">
          <Button variant="secondary" className="px-3 py-2 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span>
            Page {page} of {pages} · {total} debates
          </span>
          <Button variant="secondary" className="px-3 py-2 text-xs" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
