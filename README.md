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

Copiá `.env.example` a `.env.local` para habilitar la app de Ian bajo `/apps/ian/`. `IAN_APP_ORIGIN` debe contener el origen HTTPS de su PWA, sin necesidad de una barra final; la configuración la normaliza igualmente.

Abrí http://localhost:3000. Si el puerto está ocupado, Next indica el puerto alternativo. El servidor de desarrollo escucha solo en la máquina local.

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
- Biblioteca e integración de la versión beta de la app de Ian bajo `/apps/ian/`, mediante un proxy al origen configurado.
- Orientación por necesidades que conserva provincia y localidad al consultar el directorio; filtro de edades atendidas.
- Circuito comunitario modular: ingreso por código de correo, aportes, correcciones, revisión inicial, corroboración de datos, decisión de moderación, historial y reportes.
- Formularios con validación en servidor y migración PostgreSQL con políticas RLS, permisos y límites de frecuencia.
- Búsqueda de posibles duplicados y fichas canónicas con fuentes y fechas. Recuperar una versión genera una propuesta nueva.
- Sin conexión configurada: descarga y carga de borradores JSON en el dispositivo, con estado explícito de **no enviado**.
- Estados vacíos honestos, navegación con teclado y página 404.
- Pruebas de búsqueda, validación y flujo real de permisos/transacciones en PostgreSQL local (PGlite).

El catálogo público está vacío intencionalmente. Los datos ficticios de las pruebas están únicamente en `tests/`. El chat privado que orientó las necesidades no se importa ni se publica.

**Estado operativo:** el piloto está implementado localmente, pero la base de Supabase y el correo real siguen pendientes de activación. La cuenta consultada alcanzó el cupo de proyectos gratuitos. Esta entrega no modificó Railway ni Cloudflare. Ver [activación, arquitectura y reglas del piloto](./docs/COMUNIDAD.md).

## Qué falta

Activar y comprobar Supabase, correo, moderadores y despliegue del piloto. Después: reputación, mapa, experiencias, guías colaborativas de cuerpo completo y recordatorios. No hay pagos, anuncios operativos, mensajería ni atención de emergencias. El sitio orienta a canales oficiales.

La localidad es texto libre en esta etapa y siempre va asociada a una provincia; se prevé un catálogo oficial con IDs. Las páginas todavía usan `noindex` para evitar indexar el prototipo. Cambiarlo junto con las políticas y los contenidos del lanzamiento real.

## Estructura

```text
src/
  app/                   Rutas de Next.js, metadata y estilos globales
    page.tsx             Portada
    directorio/          Búsqueda, ficha e historial
    recursos/            Biblioteca y /recursos/app-de-ian
    comunidad/           Participación, revisión y seguimiento de propuestas
    cuenta/              Código de ingreso, aportes y reportes propios
    orientacion/         Accesos por necesidad
    proyecto/            Propósito y etapas
    aportar/             Aporte o corrección, con borrador local como alternativa
  components/            Navegación, búsqueda e identidad compartidas
  features/              auth, community, orientation, resources
  lib/
    catalog.ts           Categorías y contrato de búsqueda
    geography.ts         Jurisdicciones e identificadores
    supabase/            Cliente y configuración del servidor
  proxy.ts               Renovación de sesión y control de caché privado
supabase/migrations/     Esquema, RLS y funciones de escritura
tests/                   Contratos de búsqueda, validación y permisos en PostgreSQL
```

Las páginas consultan los repositorios de cada módulo. El directorio usa una consulta paginada que conserva recursos nacionales y provinciales pertinentes al filtrar localidades. Las escrituras pasan por acciones de servidor y funciones PostgreSQL; las políticas de la base siguen protegiendo las operaciones invocadas fuera de la interfaz.

Los archivos subidos requerirán un flujo propio de validación y permisos; actualmente solo se importa un borrador JSON en el dispositivo. No incluir claves privadas en el navegador ni en Git. En `.env.example` figuran las variables públicas de Supabase; no configurarlas hasta aplicar la migración y preparar el correo según la guía de activación.

## Diseño y contenido

CSS propio con variables y componentes compartidos; sin fuentes remotas necesarias para compilar. El SVG del rompecabezas es parte del código y puede ajustarse sin generar imágenes nuevas.

`npm run format` aplica el formato de código; `npm run format:check` permite comprobarlo sin modificar archivos.

No incorporar fichas, testimonios, teléfonos ni cifras inventadas. La app de Ian se publica desde el origen autorizado configurado en `IAN_APP_ORIGIN`; no ofrecer un APK o archivo descargable distinto sin autorización de su responsable.

## Publicación

El sitio se publica con Railway y el dominio `autismo.ar` se gestiona mediante Cloudflare. La PWA de Ian conserva su despliegue independiente y se presenta bajo el dominio principal mediante rewrites de Next.js. La URL canónica es `/apps/ian/`: esa barra final es necesaria para que sus rutas relativas mantengan el manifiesto, el service worker y los assets dentro de la app. Toda la interfaz enlaza esa variante; no agregar un redirect de Next desde `/apps/ian`, porque el patrón también coincide con la ruta terminada en barra y produce un bucle. El repositorio remoto es `https://github.com/prcamacho/autismo.ar.git`.
