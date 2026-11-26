# autismo.ar

Base de una red de información y recursos sobre autismo en Argentina, para personas autistas, familias y profesionales. La portada combina información general, búsqueda por ubicación y participación comunitaria.

## Antes de trabajar

Leé [VISION_Y_PLAN.md](./VISION_Y_PLAN.md) para entender el objetivo, las etapas y las decisiones pendientes. [AGENTS.md](./AGENTS.md) orienta a las IAs que continúen el proyecto. Este README describe lo que existe técnicamente.

La [guía de desarrollo](./docs/DESARROLLO.md) establece alcance, selección de modelos, organización del código y verificaciones. La [guía de operación](./docs/OPERACION.md) describe el flujo `test`/`main`, las comprobaciones y los controles todavía pendientes. Las decisiones importantes se conservan en el [registro de decisiones](./docs/DECISIONES.md). La documentación distingue configuraciones comprobadas de propuestas; su existencia no activa servicios ni controles.

## Ejecutar

Requiere Node.js 22 o superior y npm. En PowerShell, si la política de ejecución bloquea `npm`, usá `npm.cmd`.

```sh
npm ci
npm run dev
```

Copiá `.env.example` a `.env.local` cuando vayas a activar el circuito comunitario, siguiendo su guía. La escuela de Ian es una aplicación independiente: autismo.ar no contiene su visor, proxy, manifiesto ni configuración de origen.

Abrí http://localhost:3000. Si el puerto está ocupado, Next indica el puerto alternativo. El servidor de desarrollo escucha solo en la máquina local.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Qué está implementado

- Portada con presentación compacta, buscador de búsquedas y disponibilidad, categorías del directorio y una invitación a participar. La navegación distingue Directorio, Búsquedas y disponibilidad y Artículos; Biblioteca y Proyecto quedan en el pie. No hay franja de anuncios sobre la cabecera. La identidad SVG y el diseño adaptable se conservan; la ilustración se oculta en móvil para priorizar la búsqueda.
- Modo claro y oscuro en todas las secciones, con botón de sol/luna en la cabecera pública, visible también en móvil y sin necesidad de iniciar sesión. Sigue el tema del dispositivo hasta elegir uno manualmente; recuerda esa elección en este navegador y la sincroniza entre pestañas.
- Directorio con categorías, 23 provincias y CABA, selección de localidades oficiales y filtros compartibles en la URL.
- Contrato de búsqueda que conserva recursos nacionales y provinciales pertinentes al filtrar una localidad.
- Biblioteca en preparación, con estado vacío explícito y sin recursos ficticios.
- Orientación por necesidades que conserva provincia y localidad al consultar el directorio; filtro de edades atendidas.
- Circuito comunitario modular: ingreso por código de correo, aportes, correcciones, revisión inicial, corroboración de datos, decisión de moderación, historial y reportes.
- Artículos y agendas: editor por bloques, resúmenes para compartir, perfil editorial con Cafecito opcional, borradores privados, moderación e historial. Implementación y activación separadas; ver [guía de artículos](./docs/ARTICULOS.md).
- Búsquedas de personas y familias, perfiles profesionales, disponibilidad en varias ubicaciones y contacto privado por aceptación. Migraciones y pruebas remotas completas; estado resultante de activación y mantenimiento en la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10). Ver [guía de Búsquedas](./docs/BUSQUEDAS.md) y [catálogo territorial oficial](./docs/UBICACIONES.md).
- Formularios con validación en servidor y migración PostgreSQL con políticas RLS, permisos y límites de frecuencia.
- Búsqueda de posibles duplicados y fichas canónicas con fuentes y fechas. Recuperar una versión genera una propuesta nueva.
- Sin conexión configurada: descarga y carga de borradores JSON en el dispositivo, con estado explícito de **no enviado**.
- Estados vacíos honestos, navegación con teclado y página 404.
- Pruebas de búsqueda, validación y flujo real de permisos/transacciones en PostgreSQL local (PGlite).

