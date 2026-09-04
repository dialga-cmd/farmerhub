"use client";

import { useState, useRef } from "react";
import { convertToWebP } from "@/lib/imageUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, Camera, X, Check } from "lucide-react";

interface ImageUploaderProps {
  onImageReady: (blob: Blob, preview: string) => void;
}

export default function ImageUploader({ onImageReady }: ImageUploaderProps) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setConverting(true);
    try {
      const webpBlob = await convertToWebP(file);
      const previewUrl = URL.createObjectURL(webpBlob);
      setPreview(previewUrl);
      onImageReady(webpBlob, previewUrl);
    } catch (err) {
      console.error("Image conversion failed:", err);
    } finally {
      setConverting(false);
    }
  };

  const handleChange = () => {
    setPreview(null);
    onImageReady(null as unknown as Blob, "");
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Crop preview"
          className="w-full h-64 object-cover rounded-xl"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          <Check className="w-3 h-3" />
          WebP
        </div>
        <button
          onClick={handleChange}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-foreground/70" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={converting}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary rounded-xl py-8 text-primary/70 hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Upload className="w-6 h-6" />
          <span className="font-medium">{t.farmer.uploadImage}</span>
        </button>

        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={converting}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary rounded-xl py-8 text-primary/70 hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Camera className="w-6 h-6" />
          <span className="font-medium">{t.farmer.takePhoto}</span>
        </button>
      </div>

      {converting && (
        <p className="text-sm text-primary animate-pulse text-center">
          Converting to WebP...
        </p>
      )}
    </div>
  );
}
