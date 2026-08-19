import React from 'react';
import { X } from 'lucide-react';

export default function AdminModal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-card rounded-2xl shadow-warm-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in`}>
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-4 border-b border-border z-10">
          <h2 className="font-heading text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}