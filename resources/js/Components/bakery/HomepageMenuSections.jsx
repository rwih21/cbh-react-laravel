import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isProductVisible } from '@/lib/format';
import ProductCard from '@/components/bakery/ProductCard';

export default function HomepageMenuSections() {
  const { data: sections = [] } = useQuery({
    queryKey: ['menuSections'],
    queryFn: () => base44.entities.MenuSection.list('sort_order', 50),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 200),
  });

  const visibleSections = sections.filter(s => s.is_visible !== false && (s.product_ids || []).length > 0);

  if (visibleSections.length === 0) return null;

  return (
    <>
      {visibleSections.map(section => {
        const sectionProducts = (section.product_ids || [])
          .map(id => products.find(p => p.id === id))
          .filter(p => p && isProductVisible(p));
        if (sectionProducts.length === 0) return null;
        return (
          <section key={section.id} className="py-8 md:py-12">
            <div className="section-padding">
              <div className="mb-5 md:mb-8">
                <h2 className="font-heading text-2xl md:text-4xl font-bold">{section.title}</h2>
                {section.description && (
                  <p className="text-muted-foreground text-sm md:text-base mt-1.5 max-w-2xl">{section.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {sectionProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}