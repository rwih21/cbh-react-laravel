import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Star, Check, X, Upload } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';

const emptyForm = {
  name: '',
  rating: 5,
  text: '',
  product_name: '',
  avatar: '',
  sort_order: 0,
};

export default function Testimonials() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => base44.entities.Testimonial.list('sort_order', 50),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setForm({ ...emptyForm, ...t });
    setEditingId(t.id);
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, avatar: file_url }));
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.text) {
      alert('Name and testimonial text are required.');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, rating: parseInt(form.rating) || 5, sort_order: parseInt(form.sort_order) || 0 };
      if (editingId) {
        await base44.entities.Testimonial.update(editingId, data);
      } else {
        await base44.entities.Testimonial.create(data);
      }
      queryClient.invalidateQueries(['testimonials']);
      setModalOpen(false);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await base44.entities.Testimonial.delete(id);
      queryClient.invalidateQueries(['testimonials']);
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Testimonials</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-label hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl shadow-warm-sm">
          <p className="font-heading text-xl text-muted-foreground mb-4">No testimonials yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.id} className="bg-card rounded-2xl shadow-warm-sm p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-4 line-clamp-3">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-heading text-xs font-semibold text-primary">{t.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-heading text-sm font-semibold">{t.name}</p>
                    {t.product_name && <p className="text-xs text-muted-foreground">{t.product_name}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Testimonial' : 'Add Testimonial'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary flex-shrink-0">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
              )}
            </div>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-primary/10 transition-colors cursor-pointer text-sm">
              {uploading ? <div className="w-4 h-4 border-2 border-secondary border-t-primary rounded-full animate-spin"></div> : <Upload className="w-4 h-4" />}
              Upload Avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            {form.avatar && (
              <button onClick={() => setForm({ ...form, avatar: '' })} className="text-sm text-destructive hover:underline">Remove</button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Customer name" />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Rating</label>
              <select value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary">
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} stars</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Testimonial Text *</label>
            <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" rows="3" placeholder="What did they say?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Product Name (optional)</label>
              <input type="text" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Chocolate Chip Cookies" />
            </div>
            <div>
              <label className="font-label text-xs text-muted-foreground block mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="0" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Saving...</> : <><Check className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}