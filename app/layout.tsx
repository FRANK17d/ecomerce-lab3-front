import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "./lib/auth-context";
import { ToastProvider } from "./lib/toast-context";
import { SiteNav } from "./components/site-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const anton = Anton({
  variable: "--font-campaign",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Stride District",
  description: "Tienda de calzado, tecnologia y accesorios para movimiento diario.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
        <ToastProvider>
        <header className="site-shell bg-[var(--canvas)]">
          <div className="utility-bar mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-3 sm:px-5 lg:px-10">
            <span className="hidden sm:inline">Stride District - Performance Essentials</span>
            <div className="flex items-center gap-4">
              <span>Envio gratis desde S/99</span>
              <span className="hidden md:inline">Cambios en 30 dias</span>
            </div>
          </div>
          <nav className="primary-nav mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0 lg:px-10">
            <Link href="/" className="group flex items-center gap-3" aria-label="Stride District home">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-sm font-bold text-[var(--canvas)] transition-transform active:scale-50 active:opacity-50">
                SD
              </span>
              <span>
                <span className="block text-base font-medium tracking-normal">
                  Stride District
                </span>
                <span className="block text-xs font-medium text-[var(--mute)]">
                  performance essentials
                </span>
              </span>
            </Link>
            <SiteNav />
          </nav>
        </header>
        {children}
        <footer className="mt-auto border-t border-[var(--hairline-soft)] bg-[var(--soft-cloud)]">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-3 sm:px-5 lg:px-10">
            <div>
              <p className="text-base font-bold text-[var(--ink)]">Stride District</p>
              <p className="mt-2 text-sm text-[var(--mute)]">Calzado, tecnologia y accesorios seleccionados para movimiento diario.</p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--ink)]">Navegacion</p>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--charcoal)]">
                <li><Link href="/">Tienda</Link></li>
                <li><Link href="/account">Mi cuenta</Link></li>
                <li><Link href="/cart">Bolsa de compra</Link></li>
                <li><Link href="/orders">Mis pedidos</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--ink)]">Soporte</p>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--charcoal)]">
                <li>Envio gratis desde S/99</li>
                <li>Cambios y devoluciones en 30 dias</li>
                <li>Atencion: soporte@stridedistrict.pe</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--hairline-soft)] px-5 py-4 text-center text-xs text-[var(--stone)]">
            2026 Stride District. Todos los derechos reservados.
          </div>
        </footer>
        </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
