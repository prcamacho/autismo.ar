import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bus,
  Check,
  GraduationCap,
  HandHeart,
  Heart,
  MapPin,
  MessagesSquare,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { ResourceSearch } from "@/components/resource-search";
import { CommunityArt } from "@/components/community-art";
import { PuzzleMark } from "@/components/puzzle-mark";
import { categories } from "@/lib/catalog";
import { CommunitySteps } from "@/features/community/components";

const categoryIcons = {
  profesionales: Stethoscope,
  centros: Heart,
  educacion: GraduationCap,
  transporte: Bus,
  derechos: ShieldCheck,
  comunidad: UsersRound,
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              EN CADA PROVINCIA, UN POCO MÁS CERCA
            </p>
            <h1>
              Encontrar apoyo.
              <br />
              <span>
                Compartir
                <br className="desktop-break" /> el camino.
              </span>
            </h1>
            <p>
              Un espacio para personas autistas y sus familias. Para encontrar
              información, compartir recursos y acompañarnos en cada etapa de la
              vida.
            </p>
            <Link className="hero-link" href="/orientacion">
              Encontrá por dónde empezar <ArrowRight size={18} />
            </Link>
            <div className="hero-footnote">
              <Heart size={16} /> Desde la experiencia. Con lugar para todos.
            </div>
          </div>
          <CommunityArt />
        </div>
        <div className="container search-container">
          <div className="search-card">
            <ResourceSearch />
            <div className="search-note">
              <span>
                <MapPin size={14} /> Ayuda local e información para todo el
                país.
              </span>
              <Link href="/directorio">
                Explorar el directorio <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section explore-section" id="explorar">
        <div className="section-heading">
          <div>
            <p className="eyebrow">UN PUNTO DE PARTIDA</p>
            <h2>¿En qué podemos ayudarte?</h2>
            <p>
              Distintas necesidades. Un mismo lugar para encontrar orientación.
            </p>
          </div>
          <Link className="text-link" href="/directorio">
            Ver todas las categorías <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const Icon = categoryIcons[category.id];
            return (
              <Link
                className={`category-card category-${index}`}
                href={`/directorio?categoria=${category.id}`}
                key={category.id}
              >
                <span className="icon-box">
                  <Icon size={25} strokeWidth={1.65} />
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
                <ArrowUpRight className="category-arrow" size={20} />
              </Link>
            );
          })}
        </div>
        <div className="starting-note">
          <span className="status-dot" />
          <p>
            Estamos dando los primeros pasos. El directorio irá creciendo con
            información de la comunidad.
          </p>
        </div>
      </section>

      <section className="orientation-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">INFORMACIÓN QUE ACOMPAÑA</p>
              <h2>
                Cada recorrido es diferente.
                <br />
                No hace falta conocer todas las respuestas.
              </h2>
            </div>
            <p className="section-aside">
              Este espacio reúne caminos posibles para buscar orientación,
              conocer apoyos y compartir experiencias, a tu ritmo.
            </p>
          </div>
          <div className="info-grid">
            <article className="info-card">
              <span className="small-icon">
                <BookOpen />
              </span>
              <h3>Cuando estás empezando</h3>
              <p>
                Podés comenzar por los recursos generales y armar tus preguntas
                para conversar con un profesional.
              </p>
              <Link href="/orientacion" className="text-link">
                Encontrar por dónde empezar <ArrowRight size={16} />
              </Link>
            </article>
            <article className="info-card">
              <span className="small-icon">
                <HandHeart />
              </span>
              <h3>En cada etapa de la vida</h3>
              <p>
                Infancia, adolescencia y adultez tienen lugar acá. Queremos
                reunir apoyos para las necesidades de cada persona.
              </p>
              <Link href="/directorio" className="text-link">
                Encontrar apoyos <ArrowRight size={16} />
              </Link>
            </article>
            <article className="info-card">
              <span className="small-icon">
                <MessagesSquare />
              </span>
              <h3>Lo que sabés puede ayudar</h3>
              <p>
                Un contacto, un horario actualizado o un recurso útil pueden
                hacer más sencillo el día de otra familia.
              </p>
              <Link href="/comunidad" className="text-link">
                Conocer la comunidad <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="ian-feature">
          <div className="ian-visual" aria-hidden="true">
            <span className="visual-dot vd-one" />
            <span className="visual-dot vd-two" />
            <div className="app-tile">
              <PuzzleMark />
              <span>Ian</span>
            </div>
            <span className="ian-small-note">
              <Heart size={14} /> Un proyecto nacido en familia
            </span>
          </div>
          <div className="ian-copy">
            <span className="badge badge-warm">
              <Smartphone size={14} /> NUESTRO PRIMER PROYECTO
            </span>
            <h2>
              La app de Ian.
              <br />
              De nuestra familia a la tuya.
            </h2>
            <p>
              Queremos compartir el proyecto que nos trajo hasta acá. Su versión
              beta ya está disponible en línea para usar desde el navegador.
            </p>
            <Link
              href="/recursos/app-de-ian"
              className="button button-secondary"
            >
              Conocé el proyecto <ArrowUpRight size={17} />
            </Link>
            <span className="subtle-note">
              Podés usarla en línea y conocer cómo instalarla en tu dispositivo.
            </span>
          </div>
        </div>
      </section>

      <section className="container section section-last">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LO CONSTRUIMOS ENTRE PERSONAS</p>
            <h2>El dato que compartís sigue ayudando.</h2>
            <p>
              Una ficha puede aparecer en varias búsquedas. Sus fuentes y
              cambios quedan en el mismo lugar.
            </p>
          </div>
          <Link href="/comunidad" className="text-link">
            Cómo participar <ArrowRight size={17} />
          </Link>
        </div>
        <div className="section-small">
          <CommunitySteps />
        </div>
        <div className="community-banner">
          <div className="community-banner-icon">
            <UsersRound size={34} strokeWidth={1.5} />
          </div>
          <div>
            <p className="eyebrow">EL PRÓXIMO APORTE PUEDE SER EL TUYO</p>
            <h2>Una red se construye de a uno.</h2>
            <p>
              Lo que aprendiste en el camino puede ayudar a alguien que recién
              empieza.
            </p>
          </div>
          <Link href="/aportar" className="button">
            <Plus size={18} /> Quiero aportar
          </Link>
        </div>
        <div className="principles-strip">
          <span>
            <Check size={16} /> Información con contexto
          </span>
          <span>
            <ShieldCheck size={16} /> Independencia partidaria
          </span>
          <span>
            <Sparkles size={16} /> Todas las edades, todo el país
          </span>
        </div>
      </section>
    </>
  );
}
