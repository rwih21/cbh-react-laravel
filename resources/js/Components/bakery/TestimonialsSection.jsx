import React from 'react';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TestimonialsSection() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => base44.entities.Testimonial.list('sort_order', 20),
  });

  if (testimonials.length === 0) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="section-padding">
        <div className="text-center mb-6">
          <p className="font-label text-xs text-primary mb-2">Loved by Customers</p>
          <h2 className="font-heading text-2xl md:text-4xl font-bold">What People Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="bg-card rounded-2xl p-5 shadow-warm-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-border'}`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-heading text-sm font-semibold text-primary">
                      {t.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-heading text-sm font-semibold">{t.name}</p>
                  {t.product_name && (
                    <p className="text-xs text-muted-foreground">{t.product_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}