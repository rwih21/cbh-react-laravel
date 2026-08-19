import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Check, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';

const emptyForm = { name: '', slug: '', sort_order: 0, is_hidden: false };

export default function Categories() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order', 50),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setForm({ ...emptyForm, ...cat });
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      alert('Category name is required.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        slug: form.slug?.trim() || form.name.toLowerCase().replace(/\s+/g, '-'),
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (editingId) {
        await base44.entities.Category.update(editingId, data);
      } else {
        await base44.entities.Category.create(data);
      }
      queryClient.invalidateQueries(['categories']);
      setModalOpen(false);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Products assigned to it will keep their text but the tab will disappear.')) return;
    try {
      await base44.entities.Category.delete(id);
      queryClient.invalidateQueries(['categories']);
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const toggleHidden = async (cat) => {
    try {
      await base44.entities.Category.update(cat.id, { is_hidden: !cat.is_hidden });
      queryClient.invalidateQueries(['categories']);
    } catch (err) {
      alert('Update failed: ' + (err.message || 'Unknown error'));
    }
  };

  const move = async (cat, dir) => {
    const sorted = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = sorted.findIndex(c => c.id === cat.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx], b = sorted[target];
    try {
      await base44.entities.Category.bulkUpdate([
        { id: a.id, sort_order: b.sort_order ?? target },
        { id: b.id, sort_order: a.sort_order ?? idx },
      ]);
      queryClient.invalidateQueries(['categories']);
    } catch (err) {
      alert('Reorder failed: ' + (err.message || 'Unknown error'));
    }
  };

  const sorted = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Categories</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-label hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl shadow-warm-sm">
          <p className="font-heading text-xl text-muted-foreground mb-4">No categories yet.</p>
          <p className="text-sm text-muted-foreground">Create categories to organize your menu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((cat, i) => (
            <div key={cat.id} className={`flex items-center justify-between gap-3 p-4 bg-card rounded-2xl shadow-warm-sm ${cat.is_hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col">
                  <button onClick={() => move(cat, -1)} disabled={i === 0} className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => move(cat, 1)} disabled={i === sorted.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleHidden(cat)} className="p-2 text-muted-foreground hover:text-primary transition-colors" title={cat.is_hidden ? 'Show' : 'Hide'}>
                  {cat.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(cat)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="Cookies, Bread..." />
          </div>
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Slug (optional)</label>
            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="auto-generated from name" />
          </div>
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Sort Order</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="0" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_hidden} onChange={e => setForm({ ...form, is_hidden: e.target.checked })} className="w-5 h-5 rounded accent-primary" />
            <span className="text-sm">Hide from customer menu</span>
          </label>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Saving...</> : <><Check className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}