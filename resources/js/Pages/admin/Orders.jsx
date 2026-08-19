import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, X, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { formatPrice, formatShortDate, ORDER_STATUSES, getStatusLabel, PAYMENT_METHODS, STATUS_BADGE_CLASSES, normalizePaymentMethod, isOrderArchived } from '@/lib/format';
import { Archive } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';

export default function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const filtered = orders.filter(o => {
    const matchesView = view === 'archived' ? isOrderArchived(o) : !isOrderArchived(o);
    const matchesSearch = !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchesView && matchesSearch && matchesStatus;
  });

  const openOrder = (order) => {
    setSelectedOrder(order);
    setInternalNotes(order.internal_notes || '');
  };

  const handleStatusUpdate = async (newStatus, sendVerificationEmail = false) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await base44.entities.Order.update(selectedOrder.id, {
        order_status: newStatus,
        status_updated_at: new Date().toISOString(),
        internal_notes: internalNotes,
      });

      try {
        if (sendVerificationEmail) {
          await base44.integrations.Core.SendEmail({
            to: selectedOrder.customer_email,
            subject: `Payment Verified — ${selectedOrder.order_number}`,
            body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
              <h1 style="color:#2C1A0E;">Payment Verified!</h1>
              <p style="color:#4A3728;">Great news! Your payment for order <strong>${selectedOrder.order_number}</strong> has been verified.</p>
              <p style="color:#B87D2B;font-size:24px;font-weight:bold;">Your order is now being prepared.</p>
              <p style="color:#4A3728;">We'll let you know as soon as it's ready for pickup/delivery.</p>
              <p style="color:#4A3728;">Track your order: <a href="${window.location.origin}/track?order=${selectedOrder.order_number}" style="color:#B87D2B;">here</a></p>
            </div>`,
          });
        } else {
          await base44.integrations.Core.SendEmail({
            to: selectedOrder.customer_email,
            subject: `Order Update — ${selectedOrder.order_number}`,
            body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
              <h1 style="color:#2C1A0E;">Order Status Updated</h1>
              <p style="color:#4A3728;">Your order <strong>${selectedOrder.order_number}</strong> status has been updated to:</p>
              <p style="color:#B87D2B;font-size:24px;font-weight:bold;">${getStatusLabel(newStatus)}</p>
              <p style="color:#4A3728;">Track your order: <a href="${window.location.origin}/track?order=${selectedOrder.order_number}" style="color:#B87D2B;">here</a></p>
            </div>`,
          });
        }
      } catch {}

      queryClient.invalidateQueries(['orders']);
      setSelectedOrder(null);
    } catch (err) {
      alert('Failed to update order: ' + (err.message || 'Unknown error'));
    }
    setUpdating(false);
  };

  const needsAction = (order) => {
    return ['awaiting_confirmation', 'awaiting_payment_verification'].includes(order.order_status);
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Orders</h1>

      {/* View toggle: Active vs Archived */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('active')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-label text-xs transition-colors ${view === 'active' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-primary/10'}`}>
          Active
        </button>
        <button onClick={() => setView('archived')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-label text-xs transition-colors ${view === 'archived' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-primary/10'}`}>
          <Archive className="w-3.5 h-3.5" /> Archived
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by order number, name, or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:border-primary">
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-warm-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3">Order #</th>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3 hidden lg:table-cell">Payment</th>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left font-label text-xs text-muted-foreground px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} onClick={() => openOrder(order)}
                    className={`border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors ${needsAction(order) ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 font-heading text-sm">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{order.created_date ? formatShortDate(order.created_date) : '-'}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{PAYMENT_METHODS[normalizePaymentMethod(order.payment_method)] || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatPrice(order.order_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-label ${STATUS_BADGE_CLASSES[order.order_status] || 'bg-secondary'}`}>
                        {getStatusLabel(order.order_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AdminModal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Order Number</p>
                <p className="font-heading text-2xl font-bold text-primary">{selectedOrder.order_number}</p>
              </div>
              <div className="text-right">
                <p className="font-label text-xs text-muted-foreground mb-1">Order Date</p>
                <p className="font-heading text-lg">{selectedOrder.created_date ? formatShortDate(selectedOrder.created_date) : '-'}</p>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-secondary/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Customer</p>
                <p className="font-heading">{selectedOrder.customer_name}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-heading">{selectedOrder.customer_phone}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-heading break-all">{selectedOrder.customer_email}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Fulfillment</p>
                <p className="font-heading capitalize">{selectedOrder.fulfillment_type}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Preferred Date</p>
                <p className="font-heading">{selectedOrder.preferred_date}</p>
              </div>
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Payment</p>
                <p className="font-heading">{PAYMENT_METHODS[normalizePaymentMethod(selectedOrder.payment_method)] || selectedOrder.payment_method}</p>
              </div>
            </div>

            {/* Delivery address */}
            {selectedOrder.delivery_address && (
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Delivery Address</p>
                <p className="text-sm">{selectedOrder.delivery_address}</p>
              </div>
            )}

            {/* Customer notes */}
            {selectedOrder.order_notes && (
              <div>
                <p className="font-label text-xs text-muted-foreground mb-1">Customer Notes</p>
                <p className="text-sm italic">{selectedOrder.order_notes}</p>
              </div>
            )}

            {/* Payment proof */}
            {selectedOrder.payment_proof_image && (
              <div>
                <p className="font-label text-xs text-muted-foreground mb-2">Payment Proof</p>
                <div className="inline-block">
                  <img src={selectedOrder.payment_proof_image} alt="Payment proof" className="max-w-xs rounded-xl shadow-warm-sm" />
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="font-label text-xs text-muted-foreground mb-2">Items</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-heading text-lg mt-3 pt-3 border-t-2 border-dashed border-border">
                <span>Total</span>
                <span className="text-primary">{formatPrice(selectedOrder.order_total)}</span>
              </div>
            </div>

            {/* Verify payment button */}
            {selectedOrder.order_status === 'awaiting_payment_verification' && (
              <button
                onClick={() => handleStatusUpdate('preparing_order', true)}
                disabled={updating}
                className="w-full bg-success text-success-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Verify Payment & Start Preparing
              </button>
            )}

            {/* Confirm order button (COD) */}
            {selectedOrder.order_status === 'awaiting_confirmation' && (
              <button
                onClick={() => handleStatusUpdate('preparing_order')}
                disabled={updating}
                className="w-full bg-success text-success-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Confirm Order & Start Preparing
              </button>
            )}

            {/* Status update */}
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map(status => (
                  <button key={status.value} onClick={() => handleStatusUpdate(status.value)}
                    disabled={updating || selectedOrder.order_status === status.value}
                    className={`px-4 py-2 rounded-full font-label text-xs transition-colors ${
                      selectedOrder.order_status === status.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-primary/10'
                    } disabled:opacity-50`}>
                    {status.label}
                  </button>
                ))}
                <button onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updating || selectedOrder.order_status === 'cancelled'}
                  className="px-4 py-2 rounded-full font-label text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50">
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Internal notes */}
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Internal Notes</label>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" rows="3"
                placeholder="Staff notes (not visible to customer)..." />
            </div>

            {updating && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-5 h-5 border-2 border-secondary border-t-primary rounded-full animate-spin"></div>
                Updating...
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}