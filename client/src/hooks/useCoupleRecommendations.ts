import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tmdbService } from '@/services/tmdb';

export default function useCoupleRecommendations(coupleId: string | undefined) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  useEffect(() => {
    if (!coupleId) return;
    const fetchRecommendations = async () => {
      // Get all liked movies for this couple
      const { data: swipes } = await supabase
        .from('couple_swipes')
        .select('movie_id')
        .eq('couple_id', coupleId)
        .eq('liked', true);
      if (!swipes || swipes.length === 0) { setRecommendations([]); return; }
      // Get genres from those movies
      const movieDetails = await Promise.all(swipes.map((s: any) => tmdbService.getMovieDetails(s.movie_id)));
      const genreIds = Array.from(new Set(movieDetails.flatMap((m: any) => m.genre_ids || [])));
      // Get recommendations from TMDB
      const recs = await tmdbService.getRecommendationsAdvanced({ likedGenres: genreIds });
      setRecommendations(recs);
    };
    fetchRecommendations();
    // Optionally, add a real-time listener for couple_swipes
  }, [coupleId]);
  return recommendations;
} 