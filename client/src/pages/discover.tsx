import { useState } from 'react';
import { motion } from 'framer-motion';
import { tmdbService } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';
import Select from 'react-select';

export default function Discover() {
  const [search, setSearch] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [genreId, setGenreId] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [providerId, setProviderId] = useState<number | undefined>();

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-movies', search],
    queryFn: async () => {
      if (!search) return [];
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        console.error('TMDB API key is missing!');
        return [];
      }
      const response = await tmdbService.searchMovies(search);
      return response.results || [];
    },
    enabled: !!search,
  });
  
  const { data: latest } = useQuery({
    queryKey: ['latest-movies'],
    queryFn: async () => {
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        console.error('TMDB API key is missing!');
        return [];
      }
      const response = await tmdbService.getLatestMovies();
      return response.results || [];
    },
  });
  
  const { data: trending } = useQuery({
    queryKey: ['trending-movies'],
    queryFn: async () => {
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        console.error('TMDB API key is missing!');
        return [];
      }
      const response = await tmdbService.getTrendingMovies();
      return response.results || [];
    },
  });
  
  const { data: critics } = useQuery({
    queryKey: ['critics-favorite'],
    queryFn: async () => {
      if (!import.meta.env.VITE_TMDB_API_KEY) {
        console.error('TMDB API key is missing!');
        return [];
      }
      const response = await tmdbService.getCriticsFavorite();
      return response.results || [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => tmdbService.getWatchProvidersList(),
  });
  
  const allYears = Array.from({ length: 45 }, (_, i) => 2024 - i);
  const genreOptions = genres?.genres?.map((g: any) => ({ value: g.id, label: g.name })) || [];
  const yearOptions = allYears.map(y => ({ value: y, label: y.toString() }));
  const providerOptions = providers?.map((p: any) => ({ value: p.provider_id, label: p.provider_name })) || [];

  // Debug logging
  console.log('Discover page data:', {
    genres: genres?.genres?.length,
    providers: providers?.length,
    genreOptions: genreOptions.length,
    yearOptions: yearOptions.length,
    providerOptions: providerOptions.length
  });

  // Filtering logic for movies
  const filterMovies = (movies: any[]) => {
    if (!movies) return [];
    return movies.filter((movie: any) => {
      if (genreId && !(movie.genre_ids || movie.genres?.map((g: any) => g.id)).includes(genreId)) return false;
      if (year && (!movie.release_date || !movie.release_date.startsWith(year.toString()))) return false;
      // No provider filter for now (TMDB API does not provide provider info in movie list)
      return true;
    });
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#23272a',
      borderColor: '#444',
      minHeight: '40px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#666'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#23272a',
      border: '1px solid #444',
      zIndex: 9999
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#FFD700' : state.isFocused ? '#444' : '#23272a',
      color: state.isSelected ? '#23272a' : '#fff',
      fontWeight: state.isSelected ? 700 : 500,
      '&:hover': {
        backgroundColor: state.isSelected ? '#FFD700' : '#444'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#fff',
      fontWeight: 600
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#fff',
      fontWeight: 600
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#bbb',
      fontWeight: 500
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: '#444'
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: '#bbb',
      '&:hover': {
        color: '#fff'
      }
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      color: '#bbb',
      '&:hover': {
        color: '#fff'
      }
    })
  };

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8 text-white">
      <div className="container mx-auto px-6">
        <motion.h1 className="text-4xl font-bold mb-8 text-center" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          Discover Movies
        </motion.h1>
        
        {/* API Key Missing Warning */}
        {!import.meta.env.VITE_TMDB_API_KEY && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ TMDB API Key Missing</h3>
            <p className="text-gray-300 mb-3">
              Movies cannot be loaded because the TMDB API key is not configured.
            </p>
            <div className="bg-gray-800 p-3 rounded text-sm">
              <p className="text-gray-300 mb-1">Add this to your .env file:</p>
              <code className="text-green-400">VITE_TMDB_API_KEY=your_api_key_here</code>
              <p className="text-gray-400 mt-2 text-xs">
                Get a free API key from: <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">TMDB API</a>
              </p>
            </div>
          </div>
        )}
        
        {/* Filters */}
        {!search && (
          <div className="flex flex-nowrap gap-4 sm:gap-8 justify-center mb-8 overflow-visible whitespace-nowrap">
            {/* Genre Filter */}
            <div className="flex flex-col items-start min-w-[140px] sm:min-w-[200px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Genre</label>
              <Select
                options={[{ value: '', label: 'All Genres' }, ...genreOptions]}
                value={genreId ? genreOptions.find(o => o.value === genreId) : { value: '', label: 'All Genres' }}
                onChange={(option) => setGenreId(option?.value ? Number(option.value) : undefined)}
                isClearable
                placeholder="All Genres"
                styles={customStyles}
                className="w-full"
                classNamePrefix="react-select"
              />
            </div>
            {/* Year Filter */}
            <div className="flex flex-col items-start min-w-[100px] sm:min-w-[140px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Release Year</label>
              <Select
                options={[{ value: '', label: 'All Years' }, ...yearOptions]}
                value={year ? yearOptions.find(o => o.value === year) : { value: '', label: 'All Years' }}
                onChange={(option) => setYear(option?.value ? Number(option.value) : undefined)}
                isClearable
                placeholder="All Years"
                styles={customStyles}
                className="w-full"
                classNamePrefix="react-select"
              />
            </div>
            {/* Provider Filter (UI only, not functional) */}
            <div className="flex flex-col items-start min-w-[120px] sm:min-w-[220px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Platform</label>
              <Select
                options={[{ value: '', label: 'All Platforms' }, ...providerOptions]}
                value={providerId ? providerOptions.find(o => o.value === providerId) : { value: '', label: 'All Platforms' }}
                onChange={(option) => setProviderId(option?.value ? Number(option.value) : undefined)}
                isClearable
                placeholder="All Platforms"
                styles={customStyles}
                className="w-full"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        )}
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
            {latest?.length > 0 ? filterMovies(latest).map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No latest releases found.</div>}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trending?.length > 0 ? filterMovies(trending).map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No trending movies found.</div>}
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Critics' Favorites</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {critics?.length > 0 ? filterMovies(critics).map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} onCardClick={() => setSelectedMovieId(movie.id)} />
            )) : <div className="text-gray-400 col-span-4">No critics' favorites found.</div>}
          </div>
        </div>
      </div>
      <MovieDetailModal movieId={selectedMovieId} isOpen={!!selectedMovieId} onClose={() => setSelectedMovieId(null)} />
    </div>
  );
} 