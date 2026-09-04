"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { MapPin } from "lucide-react";
import StarRating from "./StarRating";

interface CropCardProps {
  id: string;
  imageUrl: string;
  cropName: string;
  price: number;
  unit: string;
  location: string;
  farmerName: string;
  isSold: boolean;
}

export default function CropCard({
  id,
  imageUrl,
  cropName,
  price,
  unit,
  location,
  farmerName,
  isSold,
}: CropCardProps) {
  const { t } = useLanguage();
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      const ratingsQuery = query(
        collection(db, "ratings"),
        where("crop_id", "==", id)
      );
      const snapshot = await getDocs(ratingsQuery);
      if (!snapshot.empty) {
        const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
        setAvgRating(total / snapshot.size);
        setRatingCount(snapshot.size);
      }
    };
    fetchRatings();
  }, [id]);

  return (
    <Link
      href={`/consumer/crop/${id}`}
      className="bg-white rounded-xl border border-primary/10 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={cropName}
          className="w-full h-44 object-cover"
        />
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold text-sm">
              {t.consumer.soldOut}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{cropName}</h3>
        <p className="text-primary font-bold text-xl">
          ₹{price} <span className="text-sm font-normal text-foreground/50">{t.consumer.per} {unit}</span>
        </p>
        {ratingCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={Math.round(avgRating)} readonly size="sm" />
            <span className="text-xs text-foreground/40">
              {avgRating.toFixed(1)} ({ratingCount})
            </span>
          </div>
        )}
        <p className="text-sm text-foreground/50 mt-1">by {farmerName}</p>
        <div className="flex items-center gap-1 mt-2 text-sm text-foreground/40">
          <MapPin className="w-3 h-3" />
          {location}
        </div>
      </div>
    </Link>
  );
}
