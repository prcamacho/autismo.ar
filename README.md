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

- Portada con presentación compacta y buscador destacado, identidad SVG con rompecabezas multicolor y diseño adaptable a celulares. La ilustración se reduce en escritorio y se oculta en móvil para priorizar la búsqueda.
- Modo claro y oscuro en todas las secciones, con botón de sol/luna en la cabecera pública, visible también en móvil y sin necesidad de iniciar sesión. Sigue el tema del dispositivo hasta elegir uno manualmente; recuerda esa elección en este navegador y la sincroniza entre pestañas.
- Directorio con categorías, 23 provincias y CABA, localidad escrita y filtros compartibles en la URL.
- Contrato de búsqueda que conserva recursos nacionales y provinciales pertinentes al filtrar una localidad.
- Biblioteca en preparación, con estado vacío explícito y sin recursos ficticios.
- Orientación por necesidades que conserva provincia y localidad al consultar el directorio; filtro de edades atendidas.
- Circuito comunitario modular: ingreso por código de correo, aportes, correcciones, revisión inicial, corroboración de datos, decisión de moderación, historial y reportes.
- Artículos y agendas: editor por bloques, resúmenes para compartir, perfil editorial con Cafecito opcional, borradores privados, moderación e historial. Implementación y activación separadas; ver [guía de artículos](./docs/ARTICULOS.md).
- Búsquedas de personas y familias, perfiles profesionales, disponibilidad en varias ubicaciones y contacto privado por aceptación. Migraciones y pruebas remotas completas; activación web preparada y mantenimiento productivo en comprobación. Ver [guía de Búsquedas](./docs/BUSQUEDAS.md) y [catálogo territorial oficial](./docs/UBICACIONES.md).
- Formularios con validación en servidor y migración PostgreSQL con políticas RLS, permisos y límites de frecuencia.
- Búsqueda de posibles duplicados y fichas canónicas con fuentes y fechas. Recuperar una versión genera una propuesta nueva.
- Sin conexión configurada: descarga y carga de borradores JSON en el dispositivo, con estado explícito de **no enviado**.
- Estados vacíos honestos, navegación con teclado y página 404.
- Pruebas de búsqueda, validación y flujo real de permisos/transacciones en PostgreSQL local (PGlite).

El catálogo público de recursos está vacío intencionalmente. Las pruebas usan datos sintéticos locales o cuentas temporales de la base aislada de ensayo; los guiones remotos confirmaron su limpieza y no cargan datos ficticios en producción. El chat privado que orientó las necesidades no se importa ni se publica.

**Estado al 17 de noviembre de 2026:** la conexión comunitaria de producción y el ingreso por código se comprobaron el 11 de noviembre. Búsquedas y Artículos tienen ahora sus migraciones aplicadas en las bases separadas de ensayo y producción, y un responsable de moderación asignado. Pasaron 69 pruebas locales, lint, TypeScript, compilación y los recorridos remotos de ambos módulos, más el mantenimiento real de ensayo. La activación web está preparada; producción mantiene las funciones apagadas hasta completar el despliegue y la comprobación de mantenimiento. Los avisos por correo permanecen deshabilitados con presupuesto cero. Ver [Búsquedas](./docs/BUSQUEDAS.md), [Artículos](./docs/ARTICULOS.md) y [operación](./docs/OPERACION.md) para alcance y pendientes.

## Qué falta

Completar el despliegue de activación, comprobar el mantenimiento productivo y ampliar la revisión visual autenticada del piloto en ambos temas y móvil. La moderación requiere atención humana; una cuenta no puede aprobar sus propios contenidos. Después: reputación, mapa, experiencias, guías colaborativas de cuerpo completo y recordatorios. No hay pagos, anuncios operativos ni atención de emergencias. La mensajería implementada no se declara operativa hasta comprobar su activación. El sitio orienta a canales oficiales.

La localidad del directorio comunitario sigue siendo texto libre y va asociada a una provincia. Búsquedas incorpora un catálogo oficial con IDs; eso no migra las fichas existentes del directorio. Las páginas todavía usan `noindex` para evitar indexar el prototipo. Cambiarlo junto con las políticas y los contenidos del lanzamiento real.

## Estructura

```text
src/
  app/                   Rutas de Next.js, metadata y estilos globales
    page.tsx             Portada
    directorio/          Búsqueda, ficha e historial
    recursos/            Biblioteca en preparación
    articulos/           Publicaciones, autores y preparación de artículos
    comunidad/           Participación, revisión y seguimiento de propuestas
    cuenta/              Código de ingreso, aportes y reportes propios
    orientacion/         Accesos por necesidad
    proyecto/            Propósito y etapas
    aportar/             Aporte o corrección, con borrador local como alternativa
  components/            Navegación, búsqueda e identidad compartidas
  features/              Dominios: auth, community, articles y otros módulos
  lib/
    catalog.ts           Categorías compartidas
    geography.ts         Jurisdicciones e identificadores
    supabase/            Cliente y configuración del servidor
  proxy.ts               Renovación de sesión y control de caché privado
supabase/migrations/     Esquema, RLS y funciones de escritura
tests/                   Contratos de búsqueda, validación y permisos en PostgreSQL
```

