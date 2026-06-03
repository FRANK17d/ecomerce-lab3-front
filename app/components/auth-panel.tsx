"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { useToast } from "../lib/toast-context";

export function AuthPanel() {
  const router = useRouter();
  const { user, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      if (mode === "login") {
        await login(email, password);
        toast("Bienvenido de vuelta", "success");
      } else {
        await register(name, email, password);
        toast("Cuenta creada correctamente", "success");
      }
      router.push("/account");
    } catch (error) {
      toast(error instanceof Error ? error.message : "No se pudo autenticar", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast("Sesion cerrada", "info");
  }

  if (user) {
    return (
      <main className="mx-auto max-w-[600px] px-5 py-16 lg:px-10">
        <div className="panel p-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[var(--soft-cloud)] text-2xl font-bold text-[var(--ink)]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-[var(--mute)]">{user.email}</p>
          <p className="mt-1 inline-flex rounded-full bg-[var(--soft-cloud)] px-3 py-1 text-xs font-medium uppercase">{user.role}</p>
          <div className="mt-8 grid gap-3">
            <Link className="button-primary inline-flex w-full justify-center" href="/account">Mi cuenta</Link>
            <Link className="button-secondary inline-flex w-full justify-center" href="/orders">Mis pedidos</Link>
            <Link className="button-secondary inline-flex w-full justify-center" href="/cart">Mi bolsa</Link>
            {user.role === "admin" ? (
              <Link className="button-secondary inline-flex w-full justify-center" href="/admin">Panel admin</Link>
            ) : null}
            <button className="mt-4 text-sm font-medium text-[var(--sale)] underline" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-160px)] max-w-[1440px] gap-5 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
      <section className="relative overflow-hidden rounded-[32px] bg-[var(--ink)] p-7 text-[var(--canvas)] sm:p-10">
        <div className="relative z-10">
          <p className="text-xs font-medium text-[var(--stone)]">Cuenta Stride</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Guarda tu bolsa. Sigue tus pedidos.</h1>
          <p className="mt-5 max-w-xl text-base leading-6 text-[var(--stone)]">
            Accede a lanzamientos, historial de compra y una experiencia de checkout mas rapida.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-white/70">
            <li className="flex items-center gap-2"><span className="text-[var(--success-bright)]">&#10003;</span> Guardar productos en tu bolsa</li>
            <li className="flex items-center gap-2"><span className="text-[var(--success-bright)]">&#10003;</span> Seguimiento de pedidos en tiempo real</li>
            <li className="flex items-center gap-2"><span className="text-[var(--success-bright)]">&#10003;</span> Checkout mas rapido la proxima vez</li>
          </ul>
        </div>
        <Link className="absolute bottom-7 left-7 text-sm font-medium text-white/70 underline sm:bottom-10 sm:left-10" href="/">
          Volver a la tienda
        </Link>
      </section>
      <section className="panel p-6 sm:p-8 lg:p-10">
        <div className="mb-8 flex rounded-full bg-[var(--soft-cloud)] p-1">
          <button
            className={`flex-1 rounded-full py-3 text-center text-sm font-medium transition-colors ${mode === "login" ? "bg-[var(--ink)] text-[var(--canvas)]" : "text-[var(--mute)]"}`}
            type="button"
            onClick={() => setMode("login")}
          >
            Iniciar sesion
          </button>
          <button
            className={`flex-1 rounded-full py-3 text-center text-sm font-medium transition-colors ${mode === "register" ? "bg-[var(--ink)] text-[var(--canvas)]" : "text-[var(--mute)]"}`}
            type="button"
            onClick={() => setMode("register")}
          >
            Crear cuenta
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === "register" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--charcoal)]" htmlFor="name">Nombre</label>
              <input className="field" id="name" name="name" placeholder="Tu nombre completo" required minLength={2} />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)]" htmlFor="email">Email</label>
            <input className="field" id="email" name="email" placeholder="correo@ejemplo.com" type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)]" htmlFor="password">Contrasena</label>
            <input className="field" id="password" name="password" placeholder="Minimo 8 caracteres" type="password" required minLength={8} />
          </div>
          <button className="button-primary mt-2" disabled={loading} type="submit">
            {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}
