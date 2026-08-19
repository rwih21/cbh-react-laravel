import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Package, ChefHat, CheckCircle, Clock, CreditCard, CheckCircle2 } from 'lucide-react';
import { formatPrice, getStatusStep, PAYMENT_METHODS, normalizePaymentMethod } from '@/lib/format';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [searched, setSearched] = useState(!!searchParams.get('order'));

  const { data: order, isLoading } = useQuery({
    queryKey: ['trackOrder', orderNumber],
    queryFn: async () => {
      const results = await base44.entities.Order.filter({ order_number: orderNumber });
      if (results && results.length > 0) return results[0];
      return null;
    },
    enabled: searched && !!orderNumber,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearched(true);
    }
  };

  const isCOD = order && normalizePaymentMethod(order.payment_method) === 'cash_on_delivery';
  const currentStep = order ? getStatusStep(order.order_status) : -1;

  const timelineSteps = isCOD
    ? [
        { label: 'Awaiting Confirmation', step: 0, icon: Clock },
        { label: 'Preparing Order', step: 2, icon: ChefHat },
        { label: 'Ready for Pickup / Delivery', step: 3, icon: Package },
        { label: 'Completed', step: 4, icon: CheckCircle },
      ]
    : [
        { label: 'Awaiting Payment', step: 0, icon: CreditCard },
        { label: 'Awaiting Payment Verification', step: 1, icon: CheckCircle2 },
        { label: 'Preparing Order', step: 2, icon: ChefHat },
        { label: 'Ready for Pickup / Delivery', step: 3, icon: Package },
        { label: 'Completed', step: 4, icon: CheckCircle },
      ];

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-display-md font-bold mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">Enter your order number to check the status of your order.</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-card border border-border focus:outline-none focus:border-primary text-lg"
                placeholder="e.g. HC-2024-0001" />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-label hover:opacity-90 transition-opacity">
              Track
            </button>
          </form>

          {searched && isLoading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {searched && !isLoading && !order && (
            <div className="text-center py-12">
              <p className="font-heading text-2xl text-muted-foreground">Order not found.</p>
              <p className="text-sm text-muted-foreground mt-2">Please check your order number and try again.</p>
            </div>
          )}

          {searched && !isLoading && order && (
            <div className="animate-slide-up">
              <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-label text-xs text-muted-foreground mb-1">Order Number</p>
                    <p className="font-heading text-2xl font-bold text-primary">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-heading text-2xl font-bold">{formatPrice(order.order_total)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <p className="font-label text-xs text-muted-foreground mb-1">Customer</p>
                    <p className="font-heading">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="font-label text-xs text-muted-foreground mb-1">Preferred Date</p>
                    <p className="font-heading">{order.preferred_date}</p>
                  </div>
                  <div>
                    <p className="font-label text-xs text-muted-foreground mb-1">Fulfillment</p>
                    <p className="font-heading capitalize">{order.fulfillment_type}</p>
                  </div>
                  <div>
                    <p className="font-label text-xs text-muted-foreground mb-1">Payment</p>
                    <p className="font-heading">{PAYMENT_METHODS[normalizePaymentMethod(order.payment_method)] || order.payment_method}</p>
                  </div>
                </div>
                {order.estimated_fulfillment_time && (
                  <div className="mt-4 bg-secondary rounded-xl p-4">
                    <p className="font-label text-xs text-muted-foreground mb-1">Estimated Fulfillment Time</p>
                    <p className="font-heading text-lg italic">{order.estimated_fulfillment_time}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-card rounded-2xl shadow-warm-sm p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold mb-8">Order Status</h2>
                <div className="space-y-0">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = step.step <= currentStep;
                    const isCurrent = step.step === currentStep;
                    const isCancelled = order.order_status === 'cancelled';

                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted && !isCancelled
                              ? 'bg-primary border-primary text-primary-foreground'
                              : isCancelled && step.step <= currentStep
                              ? 'bg-destructive border-destructive text-destructive-foreground'
                              : 'bg-secondary border-border text-muted-foreground'
                          } ${isCurrent && !isCancelled ? 'ring-4 ring-primary/20' : ''}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {index < timelineSteps.length - 1 && (
                            <div className={`w-0.5 h-12 ${step.step < currentStep && !isCancelled ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pt-2 pb-12">
                          <p className={`font-heading text-lg ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-primary mt-1">
                              {isCancelled ? 'Order Cancelled' : 'Current Status'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {order.order_status === 'cancelled' && (
                  <div className="mt-4 bg-destructive/10 rounded-xl p-4">
                    <p className="text-destructive font-heading">This order has been cancelled. Please contact us for assistance.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}