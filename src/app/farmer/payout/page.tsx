"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import OrderSuccess from "@/components/OrderSuccess";
import { Wallet, CheckCircle, Clock } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  bank_account: string;
  ifsc_code: string;
  status: string;
  created_at: string;
}

export default function PayoutPage() {
  const { user, loading: authLoading } = useAuth("farmer");
  const { t } = useLanguage();
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchPayouts = async () => {
      const payoutsQuery = query(
        collection(db, "payouts"),
        where("farmer_id", "==", user.uid)
      );
      const snapshot = await getDocs(payoutsQuery);
      const payoutsData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payout[];
      payoutsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPayouts(payoutsData);
    };
    fetchPayouts();
  }, [user]);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.net_profit <= 0) return;

    setProcessing(true);
    setSuccess(false);

    try {
      const payoutRef = await addDoc(collection(db, "payouts"), {
        farmer_id: user.uid,
        amount: user.net_profit,
        bank_account: bankAccount,
        ifsc_code: ifscCode,
        status: "processing",
        created_at: new Date().toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await updateDoc(doc(db, "payouts", payoutRef.id), {
        status: "completed",
      });

      await updateDoc(doc(db, "users", user.uid), {
        net_profit: 0,
        total_sales: 0,
        total_platform_fees: 0,
      });

      setSuccess(true);
      setBankAccount("");
      setIfscCode("");

      const payoutsQuery = query(
        collection(db, "payouts"),
        where("farmer_id", "==", user.uid)
      );
      const snapshot = await getDocs(payoutsQuery);
      const newPayouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payout[];
      newPayouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPayouts(newPayouts);
    } catch (err) {
      console.error("Payout error:", err);
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
      <Navbar role="farmer" netProfit={user.net_profit} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Wallet className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{t.payout.title}</h1>
        </div>

        {success && (
          <OrderSuccess onClose={() => { setSuccess(false); window.location.reload(); }} title="Payout Initiated!" subtitle="Your payout is being processed" />
        )}

        <div className="bg-white rounded-xl p-6 border border-primary/10 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-foreground/50">{t.payout.totalSales}</p>
            <p className="font-medium">₹{user.total_sales.toLocaleString("en-IN")}</p>
          </div>
          <p className="text-foreground/50 mb-1">{t.payout.balance}</p>
          <p className="text-4xl font-bold text-primary mb-6">
            ₹{user.net_profit.toLocaleString("en-IN")}
          </p>

          {user.net_profit > 0 ? (
            <form onSubmit={handlePayout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.payout.bankAccount}
                </label>
                <input
                  type="text"
                  required
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.payout.ifsc}
                </label>
                <input
                  type="text"
                  required
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processing ? t.payout.processing : `${t.payout.requestPayout} ₹${user.net_profit.toLocaleString("en-IN")}`}
              </button>
            </form>
          ) : (
            <p className="text-foreground/40 text-center py-4">
              No balance available for payout
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-primary/10">
          <h2 className="font-bold text-lg mb-4">{t.payout.history}</h2>
          {payouts.length === 0 ? (
            <p className="text-foreground/40 text-center py-4">{t.payout.noPayouts}</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between py-3 border-b border-primary/5 last:border-0"
                >
                  <div>
                    <p className="font-bold">₹{payout.amount.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-foreground/40">
                      {payout.bank_account.slice(0, 4)}****{payout.bank_account.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {payout.status === "completed" ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" />
                        {t.payout.completed}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-600 px-2.5 py-1 rounded-full font-medium">
                        <Clock className="w-3 h-3" />
                        {t.payout.processingStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
