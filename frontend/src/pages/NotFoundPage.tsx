import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="glass rounded-3xl px-8 py-12"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold">This page drifted offline</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The route you requested doesn&apos;t exist yet. Let&apos;s bring you back to familiar ground.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button className="px-8">Return home</Button>
        </Link>
      </motion.div>
    </div>
  );
}
