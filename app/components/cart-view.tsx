"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { useToast } from "../lib/toast-context";
import type { Cart } from "../lib/types";

export function CartView() {
  const { user, loading: authLoading } = useAuth();
  const { applyCart } = useCart();
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    apiFetch<Cart>("/api/cart")
      .then((res) => {
        if (active) {
          setCart(res.data);
          applyCart(res.data);
        }
      })
      .catch((err) => { if (active) toast(err instanceof Error ? err.message : "Error cargando bolsa", "error"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, toast]);

  async function updateQuantity(id: string, quantity: number) {
    setPendingAction(`quantity:${id}`);
    try {
      const res = await apiFetch<Cart>(`/api/cart/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(res.data);
      applyCart(res.data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo actualizar", "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function removeItem(id: string) {
    setPendingAction(`remove:${id}`);
    try {
      const res = await apiFetch<Cart>(`/api/cart/items/${id}`, { method: "DELETE" });
      setCart(res.data);
      applyCart(res.data);
      toast("Producto eliminado de la bolsa", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error eliminando", "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function checkout() {
    setPendingAction("checkout");
    try {
      await apiFetch("/api/orders", { method: "POST" });
      const emptyCart = { items: [], total: 0 };
      setCart(emptyCart);
      applyCart(emptyCart);
      toast("Pedido creado correctamente", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo crear el pedido", "error");
    } finally {
      setPendingAction(null);
    }
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto max-w-[600px] px-5 py-16 lg:px-10">
        <div className="empty-state">
          <h1 className="text-3xl font-bold">Inicia sesion</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">Necesitas una cuenta para guardar productos en tu bolsa.</p>
          <Link className="button-primary mt-6 inline-flex" href="/auth">Iniciar sesion</Link>
        </div>
      </main>
    );
  }

  const isLoading = authLoading || loading;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <div className="page-hero mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Bolsa de compra</h1>
          <p className="mt-2 text-sm text-[var(--mute)]">{cart.items.length} {cart.items.length === 1 ? "producto" : "productos"} en tu bolsa</p>
        </div>
        <Link href="/" className="button-secondary">Seguir comprando</Link>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-[20px] bg-[var(--soft-cloud)]" />)}
        </div>
      ) : cart.items.length === 0 ? (
        <section className="empty-state mt-8">
          <h2 className="text-2xl font-bold">Tu bolsa esta vacia</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">Explora la seleccion y agrega tus productos favoritos.</p>
          <Link className="button-primary mt-6 inline-flex" href="/">Ir a comprar</Link>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3">
            {cart.items.map((item) => (
              <article key={item.id} className="panel grid gap-4 p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center">
                <div className="product-image-stage relative aspect-square overflow-hidden">
                  <ProductImage src={item.product.thumbnail} alt={item.product.name} fill className="object-contain" sizes="100px" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--mute)]">{item.product.category}</p>
                  <h2 className="text-sm font-bold text-[var(--ink)]">{item.product.name}</h2>
                  <p className="mt-1 text-sm text-[var(--charcoal)]">S/{item.product.price} x {item.quantity} = <strong>S/{item.subtotal}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="quantity-button" type="button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={pendingAction !== null}>-</button>
                  <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                  <button className="quantity-button" type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={pendingAction !== null}>+</button>
                  <button className="quantity-button !bg-red-50 !text-[var(--sale)]" type="button" onClick={() => removeItem(item.id)} disabled={pendingAction !== null}>&#10005;</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="panel h-fit p-6 lg:sticky lg:top-32">
            <h3 className="text-sm font-bold uppercase text-[var(--mute)]">Resumen</h3>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">S/{cart.total}</span></div>
              <div className="flex justify-between"><span>Envio</span><span className="font-bold text-[var(--success)]">{cart.total >= 99 ? "Gratis" : "S/9.99"}</span></div>
              <div className="mt-2 flex justify-between border-t border-[var(--hairline-soft)] pt-2 text-lg font-bold">
                <span>Total</span>
                <span>S/{cart.total >= 99 ? cart.total : (cart.total + 9.99).toFixed(2)}</span>
              </div>
            </div>
            <button className="button-primary mt-6 w-full" type="button" onClick={checkout} disabled={cart.items.length === 0 || pendingAction !== null}>
              {pendingAction === "checkout" ? "Creando pedido..." : "Confirmar pedido"}
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
