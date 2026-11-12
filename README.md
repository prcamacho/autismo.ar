# autismo.ar

Base de una red de información y recursos sobre autismo en Argentina, para personas autistas, familias y profesionales. La portada combina información general, búsqueda por ubicación y participación comunitaria.

## Antes de trabajar

Leé [VISION_Y_PLAN.md](./VISION_Y_PLAN.md) para entender el objetivo, las etapas y las decisiones pendientes. [AGENTS.md](./AGENTS.md) orienta a las IAs que continúen el proyecto. Este README describe lo que existe técnicamente.

La [guía de desarrollo](./docs/DESARROLLO.md) establece alcance, selección de modelos, organización del código y verificaciones. La [guía de operación](./docs/OPERACION.md) distingue el flujo acordado `test`/`main` de la infraestructura todavía pendiente de comprobar. Las decisiones importantes se conservan en el [registro de decisiones](./docs/DECISIONES.md). La incorporación de estas guías no configura ramas remotas, entornos, alertas ni servicios.

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

- Portada informativa, identidad SVG con rompecabezas multicolor y diseño adaptable a celulares.
- Modo claro y oscuro en todas las secciones, con botón de sol/luna en la cabecera pública, visible también en móvil y sin necesidad de iniciar sesión. Sigue el tema del dispositivo hasta elegir uno manualmente; recuerda esa elección en este navegador y la sincroniza entre pestañas.
- Directorio con categorías, 23 provincias y CABA, localidad escrita y filtros compartibles en la URL.
- Contrato de búsqueda que conserva recursos nacionales y provinciales pertinentes al filtrar una localidad.
- Biblioteca en preparación, con estado vacío explícito y sin recursos ficticios.
- Orientación por necesidades que conserva provincia y localidad al consultar el directorio; filtro de edades atendidas.
- Circuito comunitario modular: ingreso por código de correo, aportes, correcciones, revisión inicial, corroboración de datos, decisión de moderación, historial y reportes.
- Formularios con validación en servidor y migración PostgreSQL con políticas RLS, permisos y límites de frecuencia.
- Búsqueda de posibles duplicados y fichas canónicas con fuentes y fechas. Recuperar una versión genera una propuesta nueva.
- Sin conexión configurada: descarga y carga de borradores JSON en el dispositivo, con estado explícito de **no enviado**.
- Estados vacíos honestos, navegación con teclado y página 404.
- Pruebas de búsqueda, validación y flujo real de permisos/transacciones en PostgreSQL local (PGlite).

El catálogo público está vacío intencionalmente. Los datos ficticios de las pruebas están únicamente en `tests/`. El chat privado que orientó las necesidades no se importa ni se publica.

**Estado operativo al 11 de noviembre de 2026:** Supabase está conectado en una cuenta nueva, con esquema y RLS aplicados. Railway publicó la conexión y el directorio fue comprobado en el navegador. Resend tiene el dominio verificado y una clave dedicada limitada a autismo.ar; se comprobó la entrega del código y el ingreso real como colaborador/a. El piloto completo todavía requiere moderadores y pruebas del circuito de publicación. Ver [activación, evidencia y pendientes](./docs/COMUNIDAD.md).

## Qué falta

Designar moderadores y comprobar el circuito completo del piloto en un entorno de pruebas aislado. Después: reputación, mapa, experiencias, guías colaborativas de cuerpo completo y recordatorios. No hay pagos, anuncios operativos, mensajería ni atención de emergencias. El sitio orienta a canales oficiales.

La localidad es texto libre en esta etapa y siempre va asociada a una provincia; se prevé un catálogo oficial con IDs. Las páginas todavía usan `noindex` para evitar indexar el prototipo. Cambiarlo junto con las políticas y los contenidos del lanzamiento real.

## Estructura

