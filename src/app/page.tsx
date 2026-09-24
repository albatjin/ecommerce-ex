export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Stage 1: Architecture Initialized
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-4">
          CommerceHub E-Commerce
        </h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Next.js 16.3.5 (App Router, Turbopack) + React 19.2.8 + Supabase SSR + Tailwind CSS v4 기반의
          엔터프라이즈 클린 아키텍처 풀스택 플랫폼입니다.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Domain</div>
            <div className="text-slate-500 dark:text-slate-400">Entities & Rules</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Application</div>
            <div className="text-slate-500 dark:text-slate-400">Use Cases & DTOs</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Infrastructure</div>
            <div className="text-slate-500 dark:text-slate-400">Supabase SSR & Repos</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Presentation</div>
            <div className="text-slate-500 dark:text-slate-400">Next.js UI & Actions</div>
          </div>
        </div>
      </div>
    </main>
  );
}

