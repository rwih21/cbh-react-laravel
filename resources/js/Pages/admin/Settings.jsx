import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Plus, Trash2, X, Upload } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';
import { PAYMENT_METHODS } from '@/lib/format';
import { WEEKDAYS, formatWeekdayList } from '@/lib/preorder';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' });

  const { data: closedDates = [] } = useQuery({
    queryKey: ['closedDates'],
    queryFn: () => base44.entities.ClosedDate.list('date', 50),
  });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  if (!form) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings?.id) {
        await base44.entities.SiteSettings.update(settings.id, form);
      } else {
        await base44.entities.SiteSettings.create(form);
      }
      queryClient.invalidateQueries(['siteSettings']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const addClosedDate = async () => {
    if (!newClosedDate.date) return;
    try {
      await base44.entities.ClosedDate.create(newClosedDate);
      setNewClosedDate({ date: '', reason: '' });
      queryClient.invalidateQueries(['closedDates']);
    } catch (err) {
      alert('Failed to add date: ' + (err.message || 'Unknown error'));
    }
  };

  const removeClosedDate = async (id) => {
    try {
      await base44.entities.ClosedDate.delete(id);
      queryClient.invalidateQueries(['closedDates']);
    } catch (err) {
      alert('Failed to remove: ' + (err.message || 'Unknown error'));
    }
  };

  const togglePaymentMethod = (method) => {
    const current = form.payment_methods_enabled || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setForm({ ...form, payment_methods_enabled: updated });
  };

  const handleQrisUpload = async (file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, qris_image: file_url });
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        {saved && (
          <span className="flex items-center gap-2 text-success font-label text-sm">
            <Check className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* Business Information */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Business Hours</label>
              <textarea
                value={form.business_hours || ''}
                onChange={e => setForm({ ...form, business_hours: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                rows="3"
                placeholder="Monday – Saturday: 8AM – 6PM&#10;Sunday: Closed"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Phone</label>
                <input
                  type="text"
                  value={form.contact_phone || ''}
                  onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Email</label>
                <input
                  type="email"
                  value={form.contact_email || ''}
                  onChange={e => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Address</label>
              <input
                type="text"
                value={form.contact_address || ''}
                onChange={e => setForm({ ...form, contact_address: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Instagram URL</label>
              <input
                type="url"
                value={form.instagram_url || ''}
                onChange={e => setForm({ ...form, instagram_url: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">WhatsApp URL</label>
              <input
                type="url"
                value={form.whatsapp_url || ''}
                onChange={e => setForm({ ...form, whatsapp_url: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="https://wa.me/..."
              />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Facebook URL</label>
              <input
                type="url"
                value={form.facebook_url || ''}
                onChange={e => setForm({ ...form, facebook_url: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Delivery Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.delivery_enabled ?? true}
                onChange={e => setForm({ ...form, delivery_enabled: e.target.checked })}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-sm">Enable delivery</span>
            </label>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Delivery Fee (Rp)</label>
              <input
                type="number"
                value={form.delivery_fee || 0}
                onChange={e => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Preorder Scheduling */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Preorder Scheduling</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.preorder_enabled ?? false}
                onChange={e => setForm({ ...form, preorder_enabled: e.target.checked })}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-sm">Enable preorder window</span>
            </label>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Preorder Closes On (Weekdays)</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => {
                  const selected = (form.preorder_close_weekdays || []).includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const current = form.preorder_close_weekdays || [];
                        const updated = selected ? current.filter(d => d !== day.value) : [...current, day.value];
                        setForm({ ...form, preorder_close_weekdays: updated });
                      }}
                      className={`px-3.5 py-2 rounded-full font-label text-xs transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">The next occurrence is calculated automatically. {form.preorder_close_weekdays?.length > 0 && <>Currently: {formatWeekdayList(form.preorder_close_weekdays)}.</>}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Daily Cutoff Time</label>
                <input
                  type="time"
                  value={form.preorder_close_time || '14:00'}
                  onChange={e => setForm({ ...form, preorder_close_time: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Orders close at this time on each selected weekday.</p>
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Preorder Message</label>
                <input
                  type="text"
                  value={form.preorder_message || ''}
                  onChange={e => setForm({ ...form, preorder_message: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  placeholder="Preorders are now open!"
                />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Next Pickup Date</label>
                <input
                  type="date"
                  value={form.next_pickup_date || ''}
                  onChange={e => setForm({ ...form, next_pickup_date: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Orders reopen after this pickup date.</p>
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Next Delivery Date</label>
                <input
                  type="date"
                  value={form.next_delivery_date || ''}
                  onChange={e => setForm({ ...form, next_delivery_date: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">When enabled, a preorder banner shows the next closing date. Once the cutoff passes, ordering closes until the next pickup date (or the next day if no pickup date is set).</p>
          </div>
        </div>

        {/* Order Limits */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Order Limits</h2>
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Max Orders Per Day</label>
            <input
              type="number"
              value={form.max_orders_per_day || 20}
              onChange={e => setForm({ ...form, max_orders_per_day: parseInt(e.target.value) || 20 })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">When this limit is reached, the date becomes unavailable for new orders.</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {Object.entries(PAYMENT_METHODS).filter(([key]) => key !== 'cash_on_pickup').map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer p-3 bg-background rounded-xl border border-border hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={(form.payment_methods_enabled || []).includes(key)}
                  onChange={() => togglePaymentMethod(key)}
                  className="w-5 h-5 rounded accent-primary"
                />
                <span className="font-heading">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Payment Details</h2>
          <div className="space-y-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">QRIS Image</label>
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {form.qris_image ? (
                    <img src={form.qris_image} alt="QRIS" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-primary/10 transition-colors cursor-pointer text-sm">
                    <Upload className="w-4 h-4" /> Upload QRIS
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleQrisUpload(f); }} />
                  </label>
                  {form.qris_image && (
                    <button onClick={() => setForm({ ...form, qris_image: '' })} className="text-sm text-destructive hover:underline">Remove</button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Bank Name</label>
                <input type="text" value={form.bank_name || ''} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="BCA, Mandiri..." />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-2">Account Name</label>
                <input type="text" value={form.account_name || ''} onChange={e => setForm({ ...form, account_name: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Account Number</label>
              <input type="text" value={form.account_number || ''} onChange={e => setForm({ ...form, account_number: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Payment Instructions</label>
              <textarea value={form.payment_instructions || ''} onChange={e => setForm({ ...form, payment_instructions: e.target.value })} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" rows="3" placeholder="Transfer to the account above, then upload your payment proof..." />
            </div>
          </div>
        </div>

        {/* Closed Dates */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-4">Closed Dates & Holidays</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="date"
              value={newClosedDate.date}
              onChange={e => setNewClosedDate({ ...newClosedDate, date: e.target.value })}
              className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              value={newClosedDate.reason}
              onChange={e => setNewClosedDate({ ...newClosedDate, reason: e.target.value })}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              placeholder="Reason (optional)"
            />
            <button
              onClick={addClosedDate}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-label hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {closedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No closed dates set.</p>
            ) : (
              closedDates.map(cd => (
                <div key={cd.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                  <div>
                    <p className="font-heading text-sm">{cd.date}</p>
                    {cd.reason && <p className="text-xs text-muted-foreground">{cd.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeClosedDate(cd.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}