# Artículos de la comunidad

## Estado y alcance

Implementación del 17 de noviembre de 2026, según [DEC-007](./DECISIONES.md#dec-007--artículos-con-personalización-guiada-y-cafecito-en-el-perfil). Incluye artículos y agendas con lectura pública, borradores, revisión independiente, historial, reportes, firma editorial y apoyo opcional mediante Cafecito. El editor ofrece bloques y estilos predefinidos; no admite código ejecutable ni CSS libre.

**Preparación del 17 de noviembre, previa a la PR #10:** la migración de artículos se aplicó en las bases separadas de ensayo y producción. El recorrido remoto autenticado pasó en ensayo, junto con RLS, revisión independiente, consultas anónimas y HTML servido por la aplicación aislada; se confirmó la limpieza de sus datos sintéticos. Durante esa preparación se mantuvo `ARTICLES_ENABLED=false` en producción. El estado resultante de la activación y su evidencia se registran en la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10). La [PR #9](https://github.com/prcamacho/autismo.ar/pull/9) corresponde a la primera publicación del código con el módulo apagado. Estas comprobaciones no acreditan entrega de correos ni aportes monetarios realizados. Consultar [OPERACION.md](./OPERACION.md) antes de habilitar servicios.

## Organización y recorridos

| Capa                                                            | Responsabilidad                                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/articles/model.ts`, `validation.ts`, `content.ts` | Documento tipado, límites, validación de borrador/publicación, fechas y resumen compartible.                                                 |
| `cafecito.ts`                                                   | Reconocer el botón o enlace admitido, validar el destino y conservar únicamente su identificador de perfil. Nunca ejecutar el código pegado. |
| `article-editor.tsx` y editores de bloques, agenda y tabla      | Edición, opciones de presentación, vista previa e importación/exportación de un borrador JSON local.                                         |
| `actions.ts`, `mutation.ts`, `repository.ts`, `config.ts`       | Validación en servidor, sesión, RPC, consultas, activación explícita, errores y actualización de vistas.                                     |
| `db-contract.ts` y `202611170010_articles.sql`                  | Contrato de datos, reglas SQL, RLS, transacciones y permisos. La migración depende de las migraciones comunitarias anteriores.               |

| Ruta                                                                 | Uso                                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/articulos` y `/articulos/[id]`                                     | Lista paginada y lectura de la última versión publicada.                                                                  |
| `/articulos/autores/[id]`                                            | Firma editorial y artículos públicos del autor.                                                                           |
| `/articulos/nuevo`                                                   | Preparación de un artículo o agenda; sin conexión habilitada permite trabajar con un archivo local, sin simular un envío. |
| `/cuenta/perfil-autor`                                               | Nombre público y configuración de Cafecito.                                                                               |
| `/cuenta/articulos` y `/cuenta/articulos/[id]`                       | Borradores propios, envío a revisión, edición, historial, recuperación y retiro.                                          |
| `/comunidad/revisar/articulos` y `/comunidad/revisar/articulos/[id]` | Revisión de artículos, destinos de Cafecito y reportes; requieren moderación.                                             |

La firma editorial y el perfil profesional tienen propósitos distintos y comparten la misma cuenta de autenticación. No se crea una segunda cuenta para publicar artículos.

## Configuración y activación

### Videos de YouTube

Implementación local del 25/11/2026: el editor incluye **Video de YouTube**, con título, URL y elección entre **Dentro del artículo** y **Como enlace a YouTube**. El bloque de enlace anterior se conserva sin cambios. No se admiten archivos de video ni HTML pegado. El contenido nuevo usa `{ type: "youtube", label, url, display: "link" | "embed" }` y comparte los límites de bloques, título del enlace y URL existentes.

`youtube.ts` admite URLs HTTPS de videos individuales `watch?v=`, `youtu.be`, `shorts`, `live` y `embed`, con dominios exactos y un ID de 11 caracteres. Rechaza canales, listas sin video, credenciales, puertos, parámetros `v` duplicados y destinos ajenos. Los parámetros de seguimiento, inicio y fragmentos no se trasladan al reproductor ni al enlace normalizado. `validation.ts` y `article_youtube_id` en SQL verifican el mismo contrato; la base sigue comprobándolo incluso si se omite la aplicación.

`ArticleContent` sirve la publicación, vista previa y revisión. `youtube-video.tsx` no carga miniaturas, iframes ni scripts externos hasta pulsar **Cargar video**. Usa `youtube-nocookie.com`, sin reproducción automática, título accesible, foco visible y tamaño adaptable, con los colores semánticos de ambos temas. El lector puede cerrar y volver a cargar el reproductor; **Ver en YouTube** permanece accesible incluso sin JavaScript. La carga tiene aviso y, si demora, una alternativa. El evento de carga del iframe no acredita que el video sea reproducible: las restricciones del dueño, edad, eliminación o bloqueo de YouTube pueden impedirlo, y se conserva el enlace alternativo.

La moderación previa, el historial y los reportes existentes cubren el bloque y cambios de URL o presentación. No hay análisis automático del contenido ni verificación de titularidad del canal. El panel recuerda revisar el video y su privacidad; el historial conserva el documento y el enlace, no una copia del material externo. Cambios hechos en YouTube no generan una nueva revisión en autismo.ar.

**Entrega y recuperación:** aplicar `20261125232130_article_youtube_blocks.sql` primero en ensayo, publicar el código compatible y verificar antes de promover a producción. La migración amplía el validador sin modificar documentos, roles, RLS o las RPC de moderación; añade una función interna sin ejecución pública. No deshacer el contrato SQL mientras existan bloques nuevos: una versión anterior del editor no los reconoce. Para recuperar una publicación usar su historial y una nueva aprobación; cualquier reversión de código debe conservar la lectura del bloque nuevo. En esta tarea no se aplicó la migración remota ni se desplegó.

El video se transmite entre YouTube y el navegador, sin almacenamiento ni proxy multimedia propios, sin API de datos ni dependencia nueva. Se mantienen las cuotas existentes de documentos y consultas; no se contrataron servicios. Modern Web Guidance (`privacy`) orientó la carga por clic y la ausencia de recursos externos previos; [YouTube](https://developers.google.com/youtube/player_parameters) documenta la inserción y [su ayuda](https://support.google.com/youtube/answer/171780?hl=es) las restricciones y privacidad mejorada.

**Comprobación local:** lint, TypeScript y compilación completos, formato y **82/82 pruebas** aprobados (`node --import tsx --test --test-concurrency=2 tests/*.test.ts`). Incluyen URLs, equivalencia TypeScript/SQL, importación JSON, compatibilidad con enlaces previos, revisión por otra cuenta, publicación de cambios y retirada por reporte. Una comprobación adicional del HTML renderizado con React confirmó que el modo incrustado entrega controles y enlace sin iframe ni miniatura inicial, el modo enlace normaliza el destino y una URL inválida muestra el aviso sin incorporar ese destino. La herramienta de navegador no logró adjuntar su vista local; queda pendiente verificar visualmente escritorio/móvil en claro/oscuro, teclado, carga y errores, y reproducir un video real. Esta limitación no se presenta como una comprobación visual aprobada.

### Variables del módulo

| Variable                                                            | Comportamiento                                                                                                                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Conexión existente, únicamente con clave publicable. Artículos no necesita `service_role`.                                                                                                                  |
| `ARTICLES_ENABLED`                                                  | Ausente o `false`: función sin conexión habilitada. Solo el valor exacto `true`, después de quitar espacios exteriores, permite continuar la validación. Otro valor da estado no disponible.                |
| `ARTICLES_EXPECTED_SUPABASE_HOST`                                   | Obligatorio al activar. Debe coincidir exactamente con `new URL(NEXT_PUBLIC_SUPABASE_URL).host`: sin protocolo ni ruta; incluir puerto si la URL lo tiene. No admite comodines ni coincidencias por sufijo. |
| `NEXT_PUBLIC_SITE_URL`                                              | Obligatorio al activar artículos: origen para enlaces canónicos y sociales del entorno. Si falta o es inválido, el módulo queda no disponible. Admite HTTPS y HTTP únicamente en `localhost` o `127.0.0.1`. |

El estado `ready` significa que la configuración es coherente; no demuestra que la migración exista, que el servidor responda ni que las políticas hayan sido probadas. Una consulta fallida se muestra como no disponible, diferenciada de una lista vacía.

Antes de activar: comprobar aislamiento real de base y correo, aplicar la migración nueva una sola vez mediante el procedimiento del entorno, designar moderadores y probar con cuentas distintas. No volver a ejecutar las migraciones iniciales sobre producción ni usar `.env.local` con datos sintéticos: la documentación existente indica que apunta a la base real.

**El interruptor web no revoca permisos de la base.** Si la migración ya fue aplicada, `ARTICLES_ENABLED=false` detiene las consultas y escrituras del módulo web, pero las RPC siguen disponibles para los roles a los que se concedió ejecución. Detener también el acceso directo requiere una intervención explícita sobre esos permisos y su comprobación.

## Datos, permisos y revisión

- `article_profiles` conserva la relación privada con `auth.users`, el nombre público y el destino de Cafecito. `article_author` entrega únicamente un UUID público distinto, el nombre y el destino aprobado; solo responde si hay al menos un artículo visible de ese perfil.
- `article_drafts` contiene la copia de trabajo y su revisión optimista. Autor y moderación pueden leerla; otro colaborador o un visitante no pueden. Cada mutación incrementa la revisión y rechaza formularios obsoletos.
- `articles` contiene la última copia aprobada. Las concesiones públicas excluyen el identificador de autenticación y RLS limita la lectura a filas visibles. `article_revisions` conserva versiones publicadas para autor y moderación, sin acceso público.
- `article_reports` es privado para quien reportó y moderación. No se exponen motivos o notas de revisión a los visitantes.
- No hay escritura directa de estas tablas para `anon` ni `authenticated`. Las RPC verifican identidad, pertenencia, rol, datos, estado y límites dentro de la transacción; ocultar controles en la interfaz no reemplaza esas reglas.

El recorrido es guardar borrador (`article_save`), enviar (`article_submit`) y aprobar o rechazar (`article_moderate`). El envío exige perfil de autor, contenido completo y, para una agenda, fechas válidas y una fuente. Nadie puede moderar su propio artículo o su propio destino de Cafecito. Una edición pendiente conserva la última publicación aprobada; guardar de nuevo la copia enviada invalida esa revisión pendiente.

`article_withdraw` oculta la publicación e invalida una revisión pendiente. `article_report` registra un reporte, y `article_resolve_report` permite resolverlo y, si corresponde, ocultar el artículo. Retirar no borra el historial privado. Recuperar una versión la copia como nuevo borrador: debe enviarse y aprobarse otra vez. El borrado de la cuenta elimina en cascada sus borradores, perfil, publicaciones y versiones, y sus reportes propios.

La acción de perfil acepta un destino HTTPS de `cafecito.app` reconocido por el importador; `article_profile_save` valida y conserva solo su identificador, sin guardar el código pegado. Cambiar el destino **o el nombre público** invalida su aprobación y vuelve a dejarlo pendiente; quitar el destino oculta el botón inmediatamente. `article_profile_moderate` registra la decisión independiente. Un destino rechazado no vuelve a la cola solo por guardar lo mismo: necesita una corrección. Cada artículo decide si muestra el botón, que además requiere un destino aprobado.

La revisión de ese enlace no acredita titularidad bancaria ni recepción de fondos. El aporte se completa en Cafecito. No hay campos para alias bancarios, CBU/CVU, procesamiento de transferencias, recaudaciones ni confirmaciones de pago.

## Límites, vistas previas y consumo

Los límites están centralizados en `model.ts` y se contrastan con SQL: título 160 caracteres, resumen 300, 40 bloques, 60 filas de agenda y 10 fuentes. Las listas admiten 30 elementos; las tablas, 8 columnas y 30 filas. La aplicación limita el documento compacto a 60.000 bytes UTF-8; SQL usa un techo defensivo de 65.536 bytes para `jsonb::text`, que añade espacios. SQL también verifica estructuras, destinos, fechas reales y textos no vacíos, incluidos espacios Unicode.

La base limita por cuenta a 120 escrituras exitosas por ventana de una hora, 20 borradores nuevos en 24 horas y 10 reportes en 24 horas. No admite dos reportes abiertos de la misma persona para un artículo. La exclusión mutua por cuenta protege los contadores de escrituras concurrentes; el contador ocupa una fila por cuenta, sin un registro de eventos que crezca indefinidamente.

Los metadatos del artículo se generan en el servidor desde la versión publicada: título, descripción, URL canónica, Open Graph y tarjeta de resumen. Compartir permite copiar el enlace o el resumen con enlace. Cada red controla recorte, presentación y caché; modificar o retirar una publicación no elimina inmediatamente una tarjeta ya almacenada por terceros. Mantener el `noindex` del piloto hasta una decisión de lanzamiento. Tras retirar Under Attack Mode, comprobar el acceso de los lectores de vistas previas con enlaces reales.

El consumo adicional corresponde a documentos y versiones en PostgreSQL, consultas, cómputo web y tráfico. Esta función no agrega generación por IA, almacenamiento de adjuntos ni un procesador de pagos. Las cuotas y el presupuesto pueden seguir compartidos con otros servicios; medir antes de atribuir un costo o garantizar gratuidad.

## Errores, recuperación y comprobaciones

Las consultas emiten `articles.query.failed` con el código técnico o `articles.query.unavailable`; las escrituras inesperadas emiten `articles.write.failed` o `articles.write.unavailable`. No registran correos, códigos de acceso, contenido del artículo ni fragmentos de Cafecito. Los errores esperados, como `STALE_VERSION`, `RATE_LIMIT`, `SELF_REVIEW`, `PROFILE_REQUIRED` e `INCOMPLETE_ARTICLE`, se traducen a mensajes útiles. Estos eventos de servidor no constituyen alertas externas ni cobertura completa del navegador.

Ante un guardado incierto, conservar el texto o descargar el borrador y comprobar Mis artículos antes de repetir la operación. Ante una revisión obsoleta, descargar los cambios locales, recargar y reconciliar; no sobrescribir la nueva versión. El archivo JSON no se envía al importar y su descarga no equivale a un guardado en la cuenta. El editor conserva el trabajo en memoria durante la sesión; descargarlo antes de cerrar si todavía no está guardado.

Para recuperar contenido publicado, usar el historial y una nueva revisión. Para un fallo de despliegue, recuperar el código verificado y revisar la configuración del entorno; volver atrás el código no revierte una migración ni restaura datos. La restauración de una copia de la base y el corte de permisos directos requieren procedimientos operativos propios, todavía no acreditados por las pruebas locales de artículos.

Comprobación local disponible: **8 pruebas de base de datos, 8 de dominio, 5 de sincronización del editor y 1 de URLs aprobadas**. Las de PGlite ejercitan las migraciones, RLS, concesiones, revisión independiente, instantáneas, conflictos, retiro, reportes, Cafecito, límites y eliminación en cascada. Las de dominio cubren validación, fechas, resumen e importación segura del destino. La sincronización conserva cambios locales al enviar o retirar sin aceptar contenido concurrente. Las URLs rechazan cambios de origen y configuración insegura. Se pueden ejecutar con:

```sh
node --import tsx --test tests/articles-content.test.ts tests/articles-database.test.ts tests/articles-editor-revision.test.ts tests/site-url.test.ts
```

En el navegador local se comprobó el editor sin conexión habilitada, escritorio oscuro y móvil de 390 píxeles en claro, sin desbordamiento horizontal. También se verificó el editor compilado en móvil de 320 píxeles en oscuro, con campos, foco de la vista previa y agenda legibles. Una agenda sintética mostró las fechas 20/11/2026 y 21/11/2026; el contenido con etiquetas de script se presentó como texto sin ejecutarse. No se guardaron ni publicaron esos datos. La captura local está en `test-results/articles/agenda-mobile-dark.jpg` (fuera de Git). Esta comprobación parcial no sustituye probar las pantallas con sesión ni todos sus estados.

### Evidencia remota del 17 de noviembre de 2026

- Proyecto de ensayo: `autismo-ar-test`, referencia `hmpqojhurrtujbcakzkv`. El trabajo coordinado aplicó `202611170010_articles.sql` junto con las migraciones iniciales sobre esa base vacía, y después las correcciones `005` y `006`.
- Comprobación independiente por API con la clave publicable: consulta anónima de las columnas públicas de `articles` con límite cero y llamada `article_author` para un UUID inexistente devolvieron HTTP 200; esta última devolvió una lista vacía. Fueron consultas de solo lectura.
- El permiso administrativo faltante en `community_members` se corrigió mediante `202611170005_exchange_admin_permissions.sql`, sin ampliar los permisos de artículos. La conexión directa de Supabase permitió aplicar y verificar esa corrección y `202611170006_account_lifecycle.sql`.
- `scripts/test-articles-integration.ts` **se ejecutó correctamente**, con cuentas sintéticas separadas, autenticación, RLS, moderación y limpieza final confirmada. Exige confirmación explícita, el host de ensayo exacto y el archivo local ignorado de ese entorno. No envía correo; el administrador se usa para Auth y para asignar el moderador, mientras el contenido se comprueba con clientes autenticados y anónimos.
- Con `ARTICLE_TEST_SITE_URL=http://127.0.0.1:3011` pasó también la comprobación de HTTP 404 antes de aprobar y después de retirar, y HTTP 200 con fechas, título, Open Graph y canonical correctos al publicar. Esto prueba el HTML servido por la aplicación aislada; no la tarjeta que una red social pueda generar o conservar en caché.
- En producción se aplicó `010` junto con las seis migraciones nuevas de Búsquedas mediante el paquete MCP `exchanges_articles_launch`, después de inspeccionar el esquema comunitario existente. Se preservó la única cuenta real y se asignó a la cuenta del responsable el rol de moderación. No se cargaron cuentas ni artículos sintéticos productivos.
- La verificación global final completó **69/69 pruebas**, lint sin errores, TypeScript y compilación. La revisión visual previa del editor fue parcial; no se pudo ampliar la revisión autenticada porque la herramienta de navegador bloqueó el control al no verificar la URL.

```sh
node --import tsx scripts/test-articles-integration.ts --confirm-test --expected-host hmpqojhurrtujbcakzkv.supabase.co
```

La versión desplegada, sus recorridos y el resultado final de activación se registran en la [PR #10](https://github.com/prcamacho/autismo.ar/pull/10). Siguen pendientes la revisión visual autenticada de sus estados en ambos temas y móvil, recuperación ante cortes del navegador y vistas previas reales en redes. El ensayo local de recuperación de restricciones de la base, descrito en [Búsquedas](./BUSQUEDAS.md#comprobaciones-y-recuperación), no equivale a un respaldo completo ni a una restauración integral.
