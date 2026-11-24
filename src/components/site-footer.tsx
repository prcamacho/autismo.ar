import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PuzzleMark } from "@/components/puzzle-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link className="brand" href="/">
            <PuzzleMark className="brand-mark" />
            <span>
              autismo<span className="brand-domain">.ar</span>
            </span>
          </Link>
          <p>
            Información que orienta.
            <br />
            Una comunidad que conecta.
          </p>
        </div>
        <div>
          <span className="footer-heading">Explorar</span>
          <Link href="/orientacion">Por dónde empezar</Link>
          <Link href="/directorio">Directorio</Link>
          <Link href="/busquedas">Búsquedas y disponibilidad</Link>
          <Link href="/articulos">Artículos</Link>
          <Link href="/recursos">Biblioteca</Link>
        </div>
        <div>
          <span className="footer-heading">Participar</span>
          <Link href="/proyecto">Sobre el proyecto</Link>
          <Link href="/comunidad">Comunidad</Link>
          <Link href="/aportar">Aportar información</Link>
          <Link href="/cuenta">Mi cuenta</Link>
        </div>
        <div className="footer-help">
          <span className="footer-heading">Salud mental</span>
          <p>
            Encontrá orientación profesional en los canales oficiales de salud
            mental.
          </p>
          <a
            href="https://www.argentina.gob.ar/salud/mental-y-adicciones"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar canales oficiales <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} autismo.ar</span>
      </div>
    </footer>
  );
}
