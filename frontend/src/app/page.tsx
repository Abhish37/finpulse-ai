"use client";

import { useState, useEffect } from "react";
import ChartVisualizer from "@/components/ChartVisualizer";
import Auth from "@/components/Auth";
import Watchlist from "@/components/Watchlist";
import { CategoryBar } from "@/components/CategoryBar";
import { ModeToggle } from "@/components/ModeToggle";
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

  // New Layman Mode & Sector State
  const [isLaymanMode, setIsLaymanMode] = useState(false);
  const [sectors, setSectors] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    // Fetch sectors
    const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || "http://localhost:10000";
    fetch(`${backendUrl}/api/v1/sectors`)
      .then(res => res.json())
      .then(data => setSectors(data))
      .catch(err => console.error("Failed to load sectors", err));
      
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
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to add to watchlist: ${errorMessage}`);
    }
  };

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  // Translation helpers
  const translateRegime = (regime: string) => {
    if (!isLaymanMode) return regime.toUpperCase();
    const map: Record<string, string> = {
      'volatility_expansion': 'Wild Price Swings (High Risk)',
      'range_bound': 'Moving Sideways',
      'trend_continuation': 'Continuing Current Trend',
      'mean_reversion': 'Bouncing Back to Average'
    };
    return map[regime] || regime.toUpperCase();
  };

  const translateState = (state: string) => {
    if (!isLaymanMode) return state.replace(/_/g, ' ');
    const map: Record<string, string> = {
      'bearish_distribution': 'Higher Chance of Drop',
      'bullish_distribution': 'Higher Chance of Rise',
      'neutral_distribution': 'Likely Staying Flat'
    };
    return map[state] || state.replace(/_/g, ' ');
  };

  return (
    <div className="flex flex-1 w-full bg-transparent overflow-hidden font-sans text-slate-800">
      {/* Sidebar for Auth & Watchlist */}
      <div className="w-[340px] bg-white/60 backdrop-blur-md border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto shrink-0 hidden md:flex z-10 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">F</span>
            FinPulse AI
          </h1>
          <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest mt-2 ml-10">Terminal v1.0</p>
        </div>
        
        {authLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-blue-500 text-sm font-mono">
            <Loader2 className="w-6 h-6 animate-spin" /> 
            <span>AUTH_INIT...</span>
          </div>
        ) : !user ? (
          <div className="animate-in fade-in duration-500">
            <Auth onAuthSuccess={() => {}} />
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Operator</span>
                  <span className="text-xs font-semibold text-slate-700 truncate" title={user.email}>{user.email}</span>
                </div>
              </div>
              <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-mono text-slate-500 tracking-widest uppercase ml-1">Active Watchlist</h3>
            </div>
            <div className="flex-grow bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <Watchlist onSelectTicker={(t) => handleSearch(undefined, t)} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header & Search Bar */}
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-20">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-xl font-bold md:hidden text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs">F</span>
              FinPulse
            </h1>
            <ModeToggle isLaymanMode={isLaymanMode} setIsLaymanMode={setIsLaymanMode} />
          </div>
          
          <form onSubmit={(e) => handleSearch(e)} className="relative w-full md:max-w-md flex items-center group">
            <Search className="absolute left-3 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="EXECUTE QUERY (e.g. AAPL)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-xs placeholder:text-slate-400 uppercase shadow-inner"
            />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        {/* Sector Navigation Bar */}
        <div className="z-10">
          {Object.keys(sectors).length > 0 && (
            <CategoryBar onSelectStock={(t) => handleSearch(undefined, t)} sectorData={sectors} />
          )}
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="w-full max-w-5xl mx-auto">
            
            {/* Error Boundary / Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-mono flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
                <ShieldAlert className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {/* Warning Badge for Cached Fallback */}
            {data && data.cached_fallback && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl mb-6 text-xs font-mono flex items-center gap-2 shadow-sm animate-in fade-in">
                <AlertTriangle className="w-4 h-4" />
                Serving Cached Forecast (Market Data API Paused)
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="h-[400px] w-full bg-white/50 backdrop-blur-sm border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-500 font-mono shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-xs tracking-widest uppercase">Executing Contract Inference for {ticker}...</p>
              </div>
            ) : data && data.contract ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
                
                {/* FINPULSE DECISION CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                  
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                        {data.ticker}
                        <span className="text-xl text-slate-400 font-mono font-normal">| {data.contract.horizon.replace('_', ' ')}</span>
                        {user && (
                          <button 
                            onClick={addToWatchlist}
                            className="text-[10px] uppercase font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ml-2 border border-slate-200"
                          >
                            <Plus className="w-3 h-3" /> Monitor
                          </button>
                        )}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-mono uppercase tracking-wider font-semibold">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          {translateState(data.contract.state)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md font-medium uppercase">
                          {isLaymanMode ? 'Market State' : 'Regime'}: {translateRegime(data.contract.regime)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-2 py-1 rounded-md">
                          {data.model_used}
                        </span>
                      </div>
                    </div>
                    
                    {/* Probability Distribution */}
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner">
                      <div className="text-center px-3 border-r border-slate-200">
                        <p className="text-[10px] font-mono text-emerald-600 uppercase mb-1 font-semibold">{isLaymanMode ? 'Win Chance' : 'P(Up)'}</p>
                        <p className="font-mono text-xl text-slate-800 font-semibold">{formatPercent(data.contract.probability_up)}</p>
                      </div>
                      <div className="text-center px-3 border-r border-slate-200">
                        <p className="text-[10px] font-mono text-slate-500 uppercase mb-1 font-semibold">{isLaymanMode ? 'Stay Flat' : 'P(Neutral)'}</p>
                        <p className="font-mono text-xl text-slate-800 font-semibold">{formatPercent(data.contract.probability_neutral)}</p>
                      </div>
                      <div className="text-center px-3">
                        <p className="text-[10px] font-mono text-rose-500 uppercase mb-1 font-semibold">{isLaymanMode ? 'Drop Chance' : 'P(Down)'}</p>
                        <p className="font-mono text-xl text-slate-800 font-semibold">{formatPercent(data.contract.probability_down)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5 font-semibold" title={isLaymanMode ? "Estimated percentage change over the selected timeframe" : ""}>
                        <TrendingUp className="w-3 h-3 text-emerald-500" /> {isLaymanMode ? 'Forecasted Price Shift' : 'Expected Return'}
                      </p>
                      <p className={`font-mono text-2xl font-bold ${data.contract.expected_return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {data.contract.expected_return >= 0 ? '+' : ''}{formatPercent(data.contract.expected_return)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5 font-semibold">
                        <Info className="w-3 h-3 text-blue-400" /> {isLaymanMode ? 'Estimated Price Range' : '80% Pred. Interval'}
                      </p>
                      <p className="font-mono text-lg text-slate-700 font-semibold">
                        ${data.contract.prediction_interval_80[0].toFixed(2)} - ${data.contract.prediction_interval_80[1].toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-rose-500 font-mono uppercase mb-2 flex items-center gap-1.5 font-semibold" title={isLaymanMode ? "If the price drops below this, our prediction is canceled" : ""}>
                        <ShieldAlert className="w-3 h-3" /> {isLaymanMode ? 'Safety Cancel Threshold' : 'Invalidation Level'}
                      </p>
                      <p className="font-mono text-2xl text-rose-600 font-bold">
                        ${data.contract.invalidation_level.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-center shadow-sm">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5 font-semibold" title={isLaymanMode ? "In past scenarios like this, system was accurate this % of the time" : ""}>
                        {isLaymanMode ? 'System Reliability' : 'Calibration Score'}
                      </p>
                      <p className="font-mono text-2xl text-slate-700 font-bold">
                        {isLaymanMode ? formatPercent(data.contract.calibration_score) : data.contract.calibration_score.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expandable Evidence Ledger */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setShowEvidence(!showEvidence)}
                      className="w-full bg-slate-50 p-3 flex items-center justify-between text-xs font-mono text-slate-500 hover:text-blue-600 transition-colors font-semibold"
                    >
                      <span className="uppercase tracking-widest flex items-center gap-2">
                        View Evidence Ledger
                      </span>
                      {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showEvidence && (
                      <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div>
                          <h4 className="text-[10px] font-mono text-emerald-600 uppercase mb-3 flex items-center gap-2 font-bold tracking-wider">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {isLaymanMode ? 'Positive Signals' : 'Positive Catalysts'}
                          </h4>
                          <ul className="space-y-2">
                            {data.contract.catalysts.map((cat, i) => (
                              <li key={i} className="text-xs text-slate-600 font-mono flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">›</span> {cat}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-mono text-rose-500 uppercase mb-3 flex items-center gap-2 font-bold tracking-wider">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Risk Flags
                          </h4>
                          <ul className="space-y-2">
                            {data.contract.risk_flags.map((flag, i) => (
                              <li key={i} className="text-xs text-slate-600 font-mono flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" /> {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Chart Visualizer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                   <h3 className="text-xs font-mono text-slate-500 mb-4 tracking-widest uppercase flex items-center gap-2 font-semibold">
                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                    Price Projection
                  </h3>
                  <ChartVisualizer data={data.data} />
                </div>
                
                {/* Raw Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xs font-mono text-slate-500 mb-6 tracking-widest uppercase flex items-center gap-2 font-semibold">
                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                    Forecast Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm font-mono">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider">Date</th>
                          <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-right">Target Price</th>
                          <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-right text-rose-500">Lower Bound (-80%)</th>
                          <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-right text-emerald-500">Upper Bound (+80%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.data.filter((d) => d.is_forecast).slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 pr-4 text-slate-500">{row.date}</td>
                            <td className="py-3 pr-4 text-right text-slate-800 font-bold">${row.price.toFixed(2)}</td>
                            <td className="py-3 pr-4 text-right text-rose-500 font-medium">${row.lower_bound?.toFixed(2)}</td>
                            <td className="py-3 pr-4 text-right text-emerald-500 font-medium">${row.upper_bound?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] w-full bg-white/50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-500 font-mono shadow-sm">
                <div className="bg-slate-100 p-4 rounded-xl mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs uppercase tracking-widest font-semibold">Awaiting query parameters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
