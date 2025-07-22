import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Load from personalize_settings
    const saved = localStorage.getItem('personalize_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.theme === 'light' || parsed.theme === 'dark') {
        setThemeState(parsed.theme);
      }
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    // Save to personalize_settings
    const saved = localStorage.getItem('personalize_settings');
    let parsed = saved ? JSON.parse(saved) : {};
    parsed.theme = theme;
    localStorage.setItem('personalize_settings', JSON.stringify(parsed));
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
} 