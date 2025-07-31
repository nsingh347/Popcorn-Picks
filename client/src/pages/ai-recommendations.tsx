import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Clock, Star, TrendingUp, Brain } from 'lucide-react';
import { OpenAIService, isOpenAIAvailable } from '@/services/openai';
import { useAuth } from '@/contexts/AuthContext';
import { Movie } from '@/types/movie';
import { AISetupInstructions } from '@/components/ai-setup-instructions';

interface AIRecommendation {
  title: string;
  year: string;
  explanation?: string;
  similarTo?: string;
  moodMatch?: string;
  description?: string;
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mood' | 'personalized' | 'trivia'>('mood');
  const [mood, setMood] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<string[]>([]);
  const { user } = useAuth();

  // Show setup instructions if OpenAI API is not available
  if (!isOpenAIAvailable()) {
    return <AISetupInstructions />;
  }

  const moods = [
    'Happy', 'Sad', 'Excited', 'Relaxed', 'Romantic', 'Adventurous',
    'Nostalgic', 'Inspired', 'Mysterious', 'Comedic', 'Dramatic', 'Thrilled'
  ];

  const genres = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi',
    'Thriller', 'Documentary', 'Animation', 'Fantasy', 'Mystery', 'Western'
  ];

  useEffect(() => {
    // Load user's liked movies from session storage
    const likedMoviesData = sessionStorage.getItem('likedMovies');
    if (likedMoviesData) {
      try {
        const movies: Movie[] = JSON.parse(likedMoviesData);
        setLikedMovies(movies.map(m => m.title));
      } catch (error) {
        console.error('Error parsing liked movies:', error);
      }
    }
  }, []);

  const handleMoodRecommendations = async () => {
    if (!mood) return;
    
    setIsLoading(true);
    try {
      const response = await OpenAIService.getMoodBasedRecommendations(mood, selectedGenres);
      const parsed = parseAIResponse(response);
      setRecommendations(parsed);
    } catch (error) {
      console.error('Error getting mood recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalizedRecommendations = async () => {
    if (likedMovies.length === 0) {
      alert('Please like some movies first to get personalized recommendations!');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await OpenAIService.getPersonalizedRecommendations({
        likedMovies,
        dislikedMovies,
        preferredGenres: selectedGenres,
        mood: mood || undefined
      });
      const parsed = parseAIResponse(response);
      setRecommendations(parsed);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (response: string): AIRecommendation[] => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // If JSON parsing fails, try to extract movie information from text
      const lines = response.split('\n').filter(line => line.trim());
      const movies: AIRecommendation[] = [];
      
      for (const line of lines) {
        if (line.includes('title') || line.includes('Title')) {
          const titleMatch = line.match(/"title":\s*"([^"]+)"/);
          const yearMatch = line.match(/"year":\s*"([^"]+)"/);
          const explanationMatch = line.match(/"explanation":\s*"([^"]+)"/);
          
          if (titleMatch) {
            movies.push({
              title: titleMatch[1],
              year: yearMatch ? yearMatch[1] : '',
              explanation: explanationMatch ? explanationMatch[1] : ''
            });
          }
        }
      }
      
      return movies;
    }
  };

  const addToWatchlist = (movie: AIRecommendation) => {
    // Add to session storage watchlist
    const watchlist = JSON.parse(sessionStorage.getItem('watchlist') || '[]');
    const movieToAdd = {
      id: Date.now(),
      title: movie.title,
      year: movie.year,
      poster_path: null,
      overview: movie.description || movie.explanation || ''
    };
    
    if (!watchlist.find((m: any) => m.title === movie.title)) {
      watchlist.push(movieToAdd);
      sessionStorage.setItem('watchlist', JSON.stringify(watchlist));
      alert(`${movie.title} added to watchlist!`);
    } else {
      alert(`${movie.title} is already in your watchlist!`);
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Movie Recommendations
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Discover your next favorite movie with AI-powered insights
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1">
            <Button
              variant={activeTab === 'mood' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('mood')}
              className="text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              Mood-Based
            </Button>
            <Button
              variant={activeTab === 'personalized' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('personalized')}
              className="text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Personalized
            </Button>
            <Button
              variant={activeTab === 'trivia' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('trivia')}
              className="text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              Movie Trivia
            </Button>
          </div>
        </div>

        {/* Mood-Based Recommendations */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span>How are you feeling today?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {moods.map((moodOption) => (
                    <Button
                      key={moodOption}
                      variant={mood === moodOption ? 'default' : 'outline'}
                      onClick={() => setMood(moodOption)}
                      className="text-sm"
                    >
                      {moodOption}
                    </Button>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Genres (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant={selectedGenres.includes(genre) ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedGenres(prev =>
                            prev.includes(genre)
                              ? prev.filter(g => g !== genre)
                              : [...prev, genre]
                          );
                        }}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleMoodRecommendations}
                  disabled={!mood || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Getting Recommendations...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Get Mood-Based Recommendations</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Personalized Recommendations */}
        {activeTab === 'personalized' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <span>Personalized Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Movies You Liked</label>
                    <div className="bg-gray-800 rounded-lg p-3 min-h-[100px]">
                      {likedMovies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {likedMovies.map((movie, index) => (
                            <Badge key={index} variant="default" className="bg-green-600">
                              {movie}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Like some movies on the Swipe page to get personalized recommendations!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Disliked Movies</label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter movie title..."
                        className="bg-gray-800 border-gray-600"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            setDislikedMovies(prev => [...prev, e.currentTarget.value.trim()]);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dislikedMovies.map((movie, index) => (
                        <Badge key={index} variant="destructive">
                          {movie}
                          <button
                            onClick={() => setDislikedMovies(prev => prev.filter((_, i) => i !== index))}
                            className="ml-1 text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePersonalizedRecommendations}
                  disabled={likedMovies.length === 0 || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Your Taste...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>Get Personalized Recommendations</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Movie Trivia */}
        {activeTab === 'trivia' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Movie Trivia Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Enter a movie title to get interesting trivia facts!
                </p>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter movie title..."
                    className="bg-gray-800 border-gray-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        // Handle trivia generation
                        console.log('Generate trivia for:', e.currentTarget.value);
                      }
                    }}
                  />
                  <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                    <Star className="w-4 h-4 mr-2" />
                    Get Trivia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations Display */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span>AI Recommendations</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((movie, index) => (
                <Card key={index} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{movie.title}</CardTitle>
                        <p className="text-gray-400">{movie.year}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        AI Pick
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {movie.moodMatch && (
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-300">{movie.moodMatch}</span>
                      </div>
                    )}
                    {movie.similarTo && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Similar to: {movie.similarTo}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-300">
                      {movie.explanation || movie.description || 'AI-recommended based on your preferences'}
                    </p>
                    <Button
                      onClick={() => addToWatchlist(movie)}
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Add to Watchlist
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 