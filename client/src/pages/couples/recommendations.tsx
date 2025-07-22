import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft, Star, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';
import { useAuth } from '@/contexts/AuthContext';
import { useCouples } from '@/contexts/CouplesContext';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdb';
import type { Movie } from '@/types/movie';

export default function CoupleRecommendations() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const { user } = useAuth();
  const { currentRelationship, partner, couplePreferences } = useCouples();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['couple-recommendations', couplePreferences?.combinedGenres, couplePreferences?.sharedMovies],
    queryFn: () => tmdbService.getRecommendationsBasedOnPreferences(
      couplePreferences?.combinedGenres || [],
      couplePreferences?.sharedMovies || []
    ),
    enabled: !!currentRelationship && !!couplePreferences,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please log in</h2>
          <Link href="/auth/login">
            <Button className="bg-netflix hover:bg-red-700">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentRelationship) {
    return (
      <div className="min-h-screen bg-deep-black pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">💕</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Connect with Your Partner
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              You need to be in a relationship to access couple recommendations.
            </p>
            <Link href="/couples">
              <Button className="bg-pink-500 hover:bg-pink-600 px-8 py-3 text-lg">
                <Heart className="w-5 h-5 mr-2" />
                Go to Couples Corner
              </Button>
            </Link>
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
          <div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-pink-500">Couple</span> Recommendations
            </motion.h1>
            <p className="text-gray-300">
              Personalized recommendations for you and {partner?.displayName}
            </p>
          </div>
          
          <Link href="/couples">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Couples
            </Button>
          </Link>
        </div>

        {/* Couple Info */}
        <motion.div
          className="bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-2xl p-6 mb-8 border border-pink-500/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-netflix rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">
                  {user.displayName?.charAt(0) || 'U'}
                </span>
              </div>
              <p className="text-white font-medium">{user.displayName}</p>
            </div>
            
            <div className="text-pink-500">
              <Heart className="w-8 h-8" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">
                  {partner?.displayName?.charAt(0) || 'P'}
                </span>
              </div>
              <p className="text-white font-medium">{partner?.displayName}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-dark-char rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-2">
              <Star className="w-5 h-5 text-accent-gold mr-2" />
              <h3 className="text-lg font-semibold text-white">Shared Genres</h3>
            </div>
            <div className="text-3xl font-bold text-accent-gold">
              {couplePreferences?.combinedGenres.length || 0}
            </div>
          </div>
          
          <div className="bg-dark-char rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-2">
              <Heart className="w-5 h-5 text-pink-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Liked Together</h3>
            </div>
            <div className="text-3xl font-bold text-pink-500">
              {couplePreferences?.sharedMovies.length || 0}
            </div>
          </div>
          
          <div className="bg-dark-char rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Watchlist</h3>
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {couplePreferences?.jointWatchlist.length || 0}
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading couple recommendations...</p>
            </div>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {recommendations.map((movie, index) => (
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
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
            <p className="text-gray-400 mb-6">
              Start swiping together to build your couple preferences and get personalized recommendations.
            </p>
            <Link href="/swipe">
              <Button className="bg-pink-500 hover:bg-pink-600">
                <Heart className="w-4 h-4 mr-2" />
                Start Swiping Together
              </Button>
            </Link>
          </div>
        )}

        {/* Movie Detail Modal */}
        <MovieDetailModal
          movieId={selectedMovieId}
          isOpen={!!selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      </div>
    </div>
  );
} 