import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const [, setLocation] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setLocation('/swipe');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-auto"
              >
                <h2 className="text-3xl font-bold text-netflix mb-2">Welcome Back! 🍿</h2>
                <p className="text-gray-700 mb-4">Login successful. Redirecting to Swipe...</p>
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-5xl"
                  >
                    🎉
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-dark-char rounded-2xl p-8 shadow-2xl border border-gray-800"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-netflix mr-2" />
              <h1 className="text-3xl font-bold text-white">Popcorn Picks</h1>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to continue your movie journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-netflix focus:ring-netflix"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-netflix hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/auth/register">
                <span className="text-netflix hover:text-red-400 font-medium cursor-pointer transition-colors">
                  Sign up here
                </span>
              </Link>
            </p>
          </div>

          {/* Demo Login */}
          <div className="mt-6">
            <Button
              onClick={async () => {
                await login({ email: 'demo@example.com', password: 'demo123' });
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  setLocation('/swipe');
                }, 1800);
              }}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Try Demo Account
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 