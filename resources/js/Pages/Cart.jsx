import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/format';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <h1 className="font-heading text-display-md font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-heading text-2xl mb-2">Your cart is empty</p>
            <p className="text-muted-foreground mb-8">Browse our menu and add your favorite treats.</p>
            <Link to="/menu" className="inline-flex bg-primary text-primary-foreground px-8 py-3 rounded-full font-label hover:opacity-90 transition-opacity">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.product_id} className="flex gap-4 p-4 bg-card rounded-2xl shadow-warm-sm">
                  <Link to={`/product/${item.product_id}`} className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${item.product_id}`} className="font-heading text-xl hover:text-primary transition-colors">{item.name}</Link>
                      <button onClick={() => removeItem(item.product_id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.estimated_fulfillment_time && (
                      <p className="text-xs italic text-muted-foreground mb-2">{item.estimated_fulfillment_time}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-border rounded-full">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-1.5 hover:text-primary transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-label text-sm min-w-[24px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-1.5 hover:text-primary transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-heading text-lg font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-warm-sm sticky top-24">
                <h2 className="font-heading text-2xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({totalItems})</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-muted-foreground">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-heading text-lg">Subtotal</span>
                    <span className="font-heading text-2xl font-bold text-primary">{formatPrice(subtotal)}</span>
                  </div>
                </div>
                <Link to="/checkout" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/menu" className="block text-center font-label text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}