"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { Leaf, ShoppingCart } from "lucide-react";

export default function LandingClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (role: "farmer" | "consumer") => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already has a role
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // First time — save profile with chosen role
        await setDoc(doc(db, "users", user.uid), {
          email: user.email || "",
          full_name: user.displayName || "",
          role: role,
          bank_account: "",
          ifsc_code: "",
          net_profit: 0,
          created_at: new Date().toISOString(),
        });
      }

      // Store role locally for quick checks
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", user.uid);

      // Redirect to appropriate dashboard
      router.push(role === "farmer" ? "/farmer/dashboard" : "/consumer/browse");
    } catch (err) {
      console.error("Sign in error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Leaf className="w-12 h-12 text-primary" />
          <h1 className="text-5xl font-bold text-primary tracking-tight">
            FarmerHub
          </h1>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          {t.landing.title}
        </h2>
        <p className="text-lg text-foreground/60 max-w-md mx-auto">
          {t.landing.subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <button
          onClick={() => handleSignIn("farmer")}
          disabled={loading}
          className="group flex-1 bg-primary hover:bg-primary-dark text-white rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer disabled:opacity-50"
        >
          <Leaf className="w-10 h-10 mx-auto mb-4 group-hover:rotate-12 transition-transform" />
          <h3 className="text-xl font-bold mb-2">{t.landing.farmer}</h3>
          <p className="text-white/80 text-sm">{t.landing.farmerDesc}</p>
        </button>

        <button
          onClick={() => handleSignIn("consumer")}
          disabled={loading}
          className="group flex-1 bg-white border-2 border-primary/20 hover:border-primary hover:bg-muted text-foreground rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer disabled:opacity-50"
        >
          <ShoppingCart className="w-10 h-10 mx-auto mb-4 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold mb-2 text-primary">
            {t.landing.consumer}
          </h3>
          <p className="text-foreground/60 text-sm">{t.landing.consumerDesc}</p>
        </button>
      </div>
    </div>
  );
}
