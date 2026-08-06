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
      // Simple notification
      alert(`Added ${data.ticker} to Watchlist`);
    } catch (err) {
      console.error(err);
      alert("Failed to add to watchlist. It might already be there.");
    }
  };

  return (
    <div className="flex flex-1 w-full bg-background overflow-hidden">
      {/* Sidebar for Auth & Watchlist */}
      <div className="w-80 border-r border-border bg-surface p-6 flex flex-col h-full overflow-y-auto shrink-0 hidden md:flex">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">FinPulse AI</h1>
          <p className="text-xs text-gray-500">Prospective Financial Intelligence</p>
        </div>
        
        {authLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking Session...
          </div>
        ) : !user ? (
          <Auth onAuthSuccess={() => {}} />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 bg-background border border-border p-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-300 truncate" title={user.email}>{user.email}</span>
              </div>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-white shrink-0" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-sm font-bold text-gray-400 mb-3 border-b border-border pb-2">YOUR WATCHLIST</h3>
            <div className="flex-grow">
              <Watchlist onSelectTicker={(t) => handleSearch(undefined, t)} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col h-full overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header & Search */}
          <div className="w-full flex justify-between items-center mb-8 border-b border-border pb-4">
            <h1 className="text-xl font-bold md:hidden text-white">FinPulse AI</h1>
            <form onSubmit={(e) => handleSearch(e)} className="relative w-full max-w-md flex items-center ml-auto">
              <Search className="absolute left-3 text-gray-500 h-4 w-4" />
              <input 
                type="text" 
                placeholder="SEARCH TICKER (e.g. TSLA)" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-surface border border-border text-white pl-10 pr-4 py-2 w-full focus:outline-none focus:border-gray-500 transition-colors uppercase text-sm"
              />
              <button type="submit" className="hidden">Search</button>
            </form>
          </div>

          {/* Error Boundary / Messages */}
          {error && (
            <div className="bg-red-950 border border-red-900 text-red-200 p-4 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="h-96 w-full border border-border bg-surface flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-gray-400" />
              <p className="text-sm">Running ONNX Inference for {ticker}...</p>
            </div>
          ) : data ? (
            <div className="animate-in fade-in duration-500 pb-16">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {data.ticker} Forecast
                    {user && (
                      <button 
                        onClick={addToWatchlist}
                        className="text-xs bg-surface border border-border hover:bg-gray-800 text-white px-2 py-1 flex items-center gap-1 font-normal transition-colors"
                        title="Add to Watchlist"
                      >
                        <Plus className="w-3 h-3" /> ADD
                      </button>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Model: {data.model_used}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Historical Volatility</p>
                  <p className="font-mono text-white text-lg">{(data.metrics.historical_volatility * 100).toFixed(2)}%</p>
                </div>
              </div>
              
              <ChartVisualizer data={data.data} />
              
              {/* Raw Data Table */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-400 mb-2 border-b border-border pb-1">FORECAST MATRIX</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-gray-500">
                        <th className="py-2 pr-4 font-normal">DATE</th>
                        <th className="py-2 pr-4 font-normal text-right">TARGET PRICE</th>
                        <th className="py-2 pr-4 font-normal text-right">LOWER BOUND (-95%)</th>
                        <th className="py-2 pr-4 font-normal text-right">UPPER BOUND (+95%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.filter((d) => d.is_forecast).slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-surface">
                          <td className="py-2 pr-4 text-gray-300">{row.date}</td>
                          <td className="py-2 pr-4 text-right text-accent-line">${row.price.toFixed(2)}</td>
                          <td className="py-2 pr-4 text-right text-accent-down">${row.lower_bound?.toFixed(2)}</td>
                          <td className="py-2 pr-4 text-right text-gray-300">${row.upper_bound?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-600 mt-2 text-right">Displaying first 5 horizons. Scroll for more data.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 w-full border border-border bg-surface flex flex-col items-center justify-center text-gray-500 text-sm">
              <p>Enter a ticker symbol above to generate a forecast.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