El catálogo público de recursos está vacío intencionalmente. Las pruebas usan datos sintéticos locales o cuentas temporales de la base aislada de ensayo; los guiones remotos confirmaron su limpieza y no cargan datos ficticios en producción. El chat privado que orientó las necesidades no se importa ni se publica.

**Preparación del 17 de noviembre de 2026, previa a la PR #10:** la conexión comunitaria de producción y el ingreso por código se comprobaron el 11 de noviembre. Búsquedas y Artículos tienen ahora sus migraciones aplicadas en las bases separadas de ensayo y producción, y un responsable de moderación asignado. Pasaron 69 pruebas locales, lint, TypeScript, compilación y los recorridos remotos de ambos módulos, más el mantenimiento real de ensayo. Durante esa preparación se mantuvieron las funciones apagadas en producción; el estado resultante y su evidencia se registran en la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10). Los avisos por correo permanecen deshabilitados con presupuesto cero. Ver [Búsquedas](./docs/BUSQUEDAS.md), [Artículos](./docs/ARTICULOS.md) y [operación](./docs/OPERACION.md) para alcance y pendientes.

## Qué falta

Consultar la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10) para el resultado del despliegue y del mantenimiento productivo. Ampliar la revisión visual autenticada del piloto en ambos temas y móvil. La moderación requiere atención humana; una cuenta no puede aprobar sus propios contenidos. Después: reputación, mapa, experiencias, guías colaborativas de cuerpo completo y recordatorios. No hay pagos, anuncios operativos ni atención de emergencias. La mensajería implementada no se declara operativa hasta comprobar su activación. El sitio orienta a canales oficiales.

El directorio y los formularios de aportes seleccionan servicios y ubicaciones del catálogo; eso no clasifica automáticamente las fichas antiguas. La consulta histórica por localidad escrita permanece en el repositorio, pero `/directorio` rechaza el parámetro libre `localidad`: los enlaces hacia esta ruta deben usar el ID `place` junto con su provincia. Ver [CATALOGO_SERVICIOS.md](./docs/CATALOGO_SERVICIOS.md). Las páginas todavía usan `noindex` para evitar indexar el prototipo. Cambiarlo junto con las políticas y los contenidos del lanzamiento real.

## Mapa del proyecto

Este es el mapa canónico; los documentos de cada módulo amplían su contrato. **Comprobación del 24/11/2026:** inventario de áreas, rutas y dependencias locales, con inspección de la navegación pública, búsqueda, orientación y componentes de contenido. El resto se contrastó con los puntos de entrada y las guías enlazadas; no constituye una auditoría exhaustiva de cada implementación ni una comprobación actual de servicios, permisos remotos o despliegues. Los estados operativos conservan sus fechas y evidencias en las guías de operación.

