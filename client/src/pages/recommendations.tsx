import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, RefreshCw, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import type { Movie } from '@/types/movie';

export default function Recommendations() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);

  // Fetch popular movies for recommendations
  const { data: popularMovies, isLoading, error, refetch } = useQuery({
    queryKey: ['popular-movies', refreshKey],
    queryFn: () => tmdbService.getPopularMovies(Math.floor(Math.random() * 500) + 1), // Random page for fresh recommendations
  });

  // Fetch genres for filtering
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });

  // Load liked movies from session storage and listen for changes
  useEffect(() => {
    const loadLikedMovies = () => {
      const storedLikes = sessionStorage.getItem('likedMovies');
      if (storedLikes) {
        try {
          setLikedMovies(JSON.parse(storedLikes));
        } catch (error) {
          console.error('Error parsing liked movies:', error);
          setLikedMovies([]);
        }
      }
    };

    // Load initially
    loadLikedMovies();

    // Listen for storage changes (when user swipes on other pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'likedMovies') {
        loadLikedMovies();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-page updates)
    const handleCustomStorageChange = () => {
      loadLikedMovies();
    };

    window.addEventListener('likedMoviesUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('likedMoviesUpdated', handleCustomStorageChange);
    };
  }, []);

  const movies = popularMovies?.results || [];

  const handleClearRecommendations = () => {
    setRefreshKey(prev => prev + 1);
    setSortBy('popularity');
    setFilterGenre('all');
  };

  const handleClearLikes = () => {
    setLikedMovies([]);
    sessionStorage.removeItem('likedMovies');
  };

  const filteredAndSortedMovies = movies.filter(movie => {
    if (filterGenre === 'all') return true;
    return movie.genre_ids.includes(parseInt(filterGenre));
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.vote_average - a.vote_average;
      case 'release_date':
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      case 'popularity':
      default:
        return b.popularity - a.popularity;
    }
  });

  if (error) {
    return (
      <div className="min-h-screen bg-deep-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Movies</h2>
          <p className="text-gray-400 mb-6">Unable to load movie recommendations.</p>
          <Button onClick={() => window.location.reload()} className="bg-netflix text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix mx-auto mb-4"></div>
          <p className="text-white">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Movie <span className="text-netflix">Recommendations</span>
          </motion.h1>
          <p className="text-gray-300 text-lg mb-6">
            Discover amazing movies tailored for you
          </p>
          
          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              onClick={handleClearRecommendations}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Recommendations
            </Button>
            {likedMovies.length > 0 && (
              <Button
                onClick={handleClearLikes}
                variant="outline"
                className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
              >
                <Heart className="w-4 h-4 mr-2" />
                Clear Likes
              </Button>
            )}
          </motion.div>
        </div>

        {/* Your Likes Section */}
        {likedMovies.length > 0 && (
          <motion.section
            className="mb-12"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                <h2 className="text-2xl font-bold text-white">Your Likes</h2>
                <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                  {likedMovies.length}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Movies you've swiped right on
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {likedMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <MovieCard
                    movie={movie}
                    onCardClick={() => setSelectedMovieId(movie.id)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recommendations Section */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-netflix" />
              <h2 className="text-2xl font-bold text-white">Recommendations</h2>
              <span className="bg-netflix text-white px-2 py-1 rounded-full text-sm font-medium">
                {filteredAndSortedMovies.length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Popular movies you might like
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 font-semibold">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="release_date">Release Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-200 font-semibold">Genre:</span>
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres?.genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredAndSortedMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <MovieCard
                  movie={movie}
                  onCardClick={() => setSelectedMovieId(movie.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* No movies message */}
          {filteredAndSortedMovies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-2">No movies found</h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </motion.section>

        {/* Empty State for No Likes */}
        {likedMovies.length === 0 && (
          <motion.div
            className="text-center py-12 mb-12"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-6xl mb-4">💝</div>
            <h3 className="text-xl font-bold text-white mb-2">No Liked Movies Yet</h3>
            <p className="text-gray-400 mb-6">Start swiping to see your likes here!</p>
            <Button className="bg-netflix hover:bg-red-700 text-white">
              <Heart className="w-4 h-4 mr-2" />
              Go to Swipe
            </Button>
          </motion.div>
        )}
      </div>

      {/* Movie Detail Modal */}
      <MovieDetailModal
        movieId={selectedMovieId}
        isOpen={!!selectedMovieId}
        onClose={() => setSelectedMovieId(null)}
      />
    </div>
  );
}
