import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ArrowLeft, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';
import { useWatchlist } from '@/hooks/use-watchlist';
import { Link } from 'wouter';

export default function Watchlist() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const { watchlist, clearWatchlist } = useWatchlist();

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      clearWatchlist();
    }
  };

  const averageRating = watchlist.length > 0 
    ? (watchlist.reduce((sum, movie) => sum + movie.vote_average, 0) / watchlist.length).toFixed(1)
    : '0';

  if (watchlist.length === 0) {
    return (
      <div className="min-h-screen bg-deep-black pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            {/* Header */}
            <div className="flex items-center justify-center mb-8">
              <Link href="/recommendations">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold">
                My <span className="text-netflix">Watchlist</span>
              </h1>
            </div>

            {/* Empty State */}
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold mb-4">Your watchlist is empty</h2>
            <p className="text-gray-300 text-lg mb-8">
              Start adding movies you want to watch later. Discover great films through swiping 
              or browse our recommendations!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/swipe">
                <Button className="bg-netflix hover:bg-red-700 px-8 py-3">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Swiping
                </Button>
              </Link>
              
              <Link href="/recommendations">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3">
                  <Star className="w-5 h-5 mr-2" />
                  Browse Recommendations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/recommendations">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <motion.h1
                className="text-3xl md:text-4xl font-bold mb-2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                My <span className="text-netflix">Watchlist</span>
              </motion.h1>
              <p className="text-gray-300">
                {watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} to watch
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleClearWatchlist}
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-netflix">{watchlist.length}</div>
            <div className="text-sm text-gray-400">Movies</div>
          </div>
          
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent-gold">{averageRating}</div>
            <div className="text-sm text-gray-400">Avg Rating</div>
          </div>
          
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(watchlist.reduce((sum, movie) => {
                return sum + 120; // Assume 120 min average runtime
              }, 0) / 60)}h
            </div>
            <div className="text-sm text-gray-400">Total Time</div>
          </div>
          
          <div className="glass-effect rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(watchlist.flatMap(movie => movie.genre_ids)).size}
            </div>
            <div className="text-sm text-gray-400">Genres</div>
          </div>
        </motion.div>

        {/* Watchlist Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AnimatePresence>
            {watchlist.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MovieCard
                  movie={movie}
                  onCardClick={() => setSelectedMovieId(movie.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pro Tip */}
        <motion.div
          className="mt-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Alert className="bg-netflix/10 border-netflix/30">
            <Heart className="h-4 w-4 text-netflix" />
            <AlertDescription className="text-gray-300">
              <strong className="text-netflix">Pro Tip:</strong> Keep discovering movies by swiping to get even better 
              recommendations based on your taste preferences!
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link href="/swipe">
            <Button className="bg-netflix hover:bg-red-700">
              <Heart className="w-4 h-4 mr-2" />
              Discover More Movies
            </Button>
          </Link>
          
          <Link href="/recommendations">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Star className="w-4 h-4 mr-2" />
              View Recommendations
            </Button>
          </Link>
        </div>
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
