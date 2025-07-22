import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Filter, RefreshCw, Star, ArrowLeft, Heart, Smile, Zap, Users, Film, List, Calendar } from 'lucide-react';
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

const MOODS = [
  { value: 'feel_good', label: 'Feel Good', icon: <Smile className="w-5 h-5 mr-1" /> },
  { value: 'thriller', label: 'Thriller', icon: <Zap className="w-5 h-5 mr-1" /> },
  { value: 'romantic', label: 'Romantic', icon: <Heart className="w-5 h-5 mr-1" /> },
  { value: 'adventure', label: 'Adventure', icon: <Film className="w-5 h-5 mr-1" /> },
  { value: 'family', label: 'Family', icon: <Users className="w-5 h-5 mr-1" /> },
];
const OCCASIONS = [
  { value: 'date_night', label: 'Date Night', icon: <Heart className="w-5 h-5 mr-1" /> },
  { value: 'movie_night', label: 'Movie Night', icon: <Star className="w-5 h-5 mr-1" /> },
  { value: 'weekend', label: 'Weekend', icon: <Calendar className="w-5 h-5 mr-1" /> },
];

export default function Recommendations() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const { getLikedGenres, getLikedMovieIds, getDislikedMovieIds, clearPreferences, hasPreferences } = useSwipePreferences();
  const [mood, setMood] = useState('');
  const [occasion, setOccasion] = useState('');
  const [personalize, setPersonalize] = useState({ genres: [], languages: [] });

  const likedMovieIds = getLikedMovieIds();
  const dislikedMovieIds = getDislikedMovieIds();

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['recommendations-advanced', getLikedGenres(), likedMovieIds, dislikedMovieIds, mood, occasion, personalize.genres, personalize.languages],
    queryFn: () => tmdbService.getRecommendationsAdvanced({
      likedGenres: getLikedGenres(),
      likedMovieIds,
      dislikedMovieIds,
      mood,
      occasion,
      personalizeGenres: personalize.genres,
      personalizeLanguages: personalize.languages,
    }),
    enabled: hasPreferences,
  });

  // Fetch similar movies for liked movies
  const { data: similarMovies, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ['similar-movies', likedMovieIds, dislikedMovieIds],
    queryFn: () => tmdbService.getSimilarMoviesForLiked(likedMovieIds, dislikedMovieIds),
    enabled: likedMovieIds.length > 0,
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

  useEffect(() => {
    const saved = localStorage.getItem('personalize_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPersonalize({ genres: parsed.selectedGenres || [], languages: parsed.selectedLanguages || [] });
    }
  }, []);

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
                <Button className="bg-netflix hover:bg-red-700 px-8 py-3 text-lg text-white">
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
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Mood/Occasion Selector */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-200 font-semibold">Mood:</span>
            {MOODS.map((m) => (
              <Button key={m.value} size="sm" variant={mood === m.value ? 'default' : 'outline'}
                className={
                  mood === m.value
                    ? 'bg-accent-gold text-black border border-accent-gold'
                    : 'bg-white text-black border border-gray-400 hover:bg-accent-gold hover:text-black'
                }
                onClick={() => setMood(mood === m.value ? '' : m.value)}>{m.icon}{m.label}</Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-200 font-semibold">Occasion:</span>
            {OCCASIONS.map((o) => (
              <Button key={o.value} size="sm" variant={occasion === o.value ? 'default' : 'outline'}
                className={
                  occasion === o.value
                    ? 'bg-pink-500 text-white border border-pink-500'
                    : 'bg-white text-black border border-gray-400 hover:bg-pink-500 hover:text-white'
                }
                onClick={() => setOccasion(occasion === o.value ? '' : o.value)}>{o.icon}{o.label}</Button>
            ))}
          </div>
        </div>

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
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearPreferences}
              className="border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Link href="/swipe">
              <Button variant="outline" className="border-gray-600 text-gray-600 bg-white hover:bg-gray-800 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Swiping
              </Button>
            </Link>
          </div>
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

        {/* Liked Movies Count */}
        {likedMovieIds.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Your Liked Movies ({likedMovieIds.length})
            </h3>
            <p className="text-gray-400 mb-4">
              Your liked movies are included at the top of recommendations below.
            </p>
          </motion.div>
        )}

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
              <div key={movie.id} className="relative">
                <MovieCard
                  movie={movie}
                  onCardClick={() => setSelectedMovieId(movie.id)}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-gray-200 mt-2">
                  <span className="font-semibold text-accent-gold">Why this movie?</span> <span>{movie.explanation}</span>
                </div>
              </div>
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
              <Button className="bg-netflix hover:bg-red-700 text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Continue Swiping
              </Button>
            </Link>
          </div>
        )}

        {/* Similar Movies Section */}
        {likedMovieIds.length > 0 && similarMovies && similarMovies.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-center text-accent-gold">Similar Movies</h2>
            {isLoadingSimilar ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-netflix border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {similarMovies.map((movie, index) => (
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
              </div>
            )}
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
