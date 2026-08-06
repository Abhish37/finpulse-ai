"use client";

import { useState, useEffect } from "react";
import ChartVisualizer from "@/components/ChartVisualizer";
import Auth from "@/components/Auth";
import Watchlist from "@/components/Watchlist";
import { Search, Loader2, Plus, LogOut, User as UserIcon, ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Info } from "lucide-react";
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
  const [showEvidence, setShowEvidence] = useState(false);
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
      
      // Attempt to save to Ledger
      try {
        if (result.contract) {
          await supabase.from('forecast_contracts').insert({
            symbol: result.contract.asset,
            model_version: result.model_used,
            horizon: result.contract.horizon,
            state_output: result.contract.state,
            probability_up: result.contract.probability_up,
            probability_down: result.contract.probability_down,
            probability_neutral: result.contract.probability_neutral,
            expected_return: result.contract.expected_return,
            interval_lower: result.contract.prediction_interval_80[0],
            interval_upper: result.contract.prediction_interval_80[1],
            invalidation_price: result.contract.invalidation_level,
            catalysts: result.contract.catalysts,
            risk_flags: result.contract.risk_flags,
            calibration_score: result.contract.calibration_score,
            expires_at: result.contract.expiry
          });
          
          await supabase.from('market_regimes').insert({
            symbol: result.contract.asset,
            regime_state: result.contract.regime,
            probabilities: { "up": result.contract.probability_up, "down": result.contract.probability_down },
            regime_stability: result.contract.confidence
          });
        }
      } catch (e) {
        console.error("Failed to insert into ledger. Make sure migrations are run.", e);
      }
      
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

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  return (
    <div className="flex flex-1 w-full bg-background overflow-hidden font-sans text-gray-200">
      {/* Sidebar for Auth & Watchlist */}
      <div className="w-[340px] bg-surface border-r border-border p-6 flex flex-col h-full overflow-y-auto shrink-0 hidden md:flex z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background text-sm font-bold">F</span>
            FinPulse AI
          </h1>
          <p className="text-[11px] text-gray-500 font-mono uppercase tracking-widest mt-2 ml-10">Terminal v1.0</p>
        </div>
        
        {authLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-primary text-sm font-mono">
            <Loader2 className="w-6 h-6 animate-spin" /> 
            <span>AUTH_INIT...</span>
          </div>
        ) : !user ? (
          <div className="animate-in fade-in duration-500">
            <Auth onAuthSuccess={() => {}} />
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8 bg-[#1A2332] border border-border rounded p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-primary/20 p-2 rounded text-primary">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator</span>
                  <span className="text-xs font-semibold text-gray-300 truncate" title={user.email}>{user.email}</span>
                </div>
              </div>
              <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors shrink-0" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Active Watchlist</h3>
            </div>
            <div className="flex-grow bg-[#1A2332] rounded border border-border overflow-hidden">
              <Watchlist onSelectTicker={(t) => handleSearch(undefined, t)} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col h-full overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header & Search */}
          <div className="w-full flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold md:hidden text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary flex items-center justify-center text-background text-xs">F</span>
              FinPulse
            </h1>
            <form onSubmit={(e) => handleSearch(e)} className="relative w-full max-w-xl flex items-center ml-auto group">
              <Search className="absolute left-4 text-gray-500 h-4 w-4 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="EXECUTE QUERY (e.g. AAPL)" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-surface border border-border text-white pl-12 pr-4 py-3 rounded w-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-sm placeholder:text-gray-600 uppercase"
              />
              <button type="submit" className="hidden">Search</button>
            </form>
          </div>

          {/* Error Boundary / Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded mb-6 text-sm font-mono flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="h-[500px] w-full bg-surface/50 border border-border border-dashed rounded flex flex-col items-center justify-center text-gray-500 font-mono">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-xs tracking-widest uppercase">Executing Contract Inference for {ticker}...</p>
            </div>
          ) : data && data.contract ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
              
              {/* FINPULSE DECISION CARD */}
              <div className="bg-surface rounded border border-border p-6 mb-6">
                
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b border-border pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                      {data.ticker}
                      <span className="text-xl text-gray-500 font-mono font-normal">| {data.contract.horizon.replace('_', ' ')}</span>
                      {user && (
                        <button 
                          onClick={addToWatchlist}
                          className="text-[10px] uppercase font-mono bg-border hover:bg-primary/20 hover:text-primary text-gray-400 px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ml-2"
                        >
                          <Plus className="w-3 h-3" /> Monitor
                        </button>
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        {data.contract.state.replace(/_/g, ' ')}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-background border border-border px-2 py-1 rounded">
                        REGIME: {data.contract.regime.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 border border-border px-2 py-1 rounded">
                        {data.model_used}
                      </span>
                    </div>
                  </div>
                  
                  {/* Probability Distribution */}
                  <div className="flex items-center gap-4 bg-background p-3 rounded border border-border">
                    <div className="text-center px-3 border-r border-border">
                      <p className="text-[10px] font-mono text-primary uppercase mb-1">P(Up)</p>
                      <p className="font-mono text-xl text-white">{formatPercent(data.contract.probability_up)}</p>
                    </div>
                    <div className="text-center px-3 border-r border-border">
                      <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">P(Neutral)</p>
                      <p className="font-mono text-xl text-white">{formatPercent(data.contract.probability_neutral)}</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-[10px] font-mono text-red-500 uppercase mb-1">P(Down)</p>
                      <p className="font-mono text-xl text-white">{formatPercent(data.contract.probability_down)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-background border border-border p-4 rounded flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-mono uppercase mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-primary" /> Expected Return
                    </p>
                    <p className={`font-mono text-2xl ${data.contract.expected_return >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {data.contract.expected_return >= 0 ? '+' : ''}{formatPercent(data.contract.expected_return)}
                    </p>
                  </div>
                  
                  <div className="bg-background border border-border p-4 rounded flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-mono uppercase mb-2 flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-gray-400" /> 80% Pred. Interval
                    </p>
                    <p className="font-mono text-lg text-white">
                      ${data.contract.prediction_interval_80[0].toFixed(2)} - ${data.contract.prediction_interval_80[1].toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded flex flex-col justify-center">
                    <p className="text-[10px] text-red-400 font-mono uppercase mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3" /> Invalidation Level
                    </p>
                    <p className="font-mono text-2xl text-red-400">
                      ${data.contract.invalidation_level.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-background border border-border p-4 rounded flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-mono uppercase mb-2 flex items-center gap-1.5">
                      Calibration Score
                    </p>
                    <p className="font-mono text-2xl text-white">
                      {data.contract.calibration_score.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Expandable Evidence Ledger */}
                <div className="border border-border rounded overflow-hidden">
                  <button 
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="w-full bg-[#1A2332] p-3 flex items-center justify-between text-xs font-mono text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="uppercase tracking-widest flex items-center gap-2">
                      View Evidence Ledger
                    </span>
                    {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showEvidence && (
                    <div className="p-4 bg-background border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <h4 className="text-[10px] font-mono text-primary uppercase mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full"></div> Positive Catalysts
                        </h4>
                        <ul className="space-y-2">
                          {data.contract.catalysts.map((cat, i) => (
                            <li key={i} className="text-xs text-gray-300 font-mono flex items-start gap-2">
                              <span className="text-primary mt-0.5">›</span> {cat}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-mono text-red-400 uppercase mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full"></div> Risk Flags
                        </h4>
                        <ul className="space-y-2">
                          {data.contract.risk_flags.map((flag, i) => (
                            <li key={i} className="text-xs text-gray-300 font-mono flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" /> {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Chart Visualizer */}
              <div className="bg-surface rounded border border-border p-6 mb-6">
                 <h3 className="text-xs font-mono text-gray-500 mb-4 tracking-widest uppercase flex items-center gap-2">
                  <div className="w-1 h-3 bg-gray-600"></div>
                  Price Projection
                </h3>
                <ChartVisualizer data={data.data} />
              </div>
              
              {/* Raw Data Table */}
              <div className="bg-surface rounded border border-border p-6">
                <h3 className="text-xs font-mono text-gray-500 mb-6 tracking-widest uppercase flex items-center gap-2">
                  <div className="w-1 h-3 bg-gray-600"></div>
                  Forecast Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm font-mono">
                    <thead>
                      <tr className="border-b border-border text-gray-500">
                        <th className="pb-3 pr-4 font-normal text-xs uppercase tracking-wider">Date</th>
                        <th className="pb-3 pr-4 font-normal text-xs uppercase tracking-wider text-right">Target Price</th>
                        <th className="pb-3 pr-4 font-normal text-xs uppercase tracking-wider text-right text-red-400/80">Lower Bound (-80%)</th>
                        <th className="pb-3 pr-4 font-normal text-xs uppercase tracking-wider text-right text-primary/80">Upper Bound (+80%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.filter((d) => d.is_forecast).slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-4 text-gray-400">{row.date}</td>
                          <td className="py-3 pr-4 text-right text-white font-bold">${row.price.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-right text-red-400/90">${row.lower_bound?.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-right text-primary/90">${row.upper_bound?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full border border-border border-dashed rounded flex flex-col items-center justify-center text-gray-600 font-mono">
              <div className="bg-border/30 p-4 rounded mb-4">
                <Search className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-xs uppercase tracking-widest">Awaiting query parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
