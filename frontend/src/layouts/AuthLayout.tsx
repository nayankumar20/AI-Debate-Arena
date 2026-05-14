import { Outlet, Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export function AuthLayout() {
  const { resolved, toggle } = useTheme();
  return (
    <div className="relative min-h-screen bg-mesh-light bg-fixed dark:bg-mesh-dark">
      <div className="absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ringline bg-white/60 text-lg shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50"
          aria-label="Toggle theme"
        >
          {resolved === 'dark' ? '☾' : '☀'}
        </button>
      </div>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 max-w-xl lg:mb-0"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
            <BrandLogo size="md" />
            Debate Arena
          </Link>
          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to the{' '}
            <span className="text-gradient">arena of ideas</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            Sign in to save sessions, sync preferences, and prepare for structured AI debates — built
            with a calm, focused interface inspired by the best AI products.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
