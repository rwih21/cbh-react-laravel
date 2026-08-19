import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';

const emptyForm = {
  question: '',
  answer: '',
  sort_order: 0,
};

export default function FAQ() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => base44.entities.FAQ.list('sort_order', 50),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (faq) => {
    setForm({ ...emptyForm, ...faq });
    setEditingId(faq.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      alert('Question and answer are required.');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, sort_order: parseInt(form.sort_order) || 0 };
      if (editingId) {
        await base44.entities.FAQ.update(editingId, data);
      } else {
        await base44.entities.FAQ.create(data);
      }
      queryClient.invalidateQueries(['faqs']);
      setModalOpen(false);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await base44.entities.FAQ.delete(id);
      queryClient.invalidateQueries(['faqs']);
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">FAQ</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-label hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl shadow-warm-sm">
          <p className="font-heading text-xl text-muted-foreground mb-4">No FAQs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-card rounded-2xl shadow-warm-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold mb-1">{faq.question}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{faq.answer}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(faq)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit FAQ' : 'Add FAQ'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Question *</label>
            <input type="text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="How do I place an order?" />
          </div>
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Answer *</label>
            <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" rows="4" placeholder="Browse our menu, add items to cart..." />
          </div>
          <div>
            <label className="font-label text-xs text-muted-foreground block mb-2">Sort Order</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary" placeholder="0" />
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