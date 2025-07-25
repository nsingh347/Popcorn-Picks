import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tmdbService } from '@/services/tmdb';

export default function useRealtimeJointWatchlist(coupleId: string | undefined) {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  useEffect(() => {
    if (!coupleId) return;
    let subscription: any;
    const fetchWatchlist = async () => {
      const { data, error } = await supabase
        .from('joint_watchlists')
        .select('movie_id')
        .eq('couple_id', coupleId);
      if (data) {
        const details = await Promise.all(data.map((m: any) => tmdbService.getMovieDetails(m.movie_id)));
        setWatchlist(details);
      }
    };
    fetchWatchlist();
    subscription = supabase
      .channel('joint_watchlists')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'joint_watchlists', filter: `couple_id=eq.${coupleId}` }, fetchWatchlist)
      .subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [coupleId]);
  return watchlist;
} 