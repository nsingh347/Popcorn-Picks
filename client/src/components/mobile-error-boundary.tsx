import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone } from 'lucide-react';

interface MobileErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface MobileErrorBoundaryProps {
  children: React.ReactNode;
}

export class MobileErrorBoundary extends React.Component<MobileErrorBoundaryProps, MobileErrorBoundaryState> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MobileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-white mb-4">Mobile Compatibility Issue</h2>
            <p className="text-gray-400 mb-6">
              We encountered an issue with your device. This might be due to:
            </p>
            <ul className="text-gray-400 text-sm mb-6 text-left space-y-2">
              <li>• Outdated browser version</li>
              <li>• Limited device memory</li>
              <li>• Network connectivity issues</li>
              <li>• Browser compatibility</li>
            </ul>
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="bg-netflix text-white w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="border-gray-600 text-gray-400 w-full"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 