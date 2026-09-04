"use client";

import { useState } from "react";
import { X, CreditCard, MapPin } from "lucide-react";

interface CheckoutModalProps {
  total: number;
  onConfirm: (address: string) => void;
  onCancel: () => void;
  processing: boolean;
}

export default function CheckoutModal({ total, onConfirm, onCancel, processing }: CheckoutModalProps) {
  const [address, setAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formattedCard = cardNumber.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();

  const handleConfirm = () => {
    if (!address.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) return;
    onConfirm(address.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-foreground/30 hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Complete Payment</h2>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/60 mb-1.5">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address"
              className="w-full border border-primary/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/60 mb-1.5">
              <CreditCard className="w-4 h-4" />
              Card Number
            </label>
            <input
              type="text"
              value={formattedCard}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
                setCardNumber(raw);
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full border border-primary/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground/60 mb-1.5 block">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
                  setExpiry(raw);
                }}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full border border-primary/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/60 mb-1.5 block">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="123"
                maxLength={3}
                className="w-full border border-primary/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-primary/10">
          <button
            onClick={handleConfirm}
            disabled={processing || !address.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")}`}
          </button>
          <p className="text-xs text-center text-foreground/30 mt-2">This is a demo. No real money is charged.</p>
        </div>
      </div>
    </div>
  );
}
