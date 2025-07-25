import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tmdbService } from '@/services/tmdb';

export default function useRealtimeMatchedMovies(coupleId: string | undefined) {
  const [matchedMovies, setMatchedMovies] = useState<any[]>([]);
  useEffect(() => {
    if (!coupleId) return;
    let subscription: any;
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from('matched_movies')
        .select('movie_id')
        .eq('couple_id', coupleId);
      if (data) {
        const details = await Promise.all(data.map((m: any) => tmdbService.getMovieDetails(m.movie_id)));
        setMatchedMovies(details);
      }
    };
    fetchMovies();
    subscription = supabase
      .channel('matched_movies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matched_movies', filter: `couple_id=eq.${coupleId}` }, fetchMovies)
      .subscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, [coupleId]);
  return matchedMovies;
} 