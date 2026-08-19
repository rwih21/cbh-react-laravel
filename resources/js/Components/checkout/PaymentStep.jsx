import React, { useState } from 'react';
import { Upload, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatPrice, PAYMENT_METHODS } from '@/lib/format';

export default function PaymentStep({ order, settings, onComplete }) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState('');
  const [error, setError] = useState('');

  const method = order.payment_method;
  const isQRIS = method === 'qris';
  const isBank = method === 'bank_transfer';

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofImage(file_url);
    } catch (err) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!proofImage) {
      setError('Please upload your payment proof.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await base44.entities.Order.update(order.id, {
        payment_proof_image: proofImage,
        order_status: 'awaiting_payment_verification',
        status_updated_at: new Date().toISOString(),
      });

      try {
        await base44.integrations.Core.SendEmail({
          to: order.customer_email,
          subject: `Payment Received — ${order.order_number}`,
          body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
            <h1 style="color:#2C1A0E;">Payment Proof Received</h1>
            <p style="color:#4A3728;">Thank you! We've received your payment proof for order <strong>${order.order_number}</strong>.</p>
            <p style="color:#4A3728;">Our team will verify your payment shortly. You'll receive another email once your order is being prepared.</p>
            <p style="color:#B87D2B;font-size:20px;font-weight:bold;">Status: Awaiting Payment Verification</p>
            <p style="color:#4A3728;">Track your order: <a href="${window.location.origin}/track?order=${order.order_number}" style="color:#B87D2B;">here</a></p>
          </div>`,
        });
      } catch {}

      onComplete();
    } catch (err) {
      setError('Failed to submit: ' + (err.message || 'Unknown error'));
    }
    setSubmitting(false);
  };

  return (
    <div className="pb-20">
      <div className="section-padding pt-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-display-md font-bold mb-4">Complete Your Payment</h1>
          <p className="text-muted-foreground mb-2">Order <strong>{order.order_number}</strong> — {PAYMENT_METHODS[method]}</p>
          <p className="text-muted-foreground mb-8">Please complete your payment using the details below, then upload your payment proof.</p>

          {/* Payment amount */}
          <div className="bg-secondary rounded-2xl p-6 mb-6 text-center">
            <p className="font-label text-xs text-muted-foreground mb-2">Amount to Pay</p>
            <p className="font-heading text-4xl font-bold text-primary">{formatPrice(order.order_total)}</p>
          </div>

          {/* QRIS */}
          {isQRIS && (
            <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-6">
              <h2 className="font-heading text-2xl font-bold mb-4">Scan QRIS Code</h2>
              {settings?.qris_image ? (
                <div className="flex justify-center mb-4">
                  <img src={settings.qris_image} alt="QRIS Code" className="w-64 h-64 object-contain rounded-xl" />
                </div>
              ) : (
                <div className="text-center py-8 bg-secondary rounded-xl mb-4">
                  <p className="text-muted-foreground">QRIS image not configured. Please contact us.</p>
                </div>
              )}
              {settings?.payment_instructions && (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="font-label text-xs text-muted-foreground mb-2">Instructions</p>
                  <p className="text-sm whitespace-pre-line">{settings.payment_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer */}
          {isBank && (
            <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-6">
              <h2 className="font-heading text-2xl font-bold mb-4">Bank Transfer Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-xl">
                  <span className="font-label text-xs text-muted-foreground">Bank Name</span>
                  <span className="font-heading text-lg">{settings?.bank_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-xl">
                  <span className="font-label text-xs text-muted-foreground">Account Name</span>
                  <span className="font-heading text-lg">{settings?.account_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-xl">
                  <span className="font-label text-xs text-muted-foreground">Account Number</span>
                  <span className="font-heading text-lg">{settings?.account_number || '—'}</span>
                </div>
              </div>
              {settings?.payment_instructions && (
                <div className="bg-secondary/50 rounded-xl p-4 mt-4">
                  <p className="font-label text-xs text-muted-foreground mb-2">Instructions</p>
                  <p className="text-sm whitespace-pre-line">{settings.payment_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Upload proof */}
          <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-6">
            <h2 className="font-heading text-2xl font-bold mb-4">Upload Payment Proof</h2>
            {proofImage ? (
              <div className="flex items-center gap-4">
                <img src={proofImage} alt="Payment proof" className="w-32 h-32 object-cover rounded-xl" />
                <button onClick={() => setProofImage('')} className="text-sm text-destructive hover:underline">Remove & re-upload</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                {uploading ? (
                  <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload screenshot/photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />
              </label>
            )}
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm text-destructive mb-4">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !proofImage}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Submitting...</>
            ) : (
              <><Check className="w-4 h-4" /> Submit Payment Proof</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}