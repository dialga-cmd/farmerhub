"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import OrderSuccess from "@/components/OrderSuccess";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth("consumer");
  const { t } = useLanguage();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const platformFee = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + platformFee;

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setProcessing(true);

    try {
      // Process each item
      for (const item of items) {
        // 1. Reduce crop quantity
        const cropDoc = await getDoc(doc(db, "crops", item.cropId));
        if (cropDoc.exists()) {
          const currentQty = cropDoc.data().quantity_available || 0;
          const remaining = currentQty - item.quantity;
          await updateDoc(doc(db, "crops", item.cropId), {
            quantity_available: Math.max(0, remaining),
            is_sold: remaining <= 0,
          });
        }

        const itemTotal = item.price * item.quantity;

        // 2. Create transaction
        await addDoc(collection(db, "transactions"), {
          crop_id: item.cropId,
          buyer_id: user.uid,
          farmer_id: item.farmerId,
          quantity_purchased: item.quantity,
          amount: itemTotal,
          payment_status: "completed",
          created_at: new Date().toISOString(),
        });

        // 3. Update farmer earnings (farmer gets 100%)
        const farmerDoc = await getDoc(doc(db, "users", item.farmerId));
        if (farmerDoc.exists()) {
          const currentProfit = farmerDoc.data().net_profit || 0;
          const currentSales = farmerDoc.data().total_sales || 0;
          await updateDoc(doc(db, "users", item.farmerId), {
            net_profit: currentProfit + itemTotal,
            total_sales: currentSales + itemTotal,
          });
        }
      }

      clearCart();
      setShowSuccess(true);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="consumer" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/consumer/browse"
          className="flex items-center gap-2 text-foreground/50 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.cart.browse}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{t.cart.title}</h1>
          {items.length > 0 && (
            <span className="bg-primary/10 text-primary text-sm font-bold px-2.5 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/40 text-lg mb-4">{t.cart.empty}</p>
            <Link
              href="/consumer/browse"
              className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              {t.cart.browse}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.cropId}
                className="bg-white rounded-xl border border-primary/10 p-4 flex gap-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.cropName}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{item.cropName}</h3>
                      <p className="text-sm text-foreground/40">
                        by {item.farmerName} • ₹{item.price}/{item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.cropId)}
                      className="p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-primary/20 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.cropId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-1 text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cropId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        className="px-2.5 py-1 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-primary">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-xl border border-primary/10 p-6 mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-foreground/50">{t.cart.subtotal}</p>
                <p className="font-medium">₹{totalPrice.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-primary/10">
                <p className="text-foreground/50">{t.cart.platformFee}</p>
                <p className="font-medium text-green-600">+ ₹{platformFee.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-lg font-bold">{t.cart.grandTotal}</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processing ? t.cart.processing : `${t.cart.checkout} • ₹${grandTotal.toLocaleString("en-IN")}`}
              </button>

              <p className="text-xs text-center text-foreground/30 mt-3">
                This is a demo. No real money is charged.
              </p>
            </div>
          </div>
        )}
      </main>

      {showSuccess && (
        <OrderSuccess
          onClose={() => {
            setShowSuccess(false);
            router.push("/consumer/browse");
          }}
        />
      )}
    </div>
  );
}
