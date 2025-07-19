# Popcorn Picks - Movie Discovery Web App

## Overview

Popcorn Picks is a modern, swipe-based movie discovery web application built with React and Express. The app provides an intuitive, Tinder-like interface for users to discover movies through swiping gestures, featuring both Hollywood and Bollywood films. Users can build personalized watchlists and receive AI-powered recommendations based on their preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions and swipe interactions
- **State Management**: TanStack Query (React Query) for server state management and local storage for client-side preferences
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development Server**: Custom Vite integration for hot module replacement
- **API Pattern**: RESTful API with `/api` prefix for all backend routes
- **Error Handling**: Centralized error handling middleware

### Build System
- **Development**: Vite dev server with HMR and custom middleware integration
- **Production**: Vite build for frontend + esbuild for backend bundling
- **TypeScript**: Shared types between frontend and backend in `/shared` directory

## Key Components

### Database Schema (Drizzle ORM)
- **Users**: Basic user management with username/password
- **Movie Preferences**: Tracks user swipe history (like/dislike) with genre associations
- **Watchlist**: Stores user's saved movies for later viewing
- **Database**: PostgreSQL with Neon Database serverless connection

### Frontend Pages
1. **Landing Page**: Hero section with movie poster backgrounds and call-to-action
2. **Swipe Page**: Core swipe interface with movie cards and preference tracking
3. **Recommendations Page**: Personalized movie suggestions based on swipe history
4. **Watchlist Page**: User's saved movies with management features

### External API Integration
- **TMDB API**: The Movie Database for fetching movie data, posters, and metadata
- **Services Layer**: Centralized TMDB service with methods for different movie categories

### UI Components
- **Movie Cards**: Reusable components for displaying movie information
- **Swipe Cards**: Interactive cards with gesture support for swiping
- **Modal System**: Movie detail overlays with trailers and cast information
- **Navigation**: Fixed header with responsive mobile menu

## Data Flow

### User Preferences Flow
1. User swipes on movies in the Swipe page
2. Preferences are stored locally and optionally synced to database
3. Genre preferences are extracted from liked movies
4. Recommendations page uses preferences to fetch personalized suggestions

### Movie Data Flow
1. TMDB service fetches movie data from external API
2. React Query caches responses for performance
3. Components consume cached data with automatic refetching
4. Local storage persists watchlist and preferences across sessions

### Authentication Flow
- Currently using in-memory storage for development
- Database schema prepared for user authentication
- Session management placeholder in place

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library for smooth UI transitions
- **wouter**: Lightweight client-side routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for consistent iconography

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety across the application
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server with Express middleware integration
- Hot module replacement for rapid development
- TypeScript compilation with shared type checking
- Environment variables for API keys and database URLs

### Production Build
1. Frontend: Vite builds React app to `/dist/public`
2. Backend: esbuild bundles Express server to `/dist/index.js`
3. Static assets served by Express in production
4. Single deployment artifact with both frontend and backend

### Database Deployment
- Drizzle migrations in `/migrations` directory
- PostgreSQL connection via environment variable
- Database schema versioning with `drizzle-kit push`

### Environment Configuration
- TMDB API key required for movie data
- Database URL required for persistence
- Development vs production environment detection
- Replit-specific configurations for cloud deployment

### Key Architectural Decisions

**Problem**: Need for real-time movie data and rich metadata
**Solution**: TMDB API integration with client-side caching
**Rationale**: Provides comprehensive movie database with posters, ratings, and details

**Problem**: Complex swipe interactions and animations
**Solution**: Framer Motion with gesture support
**Rationale**: Provides smooth, native-feeling swipe interactions

**Problem**: State management for preferences and watchlist
**Solution**: Local storage + React Query for hybrid approach
**Rationale**: Offline capability with server sync when available

**Problem**: Full-stack TypeScript development
**Solution**: Shared types directory with Vite + Express integration
**Rationale**: Type safety across frontend and backend with single development server