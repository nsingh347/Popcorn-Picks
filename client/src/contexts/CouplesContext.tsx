import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
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
  const [coupleId, setCoupleId] = useState<string | undefined>(undefined);

  // Load couple data on mount
  useEffect(() => {
    if (user) {
      loadCoupleData();
      fetchPendingRequests();
    }
  }, [user]);

  // Fetch coupleId from couples table for the current user and their partner
  useEffect(() => {
    const fetchCoupleId = async () => {
      if (!user || !state.partner) {
        setCoupleId(undefined);
        return;
      }
      const { data, error } = await supabase
        .from('couples')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${state.partner.id},user2_id.eq.${state.partner.id}`)
        .eq('status', 'accepted')
        .maybeSingle();
      if (data && data.id) setCoupleId(data.id);
      else setCoupleId(undefined);
    };
    fetchCoupleId();
  }, [user, state.partner]);

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
        .select('id, email, username, display_name, avatar_url, created_at')
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
      // Update the relationship request to accepted
      const { data: updatedRequests, error: updateError } = await supabase
        .from('relationship_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select();
      if (updateError) throw updateError;
      const acceptedRequest = updatedRequests && updatedRequests[0];
      if (acceptedRequest) {
        // Check if couple already exists
        const { data: existingCouple, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .or(`user1_id.eq.${acceptedRequest.sender_id},user2_id.eq.${acceptedRequest.sender_id}`)
          .or(`user1_id.eq.${acceptedRequest.receiver_id},user2_id.eq.${acceptedRequest.receiver_id}`)
          .eq('status', 'active')
          .maybeSingle();
        if (!existingCouple) {
          // Insert new couple row
          await supabase.from('couples').insert({
            user1_id: acceptedRequest.sender_id,
            user2_id: acceptedRequest.receiver_id,
            status: 'active',
            requested_by: acceptedRequest.sender_id,
            created_at: new Date().toISOString(),
          });
        }
      }
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
      // End the relationship in the database for both users
      if (state.currentRelationship && state.currentRelationship.id) {
        await supabase
          .from('relationship_requests')
          .update({ status: 'ended', updated_at: new Date().toISOString() })
          .eq('id', state.currentRelationship.id);
      }
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
    if (!user || !coupleId) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('joint_watchlists')
        .select('id')
        .eq('couple_id', coupleId)
        .eq('movie_id', movieId)
        .maybeSingle();
      if (!existing) {
        await supabase.from('joint_watchlists').insert({
          couple_id: coupleId,
          movie_id: movieId,
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add to joint watchlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromJointWatchlist = async (movieId: number) => {
    if (!user || !coupleId) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await supabase
        .from('joint_watchlists')
        .delete()
        .eq('couple_id', coupleId)
        .eq('movie_id', movieId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from joint watchlist' });
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

  const value: CouplesContextType & { coupleId?: string } = {
    ...state,
    sendRelationshipRequest,
    acceptRelationshipRequest,
    declineRelationshipRequest,
    endRelationship,
    updateCouplePreferences,
    addToJointWatchlist,
    removeFromJointWatchlist,
    addMatchedMovie,
    coupleId,
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