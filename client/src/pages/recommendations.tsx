import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
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

  // Fetch popular movies
  const { data: popularMovies, isLoading, error } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => tmdbService.getPopularMovies(),
  });

  // Fetch genres for filtering
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });

  const movies = popularMovies?.results || [];

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
          <p className="text-gray-300 text-lg">
            Discover amazing movies tailored for you
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
              transition={{ duration: 0.6, delay: index * 0.1 }}
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
