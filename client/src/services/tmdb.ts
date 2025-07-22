import type { Movie, MovieDetails, TMDBResponse, Genre } from '@/types/movie';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

class TMDBService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_TMDB_API_KEY;
    
    // Debug logging
    console.log('TMDB Service Environment check:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length,
      envKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });

    // Check if API key is available
    if (!this.apiKey) {
      console.error('TMDB API key is missing. Please add VITE_TMDB_API_KEY to your .env file');
    }
  }

  private async fetchFromTMDB(endpoint: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('TMDB API key is not configured. Please check your .env file.');
    }
    
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
      // Generate random pages for more variety
      const randomPage1 = Math.floor(Math.random() * 5) + 1;
      const randomPage2 = Math.floor(Math.random() * 5) + 1;
      const randomPage3 = Math.floor(Math.random() * 5) + 1;
      const randomPage4 = Math.floor(Math.random() * 5) + 1;
      const randomPage5 = Math.floor(Math.random() * 5) + 1;

      // Diverse language codes for global movies
      const languages = ['en', 'hi', 'es', 'fr', 'ja', 'ko', 'de', 'it', 'zh', 'ru', 'pt', 'tr', 'ar'];
      const randomLang1 = languages[Math.floor(Math.random() * languages.length)];
      const randomLang2 = languages[Math.floor(Math.random() * languages.length)];

      // Get a mix of different movie sources for more global variety
      const [popularMovies, topRatedMovies, lang1Movies, lang2Movies] = await Promise.all([
        this.getPopularMovies(randomPage1),
        this.getTopRatedMovies(randomPage2),
        this.fetchFromTMDB(`/discover/movie?with_original_language=${randomLang1}&page=${randomPage3}&sort_by=popularity.desc`),
        this.fetchFromTMDB(`/discover/movie?with_original_language=${randomLang2}&page=${randomPage4}&sort_by=popularity.desc`)
      ]);

      // Combine movies from different sources
      const allMovies = [
        ...popularMovies.results.slice(0, 8),
        ...topRatedMovies.results.slice(0, 8),
        ...(lang1Movies.results?.slice(0, 8) || []),
        ...(lang2Movies.results?.slice(0, 8) || [])
      ];

      // Shuffle array for randomness
      return allMovies.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Error fetching movies for swipe:', error);
      // Return empty array on error
      return [];
    }
  }

  // Helper: Map moods/occasions to genre IDs
  private moodGenreMap: Record<string, number[]> = {
    feel_good: [35, 10751], // Comedy, Family
    thriller: [53, 9648],   // Thriller, Mystery
    romantic: [10749, 18],  // Romance, Drama
    adventure: [12, 28],    // Adventure, Action
    family: [10751, 16],    // Family, Animation
  };
  private occasionGenreMap: Record<string, number[]> = {
    date_night: [10749, 35], // Romance, Comedy
    movie_night: [28, 12],   // Action, Adventure
    weekend: [35, 10751, 12],// Comedy, Family, Adventure
  };

  /**
   * Advanced recommendations: accepts mood, occasion, genres, languages, and user preferences.
   * If likedMovieIds are present, only those movies are shown in the main recommendations.
   */
  async getRecommendationsAdvanced({
    likedGenres = [],
    likedMovieIds = [],
    mood = '',
    occasion = '',
    personalizeGenres = [],
    personalizeLanguages = [],
    dislikedMovieIds = [],
  }: {
    likedGenres?: number[];
    likedMovieIds?: number[];
    mood?: string;
    occasion?: string;
    personalizeGenres?: string[];
    personalizeLanguages?: string[];
    dislikedMovieIds?: number[];
  }): Promise<Movie[]> {
    try {
      // If likedMovieIds are present, only show those movies
      if (likedMovieIds.length > 0) {
        const likedMoviesPromises = likedMovieIds.map(movieId => this.getMovieDetails(movieId).catch(() => null));
        const likedMoviesResults = await Promise.all(likedMoviesPromises);
        const validLikedMovies = likedMoviesResults.filter(Boolean).map(movie => ({
          id: movie!.id,
          title: movie!.title,
          overview: movie!.overview,
          poster_path: movie!.poster_path,
          backdrop_path: movie!.backdrop_path,
          release_date: movie!.release_date,
          vote_average: movie!.vote_average,
          vote_count: movie!.vote_count,
          popularity: movie!.popularity,
          genre_ids: movie!.genres?.map(g => g.id) || [],
          adult: movie!.adult || false,
          original_language: movie!.original_language || 'en',
          original_title: movie!.original_title || movie!.title,
          video: movie!.video || false,
          explanation: 'You liked this movie'
        }));
        // Filter out disliked movies
        const filtered = validLikedMovies.filter(movie => !dislikedMovieIds.includes(movie.id));
        return filtered;
      }
      // Collect all relevant genres
      let genreIds: number[] = [...likedGenres];
      // Add mood/occasion mapped genres
      if (mood && this.moodGenreMap[mood]) {
        genreIds.push(...this.moodGenreMap[mood]);
      }
      if (occasion && this.occasionGenreMap[occasion]) {
        genreIds.push(...this.occasionGenreMap[occasion]);
      }
      // Add personalized genres (convert names to IDs)
      if (personalizeGenres.length > 0) {
        const allGenres = (await this.getGenres()).genres;
        const mapped = personalizeGenres.map(name => allGenres.find(g => g.name === name)?.id).filter(Boolean) as number[];
        genreIds.push(...mapped);
      }
      // Remove duplicates
      genreIds = Array.from(new Set(genreIds));

      // Fetch movies for each genre
      let allMovies: Movie[] = [];
      if (genreIds.length > 0) {
        const genrePromises = genreIds.slice(0, 5).map(genreId => this.getMoviesByGenre(genreId));
        const genreResults = await Promise.all(genrePromises);
        allMovies = genreResults.flatMap(result => result.results);
      }
      // Add liked movies (with explanation)
      if (likedMovieIds.length > 0) {
        const likedMoviesPromises = likedMovieIds.slice(0, 10).map(movieId => this.getMovieDetails(movieId).catch(() => null));
        const likedMoviesResults = await Promise.all(likedMoviesPromises);
        const validLikedMovies = likedMoviesResults.filter(Boolean).map(movie => ({
          id: movie!.id,
          title: movie!.title,
          overview: movie!.overview,
          poster_path: movie!.poster_path,
          backdrop_path: movie!.backdrop_path,
          release_date: movie!.release_date,
          vote_average: movie!.vote_average,
          vote_count: movie!.vote_count,
          popularity: movie!.popularity,
          genre_ids: movie!.genres?.map(g => g.id) || [],
          adult: movie!.adult || false,
          original_language: movie!.original_language || 'en',
          original_title: movie!.original_title || movie!.title,
          video: movie!.video || false,
          explanation: 'You liked this movie'
        }));
        allMovies.push(...validLikedMovies);
      }
      // Filter by language if set
      if (personalizeLanguages.length > 0) {
        allMovies = allMovies.filter(m => personalizeLanguages.includes(m.original_language));
      }
      // Remove duplicates
      const uniqueMovies = allMovies.filter((movie, index, self) => self.findIndex(m => m.id === movie.id) === index);
      // Filter out disliked movies
      const filteredMovies = uniqueMovies.filter(movie => !dislikedMovieIds.includes(movie.id));
      // Add explanations
      const explain = (movie: Movie): string => {
        if (movie.explanation) return movie.explanation;
        let reasons = [];
        if (mood && movie.genre_ids.some(id => this.moodGenreMap[mood]?.includes(id))) reasons.push(`matches your "${mood}" mood`);
        if (occasion && movie.genre_ids.some(id => this.occasionGenreMap[occasion]?.includes(id))) reasons.push(`fits "${occasion.replace('_', ' ')}"`);
        if (likedGenres.some(id => movie.genre_ids.includes(id))) reasons.push('matches your liked genres');
        if (personalizeGenres.length > 0 && personalizeGenres.some(name => {
          // Map genre name to id
          const allGenres = (movie as any).allGenres || [];
          return allGenres.some((g: any) => personalizeGenres.includes(g.name) && movie.genre_ids.includes(g.id));
        })) reasons.push('matches your personalized genres');
        if (reasons.length === 0) return 'Matches your preferences';
        return reasons.join(', ');
      };
      // Attach explanations
      const allGenres = (await this.getGenres()).genres;
      const moviesWithExplanations = filteredMovies.map(movie => ({ ...movie, explanation: explain({ ...movie, allGenres }) }));
      // Sort by popularity
      return moviesWithExplanations.sort((a, b) => b.popularity - a.popularity).slice(0, 30);
    } catch (error) {
      console.error('Error getting advanced recommendations:', error);
      return [];
    }
  }

  /**
   * Fetch similar movies for a list of movie IDs, excluding disliked and already liked movies.
   */
  async getSimilarMoviesForLiked(likedMovieIds: number[], dislikedMovieIds: number[] = []): Promise<Movie[]> {
    try {
      const similarPromises = likedMovieIds.map(id => this.getSimilarMovies(id).catch(() => ({ results: [] })));
      const similarResults = await Promise.all(similarPromises);
      let allSimilar = similarResults.flatMap(r => r.results);
      // Remove duplicates, already liked, and disliked
      allSimilar = allSimilar.filter((movie, idx, arr) =>
        arr.findIndex(m => m.id === movie.id) === idx &&
        !likedMovieIds.includes(movie.id) &&
        !dislikedMovieIds.includes(movie.id)
      );
      return allSimilar.slice(0, 18); // Limit for display
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      return [];
    }
  }

  /**
   * Fetch streaming platforms (watch providers) for a movie.
   */
  async getWatchProviders(movieId: number): Promise<string[]> {
    try {
      const data = await this.fetchFromTMDB(`/movie/${movieId}/watch/providers`);
      // Default to US, fallback to any available
      const country = data.results?.US ? 'US' : Object.keys(data.results || {})[0];
      const providers = data.results?.[country]?.flatrate || [];
      return providers.map((p: any) => p.provider_name);
    } catch (error) {
      console.error('Error fetching watch providers:', error);
      return [];
    }
  }

  /**
   * Fetch popular actors for onboarding form (limit to top 30).
   */
  async getPopularActors(): Promise<{ id: number; name: string; profile_path: string | null }[]> {
    const data = await this.fetchFromTMDB('/person/popular');
    return (data.results || [])
      .filter((p: any) => p.known_for_department === 'Acting')
      .slice(0, 30)
      .map((p: any) => ({ id: p.id, name: p.name, profile_path: p.profile_path }));
  }

  /**
   * Fetch popular directors for onboarding form (limit to top 30).
   */
  async getPopularDirectors(): Promise<{ id: number; name: string; profile_path: string | null }[]> {
    const data = await this.fetchFromTMDB('/person/popular');
    // Directors are less common, so filter by known_for_department and known_for credits
    return (data.results || [])
      .filter((p: any) => p.known_for_department === 'Directing' || (p.known_for || []).some((k: any) => k.job === 'Director'))
      .slice(0, 30)
      .map((p: any) => ({ id: p.id, name: p.name, profile_path: p.profile_path }));
  }

  /**
   * Search for people (actors or directors) by name.
   */
  async searchPeople(query: string): Promise<{ id: number; name: string; profile_path: string | null; known_for_department: string }[]> {
    const data = await this.fetchFromTMDB(`/search/person?query=${encodeURIComponent(query)}`);
    return (data.results || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      profile_path: p.profile_path,
      known_for_department: p.known_for_department
    }));
  }
}

export const tmdbService = new TMDBService();
