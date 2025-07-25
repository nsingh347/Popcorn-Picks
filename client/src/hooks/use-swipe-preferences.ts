import { useState, useEffect } from 'react';
import type { SwipePreference } from '@/types/movie';

export function useSwipePreferences() {
  const [preferences, setPreferences] = useState<SwipePreference[]>([]);

  useEffect(() => {
    // No localStorage: do not load from or save to localStorage
    setPreferences([]); // Always start empty
  }, []);

  const addPreference = (preference: SwipePreference) => {
    const newPreferences = [...preferences, preference];
    setPreferences(newPreferences);
    // No localStorage
  };

  const getLikedGenres = (): number[] => {
    const likedPreferences = preferences.filter(p => p.preference === 'like');
    const genreCounts: Record<number, number> = {};
    
    likedPreferences.forEach(pref => {
      pref.genreIds.forEach(genreId => {
        genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
      });
    });

    // Return genres sorted by frequency
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([genreId]) => parseInt(genreId));
  };

  const getLikedMovieIds = (): number[] => {
    return preferences
      .filter(p => p.preference === 'like')
      .map(p => p.movieId);
  };

  const getDislikedMovieIds = (): number[] => {
    return preferences
      .filter(p => p.preference === 'dislike')
      .map(p => p.movieId);
  };

  const clearPreferences = () => {
    setPreferences([]);
    // No localStorage
  };

  return {
    preferences,
    addPreference,
    getLikedGenres,
    getLikedMovieIds,
    getDislikedMovieIds,
    clearPreferences,
    hasPreferences: preferences.length > 0
  };
}
