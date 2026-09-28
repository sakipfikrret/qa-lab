import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, AuthUser } from '../../services/api';

interface Props {
  needsSetup: boolean;
  signupOpen: boolean;
  bootError: string | null;
  onRetry: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<Props> = ({ needsSetup, signupOpen, bootError, onRetry, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>(needsSetup ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = isRegister ? await api.register(name, email, password) : await api.login(email, password);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-md bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent-400';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm craft-card rounded-lg p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {isRegister ? (needsSetup ? 'Create the admin account' : 'Create an account') : 'Sign in to QA//LAB'}
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            {needsSetup
              ? 'First run: the account you create here becomes the workspace admin.'
              : 'Your workspace is shared with the people an admin has added.'}
          </p>
        </div>

        {bootError && (
          <div role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
            Cannot reach the server: {bootError}{' '}
            <button type="button" onClick={onRetry} className="underline">Retry</button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <div>
              <label htmlFor="auth-name" className="block text-xs text-neutral-300 mb-1">Name</label>
              <input id="auth-name" className={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" required maxLength={80} />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-xs text-neutral-300 mb-1">Email</label>
            <input id="auth-email" type="email" className={field} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs text-neutral-300 mb-1">
              Password{isRegister ? ' (min. 10 characters)' : ''}
            </label>
            <input
              id="auth-password" type="password" className={field} value={password}
              onChange={e => setPassword(e.target.value)} required minLength={isRegister ? 10 : 1}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div role="alert" className="text-xs text-rose-300">{error}</div>}

          <button
            type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {!needsSetup && signupOpen && (
          <button type="button" onClick={() => setMode(isRegister ? 'login' : 'register')} className="text-xs text-neutral-300 underline">
            {isRegister ? 'I already have an account' : 'Create an account'}
          </button>
        )}
      </div>
    </div>
  );
};
