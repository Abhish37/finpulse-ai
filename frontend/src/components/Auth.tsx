"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabaseBrowser';
import { Loader2, MailCheck } from 'lucide-react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          onAuthSuccess();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Supabase requires email verification by default
        if (data.user && !data.session) {
          setSuccessMsg("Success! Please check your email to verify your account.");
        } else if (data.session) {
          onAuthSuccess();
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-soft p-8 w-full max-w-sm rounded-2xl flex flex-col justify-center">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
        <p className="text-sm text-slate-500 mt-1">{isLogin ? 'Log in to access intelligence' : 'Join FinPulse AI today'}</p>
      </div>
      
      {error && <div className="text-red-600 bg-red-50 text-sm mb-4 border border-red-200 p-3 rounded-xl">{error}</div>}
      
      {successMsg ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
            <MailCheck size={32} />
          </div>
          <p className="text-blue-800 font-medium px-4">{successMsg}</p>
          <button 
            onClick={() => { setIsLogin(true); setSuccessMsg(null); }}
            className="mt-6 text-sm text-blue-600 hover:underline font-medium"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 tracking-wide">EMAIL</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl w-full text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1 tracking-wide">PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl w-full text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm shadow-sm"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-hover disabled:opacity-70 transition-all shadow-md hover:shadow-lg mt-2 flex justify-center items-center h-[44px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
      )}
      
      {!successMsg && (
        <div className="mt-6 text-center text-sm text-slate-500">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="hover:text-primary font-medium transition-colors">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      )}
    </div>
  );
}
