import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SwipeCard } from '@/components/swipe-card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCouples } from '@/contexts/CouplesContext';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import type { Movie } from '@/types/movie';
import { supabase } from '@/lib/supabaseClient';
import { useQuery as useSupabaseQuery } from '@tanstack/react-query';

function MatchModal({ show, movie, onClose }: { show: boolean; movie: Movie | null; onClose: () => void }) {
  if (!show || !movie) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-auto relative"
      >
        <h2 className="text-4xl font-bold text-pink-500 mb-2 animate-bounce">It's a Match! 💖</h2>
        <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : ''} alt={movie.title} className="mx-auto mb-4 rounded-lg shadow-lg w-40 h-60 object-cover" />
        <p className="text-lg text-gray-700 mb-4">You and your partner both liked <span className="font-bold">{movie.title}</span>!</p>
        <Button onClick={onClose} className="bg-pink-500 text-white px-6 py-2 rounded-full font-semibold">Yay!</Button>
      </motion.div>
    </div>
  );
}

function useMatchedMovies(coupleId: string | undefined) {
  return useSupabaseQuery({
    queryKey: ['matched-movies', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('matched_movies')
        .select('movie_id')
        .eq('couple_id', coupleId);
      if (error) return [];
      const movieIds = data.map((m: any) => m.movie_id);
      // Fetch movie details from TMDB
      return Promise.all(movieIds.map((id: number) => tmdbService.getMovieDetails(id)));
    },
    enabled: !!coupleId,
  });
}

