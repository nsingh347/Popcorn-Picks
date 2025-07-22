import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, Relationship, CouplePreferences } from '@/types/user';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface CouplesState {
  currentRelationship: Relationship | null;
  partner: User | null;
  couplePreferences: CouplePreferences | null;
  pendingRequests: Relationship[];
  isLoading: boolean;
  error: string | null;
}

interface CouplesContextType extends CouplesState {
  sendRelationshipRequest: (partnerEmail: string) => Promise<void>;
  acceptRelationshipRequest: (requestId: string) => Promise<void>;
  declineRelationshipRequest: (requestId: string) => Promise<void>;
  endRelationship: () => Promise<void>;
  updateCouplePreferences: (preferences: Partial<CouplePreferences>) => Promise<void>;
  addToJointWatchlist: (movieId: number) => Promise<void>;
  removeFromJointWatchlist: (movieId: number) => Promise<void>;
  addMatchedMovie: (movieId: number) => Promise<void>;
}

const CouplesContext = createContext<CouplesContextType | undefined>(undefined);

type CouplesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RELATIONSHIP'; payload: Relationship | null }
  | { type: 'SET_PARTNER'; payload: User | null }
  | { type: 'SET_COUPLE_PREFERENCES'; payload: CouplePreferences | null }
  | { type: 'SET_PENDING_REQUESTS'; payload: Relationship[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_TO_WATCHLIST'; payload: number }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: number };

const couplesReducer = (state: CouplesState, action: CouplesAction): CouplesState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_RELATIONSHIP':
      return { ...state, currentRelationship: action.payload };
    case 'SET_PARTNER':
      return { ...state, partner: action.payload };
    case 'SET_COUPLE_PREFERENCES':
      return { ...state, couplePreferences: action.payload };
    case 'SET_PENDING_REQUESTS':
      return { ...state, pendingRequests: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_TO_WATCHLIST':
      if (state.couplePreferences) {
        return {
          ...state,
          couplePreferences: {
            ...state.couplePreferences,
            jointWatchlist: [...state.couplePreferences.jointWatchlist, action.payload]
          }
        };
      }
      return state;
    case 'REMOVE_FROM_WATCHLIST':
      if (state.couplePreferences) {
        return {
          ...state,
          couplePreferences: {
            ...state.couplePreferences,
            jointWatchlist: state.couplePreferences.jointWatchlist.filter(id => id !== action.payload)
          }
        };
      }
      return state;
    default:
      return state;
  }
};

const initialState: CouplesState = {
  currentRelationship: null,
  partner: null,
  couplePreferences: null,
  pendingRequests: [],
  isLoading: false,
  error: null,
};

export function CouplesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(couplesReducer, initialState);
  const { user } = useAuth();

  // Load couple data on mount
  useEffect(() => {
    if (user) {
      loadCoupleData();
      fetchPendingRequests();
    }
  }, [user]);

  // Fetch pending relationship requests for the current user
  const fetchPendingRequests = async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('relationship_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (error) throw error;
      // Map to Relationship type if needed
      dispatch({ type: 'SET_PENDING_REQUESTS', payload: data || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch requests' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load couple data (accepted relationship)
  const loadCoupleData = async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Find accepted relationship
      const { data, error } = await supabase
        .from('relationship_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
      if (data) {
        dispatch({ type: 'SET_RELATIONSHIP', payload: data });
        // Optionally fetch partner info here
      } else {
        dispatch({ type: 'SET_RELATIONSHIP', payload: null });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load couple data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Send a relationship request
  const sendRelationshipRequest = async (partnerEmail: string) => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      // Find partner by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', partnerEmail)
        .single();
      if (userError || !users) throw new Error('Partner not found');
      const partnerId = users.id;
      // Insert relationship request
      const { error } = await supabase
        .from('relationship_requests')
        .insert({ sender_id: user.id, receiver_id: partnerId, status: 'pending' });
      if (error) throw error;
      dispatch({ type: 'SET_ERROR', payload: 'Relationship request sent!' });
      fetchPendingRequests();
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to send request' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Accept a relationship request
  const acceptRelationshipRequest = async (requestId: string) => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('relationship_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
      fetchPendingRequests();
      loadCoupleData();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to accept request' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Decline a relationship request
  const declineRelationshipRequest = async (requestId: string) => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('relationship_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
      fetchPendingRequests();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to decline request' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const endRelationship = async () => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.removeItem(`relationship_${user.id}`);
      localStorage.removeItem(`couple_preferences_${user.id}`);
      
      dispatch({ type: 'SET_RELATIONSHIP', payload: null });
      dispatch({ type: 'SET_PARTNER', payload: null });
      dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to end relationship' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCouplePreferences = async (preferences: Partial<CouplePreferences>) => {
    if (!user || !state.couplePreferences) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedPreferences = { ...state.couplePreferences, ...preferences, updatedAt: new Date() };
      localStorage.setItem(`couple_preferences_${user.id}`, JSON.stringify(updatedPreferences));
      dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToJointWatchlist = async (movieId: number) => {
    if (!user || !state.couplePreferences) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedPreferences = {
        ...state.couplePreferences,
        jointWatchlist: [...state.couplePreferences.jointWatchlist, movieId],
        updatedAt: new Date()
      };
      localStorage.setItem(`couple_preferences_${user.id}`, JSON.stringify(updatedPreferences));
      dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add to watchlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromJointWatchlist = async (movieId: number) => {
    if (!user || !state.couplePreferences) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedPreferences = {
        ...state.couplePreferences,
        jointWatchlist: state.couplePreferences.jointWatchlist.filter(id => id !== movieId),
        updatedAt: new Date()
      };
      localStorage.setItem(`couple_preferences_${user.id}`, JSON.stringify(updatedPreferences));
      dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from watchlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addMatchedMovie = async (movieId: number) => {
    if (!user || !state.couplePreferences) return;
    // Avoid duplicates
    if (state.couplePreferences.sharedMovies.includes(movieId)) return;
    const updatedPreferences = {
      ...state.couplePreferences,
      sharedMovies: [...state.couplePreferences.sharedMovies, movieId],
      updatedAt: new Date()
    };
    localStorage.setItem(`couple_preferences_${user.id}`, JSON.stringify(updatedPreferences));
    dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: updatedPreferences });
  };

  const value: CouplesContextType = {
    ...state,
    sendRelationshipRequest,
    acceptRelationshipRequest,
    declineRelationshipRequest,
    endRelationship,
    updateCouplePreferences,
    addToJointWatchlist,
    removeFromJointWatchlist,
    addMatchedMovie,
  };

  return (
    <CouplesContext.Provider value={value}>
      {children}
    </CouplesContext.Provider>
  );
}

export function useCouples() {
  const context = useContext(CouplesContext);
  if (context === undefined) {
    throw new Error('useCouples must be used within a CouplesProvider');
  }
  return context;
} 