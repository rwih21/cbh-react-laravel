import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Cookie, Tags,
  Image as ImageIcon, BarChart3, Settings as SettingsIcon,
  Users, LogOut, Menu as MenuIcon, X, Store,
  Quote, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Cookie },
  { label: 'Categories', path: '/admin/categories', icon: Tags },
  { label: 'Homepage', path: '/admin/homepage', icon: ImageIcon },
  { label: 'Testimonials', path: '/admin/testimonials', icon: Quote },
  { label: 'FAQ', path: '/admin/faq', icon: HelpCircle },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

const superAdminItems = [
  { label: 'Admins', path: '/admin/admins', icon: Users },
];

export default function AdminLayout() {
  const { user, isAuthenticated, isLoadingAuth, authChecked, logout, navigateToLogin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-4">Admin Access</h1>
          <p className="text-muted-foreground mb-8">Please sign in to access the Hilda Cookies dashboard.</p>
          <button
            onClick={() => navigateToLogin()}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-label hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user.role === 'admin';
  const allItems = isSuperAdmin ? [...navItems, ...superAdminItems] : navItems;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background shadow-warm-sm h-16 flex items-center justify-between px-6">
        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
          <MenuIcon className="w-6 h-6" />
        </button>
        <span className="font-heading text-xl font-bold text-foreground">Hilda Cookies</span>
        <Link to="/" className="font-label text-xs text-primary">View Site</Link>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-foreground/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <Link to="/" className="font-heading text-2xl font-bold">Hilda Cookies</Link>
            <p className="font-label text-xs opacity-60 mt-1">Admin Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-sidebar-foreground/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-label text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
            <p className="font-label text-xs opacity-60">{isSuperAdmin ? 'Super Admin' : 'Staff'}</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            <Store className="w-5 h-5" />
            <span className="font-label text-sm">View Site</span>
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-label text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64 pt-16 md:pt-0">
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}