import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, PackageSearch } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { getLastOrder } from '@/lib/last-order';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const { totalItems, setIsOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    setLastOrder(getLastOrder());
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'About', path: '/#about' },
  { label: 'Contact', path: '/#contact' }];

  const trackLink = lastOrder
    ? { label: 'Continue Tracking Order', to: `/track?order=${lastOrder.orderNumber}` }
    : { label: 'Track Existing Order', to: '/track' };


  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
    scrolled ? 'bg-background/95 backdrop-blur-md shadow-warm-sm' : 'bg-background/80 backdrop-blur-sm'}`
    }>
      <nav className="section-padding flex items-center justify-between h-16">
        <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">cookiesbyhilda

        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
          <Link key={link.path} to={link.path} className="font-label text-sm text-foreground hover:text-primary transition-colors">
              {link.label}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={trackLink.to}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-foreground hover:bg-primary/10 transition-colors font-label text-xs"
            title={trackLink.label}
          >
            <PackageSearch className="w-4 h-4" />
            <span className="hidden lg:inline">{trackLink.label}</span>
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 text-foreground hover:text-primary transition-colors"
            aria-label="Open cart">
            
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 &&
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center font-label">
                {totalItems}
              </span>
            }
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 text-foreground"
            aria-label="Toggle menu">
            
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen &&
      <div className="md:hidden bg-background border-t border-border">
          <div className="section-padding py-6 flex flex-col gap-4">
            {navLinks.map((link) =>
          <Link
            key={link.path}
            to={link.path}
            className="font-heading text-xl text-foreground hover:text-primary transition-colors">
            
                {link.label}
              </Link>
          )}
          <Link to={trackLink.to} className="font-heading text-xl text-primary hover:opacity-80 transition-opacity flex items-center gap-2">
            <PackageSearch className="w-5 h-5" /> {trackLink.label}
          </Link>
          </div>
        </div>
      }
    </header>);

}