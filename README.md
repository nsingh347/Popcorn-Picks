# Popcorn Picks - Movie Discovery Web App

A modern, swipe-based movie discovery web application built with React and Vite. The app provides an intuitive, Tinder-like interface for users to discover movies through swiping gestures, featuring both Hollywood and Bollywood films. Users can build personalized watchlists and receive recommendations based on their preferences.

## Features

- **Swipe-based Interface**: Intuitive Tinder-like swiping for movie discovery
- **Movie Recommendations**: Suggestions based on user preferences
- **Watchlist Management**: Save and manage your favorite movies (localStorage)
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Multi-genre Support**: Explore Hollywood and Bollywood films
- **Real-time Data**: Powered by The Movie Database (TMDB) API

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wouter** for lightweight client-side routing
- **Shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **TanStack Query** for server state management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd popcorn-picks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # TMDB API
   VITE_TMDB_API_KEY=your_tmdb_api_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` (or the port Vite chooses).

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run check` - TypeScript type checking

## Project Structure

```
popcorn-picks/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   └── lib/           # Utility functions
│   └── index.html         # HTML template
├── dist/                  # Build output (generated)
├── ...                    # Config and meta files
```

## API Endpoints

- All movie data is fetched directly from [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api).
- No backend or custom API endpoints are used.

## Data Storage

- **Watchlist** and **swipe preferences** are stored in the browser's localStorage.

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```
2. **Preview the production build**
   ```bash
   npm run preview
   ```
3. Deploy the contents of the `dist/` directory to any static hosting provider (Vercel, Netlify, GitHub Pages, etc).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) for animations 