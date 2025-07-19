import { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, Heart, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tmdbService } from '@/services/tmdb';
import type { Movie } from '@/types/movie';

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right', movie: Movie) => void;
  isActive?: boolean;
  index?: number;
  swipeCount?: number;
}

export function SwipeCard({ movie, onSwipe, isActive = true, index = 0, swipeCount = 0 }: SwipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = tmdbService.getImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isActive || swipeCount >= 20) return;
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      const direction = offset > 0 ? 'right' : 'left';
      onSwipe(direction, movie);
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    if (swipeCount >= 20) return;
    onSwipe(direction, movie);
  };

  if (!isActive) {
    return (
      <motion.div
        className="absolute inset-0 swipe-card bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl shadow-xl"
        style={{ 
          scale: 0.95 - (index * 0.05),
          translateY: -(index * 4),
          zIndex: 10 - index
        }}
        initial={{ scale: 0.95 - (index * 0.05), translateY: -(index * 4) }}
        animate={{ scale: 0.95 - (index * 0.05), translateY: -(index * 4) }}
      >
        <div className="poster-aspect relative overflow-hidden rounded-2xl">
          {!imageError && posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-60' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center text-gray-400 opacity-60">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 swipe-card bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
      style={{ zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, rotate: 0 }}
      animate={{ 
        x: 0, 
        rotate: 0,
        opacity: 1
      }}
      exit={{
        x: 300,
        rotate: 25,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
      <div className="poster-aspect relative overflow-hidden rounded-2xl">
        {!imageError && posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg">No Image Available</p>
            </div>
          </div>
        )}
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && posterUrl && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}

        {/* Movie details overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-2xl">
          <h3 className="font-bold text-2xl mb-2 text-white">{movie.title}</h3>
          
          {movie.overview && (
            <p className="text-sm text-gray-300 mb-3 line-clamp-3">{movie.overview}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {movie.vote_average > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-accent-gold fill-current" />
                  <span className="text-accent-gold font-medium">
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              
              {releaseYear && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-300">{releaseYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vote average badge */}
        {movie.vote_average > 0 && (
          <Badge 
            className="absolute top-4 right-4 bg-black/70 text-accent-gold border-accent-gold"
            variant="outline"
          >
            ★ {movie.vote_average.toFixed(1)}
          </Badge>
        )}
      </div>

      {/* Swipe action buttons */}
      <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-8">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/40 border-red-400 text-red-400 hover:text-red-300"
          onClick={() => handleButtonSwipe('left')}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full bg-green-500/20 hover:bg-green-500/40 border-green-400 text-green-400 hover:text-green-300"
          onClick={() => handleButtonSwipe('right')}
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>
    </motion.div>
  );
}