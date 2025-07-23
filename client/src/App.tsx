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

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Redirect to="/auth/register" />;
  }
  return <Component />;
}

function Router() {
  return (
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
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
          <AuthProvider>
            <CouplesProvider>
          <Navigation />
          <Router />
          <Toaster />
            </CouplesProvider>
          </AuthProvider>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
