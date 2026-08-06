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
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm p-6 w-full max-w-sm rounded-xl flex flex-col justify-center">
      <div className="text-left mb-6">
        <h3 className="text-lg font-mono font-bold text-slate-800 tracking-tight uppercase">{isLogin ? 'OPERATOR LOGIN' : 'NEW OPERATOR ACCESS'}</h3>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest font-semibold">{isLogin ? 'Authenticate to access intelligence' : 'Request FinPulse Clearance'}</p>
      </div>
      
      {error && <div className="text-rose-600 bg-rose-50 text-xs font-mono mb-4 border border-rose-200 p-3 rounded-lg font-medium">{error}</div>}
      
      {successMsg ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4 text-blue-600">
            <MailCheck size={28} />
          </div>
          <p className="text-blue-700 font-mono text-sm px-4 uppercase font-bold">{successMsg}</p>
          <button 
            onClick={() => { setIsLogin(true); setSuccessMsg(null); }}
            className="mt-6 text-[10px] text-slate-500 hover:text-blue-600 font-mono uppercase tracking-widest border border-slate-200 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors font-bold"
          >
            Acknowledge & Return
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 tracking-widest uppercase font-semibold ml-1">Operator Email</label>
            <input 
              type="email" 
              placeholder="name@institution.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs shadow-sm placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 tracking-widest uppercase font-semibold ml-1">Clearance Code</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs shadow-sm placeholder:text-slate-400"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-all mt-2 flex justify-center items-center h-[42px] text-xs uppercase tracking-widest shadow-md hover:shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Execute Login' : 'Initialize Request')}
          </button>
        </form>
      )}
      
      {!successMsg && (
        <div className="mt-6 text-center text-[10px] font-mono text-slate-500 font-semibold">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="hover:text-blue-600 transition-colors tracking-widest uppercase">
            {isLogin ? "No clearance? Request Access" : 'Have clearance? Execute Login'}
          </button>
        </div>
      )}
    </div>
  );
}