**Comprobación de Artículos y navegación del 26/11/2026:** bloque `youtube` con elección de enlace o reproductor. `youtube.ts` valida URLs e identifica el video; `youtube-video.tsx` carga el reproductor externo solo por acción del lector. Editor, vista previa y moderación reutilizan `ArticleContent`. `tests/article-youtube.test.ts` comprueba el contrato TypeScript/SQL y `scripts/test-articles-integration.ts` verifica guardado, aprobación y cambio de presentación en la base aislada de test. Migración `20261125232130_article_youtube_blocks.sql` aplicada en ambos entornos; prueba remota y limpieza aprobadas. Se revisaron editor, vista previa y navegación en claro/oscuro, móvil y escritorio, reproducción real, video no disponible y Orientación → Directorio con IDs territoriales. Entrega en [PR #17](https://github.com/prcamacho/autismo.ar/pull/17), promoción y resultado productivo en [PR #18](https://github.com/prcamacho/autismo.ar/pull/18). Alcance y recuperación en [Artículos](./docs/ARTICULOS.md#videos-de-youtube); esta comprobación no amplía la auditoría a otros módulos.

**Hallazgo territorial pendiente:** el selector compartido muestra dos opciones «Salta · Capital», procedentes de los IDs `georef:66028050` y `georef:6602805003` de `src/features/locations/catalog-data.json`. Revisar la relación entre ambas entidades en la fuente oficial antes de unificarlas o cambiar sus etiquetas; esta limpieza de navegación no modifica el catálogo ni las ubicaciones de las publicaciones existentes.

**Relevamiento de preparación del piloto — 26/11/2026:** se contrastaron visión, mapa, guías operativas, puntos de entrada del código, PR #10 y PR #18, despliegues Railway y consultas agregadas de solo lectura en producción. Ambos últimos despliegues (`test` y `main`) figuran `SUCCESS` sobre `80a6eff`; las dos bases Supabase figuran `ACTIVE_HEALTHY`. La [PR #10](https://github.com/prcamacho/autismo.ar/pull/10) acredita la activación de Búsquedas, Artículos y mantenimiento: las menciones anteriores a su preparación no describen módulos actualmente apagados. Producción devuelve 0 fichas visibles, 0 artículos visibles, 0 perfiles públicos aprobados y 0 avisos publicados vigentes; hay 1 moderador asignado. Son recuentos de esta consulta, no estadísticas permanentes ni una lectura de contenido privado. El cron horario está activo: en los últimos siete días constan 167 ejecuciones conciliadas exitosas y una pendiente de conciliación; la última conciliada respondió HTTP 200. El pendiente más reciente, por sí solo, no demuestra un fallo: el job concilia el despacho anterior.

**Dependencias y verificaciones — 26/11/2026:** Next.js y `eslint-config-next` pasan a 16.4.6, sharp a 0.35.5 y Zod a 4.6.6; el lockfile actualiza source-map-js a 1.2.4 y la cadena de typescript-eslint a 8.74.0, que resuelve minimatch. La auditoría completa devuelve 0 vulnerabilidades conocidas, frente a 11 paquetes afectados antes de esta actualización. Pasan 82/82 pruebas, lint, TypeScript y build. Este último se ejecutó sin credenciales del producto fuera del sandbox de Windows, porque Turbopack necesita crear un junction interno de sharp. Se revisaron portada, menú móvil, navegación al directorio, cambio de tema y edición/vista previa local de un artículo; sin errores de consola, sin guardar contenido ni usar servicios. Portada revisada en ambos temas y escritorio/móvil; esta comprobación anónima no acredita recorridos autenticados ni todas las pantallas. Se conserva `noindex`.

**Verificación automática:** `.github/workflows/verify.yml` ejecuta un único trabajo para PRs hacia `test`/`main` y pushes a esas ramas: Node.js 22, `npm ci`, auditoría de todas las dependencias con umbral alto, lint, tipos, pruebas y build sin servicios. `npm run typecheck` genera primero las rutas con `next typegen`; ESLint y Prettier excluyen artefactos de pruebas. Detalle y límites en [Desarrollo](./docs/DESARROLLO.md#verificaciones-automáticas). El 26/11 se comprobó que Actions está habilitado y ambas ramas carecen de protección; el workflow no impide por sí solo integrar ni desplegar con checks fallidos. Integrado en `test` mediante [PR #19](https://github.com/prcamacho/autismo.ar/pull/19), con [Verify #1 aprobado](https://github.com/prcamacho/autismo.ar/actions/runs/45893644375) desde un checkout limpio de Linux. El despliegue de ensayo y el resultado de la promoción a producción se registran en [PR #20](https://github.com/prcamacho/autismo.ar/pull/20).

**Prioridad de producto propuesta, todavía no implementada:** completar un recorrido autenticado de aporte/publicación, revisión independiente, consulta y contacto en test; preparar contenido real acotado a una zona piloto y recursos nacionales; comprobar responsables de revisión, recuperación y alertas antes de ampliar la difusión. El único moderador no puede aprobar sus propios artículos o aportes: organizar autoría y revisión independientes. Emprendimientos sigue siendo una iniciativa prevista, sin rutas ni persistencia propias; podría reutilizar autenticación, controles territoriales, presentación y patrones de revisión, pero necesita reglas y datos comerciales propios, sin convertir avisos profesionales en ofertas de productos. Esta propuesta no autoriza publicaciones ni cambia la hoja de ruta acordada.

```text
src/
  app/                   Rutas de Next.js, metadata y estilos globales
    page.tsx             Portada
    directorio/          Búsqueda, ficha e historial
    recursos/            Biblioteca en preparación
    articulos/           Publicaciones, autores y preparación de artículos
    busquedas/           Solicitudes de apoyo y disponibilidad profesional
    profesionales/       Perfiles públicos aprobados
    mensajes/            Contacto privado aceptado
    catalogo/            Solicitudes de servicios y moderación
    comunidad/           Participación, revisión y seguimiento de propuestas
    cuenta/              Código de ingreso, aportes y reportes propios
    orientacion/         Accesos por necesidad
    proyecto/            Propósito y etapas
    aportar/             Aporte o corrección, con borrador local como alternativa
    api/                 Consulta territorial, fotos privadas y mantenimiento
  components/            Navegación, búsqueda e identidad compartidas
  features/              Dominios: auth, community, articles y otros módulos
  lib/
    catalog.ts           Categorías compartidas
    geography.ts         Jurisdicciones e identificadores
    supabase/            Cliente y configuración del servidor
  proxy.ts               Renovación de sesión y control de caché privado
supabase/migrations/     Esquema, RLS y funciones de escritura
tests/                   Contratos de búsqueda, validación y permisos en PostgreSQL
scripts/                 Pruebas aisladas, integración e importación territorial
```

### Áreas, entradas y resultados

| Área y propósito                     | Ubicación y funcionamiento                                                                                                                     | Entradas, salidas y relaciones                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estructura pública e identidad       | `src/app/layout.tsx`, `src/components/site-header.tsx`, `site-footer.tsx`, `puzzle-mark.tsx`, `src/styles/`                                    | Compone cabecera, contenido, pie y metadatos comunes para todas las rutas. La ruta actual determina el acceso activo. `theme-toggle.tsx` y `src/lib/theme.ts` aplican el tema; la elección se guarda en `localStorage`, sin cuenta.                                                                                                                 |
| Portada y orientación                | `src/app/page.tsx`, `src/app/orientacion/page.tsx`, `src/features/orientation/`                                                                | La portada consulta el catálogo y compone `SearchForm`; sus categorías enlazan al directorio. Orientación transforma necesidad, provincia y localidad en filtros de ese mismo directorio, sin crear fichas ni dar diagnósticos.                                                                                                                     |
| Directorio de fichas comunitarias    | `src/app/directorio/`, `src/features/resources/{repository,validation,model,revision}.ts`, `resource-card.tsx`                                 | Recibe filtros compartibles, devuelve fichas paginadas, fuentes e historial. `findCatalogResources` usa servicios y lugares con IDs; `findResources` conserva la consulta histórica por texto. Depende de comunidad para publicar correcciones y de PostgreSQL para lecturas autorizadas.                                                           |
| Aportes, revisión y reportes         | `src/app/aportar/`, `src/app/comunidad/`, `src/features/community/`; [guía](./docs/COMUNIDAD.md)                                               | Formularios y fuentes producen propuestas; revisión inicial, corroboración y moderación producen fichas e historial. `duplicate-finder.tsx` busca coincidencias. `draft.ts` importa/exporta JSON local cuando corresponde; un borrador local no es un envío.                                                                                        |
| Cuenta y autenticación               | `src/app/cuenta/`, `src/features/auth/`, `src/proxy.ts`                                                                                        | Correo y código generan sesión; `viewer.ts` y las acciones del servidor verifican acceso. Mi cuenta reúne aportes, artículos, búsquedas, perfiles y mensajes. El proxy renueva la sesión y usa caché privada en las rutas incluidas en su `matcher`; no reemplaza la autorización por operación.                                                    |
| Catálogo compartido de servicios     | `src/features/services/`, `src/app/catalogo/`; [guía](./docs/CATALOGO_SERVICIOS.md)                                                            | Nombres, aliases y selecciones producen IDs usados por directorio y avisos. El repositorio lee `service_catalog`; `seed.ts` conserva la lista inicial, no es la fuente mutable en ejecución. Pedidos privados de opciones faltantes pasan por moderación; nunca publican un borrador automáticamente.                                               |
| Ubicaciones oficiales                | `src/features/locations/`, `src/app/api/ubicaciones/route.ts`, `scripts/import-locations.mjs`; [guía](./docs/UBICACIONES.md)                   | Catálogo versionado y búsqueda local resuelven provincia, departamento/partido y localidad/barrio a IDs y nombres. La migración territorial conserva la correspondencia SQL/JSON. Se reutiliza en avisos, perfiles y aportes; no exige una API externa por consulta.                                                                                |
| Búsquedas, disponibilidad y perfiles | `src/app/busquedas/`, `src/app/profesionales/`, `src/features/exchanges/`; [guía](./docs/BUSQUEDAS.md)                                         | Servicio, zonas y condiciones generan avisos revisables; ofertas se relacionan con perfiles profesionales. Repositorios y acciones verifican sesión, habilitación y permisos. Búsquedas personales requieren ingreso; perfiles públicos requieren consentimiento y aprobación. Fotos pasan por normalización y almacenamiento privado.              |
| Contacto y conservación              | `src/app/mensajes/`, `src/features/exchanges/components/contact-forms.tsx`, `maintenance.ts`, `notification.ts`, `src/app/api/exchanges/`      | Una solicitud aceptada habilita conversación privada vinculada al aviso. Hay bloqueo, reportes, vencimientos y baja global de cuenta. El mantenimiento procesa lotes acotados; avisos por correo tienen habilitación y presupuesto propios. Ver [mantenimiento](./docs/MANTENIMIENTO_BUSQUEDAS.md), sin inferir un cron activo por existir la ruta. |
| Artículos, agendas y autoría         | `src/app/articulos/`, `src/app/cuenta/articulos/`, `src/app/cuenta/perfil-autor/`, `src/features/articles/`; [guía](./docs/ARTICULOS.md)       | Editor por bloques genera borrador privado; moderación publica una versión y su resumen compartible. `content.ts` y `validation.ts` comparten reglas. El perfil de autor es distinto del profesional. `cafecito.ts` valida un destino externo: no ejecuta el código importado ni procesa pagos.                                                     |
| Biblioteca y Proyecto                | `src/app/recursos/page.tsx`, `src/app/proyecto/page.tsx`                                                                                       | Biblioteca informa que no hay materiales publicados, sin simular descargas. Proyecto concentra propósito, principios, planes futuros y explicación de analítica. Son contenidos de presentación; no habilitan servicios. Los enlaces quedan en el pie mientras la biblioteca no tenga contenido.                                                    |
| Persistencia y configuración         | `supabase/migrations/`, `src/lib/supabase/`, `.env.example`, configuración de cada módulo                                                      | Esquema, RLS y funciones SQL reciben las escrituras validadas desde acciones de servidor. `database.types.ts` y los `db-contract.ts` describen contratos de datos. Ausencia de configuración y falla de consulta son estados diferentes. Configurar o tener una migración local no demuestra aplicación remota.                                     |
| Analítica                            | `src/lib/analytics.ts`, `src/components/production-analytics.tsx`; [guía](./docs/ANALITICA.md)                                                 | Rutas públicas permitidas y normalizadas producen eventos básicos de PostHog solo con la configuración productiva válida. No envía parámetros, formularios, IDs personales ni sesiones grabadas. Comparte el proyecto autorizado con Vin; no modificar otros dominios.                                                                              |
| Verificación y entrega               | `tests/`, `scripts/run-isolated-test.mjs`, guiones `test-*-integration.ts`, `package.json`, `next.config.ts`; [operación](./docs/OPERACION.md) | Pruebas de dominio y PGlite verifican contratos locales; guiones de integración requieren el entorno aislado documentado. Lint, tipos, compilación y navegador completan la entrega. Railway publica por entorno, Cloudflare gestiona el dominio; el flujo acordado es `test` antes de `main`.                                                      |
| Experimento de nomenclador retirado  | `src/features/nomenclator-preview/`, `src/app/busquedas/prestaciones/page.tsx`; [contexto histórico](./docs/NOMENCLADOR_PREVIEW.md)            | Conserva código y pruebas de la exploración anterior; la ruta redirige a `/busquedas` y no está en la navegación activa. No reutilizarlo como catálogo vigente ni como equivalencia clínica o de cobertura.                                                                                                                                         |

### Flujos que conviene conservar

1. **Encontrar apoyo:** portada → `SearchForm` → `/busquedas`, con modo `Busco apoyo` o `Soy profesional`. El modo profesional busca solicitudes y conserva su requisito de ingreso; no acredita un rol profesional.
2. **Explorar fichas:** categorías u Orientación → `/directorio` → ficha y fuentes. Orientación reutiliza `PlacePicker`, conserva categoría y edad y envía `province`/`place`; editar texto o cambiar provincia invalida la selección previa. En el directorio, `SearchForm` con `directory` y modo de apoyo consulta fichas; el modo profesional dirige a solicitudes. Los filtros territoriales conservan recursos nacionales y provinciales pertinentes.
3. **Mantener una ficha:** `/aportar` → validación y propuesta → revisión inicial → corroboración independiente → moderación → ficha e historial. Recuperar una versión crea una propuesta nueva; no sobrescribe directamente lo publicado.
4. **Publicar y contactar:** cuenta → perfil/aviso o artículo → borrador y revisión → versión pública autorizada. El contacto entre personas requiere solicitud aceptada; publicar un artículo no abre una conversación ni crea un perfil profesional.
5. **Cambiar el producto:** código y documentación → verificaciones locales → entorno `test` aislado → promoción autorizada a `main` → comprobación del despliegue. Una rama o un dominio por sí solos no prueban aislamiento.

### Reutilización y límites

- `PageIntro`, `EmptyState`, `ConnectionNotice`, `Pagination` y `ActionForm`, en `src/components/`, son piezas comunes. Elegí la que corresponda al estado real: una consulta fallida no debe mostrarse como lista vacía.
- `SearchForm`, `ServicePicker`, `ServiceMultiPicker`, `PlacePicker` y `CatalogCombobox` centralizan selección y búsqueda. Preservá IDs, destino y reglas del formulario anfitrión; no dupliques un catálogo con listas independientes.
- `src/lib/result.ts` centraliza `ready`, `unconfigured` y `unavailable`; `format.ts`, `pagination.ts`, `geography.ts`, `site-url.ts` y `public-url.ts` reúnen contratos compartidos. Verificá su alcance antes de ampliar su uso.
- `src/styles/theme.css` es la fuente de colores semánticos. `base.css`, `header.css`, `home.css`, `sections.css`, `content.css`, `footer.css` y `responsive.css` componen el estilo global; los módulos complejos tienen CSS Modules propios. No introducir colores que solo funcionen en un tema.
- Directorio, Biblioteca, Artículos y Búsquedas cumplen tareas distintas. Reutilizar controles no implica fusionar sus datos. Mantener nombres consistentes, acciones explícitas y avisos útiles; evitar repetir lemas o presentar planes como funciones actuales. Ver [DEC-011](./docs/DECISIONES.md#dec-011--navegación-por-tareas-y-contenido-sin-repeticiones).
- Permisos, privacidad, moderación, límites y retención están en las guías de cada módulo y en SQL; ocultar un botón no es autorización. No hay integración de Ian, reputación operativa, cobros propios ni atención de emergencias. No agregar datos ficticios para completar el diseño.

Los aportes comunitarios importan borradores JSON en el dispositivo; las fotografías opcionales de Búsquedas tienen su propio flujo de validación y permisos, comprobado en el entorno remoto de ensayo según [su guía](./docs/BUSQUEDAS.md). No incluir claves privadas en el navegador ni en Git. En `.env.example` figuran las variables públicas de Supabase y las opciones de servidor. La configuración local principal apunta a la base real: usar PGlite o el lanzador aislado `scripts/run-isolated-test.mjs` para datos sintéticos. Una instalación nueva necesita activar y comprobar también el correo de autenticación según la guía; este es independiente de los avisos opcionales de Búsquedas.

## Diseño y contenido

La presentación se centra en el propósito y la utilidad de autismo.ar, con tono neutral, claro, cálido y sobrio. No atribuye el proyecto a familias ni a organizaciones ni supone respaldo institucional o clínico. Las personas autistas tienen voz propia, con lugar para familias y profesionales. Esta pauta alcanza textos públicos, metadatos y estados de la interfaz; las referencias a familias se conservan cuando corresponden a necesidades o iniciativas específicas. Ver [DEC-005](./docs/DECISIONES.md#dec-005--presentación-neutral-centrada-en-el-propósito).

CSS propio organizado en `src/styles`, con variables y componentes compartidos; sin fuentes remotas necesarias para compilar. Los formularios, avisos y paginación comunes están en `src/components`. El SVG del rompecabezas es parte del código y puede ajustarse sin generar imágenes nuevas.

La paleta de ambos temas está centralizada en `src/styles/theme.css`, usando `light-dark()` y `color-scheme` para adaptar también los controles nativos. Cada sección nueva o modificada debe verificarse en claro y oscuro. La preferencia `autismo-ar-theme` se guarda solo en `localStorage`, sin cuenta ni llamadas al servidor. Un script inicial aplica la elección antes de pintar; si el almacenamiento está bloqueado, el cambio sigue funcionando durante la navegación actual. Sin JavaScript, el CSS respeta el tema del dispositivo. La impresión usa el tema claro.

`npm run format` aplica el formato de código; `npm run format:check` permite comprobarlo sin modificar archivos.

No incorporar fichas, testimonios, teléfonos ni cifras inventadas. No ofrecer archivos o descargas sin autorización de sus responsables.

## Publicación

**Pruebas, 12 de noviembre de 2026:** [test.autismo.ar](https://test.autismo.ar) está operativo por HTTPS desde la rama `test`, en un entorno Railway separado con suspensión por inactividad y sin variables de Supabase. Permite revisar interfaz, navegación y borradores locales; las cuentas, el correo y los envíos quedan deshabilitados. El responsable eligió únicamente Under Attack Mode de Cloudflare: el entorno es público tras el desafío, sin Zero Trust/Access ni autenticación adicional. El desafío no garantiza bloquear bots y `noindex` no restringe el acceso. Se comprobaron suspensión y reanudación reales, portada en claro/oscuro y móvil, y cuenta sin formulario de ingreso. Consultá [estado, certificados y límites de comprobación](./docs/INFRAESTRUCTURA.md#entorno-test-del-12-de-noviembre-de-2026) y [DEC-006](./docs/DECISIONES.md#dec-006--entorno-de-pruebas-sin-base-y-con-desafío-de-cloudflare).

**Preparación del 17 de noviembre:** la etapa inicial anterior tiene una base separada sucesora, `autismo-ar-test`, con esquema, permisos y recorridos remotos comprobados. Antes de la PR #10 se preparó en Railway la configuración de activación de `test`, sin claves de producción y con avisos por correo deshabilitados. Se conserva el desafío de Cloudflare. El estado resultante del despliegue y la promoción a `main`, con su evidencia, se registra en la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10); la [PR #9](https://github.com/prcamacho/autismo.ar/pull/9) publicó el código previo con ambos módulos apagados.

Producción conserva `main` y `autismo.ar`, con Supabase y correo según la [guía comunitaria](./docs/COMUNIDAD.md). Las protecciones y CI siguen pendientes; crear un entorno de pruebas no los configura. El costo de `test` se agrega al consumo compartido del workspace Railway, con importe dependiente del uso real.

El sitio se publica con Railway y el dominio `autismo.ar` se gestiona mediante Cloudflare. El repositorio remoto es `https://github.com/prcamacho/autismo.ar.git`. La escuela de Ian conserva su repositorio independiente. Su servicio alojado fue retirado por indicación del responsable, que utiliza la app sin requerir internet. Las antiguas rutas de integración y la ficha del recurso se eliminaron, sin redirects ni un interruptor que conserve código inactivo. Esas URLs corresponden ahora al comportamiento 404 normal del código publicado.
