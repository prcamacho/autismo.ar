import Link from "next/link";
import { Heart, ArrowUpRight } from "lucide-react";
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
            Una comunidad que acompaña.
          </p>
          <span className="footer-made">
            <Heart size={14} /> Hecho desde una familia, para compartir.
          </span>
        </div>
        <div>
          <span className="footer-heading">Encontrá tu camino</span>
          <Link href="/orientacion">Por dónde empezar</Link>
          <Link href="/directorio">Directorio de ayuda</Link>
          <Link href="/recursos">Recursos para todos</Link>
          <Link href="/recursos/app-de-ian">La app de Ian</Link>
        </div>
        <div>
          <span className="footer-heading">Construyamos juntos</span>
          <Link href="/proyecto">Sobre el proyecto</Link>
          <Link href="/comunidad">Nuestra comunidad</Link>
          <Link href="/aportar">Aportar información</Link>
          <Link href="/cuenta">Mi cuenta</Link>
        </div>
        <div className="footer-help">
          <span className="footer-heading">Si necesitás ayuda ahora</span>
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
        <span>
          © {new Date().getFullYear()} autismo.ar · Un proyecto en construcción
        </span>
        <span>Para todas las edades. En todo el país.</span>
      </div>
    </footer>
  );
}
