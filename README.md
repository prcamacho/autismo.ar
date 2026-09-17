# autismo.ar

Base de una red argentina de recursos construida por personas autistas y familias. La portada combina información general, búsqueda por ubicación y participación comunitaria.

## Antes de trabajar

Leé [VISION_Y_PLAN.md](./VISION_Y_PLAN.md) para entender el objetivo, las etapas y las decisiones pendientes. [AGENTS.md](./AGENTS.md) orienta a las IAs que continúen el proyecto. Este README describe lo que existe técnicamente.

## Ejecutar

Requiere Node.js 22 o superior y npm. En PowerShell, si la política de ejecución bloquea `npm`, usá `npm.cmd`.

```sh
npm ci
npm run dev
```

Abrí http://localhost:3000. Si el puerto está ocupado, Next indica el puerto alternativo. El servidor de desarrollo escucha solo en la máquina local.

No se necesitan cuentas de servicios externos ni variables de entorno para esta versión.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Qué está implementado

- Portada informativa, identidad SVG con rompecabezas multicolor y diseño adaptable a celulares.
- Directorio con categorías, 23 provincias y CABA, localidad escrita y filtros compartibles en la URL.
- Contrato de búsqueda que conserva recursos nacionales y provinciales pertinentes al filtrar una localidad.
- Biblioteca y presentación provisional de la app de Ian, sin descarga inventada.
- Páginas de comunidad y proyecto con etapas explícitas.
- Formulario para descargar un borrador JSON o copiar su contenido en el dispositivo. **No envía, guarda en un servidor ni publica información.**
- Estados vacíos honestos, navegación con teclado y página 404.
- Pruebas del alcance geográfico y búsqueda del catálogo.

El catálogo público está vacío intencionalmente. Los datos ficticios de las pruebas están únicamente en `tests/`.

## Qué falta

Autenticación, PostgreSQL/Supabase, envío y revisión de aportes, historial de cambios, reportes y reputación. No hay pagos, anuncios operativos, mensajería ni atención de emergencias. El sitio orienta a canales oficiales.

La localidad es texto libre en esta etapa; al persistir datos se deberá integrar un catálogo geográfico oficial con IDs, normalización y localidades homónimas. Las páginas todavía usan `noindex` para evitar indexar el prototipo. Cambiarlo junto con el dominio, las políticas y los contenidos del lanzamiento real.

## Estructura

```text
src/
  app/                   Rutas de Next.js, metadata y estilos globales
    page.tsx             Portada
    directorio/          Búsqueda y estados vacíos
    recursos/            Biblioteca y /recursos/app-de-ian
    comunidad/           Participación y futuras iniciativas
    proyecto/            Propósito y etapas
    aportar/             Preparación de borrador local
  components/            Navegación, búsqueda, formularios e identidad
  lib/
    catalog.ts           Tipos, categorías y límite de acceso al catálogo
    geography.ts         Jurisdicciones e identificadores
tests/                   Contratos de búsqueda territorial
```

Las páginas consultan `searchResources()`. Al conectar PostgreSQL, reemplazar su implementación manteniendo el contrato de filtros; incorporar tablas normalizadas para sedes, localidades y cobertura. El tipo inicial es una interfaz de lectura, no un esquema final de la base de datos.

Antes de habilitar escrituras se necesitan validación en servidor, autorización, políticas de acceso, prevención de abuso y recuperación de cambios. Los archivos subidos requerirán un flujo propio de validación y permisos. No incluir claves privadas en el navegador ni en Git.

## Diseño y contenido

CSS propio con variables y componentes compartidos; sin fuentes remotas necesarias para compilar. El SVG del rompecabezas es parte del código y puede ajustarse sin generar imágenes nuevas.

`npm run format` aplica el formato de código; `npm run format:check` permite comprobarlo sin modificar archivos.

No incorporar fichas, testimonios, teléfonos ni cifras inventadas. La app de Ian requiere descripción y archivo o enlace autorizado de su responsable antes de habilitar una descarga.

## Publicación

Este esqueleto funciona localmente. La elección de hosting, conexión de dominio, base de datos y publicación forman parte de la siguiente etapa. El repositorio remoto es `https://github.com/prcamacho/autismo.ar.git`.
