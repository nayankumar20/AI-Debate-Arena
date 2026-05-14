import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { getTopicSuggestionsApi, refreshTopicIdeasApi } from '@/services/topicService';
import { formatApiError } from '@/utils/errors';
import type { TopicCard, TopicSuggestionsResponse } from '@/types/debate';
import { cn } from '@/utils/cn';

const CATEGORY_ORDER = [
  'Technology',
  'AI Ethics',
  'Education',
  'Healthcare',
  'Politics',
  'Future of Work',
  'Society',
] as const;

function TopicMotionCard({
  item,
  accent,
  onPick,
}: {
  item: TopicCard;
  accent: string;
  onPick: (t: TopicCard) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      onClick={() => onPick(item)}
      className={cn(
        'text-left rounded-2xl border border-white/50 bg-white/75 p-4 shadow-sm ring-1 ring-black/5 transition',
        'hover:border-indigo-200/80 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/50 dark:ring-white/10',
        'dark:hover:border-indigo-500/40'
      )}
    >
      <span className={cn('text-[10px] font-bold uppercase tracking-widest', accent)}>{item.category ?? 'Topic'}</span>
      <p className="mt-2 text-sm font-semibold leading-snug text-ink">{item.topic}</p>
      {item.blurb ? <p className="mt-2 text-xs text-ink-muted">{item.blurb}</p> : null}
    </motion.button>
  );
}

export function TopicRecommendations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TopicSuggestionsResponse | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await getTopicSuggestionsApi();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, 'Could not load topics'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function goCreate(item: TopicCard) {
    const cat = item.category ?? 'Technology';
    const q = new URLSearchParams({ topic: item.topic, category: cat });
    const path = `/debate/create?${q.toString()}`;
    if (user) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: path } });
    }
  }

  async function onRefreshAi() {
    if (!user) {
      navigate('/login', { state: { from: '/debate/create' } });
      return;
    }
    setRefreshing(true);
    setError('');
    try {
      const generated = await refreshTopicIdeasApi();
      if (generated.length && data) {
        setData({
          ...data,
          trending: [...generated.map((g) => ({ topic: g.topic, category: g.category, blurb: g.blurb })), ...data.trending].slice(
            0,
            12
          ),
        });
      }
    } catch (e) {
      setError(formatApiError(e, 'AI refresh unavailable'));
    } finally {
      setRefreshing(false);
    }
  }

  if (!data && !error) {
    return (
      <div className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="h-40 animate-pulse rounded-3xl bg-white/40 dark:bg-slate-900/40" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto mt-16 max-w-3xl px-4 text-center text-sm text-rose-600 dark:text-rose-300 sm:px-6">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
            Discovery
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Suggested debate topics
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
            Curated by category with trending, popular, and high-friction prompts. One tap prefills the lab — stay in flow.
          </p>
        </div>
        {user ? (
          <Button variant="secondary" className="shrink-0 text-xs sm:text-sm" loading={refreshing} onClick={() => void onRefreshAi()}>
            Refresh with AI
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-xs text-amber-700 dark:text-amber-200">{error}</p> : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden p-5 lg:col-span-1">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10" />
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">Trending</p>
          <div className="mt-4 space-y-3">
            {data.trending.map((item, idx) => (
              <TopicMotionCard key={`t-${idx}`} item={item} accent="text-rose-600 dark:text-rose-300" onPick={goCreate} />
            ))}
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 lg:col-span-1">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-300">Popular debates</p>
          <div className="mt-4 space-y-3">
            {data.popular.map((item, idx) => (
              <TopicMotionCard key={`p-${idx}`} item={item} accent="text-sky-600 dark:text-sky-300" onPick={goCreate} />
            ))}
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 lg:col-span-1">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10" />
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">
            Most controversial
          </p>
          <div className="mt-4 space-y-3">
            {data.controversial.map((item, idx) => (
              <TopicMotionCard key={`c-${idx}`} item={item} accent="text-violet-600 dark:text-violet-300" onPick={goCreate} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-14 space-y-10">
        {CATEGORY_ORDER.map((cat) => {
          const items = data.categories[cat];
          if (!items?.length) return null;
          return (
            <div key={cat}>
              <h3 className="font-display text-lg font-semibold text-ink">{cat}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <TopicMotionCard
                    key={`${cat}-${item.topic}`}
                    item={{ ...item, category: cat }}
                    accent="text-indigo-600 dark:text-indigo-300"
                    onPick={goCreate}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
