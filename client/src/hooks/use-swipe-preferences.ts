import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface SwipePreference {
  id: string;
  userId: string;
  movieId: number;
  preference: 'like' | 'dislike';
  createdAt: string;
}

export function useSwipePreferences() {
  const [preferences, setPreferences] = useState<SwipePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('swipe_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error('Error loading swipe preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPreference = async (movieId: number, preference: 'like' | 'dislike') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('swipe_preferences')
        .insert({
          user_id: user.id,
          movie_id: movieId,
          preference
        })
        .select()
        .single();

      if (error) throw error;
      
      setPreferences(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding swipe preference:', error);
      throw error;
    }
  };

  const removePreference = async (movieId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('swipe_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
      
      setPreferences(prev => prev.filter(p => p.movieId !== movieId));
    } catch (error) {
      console.error('Error removing swipe preference:', error);
      throw error;
    }
  };

  const getPreference = (movieId: number): 'like' | 'dislike' | null => {
    const preference = preferences.find(p => p.movieId === movieId);
    return preference ? preference.preference : null;
  };

  const getLikedMovies = () => {
    return preferences.filter(p => p.preference === 'like');
  };

  const getDislikedMovies = () => {
    return preferences.filter(p => p.preference === 'dislike');
  };

  const getPreferenceCount = () => {
    return {
      liked: getLikedMovies().length,
      disliked: getDislikedMovies().length,
      total: preferences.length
    };
  };

  return {
    preferences,
    isLoading,
    addPreference,
    removePreference,
    getPreference,
    getLikedMovies,
    getDislikedMovies,
    getPreferenceCount,
    loadPreferences
  };
}
