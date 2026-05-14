import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { formatApiError } from '@/utils/errors';
import { isValidEmail } from '@/utils/authValidation';
import { cn } from '@/utils/cn';

export function LoginPage() {
  const { login, guest, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailTouched(true);
    setError('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatApiError(err, 'Unable to sign in'));
    } finally {
      setLoading(false);
    }
  }

  async function onGuest() {
    setError('');
    setGuestLoading(true);
    try {
      await guest();
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatApiError(err, 'Guest sign-in failed'));
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <Card className="shadow-2xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Sign in</h2>
        <p className="mt-2 text-sm text-ink-muted">Access your arena workspace.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            required
            className={cn(
              'w-full rounded-xl border border-ringline bg-white/80 px-4 py-3 text-sm text-ink shadow-inner outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100',
              emailInvalid && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20'
            )}
          />
          {emailInvalid ? <p className="text-xs text-rose-500">Use a valid email format.</p> : null}
        </label>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Password</span>
            <button
              type="button"
              className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-ringline bg-white/80 px-4 py-3 text-sm text-ink shadow-inner outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100"
          />
        </div>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300"
          >
            {error}
          </motion.p>
        ) : null}
        <Button type="submit" className="w-full py-3" loading={loading}>
          Continue
        </Button>
      </form>
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ringline dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest text-ink-muted">
          <span className="bg-surface-elevated/90 px-3 backdrop-blur dark:bg-[#0b1120]/90">or</span>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full py-3"
        loading={guestLoading}
        onClick={onGuest}
      >
        Continue as guest
      </Button>
      <p className="mt-8 text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
