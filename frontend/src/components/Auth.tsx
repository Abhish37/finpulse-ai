"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabaseBrowser';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-surface p-4 w-full h-full max-w-sm flex flex-col justify-center">
      <h3 className="font-bold text-white mb-4 text-center tracking-widest">{isLogin ? 'TERMINAL LOGIN' : 'CREATE ACCOUNT'}</h3>
      {error && <div className="text-accent-down text-xs mb-4 border border-accent-down p-2">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="EMAIL" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-white focus:outline-none focus:border-gray-500 text-xs"
          required
        />
        <input 
          type="password" 
          placeholder="PASSWORD" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-white focus:outline-none focus:border-gray-500 text-xs"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-white text-black font-bold py-2 hover:bg-gray-200 disabled:opacity-50 text-xs mt-2"
        >
          {loading ? 'AUTHENTICATING...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
        </button>
      </form>
      <div className="mt-4 text-center text-xs text-gray-500">
        <button onClick={() => setIsLogin(!isLogin)} className="hover:text-white underline">
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
