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
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery as useSupabaseQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CouplesSwipe from './couples/swipe';
import { MovieCard } from '@/components/movie-card';

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
  const { currentRelationship, partner, couplePreferences, pendingRequests, sendRelationshipRequest, acceptRelationshipRequest, declineRelationshipRequest, endRelationship, coupleId } = useCouples();

  const [partnerEmail, setPartnerEmail] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [senderUsernames, setSenderUsernames] = useState<{ [id: string]: string }>({});

  // Fetch matched movies for the couple (hook at top level)
  const { data: matchedMovies = [], isLoading: loadingMatched } = useMatchedMovies(coupleId);

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

  return (
    <div className="min-h-screen bg-deep-black pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-white">Couples</span> <span className="text-netflix">Corner</span>
          </motion.h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Connect with your partner and discover movies together. Share preferences, 
            create joint watchlists, and get personalized recommendations as a couple.
          </p>
        </div>

        {/* Tabs for Couple Features */}
        <Tabs defaultValue={currentRelationship ? "swipe" : "matched"} className="mb-12">
          <TabsList className="flex justify-center mb-8">
            {currentRelationship && <TabsTrigger value="swipe">Swipe Together</TabsTrigger>}
            <TabsTrigger value="matched">Matched For You</TabsTrigger>
            <TabsTrigger value="recommendations">Couple Recommendations</TabsTrigger>
            <TabsTrigger value="watchlist">Joint Watchlist</TabsTrigger>
          </TabsList>
          {currentRelationship && (
            <TabsContent value="swipe">
              <CouplesSwipe />
            </TabsContent>
          )}
          <TabsContent value="matched">
            {/* Show matched movies for the couple */}
            {currentRelationship ? (
              loadingMatched ? (
                <div className="text-center text-white">Loading matched movies...</div>
              ) : !matchedMovies.length ? (
                <div className="text-center text-white">No matched movies yet. Swipe right together to match!</div>
              ) : (
                <>
                  <div className="text-center text-gray-400 mb-2">Debug: {JSON.stringify(matchedMovies.map(m => m.id))}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {matchedMovies.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                </>
              )
            ) : (
              <div className="text-center text-white">Matched movies will appear here when both of you swipe right on the same movie!</div>
            )}
          </TabsContent>
          <TabsContent value="recommendations">
            {/* TODO: Show couple recommendations */}
            <div className="text-center text-white">Personalized movie recommendations for you and your partner.</div>
          </TabsContent>
          <TabsContent value="watchlist">
            {/* TODO: Show joint watchlist */}
            <div className="text-center text-white">Your shared watchlist will appear here.</div>
          </TabsContent>
        </Tabs>

        {/* User Info */}
        <motion.div
          className="bg-dark-char rounded-2xl p-6 mb-8 border border-gray-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-netflix rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{user.displayName}</h3>
                <p className="text-gray-400">@{user.username}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Relationship Status */}
        {currentRelationship ? (
          <motion.div
            className="bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-2xl p-8 mb-8 border border-pink-500/20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-pink-500 mr-2" />
                <h2 className="text-2xl font-bold text-white">In a Relationship</h2>
              </div>
              
              {partner && (
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {partner.displayName?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white">{partner.displayName}</h3>
                    <p className="text-gray-400">Your Partner</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-char rounded-lg p-4 border border-gray-800">
                  <div className="text-2xl font-bold text-pink-500 mb-1">
                    {couplePreferences?.combinedGenres.length || 0}
                  </div>
                  <div className="text-sm text-gray-400">Shared Genres</div>
                </div>
                <div className="bg-dark-char rounded-lg p-4 border border-gray-800">
                  <div className="text-2xl font-bold text-pink-500 mb-1">
                    {couplePreferences?.sharedMovies.length || 0}
                  </div>
                  <div className="text-sm text-gray-400">Liked Together</div>
                </div>
                <div className="bg-dark-char rounded-lg p-4 border border-gray-800">
                  <div className="text-2xl font-bold text-pink-500 mb-1">
                    {couplePreferences?.jointWatchlist.length || 0}
                  </div>
                  <div className="text-sm text-gray-400">Watchlist</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Link href="/couples/recommendations">
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                    <Star className="w-4 h-4 mr-2" />
                    Couple Recommendations
                  </Button>
                </Link>
                <Link href="/couples/watchlist">
                  <Button variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white">
                    <Heart className="w-4 h-4 mr-2" />
                    Joint Watchlist
                  </Button>
                </Link>
                <Button 
                  onClick={endRelationship}
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  End Relationship
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="bg-dark-char rounded-2xl p-8 mb-8 border border-gray-800"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400 mr-2" />
                <h2 className="text-2xl font-bold text-white">Single</h2>
              </div>
              <p className="text-gray-400 mb-6">
                Connect with your partner to unlock couple features and joint recommendations.
              </p>

              <div className="max-w-md mx-auto">
                <div className="flex space-x-2 mb-4">
                  <Input
                    type="email"
                    placeholder="Partner's email address"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                  <Button 
                    onClick={handleSendRequest}
                    disabled={!partnerEmail.trim() || isLoading}
                    className="bg-netflix hover:bg-red-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <motion.div
            className="bg-dark-char rounded-2xl p-6 mb-8 border border-gray-800"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Pending Requests</h3>
            <div className="space-y-4">
              {pendingRequests
                .filter(request => request.status === 'pending')
                .map((request) => {
                  const isReceiver = user.id === request.receiver_id;
                  const isSender = user.id === request.sender_id;
                  return (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">
                          {isReceiver ? 'Request from your partner' : 'Request you sent'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {isReceiver
                            ? `From: @${senderUsernames[request.sender_id] || request.sender_id}`
                            : `To: @${senderUsernames[request.receiver_id] || request.receiver_id}`}
                          <br/>
                          Requested on {new Date(request.created_at || request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {isReceiver && (
                          <>
                            <Button
                              onClick={() => { acceptRelationshipRequest(request.id); window.sessionStorage.setItem('justAcceptedCouple', 'true'); }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => declineRelationshipRequest(request.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        {isSender && (
                          <span className="text-gray-400 text-xs">Waiting for response</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Features Preview */}
        <motion.div
          className="grid md:grid-cols-2 gap-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-dark-char rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center mb-4">
              <Star className="w-6 h-6 text-accent-gold mr-2" />
              <h3 className="text-xl font-semibold text-white">Couple Recommendations</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Get personalized movie recommendations based on both your preferences combined.
            </p>
            <Link href="/couples/recommendations">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                View Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="bg-dark-char rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center mb-4">
              <Heart className="w-6 h-6 text-pink-500 mr-2" />
              <h3 className="text-xl font-semibold text-white">Joint Watchlist</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Create and manage a shared watchlist with your partner.
            </p>
            <Link href="/couples/watchlist">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Manage Watchlist
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {currentRelationship && (
          <>
            {/* Date Night Section */}
            <motion.div
              className="bg-dark-char rounded-2xl p-8 mb-8 border border-pink-500/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <h2 className="text-2xl font-bold text-pink-500 mb-6 text-center">Date Night Matches</h2>
              {loadingMatched ? (
                <div className="text-center text-white py-8">Loading matched movies...</div>
              ) : matchedMovies && matchedMovies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {matchedMovies.map((movie: any) => {
                    const { data: providers, isLoading: loadingProviders } = useQuery({
                      queryKey: ['watch-providers', movie.id],
                      queryFn: () => tmdbService.getWatchProviders(movie.id),
                      enabled: !!movie.id,
                    });
                    return (
                      <div key={movie.id} className="bg-gray-900 rounded-xl p-4 flex flex-col items-center">
                        <img src={tmdbService.getImageUrl(movie.poster_path, 'w185')} alt={movie.title} className="w-28 h-40 object-cover rounded mb-2" />
                        <h3 className="text-lg font-semibold text-white text-center mb-2">{movie.title}</h3>
                        {/* Streaming Platforms */}
                        <div className="mb-2">
                          <span className="text-xs text-gray-400">Available On:</span>
                          {loadingProviders ? (
                            <span className="text-xs text-gray-400 ml-2">Loading...</span>
                          ) : providers && providers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {providers.map((provider: string) => (
                                <Badge key={provider} className="bg-blue-700/80 text-white border-blue-400/40 text-xs">{provider}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 ml-2">Not available for streaming</span>
                          )}
                        </div>
                        <Button className="bg-pink-500 text-white w-full mb-2" onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}`, '_blank')}>Watch Together</Button>
                        <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => removeMatchedMovie(movie.id)}>
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">No matched movies yet. Start swiping to find your next date night pick!</div>
              )}
            </motion.div>
          </>
        )}
      </div>
      <ConfettiPopup show={showConfetti} onClose={() => setShowConfetti(false)} />
    </div>
  );
} 