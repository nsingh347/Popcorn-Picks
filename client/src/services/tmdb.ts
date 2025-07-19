const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'your_tmdb_api_key';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

import type { Movie, MovieDetails, TMDBResponse, Genre } from '@/types/movie';

class TMDBService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = TMDB_API_KEY;
  }

  private async fetchFromTMDB(endpoint: string): Promise<any> {
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('TMDB API Error:', error);
      throw error;
    }
  }

  async getPopularMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/popular?page=${page}`);
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/top_rated?page=${page}`);
  }

  async getNowPlayingMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/now_playing?page=${page}`);
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/upcoming?page=${page}`);
  }

  async getMoviesByGenre(genreId: number, page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/discover/movie?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos`);
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
  }

  async getGenres(): Promise<{ genres: Genre[] }> {
    return this.fetchFromTMDB('/genre/movie/list');
  }

  async getBollywoodMovies(page: number = 1): Promise<TMDBResponse> {
    // Filter for Hindi language movies (Bollywood)
    return this.fetchFromTMDB(`/discover/movie?with_original_language=hi&page=${page}&sort_by=popularity.desc`);
  }

  async getRecommendations(movieId: number): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/${movieId}/recommendations`);
  }

  async getSimilarMovies(movieId: number): Promise<TMDBResponse> {
    return this.fetchFromTMDB(`/movie/${movieId}/similar`);
  }

  getImageUrl(path: string, size: string = 'w500'): string {
    if (!path) return '';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getBackdropUrl(path: string, size: string = 'w1280'): string {
    if (!path) return '';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  async getMoviesForSwipe(page: number = 1): Promise<Movie[]> {
    try {
      // Get a mix of popular Hollywood and Bollywood movies
      const [popularMovies, bollywoodMovies] = await Promise.all([
        this.getPopularMovies(page),
        this.getBollywoodMovies(page)
      ]);

      // Combine and shuffle the results
      const allMovies = [
        ...popularMovies.results.slice(0, 10),
        ...bollywoodMovies.results.slice(0, 10)
      ];

      // Shuffle array
      return allMovies.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Error fetching movies for swipe:', error);
      // Return empty array on error
      return [];
    }
  }

  async getRecommendationsBasedOnPreferences(likedGenres: number[]): Promise<Movie[]> {
    try {
      if (likedGenres.length === 0) {
        // If no preferences, return popular movies
        const response = await this.getPopularMovies();
        return response.results;
      }

      // Get movies for each liked genre
      const genrePromises = likedGenres.slice(0, 3).map(genreId => 
        this.getMoviesByGenre(genreId)
      );

      const genreResults = await Promise.all(genrePromises);
      
      // Combine and deduplicate results
      const allMovies = genreResults.flatMap(result => result.results);
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        self.findIndex(m => m.id === movie.id) === index
      );

      // Sort by popularity and return top results
      return uniqueMovies
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}

export const tmdbService = new TMDBService();
