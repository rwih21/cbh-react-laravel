import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Minus, ShoppingCart, Clock, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice, canAddToCart, isProductVisible } from '@/lib/format';
import ProductCard from '@/components/bakery/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => base44.entities.Product.get(id),
    enabled: !!id,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center section-padding text-center">
        <p className="font-heading text-3xl mb-4">Product not found</p>
        <Link to="/menu" className="text-primary hover:underline">Back to Menu</Link>
      </div>
    );
  }

  const isAvailable = canAddToCart(product);
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id && isProductVisible(p))
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <Link to="/menu" className="inline-flex items-center gap-2 font-label text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-secondary shadow-warm-md">
              {product.images?.[selectedImage] ? (
                <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3 mt-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            {product.category && (
              <p className="font-label text-sm text-primary mb-3 capitalize">{product.category}</p>
            )}
            <h1 className="font-heading text-display-md font-bold mb-4">{product.name}</h1>
            <p className="font-heading text-3xl font-semibold text-primary mb-6">{formatPrice(product.price)}</p>

            {product.estimated_fulfillment_time && (
              <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full mb-6 self-start">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-heading text-sm italic">{product.estimated_fulfillment_time}</span>
              </div>
            )}

            <p className="text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>

            {/* Quantity + Add to Cart */}
            {isAvailable ? (
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 border border-border rounded-full px-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-primary transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-label min-w-[32px] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-primary transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-label transition-all ${
                    added ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {added ? <><Check className="w-4 h-4" /> Added to Cart</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                </button>
              </div>
            ) : (
              <div className="bg-secondary px-6 py-4 rounded-full mb-8 self-start">
                <p className="font-label text-sm text-muted-foreground">Currently Sold Out</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-heading text-display-md font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}