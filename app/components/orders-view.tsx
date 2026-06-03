"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";
import type { Order } from "../lib/types";

export function OrdersView() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    apiFetch<Order[]>("/api/orders/my")
      .then((res) => { if (active) setOrders(res.data); })
      .catch((err) => { if (active) toast(err instanceof Error ? err.message : "Error cargando pedidos", "error"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [user, authLoading, toast]);

  if (!authLoading && !user) {
    return (
      <main className="mx-auto max-w-[600px] px-5 py-16 lg:px-10">
        <div className="empty-state">
          <h1 className="text-3xl font-bold">Inicia sesion</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">Necesitas una cuenta para ver tus pedidos.</p>
          <Link className="button-primary mt-6 inline-flex" href="/auth">Iniciar sesion</Link>
        </div>
      </main>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <div className="page-hero mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Mis pedidos</h1>
        <p className="mt-2 text-sm text-[var(--mute)]">Consulta el estado y detalle de tus compras.</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-[20px] bg-[var(--soft-cloud)]" />)}
        </div>
      ) : orders.length === 0 ? (
        <section className="empty-state">
          <h2 className="text-2xl font-bold">Aun no tienes pedidos</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">Cuando termines una compra, aparecera aqui.</p>
          <Link className="button-primary mt-6 inline-flex" href="/">Ir a comprar</Link>
        </section>
      ) : (
        <section className="grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="panel p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[var(--mute)]">{new Date(order.createdAt).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <h2 className="text-lg font-bold">Pedido #{order.id.slice(0, 8)}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || ""}`}>
                    {order.status}
                  </span>
                  <p className="text-xl font-bold">S/{order.total}</p>
                </div>
              </div>
              {order.OrderItems && order.OrderItems.length > 0 ? (
                <ul className="mt-4 grid gap-1 border-t border-[var(--hairline-soft)] pt-3">
                  {order.OrderItems.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-[var(--charcoal)]">{item.quantity}x {item.productName}</span>
                      <span className="font-medium">S/{item.subtotal}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
