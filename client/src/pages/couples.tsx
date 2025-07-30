import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Heart, Users, UserPlus, UserCheck, UserX, LogOut, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCouples } from '@/contexts/CouplesContext';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdb';
import { supabase } from '@/lib/supabaseClient';
import { useQuery as useSupabaseQuery } from '@tanstack/react-query';
import CouplesSwipe from './couples/swipe';
import { MovieCard } from '@/components/movie-card';
import useRealtimeMatchedMovies from '@/hooks/useRealtimeMatchedMovies';
import useRealtimeJointWatchlist from '@/hooks/useRealtimeJointWatchlist';
import useCoupleRecommendations from '@/hooks/useCoupleRecommendations';

function useMatchedMovies(coupleId: string | undefined) {
  return useSupabaseQuery({
    queryKey: ['matched-movies', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('matched_movies')
        .select('movie_id')
        .eq('couple_id', coupleId);
      console.log('Matched movies from DB:', data, error);
      if (error) return [];
      const movieIds = data.map((m: any) => m.movie_id);
      console.log('Fetching details for movie IDs:', movieIds);
      const details = await Promise.all(movieIds.map((id: number) => tmdbService.getMovieDetails(id)));
      console.log('Fetched movie details:', details);
      return details;
    },
    enabled: !!coupleId,
  });
}

function ConfettiPopup({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center relative">
        <div className="absolute inset-0 pointer-events-none animate-confetti" />
        <h2 className="text-3xl font-bold text-pink-500 mb-4">Congratulations! 🎉</h2>
        <p className="text-lg text-gray-700 mb-4">You and your partner are now officially a couple on Popcorn Picks!<br/>Let the movie magic begin! 🍿💖</p>
        <Button onClick={onClose} className="bg-pink-500 text-white px-6 py-2 rounded-full font-semibold">Yay!</Button>
      </div>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
        .animate-confetti::before, .animate-confetti::after {
          content: '';
          position: absolute;
          left: 50%;
          width: 200vw;
          height: 100vh;
          pointer-events: none;
          background-image: repeating-linear-gradient(90deg, #f87171 0 10px, #fbbf24 10px 20px, #34d399 20px 30px, #60a5fa 30px 40px, #a78bfa 40px 50px, transparent 50px 60px);
          opacity: 0.5;
          animation: confetti-fall 2.5s linear infinite;
        }
        .animate-confetti::after {
          animation-delay: 1.25s;
        }
      `}</style>
    </div>
  );
}

export default function Couples() {
  const { user, logout } = useAuth();
  // Use any for pendingRequests to match DB fields
  const { currentRelationship, partner, couplePreferences, pendingRequests, sendRelationshipRequest, acceptRelationshipRequest, declineRelationshipRequest, endRelationship, coupleId, addToJointWatchlist, removeFromJointWatchlist } = useCouples() as any;

  const [partnerEmail, setPartnerEmail] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [senderUsernames, setSenderUsernames] = useState<{ [id: string]: string }>({});

  // Fetch matched movies for the couple (hook at top level)
  const matchedMovies = useRealtimeMatchedMovies(coupleId);
  const coupleRecommendations = useCoupleRecommendations(coupleId);
  const jointWatchlist = useRealtimeJointWatchlist(coupleId);

  // Fetch usernames for all sender_ids in pendingRequests
  useEffect(() => {
    const fetchUsernames = async () => {
      const ids = pendingRequests.map(r => r.sender_id).filter(Boolean);
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length === 0) return;
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .in('id', uniqueIds);
      if (data) {
        const map: { [id: string]: string } = {};
        data.forEach((u: any) => { map[u.id] = u.username; });
        setSenderUsernames(map);
      }
    };
    fetchUsernames();
  }, [pendingRequests]);

  const handleSendRequest = async () => {
    if (partnerEmail.trim()) {
      await sendRelationshipRequest(partnerEmail.trim());
      setPartnerEmail('');
    }
  };

  useEffect(() => {
    if (currentRelationship && window.sessionStorage.getItem('justAcceptedCouple') === 'true') {
      setShowConfetti(true);
      window.sessionStorage.removeItem('justAcceptedCouple');
    }
  }, [currentRelationship]);

  if (!user) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please log in</h2>
          <Link href="/auth/login">
            <Button className="bg-netflix hover:bg-red-700">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fallbacks for isLoading and error
  const isLoading = false;
  const error = null;

  // Hide all couple features for now
  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center">
            <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Couple features are currently disabled.</h2>
        <p className="text-gray-400">This app is now a swipe-based movie recommendation app for individuals.</p>
      </div>
    </div>
  );
} 