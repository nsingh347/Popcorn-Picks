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

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => tmdbService.getGenres(),
  });
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => tmdbService.getWatchProvidersList(),
  });
  const allYears = Array.from({ length: 45 }, (_, i) => 2024 - i);
  const genreOptions = genres?.genres.map((g: any) => ({ value: g.id, label: g.name })) || [];
  const yearOptions = allYears.map(y => ({ value: y, label: y.toString() }));
  const providerOptions = providers?.map((p: any) => ({ value: p.provider_id, label: p.provider_name })) || [];

  // Filtering logic for movies
  const filterMovies = (movies: any[]) => {
    return movies.filter((movie: any) => {
      if (genreId && !(movie.genre_ids || movie.genres?.map((g: any) => g.id)).includes(genreId)) return false;
      if (year && (!movie.release_date || !movie.release_date.startsWith(year.toString()))) return false;
      // No provider filter for now (TMDB API does not provide provider info in movie list)
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8 text-white">
      <div className="container mx-auto px-6">
        <motion.h1 className="text-4xl font-bold mb-8 text-center" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          Discover Movies
        </motion.h1>
        {/* Filters */}
        {!search && (
          <div className="flex flex-nowrap gap-4 sm:gap-8 justify-center mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {/* Genre Filter */}
            <div className="flex flex-col items-start min-w-[140px] sm:min-w-[200px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Genre</label>
              <Select
                options={[{ value: '', label: 'All Genres' }, ...genreOptions]}
                value={genreOptions.find(o => o.value === genreId) || { value: '', label: 'All Genres' }}
                onChange={opt => setGenreId(opt?.value ? Number(opt.value) : undefined)}
                isClearable
                placeholder="All Genres"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                  menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                  singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#FFD700'
                      : state.isFocused
                      ? '#444'
                      : '#23272a',
                    color: state.isSelected ? '#23272a' : '#fff',
                    fontWeight: state.isSelected ? 700 : 500,
                  }),
                }}
              />
            </div>
            {/* Year Filter */}
            <div className="flex flex-col items-start min-w-[100px] sm:min-w-[140px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Release Year</label>
              <Select
                options={[{ value: '', label: 'All Years' }, ...yearOptions]}
                value={yearOptions.find(o => o.value === year) || { value: '', label: 'All Years' }}
                onChange={opt => setYear(opt?.value ? Number(opt.value) : undefined)}
                isClearable
                placeholder="All Years"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                  menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                  singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#FFD700'
                      : state.isFocused
                      ? '#444'
                      : '#23272a',
                    color: state.isSelected ? '#23272a' : '#fff',
                    fontWeight: state.isSelected ? 700 : 500,
                  }),
                }}
              />
            </div>
            {/* Provider Filter (UI only, not functional) */}
            <div className="flex flex-col items-start min-w-[120px] sm:min-w-[220px]">
              <label className="text-gray-300 mb-1 font-medium text-sm sm:text-base">Platform</label>
              <Select
                options={[{ value: '', label: 'All Platforms' }, ...providerOptions]}
                value={providerOptions.find(o => o.value === providerId) || { value: '', label: 'All Platforms' }}
                onChange={opt => setProviderId(opt?.value ? Number(opt.value) : undefined)}
                isClearable
                placeholder="All Platforms"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({ ...base, backgroundColor: '#23272a', borderColor: '#444', color: 'white', minHeight: 36 }),
                  menu: (base) => ({ ...base, backgroundColor: '#23272a', color: 'white' }),
                  singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  input: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
                  placeholder: (base) => ({ ...base, color: '#bbb', fontWeight: 500 }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#FFD700'
                      : state.isFocused
                      ? '#444'
                      : '#23272a',
                    color: state.isSelected ? '#23272a' : '#fff',
                    fontWeight: state.isSelected ? 700 : 500,
                  }),
                }}
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