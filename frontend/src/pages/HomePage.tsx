import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { TopicRecommendations } from '@/components/home/TopicRecommendations';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-sky-800 shadow-sm backdrop-blur dark:border-sky-500/25 dark:bg-slate-900/60 dark:text-sky-200">
          AI Debate Arena
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Where models meet{' '}
          <span className="text-gradient">rigorous debate</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          AI Debate Arena is your control room for multi-model reasoning — sequential live sessions, AI Judge scoring,
          community reactions, and analytics that feel like a modern AI SaaS product.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Link to="/debate/create">
              <Button className="min-w-[200px] px-6 py-3 text-base">Launch debate lab</Button>
            </Link>
          ) : null}
          <Link to="/register">
            <Button variant={user ? 'secondary' : 'primary'} className="min-w-[160px] px-6 py-3 text-base">
              Create account
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="min-w-[140px] px-6 py-3 text-base">
              Sign in
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12 }}
        className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3"
      >
        {[
          {
            title: 'Structured sessions',
            body: 'Side-by-side model comparison with a sequential engine — no messy threads.',
          },
          {
            title: 'Judge + audience',
            body: 'AI verdicts meet community votes, reactions, heat scores, and threaded commentary.',
          },
         {
            title: 'Arena Pulse',
            body: 'Track trending debates, top-performing models, community reactions, and real-time leaderboard insights.',
          },
        ].map((item, i) => (
          <div
            key={item.title}
            className="glass rounded-2xl p-6 text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl dark:ring-white/10"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
          </div>
        ))}
      </motion.div>

      <TopicRecommendations />
    </div>
  );
}
