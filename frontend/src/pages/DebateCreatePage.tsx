import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ModelSelect } from '@/components/debate/ModelSelect';
import { RoundPicker } from '@/components/debate/RoundPicker';
import { AI_MODELS, ROUND_OPTIONS } from '@/constants/aiModels';
import { DEBATE_CATEGORIES, type DebateCategory } from '@/constants/debateCategories';
import { createDebateApi } from '@/services/debateService';
import { formatApiError } from '@/utils/errors';
import { cn } from '@/utils/cn';

export function DebateCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<DebateCategory>('Technology');
  const [sideA, setSideA] = useState(AI_MODELS[0]?.id ?? '');
  const [sideB, setSideB] = useState(AI_MODELS[1]?.id ?? AI_MODELS[0]?.id ?? '');
  const [rounds, setRounds] = useState<number>(ROUND_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = params.get('topic');
    const c = params.get('category');
    if (t) setTopic(t);
    if (c && (DEBATE_CATEGORIES as readonly string[]).includes(c)) {
      setCategory(c as DebateCategory);
    }
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const debate = await createDebateApi({
        topic: topic.trim(),
        sideAModelId: sideA,
        sideBModelId: sideB,
        totalRounds: rounds,
        category,
      });
      navigate(`/debate/${debate.id}`, { replace: false, state: { autoStart: true } });
    } catch (err) {
      setError(formatApiError(err, 'Could not create debate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">
          Module 2 · Debate lab
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Configure an <span className="text-gradient">AI-vs-AI</span> session
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          Choose frontier models, depth, and category — then launch a sequentially moderated debate with premium pacing
          on the live stage.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mt-10"
      >
        <Card className="relative overflow-hidden shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-transparent to-sky-500/15" />
          <form className="relative space-y-6" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Debate topic</span>
              <textarea
                required
                minLength={4}
                maxLength={600}
                rows={4}
                placeholder="e.g. Resolved: autonomous AI agents should be allowed to trade financial instruments without a human co-pilot."
                className="w-full rounded-2xl border border-ringline bg-white/85 px-4 py-3 text-sm text-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-100"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Category</span>
              <select
                className="w-full rounded-2xl border border-ringline bg-white/85 px-4 py-3 text-sm font-medium text-ink shadow-inner outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-100"
                value={category}
                onChange={(e) => setCategory(e.target.value as DebateCategory)}
              >
                {DEBATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <ModelSelect label="Side A model" value={sideA} onChange={setSideA} models={AI_MODELS} disabled={loading} />
              <ModelSelect label="Side B model" value={sideB} onChange={setSideB} models={AI_MODELS} disabled={loading} />
            </div>

            <RoundPicker value={rounds} onChange={setRounds} options={ROUND_OPTIONS} disabled={loading} />

            {error ? (
              <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">{error}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-ink-muted sm:text-sm">
                Live flow runs <span className="font-semibold text-ink">one model at a time</span> with typing cues and
                resilient fallbacks if the live model path is temporarily unavailable.
              </p>
              <Button type="submit" className="min-w-[200px] px-6 py-3 text-base" loading={loading}>
                Start debate
              </Button>
            </div>
          </form>
        </Card>
        <p className={cn('mt-6 text-center text-xs text-ink-muted')}>
          Need inspiration? From the home page, pick a suggested topic — we will drop you here with the form prefilled.
        </p>
      </motion.div>
    </div>
  );
}
