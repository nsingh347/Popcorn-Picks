import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Filter, RefreshCw, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';
import { useSwipePreferences } from '@/hooks/use-swipe-preferences';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import type { Movie, Genre } from '@/types/movie';
import { Link } from 'wouter';

export default function Recommendations() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const { getLikedGenres, hasPreferences } = useSwipePreferences();

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['recommendations', getLikedGenres()],
    queryFn: () => tmdbService.getRecommendationsBasedOnPreferences(getLikedGenres()),
    enabled: hasPreferences,
  });

  const { data: popularMovies } = useQuery({
    queryKey: ['popular-fallback'],
    queryFn: () => tmdbService.getPopularMovies(),
    enabled: !hasPreferences,
  });

  const movies = hasPreferences ? recommendations : popularMovies?.results;
  const likedGenres = getLikedGenres();

  const getGenreName = (genreId: number): string => {
    return genres?.genres.find(g => g.id === genreId)?.name || `Genre ${genreId}`;
  };

  const filteredAndSortedMovies = movies ? movies.filter(movie => {
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
  }) : [];

  if (!hasPreferences) {
    return (
      <div className="min-h-screen bg-deep-black pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">🎬</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              No Preferences Yet
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Start swiping on movies to get personalized recommendations based on your taste!
            </p>
            <div className="space-y-4">
              <Link href="/swipe">
                <Button className="bg-netflix hover:bg-red-700 px-8 py-3 text-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Start Swiping
                </Button>
              </Link>
              <div className="text-center">
                <p className="text-gray-400 mb-6">Or browse popular movies while you're here:</p>
                {popularMovies && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {popularMovies.results.slice(0, 12).map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <MovieCard
                          movie={movie}
                          onCardClick={() => setSelectedMovieId(movie.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <MovieDetailModal
          movieId={selectedMovieId}
          isOpen={!!selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-netflix">Personalized</span> Recommendations
            </motion.h1>
            <p className="text-gray-300">
              Based on your swiping preferences across {likedGenres.length} genres
            </p>
          </div>
          
          <Link href="/swipe">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Swiping
            </Button>
          </Link>
        </div>

        {/* Liked Genres */}
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-accent-gold" />
            Your Favorite Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {likedGenres.slice(0, 8).map(genreId => (
              <Badge
                key={genreId}
                variant="secondary"
                className="bg-netflix/20 text-netflix border-netflix/30"
              >
                {getGenreName(genreId)}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Filters and Sort */}
        <motion.div
          className="flex flex-wrap gap-4 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Genres</SelectItem>
                {likedGenres.map(genreId => (
                  <SelectItem key={genreId} value={genreId.toString()}>
                    {getGenreName(genreId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="release_date">Release Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => refetch()}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading recommendations...</p>
            </div>
          </div>
        ) : filteredAndSortedMovies.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {filteredAndSortedMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <MovieCard
                  movie={movie}
                  onCardClick={() => setSelectedMovieId(movie.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">😔</div>
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or continue swiping to improve recommendations.
            </p>
            <Link href="/swipe">
              <Button className="bg-netflix hover:bg-red-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                Continue Swiping
              </Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        {filteredAndSortedMovies.length > 0 && (
          <div className="text-center mt-12 py-8 border-t border-gray-800">
            <p className="text-gray-400">
              Showing {filteredAndSortedMovies.length} movies based on your preferences
            </p>
          </div>
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
