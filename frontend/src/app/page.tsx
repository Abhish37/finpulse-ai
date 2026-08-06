"use client";

import { useState, useEffect } from "react";
import ChartVisualizer from "@/components/ChartVisualizer";
import Auth from "@/components/Auth";
import Watchlist from "@/components/Watchlist";
import { Search, Loader2, Plus, LogOut, User as UserIcon } from "lucide-react";
import { PredictionResponse } from "@/lib/types";
import { createClient } from "@/lib/supabaseBrowser";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSearch = async (e?: React.FormEvent, directTicker?: string) => {
    if (e) e.preventDefault();
    const targetTicker = directTicker || searchInput.trim().toUpperCase();
    if (!targetTicker) return;
    
    setTicker(targetTicker);
    setSearchInput(targetTicker);
    setLoading(true);
    setError("");
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || "http://localhost:10000";
      const response = await fetch(`${backendUrl}/api/v1/predict/${targetTicker}`);
      if (!response.ok) {
        throw new Error("Failed to fetch forecast. The market data API might be rate limited.");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const addToWatchlist = async () => {
    if (!user || !data) return;
    try {
      const { error } = await supabase.from('watchlists').insert({
        user_id: user.id,
        symbol: data.ticker
      });
      if (error) throw error;
      alert(`Added ${data.ticker} to Watchlist`);
    } catch (err) {
      console.error(err);
      alert("Failed to add to watchlist. It might already be there.");
    }
  };

  return (
    <div className="flex flex-1 w-full bg-background overflow-hidden font-sans">
      {/* Sidebar for Auth & Watchlist */}
      <div className="w-[340px] bg-white/60 backdrop-blur-md border-r border-slate-200/60 p-6 flex flex-col h-full overflow-y-auto shrink-0 hidden md:flex shadow-soft z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-sm shadow-sm shadow-blue-500/20">F</span>
            FinPulse AI
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest mt-2 ml-10">Intelligence</p>
        </div>
        
        {authLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-primary text-sm font-medium">
            <Loader2 className="w-6 h-6 animate-spin" /> 
            <span>Loading Session...</span>
          </div>
        ) : !user ? (
          <div className="animate-in fade-in duration-500">
            <Auth onAuthSuccess={() => {}} />
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-50 p-2.5 rounded-xl text-primary">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged In</span>
                  <span className="text-xs font-semibold text-slate-700 truncate" title={user.email}>{user.email}</span>
                </div>
              </div>
              <button onClick={handleSignOut} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Your Watchlist</h3>
            </div>
            <div className="flex-grow bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <Watchlist onSelectTicker={(t) => handleSearch(undefined, t)} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-10 flex flex-col h-full overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header & Search */}
          <div className="w-full flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold md:hidden text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-xs shadow-sm">F</span>
              FinPulse
            </h1>
            <form onSubmit={(e) => handleSearch(e)} className="relative w-full max-w-xl flex items-center ml-auto shadow-sm group">
              <Search className="absolute left-5 text-slate-400 h-5 w-5 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search for a ticker (e.g. TSLA, NVDA)" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 pl-14 pr-4 py-4 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
              />
              <button type="submit" className="hidden">Search</button>
            </form>
          </div>

          {/* Error Boundary / Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="h-[500px] w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center text-slate-500">
              <div className="relative mb-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
                <Loader2 className="h-12 w-12 animate-spin text-primary absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
              </div>
              <p className="text-sm font-semibold tracking-wide">Running Neural Network Inference...</p>
            </div>
          ) : data ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 md:p-8 mb-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-bold text-slate-900 flex items-center gap-4 tracking-tight">
                      {data.ticker}
                      <span className="text-2xl text-slate-400 font-medium tracking-normal">Forecast</span>
                      {user && (
                        <button 
                          onClick={addToWatchlist}
                          className="text-xs bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-primary hover:border-blue-200 text-slate-600 px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold transition-all shadow-sm ml-2"
                          title="Add to Watchlist"
                        >
                          <Plus className="w-3.5 h-3.5" /> Save
                        </button>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold tracking-wider">
                        {data.model_used}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">ONNX Runtime</span>
                    </div>
                  </div>
                  <div className="text-right bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Volatility</p>
                    <p className="font-sans font-bold text-slate-900 text-3xl">{(data.metrics.historical_volatility * 100).toFixed(2)}<span className="text-slate-400 text-xl font-semibold">%</span></p>
                  </div>
                </div>
                
                <ChartVisualizer data={data.data} />
              </div>
              
              {/* Raw Data Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 md:p-8">
                <h3 className="text-sm font-bold text-slate-800 mb-6 tracking-widest uppercase flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                  Forecast Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-slate-400">
                        <th className="pb-4 pr-4 font-bold tracking-wide">Date</th>
                        <th className="pb-4 pr-4 font-bold tracking-wide text-right">Target Price</th>
                        <th className="pb-4 pr-4 font-bold tracking-wide text-right text-red-500/70">Lower Bound (-95%)</th>
                        <th className="pb-4 pr-4 font-bold tracking-wide text-right text-green-500/80">Upper Bound (+95%)</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium">
                      {data.data.filter((d) => d.is_forecast).slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 pr-4 text-slate-600 font-semibold">{row.date}</td>
                          <td className="py-4 pr-4 text-right text-slate-900 font-bold text-base">${row.price.toFixed(2)}</td>
                          <td className="py-4 pr-4 text-right text-red-500/90">${row.lower_bound?.toFixed(2)}</td>
                          <td className="py-4 pr-4 text-right text-green-600/90">${row.upper_bound?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs font-semibold text-slate-400 mt-6 text-center bg-slate-50/50 py-3 rounded-xl border border-slate-100 border-dashed">Displaying first 5 horizons. Scroll or export for more data.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full bg-white/40 backdrop-blur-sm border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <div className="bg-white p-5 rounded-full mb-5 shadow-sm border border-slate-100">
                <Search className="w-8 h-8 text-blue-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Search a ticker above to begin analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
