import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { formatApiError } from '@/utils/errors';
import { checkPasswordStrength, isValidEmail } from '@/utils/authValidation';
import { cn } from '@/utils/cn';

export function RegisterPage() {
  const { register, user } = useAuth();
  const { preference } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pwCheck = useMemo(() => checkPasswordStrength(password), [password]);
  const canSubmit = name.trim().length >= 2 && isValidEmail(email) && pwCheck.ok;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!pwCheck.ok) {
      setError(`Password must include: ${pwCheck.issues.join('; ')}.`);
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        themePreference: preference,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatApiError(err, 'Unable to register'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-2xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Create account</h2>
        <p className="mt-2 text-sm text-ink-muted">Secure credentials, instant access to your personal command center.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Input
          label="Display name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email && email && !isValidEmail(email) ? 'Use a valid email format.' : undefined}
          required
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
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
            autoComplete="new-password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            required
            className={cn(
              'w-full rounded-xl border border-ringline bg-white/80 px-4 py-3 text-sm text-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100',
              touched.password && password && !pwCheck.ok && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20',
              touched.password && password && pwCheck.ok && 'border-emerald-500/50'
            )}
          />
          <div className="flex gap-1 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full bg-slate-200 dark:bg-white/10',
                  pwCheck.score > i && 'bg-gradient-to-r from-sky-500 to-violet-500'
                )}
              />
            ))}
          </div>
          <p className="text-[11px] text-ink-muted">
            8+ chars, upper & lower case, number, and special character.
          </p>
          {touched.password && password && !pwCheck.ok ? (
            <ul className="list-inside list-disc text-[11px] text-rose-600 dark:text-rose-300">
              {pwCheck.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
          {touched.password && password && pwCheck.ok ? (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Password meets all rules.</p>
          ) : null}
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
        <Button type="submit" className="w-full py-3" loading={loading} disabled={!canSubmit}>
          Start free
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
