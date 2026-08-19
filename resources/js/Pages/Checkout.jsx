import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Store, Truck, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useSiteSettings } from '@/lib/site-settings';
import { formatPrice, generateOrderNumber, PAYMENT_METHODS, normalizePaymentMethod, getSameDayError } from '@/lib/format';
import { isPreorderClosed } from '@/lib/preorder';
import { saveLastOrder } from '@/lib/last-order';
import PaymentStep from '@/components/checkout/PaymentStep';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [paymentStepOrder, setPaymentStepOrder] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    fulfillment_type: 'pickup',
    delivery_address: '',
    preferred_date: '',
    order_notes: '',
    payment_method: 'cash_on_delivery',
  });

  const { data: closedDates = [] } = useQuery({
    queryKey: ['closedDates'],
    queryFn: () => base44.entities.ClosedDate.list('date', 50),
  });
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 200),
  });

  const preorderClosed = isPreorderClosed(settings);

  const enabledPayments = [...new Set(
    (settings?.payment_methods_enabled || ['cash_on_delivery']).map(normalizePaymentMethod)
  )];

  const deliveryFee = form.fulfillment_type === 'delivery' && settings?.delivery_enabled
    ? (settings?.delivery_fee || 0)
    : 0;
  const total = subtotal + deliveryFee;
  const today = new Date().toISOString().split('T')[0];

  const cartProducts = items
    .map(i => allProducts.find(p => p.id === i.product_id))
    .filter(Boolean);

  const checkDateAvailability = async (date) => {
    if (!date) return;
    setDateError('');
    const isClosed = closedDates.some(d => d.date === date);
    if (isClosed) {
      setDateError('Sorry, we are closed on this date. Please select another date.');
      return;
    }
    const sameDayErr = getSameDayError(cartProducts, form.fulfillment_type, date);
    if (sameDayErr) {
      setDateError(sameDayErr);
      return;
    }
    if (settings?.max_orders_per_day) {
      try {
        const orders = await base44.entities.Order.filter({ preferred_date: date });
        if (orders.length >= settings.max_orders_per_day) {
          setDateError('Sorry, we are fully booked on this date. Please select another date.');
          return;
        }
      } catch {}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (preorderClosed) {
      setError('Pre-orders are currently closed. Please check back when the next window opens.');
      return;
    }
    if (!form.customer_name || !form.customer_phone || !form.customer_email || !form.preferred_date) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.fulfillment_type === 'delivery' && !form.delivery_address) {
      setError('Please provide a delivery address.');
      return;
    }
    if (dateError) {
      setError(dateError);
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const fulfillmentTime = items.map(i => i.estimated_fulfillment_time).filter(Boolean)[0] || '';
      const normalizedMethod = normalizePaymentMethod(form.payment_method);

      const initialStatus = normalizedMethod === 'cash_on_delivery' ? 'awaiting_confirmation' : 'awaiting_payment';

      const orderData = {
        order_number: orderNumber,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        fulfillment_type: form.fulfillment_type,
        delivery_address: form.fulfillment_type === 'delivery' ? form.delivery_address : '',
        preferred_date: form.preferred_date,
        order_notes: form.order_notes,
        payment_method: normalizedMethod,
        order_status: initialStatus,
        estimated_fulfillment_time: fulfillmentTime,
        order_total: total,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        status_updated_at: new Date().toISOString(),
      };

      const order = await base44.entities.Order.create(orderData);
      saveLastOrder(orderNumber);

      if (normalizedMethod === 'cash_on_delivery') {
        // Send confirmation email immediately
        try {
          await base44.integrations.Core.SendEmail({
            to: form.customer_email,
            subject: `Order Confirmation — ${orderNumber}`,
            body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
              <h1 style="color:#2C1A0E;font-size:32px;">Thank you for your order!</h1>
              <p style="color:#4A3728;font-size:16px;">Your order has been received and is awaiting confirmation.</p>
              <div style="background:#FAF6F0;padding:20px;border-radius:12px;margin:20px 0;">
                <p style="color:#B87D2B;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order Number</p>
                <p style="color:#2C1A0E;font-size:24px;font-weight:bold;margin:0;">${orderNumber}</p>
              </div>
              <h2 style="color:#2C1A0E;font-size:20px;margin-top:30px;">Order Summary</h2>
              <ul style="list-style:none;padding:0;color:#4A3728;">
                ${items.map(i => `<li style="padding:8px 0;border-bottom:1px solid #D9C5B2;">${i.quantity}x ${i.name} — ${formatPrice(i.price * i.quantity)}</li>`).join('')}
              </ul>
              <p style="color:#2C1A0E;font-size:20px;font-weight:bold;margin-top:20px;">Total: ${formatPrice(total)}</p>
              <p style="color:#4A3728;"><strong>Payment:</strong> Cash on Delivery</p>
              <p style="color:#4A3728;"><strong>Preferred Date:</strong> ${form.preferred_date}</p>
              <div style="margin-top:30px;padding:20px;background:#F2EBE0;border-radius:12px;">
                <p style="color:#2C1A0E;margin:0;">Track your order status here:</p>
                <a href="${window.location.origin}/track?order=${orderNumber}" style="color:#B87D2B;font-weight:bold;">${window.location.origin}/track?order=${orderNumber}</a>
              </div>
            </div>`,
          });
        } catch {}

        clearCart();
        navigate(`/order-confirmation/${order.id}`);
      } else {
        // QRIS or Bank Transfer — show payment step
        clearCart();
        setPaymentStepOrder(order);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // Show payment step if order created with QRIS/Bank Transfer
  if (paymentStepOrder) {
    return (
      <PaymentStep
        order={paymentStepOrder}
        settings={settings}
        onComplete={() => navigate(`/order-confirmation/${paymentStepOrder.id}`)}
      />
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <h1 className="font-heading text-display-md font-bold mb-8">Checkout</h1>

        {preorderClosed && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl p-5 mb-8">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Pre-orders are now closed</p>
              <p className="text-sm text-muted-foreground mt-1">You can still browse the menu and track existing orders, but new orders can't be placed until the next preorder window opens.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Contact info */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-label text-xs text-muted-foreground block mb-2">Full Name *</label>
                  <input type="text" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full px-0 py-3 bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-lg" placeholder="Your full name" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label text-xs text-muted-foreground block mb-2">Phone Number *</label>
                    <input type="tel" required value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-lg" placeholder="+62 812 xxxx xxxx" />
                  </div>
                  <div>
                    <label className="font-label text-xs text-muted-foreground block mb-2">Email Address *</label>
                    <input type="email" required value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-lg" placeholder="you@example.com" />
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Pickup or Delivery</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button type="button" onClick={() => setForm({ ...form, fulfillment_type: 'pickup' })}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-colors ${form.fulfillment_type === 'pickup' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <Store className="w-5 h-5" /> <span className="font-label">Pickup</span>
                </button>
                <button type="button" onClick={() => setForm({ ...form, fulfillment_type: 'delivery' })} disabled={!settings?.delivery_enabled}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-colors disabled:opacity-40 ${form.fulfillment_type === 'delivery' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <Truck className="w-5 h-5" /> <span className="font-label">Delivery</span>
                </button>
              </div>

              {form.fulfillment_type === 'delivery' && (
                <div className="mb-4">
                  <label className="font-label text-xs text-muted-foreground block mb-2">Delivery Address *</label>
                  <textarea required value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" rows="3" placeholder="Full delivery address" />
                </div>
              )}

              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Preferred Date *</label>
                <input type="date" required min={today} value={form.preferred_date}
                  onChange={e => { setForm({ ...form, preferred_date: e.target.value }); checkDateAvailability(e.target.value); }}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" />
                {dateError && (
                  <p className="flex items-center gap-2 text-sm text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" /> {dateError}
                  </p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-4">Payment Method</h2>
              <div className="space-y-3">
                {enabledPayments.map(method => (
                  <button key={method} type="button" onClick={() => setForm({ ...form, payment_method: method })}
                    className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-colors ${form.payment_method === method || (form.payment_method === 'cash_on_delivery' && method === 'cash_on_pickup') ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.payment_method === method ? 'border-primary' : 'border-border'}`}>
                      {form.payment_method === method && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="font-heading text-lg">{PAYMENT_METHODS[method] || method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Order Notes (Optional)</label>
              <textarea value={form.order_notes} onChange={e => setForm({ ...form, order_notes: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" rows="3" placeholder="Any special requests or allergies?" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-warm-sm sticky top-24 overflow-hidden">
              <div className="p-6">
                <h2 className="font-heading text-2xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {items.some(i => i.estimated_fulfillment_time) && (
                  <div className="bg-secondary rounded-xl p-3 mb-4">
                    <p className="font-label text-xs text-muted-foreground mb-1">Estimated Fulfillment</p>
                    <p className="font-heading text-sm italic">{items.map(i => i.estimated_fulfillment_time).filter(Boolean)[0]}</p>
                  </div>
                )}
                <div className="space-y-2 pt-4 border-t border-dashed border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-4 mt-4 border-t border-dashed border-border">
                  <span className="font-heading text-lg">Total</span>
                  <span className="font-heading text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="relative h-4 bg-secondary/50">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border"></div>
              </div>
              <div className="p-6">
                {error && (
                  <p className="flex items-center gap-2 text-sm text-destructive mb-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
                <button type="submit" disabled={submitting || !!dateError || preorderClosed}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Placing Order...</>
                  ) : preorderClosed ? (
                    <>Pre-orders Closed</>
                  ) : (
                    <><Check className="w-4 h-4" /> Place Order</>
                  )}
                </button>
                <Link to="/cart" className="block text-center font-label text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}