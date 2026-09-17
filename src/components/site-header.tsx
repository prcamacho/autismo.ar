"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, Plus, X } from "lucide-react";
import { PuzzleMark } from "@/components/puzzle-mark";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/directorio", label: "Encontrar ayuda" },
  { href: "/recursos", label: "Recursos" },
  { href: "/comunidad", label: "Comunidad" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="announcement">
        Una comunidad que empieza a crecer, con vos.{" "}
        <Link href="/proyecto">
          Conocé el proyecto <ArrowUpRight size={13} />
        </Link>
      </div>
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
          <button
            className="menu-toggle icon-button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav
            id="main-navigation"
            aria-label="Navegación principal"
            className={`navigation ${menuOpen ? "is-open" : ""}`}
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (href === "/" ? pathname === "/" : pathname.startsWith(href))
                    ? "page"
                    : undefined
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              className="button button-small"
              href="/aportar"
              onClick={() => setMenuOpen(false)}
            >
              <Plus size={17} /> Aportar información
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
