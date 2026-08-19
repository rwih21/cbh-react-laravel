import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => base44.entities.FAQ.list('sort_order', 30),
  });

  if (faqs.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="section-padding">
        <div className="text-center mb-6">
          <p className="font-label text-xs text-primary mb-2">Got Questions?</p>
          <h2 className="font-heading text-2xl md:text-4xl font-bold">Frequently Asked</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.id} className="bg-card rounded-xl shadow-warm-sm overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="font-heading text-sm md:text-base font-semibold">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-primary flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}