"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { MapPin, Calendar, User, ArrowLeft, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

interface Crop {
  id: string;
  image_url: string;
  crop_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  quantity_available: number;
  location: string;
  harvest_date: string;
  is_sold: boolean;
  farmer_id: string;
  farmer_name: string;
}

export default function CropDetail() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth("consumer");
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviews, setReviews] = useState<{ rating: number; created_at: string }[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    const fetchCrop = async () => {
      if (!params.id) return;

      const cropDoc = await getDoc(doc(db, "crops", params.id as string));
      if (cropDoc.exists()) {
        const data = cropDoc.data();
        let farmerName = "Unknown Farmer";
        try {
          const farmerDoc = await getDoc(doc(db, "users", data.farmer_id));
          if (farmerDoc.exists()) {
            farmerName = farmerDoc.data().full_name || "Unknown Farmer";
          }
        } catch {
          // ignore
        }

        setCrop({
          id: cropDoc.id,
          ...data,
          farmer_name: farmerName,
        } as Crop);

        const ratingsQuery = query(
          collection(db, "ratings"),
          where("crop_id", "==", cropDoc.id)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingDocs = ratingsSnapshot.docs.map((d) => d.data() as { rating: number; created_at: string });
        if (ratingDocs.length > 0) {
          const total = ratingDocs.reduce((sum, r) => sum + r.rating, 0);
          setAvgRating(total / ratingDocs.length);
          setRatingCount(ratingDocs.length);
          setReviews(
            ratingDocs
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
          );
        }

        if (user) {
          const txnsQuery = query(
            collection(db, "transactions"),
            where("buyer_id", "==", user.uid),
            where("farmer_id", "==", data.farmer_id)
          );
          const txnsSnapshot = await getDocs(txnsQuery);
          setHasPurchased(!txnsSnapshot.empty);

          const myRatingQuery = query(
            collection(db, "ratings"),
            where("crop_id", "==", cropDoc.id),
            where("buyer_id", "==", user.uid)
          );
          const myRatingSnapshot = await getDocs(myRatingQuery);
          if (!myRatingSnapshot.empty) {
            setUserRating(myRatingSnapshot.docs[0].data().rating);
            setRated(true);
          }
        }
      }
      setLoading(false);
    };
    fetchCrop();
  }, [params.id, user]);

  const handleAddToCart = () => {
    if (!crop) return;
    addItem({
      cropId: crop.id,
      cropName: crop.crop_name,
      price: crop.price_per_unit,
      unit: crop.unit,
      farmerId: crop.farmer_id,
      farmerName: crop.farmer_name,
      imageUrl: crop.image_url,
      maxQuantity: crop.quantity_available,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="consumer" />
        <div className="text-center py-12 text-foreground/50">Loading...</div>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="consumer" />
        <div className="text-center py-12 text-foreground/40">Crop not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="consumer" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/consumer/browse"
          className="flex items-center gap-2 text-foreground/50 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to browse
        </Link>

        <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden">
          <img
            src={crop.image_url}
            alt={crop.crop_name}
            className="w-full h-72 object-cover"
          />

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{crop.crop_name}</h1>
                {ratingCount > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={Math.round(avgRating)} readonly size="md" />
                    <span className="text-sm text-foreground/50">
                      {avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
                <p className="text-primary text-3xl font-bold">
                  ₹{crop.price_per_unit}{" "}
                  <span className="text-base font-normal text-foreground/50">
                    {t.consumer.per} {crop.unit}
                  </span>
                </p>
              </div>

              {!crop.is_sold && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-primary/20 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-lg font-bold hover:bg-muted transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(crop.quantity_available, quantity + 1))
                      }
                      className="px-3 py-2 text-lg font-bold hover:bg-muted transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer ${
                      added
                        ? "bg-green-500 text-white"
                        : "bg-primary hover:bg-primary-dark text-white"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5" />
                        {t.consumer.addedToCart}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {t.consumer.addToCart}
                      </>
                    )}
                  </button>
                </div>
              )}

              {crop.is_sold && (
                <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-bold">
                  {t.consumer.soldOut}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-primary/10">
              <div className="flex items-center gap-2 text-foreground/60">
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs text-foreground/40">{t.consumer.farmer}</p>
                  <p className="text-sm font-medium">{crop.farmer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-foreground/60">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-foreground/40">{t.consumer.location}</p>
                  <p className="text-sm font-medium">{crop.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-foreground/60">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="text-xs text-foreground/40">{t.consumer.harvested}</p>
                  <p className="text-sm font-medium">
                    {crop.harvest_date
                      ? new Date(crop.harvest_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="text-foreground/60">
                <p className="text-xs text-foreground/40">{t.consumer.quantity}</p>
                <p className="text-sm font-medium">
                  {crop.quantity_available} {crop.unit}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-primary/10">
              <p className="text-sm text-foreground/40">{t.consumer.total}</p>
              <p className="text-2xl font-bold text-primary">
                ₹{(crop.price_per_unit * quantity).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-primary/10 p-4 flex items-center gap-3">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-sm text-foreground/40">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasPurchased && !rated && (
          <div className="mt-8 bg-white rounded-xl border border-primary/10 p-6">
            <h2 className="text-lg font-bold mb-3">{t.payment.rateSeller}</h2>
            <div className="flex items-center gap-4">
              <StarRating rating={userRating} onRate={setUserRating} size="lg" />
              <button
                onClick={async () => {
                  if (userRating === 0) return;
                  await addDoc(collection(db, "ratings"), {
                    crop_id: crop.id,
                    farmer_id: crop.farmer_id,
                    buyer_id: user.uid,
                    rating: userRating,
                    created_at: new Date().toISOString(),
                  });
                  setRated(true);
                  setReviews([{ rating: userRating, created_at: new Date().toISOString() }, ...reviews]);
                  setRatingCount(ratingCount + 1);
                  setAvgRating((avgRating * ratingCount + userRating) / (ratingCount + 1));
                }}
                disabled={userRating === 0}
                className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 cursor-pointer"
              >
                {t.payment.submitRating}
              </button>
            </div>
          </div>
        )}

        {hasPurchased && rated && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <StarRating rating={userRating} readonly size="md" />
            <span className="text-sm text-yellow-700">{t.payment.thanksForRating}</span>
          </div>
        )}
      </main>
    </div>
  );
}
