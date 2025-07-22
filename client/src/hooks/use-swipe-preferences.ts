import { useState, useEffect } from 'react';
import type { SwipePreference } from '@/types/movie';

const STORAGE_KEY = 'popcorn-picks-preferences';

export function useSwipePreferences() {
  const [preferences, setPreferences] = useState<SwipePreference[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  const addPreference = (preference: SwipePreference) => {
    const newPreferences = [...preferences, preference];
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
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
    localStorage.removeItem(STORAGE_KEY);
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
