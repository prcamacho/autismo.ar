"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Bus,
  Check,
  CheckCircle2,
  HeartHandshake,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  BENEFITS,
  CATEGORIES,
  NOMENCLATOR_SOURCE,
  searchBenefits,
  type Benefit,
  type CategoryId,
} from "./catalog";
import styles from "./preview.module.css";

const icons = {
  terapias: HeartHandshake,
  educacion: BookOpen,
  centros: Building2,
  transporte: Bus,
};
const INITIAL_RESULTS = 5;

export function NomenclatorPreview({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | "">("");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Benefit | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const selectionHeading = useRef<HTMLHeadingElement>(null);
  const firstExpandedHeading = useRef<HTMLHeadingElement>(null);
  const results = searchBenefits(query, category);
  const visible = showAll ? results : results.slice(0, INITIAL_RESULTS);
  const activeCategory = CATEGORIES.find((item) => item.id === category);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnnouncement(
        `${results.length} prestaciones en esta muestra. ${Math.min(showAll ? results.length : INITIAL_RESULTS, results.length)} visibles.`,
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [results.length, query, category, showAll]);

  useEffect(() => {
    if (selected) selectionHeading.current?.focus();
  }, [selected]);

  useEffect(() => {
    if (showAll) firstExpandedHeading.current?.focus();
  }, [showAll]);

  function resetFilters() {
    setQuery("");
    setCategory("");
    setShowAll(false);
    input.current?.focus();
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.content}`}>
        <div className={styles.topline}>
          <Link href="/busquedas" className={styles.back}>
            <ArrowLeft size={16} aria-hidden="true" /> Volver a Búsquedas
          </Link>
          <span className={styles.badge}>Vista previa · test</span>
        </div>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>BÚSQUEDAS POR PRESTACIÓN</p>
          <h1>¿Qué apoyo buscás?</h1>
          <p>
            Escribí lo que necesitás o explorá por categoría.
            <br className={styles.desktopBreak} /> Te ayudamos a encontrar el
            nombre de la prestación.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.explorer}>
            <search
              className={styles.searchPanel}
              aria-label="Explorar prestaciones"
            >
              <label htmlFor="benefit-query">Buscá con tus palabras</label>
              <div className={styles.searchBox}>
                <Search size={23} aria-hidden="true" />
                <input
                  ref={input}
                  id="benefit-query"
                  name="prestacion"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAll(false);
                  }}
                  placeholder="Ej.: fono, apoyo escolar, transporte…"
                  aria-describedby="benefit-hint"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Borrar búsqueda"
                    onClick={() => {
                      setQuery("");
                      setShowAll(false);
                      input.current?.focus();
                    }}
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                )}
              </div>
              <p id="benefit-hint" className={styles.hint}>
                Las sugerencias orientan la búsqueda. Elegí la prestación que
                corresponda.
              </p>
              <div className={styles.categoryHeading}>
                <h2>O explorá una categoría</h2>
                {category && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      setCategory("");
                      setShowAll(false);
                    }}
                  >
                    Ver todas
                  </button>
                )}
              </div>
              <div className={styles.categories}>
                {CATEGORIES.map((item) => {
                  const Icon = icons[item.id];
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={styles.category}
                      data-category={item.id}
                      aria-pressed={category === item.id}
                      onClick={() => {
                        setCategory(category === item.id ? "" : item.id);
                        setShowAll(false);
                      }}
                    >
                      <span className={styles.categoryIcon}>
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <strong>{item.name}</strong>
                      <span className={styles.categoryHint}>{item.hint}</span>
                      {category === item.id && (
                        <Check
                          className={styles.categoryCheck}
                          size={17}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </search>

            <section
              className={styles.results}
              aria-labelledby="benefit-results"
            >
              <div className={styles.resultsHeading}>
                <div>
                  <h2 id="benefit-results">
                    {query.trim()
                      ? "Prestaciones relacionadas"
                      : activeCategory
                        ? activeCategory.name
                        : "Algunas prestaciones para empezar"}
                  </h2>
                  <p>
                    {results.length}{" "}
                    {results.length === 1 ? "prestación" : "prestaciones"} en
                    esta muestra
                    {activeCategory ? ` · ${activeCategory.name}` : ""}
                  </p>
                </div>
                {(query || category) && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={resetFilters}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              <span className={styles.srOnly} role="status">
                {announcement}
              </span>
              {query.trim() && results.length > 0 && (
                <p className={styles.matchHint}>
                  Una misma especialidad puede relacionarse con más de una
                  prestación. Revisá el nombre antes de elegir.
                </p>
              )}
              {results.length ? (
                <ul className={styles.resultList} role="list">
                  {visible.map((item, index) => {
                    const chosen = selected?.id === item.id;
                    const Icon = icons[item.category];
                    return (
                      <li
                        key={item.id}
                        className={styles.result}
                        data-selected={chosen}
                      >
                        <span className={styles.resultIcon}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <div className={styles.resultText}>
                          <h3
                            ref={
                              index === INITIAL_RESULTS
                                ? firstExpandedHeading
                                : undefined
                            }
                            tabIndex={
                              index === INITIAL_RESULTS ? -1 : undefined
                            }
                          >
                            {item.name}
                          </h3>
                          <p>{item.description}</p>
                        </div>
                        <button
                          type="button"
                          className={styles.chooseButton}
                          aria-label={`${chosen ? "Elegida" : "Elegir"}: ${item.name}`}
                          aria-pressed={chosen}
                          onClick={() => {
                            setSelected(item);
                            if (chosen) selectionHeading.current?.focus();
                          }}
                        >
                          {chosen ? (
                            <>
                              <Check size={17} aria-hidden="true" /> Elegida
                            </>
                          ) : (
                            <>
                              Elegir <ArrowRight size={16} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.empty}>
                  <Search size={28} aria-hidden="true" />
                  <h3>No encontramos una coincidencia</h3>
                  <p>
                    Probá con otra palabra
                    {category ? " o quitá la categoría seleccionada" : ""}. Esta
                    vista incluye solo una muestra del nomenclador.
                  </p>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={resetFilters}
                  >
                    Volver a explorar
                  </button>
                </div>
              )}
              {!showAll && results.length > INITIAL_RESULTS && (
                <button
                  type="button"
                  className={styles.showMore}
                  onClick={() => setShowAll(true)}
                >
                  Ver las {results.length} prestaciones de la muestra{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </section>
          </div>

          <aside className={styles.sidebar} aria-label="Tu selección">
            <div className={styles.selection} data-filled={Boolean(selected)}>
              <span className={styles.selectionIcon}>
                {selected ? (
                  <CheckCircle2 size={25} aria-hidden="true" />
                ) : (
                  <SlidersHorizontal size={25} aria-hidden="true" />
                )}
              </span>
              <h2 ref={selectionHeading} tabIndex={-1}>
                {selected ? "Prestación elegida" : "Tu búsqueda empieza acá"}
              </h2>
              {selected ? (
                <>
                  <p className={styles.selectedCategory}>
                    {
                      CATEGORIES.find((item) => item.id === selected.category)
                        ?.name
                    }
                  </p>
                  <p className={styles.selectedName}>{selected.name}</p>
                  <p>Así se vería la prestación asociada a tu búsqueda.</p>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setSelected(null);
                      input.current?.focus();
                    }}
                  >
                    Cambiar prestación
                  </button>
                </>
              ) : (
                <>
                  <p>
                    Elegí una prestación para ver cómo quedaría seleccionada.
                  </p>
                  <ol className={styles.steps}>
                    <li>Buscá o explorá una categoría.</li>
                    <li>Revisá las opciones.</li>
                    <li>Elegí la que corresponda.</li>
                  </ol>
                </>
              )}
              <p className={styles.previewNote}>
                Esta es una prueba: no guarda datos, no envía solicitudes ni
                filtra publicaciones reales.
              </p>
            </div>
            <div className={styles.about}>
              <BookOpen size={19} aria-hidden="true" />
              <h2>Un nombre en común</h2>
              <p>
                La idea es vincular cada búsqueda a una prestación del
                nomenclador, manteniendo la especialidad o el rol profesional
                por separado.
              </p>
            </div>
          </aside>
        </div>

        <details className={styles.reference}>
          <summary>Sobre esta muestra y el nomenclador</summary>
          <p>
            Incluye {BENEFITS.length} prestaciones para probar la navegación; no
            es el catálogo completo. Las cuatro categorías son una organización
            de autismo.ar. Los términos habituales ayudan a encontrar opciones y
            no establecen equivalencias automáticas.
          </p>
          <p>
            La selección no acredita cobertura ni habilitación profesional. Las
            descripciones son breves orientaciones, no reemplazan la definición
            normativa.
          </p>
          <a href={NOMENCLATOR_SOURCE} target="_blank" rel="noreferrer">
            Consultar la Resolución 428/1999 actualizada (abre en otra pestaña)
          </a>
        </details>
        <noscript>
          <p>
            Para probar la búsqueda y la selección necesitás habilitar
            JavaScript. Podés consultar la fuente oficial desde el enlace
            anterior.
          </p>
        </noscript>
      </div>
    </div>
  );
}
