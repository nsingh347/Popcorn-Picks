export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  emailConfirmedAt: Date | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  favoriteGenres: number[];
  relationshipStatus: 'single' | 'in_relationship' | 'married';
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedBy: string;
  requestedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export interface CouplePreferences {
  id: string;
  coupleId: string;
  combinedGenres: number[];
  sharedMovies: number[];
  jointWatchlist: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName: string;
} 