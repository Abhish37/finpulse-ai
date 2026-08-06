"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseBrowser';
import { Trash2 } from 'lucide-react';

interface WatchlistItem {
  id: string;
  symbol: string;
  target_alert_price: number | null;
}

export default function Watchlist({ onSelectTicker }: { onSelectTicker: (ticker: string) => void }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching watchlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    
    // Subscribe to changes
    const channel = supabase.channel('watchlist_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlists' }, fetchWatchlist)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const removeItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('watchlists').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-gray-500 text-[10px] font-mono p-4 text-center tracking-widest uppercase">Syncing...</div>;
  if (items.length === 0) return <div className="text-gray-500 text-[10px] font-mono p-4 text-center tracking-widest uppercase">No assets monitored</div>;

  return (
    <ul className="flex flex-col">
      {items.map((item, index) => (
        <li 
          key={item.id} 
          onClick={() => onSelectTicker(item.symbol)}
          className={`flex justify-between items-center p-4 cursor-pointer hover:bg-border/50 transition-colors group ${index !== items.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="font-bold text-white text-sm font-mono tracking-widest">{item.symbol}</span>
          <button 
            onClick={(e) => removeItem(item.id, e)} 
            className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Remove from watchlist"
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
