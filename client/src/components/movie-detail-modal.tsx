import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, Clock, Heart, Plus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbService } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/use-watchlist';
import type { MovieDetails } from '@/types/movie';
import { useQuery } from '@tanstack/react-query';

interface MovieDetailModalProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MovieDetailModal({ movieId, isOpen, onClose }: MovieDetailModalProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie-details', movieId],
    queryFn: () => movieId ? tmdbService.getMovieDetails(movieId) : null,
    enabled: !!movieId && isOpen,
  });

  const isMovieInWatchlist = movie ? isInWatchlist(movie.id) : false;
  
  const handleWatchlistToggle = () => {
    if (!movie) return;
    
    if (isMovieInWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTrailerUrl = () => {
    if (!movie?.videos?.results) return null;
    const trailer = movie.videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [movieId]);

  if (!isOpen || !movieId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-deep-black text-white border-gray-800">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-gray-800" />
            <div className="flex space-x-4">
              <Skeleton className="w-48 h-72 bg-gray-800" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-800" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Failed to load movie details</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : movie ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                {movie.title}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Movie Poster */}
              <div className="relative">
                <div className="poster-aspect relative overflow-hidden rounded-xl">
                  <img
                    src={tmdbService.getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-800 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Movie Details */}
              <div className="md:col-span-2 space-y-4">
                {/* Tagline */}
                {movie.tagline && (
                  <p className="text-lg italic text-accent-gold">"{movie.tagline}"</p>
                )}

                {/* Basic Info */}
                <div className="flex flex-wrap items-center gap-4">
                  {movie.vote_average > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-accent-gold fill-current" />
                      <span className="text-accent-gold font-medium">
                        {movie.vote_average.toFixed(1)}
                      </span>
                      <span className="text-gray-400">
                        ({movie.vote_count.toLocaleString()} votes)
                      </span>
                    </div>
                  )}
                  
                  {movie.release_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    </div>
                  )}
                  
                  {movie.runtime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">
                        {formatRuntime(movie.runtime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="secondary"
                        className="bg-netflix/20 text-netflix border-netflix/30"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.overview && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Overview</h3>
                    <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleWatchlistToggle}
                    className={
                      isMovieInWatchlist
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-netflix hover:bg-red-700 text-white"
                    }
                  >
                    {isMovieInWatchlist ? (
                      <>
                        <Heart className="w-4 h-4 mr-2 fill-current" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Watchlist
                      </>
                    )}
                  </Button>

                  {getTrailerUrl() && (
                    <Button
                      variant="outline"
                      className="border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black"
                      onClick={() => window.open(getTrailerUrl()!, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Trailer
                    </Button>
                  )}
                </div>

                {/* Cast */}
                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cast</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {movie.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="flex items-center space-x-2">
                          {actor.profile_path ? (
                            <img
                              src={tmdbService.getImageUrl(actor.profile_path, 'w185')}
                              alt={actor.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-xs text-gray-400">👤</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{actor.name}</p>
                            <p className="text-xs text-gray-400">{actor.character}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Production Companies */}
                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Production</h3>
                    <div className="flex flex-wrap gap-2">
                      {movie.production_companies.slice(0, 3).map((company) => (
                        <span key={company.id} className="text-sm text-gray-400">
                          {company.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
