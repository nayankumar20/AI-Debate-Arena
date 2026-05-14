import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getProfileApi, updateProfileApi } from '@/services/userProfileService';
import { formatApiError } from '@/utils/errors';
import type { ThemePreference } from '@/types/user';
import type { UserProfile } from '@/types/debate';
import { AI_MODELS } from '@/constants/aiModels';
import { cn } from '@/utils/cn';

function diceBearSvg(seed: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0f172a,1e293b`;
}

function modelLabel(id: string | null | undefined) {
  if (!id) return '—';
  return AI_MODELS.find((m) => m.id === id)?.label ?? id.split('/').pop() ?? id;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { setPreference } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getProfileApi();
        if (!cancelled) {
          setProfile(p);
          setName(p.name);
          setAvatar(p.avatar || '');
          const tp = (p.themePreference as ThemePreference) || 'system';
          setTheme(tp);
        }
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, 'Unable to load profile'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const p = await updateProfileApi({ name, avatar, themePreference: theme });
      setProfile(p);
      setPreference(theme);
      setUser({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        themePreference: p.themePreference as ThemePreference,
        isGuest: p.isGuest,
        createdAt: p.createdAt,
      });
      setMessage('Profile updated');
    } catch (err) {
      setError(formatApiError(err, 'Unable to save profile'));
    } finally {
      setSaving(false);
    }
  }

  function applyDiceBear() {
    const seed = name.trim() || user?.name || 'arena';
    setAvatar(diceBearSvg(seed));
  }

  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 140 * 1024) {
      setError('Image must be under 140KB, or use a URL / DiceBear.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      if (r.length > 110000) {
        setError('Encoded image is too large — try a smaller file.');
        return;
      }
      setAvatar(r);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  const previewSrc =
    avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'))
      ? avatar
      : diceBearSvg(name || user?.name || 'member');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600 dark:border-sky-900 dark:border-t-sky-300" />
        <p className="text-sm text-ink-muted">Loading your command profile…</p>
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400/90">Identity</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your Arena Profile</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-muted sm:text-base">
          Track your debate journey, judge alignment, audience impact, activity history, and personalized AI arena insights.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-1"
        >
          <Card className="relative overflow-hidden p-6 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-slate-900/40 shadow-[0_0_0_1px_rgb(56_189_248/0.25),0_20px_50px_rgb(0_0_0/0.35)] ring-1 ring-sky-400/20 dark:bg-slate-950">
              <img src={previewSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <p className="relative mt-5 font-display text-xl font-bold text-ink">{profile?.name || user?.name}</p>
            <p className="relative mt-1 text-xs text-ink-muted">{profile?.email}</p>
            <p className="relative mt-4 text-xs text-ink-muted">
              Joined{' '}
              <span className="font-semibold text-ink">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </span>
            </p>
          </Card>
        </motion.div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Total debates', value: stats?.debatesParticipated ?? 0 },
              { label: 'Completed', value: stats?.completedDebates ?? 0 },
              { label: 'Votes cast', value: stats?.votesCast ?? 0 },
              { label: 'Aligned with judge', value: stats?.debatesAlignedWithJudge ?? 0, hint: 'Your vote matched AI Judge' },
            ].map((tile, i) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 + i * 0.04 }}
              >
                <Card className="relative overflow-hidden p-5">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] to-violet-500/[0.06]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{tile.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold text-ink">{tile.value}</p>
                  {'hint' in tile && tile.hint ? <p className="mt-2 text-[11px] text-ink-muted">{tile.hint}</p> : null}
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Favorite model</p>
                <p className="mt-2 text-sm font-semibold text-ink">{modelLabel(stats?.favoriteModelId)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Avg judge score (completed)</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {stats?.avgJudgeScoreOnCompleted != null ? `${stats.avgJudgeScoreOnCompleted} / 10` : '—'}
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">Winner-side composite across your finished debates.</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Activity timeline</p>
              <div className="relative mt-5 space-y-0 border-l border-white/[0.08] pl-5 dark:border-white/[0.06]">
                {!stats?.recentActivity?.length ? (
                  <p className="text-sm text-ink-muted">No debates yet — start one from the lab.</p>
                ) : (
                  stats.recentActivity.map((a, idx, arr) => (
                    <div key={a.id} className="relative pb-6 last:pb-0">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-sky-400/80 bg-[rgb(var(--surface-elevated))] dark:border-sky-300/80" />
                      {idx < arr.length - 1 ? (
                        <span className="absolute -left-[17px] top-4 bottom-0 w-px bg-gradient-to-b from-sky-500/25 to-transparent" />
                      ) : null}
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 dark:bg-white/[0.02]">
                        <p className="font-medium leading-snug text-ink line-clamp-2">{a.topic}</p>
                        <p className="mt-1 text-xs capitalize text-ink-muted">
                          {a.status.replace(/_/g, ' ')}
                          {a.judgeWinner && a.judgeWinner !== 'tie' ? ` · Judge ${a.judgeWinner}` : ''}
                          {a.updatedAt ? ` · ${new Date(a.updatedAt).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="space-y-5 p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Edit profile</h2>
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Display name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Avatar</span>
                  <Input
                    label="Image URL (optional)"
                    name="avatar"
                    value={avatar.startsWith('data:') ? '' : avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://… or generate below"
                  />
                  {avatar.startsWith('data:') ? (
                    <p className="text-xs text-ink-muted">Using uploaded image (preview above).</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="text-xs" onClick={applyDiceBear}>
                      Use DiceBear from name
                    </Button>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center justify-center rounded-xl border border-ringline bg-white/80 px-4 py-2 text-xs font-semibold text-ink transition hover:border-sky-400/40 dark:border-white/10 dark:bg-slate-950/50">
                        Upload small image
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                    </label>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Theme preference</span>
                  <select
                    className="w-full rounded-xl border border-ringline bg-white/85 px-4 py-3 text-sm font-medium text-ink shadow-inner outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemePreference)}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
                {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
                <Button type="submit" className="w-full py-3 sm:w-auto" loading={saving}>
                  Save changes
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="mt-10 text-sm text-ink-muted">
        <Link to="/dashboard" className={cn('font-semibold text-sky-600 hover:underline dark:text-sky-400')}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
