import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CouplesProvider } from "@/contexts/CouplesContext";
import { Navigation } from "@/components/navigation";
import Landing from "@/pages/landing";
import Swipe from "@/pages/swipe";
import Recommendations from "@/pages/recommendations";
import Watchlist from "@/pages/watchlist";
import Couples from "@/pages/couples";
import CoupleRecommendations from "@/pages/couples/recommendations";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NotFound from "@/pages/not-found";
import Personalize from '@/pages/personalize';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Redirect } from 'wouter';
import Discover from './pages/discover';
import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: '#000', 
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Component Error</h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              {this.state.error?.message || 'An error occurred in this component'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ 
                background: '#e50914', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Redirect to="/auth/register" />;
  }
  return <Component />;
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/discover" component={Discover} />
        <Route path="/swipe" component={() => <ProtectedRoute component={Swipe} />} />
        <Route path="/recommendations" component={() => <ProtectedRoute component={Recommendations} />} />
        <Route path="/watchlist" component={() => <ProtectedRoute component={Watchlist} />} />
        <Route path="/couples" component={Couples} />
        <Route path="/couples/recommendations" component={CoupleRecommendations} />
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        <Route path="/personalize" component={Personalize} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider>
            <ErrorBoundary>
              <TooltipProvider>
                <ErrorBoundary>
                  <AuthProvider>
                    <ErrorBoundary>
                      <CouplesProvider>
                        <ErrorBoundary>
                          <Navigation />
                        </ErrorBoundary>
                        <ErrorBoundary>
                          <Router />
                        </ErrorBoundary>
                        <ErrorBoundary>
                          <Toaster />
                        </ErrorBoundary>
                      </CouplesProvider>
                    </ErrorBoundary>
                  </AuthProvider>
                </ErrorBoundary>
              </TooltipProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
