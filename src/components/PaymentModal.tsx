"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, CreditCard, CheckCircle } from "lucide-react";
import StarRating from "./StarRating";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string;
  price: number;
  unit: string;
  quantity: number;
  cropId: string;
  farmerId: string;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cropName,
  price,
  unit,
  quantity,
  cropId,
  farmerId,
  onSuccess,
}: PaymentModalProps) {
  const { t } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const total = price * quantity;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await fetch("/api/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropId, farmerId, amount: total }),
      });

      const data = await res.json();

      if (data.success) {
        // 1. Reduce quantity
        const cropDoc = await getDoc(doc(db, "crops", cropId));
        if (cropDoc.exists()) {
          const currentQty = cropDoc.data().quantity_available || 0;
          const remaining = currentQty - quantity;
          await updateDoc(doc(db, "crops", cropId), {
            quantity_available: Math.max(0, remaining),
            is_sold: remaining <= 0,
          });
        }

        // 2. Create transaction
        await addDoc(collection(db, "transactions"), {
          crop_id: cropId,
          buyer_id: "demo-buyer",
          farmer_id: farmerId,
          quantity_purchased: quantity,
          amount: total,
          payment_status: "completed",
          created_at: new Date().toISOString(),
        });

        // 3. Update farmer earnings
        const farmerDoc = await getDoc(doc(db, "users", farmerId));
        if (farmerDoc.exists()) {
          const currentProfit = farmerDoc.data().net_profit || 0;
          const currentSales = farmerDoc.data().total_sales || 0;
          const currentFees = farmerDoc.data().total_platform_fees || 0;
          await updateDoc(doc(db, "users", farmerId), {
            net_profit: currentProfit + data.farmerReceived,
            total_sales: currentSales + total,
            total_platform_fees: currentFees + (total - data.farmerReceived),
          });
        }

        setTransactionId(data.transactionId);
        setCompleted(true);
        setShowRating(true);
        onSuccess();
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRate = async () => {
    if (rating === 0) return;

    try {
      await addDoc(collection(db, "ratings"), {
        crop_id: cropId,
        farmer_id: farmerId,
        buyer_id: "demo-buyer",
        rating: rating,
        created_at: new Date().toISOString(),
      });
      setRated(true);
    } catch (err) {
      console.error("Rating failed:", err);
    }
  };

  const handleClose = () => {
    setCompleted(false);
    setShowRating(false);
    setRating(0);
    setRated(false);
    setCardNumber("");
    setExpiry("");
    setCvv("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">{t.payment.title}</h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {completed ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">
                {t.payment.success}
              </h3>
              <p className="text-sm text-foreground/50 mb-2">
                {t.payment.transactionId}: {transactionId}
              </p>
              <p className="text-foreground/60 mb-6">{t.payment.thankYou}</p>

              {showRating && !rated && (
                <div className="bg-muted rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-foreground/70 mb-2">
                    {t.payment.rateSeller}
                  </p>
                  <div className="flex justify-center mb-3">
                    <StarRating rating={rating} onRate={setRating} size="lg" />
                  </div>
                  <button
                    onClick={handleRate}
                    disabled={rating === 0}
                    className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {t.payment.submitRating}
                  </button>
                </div>
              )}

              {rated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-700">{t.payment.thanksForRating}</p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
              >
                {t.payment.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="bg-muted rounded-xl p-4 mb-4">
                <p className="text-sm text-foreground/50">{cropName}</p>
                <p className="text-sm text-foreground/50">
                  {quantity} {unit} × ₹{price}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  ₹{total.toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.payment.cardNumber}
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t.payment.expiry}
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t.payment.cvv}
                  </label>
                  <input
                    type="text"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processing ? t.payment.processing : `${t.payment.pay}${total.toLocaleString("en-IN")}`}
              </button>

              <p className="text-xs text-center text-foreground/30">
                This is a demo payment. No real money is charged.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
