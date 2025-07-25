import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types/user';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        error: null 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false,
        error: null 
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function mapSupabaseUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.raw_user_meta_data?.username || '',
    displayName: user.user_metadata?.displayName || user.raw_user_meta_data?.displayName || '',
    avatar: user.user_metadata?.avatar || user.raw_user_meta_data?.avatar || '',
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    updatedAt: new Date(),
    emailConfirmedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // No localStorage: rely only on Supabase session
        // Remove all getItem/setItem for auth_token/user_data
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('No user returned');
      const mappedUser = mapSupabaseUser(user);
      // No localStorage
      dispatch({ type: 'SET_USER', payload: mappedUser });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Login failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Client-side validation
    if (!data.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid email address.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    if (!data.password || data.password.length < 6) {
      dispatch({ type: 'SET_ERROR', payload: 'Password must be at least 6 characters.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    if (!data.username || data.username.length < 3) {
      dispatch({ type: 'SET_ERROR', payload: 'Username must be at least 3 characters.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Pre-check for existing email
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();
    if (existingEmail) {
      dispatch({ type: 'SET_ERROR', payload: 'Email already in use.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Pre-check for existing username
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .single();
    if (existingUsername) {
      dispatch({ type: 'SET_ERROR', payload: 'Username already in use.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            displayName: data.displayName,
          },
        },
      });
      if (error) {
        if (error.message && error.message.includes('duplicate key value')) {
          dispatch({ type: 'SET_ERROR', payload: 'Email or username already in use.' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: error.message || 'Registration failed' });
        }
        return;
      }
      const user = signUpData.user;
      if (!user) throw new Error('No user returned');
      const mappedUser = mapSupabaseUser(user);
      // No localStorage
      dispatch({ type: 'SET_USER', payload: mappedUser });
    } catch (error: any) {
      if (error.message && error.message.includes('duplicate key value')) {
        dispatch({ type: 'SET_ERROR', payload: 'Email or username already in use.' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Registration failed' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    // No localStorage
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    // No localStorage
    dispatch({ type: 'SET_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 