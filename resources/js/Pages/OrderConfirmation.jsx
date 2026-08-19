import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { formatPrice, getStatusLabel, PAYMENT_METHODS, normalizePaymentMethod } from '@/lib/format';

export default function OrderConfirmation() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => base44.entities.Order.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center section-padding text-center">
        <p className="font-heading text-3xl mb-4">Order not found</p>
        <Link to="/menu" className="text-primary hover:underline">Back to Menu</Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h1 className="font-heading text-display-md font-bold mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">Thank you, {order.customer_name}! Your order has been received.</p>
          <p className="text-muted-foreground mb-8">A confirmation email has been sent to {order.customer_email}.</p>

          <div className="bg-secondary rounded-2xl p-6 mb-8">
            <p className="font-label text-xs text-muted-foreground mb-2">Your Order Number</p>
            <p className="font-heading text-3xl font-bold text-primary">{order.order_number}</p>
          </div>

          <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-8 text-left">
            <h2 className="font-heading text-2xl font-bold mb-4">Order Details</h2>
            <div className="space-y-3 mb-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-border pt-4 space-y-2">
              <div className="flex justify-between font-heading text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.order_total)}</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Fulfillment</p>
                <p className="font-heading capitalize">{order.fulfillment_type}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Preferred Date</p>
                <p className="font-heading">{order.preferred_date}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Payment</p>
                <p className="font-heading">{PAYMENT_METHODS[normalizePaymentMethod(order.payment_method)] || order.payment_method}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Status</p>
                <p className="font-heading">{getStatusLabel(order.order_status)}</p>
              </div>
            </div>
            {order.estimated_fulfillment_time && (
              <div className="mt-4 bg-secondary rounded-xl p-4">
                <p className="font-label text-xs text-muted-foreground mb-1">Estimated Fulfillment Time</p>
                <p className="font-heading text-lg italic">{order.estimated_fulfillment_time}</p>
              </div>
            )}
          </div>

          <Link
            to={`/track?order=${order.order_number}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-label hover:opacity-90 transition-opacity"
          >
            Track Your Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/menu"
            className="block mt-4 font-label text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}