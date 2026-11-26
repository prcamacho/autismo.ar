import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  GraduationCap,
  Heart,
  Plus,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { SearchForm } from "@/features/services/search-form";
import {
  HomeDirectoryLink,
  HomeSearchLocationProvider,
} from "@/features/services/home-search-location";
import { getServiceCatalog } from "@/features/services/repository";
import { CommunityArt } from "@/components/community-art";
import { categories } from "@/lib/catalog";

const categoryIcons = {
  profesionales: Stethoscope,
  centros: Heart,
  educacion: GraduationCap,
  transporte: Bus,
  derechos: ShieldCheck,
  comunidad: UsersRound,
};

export default async function Home() {
  await connection();
  const catalog = await getServiceCatalog();
  return (
    <HomeSearchLocationProvider>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>
              Información y recursos <span>sobre autismo en Argentina.</span>
            </h1>
            <p>
              Para personas autistas, familias y profesionales, en cada etapa de
              la vida.
            </p>
            <Link className="hero-link" href="/orientacion">
              Por dónde empezar <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="hero-art">
            <CommunityArt />
          </div>
        </div>
        <div className="container">
          <div className="search-card">
            <h2 className="home-search-heading">Búsquedas y disponibilidad</h2>
            <p className="home-search-description">
              Encontrá profesionales disponibles o solicitudes de personas que
              buscan apoyo.
            </p>
            <SearchForm services={catalog.data} status={catalog.status} />
          </div>
        </div>
      </section>

      <section
        className="container section explore-section"
        aria-labelledby="explorar"
      >
        <div className="section-heading">
          <div>
            <h2 id="explorar" tabIndex={-1}>
              Directorio por categoría
            </h2>
            <p>Consultá fichas de servicios, instituciones y redes de apoyo.</p>
          </div>
          <HomeDirectoryLink className="text-link">
            Directorio <ArrowRight size={17} aria-hidden="true" />
          </HomeDirectoryLink>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const Icon = categoryIcons[category.id];
            return (
              <HomeDirectoryLink
                className={`category-card category-${index}`}
                category={category.id}
                key={category.id}
              >
                <span className="icon-box">
                  <Icon size={25} strokeWidth={1.65} aria-hidden="true" />
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
                <ArrowUpRight
                  className="category-arrow"
                  size={20}
                  aria-hidden="true"
                />
              </HomeDirectoryLink>
            );
          })}
        </div>
      </section>

      <section className="container section section-last">
        <div className="community-banner">
          <div className="community-banner-icon">
            <UsersRound size={34} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h2>Aportá o corregí información</h2>
            <p>
              Compartí un recurso con su fuente. Los aportes se revisan antes de
              publicarse.
            </p>
          </div>
          <Link href="/aportar" className="button">
            <Plus size={18} aria-hidden="true" /> Aportar información
          </Link>
        </div>
      </section>
    </HomeSearchLocationProvider>
  );
}
