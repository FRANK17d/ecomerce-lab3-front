"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";

export function SiteNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { itemCount } = useCart();

  const links = [
    { href: "/", label: "Tienda" },
    ...(user
      ? [
          { href: "/account", label: "Mi cuenta" },
          { href: "/cart", label: "Bolsa" },
          { href: "/orders", label: "Pedidos" },
        ]
      : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto text-sm font-medium sm:text-base">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "nav-link nav-link-active" : "nav-link"}
            href={link.href}
            key={link.href}
          >
            <span className="nav-link-label">
              {link.label}
              {link.href === "/cart" && itemCount > 0 ? (
                <span className="nav-cart-badge" aria-label={`${itemCount} en la bolsa`}>
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
      {loading ? null : user ? (
        <Link className="nav-link-strong ml-0 sm:ml-2" href="/account">
          {user.name}
        </Link>
      ) : (
        <Link className="nav-link" href="/auth">Iniciar sesion</Link>
      )}
    </div>
  );
}
