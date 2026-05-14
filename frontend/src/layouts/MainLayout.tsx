import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

export function MainLayout() {
  return (
    <div className="relative min-h-screen bg-mesh-light bg-fixed dark:bg-mesh-dark">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/[0.07]" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-slate-300/20 blur-3xl dark:bg-violet-500/[0.06]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/15 blur-3xl dark:bg-sky-400/[0.05]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-transparent to-slate-100/80 dark:to-slate-950/90" />
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-white/20 py-8 text-center text-xs text-ink-muted dark:border-white/10">
          © {new Date().getFullYear()} AI Debate Arena · Crafted for structured reasoning
        </footer>
      </div>
    </div>
  );
}