Las páginas consultan los repositorios de cada módulo. El directorio usa una consulta paginada que conserva recursos nacionales y provinciales pertinentes al filtrar localidades. Las escrituras pasan por acciones de servidor y funciones PostgreSQL; las políticas de la base siguen protegiendo las operaciones invocadas fuera de la interfaz.

Los aportes comunitarios importan borradores JSON en el dispositivo; las fotografías opcionales de Búsquedas tienen su propio flujo de validación y permisos, comprobado en el entorno remoto de ensayo según [su guía](./docs/BUSQUEDAS.md). No incluir claves privadas en el navegador ni en Git. En `.env.example` figuran las variables públicas de Supabase y las opciones de servidor. La configuración local principal apunta a la base real: usar PGlite o el lanzador aislado `scripts/run-isolated-test.mjs` para datos sintéticos. Una instalación nueva necesita activar y comprobar también el correo de autenticación según la guía; este es independiente de los avisos opcionales de Búsquedas.

## Diseño y contenido

La presentación se centra en el propósito y la utilidad de autismo.ar, con tono neutral, claro, cálido y sobrio. No atribuye el proyecto a familias ni a organizaciones ni supone respaldo institucional o clínico. Las personas autistas tienen voz propia, con lugar para familias y profesionales. Esta pauta alcanza textos públicos, metadatos y estados de la interfaz; las referencias a familias se conservan cuando corresponden a necesidades o iniciativas específicas. Ver [DEC-005](./docs/DECISIONES.md#dec-005--presentación-neutral-centrada-en-el-propósito).

CSS propio organizado en `src/styles`, con variables y componentes compartidos; sin fuentes remotas necesarias para compilar. Los formularios, avisos y paginación comunes están en `src/components`. El SVG del rompecabezas es parte del código y puede ajustarse sin generar imágenes nuevas.

La paleta de ambos temas está centralizada en `src/styles/theme.css`, usando `light-dark()` y `color-scheme` para adaptar también los controles nativos. Cada sección nueva o modificada debe verificarse en claro y oscuro. La preferencia `autismo-ar-theme` se guarda solo en `localStorage`, sin cuenta ni llamadas al servidor. Un script inicial aplica la elección antes de pintar; si el almacenamiento está bloqueado, el cambio sigue funcionando durante la navegación actual. Sin JavaScript, el CSS respeta el tema del dispositivo. La impresión usa el tema claro.

`npm run format` aplica el formato de código; `npm run format:check` permite comprobarlo sin modificar archivos.

No incorporar fichas, testimonios, teléfonos ni cifras inventadas. No ofrecer archivos o descargas sin autorización de sus responsables.

## Publicación

**Pruebas, 12 de noviembre de 2026:** [test.autismo.ar](https://test.autismo.ar) está operativo por HTTPS desde la rama `test`, en un entorno Railway separado con suspensión por inactividad y sin variables de Supabase. Permite revisar interfaz, navegación y borradores locales; las cuentas, el correo y los envíos quedan deshabilitados. El responsable eligió únicamente Under Attack Mode de Cloudflare: el entorno es público tras el desafío, sin Zero Trust/Access ni autenticación adicional. El desafío no garantiza bloquear bots y `noindex` no restringe el acceso. Se comprobaron suspensión y reanudación reales, portada en claro/oscuro y móvil, y cuenta sin formulario de ingreso. Consultá [estado, certificados y límites de comprobación](./docs/INFRAESTRUCTURA.md#entorno-test-del-12-de-noviembre-de-2026) y [DEC-006](./docs/DECISIONES.md#dec-006--entorno-de-pruebas-sin-base-y-con-desafío-de-cloudflare).

**Preparación del 17 de noviembre:** la etapa inicial anterior tiene una base separada sucesora, `autismo-ar-test`, con esquema, permisos y recorridos remotos comprobados. Railway tiene preparada la configuración de activación para el próximo despliegue de `test`, sin claves de producción y con avisos por correo deshabilitados. Se conserva el desafío de Cloudflare. El resultado final del despliegue y la promoción a `main` se registrará en la PR de activación; la [PR #9](https://github.com/prcamacho/autismo.ar/pull/9) publicó el código previo con ambos módulos apagados.

Producción conserva `main` y `autismo.ar`, con Supabase y correo según la [guía comunitaria](./docs/COMUNIDAD.md). Las protecciones y CI siguen pendientes; crear un entorno de pruebas no los configura. El costo de `test` se agrega al consumo compartido del workspace Railway, con importe dependiente del uso real.

El sitio se publica con Railway y el dominio `autismo.ar` se gestiona mediante Cloudflare. El repositorio remoto es `https://github.com/prcamacho/autismo.ar.git`. La escuela de Ian conserva su repositorio independiente. Su servicio alojado fue retirado por indicación del responsable, que utiliza la app sin requerir internet. Las antiguas rutas de integración y la ficha del recurso se eliminaron, sin redirects ni un interruptor que conserve código inactivo. Esas URLs corresponden ahora al comportamiento 404 normal del código publicado.
