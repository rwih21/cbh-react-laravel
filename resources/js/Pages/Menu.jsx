import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';
import { isProductVisible } from '@/lib/format';
import ProductCard from '@/components/bakery/ProductCard';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });
  const { data: categoryRecords = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order', 50),
  });

  const visibleProducts = products.filter(p => isProductVisible(p));
  const managedCats = categoryRecords
    .filter(c => !c.is_hidden && c.name)
    .map(c => c.name);
  // Use managed categories when available; otherwise fall back to categories derived from products.
  const categories = managedCats.length > 0
    ? ['all', ...managedCats]
    : ['all', ...new Set(visibleProducts.map(p => p.category).filter(Boolean))];

  const filtered = visibleProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-6 pb-16">
      <div className="section-padding">
        <div className="text-center mb-6">
          <p className="font-label text-xs text-primary mb-2">Full Menu</p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold">Our Bakery</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm md:text-base">Browse our complete collection of handcrafted cookies, bread, pizza, cakes, and pastries.</p>
        </div>

        {/* Search + Categories */}
        <div className="flex flex-col md:flex-row gap-3 mb-8 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSearchParams(cat === 'all' ? {} : { category: cat })}
                className={`px-5 py-2 rounded-full font-label text-sm transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-heading text-2xl text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}