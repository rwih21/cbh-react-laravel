import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';

export default function Footer() {
  const { data: settings } = useSiteSettings();

  const exploreLinks = [
    { label: 'Home', path: '/' },
    { label: 'Full Menu', path: '/menu' },
    { label: 'Track Order', path: '/track' },
  ];

  const visitLinks = [
    { label: 'About Us', path: '/#about' },
    { label: 'Contact', path: '/#contact' },
    { label: 'Admin Login', path: '/admin' },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="section-padding py-16 md:py-24">
        {/* Oversized centered logo */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-5xl md:text-7xl font-bold tracking-tight">Hilda Cookies</h2>
          <p className="font-label text-sm mt-3 opacity-60">Handcrafted with Love</p>
        </div>

        {/* 3-column links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-16">
          {/* Explore */}
          <div>
            <h3 className="font-label text-sm mb-4 opacity-50">Explore</h3>
            <ul className="space-y-3">
              {exploreLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="font-heading text-lg hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit */}
          <div>
            <h3 className="font-label text-sm mb-4 opacity-50">Visit</h3>
            <ul className="space-y-3">
              {visitLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="font-heading text-lg hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-label text-sm mb-4 opacity-50">Connect</h3>
            <div className="flex gap-3 mb-6">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full border border-background/20 hover:border-primary hover:text-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsapp_url && (
                <a href={settings.whatsapp_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full border border-background/20 hover:border-primary hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full border border-background/20 hover:border-primary hover:text-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
            {settings?.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-2">
                <Phone className="w-4 h-4" /> {settings.contact_phone}
              </a>
            )}
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity mb-2">
                <Mail className="w-4 h-4" /> {settings.contact_email}
              </a>
            )}
            {settings?.contact_address && (
              <p className="flex items-start gap-2 text-sm opacity-70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> {settings.contact_address}
              </p>
            )}
          </div>
        </div>

        {/* Business hours */}
        {settings?.business_hours && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm opacity-60">
              <Clock className="w-4 h-4" />
              <span className="whitespace-pre-line">{settings.business_hours}</span>
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-background/10">
          <p className="font-label text-xs opacity-40">
            © {new Date().getFullYear()} Hilda Cookies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}