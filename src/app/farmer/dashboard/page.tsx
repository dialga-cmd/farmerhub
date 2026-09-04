"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import { uploadToImgBB } from "@/lib/imgbb";
import { Sprout, CheckCircle } from "lucide-react";

export default function FarmerDashboard() {
  const { user, loading: authLoading } = useAuth("farmer");
  const { t } = useLanguage();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    cropName: "",
    category: "vegetables",
    pricePerUnit: "",
    unit: "kg",
    quantityAvailable: "",
    location: "",
    harvestDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBlob || !user) return;

    setUploading(true);
    setSuccess(false);

    try {
      const imageUrl = await uploadToImgBB(imageBlob);

      const { collection, addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "crops"), {
        farmer_id: user.uid,
        image_url: imageUrl,
        crop_name: form.cropName,
        category: form.category,
        price_per_unit: parseFloat(form.pricePerUnit),
        unit: form.unit,
        quantity_available: parseFloat(form.quantityAvailable),
        location: form.location,
        harvest_date: form.harvestDate || null,
        is_sold: false,
        created_at: new Date().toISOString(),
      });

      setSuccess(true);
      setForm({
        cropName: "",
        category: "vegetables",
        pricePerUnit: "",
        unit: "kg",
        quantityAvailable: "",
        location: "",
        harvestDate: "",
      });
      setImageBlob(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setUploading(false);
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
          <Sprout className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{t.farmer.title}</h1>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5" />
            {t.farmer.success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <ImageUploader onImageReady={(blob) => setImageBlob(blob)} />

          <div className="bg-white rounded-xl p-6 border border-primary/10 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                {t.farmer.cropName}
              </label>
              <input
                type="text"
                required
                value={form.cropName}
                onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Fresh Tomatoes"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.farmer.category}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="vegetables">{t.farmer.categories.vegetables}</option>
                  <option value="fruits">{t.farmer.categories.fruits}</option>
                  <option value="grains">{t.farmer.categories.grains}</option>
                  <option value="pulses">{t.farmer.categories.pulses}</option>
                  <option value="spices">{t.farmer.categories.spices}</option>
                  <option value="dairy">{t.farmer.categories.dairy}</option>
                  <option value="other">{t.farmer.categories.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.farmer.unit}
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="kg">{t.farmer.units.kg}</option>
                  <option value="quintal">{t.farmer.units.quintal}</option>
                  <option value="dozen">{t.farmer.units.dozen}</option>
                  <option value="piece">{t.farmer.units.piece}</option>
                  <option value="litre">{t.farmer.units.litre}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.farmer.pricePerUnit}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                  {t.farmer.quantityAvailable}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={form.quantityAvailable}
                  onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                {t.farmer.location}
              </label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Nashik, Maharashtra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                {t.farmer.harvestDate}
              </label>
              <input
                type="date"
                value={form.harvestDate}
                onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!imageBlob || uploading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? t.farmer.uploading : t.farmer.confirm}
          </button>
        </form>
      </main>
    </div>
  );
}
