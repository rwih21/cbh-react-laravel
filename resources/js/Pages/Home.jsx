import React from 'react';
import { Heart, Sparkles, Clock, Phone, Mail, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';
import CompactHero from '@/components/bakery/CompactHero';
import PreorderBanner from '@/components/bakery/PreorderBanner';
import HomepageMenuSections from '@/components/bakery/HomepageMenuSections';
import AboutGallery from '@/components/bakery/AboutGallery';
import TestimonialsSection from '@/components/bakery/TestimonialsSection';
import FAQSection from '@/components/bakery/FAQSection';

export default function Home() {
  const { data: settings } = useSiteSettings();

  return (
    <div style={{ backgroundColor: settings?.homepage_background_color || undefined }}>
      {/* Compact Hero */}
      <CompactHero settings={settings} />

      {/* Preorder Information */}
      <PreorderBanner />

      {/* Homepage Menu Sections (managed from Homepage Editor) */}
      <HomepageMenuSections />

      {/* About */}
      <section id="about" className="py-10 md:py-16 scroll-mt-24">
        <div className="section-padding">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary shadow-warm-md">
              <AboutGallery
                images={settings?.about_images?.length > 0 ? settings.about_images : (settings?.about_image ? [settings.about_image] : [])}
                alt="About Hilda Cookies"
              />
            </div>
            <div>
              <p className="font-label text-xs text-primary mb-2">Our Story</p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold mb-4">{settings?.about_title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">{settings?.about_text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 md:py-16 bg-secondary/30" style={{ backgroundColor: settings?.homepage_section_background || undefined }}>
        <div className="section-padding">
          <div className="text-center mb-8">
            <p className="font-label text-xs text-primary mb-2">The Hilda Difference</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold">{settings?.why_choose_us_title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Heart, title: 'Made to Order', desc: 'Every product is baked fresh only after you order. No preservatives, no shortcuts.' },
              { icon: Sparkles, title: 'Premium Ingredients', desc: 'We source the finest ingredients — real butter, premium chocolate, organic flour.' },
              { icon: Clock, title: 'Crafted with Care', desc: "We give each item the time it needs. Good baking can't be rushed." },
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-warm-sm text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-base text-muted-foreground italic max-w-2xl mx-auto">{settings?.why_choose_us_text}</p>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Contact */}
      <section id="contact" className="py-10 md:py-16 scroll-mt-24">
        <div className="section-padding">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-label text-xs text-primary mb-2">Get in Touch</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-8 text-sm md:text-base">Have a question or special request? We'd love to hear from you.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {settings?.contact_phone && (
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-label text-xs text-muted-foreground mb-1">Phone</p>
                  <a href={`tel:${settings.contact_phone}`} className="font-heading text-base hover:text-primary transition-colors">{settings.contact_phone}</a>
                </div>
              )}
              {settings?.contact_email && (
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-label text-xs text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${settings.contact_email}`} className="font-heading text-base hover:text-primary transition-colors break-all">{settings.contact_email}</a>
                </div>
              )}
              {settings?.contact_address && (
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-label text-xs text-muted-foreground mb-1">Visit Us</p>
                  <p className="font-heading text-base">{settings.contact_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}