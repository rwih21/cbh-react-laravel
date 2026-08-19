import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function CompactHero({ settings }) {
  const heroImage = settings?.hero_image;
  const overlayDarkness = settings?.hero_overlay_darkness ?? 30;
  const overlayIsDark = overlayDarkness >= 40;
  const titleColor = settings?.hero_title_color || (overlayIsDark ? '#FFFFFF' : 'hsl(var(--foreground))');
  const subtitleColor = settings?.hero_subtitle_color || (overlayIsDark ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted-foreground))');
  const buttonColor = settings?.hero_button_color || 'hsl(var(--primary))';
  const buttonTextColor = settings?.hero_button_text_color || 'hsl(var(--primary-foreground))';
  const imageX = settings?.hero_image_x ?? 50;
  const imageY = settings?.hero_image_y ?? 50;
  const imageZoom = settings?.hero_image_zoom ?? 100;

  return (
    <section className="relative w-full overflow-hidden flex items-end" style={{ minHeight: '36vh' }}>
      {heroImage ? (
        <img
          src={heroImage}
          alt="Hilda Cookies"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: `${imageX}% ${imageY}%`,
            transform: `scale(${imageZoom / 100})`,
            transformOrigin: `${imageX}% ${imageY}%`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
      )}
      {overlayDarkness > 0 && (
        <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlayDarkness / 100 }} />
      )}
      <div className="relative z-10 w-full section-padding py-8 md:py-12">
        <div className="max-w-2xl">
          <p className="font-label text-xs mb-2" style={{ color: titleColor, opacity: 0.7, letterSpacing: '0.1em' }}>
            Premium Made-to-Order Bakery
          </p>
          <h1 className="font-heading font-bold mb-3 text-balance" style={{ color: titleColor, fontSize: 'clamp(1.75rem, 5vw, 3rem)', lineHeight: '1.05', letterSpacing: '-0.02em' }}>
            {(settings?.hero_headline || 'Handcrafted\nwith Love').split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="mb-5 max-w-md text-sm md:text-base" style={{ color: subtitleColor, lineHeight: '1.5' }}>
            {settings?.hero_subheadline || 'Premium made-to-order cookies, bread, and pastries — baked fresh, just for you.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full font-label hover:opacity-90 transition-opacity px-5 py-2.5 text-sm"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
            >
              {settings?.hero_cta_text || 'Order Now'} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full font-label px-5 py-2.5 text-sm border-2 transition-all hover:bg-white/10"
              style={{ color: titleColor, borderColor: titleColor, opacity: 0.9 }}
            >
              <BookOpen className="w-4 h-4" /> View Menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}