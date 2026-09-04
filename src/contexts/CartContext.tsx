"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CartItem {
  cropId: string;
  cropName: string;
  price: number;
  unit: string;
  farmerId: string;
  farmerName: string;
  imageUrl: string;
  maxQuantity: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (cropId: string) => void;
  updateQuantity: (cropId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cropId === item.cropId);
      if (existing) {
        return prev.map((i) =>
          i.cropId === item.cropId
            ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((cropId: string) => {
    setItems((prev) => prev.filter((i) => i.cropId !== cropId));
  }, []);

  const updateQuantity = useCallback((cropId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.cropId === cropId
          ? { ...i, quantity: Math.max(1, Math.min(i.maxQuantity, quantity)) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
