import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tmdbService } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/use-watchlist';
import type { Movie } from '@/types/movie';

interface MovieCardProps {
  movie: Movie;
  onCardClick?: () => void;
  showWatchlistButton?: boolean;
}

export function MovieCard({ movie, onCardClick, showWatchlistButton = true }: MovieCardProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isMovieInWatchlist = isInWatchlist(movie.id);
  const posterUrl = tmdbService.getImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMovieInWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      onClick={onCardClick}
    >
      <div className="relative overflow-hidden rounded-xl shadow-lg bg-gray-900">
        {/* Movie Poster */}
        <div className="poster-aspect relative">
          {!imageError && posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
          
          {/* Loading skeleton */}
          {!imageLoaded && !imageError && posterUrl && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}
        </div>

        {/* Overlay with movie details */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <h4 className="font-bold text-sm mb-2 line-clamp-2">{movie.title}</h4>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-accent-gold fill-current" />
                <span className="text-xs text-accent-gold font-medium">
                  {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                </span>
              </div>
              {releaseYear && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gray-300" />
                  <span className="text-xs text-gray-300">{releaseYear}</span>
                </div>
              )}
            </div>

            {showWatchlistButton && (
              <Button
                size="sm"
                variant={isMovieInWatchlist ? "secondary" : "default"}
                className={`w-full text-xs ${
                  isMovieInWatchlist
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-netflix hover:bg-red-700 text-white"
                }`}
                onClick={handleWatchlistToggle}
              >
                {isMovieInWatchlist ? (
                  <>
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Watchlist
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Vote average badge */}
        {movie.vote_average > 0 && (
          <Badge 
            className="absolute top-2 right-2 bg-black/70 text-accent-gold border-accent-gold"
            variant="outline"
          >
            ★ {movie.vote_average.toFixed(1)}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
