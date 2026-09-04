"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  role: "farmer" | "consumer";
  net_profit: number;
  total_sales: number;
  total_platform_fees: number;
}

export function useAuth(requiredRole?: "farmer" | "consumer") {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (!userDoc.exists()) {
        router.push("/");
        return;
      }

      const data = userDoc.data();
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email || "",
        full_name: data.full_name || "",
        role: data.role,
        net_profit: data.net_profit || 0,
        total_sales: data.total_sales || 0,
        total_platform_fees: data.total_platform_fees || 0,
      };

      // Role mismatch — redirect to correct dashboard
      if (requiredRole && profile.role !== requiredRole) {
        router.push(profile.role === "farmer" ? "/farmer/dashboard" : "/consumer/browse");
        return;
      }

      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, requiredRole]);

  return { user, loading };
}
