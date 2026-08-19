import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HEIGHT_VALUES = {
  small: '50vh',
  medium: '70vh',
  large: '90vh',
  full_screen: '100vh',
};

const TEXT_ALIGN = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export function HeroRenderer({ settings, previewWidth, previewHeight, cardMode }) {
  const isPreview = !!previewWidth;
  const isCard = !!cardMode;
  const heroHeadline = (settings?.hero_headline || 'Handcrafted\nwith Love').split('\n');
  const heroImage = settings?.hero_image;

  const heightKey = settings?.hero_height || 'large';
  const imageX = settings?.hero_image_x ?? 50;
  const imageY = settings?.hero_image_y ?? 50;
  const imageZoom = settings?.hero_image_zoom ?? 100;
  const textPosition = settings?.hero_text_position || 'left';
  const overlayDarkness = settings?.hero_overlay_darkness ?? 30;

  const titleSize = settings?.hero_title_size ?? 1;
  const subtitleSize = settings?.hero_subtitle_size ?? 1;
  const buttonTextSize = settings?.hero_button_text_size ?? 1;

  const overlayIsDark = overlayDarkness >= 40;
  const titleColor = settings?.hero_title_color || (overlayIsDark ? '#FFFFFF' : 'hsl(var(--foreground))');
  const subtitleColor = settings?.hero_subtitle_color || (overlayIsDark ? 'rgba(255,255,255,0.8)' : 'hsl(var(--muted-foreground))');
  const buttonColor = settings?.hero_button_color || 'hsl(var(--primary))';
  const buttonTextColor = settings?.hero_button_text_color || 'hsl(var(--primary-foreground))';

  const textAlign = TEXT_ALIGN[textPosition] || TEXT_ALIGN.left;

  const containerStyle = isPreview
    ? { width: `${previewWidth}px`, height: `${previewHeight}px` }
    : isCard
    ? { width: '100%', height: '100%' }
    : { minHeight: HEIGHT_VALUES[heightKey] };

  // Font sizes
  const titleFontSize = isCard
    ? `${1.4 * titleSize}rem`
    : isPreview
    ? `${Math.max(20, previewWidth * 0.065) * titleSize}px`
    : `clamp(${2.5 * titleSize}rem, ${6 * titleSize}vw, ${5 * titleSize}rem)`;

  const subtitleFontSize = isCard
    ? `${0.7 * subtitleSize}rem`
    : isPreview
    ? `${Math.max(13, previewWidth * 0.014) * subtitleSize}px`
    : `${1.125 * subtitleSize}rem`;

  const labelFontSize = isCard
    ? `0.55rem`
    : isPreview
    ? `${Math.max(9, previewWidth * 0.011)}px`
    : undefined;

  const ctaFontSize = isCard
    ? `${0.6 * buttonTextSize}rem`
    : isPreview
    ? `${Math.max(10, previewWidth * 0.011) * buttonTextSize}px`
    : `${0.875 * buttonTextSize}rem`;

  const padX = isPreview ? Math.max(16, previewWidth * 0.035) : null;
  const ctaPadX = isPreview ? Math.max(12, previewWidth * 0.025) : null;
  const ctaPadY = isPreview ? Math.max(8, previewWidth * 0.012) : null;

  const CTA = isPreview || isCard ? 'span' : Link;
  const ctaProps = isPreview || isCard ? {} : { to: '/menu' };

  const noImageGradient = settings?.homepage_background_color
    ? `linear-gradient(135deg, ${settings.homepage_background_color}, ${settings?.homepage_section_background || settings.homepage_background_color})`
    : undefined;

  return (
    <section
      className="relative w-full overflow-hidden flex items-center"
      style={containerStyle}
    >
      {/* Image layer */}
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
        <div
          className="absolute inset-0"
          style={{ background: noImageGradient || 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--background)))' }}
        />
      )}

      {/* Overlay */}
      {overlayDarkness > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayDarkness / 100 }}
        />
      )}

      {/* Decorative emoji */}
      {settings?.decorative_emoji && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: isCard ? '0.5rem' : '1.5rem',
            right: isCard ? '0.5rem' : '1.5rem',
            fontSize: isCard ? '2rem' : isPreview ? `${Math.max(24, previewWidth * 0.04)}px` : '4rem',
            opacity: 0.15,
          }}
        >
          {settings.decorative_emoji}
        </div>
      )}

      {/* Text content */}
      <div
        className={`relative z-10 w-full flex flex-col ${textAlign} justify-center`}
        style={isPreview ? { paddingLeft: padX, paddingRight: padX } : isCard ? { padding: '0 1rem' } : undefined}
      >
        <div className={isPreview || isCard ? '' : 'section-padding w-full'}>
          <div className={`max-w-2xl ${textPosition === 'center' ? 'mx-auto' : ''}`}>
            <p
              className="font-label mb-4"
              style={{
                color: titleColor,
                fontSize: labelFontSize,
                letterSpacing: '0.1em',
                opacity: 0.7,
              }}
            >
              Premium Made-to-Order Bakery
            </p>
            <h1
              className="font-heading font-bold mb-6 text-balance"
              style={{
                color: titleColor,
                fontSize: titleFontSize,
                lineHeight: '1.05',
                letterSpacing: '-0.02em',
              }}
            >
              {heroHeadline.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p
              className="mb-8 max-w-md"
              style={{
                color: subtitleColor,
                fontSize: subtitleFontSize,
                lineHeight: '1.5',
              }}
            >
              {settings?.hero_subheadline || 'Premium made-to-order cookies, bread, and pastries — baked fresh, just for you.'}
            </p>
            <CTA
              {...ctaProps}
              className="inline-flex items-center gap-2 rounded-full font-label hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
                paddingLeft: isCard ? '0.6rem' : isPreview ? `${ctaPadX * buttonTextSize}px` : '2rem',
                paddingRight: isCard ? '0.6rem' : isPreview ? `${ctaPadX * buttonTextSize}px` : '2rem',
                paddingTop: isCard ? '0.3rem' : isPreview ? `${ctaPadY * buttonTextSize}px` : '0.875rem',
                paddingBottom: isCard ? '0.3rem' : isPreview ? `${ctaPadY * buttonTextSize}px` : '0.875rem',
                fontSize: ctaFontSize,
              }}
            >
              {settings?.hero_cta_text || 'Order Now'}
              <ArrowRight className="w-4 h-4" />
            </CTA>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Hero({ settings }) {
  return <HeroRenderer settings={settings} />;
}