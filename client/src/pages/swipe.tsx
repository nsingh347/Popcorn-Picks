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
  const { currentRelationship, couplePreferences, addMatchedMovie } = useCouples();
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
    if (direction === 'right' && currentRelationship && couplePreferences) {
      // For demo: assume partner's liked movies are in localStorage as 'partner_preferences'
      const partnerPrefs = JSON.parse(localStorage.getItem('partner_preferences') || '[]');
      const partnerLiked = partnerPrefs.filter((p: any) => p.preference === 'like').map((p: any) => p.movieId);
      if (partnerLiked.includes(movie.id) && !couplePreferences.sharedMovies.includes(movie.id)) {
        await addMatchedMovie(movie.id);
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
      <div className="container mx-auto px-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-8 justify-center mb-8">
          {/* Genre Filter */}
          <div className="flex flex-col items-start min-w-[200px]">
            <label className="text-gray-300 mb-1 font-medium">Genre</label>
            <Select
              options={[{ value: '', label: 'All Genres' }, ...genreOptions]}
              value={genreOptions.find(o => o.value === genreId) || { value: '', label: 'All Genres' }}
              onChange={opt => setGenreId(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Genres"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white' }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: 'white' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#333' : '#23272a', color: 'white' }),
              }}
            />
          </div>
          {/* Year Filter */}
          <div className="flex flex-col items-start min-w-[140px]">
            <label className="text-gray-300 mb-1 font-medium">Release Year</label>
            <Select
              options={[{ value: '', label: 'All Years' }, ...yearOptions]}
              value={yearOptions.find(o => o.value === year) || { value: '', label: 'All Years' }}
              onChange={opt => setYear(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Years"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white' }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: 'white' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#333' : '#23272a', color: 'white' }),
              }}
            />
          </div>
          {/* Provider Filter */}
          <div className="flex flex-col items-start min-w-[220px]">
            <label className="text-gray-300 mb-1 font-medium">Platform</label>
            <Select
              options={[{ value: '', label: 'All Platforms' }, ...providerOptions]}
              value={providerOptions.find(o => o.value === providerId) || { value: '', label: 'All Platforms' }}
              onChange={opt => setProviderId(opt?.value ? Number(opt.value) : undefined)}
              isClearable
              placeholder="All Platforms"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white' }),
                menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                singleValue: (base) => ({ ...base, color: 'white' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#333' : '#23272a', color: 'white' }),
              }}
            />
          </div>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Discover Your <span className="text-netflix">Next Favorite</span>
          </motion.h1>
          <p className="text-gray-300 text-lg mb-6">
            Swipe right to like, left to pass. We'll learn your preferences!
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-accent-gold">{swipeCount}/20 movies</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-gold">{swipeCount}</div>
              <div className="text-sm text-gray-400">Movies Swiped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{getLikedGenres().length}</div>
              <div className="text-sm text-gray-400">Liked Genres</div>
            </div>
          </div>
        </div>

        {/* Swipe Area */}
        <div className="max-w-md mx-auto relative">
          <div className="relative h-96 mb-20">
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
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-2">Swipe or use buttons below</p>
            <div className="flex justify-center space-x-2">
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
        <div className="flex justify-center space-x-6 mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={resetSwipes}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
          
          {hasPreferences && (
            <Link href="/recommendations">
              <Button
                size="lg"
                className="bg-accent-gold hover:bg-yellow-500 text-black font-semibold"
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
            <h3 className="text-xl font-semibold mb-4 flex items-center justify-center">
              <Star className="w-5 h-5 mr-2 text-accent-gold" />
              Your Preferences
            </h3>
            <p className="text-gray-400 mb-4">
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
            <h3 className="text-2xl font-bold mb-4">Great job! You've completed 20 swipes!</h3>
            <p className="text-gray-400 mb-6">
              You've discovered your preferences by swiping through 20 movies.
              {hasPreferences ? ' Your liked movies have been added to recommendations!' : ' Start again to discover more.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={startNewBatch} className="bg-netflix hover:bg-red-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Swipe More
              </Button>
              {hasPreferences && (
                <Link href="/recommendations">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Recommendations
                  </Button>
                </Link>
              )}
              <Button onClick={resetSwipes} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
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
            <h3 className="text-2xl font-bold mb-4">That's all for now!</h3>
            <p className="text-gray-400 mb-6">
              You've swiped through all available movies. 
              {hasPreferences ? ' Check out your personalized recommendations!' : ' Start again to discover more.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={resetSwipes} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              {hasPreferences && (
                <Link href="/recommendations">
                  <Button className="bg-netflix hover:bg-red-700">
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