```text
src/
  app/                   Rutas de Next.js, metadata y estilos globales
    page.tsx             Portada
    directorio/          Búsqueda, ficha e historial
    recursos/            Biblioteca en preparación
    comunidad/           Participación, revisión y seguimiento de propuestas
    cuenta/              Código de ingreso, aportes y reportes propios
    orientacion/         Accesos por necesidad
    proyecto/            Propósito y etapas
    aportar/             Aporte o corrección, con borrador local como alternativa
  components/            Navegación, búsqueda e identidad compartidas
  features/              auth, community, orientation, resources
  lib/
    catalog.ts           Categorías compartidas
    geography.ts         Jurisdicciones e identificadores
    supabase/            Cliente y configuración del servidor
  proxy.ts               Renovación de sesión y control de caché privado
supabase/migrations/     Esquema, RLS y funciones de escritura
tests/                   Contratos de búsqueda, validación y permisos en PostgreSQL
```

Las páginas consultan los repositorios de cada módulo. El directorio usa una consulta paginada que conserva recursos nacionales y provinciales pertinentes al filtrar localidades. Las escrituras pasan por acciones de servidor y funciones PostgreSQL; las políticas de la base siguen protegiendo las operaciones invocadas fuera de la interfaz.

Los archivos subidos requerirán un flujo propio de validación y permisos; actualmente solo se importa un borrador JSON en el dispositivo. No incluir claves privadas en el navegador ni en Git. En `.env.example` figuran las variables públicas de Supabase. La configuración local actual apunta a la base real: usar PGlite o un entorno dedicado para datos sintéticos. Una instalación nueva necesita activar y comprobar también el correo según la guía.

## Diseño y contenido

La presentación se centra en el propósito y la utilidad de autismo.ar, con tono neutral, claro, cálido y sobrio. No atribuye el proyecto a familias ni a organizaciones ni supone respaldo institucional o clínico. Las personas autistas tienen voz propia, con lugar para familias y profesionales. Esta pauta alcanza textos públicos, metadatos y estados de la interfaz; las referencias a familias se conservan cuando corresponden a necesidades o iniciativas específicas. Ver [DEC-005](./docs/DECISIONES.md#dec-005--presentación-neutral-centrada-en-el-propósito).

CSS propio organizado en `src/styles`, con variables y componentes compartidos; sin fuentes remotas necesarias para compilar. Los formularios, avisos y paginación comunes están en `src/components`. El SVG del rompecabezas es parte del código y puede ajustarse sin generar imágenes nuevas.

La paleta de ambos temas está centralizada en `src/styles/theme.css`, usando `light-dark()` y `color-scheme` para adaptar también los controles nativos. Cada sección nueva o modificada debe verificarse en claro y oscuro. La preferencia `autismo-ar-theme` se guarda solo en `localStorage`, sin cuenta ni llamadas al servidor. Un script inicial aplica la elección antes de pintar; si el almacenamiento está bloqueado, el cambio sigue funcionando durante la navegación actual. Sin JavaScript, el CSS respeta el tema del dispositivo. La impresión usa el tema claro.

`npm run format` aplica el formato de código; `npm run format:check` permite comprobarlo sin modificar archivos.

No incorporar fichas, testimonios, teléfonos ni cifras inventadas. No ofrecer archivos o descargas sin autorización de sus responsables.

## Publicación

La [revisión del 11 de noviembre de 2026](./docs/INFRAESTRUCTURA.md) confirmó la reactivación de autismo.ar en Railway y la escuela de Ian online. Las consultas HTTP públicas automatizadas recibieron el desafío de Cloudflare. La comprobación posterior desde el navegador validó el directorio conectado, su búsqueda y el ingreso real por código de correo. El entorno `test`, protecciones y CI siguen pendientes de implementar. La eliminación de la integración se publicó el 11 de noviembre mediante PR 1 y el despliegue de Railway terminó en SUCCESS. Después se retiró el servicio alojado de Ian Escuela: el proyecto conserva únicamente autismo.ar online.

El sitio se publica con Railway y el dominio `autismo.ar` se gestiona mediante Cloudflare. El repositorio remoto es `https://github.com/prcamacho/autismo.ar.git`. La escuela de Ian conserva su repositorio independiente. Su servicio alojado fue retirado por indicación del responsable, que utiliza la app sin requerir internet. Las antiguas rutas de integración y la ficha del recurso se eliminaron, sin redirects ni un interruptor que conserve código inactivo. Esas URLs corresponden ahora al comportamiento 404 normal del código publicado.
