import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice, canAddToCart, PRODUCT_AVAILABILITY, getStockStatus } from '@/lib/format';
import ProductImageGallery from '@/components/bakery/ProductImageGallery';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const isAvailable = canAddToCart(product);
  const availabilityConfig = PRODUCT_AVAILABILITY[product.availability] || PRODUCT_AVAILABILITY.in_stock;
  const stockStatus = getStockStatus(product);
  const images = product.images || [];

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-secondary aspect-square shadow-warm-sm">
        {images.length > 0 ? (
          <ProductImageGallery
            images={images}
            alt={product.name}
            className="w-full h-full"
            imgClassName="transition-transform duration-700 group-hover:scale-110"
            placeholder={<div className="w-full h-full" />}
          />
        ) : (
          <div className="w-full h-full" />
        )}

        {/* Availability Badge */}
        {!isAvailable && availabilityConfig.customerVisible && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className={`px-4 py-1.5 rounded-full font-label text-xs ${availabilityConfig.badge}`}>{availabilityConfig.label}</span>
          </div>
        )}

        {/* Low Stock Badge */}
        {isAvailable && stockStatus.tracked && stockStatus.lowStock && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white px-2 py-1 rounded-full font-label text-[10px]">
            {stockStatus.label}
          </div>
        )}

        {/* Quick Add Button — circular, always visible on mobile, hover on desktop */}
        {isAvailable && (
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-warm-md transition-all ${
              added ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground hover:scale-110 md:opacity-0 md:group-hover:opacity-100'
            }`}
            aria-label="Quick add to cart"
          >
            {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Info — compact */}
      <div className="mt-2">
        <div className="flex items-baseline justify-between gap-1.5">
          <h3 className="font-heading text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {product.name}
          </h3>
          <p className="font-heading text-sm md:text-base font-semibold text-primary whitespace-nowrap">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}