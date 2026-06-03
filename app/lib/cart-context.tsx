"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";
import { useAuth } from "./auth-context";
import type { Cart } from "./types";

function countCartItems(cart: Cart) {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

type CartState = {
  itemCount: number;
  refreshCart: () => Promise<void>;
  applyCart: (cart: Cart) => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const applyCart = useCallback((cart: Cart) => {
    setItemCount(countCartItems(cart));
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItemCount(0);
      return;
    }

    try {
      const res = await apiFetch<Cart>("/api/cart");
      setItemCount(countCartItems(res.data));
    } catch {
      setItemCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshCart();
  }, [authLoading, refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart, applyCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
