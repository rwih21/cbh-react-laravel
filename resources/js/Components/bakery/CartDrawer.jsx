import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/lib/cart-context';
import AnnouncementBar from './AnnouncementBar';
import Navigation from './Navigation';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function BakeryLayout() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Navigation />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}