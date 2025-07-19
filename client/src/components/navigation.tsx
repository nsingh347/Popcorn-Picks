import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Play } from 'lucide-react';

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/swipe', label: 'Swipe' },
    { href: '/recommendations', label: 'Recommendations' },
    { href: '/watchlist', label: 'Watchlist' }
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <a
            className={`font-medium transition-colors hover:text-accent-gold ${
              location === item.href ? 'text-accent-gold' : 'text-white'
            }`}
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </a>
        </Link>
      ))}
      <Link href="/swipe">
        <Button 
          className="bg-netflix hover:bg-red-700 text-white font-medium transition-all duration-300 hover:scale-105"
          onClick={() => setIsOpen(false)}
        >
          Start Swiping
        </Button>
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <Play className="text-netflix text-2xl" />
              <span className="font-bold text-2xl">Popcorn Picks</span>
            </a>
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
