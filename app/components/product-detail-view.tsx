"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { useToast } from "../lib/toast-context";
import type { Product } from "../lib/types";

function prettyCategory(value: string) {
  return value.replaceAll("-", " ");
}

export function ProductDetailView() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    apiFetch<Product>(`/api/products/${productId}`)
      .then((res) => {
        if (active) setProduct(res.data);
      })
      .catch((err) => {
        if (active) {
          setProduct(null);
          toast(err instanceof Error ? err.message : "Producto no encontrado", "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId, toast]);

  async function addToCart() {
    if (!product) return;
    if (!user) {
      toast("Inicia sesion para agregar productos a tu bolsa", "info");
      return;
    }
    setAdding(true);
    try {
      await apiFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      await refreshCart();
      toast("Producto agregado a tu bolsa", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo agregar", "error");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1100px] px-5 py-10 lg:px-10">
        <div className="h-8 w-40 animate-pulse rounded bg-[var(--hairline-soft)]" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[28px] bg-[var(--soft-cloud)]" />
          <div className="grid gap-4">
            <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--hairline-soft)]" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-[var(--hairline-soft)]" />
            <div className="h-24 animate-pulse rounded bg-[var(--hairline-soft)]" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-[600px] px-5 py-16 lg:px-10">
        <div className="empty-state">
          <h1 className="text-3xl font-bold">Producto no encontrado</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">El producto no existe o ya no esta disponible.</p>
          <Link className="button-primary mt-6 inline-flex" href="/">
            Volver al catalogo
          </Link>
        </div>
      </main>
    );
  }

  const extraImages = (product.images || []).filter((url) => url && url !== product.thumbnail);

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-10 lg:px-10">
      <Link href="/#catalogo" className="text-sm font-medium text-[var(--mute)] underline">
        Volver al catalogo
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="product-image-stage relative aspect-square">
          <ProductImage
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-contain p-8"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>

        <div className="grid gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">{prettyCategory(product.category)}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>
            {product.brand ? <p className="mt-2 text-sm text-[var(--mute)]">Marca: {product.brand}</p> : null}
          </div>

          <p className="text-3xl font-bold text-[var(--ink)]">S/{product.price}</p>

          <p className={`text-sm font-medium ${product.stock > 0 ? "text-[var(--success)]" : "text-[var(--sale)]"}`}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : "Agotado"}
          </p>

          <p className="text-sm leading-7 text-[var(--charcoal)]">{product.description}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="button-primary"
              type="button"
              onClick={addToCart}
              disabled={product.stock === 0 || adding}
            >
              {adding ? "Agregando..." : product.stock > 0 ? "Agregar a la bolsa" : "Sin stock"}
            </button>
            <Link className="button-secondary inline-flex items-center" href="/cart">
              Ver bolsa
            </Link>
          </div>

          {extraImages.length > 0 ? (
            <div className="hairline-top pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Mas imagenes</p>
              <div className="flex flex-wrap gap-3">
                {extraImages.map((url) => (
                  <div key={url} className="relative size-20 overflow-hidden rounded-[16px] border border-[var(--hairline-soft)] bg-[var(--soft-cloud)]">
                    <ProductImage src={url} alt="" fill className="object-contain p-1" sizes="80px" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
