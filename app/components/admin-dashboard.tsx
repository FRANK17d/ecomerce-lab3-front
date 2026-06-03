"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";
import type { Order, Product } from "../lib/types";

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type BadgeVariant = "new" | "edit" | "saving" | "active" | "inactive";

function AdminBadge({ children, variant }: { children: ReactNode; variant: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    new: "bg-blue-100 text-blue-800 ring-blue-200",
    edit: "bg-amber-100 text-amber-900 ring-amber-200",
    saving: "bg-[var(--soft-cloud)] text-[var(--charcoal)] ring-[var(--hairline-soft)] animate-pulse",
    active: "bg-green-100 text-[var(--success)] ring-green-200",
    inactive: "bg-red-50 text-[var(--sale)] ring-red-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${styles[variant]}`}>
      {children}
    </span>
  );
}

function ProductThumb({ src, alt, size = "md" }: { src: string; alt: string; size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const box = size === "sm" ? "size-12" : size === "lg" ? "h-48 w-full" : "h-28 w-full";

  if (!src || failed) {
    return (
      <div className={`${box} shrink-0 rounded-[12px] bg-[var(--soft-cloud)] grid place-items-center text-[10px] text-[var(--mute)]`}>
        Sin img
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${box} shrink-0 rounded-[12px] border border-[var(--hairline-soft)] bg-[var(--soft-cloud)] object-contain p-1`}
      onError={() => setFailed(true)}
    />
  );
}

function ProductDetailPanel({
  product,
  onClose,
  onEdit,
  onDeactivate,
  onActivate,
  busyAction,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  busyAction: string | null;
}) {
  const extraImages = (product.images || []).filter((url) => url && url !== product.thumbnail);

  return (
    <div className="panel mt-4 grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">Detalle del producto</h3>
          <AdminBadge variant={product.isActive ? "active" : "inactive"}>
            {product.isActive ? "Activo" : "Inactivo"}
          </AdminBadge>
        </div>
        <button className="text-sm font-medium text-[var(--mute)] underline" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_1fr]">
        <ProductThumb src={product.thumbnail} alt={product.name} size="lg" />
        <div className="grid gap-2 text-sm">
          <p className="text-xl font-bold">{product.name}</p>
          {product.brand ? <p className="text-[var(--mute)]">Marca: {product.brand}</p> : null}
          <p className="text-[var(--mute)]">
            {product.category} &middot; Stock: <strong className="text-[var(--ink)]">{product.stock}</strong> &middot; Precio:{" "}
            <strong className="text-[var(--ink)]">S/{product.price}</strong>
          </p>
          <p className="text-xs text-[var(--stone)]">ID: {product.id}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Descripcion</p>
        <p className="text-sm leading-relaxed text-[var(--charcoal)]">{product.description}</p>
      </div>

      {extraImages.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Imagenes adicionales</p>
          <div className="flex flex-wrap gap-2">
            {extraImages.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block size-16 overflow-hidden rounded-[12px] border border-[var(--hairline-soft)]">
                <img src={url} alt="" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--hairline-soft)] pt-4">
        <button className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100" type="button" onClick={onEdit} disabled={busyAction !== null}>
          Editar
        </button>
        {product.isActive ? (
          <button className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-[var(--sale)] hover:bg-red-100" type="button" onClick={onDeactivate} disabled={busyAction !== null}>
            Desactivar
          </button>
        ) : (
          <button className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-[var(--success)] hover:bg-green-100" type="button" onClick={onActivate} disabled={busyAction !== null}>
            Activar
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setPreviewUrl(editingProduct?.thumbnail || "");
  }, [editingProduct, formMode]);

  async function loadProducts() {
    const productsResponse = await apiFetch<Product[]>("/api/admin/products?limit=60");
    setProducts(productsResponse.data);
  }

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    let active = true;
    Promise.all([
      apiFetch<Product[]>("/api/admin/products?limit=60"),
      apiFetch<Order[]>("/api/admin/orders"),
    ])
      .then(([p, o]) => {
        if (active) {
          setProducts(p.data);
          setOrders(o.data);
        }
      })
      .catch((err) => { if (active) toast(err instanceof Error ? err.message : "Error cargando admin", "error"); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, authLoading]);

  async function importProducts() {
    setBusyAction("import");
    try {
      await apiFetch("/api/admin/products/import", {
        method: "POST",
        body: JSON.stringify({ limit: 30 }),
      });
      toast("Catalogo sincronizado desde API externa", "success");
      await loadProducts();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error importando", "error");
    } finally {
      setBusyAction(null);
    }
  }

  function buildProductPayload(form: FormData) {
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    const category = String(form.get("category") || "").trim();
    const brandRaw = String(form.get("brand") || "").trim();
    const thumbnail = String(form.get("thumbnail") || "").trim();
    const price = Number(form.get("price"));
    const stock = Number(form.get("stock"));

    if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres");
    if (description.length < 5) throw new Error("La descripcion debe tener al menos 5 caracteres");
    if (!category) throw new Error("La categoria es obligatoria");
    if (!Number.isFinite(price) || price <= 0) throw new Error("El precio debe ser mayor a 0");
    if (!Number.isFinite(stock) || stock < 0) throw new Error("El stock no puede ser negativo");
    if (!isValidImageUrl(thumbnail)) throw new Error("La URL de imagen debe ser http o https valida");

    return {
      name,
      description,
      price,
      stock,
      category,
      brand: brandRaw || null,
      thumbnail,
      images: [thumbnail],
      isActive: true,
    };
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    let data;
    try {
      data = buildProductPayload(form);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Datos invalidos", "error");
      return;
    }

    setBusyAction("product-form");
    try {
      if (formMode === "edit" && editingProduct) {
        const response = await apiFetch<Product>(`/api/admin/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        syncDetailProduct(response.data);
        toast("Producto actualizado", "success");
      } else {
        const response = await apiFetch<Product>("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setProducts((prev) => [response.data, ...prev].slice(0, 60));
        setDetailProduct(response.data);
        toast("Producto creado", "success");
      }
      formElement.reset();
      formRef.current?.reset();
      setPreviewUrl("");
      setFormMode("create");
      setEditingProduct(null);
      if (formMode === "edit" && editingProduct?.id === detailProduct?.id) {
        setDetailProduct(null);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error guardando producto", "error");
    } finally {
      setBusyAction(null);
    }
  }

  function startCreate() {
    setEditingProduct(null);
    setFormMode("create");
    setPreviewUrl("");
    formRef.current?.reset();
    document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openDetails(product: Product) {
    setDetailProduct(product);
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setFormMode("edit");
    setDetailProduct(product);
    document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingProduct(null);
    setFormMode("create");
    setPreviewUrl("");
    formRef.current?.reset();
  }

  function syncDetailProduct(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDetailProduct((current) => (current?.id === updated.id ? updated : current));
  }

  async function deactivateProduct(id: string) {
    setBusyAction(`product:${id}`);
    try {
      const response = await apiFetch<Product>(`/api/admin/products/${id}`, { method: "DELETE" });
      syncDetailProduct(response.data);
      toast("Producto desactivado", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error desactivando producto", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function activateProduct(id: string) {
    setBusyAction(`product:${id}`);
    try {
      const response = await apiFetch<Product>(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      syncDetailProduct(response.data);
      toast("Producto reactivado", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error reactivando producto", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateOrderStatus(id: string, status: Order["status"]) {
    setBusyAction(`order:${id}`);
    try {
      await apiFetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
      toast(`Estado actualizado a "${status}"`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error actualizando estado", "error");
    } finally {
      setBusyAction(null);
    }
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto max-w-[600px] px-5 py-16 lg:px-10">
        <div className="empty-state">
          <h1 className="text-3xl font-bold">Acceso restringido</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--mute)]">
            {user ? "Tu cuenta no tiene permisos de administrador." : "Inicia sesion con una cuenta admin."}
          </p>
          <Link className="button-primary mt-6 inline-flex" href={user ? "/" : "/auth"}>
            {user ? "Volver a la tienda" : "Iniciar sesion"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Panel de administracion</h1>
          <p className="mt-2 text-sm text-[var(--mute)]">{user?.email} &middot; {products.length} productos &middot; {orders.length} ordenes</p>
        </div>
        <button className="button-primary" type="button" onClick={importProducts} disabled={busyAction !== null}>
          {busyAction === "import" ? "Sincronizando..." : "Sincronizar catalogo"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Product list */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Productos</h2>
            <button
              className="rounded-full border border-[var(--hairline-soft)] px-4 py-2 text-xs font-bold transition-colors hover:bg-[var(--soft-cloud)]"
              type="button"
              onClick={startCreate}
              disabled={busyAction !== null}
            >
              + Agregar producto
            </button>
          </div>
          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-[16px] bg-[var(--soft-cloud)]" />)}</div>
          ) : (
            <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className={`flex items-center gap-3 rounded-[16px] border p-3 transition-colors ${
                    detailProduct?.id === product.id
                      ? "border-[var(--info)] bg-blue-50/40"
                      : editingProduct?.id === product.id
                        ? "border-[var(--ink)] bg-[var(--soft-cloud)]"
                        : "border-[var(--hairline-soft)]"
                  }`}
                >
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => openDetails(product)} disabled={busyAction !== null}>
                    <ProductThumb src={product.thumbnail} alt={product.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        {!product.isActive ? <AdminBadge variant="inactive">Inactivo</AdminBadge> : null}
                      </div>
                      <p className="text-xs text-[var(--mute)]">{product.category} &middot; Stock: {product.stock} &middot; S/{product.price}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <button className="rounded-full bg-[var(--soft-cloud)] px-3 py-1.5 text-xs font-bold text-[var(--charcoal)] transition-colors hover:bg-[var(--hairline-soft)] disabled:opacity-50" type="button" onClick={() => openDetails(product)} disabled={busyAction !== null}>
                      Detalles
                    </button>
                    <button className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50" type="button" onClick={() => startEdit(product)} disabled={busyAction !== null}>
                      Editar
                    </button>
                    {product.isActive ? (
                      <button className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-[var(--sale)] transition-colors hover:bg-red-100 disabled:opacity-50" type="button" onClick={() => deactivateProduct(product.id)} disabled={busyAction !== null}>
                        {busyAction === `product:${product.id}` ? "..." : "Desactivar"}
                      </button>
                    ) : (
                      <button className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-[var(--success)] transition-colors hover:bg-green-100 disabled:opacity-50" type="button" onClick={() => activateProduct(product.id)} disabled={busyAction !== null}>
                        {busyAction === `product:${product.id}` ? "..." : "Activar"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {detailProduct ? (
            <ProductDetailPanel
              product={detailProduct}
              onClose={() => setDetailProduct(null)}
              onEdit={() => startEdit(detailProduct)}
              onDeactivate={() => deactivateProduct(detailProduct.id)}
              onActivate={() => activateProduct(detailProduct.id)}
              busyAction={busyAction}
            />
          ) : null}
        </section>

        {/* Product form */}
        <section id="admin-product-form">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{formMode === "edit" ? "Editar producto" : "Crear producto"}</h2>
              {formMode === "create" ? (
                busyAction === "product-form" ? (
                  <AdminBadge variant="saving">Agregando...</AdminBadge>
                ) : (
                  <AdminBadge variant="new">Nuevo</AdminBadge>
                )
              ) : (
                <AdminBadge variant="edit">Editando</AdminBadge>
              )}
            </div>
            {formMode === "edit" ? (
              <button className="text-sm font-medium text-[var(--mute)] underline" type="button" onClick={cancelEdit}>Cancelar edicion</button>
            ) : null}
          </div>
          <form
            ref={formRef}
            onSubmit={handleProductSubmit}
            className={`panel grid gap-3 p-5 transition-shadow ${formMode === "create" ? "ring-2 ring-blue-200 ring-offset-2" : ""}`}
            key={editingProduct?.id || "create"}
          >
            <input className="field" name="name" placeholder="Nombre del producto" required defaultValue={editingProduct?.name || ""} />
            <textarea className="field min-h-20" name="description" placeholder="Descripcion (min. 5 caracteres)" required minLength={5} defaultValue={editingProduct?.description || ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" name="price" placeholder="Precio (S/)" type="number" min="0.01" step="0.01" required defaultValue={editingProduct?.price || ""} />
              <input className="field" name="stock" placeholder="Stock" type="number" min="0" required defaultValue={editingProduct?.stock ?? ""} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" name="category" placeholder="Categoria" required defaultValue={editingProduct?.category || ""} />
              <input className="field" name="brand" placeholder="Marca (opcional)" defaultValue={editingProduct?.brand || ""} />
            </div>
            <div className="grid gap-2">
              <input
                className="field"
                name="thumbnail"
                placeholder="https://ejemplo.com/imagen.jpg"
                type="url"
                required
                defaultValue={editingProduct?.thumbnail || ""}
                onChange={(e) => setPreviewUrl(e.target.value.trim())}
              />
              {previewUrl && isValidImageUrl(previewUrl) ? (
                <div className="rounded-[16px] border border-[var(--hairline-soft)] bg-[var(--soft-cloud)] p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mute)]">Vista previa</p>
                  <ProductThumb src={previewUrl} alt="Vista previa del producto" size="md" />
                </div>
              ) : previewUrl ? (
                <p className="text-xs text-[var(--sale)]">URL invalida. Usa un enlace que empiece con http:// o https://</p>
              ) : null}
            </div>
            <button className="button-primary" type="submit" disabled={busyAction !== null}>
              {busyAction === "product-form" ? "Guardando..." : formMode === "edit" ? "Guardar cambios" : "Crear producto"}
            </button>
          </form>

          {/* Orders */}
          <h2 className="mb-4 mt-8 text-xl font-bold">Ordenes recientes</h2>
          {loading ? (
            <div className="grid gap-3">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-[16px] bg-[var(--soft-cloud)]" />)}</div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-[var(--mute)]">No hay ordenes aun.</p>
          ) : (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
              {orders.map((order) => (
                <article key={order.id} className="rounded-[16px] border border-[var(--hairline-soft)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-[var(--mute)]">{order.User?.email || "usuario"} &middot; S/{order.total}</p>
                    </div>
                    <select className="field !min-h-[36px] !w-auto !text-xs" value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])} disabled={busyAction !== null}>
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="shipped">Enviado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
