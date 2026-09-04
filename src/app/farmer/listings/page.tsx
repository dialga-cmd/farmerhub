"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { List, Package, MapPin } from "lucide-react";

interface Crop {
  id: string;
  image_url: string;
  crop_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  location: string;
  is_sold: boolean;
  created_at: string;
}

export default function FarmerListings() {
  const { user, loading: authLoading } = useAuth("farmer");
  const { t } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCrops = async () => {
      const cropsQuery = query(
        collection(db, "crops"),
        where("farmer_id", "==", user.uid)
      );
      const snapshot = await getDocs(cropsQuery);
      const cropsData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Crop[];
      cropsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCrops(cropsData);
      setLoading(false);
    };
    fetchCrops();
  }, [user]);

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <List className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{t.nav.listings}</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-foreground/50">Loading...</div>
        ) : crops.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/50">No listings yet. Upload your first crop!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="bg-white rounded-xl border border-primary/10 overflow-hidden"
              >
                <img
                  src={crop.image_url}
                  alt={crop.crop_name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{crop.crop_name}</h3>
                    {crop.is_sold ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {t.consumer.soldOut}
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-primary font-bold text-xl">
                    ₹{crop.price_per_unit}/{crop.unit}
                  </p>
                  <p className="text-sm text-foreground/50 mt-1">
                    {crop.quantity_available} {crop.unit} {t.consumer.available}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-foreground/50">
                    <MapPin className="w-3 h-3" />
                    {crop.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
