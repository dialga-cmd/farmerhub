"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface OrderSuccessProps {
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function OrderSuccess({ onClose, title = "Order Placed!", subtitle = "Thank you for supporting local farmers" }: OrderSuccessProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/40" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => {
          const colors = ["#22c55e", "#eab308", "#3b82f6", "#f97316", "#ec4899", "#8b5cf6"];
          const color = colors[i % colors.length];
          const left = Math.random() * 100;
          const delay = Math.random() * 1.5;
          const duration = 2 + Math.random() * 2;
          const size = 6 + Math.random() * 8;
          const rotation = Math.random() * 360;
          return (
            <div
              key={i}
              className="absolute confetti-piece"
              style={{
                left: `${left}%`,
                top: "-20px",
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: i % 3 === 0 ? "50%" : "2px",
                transform: `rotate(${rotation}deg)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      <div
        className={`relative bg-white rounded-3xl p-10 shadow-2xl text-center transform transition-all duration-500 ${
          visible ? "scale-100 translate-y-0" : "scale-75 translate-y-10"
        }`}
      >
        <div className="success-ring mx-auto mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">{title}</h2>
        <p className="text-foreground/50 mb-1">{subtitle}</p>
        <p className="text-sm text-foreground/30">This window will close automatically</p>
      </div>
    </div>
  );
}
