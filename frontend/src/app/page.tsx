"use client";

import { useState } from "react";
import ChartVisualizer from "@/components/ChartVisualizer";
import { Search, Loader2 } from "lucide-react";

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setTicker(searchInput.toUpperCase());
    setLoading(true);
    setError("");
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || "http://localhost:10000";
      const response = await fetch(`${backendUrl}/api/v1/predict/${searchInput.toUpperCase()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch forecast. The market data API might be rate limited.");
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 max-w-5xl mx-auto w-full">
      
      {/* Header & Search */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FinPulse AI</h1>
          <p className="text-sm text-gray-500">Prospective Financial Intelligence</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative mt-4 md:mt-0 w-full md:w-auto flex items-center">
          <Search className="absolute left-3 text-gray-500 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search Ticker (e.g. TSLA)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-surface border border-border text-white pl-10 pr-4 py-2 w-full md:w-64 focus:outline-none focus:border-gray-500 transition-colors uppercase"
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {error && (
          <div className="bg-red-950 border border-red-900 text-red-200 p-4 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 w-full border border-border bg-surface flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-gray-400" />
            <p>Running ONNX Inference for {ticker}...</p>
          </div>
        ) : data ? (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{data.ticker} Forecast</h2>
                <p className="text-xs text-gray-500">Model: {data.model_used}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Historical Volatility</p>
                <p className="font-mono text-white">{(data.metrics.historical_volatility * 100).toFixed(2)}%</p>
              </div>
            </div>
            <ChartVisualizer data={data.data} />
            
            {/* Raw Data Table for Accessibility & Terminal Feel */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-400 mb-2 border-b border-border pb-1">Forecast Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-gray-500">
                      <th className="py-2 pr-4 font-normal">DATE</th>
                      <th className="py-2 pr-4 font-normal text-right">TARGET PRICE</th>
                      <th className="py-2 pr-4 font-normal text-right">LOWER BOUND (-95%)</th>
                      <th className="py-2 pr-4 font-normal text-right">UPPER BOUND (+95%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.filter((d: any) => d.is_forecast).slice(0, 5).map((row: any, i: number) => (
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
          <div className="h-96 w-full border border-border bg-surface flex flex-col items-center justify-center text-gray-500">
            <p>Enter a ticker symbol above to generate a forecast.</p>
          </div>
        )}
      </div>
    </div>
  );
}