export default function CouplesSwipe() {
  const { user } = useAuth();
  const { currentRelationship, partner } = useCouples();
  const coupleId = currentRelationship?.id;
  const [filters, setFilters] = useState<{ genreId?: number; year?: number; providerId?: number }>({});
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [match, setMatch] = useState<Movie | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState<{ [movieId: number]: 'like' | 'dislike' }>({});
  // Add error state
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => tmdbService.getWatchProvidersList(),
  });
  const allYears = Array.from({ length: 45 }, (_, i) => 2024 - i);
  const genreOptions = genres?.genres.map((g: any) => ({ value: g.id, label: g.name })) || [];
  const yearOptions = allYears.map(y => ({ value: y, label: y.toString() }));
  const providerOptions = providers?.map((p: any) => ({ value: p.provider_id, label: p.provider_name })) || [];

  // Fetch matched movies for the couple (hook moved to top)
  const { data: matchedMovies = [], refetch: refetchMatchedMovies } = useMatchedMovies(coupleId);

  // Debug: log matchedMovies and movies
  console.log('Matched movies:', matchedMovies);
  console.log('All movies:', movies);

  // Remove matched movies from the swipe stack
  const filteredMovies = movies.filter(
    (movie) => {
      const isMatched = matchedMovies.some((m) => {
        const match = m.id === movie.id;
        if (match) console.log('Filtering out matched movie:', movie.id, movie.title);
        return match;
      });
      return !isMatched;
    }
  );
  const currentMovie = filteredMovies[currentIndex];
  const upcomingMovies = filteredMovies.slice(currentIndex + 1, currentIndex + 4);

  // Handle swipe
  const handleSwipe = async (direction: 'left' | 'right', movie: Movie) => {
    if (!user || !coupleId) return;
    setSwiping(true);
    // Store swipe in Supabase couple_swipes table
    await supabase.from('couple_swipes').upsert({
      couple_id: coupleId,
      user_id: user.id,
      movie_id: movie.id,
      liked: direction === 'right',
    });
    setSwipeHistory(prev => ({ ...prev, [movie.id]: direction === 'right' ? 'like' : 'dislike' }));
    // Check for match: did both users in the couple like this movie?
    const { data: swipes, error } = await supabase
      .from('couple_swipes')
      .select('user_id')
      .eq('couple_id', coupleId)
      .eq('movie_id', movie.id)
      .eq('liked', true);
    if (swipes && swipes.length === 2) {
      // Insert into matched_movies table (idempotent)
      const { error: matchError } = await supabase.from('matched_movies').upsert({
        couple_id: coupleId,
        movie_id: movie.id,
      });
      if (matchError) console.error('Matched movie upsert error:', matchError);
      setMatch(movie);
      setShowMatch(true);
      refetchMatchedMovies(); // Ensure matched movies are refreshed
    }
    setCurrentIndex(idx => idx + 1);
    setSwiping(false);
    // Load more movies if running low
    if (currentIndex >= filteredMovies.length - 3) {
      setIsLoadingMore(true);
      const moreMovies = await tmdbService.getMoviesForSwipe(Math.floor(Math.random() * 5) + 1, filters);
      setMovies(prev => [...prev, ...moreMovies]);
      setIsLoadingMore(false);
    }
  };

  // Fetch movies for the couple (shared set)
  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    tmdbService.getMoviesForSwipe(1, filters)
      .then((data: Movie[]) => {
        setMovies(data);
        setCurrentIndex(0);
        setIsLoading(false);
        if (!data.length) setFetchError('No movies found. Please check your filters or try again later.');
      })
      .catch((err) => {
        setIsLoading(false);
        setFetchError('Failed to load movies. Please try again later.');
        console.error('TMDB Swipe Fetch Error:', err);
      });
  }, [filters]);

  // Filter bar
  const FilterBar = (
    <div className="flex flex-wrap gap-6 justify-center mb-8">
      <div className="flex flex-col items-start min-w-[200px]">
        <label className="text-gray-300 mb-1 font-medium">Genre</label>
        <Select
          options={[{ value: '', label: 'All Genres' }, ...genreOptions]}
          value={genreOptions.find(o => o.value === filters.genreId) || { value: '', label: 'All Genres' }}
          onChange={opt => setFilters(f => ({ ...f, genreId: opt?.value ? Number(opt.value) : undefined }))}
          isClearable
          placeholder="All Genres"
          classNamePrefix="react-select"
        />
      </div>
      <div className="flex flex-col items-start min-w-[140px]">
        <label className="text-gray-300 mb-1 font-medium">Release Year</label>
        <Select
          options={[{ value: '', label: 'All Years' }, ...yearOptions]}
          value={yearOptions.find(o => o.value === filters.year) || { value: '', label: 'All Years' }}
          onChange={opt => setFilters(f => ({ ...f, year: opt?.value ? Number(opt.value) : undefined }))}
          isClearable
          placeholder="All Years"
          classNamePrefix="react-select"
        />
      </div>
      <div className="flex flex-col items-start min-w-[220px]">
        <label className="text-gray-300 mb-1 font-medium">Platform</label>
        <Select
          options={[{ value: '', label: 'All Platforms' }, ...providerOptions]}
          value={providerOptions.find(o => o.value === filters.providerId) || { value: '', label: 'All Platforms' }}
          onChange={opt => setFilters(f => ({ ...f, providerId: opt?.value ? Number(opt.value) : undefined }))}
          isClearable
          placeholder="All Platforms"
          classNamePrefix="react-select"
        />
      </div>
    </div>
  );

  // Progress bar
  const progress = Math.round(((currentIndex + 1) / filteredMovies.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500/10 to-indigo-500/10 pt-20 pb-8">
      <div className="container mx-auto px-6">
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-4 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-white">Couple Swipe</span> <span className="text-pink-500">Together</span>
        </motion.h1>
        <p className="text-gray-300 text-lg mb-8 text-center">
          Swipe right if you like a movie, left to pass. When you both like the same movie, it's a match!
        </p>
        {FilterBar}
        <div className="max-w-md mx-auto relative">
          <div className="relative h-96 mb-20">
            {fetchError && !isLoading && (
              <div className="text-center text-red-400 py-8">{fetchError}</div>
            )}
            {!fetchError && (
              <AnimatePresence>
                {currentMovie && (
                  <SwipeCard
                    key={currentMovie.id}
                    movie={currentMovie}
                    onSwipe={handleSwipe}
                    isActive={!swiping}
                  />
                )}
                {upcomingMovies.map((movie, index) => (
                  <SwipeCard
                    key={movie.id}
                    movie={movie}
                    onSwipe={handleSwipe}
                    isActive={false}
                    index={index + 1}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-2">Swipe or use the buttons below</p>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: Math.min(filteredMovies.length - currentIndex, 3) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-pink-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-pink-500">{currentIndex + 1}/{filteredMovies.length} movies</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {isLoading && (
          <div className="text-center text-white py-12">Loading movies...</div>
        )}
        {isLoadingMore && (
          <div className="text-center text-pink-500 py-4">Loading more movies...</div>
        )}
        {currentIndex >= filteredMovies.length && !match && !isLoading && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold mb-4">That's all for now!</h3>
            <p className="text-gray-400 mb-6">
              You've swiped through all available movies. Try changing your filters or come back later!
            </p>
            <Button onClick={() => setCurrentIndex(0)} className="bg-pink-500 hover:bg-pink-600 text-white">
              Start Over
            </Button>
          </div>
        )}
        <MatchModal show={showMatch} movie={match} onClose={() => {
          setShowMatch(false);
          setMatch(null);
          refetchMatchedMovies();
        }} />
      </div>
    </div>
  );
} 