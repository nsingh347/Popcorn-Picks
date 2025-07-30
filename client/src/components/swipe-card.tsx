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
  console.log('SwipeCard rendered with movie:', {
    id: movie?.id,
    title: movie?.title,
    poster_path: movie?.poster_path,
    isActive
  });
  
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
    console.log('Button swipe:', direction, movie);
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
      <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 flex space-x-16 justify-center w-full">
        <Button
          size="icon"
          variant="outline"
          className="w-20 h-20 rounded-full bg-red-600/90 hover:bg-red-700 border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl transition-all duration-200"
          style={{ boxShadow: '0 4px 24px 0 rgba(255,0,0,0.25)' }}
          onClick={() => handleButtonSwipe('left')}
        >
          <X className="w-10 h-10" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="w-20 h-20 rounded-full bg-green-600/90 hover:bg-green-700 border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl transition-all duration-200"
          style={{ boxShadow: '0 4px 24px 0 rgba(0,255,0,0.25)' }}
          onClick={() => handleButtonSwipe('right')}
        >
          <Heart className="w-10 h-10" />
        </Button>
      </div>
    </motion.div>
  );
}