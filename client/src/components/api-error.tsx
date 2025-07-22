import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ApiError({ message = "Unable to load movies", onRetry }: ApiErrorProps) {
  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-white">Oops! Something went wrong</h2>
        <p className="text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="space-y-4">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="bg-netflix hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <div className="text-sm text-gray-400">
            <p>If this problem persists, please check:</p>
            <ul className="mt-2 space-y-1">
              <li>• Your internet connection</li>
              <li>• TMDB API configuration</li>
              <li>• Browser console for details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 