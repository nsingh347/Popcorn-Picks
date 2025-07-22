module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables for theme colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border, 229, 231, 235))', // fallback for border if not set
      },
    },
  },
  plugins: [],
}; 