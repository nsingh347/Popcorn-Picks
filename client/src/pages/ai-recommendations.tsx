import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Brain, Heart, Users, Clock, Star } from 'lucide-react';
import { geminiService, MovieRecommendationRequest, MovieAnalysis } from '@/services/gemini';
import { useAuth } from '@/contexts/AuthContext';
import { useSwipePreferences } from '@/hooks/use-swipe-preferences';
import { tmdbService } from '@/services/tmdb';
import { MovieCard } from '@/components/movie-card';
import { MovieDetailModal } from '@/components/movie-detail-modal';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<MovieAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [mood, setMood] = useState('');
  const [occasion, setOccasion] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const { user } = useAuth();
  const { preferences } = useSwipePreferences();

  const moods = [
    'Happy', 'Sad', 'Excited', 'Relaxed', 'Romantic', 'Adventurous', 
    'Thoughtful', 'Nostalgic', 'Inspired', 'Mysterious', 'Comforting'
  ];

  const occasions = [
    'Date Night', 'Family Time', 'Solo Watch', 'Friends Gathering', 
    'Weekend Relaxation', 'Movie Night', 'Special Occasion', 'Casual Evening'
  ];

  const getRecommendations = async (request: MovieRecommendationRequest) => {
    setIsLoading(true);
    try {
      if (!geminiService.isAvailable()) {
        throw new Error('Gemini API key not configured');
      }

      const results = await geminiService.getMovieRecommendations(request);
      setRecommendations(results);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      alert('Failed to get AI recommendations. Please check your Gemini API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodBasedRecommendations = async () => {
    if (!mood) return;

    const request: MovieRecommendationRequest = {
      userPreferences: {
        likedGenres: [],
        likedMovies: preferences.filter(p => p.preference === 'like').map(p => p.movieId.toString()),
        dislikedMovies: preferences.filter(p => p.preference === 'dislike').map(p => p.movieId.toString()),
        mood,
        occasion
      },
      context: `User is in a ${mood} mood${occasion ? ` for ${occasion}` : ''}`
    };

    await getRecommendations(request);
  };

  const handleCustomRecommendations = async () => {
    if (!customPrompt.trim()) return;

    const request: MovieRecommendationRequest = {
      userPreferences: {
        likedGenres: [],
        likedMovies: preferences.filter(p => p.preference === 'like').map(p => p.movieId.toString()),
        dislikedMovies: preferences.filter(p => p.preference === 'dislike').map(p => p.movieId.toString()),
        mood,
        occasion
      },
      context: customPrompt
    };

    await getRecommendations(request);
  };

  const handleSmartRecommendations = async () => {
    const request: MovieRecommendationRequest = {
      userPreferences: {
        likedGenres: [],
        likedMovies: preferences.filter(p => p.preference === 'like').map(p => p.movieId.toString()),
        dislikedMovies: preferences.filter(p => p.preference === 'dislike').map(p => p.movieId.toString()),
        mood,
        occasion
      },
      context: 'Based on user\'s swiping history and preferences, provide personalized recommendations'
    };

    await getRecommendations(request);
  };

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8 text-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            AI Movie Recommendations
            <Badge variant="secondary" className="ml-2">
              <Brain className="w-3 h-3 mr-1" />
              Gemini
            </Badge>
          </h1>
          <p className="text-gray-400 text-lg">
            Get intelligent movie suggestions powered by Google Gemini AI
          </p>
        </div>

        {/* API Key Warning */}
        {!geminiService.isAvailable() && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Gemini API Key Missing</h3>
            <p className="text-gray-300 mb-3">
              AI recommendations are not available because the Gemini API key is not configured.
            </p>
            <div className="bg-gray-800 p-3 rounded text-sm">
              <p className="text-gray-300 mb-1">Add this to your .env file:</p>
              <code className="text-green-400">VITE_GEMINI_API_KEY=your_gemini_api_key_here</code>
              <p className="text-gray-400 mt-2 text-xs">
                Get a free API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
              </p>
            </div>
          </div>
        )}

        {/* Recommendation Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mood-Based Recommendations */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                Mood-Based Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">How are you feeling?</label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Occasion (optional)</label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleMoodBasedRecommendations}
                disabled={!mood || isLoading || !geminiService.isAvailable()}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get Mood-Based Recommendations
              </Button>
            </CardContent>
          </Card>

          {/* Smart Recommendations */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300">
                Based on your swiping history and preferences, AI will suggest movies you'll love.
              </p>
              <div className="text-xs text-gray-400">
                <p>Liked: {preferences.filter(p => p.preference === 'like').length} movies</p>
                <p>Disliked: {preferences.filter(p => p.preference === 'dislike').length} movies</p>
              </div>
              <Button 
                onClick={handleSmartRecommendations}
                disabled={isLoading || !geminiService.isAvailable()}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                Get Smart Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Custom Recommendations */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Custom Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Describe what you're looking for</label>
              <Input
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Movies like Inception but easier to understand' or 'Feel-good movies for a rainy day'"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <Button 
              onClick={handleCustomRecommendations}
              disabled={!customPrompt.trim() || isLoading || !geminiService.isAvailable()}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Custom Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">AI is analyzing your preferences...</p>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && !isLoading && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              AI Recommendations
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {rec.themes.slice(0, 3).map((theme, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">
                        <strong>Mood:</strong> {rec.mood}
                      </p>
                      <p className="text-sm text-gray-300 mb-1">
                        <strong>Watch with:</strong> {rec.watchWith}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        <strong>Why recommended:</strong>
                      </p>
                      <p className="text-xs text-gray-500">{rec.whyRecommended}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        <strong>Similar movies:</strong>
                      </p>
                      <p className="text-xs text-gray-500">{rec.similarMovies.join(', ')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <MovieDetailModal 
        movieId={selectedMovieId} 
        isOpen={!!selectedMovieId} 
        onClose={() => setSelectedMovieId(null)} 
      />
    </div>
  );
} 