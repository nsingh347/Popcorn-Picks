import { useState } from 'react';
import { motion } from 'framer-motion';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';

export default function Discover() {
  const [search, setSearch] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-movies', search],
    queryFn: () => search ? tmdbService.searchMovies(search) : Promise.resolve([]),
    enabled: !!search,
  });
  const { data: latest } = useQuery({
    queryKey: ['latest-movies'],
    queryFn: () => tmdbService.getLatestMovies(),
  });
  const { data: trending } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: () => tmdbService.getTrendingMovies(),
  });
  const { data: critics } = useQuery({
    queryKey: ['critics-favorite'],
    queryFn: () => tmdbService.getCriticsFavorite(),
  });

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8 text-white">
      <div className="container mx-auto px-6">
        <motion.h1 className="text-4xl font-bold mb-8 text-center" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          Discover Movies
        </motion.h1>
        <div className="mb-8 max-w-xl mx-auto">
          <Input
            type="text"
            placeholder="Search for any movie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
        {search && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
            {isSearching ? <div>Searching...</div> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {searchResults?.length > 0 ? searchResults.map((movie: any) => (
                  <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
                )) : <div className="text-gray-400 col-span-4">No results found.</div>}
              </div>
            )}
          </div>
        )}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Latest Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {latest?.length > 0 ? latest.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No latest releases found.</div>}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trending?.length > 0 ? trending.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No trending movies found.</div>}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Critics' Favorites</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {critics?.length > 0 ? critics.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No critics' favorites found.</div>}
          </div>
        </div>
      </div>
      <MovieDetailModal movieId={selectedMovieId} isOpen={!!selectedMovieId} onClose={() => setSelectedMovieId(null)} />
    </div>
  );
} 