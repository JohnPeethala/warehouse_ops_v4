import { LoginForm } from './LoginForm';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-pattern-diagonal z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-xl shadow-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-3xl font-bold">
              W
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Warehouse OPs</h1>
          <p className="text-sm text-muted-foreground mt-1">Operations & Dispatch Platform (v4)</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-6">
          <h2 className="text-sm font-semibold text-foreground/70 mb-5 uppercase tracking-widest text-center">
            System Access
          </h2>

          <Suspense fallback={<div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div></div>}>
            <LoginForm />
          </Suspense>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Role-based authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
