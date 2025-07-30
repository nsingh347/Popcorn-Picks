import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, TrendingUp, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SwipeCard } from '@/components/swipe-card';
import { ApiError } from '@/components/api-error';
import { useSwipePreferences } from '@/hooks/use-swipe-preferences';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import type { Movie } from '@/types/movie';
import { Link } from 'wouter';
import { useCouples } from '@/contexts/CouplesContext';
import { useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

function MatchPopup({ show, movie, onClose }: { show: boolean; movie: Movie | null; onClose: () => void }) {
  if (!show || !movie) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center relative max-w-md">
        <h2 className="text-3xl font-bold text-pink-500 mb-4">It's a Date Night! 🍿💖</h2>
        <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : ''} alt={movie.title} className="mx-auto mb-4 rounded-lg shadow-lg w-32 h-48 object-cover" />
        <p className="text-lg text-gray-700 mb-4">You and your partner both want to watch <span className="font-bold">{movie.title}</span>!</p>
        <Button onClick={onClose} className="bg-pink-500 text-white px-6 py-2 rounded-full font-semibold">Yay!</Button>
      </div>
    </div>
  );
}

export default function Swipe() {
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [swipedMovieIds, setSwipedMovieIds] = useState<Set<number>>(new Set());
  const { addPreference, getLikedGenres, hasPreferences } = useSwipePreferences();
  const { currentRelationship, couplePreferences, addMatchedMovie, coupleId } = useCouples();
  const [showMatch, setShowMatch] = useState(false);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);
  const [genreId, setGenreId] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [providerId, setProviderId] = useState<number | undefined>();

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => tmdbService.getWatchProvidersList(),
  });

  // Simplified options for now
  const allYears = Array.from({ length: 45 }, (_, i) => 2024 - i);

  // Load movies with random page and filters
  const { data: moviesData, refetch, error, isLoading } = useQuery({
    queryKey: ['swipe-movies', genreId, year, providerId],
    queryFn: async () => {
      const randomPage = Math.floor(Math.random() * 10) + 1; // Random page 1-10
      console.log('Fetching movies with:', { randomPage, genreId, year, providerId });
      
      // Check if API key is available
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        console.error('TMDB API key is missing! Please add VITE_TMDB_API_KEY to your .env file');
        // Return empty array instead of throwing error
        return [];
      }
      
      try {
        const response = await tmdbService.getMoviesForSwipe(randomPage, { genreId, year, providerId });
        console.log('TMDB response:', response?.length, 'movies');
        return response || [];
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    enabled: true, // Always enable the query
  });

  // Debug logging - simplified to avoid potential issues
  console.log('Swipe page loaded');
  console.log('Movies data:', moviesData);
  console.log('Current movies:', currentMovies);
  console.log('Current index:', currentIndex);

  useEffect(() => {
    if (moviesData && moviesData.length > 0) {
      // Filter out already swiped movies and shuffle the remaining ones
      const availableMovies = moviesData.filter(movie => !swipedMovieIds.has(movie.id));
      const shuffledMovies = availableMovies.sort(() => Math.random() - 0.5);
      setCurrentMovies(shuffledMovies);
      setCurrentIndex(0);
    }
  }, [moviesData, swipedMovieIds]);

  const loadMoreMovies = async () => {
    setIsLoadingMore(true);
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const newMovies = await tmdbService.getMoviesForSwipe(randomPage, { genreId, year, providerId });
      if (newMovies && newMovies.length > 0) {
        const availableMovies = newMovies.filter(movie => !swipedMovieIds.has(movie.id));
        setCurrentMovies(prev => [...prev, ...availableMovies]);
      }
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right', movie: Movie) => {
    // Stop at 20 swipes
    if (swipeCount >= 20) {
      return;
    }

    // Add to swiped movies set
    setSwipedMovieIds(prev => new Set([...prev, movie.id]));

    const preference = direction === 'right' ? 'like' : 'dislike';
    
    // Add preference to local storage
    addPreference({
      movieId: movie.id,
      preference,
      genreIds: movie.genre_ids
    });

    // --- Couple match logic ---
    if (direction === 'right' && coupleId) {
      console.log('Swipe: coupleId', coupleId, 'user', currentRelationship?.user1Id || currentRelationship?.user2Id, 'movie', movie.id);
      // Upsert this user's swipe into couple_swipes
      const upsertResult = await supabase.from('couple_swipes').upsert({
        couple_id: coupleId,
        user_id: currentRelationship?.user1Id || currentRelationship?.user2Id,
        movie_id: movie.id,
        liked: true,
      });
      console.log('Upsert to couple_swipes result:', upsertResult);

      // Check if both users have swiped right on this movie
      const { data: swipes } = await supabase
        .from('couple_swipes')
        .select('user_id')
        .eq('couple_id', coupleId)
        .eq('movie_id', movie.id)
        .eq('liked', true);

      if (swipes && swipes.length === 2) {
        // Both users liked this movie - it's a match!
        console.log('Match found! Both users liked:', movie.title);
        const matchResult = await supabase.from('matched_movies').upsert({
          couple_id: coupleId,
          movie_id: movie.id,
        }, { onConflict: ['couple_id', 'movie_id'] });
        console.log('Matched movie upsert result:', matchResult);
        setMatchedMovie(movie);
        setShowMatch(true);
      }
    }

    // Move to next movie
    setCurrentIndex(prev => prev + 1);
    setSwipeCount(prev => prev + 1);

    // Load more movies if we're running low
    if (currentIndex >= currentMovies.length - 3) {
      loadMoreMovies();
    }
  };

  const resetSwipes = () => {
    setSwipeCount(0);
    setCurrentIndex(0);
    setSwipedMovieIds(new Set());
    refetch();
  };

  const startNewBatch = () => {
    setSwipeCount(0);
    setCurrentIndex(0);
    setSwipedMovieIds(new Set());
    refetch();
  };

  const getCurrentMovie = () => currentMovies[currentIndex];
  const getUpcomingMovies = () => currentMovies.slice(currentIndex + 1, currentIndex + 4);

  const progress = (swipeCount / 20) * 100;
  const likedGenres = getLikedGenres();

  if (error) {
    // Check if it's a missing API key error
    if (error.message?.includes('TMDB API key')) {
      return (
        <div className="min-h-screen bg-deep-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-4">Configuration Error</h2>
            <p className="text-gray-400 mb-6">
              The TMDB API key is missing. Please add VITE_TMDB_API_KEY to your environment variables.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-300 mb-2">Add this to your .env file:</p>
              <code className="text-xs text-green-400">VITE_TMDB_API_KEY=your_api_key_here</code>
            </div>
          </div>
        </div>
      );
    }
    return <ApiError error={error} onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix mx-auto mb-4"></div>
          <p className="text-white">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (!getCurrentMovie()) {
    // Check if it's because no movies were loaded (likely due to missing API key)
    if (!moviesData || moviesData.length === 0) {
      return (
        <div className="min-h-screen bg-deep-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-4">No Movies Available</h2>
            <p className="text-gray-400 mb-6">
              {!import.meta.env.VITE_TMDB_API_KEY 
                ? "TMDB API key is missing. Please add VITE_TMDB_API_KEY to your environment variables."
                : "Unable to load movies. Please check your internet connection and try again."
              }
            </p>
            {!import.meta.env.VITE_TMDB_API_KEY && (
              <div className="bg-gray-800 p-4 rounded-lg text-left mb-6">
                <p className="text-sm text-gray-300 mb-2">To fix this, add to your .env file:</p>
                <code className="text-xs text-green-400">VITE_TMDB_API_KEY=your_api_key_here</code>
                <p className="text-xs text-gray-400 mt-2">
                  Get a free API key from: <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">TMDB API</a>
                </p>
              </div>
            )}
            <Button onClick={refetch} className="bg-netflix text-white">
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No more movies!</h2>
          <p className="text-gray-400 mb-6">You've swiped through all available movies.</p>
          <Button onClick={startNewBatch} className="bg-netflix text-white">
            Start New Batch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Filters - Simplified */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="text-gray-300 text-sm">
            Filters coming soon...
          </div>
        </div>
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <motion.h1
            className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Discover Your <span className="text-netflix">Next Favorite</span>
          </motion.h1>
          <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6">
            Swipe right to like, left to pass. We'll learn your preferences!
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-400">Progress</span>
              <span className="text-xs sm:text-sm text-accent-gold">{swipeCount}/20 movies</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-4 sm:space-x-6 mb-4 sm:mb-8">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-accent-gold">{swipeCount}</div>
              <div className="text-xs sm:text-sm text-gray-400">Movies Swiped</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-500">{likedGenres.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Liked Genres</div>
            </div>
          </div>
        </div>

        {/* Main Swipe Area */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Current Movie */}
            <SwipeCard
              movie={getCurrentMovie()}
              onSwipe={handleSwipe}
              isActive={true}
            />
            
            {/* Upcoming Movies (Background) */}
            <div className="absolute inset-0 -z-10">
              {getUpcomingMovies().map((movie, index) => (
                <div
                  key={movie.id}
                  className="absolute inset-0"
                  style={{
                    transform: `scale(${0.9 - index * 0.05}) translateY(${index * 10}px)`,
                    zIndex: -index - 1,
                  }}
                >
                  <SwipeCard
                    movie={movie}
                    onSwipe={() => {}}
                    isActive={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            onClick={() => handleSwipe('left', getCurrentMovie())}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
            disabled={swipeCount >= 20}
          >
            ✕
          </Button>
          <Button
            onClick={() => handleSwipe('right', getCurrentMovie())}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full"
            disabled={swipeCount >= 20}
          >
            ♥
          </Button>
        </div>

        {/* Reset Button */}
        <div className="text-center mt-6">
          <Button
            onClick={resetSwipes}
            variant="outline"
            className="text-gray-400 border-gray-600 hover:bg-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Progress
          </Button>
        </div>

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="text-center mt-4">
            <div className="w-6 h-6 border-2 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading more movies...</p>
          </div>
        )}
      </div>

      {/* Match Popup */}
      <MatchPopup
        show={showMatch}
        movie={matchedMovie}
        onClose={() => {
          setShowMatch(false);
          setMatchedMovie(null);
        }}
      />
    </div>
  );
}
