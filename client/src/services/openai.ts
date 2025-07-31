const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Debug logging
console.log('OpenAI API Key loaded:', OPENAI_API_KEY ? 'Yes (length: ' + OPENAI_API_KEY.length + ')' : 'No');
console.log('Environment check:', import.meta.env.VITE_OPENAI_API_KEY ? 'Available' : 'Not available');

// Check if OpenAI API is available
export const isOpenAIAvailable = () => {
  const available = !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here';
  console.log('OpenAI API Available:', available);
  return available;
};

interface MovieRecommendationRequest {
  likedMovies: string[];
  dislikedMovies: string[];
  preferredGenres?: string[];
  mood?: string;
  occasion?: string;
}

interface MovieAnalysisRequest {
  movieTitle: string;
  movieDescription: string;
  userPreferences: string[];
}

interface ConversationRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userPreferences?: string[];
}

export class OpenAIService {
  private static async makeRequest(prompt: string, maxTokens: number = 500) {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable movie expert and recommendation assistant. Provide helpful, accurate, and engaging responses about movies and recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  static async getPersonalizedRecommendations(request: MovieRecommendationRequest): Promise<string> {
    const prompt = `
      Based on the following user preferences, suggest 5 movie recommendations with brief explanations:
      
      Liked Movies: ${request.likedMovies.join(', ')}
      Disliked Movies: ${request.dislikedMovies.join(', ')}
      Preferred Genres: ${request.preferredGenres?.join(', ') || 'Any'}
      Current Mood: ${request.mood || 'Any'}
      Occasion: ${request.occasion || 'Casual watching'}
      
      Please provide:
      1. Movie title and year
      2. Brief explanation of why it matches their taste
      3. Similar to which of their liked movies
      
      Format as a JSON array with objects containing: title, year, explanation, similarTo
    `;

    return this.makeRequest(prompt, 800);
  }

  static async analyzeMovie(request: MovieAnalysisRequest): Promise<string> {
    const prompt = `
      Analyze this movie and provide insights:
      
      Movie: ${request.movieTitle}
      Description: ${request.movieDescription}
      User Preferences: ${request.userPreferences.join(', ')}
      
      Please provide:
      1. Why this movie might appeal to the user
      2. Potential concerns based on their preferences
      3. Similar movies they might enjoy
      4. Best viewing conditions (mood, company, etc.)
      
      Keep it concise and engaging.
    `;

    return this.makeRequest(prompt, 600);
  }

  static async getMoodBasedRecommendations(mood: string, genres: string[] = []): Promise<string> {
    const prompt = `
      Suggest 3 movies perfect for someone feeling "${mood}":
      
      Preferred Genres: ${genres.length > 0 ? genres.join(', ') : 'Any genre'}
      
      For each movie, provide:
      1. Title and year
      2. Why it's perfect for this mood
      3. Brief description
      
      Format as a JSON array with objects containing: title, year, moodMatch, description
    `;

    return this.makeRequest(prompt, 600);
  }

  static async chatWithAI(request: ConversationRequest): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a friendly movie expert assistant. The user has these preferences: ${request.userPreferences?.join(', ') || 'No specific preferences'}. Help them discover great movies and answer their questions about films.`
      },
      ...request.conversationHistory,
      {
        role: 'user' as const,
        content: request.message
      }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 400,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI chat request failed:', error);
      throw error;
    }
  }

  static async generateMovieTrivia(movieTitle: string): Promise<string> {
    const prompt = `
      Generate 3 interesting trivia facts about the movie "${movieTitle}":
      
      Please provide:
      1. Behind-the-scenes fact
      2. Cast/crew interesting tidbit
      3. Cultural impact or box office fact
      
      Format as a JSON array with objects containing: fact, category
    `;

    return this.makeRequest(prompt, 500);
  }

  static async getWatchlistSuggestions(watchlist: string[]): Promise<string> {
    const prompt = `
      Based on this watchlist, suggest 3 additional movies that would complement it well:
      
      Current Watchlist: ${watchlist.join(', ')}
      
      For each suggestion, provide:
      1. Movie title and year
      2. Why it complements their watchlist
      3. What makes it different from what they already have
      
      Format as a JSON array with objects containing: title, year, complementReason, uniqueness
    `;

    return this.makeRequest(prompt, 600);
  }
} 