"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";
import type { Product } from "../lib/types";

export function Storefront() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [pendingCartIds, setPendingCartIds] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, Product[]>>(new Map());

  function getCacheKey() {
    return `${category}|${search}|${sort}`;
  }

  useEffect(() => {
    apiFetch<string[]>("/api/products/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const key = getCacheKey();
    const cached = cacheRef.current.get(key);

    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ limit: "30", sort });
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    apiFetch<Product[]>(`/api/products?${params.toString()}`)
      .then((res) => {
        if (active) {
          setProducts(res.data);
          cacheRef.current.set(key, res.data);
        }
      })
      .catch((err) => {
        if (active) toast(err instanceof Error ? err.message : "Error cargando productos", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, sort]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cacheRef.current.delete(getCacheKey());
    setLoading(true);
    const params = new URLSearchParams({ limit: "30", sort });
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    apiFetch<Product[]>(`/api/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data);
        cacheRef.current.set(getCacheKey(), res.data);
      })
      .catch((err) => toast(err instanceof Error ? err.message : "Error buscando", "error"))
      .finally(() => setLoading(false));
  }

  async function addToCart(productId: string) {
    if (!user) {
      toast("Inicia sesion para agregar productos a tu bolsa", "info");
      return;
    }
    setPendingCartIds((prev) => new Set(prev).add(productId));
    try {
      await apiFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      toast("Producto agregado a tu bolsa", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo agregar", "error");
    } finally {
      setPendingCartIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  const heroProduct = products[0];
  const featuredProducts = products.slice(1, 4);
  const visibleCategories = categories.slice(0, 8);

  function prettyCategory(value: string) {
    return value.replaceAll("-", " ");
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      {/* Hero */}
      <section className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[32px] bg-[var(--ink)] p-8 text-[var(--canvas)] sm:p-10">
          {heroProduct ? (
            <Image src={heroProduct.thumbnail} alt={heroProduct.name} fill className="object-contain object-right-bottom p-6 opacity-20 sm:opacity-40 sm:p-10" loading="eager" sizes="(min-width: 1024px) 60vw, 100vw" />
          ) : null}
          <div className="relative z-10 flex min-h-[280px] flex-col justify-between">
            <div>
              <p className="text-2xl font-bold sm:text-4xl lg:text-5xl">Bienvenido a Stride District</p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
                Explora {products.length} productos en {categories.length} categorias. Envio gratis en pedidos mayores a S/99.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="button-secondary inline-flex items-center !bg-white !text-[var(--ink)]" href="#catalogo">Explorar catalogo</a>
              {!user ? <Link className="inline-flex items-center rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10" href="/auth">Crear cuenta gratis</Link> : null}
            </div>
          </div>
        </div>
        <aside className="grid gap-4">
          <div className="rounded-[28px] bg-[var(--soft-cloud)] p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Tu cuenta</p>
            <p className="mt-2 text-xl font-bold text-[var(--ink)]">{user ? user.name : "Visitante"}</p>
            <p className="text-sm text-[var(--mute)]">{user ? user.email : "Inicia sesion para comprar"}</p>
            <Link className="button-primary mt-4 inline-flex w-full justify-center !text-sm" href={user ? "/account" : "/auth"}>
              {user ? "Mi cuenta" : "Iniciar sesion"}
            </Link>
            {user ? (
              <Link className="button-secondary mt-2 inline-flex w-full justify-center !text-sm" href="/cart">
                Ver mi bolsa
              </Link>
            ) : null}
            {user?.role === "admin" ? (
              <Link className="button-secondary mt-2 inline-flex w-full justify-center !text-sm" href="/admin">
                Panel de administracion
              </Link>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-[var(--hairline-soft)] p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Resumen tienda</p>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--mute)]">Productos</span><strong>{products.length}</strong></div>
              <div className="flex justify-between"><span className="text-[var(--mute)]">Categorias</span><strong>{categories.length}</strong></div>
              <div className="flex justify-between"><span className="text-[var(--mute)]">Envio gratis</span><strong>Desde S/99</strong></div>
              <div className="flex justify-between"><span className="text-[var(--mute)]">Devoluciones</span><strong>30 dias</strong></div>
            </div>
          </div>
        </aside>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 ? (
        <section id="destacados" className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="section-title">Destacados</h2>
            <Link href="/cart" className="text-sm font-medium text-[var(--mute)] underline">Ver bolsa</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <article key={product.id} className="editorial-card">
                <Image src={product.thumbnail} alt={product.name} fill className="object-contain p-8" sizes="(min-width: 768px) 33vw, 100vw" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-[var(--canvas)]">
                  <p className="text-xs font-medium uppercase text-white/75">{prettyCategory(product.category)}</p>
                  <h3 className="mt-1 text-lg font-bold leading-tight">{product.name}</h3>
                  <p className="mt-1 text-lg font-bold">S/{product.price}</p>
                  <button className="mt-3 rounded-full bg-[var(--canvas)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-opacity hover:opacity-80 disabled:opacity-60" type="button" onClick={() => addToCart(product.id)} disabled={pendingCartIds.has(product.id)}>
                    {pendingCartIds.has(product.id) ? "Agregando..." : "Agregar a bolsa"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Filters */}
      <section className="mt-12 hairline-top py-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="section-title">Catalogo</h2>
          <div className="flex flex-wrap gap-2">
            <button className={category ? "filter-chip" : "filter-chip filter-chip-active"} type="button" onClick={() => setCategory("")}>Todo</button>
            {visibleCategories.map((item) => (
              <button className={category === item ? "filter-chip filter-chip-active" : "filter-chip"} key={item} type="button" onClick={() => setCategory(item)}>
                {prettyCategory(item)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              className="field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
            />
            <button className="button-primary shrink-0" type="submit">Buscar</button>
          </form>
          <select className="field lg:w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Mas recientes</option>
            <option value="price_asc">Precio menor</option>
            <option value="price_desc">Precio mayor</option>
            <option value="name_asc">Nombre A-Z</option>
          </select>
        </div>
      </section>

      {/* Product Grid */}
      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card animate-pulse">
              <div className="product-image-stage aspect-[4/3]" />
              <div className="mt-3 space-y-2 px-1">
                <div className="h-3 w-1/3 rounded bg-[var(--hairline-soft)]" />
                <div className="h-4 w-2/3 rounded bg-[var(--hairline-soft)]" />
                <div className="h-3 w-full rounded bg-[var(--hairline-soft)]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <section id="catalogo" className="mt-8">
          <div className="metadata-row mb-4">
            <span>{products.length} productos</span>
            <span>{category ? prettyCategory(category) : "Toda la tienda"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <article key={product.id} className="product-card flex flex-col">
                <div className="product-image-stage relative aspect-[4/3]">
                  <Image src={product.thumbnail} alt={product.name} fill className="object-contain" loading={index === 0 ? "eager" : "lazy"} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  {index < 4 ? <span className="absolute left-3 top-3 rounded-full bg-[var(--canvas)] px-3 py-1 text-xs font-medium shadow-sm">Nuevo</span> : null}
                </div>
                <div className="mt-3 flex flex-1 flex-col gap-2 px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--mute)]">{prettyCategory(product.category)}</p>
                  <h2 className="text-sm font-medium leading-5 text-[var(--ink)]">{product.name}</h2>
                  <p className="line-clamp-2 text-xs leading-4 text-[var(--stone)]">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div>
                      <p className="text-lg font-bold text-[var(--ink)]">S/{product.price}</p>
                      <p className="text-xs text-[var(--success)]">{product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}</p>
                    </div>
                    <button className="button-primary !min-h-[40px] !px-4 !text-sm" onClick={() => addToCart(product.id)} type="button" disabled={product.stock === 0 || pendingCartIds.has(product.id)}>
                      {pendingCartIds.has(product.id) ? "Agregando..." : product.stock > 0 ? "Agregar" : "Sin stock"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
