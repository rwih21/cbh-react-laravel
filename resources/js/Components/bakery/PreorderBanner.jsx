import React from 'react';
import { Calendar, Clock, Truck, Store, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';
import { getPreorderState } from '@/lib/preorder';
import { formatDate } from '@/lib/format';

export default function PreorderBanner() {
  const { data: settings } = useSiteSettings();
  const state = getPreorderState(settings);
  if (!state.enabled) return null;

  const { closed, open, nextCloseDate, pickupDate, deliveryDate, message } = state;

  return (
    <section className="bg-primary/5 border-y border-primary/20">
      <div className="section-padding py-4">
        {closed ? (
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="font-heading text-sm text-foreground">
              Pre-orders are now closed. Browse our menu and check back when the next window opens.
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">
                  {message || 'Preorders are now open!'}
                </p>
                {nextCloseDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" /> Order by {formatDate(nextCloseDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {pickupDate && (
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Pickup:</span>
                  <span className="font-heading font-semibold">{formatDate(pickupDate)}</span>
                </div>
              )}
              {deliveryDate && (
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-heading font-semibold">{formatDate(deliveryDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}