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

  if (loading) return <div className="text-gray-500 text-xs">Loading watchlist...</div>;
  if (items.length === 0) return <div className="text-gray-500 text-xs italic">Watchlist is empty.</div>;

  return (
    <ul className="flex flex-col gap-2">
      {items.map(item => (
        <li 
          key={item.id} 
          onClick={() => onSelectTicker(item.symbol)}
          className="flex justify-between items-center bg-surface border border-border p-2 cursor-pointer hover:border-gray-500 transition-colors group"
        >
          <span className="font-bold text-white text-sm">{item.symbol}</span>
          <button 
            onClick={(e) => removeItem(item.id, e)} 
            className="text-gray-600 hover:text-accent-down opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove from watchlist"
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
