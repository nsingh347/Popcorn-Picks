import { useState, useEffect } from 'react';
import type { Movie } from '@/types/movie';

const WATCHLIST_STORAGE_KEY = 'popcorn-picks-watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  }, []);

  const addToWatchlist = (movie: Movie) => {
    const isAlreadyInWatchlist = watchlist.some(item => item.id === movie.id);
    if (!isAlreadyInWatchlist) {
      const newWatchlist = [...watchlist, movie];
      setWatchlist(newWatchlist);
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
    }
  };

  const removeFromWatchlist = (movieId: number) => {
    const newWatchlist = watchlist.filter(movie => movie.id !== movieId);
    setWatchlist(newWatchlist);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
  };

  const isInWatchlist = (movieId: number): boolean => {
    return watchlist.some(movie => movie.id === movieId);
  };

  const clearWatchlist = () => {
    setWatchlist([]);
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  };

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist
  };
}
