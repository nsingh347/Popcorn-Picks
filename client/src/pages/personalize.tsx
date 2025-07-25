import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, User, Palette, Languages, List } from 'lucide-react';

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Animation', 'Adventure', 'Family', 'Fantasy', 'Mystery', 'Crime', 'Documentary', 'Music', 'War', 'Western', 'History', 'TV Movie'
];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'zh', label: 'Chinese' },
];

export default function Personalize() {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [avatar, setAvatar] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);

  useEffect(() => {
    // No localStorage: do not load personalize_settings
    setTheme('dark');
    setAvatar('');
    setSelectedGenres([]);
    setSelectedLanguages(['en']);
  }, []);

  const saveSettings = () => {
    // No localStorage: do not save personalize_settings
    window.location.reload(); // To apply theme (optional, or remove)
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.h1
          className="text-4xl font-bold mb-8 text-center"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Palette className="inline w-8 h-8 text-accent-gold mr-2" />
          Personalize Your Experience
        </motion.h1>

        {/* Theme Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><Palette className="w-5 h-5 mr-2 text-accent-gold" />Theme</h2>
          <div className="flex space-x-4">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}><Sun className="w-5 h-5 mr-1" />Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}><Moon className="w-5 h-5 mr-1" />Dark</Button>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><User className="w-5 h-5 mr-2 text-accent-gold" />Avatar</h2>
          <div className="flex items-center space-x-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-accent-gold" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-white">{user?.displayName?.charAt(0) || 'U'}</div>
            )}
            <Input type="file" accept="image/*" onChange={handleAvatarChange} className="w-auto" />
          </div>
        </div>

        {/* Genre Filters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><List className="w-5 h-5 mr-2 text-accent-gold" />Favorite Genres</h2>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Button
                key={genre}
                size="sm"
                variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                className={selectedGenres.includes(genre) ? 'bg-accent-gold text-black' : ''}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Language Filters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center"><Languages className="w-5 h-5 mr-2 text-accent-gold" />Preferred Languages</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                size="sm"
                variant={selectedLanguages.includes(lang.code) ? 'default' : 'outline'}
                className={selectedLanguages.includes(lang.code) ? 'bg-accent-gold text-black' : ''}
                onClick={() => toggleLanguage(lang.code)}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button className="bg-accent-gold text-black px-8 py-3 rounded-full font-semibold text-lg" onClick={saveSettings}>
            Save & Apply
          </Button>
        </div>
      </div>
    </div>
  );
} 