import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { tmdbService } from '@/services/tmdb';

function OnboardingForm({ onComplete }: { onComplete: () => void }) {
  const [actors, setActors] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedActors, setSelectedActors] = useState<any[]>([]);
  const [selectedDirectors, setSelectedDirectors] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorSearch, setActorSearch] = useState('');
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearchResults, setActorSearchResults] = useState<any[]>([]);
  const [directorSearchResults, setDirectorSearchResults] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      setLoading(true);
      const [actors, directors, genres] = await Promise.all([
        tmdbService.getPopularActors(),
        tmdbService.getPopularDirectors(),
        tmdbService.getGenres().then(g => g.genres)
      ]);
      setActors(actors);
      setDirectors(directors);
      setGenres(genres);
      setLoading(false);
    }
    fetchOptions();
  }, []);

  // Actor search
  useEffect(() => {
    if (actorSearch.length < 2) {
      setActorSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await tmdbService.searchPeople(actorSearch);
      setActorSearchResults(results.filter(p => p.known_for_department === 'Acting'));
    }, 400);
    return () => clearTimeout(timeout);
  }, [actorSearch]);

  // Director search
  useEffect(() => {
    if (directorSearch.length < 2) {
      setDirectorSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await tmdbService.searchPeople(directorSearch);
      setDirectorSearchResults(results.filter(p => p.known_for_department === 'Directing'));
    }, 400);
    return () => clearTimeout(timeout);
  }, [directorSearch]);

  const toggle = (arr: any[], setArr: any, item: any, max: number) => {
    if (arr.some((a) => a.id === item.id)) {
      setArr(arr.filter((a) => a.id !== item.id));
    } else if (arr.length < max) {
      setArr([...arr, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage for now
    localStorage.setItem('onboarding_preferences', JSON.stringify({
      actors: selectedActors,
      directors: selectedDirectors,
      genres: selectedGenres
    }));
    onComplete();
  };

  if (loading) return <div className="text-center text-white py-12">Loading preferences...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-dark-char rounded-2xl p-8 shadow-2xl border border-gray-800 mt-8">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Personalize Your Experience</h2>
      {/* Actors */}
      <div>
        <label className="block text-lg font-semibold text-gray-300 mb-2">Favorite Actors (Pick 3)</label>
        <Input
          type="text"
          placeholder="Search for an actor..."
          value={actorSearch}
          onChange={e => setActorSearch(e.target.value)}
          className="mb-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-2 mb-2">
          {actorSearchResults.length > 0
            ? actorSearchResults.map(actor => (
                <button
                  type="button"
                  key={actor.id}
                  className={`px-3 py-1 rounded-full border text-sm flex items-center ${selectedActors.some(a => a.id === actor.id) ? 'bg-accent-gold text-black border-accent-gold' : 'bg-gray-800 text-white border-gray-700'}`}
                  onClick={() => toggle(selectedActors, setSelectedActors, actor, 3)}
                  disabled={!selectedActors.some(a => a.id === actor.id) && selectedActors.length >= 3}
                >
                  {actor.profile_path && <img src={`https://image.tmdb.org/t/p/w45${actor.profile_path}`} alt={actor.name} className="w-6 h-6 rounded-full mr-2" />}
                  {actor.name}
                </button>
              ))
            : actors.map(actor => (
                <button
                  type="button"
                  key={actor.id}
                  className={`px-3 py-1 rounded-full border text-sm flex items-center ${selectedActors.some(a => a.id === actor.id) ? 'bg-accent-gold text-black border-accent-gold' : 'bg-gray-800 text-white border-gray-700'}`}
                  onClick={() => toggle(selectedActors, setSelectedActors, actor, 3)}
                  disabled={!selectedActors.some(a => a.id === actor.id) && selectedActors.length >= 3}
                >
                  {actor.profile_path && <img src={`https://image.tmdb.org/t/p/w45${actor.profile_path}`} alt={actor.name} className="w-6 h-6 rounded-full mr-2" />}
                  {actor.name}
                </button>
              ))}
        </div>
      </div>
      {/* Directors */}
      <div>
        <label className="block text-lg font-semibold text-gray-300 mb-2">Favorite Directors (Pick 3)</label>
        <Input
          type="text"
          placeholder="Search for a director..."
          value={directorSearch}
          onChange={e => setDirectorSearch(e.target.value)}
          className="mb-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <div className="flex flex-wrap gap-2 mb-2">
          {directorSearchResults.length > 0
            ? directorSearchResults.map(director => (
                <button
                  type="button"
                  key={director.id}
                  className={`px-3 py-1 rounded-full border text-sm flex items-center ${selectedDirectors.some(a => a.id === director.id) ? 'bg-accent-gold text-black border-accent-gold' : 'bg-gray-800 text-white border-gray-700'}`}
                  onClick={() => toggle(selectedDirectors, setSelectedDirectors, director, 3)}
                  disabled={!selectedDirectors.some(a => a.id === director.id) && selectedDirectors.length >= 3}
                >
                  {director.profile_path && <img src={`https://image.tmdb.org/t/p/w45${director.profile_path}`} alt={director.name} className="w-6 h-6 rounded-full mr-2" />}
                  {director.name}
                </button>
              ))
            : directors.length > 0
              ? directors.map(director => (
                  <button
                    type="button"
                    key={director.id}
                    className={`px-3 py-1 rounded-full border text-sm flex items-center ${selectedDirectors.some(a => a.id === director.id) ? 'bg-accent-gold text-black border-accent-gold' : 'bg-gray-800 text-white border-gray-700'}`}
                    onClick={() => toggle(selectedDirectors, setSelectedDirectors, director, 3)}
                    disabled={!selectedDirectors.some(a => a.id === director.id) && selectedDirectors.length >= 3}
                  >
                    {director.profile_path && <img src={`https://image.tmdb.org/t/p/w45${director.profile_path}`} alt={director.name} className="w-6 h-6 rounded-full mr-2" />}
                    {director.name}
                  </button>
                ))
              : <span className="text-gray-400">No popular directors found. Please search by name.</span>}
        </div>
      </div>
      {/* Genres */}
      <div>
        <label className="block text-lg font-semibold text-gray-300 mb-2">Favorite Genres (Pick 3)</label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              type="button"
              key={genre.id}
              className={`px-3 py-1 rounded-full border text-sm ${selectedGenres.some(a => a.id === genre.id) ? 'bg-accent-gold text-black border-accent-gold' : 'bg-gray-800 text-white border-gray-700'}`}
              onClick={() => toggle(selectedGenres, setSelectedGenres, genre, 3)}
              disabled={!selectedGenres.some(a => a.id === genre.id) && selectedGenres.length >= 3}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full bg-netflix hover:bg-red-700 text-white font-semibold py-3 rounded-lg mt-4" disabled={selectedActors.length !== 3 || selectedDirectors.length !== 3 || selectedGenres.length !== 3}>
        Save Preferences & Continue
      </Button>
    </form>
  );
}

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return; // TODO: Show error
    }
    await register({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      displayName: formData.displayName,
    });
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return <OnboardingForm onComplete={() => setLocation('/swipe')} />;
  }

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-dark-char rounded-2xl p-8 shadow-2xl border border-gray-800"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-netflix mr-2" />
              <h1 className="text-3xl font-bold text-white">Popcorn Picks</h1>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Join the Adventure</h2>
            <p className="text-gray-400">Create your account and start discovering movies together</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your display name"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Match Error */}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">Passwords do not match</p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || formData.password !== formData.confirmPassword}
              className="w-full bg-netflix hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login">
                <span className="text-netflix hover:text-red-400 font-medium cursor-pointer transition-colors">
                  Sign in here
                </span>
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 