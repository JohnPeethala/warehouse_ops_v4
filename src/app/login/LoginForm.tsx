'use client';

import { useState, useEffect, useActionState } from 'react';
import { login } from './actions';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Load saved phone if exists
    const savedPhone = localStorage.getItem('warehouse_ops_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  const handleAction = async (prevState: any, formData: FormData) => {
    if (rememberMe) {
      localStorage.setItem('warehouse_ops_phone', phone);
    } else {
      localStorage.removeItem('warehouse_ops_phone');
    }

    return await login(prevState, formData);
  };

  const [state, formAction, isPending] = useActionState(handleAction, null);

  useEffect(() => {
    if (state?.success) {
      window.location.href = '/';
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-xs font-medium text-foreground/60">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your mobile number..."
          required
          autoComplete="tel"
          autoFocus={!phone}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-foreground/60">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password..."
          required
          autoComplete="current-password"
          autoFocus={!!phone}
          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5"
        />
        <label htmlFor="rememberMe" className="text-xs text-foreground/70 cursor-pointer select-none">
          Remember my phone number
        </label>
      </div>

      {state?.error && (
        <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mt-1">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-foreground text-background font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
      </button>
    </form>
  );
}
