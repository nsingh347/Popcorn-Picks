import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Play, Users, LogIn, LogOut, Heart, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCouples } from '@/contexts/CouplesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { currentRelationship } = useCouples();
  const { theme, toggleTheme } = useTheme();

  // Load avatar from personalize_settings
  let avatar = '';
  try {
    const saved = localStorage.getItem('personalize_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      avatar = parsed.avatar || '';
    }
  } catch {}

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/discover', label: 'Discover' },
    { href: '/swipe', label: 'Swipe' },
    { href: '/recommendations', label: 'Recommendations' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/couples', label: 'Couples', icon: currentRelationship ? Heart : Users }
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          className={`font-medium transition-colors hover:text-accent-gold flex items-center ${
              location === item.href ? 'text-accent-gold' : 'text-white'
            }`}
            onClick={() => setIsOpen(false)}
          >
          {item.icon && <item.icon className="w-4 h-4 mr-1" />}
            {item.label}
        </Link>
      ))}
      
      {isAuthenticated ? (
        <div className="flex items-center space-x-2">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-accent-gold" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg text-white">
              {user?.displayName?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          )}
          <span className="text-gray-300 text-sm">
            Hi, {user?.displayName || user?.username || user?.email || 'User'}
          </span>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-accent-gold" title="Toggle theme">
            {theme === 'dark' ? <span>🌙</span> : <span>☀️</span>}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center">
                <UserIcon className="w-4 h-4 mr-1" /> Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/auth/login">
                  <span className="flex items-center"><LogIn className="w-4 h-4 mr-2" /> Login</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/auth/register">
                  <span className="flex items-center text-netflix font-semibold"><UserIcon className="w-4 h-4 mr-2" /> Sign Up</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      <Link href="/swipe">
        <Button 
          className="bg-netflix hover:bg-red-700 text-white font-medium transition-all duration-300 hover:scale-105"
          onClick={() => setIsOpen(false)}
        >
          Start Swiping
        </Button>
      </Link>
        </div>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
              <Play className="text-netflix text-2xl" />
              <span className="font-bold text-2xl">Popcorn Picks</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavContent />
          </div>
          
          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-deep-black text-white border-gray-800">
              <div className="flex flex-col space-y-6 mt-8">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
