import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Upload, X, Check, Eye, EyeOff } from 'lucide-react';
import { formatPrice, PRODUCT_AVAILABILITY, AVAILABILITY_OPTIONS } from '@/lib/format';
import AdminModal from '@/components/admin/AdminModal';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  estimated_fulfillment_time: '',
  availability: 'in_stock',
  stock_count: '',
  images: [],
  same_day_pickup: true,
  same_day_delivery: false,
  order_cutoff_time: '',
  is_today_menu: false,
  is_featured: false,
  sort_order: 0,
};

export default function Products() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order', 50),
  });

  const filtered = statusFilter === 'all' ? products : products.filter(p => (p.availability || 'in_stock') === statusFilter);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setForm({ ...emptyForm, ...product, price: product.price?.toString() || '' });
    setEditingId(product.id);
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, images: [...(prev.images || []), file_url] }));
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert('Name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price) || 0,
        sort_order: parseInt(form.sort_order) || 0,
        stock_count: form.stock_count === '' ? null : parseInt(form.stock_count),
      };
      if (editingId) {
        await base44.entities.Product.update(editingId, data);
      } else {
        await base44.entities.Product.create(data);
      }
      queryClient.invalidateQueries(['products']);
      setModalOpen(false);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const toggleVisibility = async (product) => {
    const newStatus = product.availability === 'hidden' ? 'in_stock' : 'hidden';
    try {
      await base44.entities.Product.update(product.id, { availability: newStatus });
      queryClient.invalidateQueries(['products']);
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Products</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-label hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full font-label text-xs transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-primary/10'}`}>
          All ({products.length})
        </button>
        {AVAILABILITY_OPTIONS.map(opt => {
          const count = products.filter(p => (p.availability || 'in_stock') === opt.value).length;
          return (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-full font-label text-xs transition-colors ${statusFilter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-primary/10'}`}>
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl shadow-warm-sm">
          <p className="font-heading text-xl text-muted-foreground mb-4">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => {
            const config = PRODUCT_AVAILABILITY[product.availability] || PRODUCT_AVAILABILITY.in_stock;
            return (
              <div key={product.id} className="bg-card rounded-2xl shadow-warm-sm overflow-hidden">
                <div className="aspect-square bg-secondary relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full font-label text-xs ${config.badge}`}>{config.label}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading text-lg font-semibold truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{product.category || 'Uncategorized'}</p>
                    </div>
                    <p className="font-heading text-lg font-bold text-primary whitespace-nowrap">{formatPrice(product.price)}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary text-foreground hover:bg-primary/10 transition-colors text-sm">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => toggleVisibility(product)}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-secondary text-foreground hover:bg-primary/10 transition-colors text-sm"
                      title={product.availability === 'hidden' ? 'Show' : 'Hide'}>
                      {product.availability === 'hidden' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Product Images</label>
            <div className="flex flex-wrap gap-3 mb-2">
              {(form.images || []).map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary">
                  <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-foreground/60 text-background p-1 rounded-full">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-secondary border-t-primary rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground" />
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="e.g. Chocolate Chip Cookies" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Category</label>
              <input type="text" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Select or type a category" list="category-list" />
              <datalist id="category-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Price (Rp) *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="25000" />
            </div>
          </div>

          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" rows="3" placeholder="Describe your product..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Estimated Fulfillment Time</label>
              <input type="text" value={form.estimated_fulfillment_time} onChange={e => setForm({ ...form, estimated_fulfillment_time: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Same Day, 1-2 Business Days..." />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Visibility Status</label>
              <select value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Stock Count</label>
            <input type="number" value={form.stock_count ?? ''} onChange={e => setForm({ ...form, stock_count: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Leave empty for unlimited" />
            <p className="text-xs text-muted-foreground mt-1.5">Leave empty for unlimited stock. When stock reaches 0, the product shows "Only X left" at low stock (≤5).</p>
          </div>

          {/* Same-Day Ordering */}
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <p className="font-label text-xs text-primary">Same-Day Ordering</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.same_day_pickup ?? true} onChange={e => setForm({ ...form, same_day_pickup: e.target.checked })} className="w-5 h-5 rounded accent-primary" />
                <span className="text-sm">Same-Day Pickup</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.same_day_delivery ?? false} onChange={e => setForm({ ...form, same_day_delivery: e.target.checked })} className="w-5 h-5 rounded accent-primary" />
                <span className="text-sm">Same-Day Delivery</span>
              </label>
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-1.5">Order Cutoff Time</label>
              <input type="time" value={form.order_cutoff_time || ''} onChange={e => setForm({ ...form, order_cutoff_time: e.target.value })}
                className="px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm" />
              <p className="text-xs text-muted-foreground mt-1.5">For same-day orders, customers must order before this time. Leave empty for no cutoff.</p>
            </div>
          </div>

          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Sort Order</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="0" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Saving...</>
            ) : (
              <><Check className="w-4 h-4" /> {editingId ? 'Update Product' : 'Create Product'}</>
            )}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}