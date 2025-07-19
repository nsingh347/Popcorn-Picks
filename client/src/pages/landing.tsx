import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Play, ChevronDown, Heart, Film, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdb';
import { MovieCard } from '@/components/movie-card';
import { useState } from 'react';
import { MovieDetailModal } from '@/components/movie-detail-modal';

export default function Landing() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const { data: popularMovies } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => tmdbService.getPopularMovies(),
  });

  const { data: bollywoodMovies } = useQuery({
    queryKey: ['bollywood-movies'],
    queryFn: () => tmdbService.getBollywoodMovies(),
  });

  // Combine movies for background display
  const allMovies = [
    ...(popularMovies?.results.slice(0, 6) || []),
    ...(bollywoodMovies?.results.slice(0, 6) || [])
  ];

  const featuredMovies = [
    ...(popularMovies?.results.slice(0, 3) || []),
    ...(bollywoodMovies?.results.slice(0, 3) || [])
  ];

  return (
    <div className="min-h-screen bg-deep-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Movie Posters with Parallax Effect */}
        <div className="absolute inset-0 grid grid-cols-6 gap-2 opacity-20">
          {allMovies.map((movie, index) => (
            <motion.img
              key={movie.id}
              src={tmdbService.getImageUrl(movie.poster_path, 'w500')}
              alt={movie.title}
              className="poster-aspect object-cover animate-float"
              style={{ animationDelay: `${index}s` }}
              initial={{ y: 0 }}
              animate={{ y: [-20, 20, -20] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: index * 0.5,
              }}
            />
          ))}
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-transparent to-deep-black"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-transparent to-transparent"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.h1
            className="font-bold text-6xl md:text-8xl mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-white via-accent-gold to-netflix bg-clip-text text-transparent">
              Popcorn Picks
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl mb-8 text-gray-300"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Find your next favorite movie — one swipe at a time
          </motion.p>
          
          <motion.p
            className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Discover Hollywood and Bollywood blockbusters through our AI-powered recommendation engine. 
            Swipe through movie posters and let us curate your perfect watchlist.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Link href="/swipe">
              <Button className="bg-netflix hover:bg-red-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <Play className="w-5 h-5 mr-2" />
                Start Swiping
              </Button>
            </Link>
            
            <Button 
              variant="outline"
              className="glass-effect hover:bg-white/20 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 border-white/20 text-white"
            >
              <Film className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-accent-gold" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-deep-black to-dark-char">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-netflix">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Swipe through curated movie selections and build your taste profile. 
              Our AI learns your preferences to recommend perfect matches.
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="glass-effect rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-netflix/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-netflix" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Preferences</h3>
              <p className="text-gray-300">
                AI learns from your swipes to understand your taste in movies across genres and languages.
              </p>
            </motion.div>
            
            <motion.div
              className="glass-effect rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Film className="w-8 h-8 text-accent-gold" />
              </div>
              <h3 className="text-xl font-bold mb-4">Dual Cinema</h3>
              <p className="text-gray-300">
                Discover the best of both Hollywood and Bollywood with curated recommendations.
              </p>
            </motion.div>
            
            <motion.div
              className="glass-effect rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <List className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Personal Watchlist</h3>
              <p className="text-gray-300">
                Build and manage your personalized watchlist with movies you love.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section className="py-20 bg-dark-char">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Featured <span className="text-accent-gold">Movies</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get a taste of what's trending across Hollywood and Bollywood
            </p>
          </motion.div>
          
          {/* Movies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {featuredMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <MovieCard
                  movie={movie}
                  onCardClick={() => setSelectedMovieId(movie.id)}
                  showWatchlistButton={false}
                />
              </motion.div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="text-center">
            <Link href="/swipe">
              <Button className="bg-gradient-to-r from-netflix to-red-700 hover:from-red-700 hover:to-netflix px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                Discover Your Movies
                <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-b from-dark-char to-deep-black">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mb-12">
              {/* Animated Avatar */}
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-netflix to-accent-gold p-1">
                <div className="w-full h-full rounded-full bg-deep-black flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">NS</span>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Meet the <span className="text-netflix">Creator</span>
              </h2>
              
              <div className="glass-effect rounded-2xl p-8 text-left max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4 text-center">Nishant Singh</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  "As a movie enthusiast and tech developer, I was frustrated with the overwhelming choice 
                  paralysis on streaming platforms. Popcorn Picks was born from the idea that movie discovery 
                  should be as fun as watching the movies themselves."
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  "By combining the addictive swipe mechanism with AI-powered recommendations, we're making 
                  it easier than ever to find your next favorite film, whether it's a Hollywood blockbuster 
                  or a Bollywood gem."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-netflix via-red-700 to-netflix">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Find Your Next <br/>
              <span className="text-accent-gold">Favorite Movie?</span>
            </h2>
            <p className="text-xl mb-12 text-red-100 max-w-2xl mx-auto">
              Join thousands of movie lovers who have already discovered their perfect matches. 
              Start swiping and building your personalized watchlist today.
            </p>
            
            <Link href="/swipe">
              <Button className="bg-white text-netflix hover:bg-gray-100 px-12 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <Play className="w-5 h-5 mr-2" />
                Start Discovering Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Movie Detail Modal */}
      <MovieDetailModal
        movieId={selectedMovieId}
        isOpen={!!selectedMovieId}
        onClose={() => setSelectedMovieId(null)}
      />
    </div>
  );
}
