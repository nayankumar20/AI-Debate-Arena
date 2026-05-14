import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { cn } from '@/utils/cn';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-white/[0.08] text-sky-300 shadow-sm ring-1 ring-white/[0.08] dark:bg-white/[0.06] dark:text-sky-200'
      : 'text-ink-muted hover:text-ink'
  );

export function Navbar() {
  const { user, logout } = useAuth();
  const { resolved, toggle } = useTheme();

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-white/80 shadow-[0_1px_0_rgb(15_23_42/0.04)] backdrop-blur-2xl dark:bg-[rgb(5_8_22/0.72)] dark:shadow-[0_8px_32px_rgb(0_0_0/0.35)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink">
          <BrandLogo size="md" />
          <span className="hidden sm:inline">Debate Arena</span>
        </Link>

        {user ? (
          <nav className="order-3 flex w-full flex-1 justify-center gap-0.5 overflow-x-auto pb-1 md:order-none md:w-auto md:flex-none md:justify-start md:pb-0 md:pl-2">
            <NavLink to="/debate/create" className={navClass}>
              Debate
            </NavLink>
            <NavLink to="/debates/history" className={navClass}>
              History
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/arena-pulse" className={navClass}>
              Arena Pulse
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
          </nav>
        ) : (
          <div className="order-3 flex-1 md:order-none" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={toggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ringline bg-white/70 text-lg transition hover:border-sky-400/30 dark:border-white/[0.08] dark:bg-white/[0.04]"
            aria-label="Toggle theme"
          >
            {resolved === 'dark' ? '☾' : '☀'}
          </button>
          {user ? (
            <>
              <div className="hidden min-w-0 max-w-[180px] flex-col items-end text-right sm:mr-3 sm:flex">
                <span className="truncate text-sm font-medium text-ink">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">Signed in</span>
              </div>
              <Button variant="secondary" className="ml-2 shrink-0 px-4 py-2 text-xs sm:ml-4 sm:px-5 sm:text-sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="shrink-0 px-3 py-2 text-xs sm:text-sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="shrink-0 px-3 py-2 text-xs sm:text-sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
