"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { PuzzleMark } from "@/components/puzzle-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/orientacion", label: "Por dónde empezar" },
  { href: "/directorio", label: "Búsquedas", related: "/busquedas" },
  { href: "/articulos", label: "Artículos" },
  { href: "/comunidad", label: "Colaborar" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          className="brand"
          href="/"
          aria-label="autismo.ar — Inicio"
          onClick={() => setMenuOpen(false)}
        >
          <PuzzleMark className="brand-mark" />
          <span>
            autismo<span className="brand-domain">.ar</span>
          </span>
        </Link>
        <nav
          id="main-navigation"
          aria-label="Navegación principal"
          className={`navigation ${menuOpen ? "is-open" : ""}`}
        >
          {links.map(({ href, label, related }) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href
                  ? "page"
                  : pathname.startsWith(`${href}/`) ||
                      (related &&
                        (pathname === related ||
                          pathname.startsWith(`${related}/`)))
                    ? "location"
                    : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            className="account-link"
            href="/cuenta"
            aria-current={pathname.startsWith("/cuenta") ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Mi cuenta
          </Link>
          <Link
            className="button button-small"
            href="/aportar"
            onClick={() => setMenuOpen(false)}
          >
            <Plus size={17} aria-hidden="true" /> Aportar información
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <button
            type="button"
            className="menu-toggle icon-button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
