'use client';
import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface StockItem {
  symbol: string;
  company_name: string;
}

interface SectorMap {
  [category: string]: StockItem[];
}

export const CategoryBar = ({ onSelectStock, sectorData }: { onSelectStock: (symbol: string) => void, sectorData: SectorMap }) => {
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(sectorData)[0] || 'Mega-Cap Tech');

  return (
    <div className="w-full bg-white border-b border-slate-200 p-3 text-sm shadow-sm">
      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="flex items-center text-slate-500 font-mono text-xs uppercase px-2 font-semibold">
          <Layers className="w-3.5 h-3.5 mr-1" /> Sectors:
        </span>
        {Object.keys(sectorData).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all text-xs whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Items inside Selected Category */}
      <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1">
        {sectorData[activeCategory]?.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => onSelectStock(stock.symbol)}
            className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <span className="font-bold text-blue-600">{stock.symbol}</span>
            <span className="text-slate-500 text-[10px] truncate max-w-[120px]">{stock.company_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
