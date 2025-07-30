import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface MovieRecommendationRequest {
  userPreferences: {
    likedGenres: string[];
    likedMovies: string[];
    dislikedMovies: string[];
    mood?: string;
    occasion?: string;
  };
  context?: string;
}

export interface MovieAnalysis {
  themes: string[];
  mood: string;
  similarMovies: string[];
  whyRecommended: string;
  watchWith: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GeminiService {
  private model: any;

  constructor() {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Get AI-powered movie recommendations based on user preferences
   */
  async getMovieRecommendations(request: MovieRecommendationRequest): Promise<MovieAnalysis[]> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
      You are an expert movie recommendation AI. Based on the user's preferences, provide 5 movie recommendations.
      
      User Preferences:
      - Liked Genres: ${request.userPreferences.likedGenres.join(', ')}
      - Liked Movies: ${request.userPreferences.likedMovies.join(', ')}
      - Disliked Movies: ${request.userPreferences.dislikedMovies.join(', ')}
      - Mood: ${request.userPreferences.mood || 'any'}
      - Occasion: ${request.userPreferences.occasion || 'any'}
      - Context: ${request.context || 'general recommendation'}
      
      For each recommendation, provide:
      1. Movie title and year
      2. Main themes (3-5 themes)
      3. Overall mood
      4. Why it's recommended for this user
      5. Best watched with (alone, partner, friends, family)
      6. Similar movies they might enjoy
      
      Format your response as a JSON array with this structure:
      [
        {
          "title": "Movie Title (Year)",
          "themes": ["theme1", "theme2", "theme3"],
          "mood": "mood description",
          "whyRecommended": "explanation",
          "watchWith": "recommendation",
          "similarMovies": ["movie1", "movie2", "movie3"]
        }
      ]
      
      Make sure the recommendations are diverse and consider the user's preferences carefully.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error getting movie recommendations:', error);
      throw error;
    }
  }

  /**
   * Chat with AI about movies
   */
  async chatWithAI(messages: ChatMessage[]): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const conversationHistory = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `
      You are a friendly and knowledgeable movie expert AI assistant. Help users discover great movies and answer their questions about films.
      
      Conversation History:
      ${conversationHistory}
      
      Provide helpful, engaging responses about movies. You can:
      - Recommend movies based on preferences
      - Explain movie plots and themes
      - Suggest similar movies
      - Discuss movie genres and trends
      - Help with movie selection for different occasions
      
      Keep responses conversational and informative, but not too long.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error chatting with AI:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific movie and provide insights
   */
  async analyzeMovie(movieTitle: string, movieDetails?: any): Promise<MovieAnalysis> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
      Analyze the movie "${movieTitle}" and provide detailed insights.
      
      ${movieDetails ? `Movie Details: ${JSON.stringify(movieDetails)}` : ''}
      
      Provide analysis in this JSON format:
      {
        "themes": ["theme1", "theme2", "theme3"],
        "mood": "overall mood description",
        "similarMovies": ["movie1", "movie2", "movie3"],
        "whyRecommended": "why someone might enjoy this movie",
        "watchWith": "best viewing companion recommendation"
      }
      
      Make the analysis insightful and helpful for movie discovery.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error analyzing movie:', error);
      throw error;
    }
  }

  /**
   * Get mood-based movie recommendations
   */
  async getMoodBasedRecommendations(mood: string, occasion?: string): Promise<MovieAnalysis[]> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
      Recommend 5 movies perfect for someone in a "${mood}" mood.
      ${occasion ? `Occasion: ${occasion}` : ''}
      
      Consider:
      - Movies that match the emotional tone
      - Films that can help enhance or change the mood
      - Different genres that work well for this mood
      
      Format as JSON array:
      [
        {
          "title": "Movie Title (Year)",
          "themes": ["theme1", "theme2", "theme3"],
          "mood": "mood description",
          "whyRecommended": "why it's perfect for this mood",
          "watchWith": "recommendation",
          "similarMovies": ["movie1", "movie2", "movie3"]
        }
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error getting mood-based recommendations:', error);
      throw error;
    }
  }

  /**
   * Check if Gemini is available
   */
  isAvailable(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY && !!this.model;
  }
}

export const geminiService = new GeminiService(); 