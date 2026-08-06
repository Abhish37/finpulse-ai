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
    <div className="bg-[#1A2332] border border-border p-6 w-full max-w-sm rounded flex flex-col justify-center">
      <div className="text-left mb-6">
        <h3 className="text-lg font-mono text-white tracking-tight uppercase">{isLogin ? 'OPERATOR LOGIN' : 'NEW OPERATOR ACCESS'}</h3>
        <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">{isLogin ? 'Authenticate to access intelligence' : 'Request FinPulse Clearance'}</p>
      </div>
      
      {error && <div className="text-red-500 bg-red-500/10 text-xs font-mono mb-4 border border-red-500/30 p-3 rounded">{error}</div>}
      
      {successMsg ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-primary/20 p-3 rounded mb-4 text-primary">
            <MailCheck size={24} />
          </div>
          <p className="text-primary font-mono text-sm px-4 uppercase">{successMsg}</p>
          <button 
            onClick={() => { setIsLogin(true); setSuccessMsg(null); }}
            className="mt-6 text-xs text-gray-400 hover:text-white font-mono uppercase tracking-widest border border-border px-4 py-2 rounded hover:bg-border transition-colors"
          >
            Acknowledge & Return
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Operator Email</label>
            <input 
              type="email" 
              placeholder="name@institution.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#090D16] border border-border px-4 py-2.5 rounded w-full text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Clearance Code</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#090D16] border border-border px-4 py-2.5 rounded w-full text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-xs"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-[#090D16] font-bold py-2.5 rounded hover:bg-primary-hover disabled:opacity-70 transition-all mt-2 flex justify-center items-center h-[40px] text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Execute Login' : 'Initialize Request')}
          </button>
        </form>
      )}
      
      {!successMsg && (
        <div className="mt-6 text-center text-xs font-mono text-gray-500">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="hover:text-primary transition-colors tracking-widest uppercase">
            {isLogin ? "No clearance? Request Access" : 'Have clearance? Execute Login'}
          </button>
        </div>
      )}
    </div>
  );
}
