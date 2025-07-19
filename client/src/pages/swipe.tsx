import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SwipeCard } from '@/components/swipe-card';
import { useSwipePreferences } from '@/hooks/use-swipe-preferences';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import type { Movie } from '@/types/movie';
import { Link } from 'wouter';

export default function Swipe() {
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { addPreference, getLikedGenres, hasPreferences } = useSwipePreferences();

  const { data: moviesData, refetch } = useQuery({
    queryKey: ['swipe-movies'],
    queryFn: () => tmdbService.getMoviesForSwipe(),
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

    setSwipeCount(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);

    // Load more movies if we're running low and haven't reached the limit
    if (currentIndex >= currentMovies.length - 3 && swipeCount < 19) {
      setIsLoading(true);
      try {
        const newMovies = await tmdbService.getMoviesForSwipe(Math.floor(Math.random() * 5) + 1);
        setCurrentMovies(prev => [...prev, ...newMovies]);
      } catch (error) {
        console.error('Error loading more movies:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetSwipes = () => {
    setCurrentIndex(0);
    setSwipeCount(0);
    refetch();
  };

  const getCurrentMovie = () => currentMovies[currentIndex];
  const getUpcomingMovies = () => currentMovies.slice(currentIndex + 1, currentIndex + 4);
  const progress = Math.min((swipeCount / 20) * 100, 100);

  if (!moviesData || currentMovies.length === 0) {
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
              {hasPreferences ? ' Now check out your personalized recommendations!' : ' Start again to discover more.'}
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

        {/* No more movies */}
        {currentIndex >= currentMovies.length && !isLoading && swipeCount < 20 && (
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
        {isLoading && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400">Loading more movies...</p>
          </div>
        )}
      </div>
    </div>
  );
}
