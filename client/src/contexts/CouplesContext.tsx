import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, Relationship, CouplePreferences } from '@/types/user';
import { useAuth } from './AuthContext';

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
    }
  }, [user]);

  const loadCoupleData = async () => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: Replace with actual API calls
      // For now, load from localStorage
      const relationshipData = localStorage.getItem(`relationship_${user.id}`);
      const preferencesData = localStorage.getItem(`couple_preferences_${user.id}`);
      
      if (relationshipData) {
        const relationship = JSON.parse(relationshipData);
        dispatch({ type: 'SET_RELATIONSHIP', payload: relationship });
        
        // Mock partner data
        const mockPartner: User = {
          id: relationship.user1Id === user.id ? relationship.user2Id : relationship.user1Id,
          email: 'partner@example.com',
          username: 'partner',
          displayName: 'Partner',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dispatch({ type: 'SET_PARTNER', payload: mockPartner });
      }

      if (preferencesData) {
        const preferences = JSON.parse(preferencesData);
        dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Failed to load couple data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendRelationshipRequest = async (partnerEmail: string) => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockRequest: Relationship = {
        id: `req_${Date.now()}`,
        user1Id: user.id,
        user2Id: 'partner_id',
        status: 'pending',
        requestedBy: user.id,
        requestedAt: new Date(),
      };

      // Store in localStorage for now
      localStorage.setItem(`relationship_request_${user.id}`, JSON.stringify(mockRequest));
      
      dispatch({ type: 'SET_ERROR', payload: 'Relationship request sent!' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send request' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const acceptRelationshipRequest = async (requestId: string) => {
    if (!user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const relationship: Relationship = {
        id: requestId,
        user1Id: user.id,
        user2Id: 'partner_id',
        status: 'accepted',
        requestedBy: 'partner_id',
        requestedAt: new Date(),
        acceptedAt: new Date(),
      };

      localStorage.setItem(`relationship_${user.id}`, JSON.stringify(relationship));
      
      // Initialize couple preferences
      const preferences: CouplePreferences = {
        id: `pref_${Date.now()}`,
        coupleId: requestId,
        combinedGenres: [],
        sharedMovies: [],
        jointWatchlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem(`couple_preferences_${user.id}`, JSON.stringify(preferences));
      
      dispatch({ type: 'SET_RELATIONSHIP', payload: relationship });
      dispatch({ type: 'SET_COUPLE_PREFERENCES', payload: preferences });
      
      // Mock partner
      const mockPartner: User = {
        id: 'partner_id',
        email: 'partner@example.com',
        username: 'partner',
        displayName: 'Partner',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch({ type: 'SET_PARTNER', payload: mockPartner });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to accept request' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const declineRelationshipRequest = async (requestId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from pending requests
      const updatedRequests = state.pendingRequests.filter(req => req.id !== requestId);
      dispatch({ type: 'SET_PENDING_REQUESTS', payload: updatedRequests });
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