"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import CropCard from "@/components/CropCard";

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
  farmer_id: string;
  farmer_name: string;
  created_at: string;
}

const categories = ["all", "vegetables", "fruits", "grains", "pulses", "spices", "dairy", "other"];

export default function ConsumerBrowse() {
  const { user, loading: authLoading } = useAuth("consumer");
  const { t } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      const cropsQuery = query(
        collection(db, "crops"),
        where("is_sold", "==", false)
      );
      const snapshot = await getDocs(cropsQuery);

      const cropsData = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          let farmerName = "Unknown Farmer";
          try {
            const farmerDoc = await getDoc(doc(db, "users", data.farmer_id));
            if (farmerDoc.exists()) {
              farmerName = farmerDoc.data().full_name || "Unknown Farmer";
            }
          } catch {
            // ignore
          }
          return {
            id: d.id,
            ...data,
            farmer_name: farmerName,
          };
        })
      ) as Crop[];

      cropsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCrops(cropsData);
      setLoading(false);
    };
    fetchCrops();
  }, []);

  const filtered = activeCategory === "all"
    ? crops
    : crops.filter((c) => c.category === activeCategory);

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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t.consumer.browse}</h1>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white border border-primary/20 text-foreground/60 hover:bg-muted"
              }`}
            >
              {cat === "all" ? t.consumer.all : t.farmer.categories[cat as keyof typeof t.farmer.categories]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-foreground/50">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-foreground/40">
            No crops available in this category
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((crop) => (
              <CropCard
                key={crop.id}
                id={crop.id}
                imageUrl={crop.image_url}
                cropName={crop.crop_name}
                price={crop.price_per_unit}
                unit={crop.unit}
                location={crop.location}
                farmerName={crop.farmer_name}
                isSold={crop.is_sold}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
