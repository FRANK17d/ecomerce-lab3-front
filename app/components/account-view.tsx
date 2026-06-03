"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";
import type { Cart, Order } from "../lib/types";

export function AccountView() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      return;
    }

    let active = true;

    Promise.allSettled([apiFetch<Order[]>("/api/orders/my"), apiFetch<Cart>("/api/cart")] as const)
      .then(([ordersResult, cartResult]) => {
        if (!active) return;

        if (ordersResult.status === "fulfilled") setOrders(ordersResult.value.data);
        if (cartResult.status === "fulfilled") setCart(cartResult.value.data);

        if (ordersResult.status === "rejected" || cartResult.status === "rejected") {
          toast("No se pudo cargar todo el resumen de tu cuenta", "error");
        }
      })
      .finally(() => {
        if (active) setLoadedUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user, toast]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      toast("Sesion cerrada", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo cerrar sesion", "error");
    } finally {
      setLoggingOut(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto max-w-[720px] px-5 py-16 lg:px-10">
        <div className="empty-state">
          <h1 className="text-3xl font-bold">Mi cuenta</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">
            Inicia sesion para ver tus datos, pedidos, bolsa y accesos de cuenta.
          </p>
          <Link className="button-primary mt-6 inline-flex" href="/auth">
            Iniciar sesion
          </Link>
        </div>
      </main>
    );
  }

  const latestOrder = orders[0];
  const spent = orders.reduce((sum, order) => sum + order.total, 0);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const roleLabel = user?.role === "admin" ? "Administrador" : "Cliente";
  const loading = Boolean(user && loadedUserId !== user.id);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <section className="page-hero mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Mi cuenta</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{user?.name || "Cuenta"}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--mute)]">
            Datos de sesion, resumen de compras y accesos rapidos para gestionar tu experiencia en Stride District.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="button-secondary inline-flex" href="/">
            Ir a comprar
          </Link>
          <button className="button-danger" type="button" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Cerrando..." : "Cerrar sesion"}
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="panel h-fit p-6 sm:p-8">
          <div className="grid size-20 place-items-center rounded-full bg-[var(--ink)] text-3xl font-bold text-[var(--canvas)]">
            {user?.name.charAt(0).toUpperCase() || "S"}
          </div>
          <div className="mt-6 grid gap-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Nombre</p>
              <p className="mt-1 font-bold text-[var(--ink)]">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Correo</p>
              <p className="mt-1 break-all font-bold text-[var(--ink)]">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Tipo de cuenta</p>
              <p className="mt-1 inline-flex rounded-full bg-[var(--soft-cloud)] px-3 py-1 font-bold text-[var(--ink)]">
                {roleLabel}
              </p>
            </div>
          </div>
        </aside>

        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="panel p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Pedidos</p>
              <p className="mt-2 text-3xl font-bold">{loading ? "..." : orders.length}</p>
            </article>
            <article className="panel p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Bolsa</p>
              <p className="mt-2 text-3xl font-bold">{loading ? "..." : cartCount}</p>
            </article>
            <article className="panel p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Compras</p>
              <p className="mt-2 text-3xl font-bold">S/{loading ? "..." : spent.toFixed(2)}</p>
            </article>
          </div>

          <section className="panel p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Accesos rapidos</h2>
                <p className="mt-1 text-sm text-[var(--mute)]">Gestiona lo mas importante desde un solo lugar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="button-secondary inline-flex !min-h-[42px] !px-5 !text-sm" href="/cart">
                  Mi bolsa
                </Link>
                <Link className="button-secondary inline-flex !min-h-[42px] !px-5 !text-sm" href="/orders">
                  Mis pedidos
                </Link>
                {user?.role === "admin" ? (
                  <Link className="button-primary inline-flex !min-h-[42px] !px-5 !text-sm" href="/admin">
                    Panel admin
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <h2 className="text-xl font-bold">Ultimo movimiento</h2>
            {loading ? (
              <div className="mt-4 h-20 animate-pulse rounded-[18px] bg-[var(--soft-cloud)]" />
            ) : latestOrder ? (
              <div className="mt-4 rounded-[18px] bg-[var(--soft-cloud)] p-4">
                <p className="text-sm font-bold">Pedido #{latestOrder.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {latestOrder.status} &middot; S/{latestOrder.total} &middot; {new Date(latestOrder.createdAt).toLocaleDateString("es")}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] bg-[var(--soft-cloud)] p-4">
                <p className="text-sm font-bold">Aun no tienes pedidos</p>
                <p className="mt-1 text-sm text-[var(--mute)]">Cuando confirmes una compra, el resumen aparecera aqui.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
