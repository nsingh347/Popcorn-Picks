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
import Select from 'react-select';
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
  const { addPreference, getLikedGenres, hasPreferences } = useSwipePreferences();
  const { currentRelationship, couplePreferences, addMatchedMovie, coupleId } = useCouples();
  const [showMatch, setShowMatch] = useState(false);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);
  const [genreId, setGenreId] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [providerId, setProviderId] = useState<number | undefined>();
  const [genreSearch, setGenreSearch] = useState('');
  const [yearSearch, setYearSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');

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

  const { data: moviesData, refetch, error, isLoading } = useQuery({
    queryKey: ['swipe-movies', genreId, year, providerId],
    queryFn: () => tmdbService.getMoviesForSwipe(1, { genreId, year, providerId }),
  });

  useEffect(() => {
    if (moviesData) {
      setCurrentMovies(moviesData);
      setCurrentIndex(0);
    }
  }, [moviesData]);

  const handleSwipe = async (direction: 'left' | 'right', movie: Movie) => {
    // Stop at 20 swipes
    if (swipeCount >= 20) {
      return;
    }

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
        user_id: currentRelationship?.user1Id || currentRelationship?.user2Id, // fallback if needed
        movie_id: movie.id,
        liked: true,
      });
      console.log('Upsert to couple_swipes result:', upsertResult);
      // Check if both users have swiped right on this movie
      const { data: swipes, error: swipesError } = await supabase
        .from('couple_swipes')
        .select('user_id')
        .eq('couple_id', coupleId)
        .eq('movie_id', movie.id)
        .eq('liked', true);
      console.log('Swipes for this movie:', swipes, 'Error:', swipesError);
      if (swipes && swipes.length === 2) {
        // Upsert into matched_movies with conflict target
        const upsertMatch = await supabase.from('matched_movies').upsert({
          couple_id: coupleId,
          movie_id: movie.id,
        }, { onConflict: ['couple_id', 'movie_id'] });
        console.log('Upsert to matched_movies result:', upsertMatch);
        console.log('MATCH DETECTED for movie', movie.id);
        setMatchedMovie(movie);
        setShowMatch(true);
      }
    }

    setSwipeCount(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);

    // Load more movies if we're running low and haven't reached the limit
    if (currentIndex >= currentMovies.length - 3 && swipeCount < 19) {
      setIsLoadingMore(true);
      try {
        const newMovies = await tmdbService.getMoviesForSwipe(Math.floor(Math.random() * 5) + 1);
        setCurrentMovies(prev => [...prev, ...newMovies]);
      } catch (error) {
        console.error('Error loading more movies:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const resetSwipes = () => {
    setCurrentIndex(0);
    setSwipeCount(0);
    refetch();
  };

  const startNewBatch = () => {
    setCurrentIndex(0);
    setSwipeCount(0);
    // Fetch fresh movies for the new batch
    refetch();
  };

  const getCurrentMovie = () => currentMovies[currentIndex];
  const getUpcomingMovies = () => currentMovies.slice(currentIndex + 1, currentIndex + 4);
  const progress = Math.min((swipeCount / 20) * 100, 100);

  // Show error if API fails
  if (error) {
    return (
      <ApiError 
        message="Unable to load movies. Please check your API configuration."
        onRetry={() => refetch()}
      />
    );
  }

  // Show loading state
  if (isLoading || !moviesData || currentMovies.length === 0) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading movies...</p>
        </div>
      </div>
    );
  }

  const currentMovie = getCurrentMovie();
  const upcomingMovies = getUpcomingMovies();

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-2 sm:px-6">
        {/* Filters */}
        <div className="flex flex-nowrap gap-4 sm:gap-8 justify-center mb-4 sm:mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {/* Genre Filter */}
          <div className="flex flex-col items-start min-w-[140px] sm:min-w-[200px]">
            <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Genre</label>
            <Select
              options={[{ value: '', label: 'All Genres' }, ...genreOptions]}
              value={genreOptions.find(o => o.value === genreId) || { value: '', label: 'All Genres' }}
              onChange={opt => setGenreId(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Genres"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#FFD700'
                    : state.isFocused
                    ? '#444'
                    : '#23272a',
                  color: state.isSelected ? '#23272a' : '#fff',
                  fontWeight: state.isSelected ? 700 : 500,
                }),
              }}
            />
          </div>
          {/* Year Filter */}
          <div className="flex flex-col items-start min-w-[100px] sm:min-w-[140px]">
            <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Release Year</label>
            <Select
              options={[{ value: '', label: 'All Years' }, ...yearOptions]}
              value={yearOptions.find(o => o.value === year) || { value: '', label: 'All Years' }}
              onChange={opt => setYear(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Years"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#FFD700'
                    : state.isFocused
                    ? '#444'
                    : '#23272a',
                  color: state.isSelected ? '#23272a' : '#fff',
                  fontWeight: state.isSelected ? 700 : 500,
                }),
              }}
            />
          </div>
          {/* Provider Filter */}
          <div className="flex flex-col items-start min-w-[120px] sm:min-w-[220px]">
            <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Platform</label>
            <Select
              options={[{ value: '', label: 'All Platforms' }, ...providerOptions]}
              value={providerOptions.find(o => o.value === providerId) || { value: '', label: 'All Platforms' }}
              onChange={opt => setProviderId(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Platforms"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#FFD700'
                    : state.isFocused
                    ? '#444'
                    : '#23272a',
                  color: state.isSelected ? '#23272a' : '#fff',
                  fontWeight: state.isSelected ? 700 : 500,
                }),
              }}
            />
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
              <div className="text-lg sm:text-2xl font-bold text-green-400">{getLikedGenres().length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Liked Genres</div>
            </div>
          </div>
        </div>

        {/* Swipe Area */}
        <div className="max-w-md mx-auto relative">
          <div className="relative h-80 sm:h-96 mb-12 sm:mb-20">
            <AnimatePresence>
              {/* Current Movie Card */}
              {currentMovie && swipeCount < 20 && (
                <SwipeCard
                  key={currentMovie.id}
                  movie={currentMovie}
                  onSwipe={handleSwipe}
                  isActive={true}
                  swipeCount={swipeCount}
                />
              )}
              
              {/* Upcoming Cards */}
              {swipeCount < 20 && upcomingMovies.map((movie, index) => (
                <SwipeCard
                  key={movie.id}
                  movie={movie}
                  onSwipe={handleSwipe}
                  isActive={false}
                  index={index + 1}
                  swipeCount={swipeCount}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Instructions */}
          <div className="text-center mb-4 sm:mb-8">
            <p className="text-gray-400 mb-2 text-sm sm:text-base">Swipe or use buttons below</p>
            <div className="flex justify-center space-x-1 sm:space-x-2">
              {Array.from({ length: Math.min(currentMovies.length - currentIndex, 3) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === 0 ? 'bg-netflix' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-6 space-y-2 sm:space-y-0 mb-6 sm:mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={resetSwipes}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
          
          {hasPreferences && (
            <Link href="/recommendations" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-accent-gold hover:bg-yellow-500 text-black font-semibold w-full sm:w-auto"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Get Recommendations
              </Button>
            </Link>
          )}
        </div>

        {/* Liked Genres */}
        {getLikedGenres().length > 0 && (
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 flex items-center justify-center">
              <Star className="w-4 h-4 mr-2 text-accent-gold" />
              Your Preferences
            </h3>
            <p className="text-gray-400 mb-2 sm:mb-4 text-sm sm:text-base">
              Based on your swipes, you seem to enjoy these genres:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {getLikedGenres().slice(0, 5).map(genreId => (
                <Badge
                  key={genreId}
                  variant="secondary"
                  className="bg-netflix/20 text-netflix border-netflix/30"
                >
                  Genre {genreId}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed 20 swipes */}
        {swipeCount >= 20 && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Great job! You've completed 20 swipes!</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              You've discovered your preferences by swiping through 20 movies.
              {hasPreferences ? ' Your liked movies have been added to recommendations!' : ' Start again to discover more.'}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4">
              <Button onClick={startNewBatch} className="bg-netflix hover:bg-red-700 text-white w-full sm:w-auto">
                <Play className="w-4 h-4 mr-2" />
                Swipe More
              </Button>
              {hasPreferences && (
                <Link href="/recommendations" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Recommendations
                  </Button>
                </Link>
              )}
              <Button onClick={resetSwipes} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        )}

        {/* No more movies */}
        {currentIndex >= currentMovies.length && !isLoadingMore && swipeCount < 20 && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">That's all for now!</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              You've swiped through all available movies. 
              {hasPreferences ? ' Check out your personalized recommendations!' : ' Start again to discover more.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <Button onClick={resetSwipes} variant="outline" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              {hasPreferences && (
                <Link href="/recommendations" className="w-full sm:w-auto">
                  <Button className="bg-netflix hover:bg-red-700 w-full sm:w-auto">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Recommendations
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400">Loading more movies...</p>
          </div>
        )}

        <MatchPopup show={showMatch} movie={matchedMovie} onClose={() => setShowMatch(false)} />
      </div>
    </div>
  );
}
