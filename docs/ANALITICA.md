# Analítica básica de producción

Decisión del 22/11/2026: incorporar autismo.ar al proyecto existente `Default project` (629107), organización `Vin Salta`, en PostHog US Cloud. El responsable autorizó compartir el proyecto y pidió **solo producción**. Esta excepción se limita a la analítica: no autoriza reutilizar bases, correo ni otros recursos de Vin.

## Alcance

Se envía únicamente `$pageview` al visitar secciones públicas de la lista permitida en `src/lib/analytics.ts`. Las fichas públicas de artículos, autores y profesionales se agrupan por tipo de página, sin sus IDs. Las páginas privadas, formularios de aportes, edición y moderación no generan eventos. Tampoco se registran cambios de filtros o parámetros dentro de la misma ruta.

El SDK oficial se carga de forma diferida solo cuando se permite medir. La captura automática, grabaciones, encuestas, experimentos, indicadores de rendimiento, errores y flags están desactivados. No se llama a `identify` ni se conecta la identidad con Supabase. El identificador aleatorio, exclusivo de autismo.ar, vive en memoria y cambia al recargar: los visitantes únicos son una aproximación por carga de documento, no personas identificadas ni usuarios recurrentes.

Un filtro final reemplaza las propiedades predeterminadas por una lista cerrada: ruta normalizada, dominio, entorno, identificador aleatorio y controles de privacidad. No se envían consultas, fragmentos, referencias de navegación, títulos, contenido de páginas, cuentas, mensajes ni entradas de formularios. Se omite el envío ante Do Not Track o Global Privacy Control. La información pública sobre estas estadísticas está en `/proyecto#estadisticas-title`.

El proyecto compartido ya tenía activada la opción `Discard client IP data`, comprobada el 22/11/2026 y conservada. Los eventos de autismo.ar además desactivan el enriquecimiento geográfico y reemplazan la propiedad de IP por `0.0.0.0`. Como en cualquier conexión directa, PostHog recibe la dirección de red al transportar la solicitud; no se promete anonimato absoluto.

## Configuración y aislamiento

Solo el servicio `autismo.ar` de Railway, entorno `production`, recibe:

- `POSTHOG_ENABLED=true`.
- `POSTHOG_PROJECT_TOKEN`: token público de captura `phc_`, obtenido del proyecto existente. Nunca usar una API key personal `phx_`.

Además deben coincidir `NODE_ENV=production`, `RAILWAY_ENVIRONMENT_NAME=production` y `NEXT_PUBLIC_SITE_URL=https://autismo.ar`. El navegador vuelve a exigir el origen exacto `https://autismo.ar`. Configuración ausente o inválida desactiva la captura. Las variables se evalúan al construir/renderizar la página; cualquier cambio de activación requiere desplegar de nuevo.

`test` y desarrollo local no reciben variables de PostHog. El código sigue el flujo habitual por `test` para comprobar su ausencia de captura, antes de la promoción a `main`. No enviar eventos sintéticos desde esos entornos al proyecto compartido.

## Consumo y operación

La organización comparte un cupo de un millón de eventos por ciclo. La revisión del 22/11/2026 mostró unos 14.600 eventos consumidos y 16.100 proyectados para el ciclo 25/10–24/11, sin grabaciones de sesiones. Son valores observados, no una garantía de consumo futuro. El plan gratuito sin tarjeta detiene la ingestión al llegar al límite; el corte afectaría a todos los dominios del proyecto. No se cambian el plan, presupuesto ni la instrumentación de Vin.

Separar estadísticas mediante `$host = autismo.ar` o `site = autismo.ar`; los datos y permisos permanecen compartidos. Revisar `Billing & usage` después de incorporar tráfico y considerar un aviso antes de consumir el cupo.

La analítica es opcional: un bloqueo del navegador o fallo de carga no interrumpe la navegación. La siguiente navegación vuelve a intentar cargar el SDK cuando una carga anterior falló; el SDK administra los reintentos de transporte. No se guardan errores que contengan URLs, formularios o credenciales. Una compilación o respuesta HTTP no demuestra que PostHog haya recibido eventos: verificar una visita pública real en Activity y sus propiedades. La cobertura de visitantes es parcial por bloqueadores y preferencias de privacidad.

Para detener la captura, establecer `POSTHOG_ENABLED=false` únicamente en el servicio productivo de autismo.ar y redesplegar; comprobar que deja de cargar/enviar PostHog. No cambiar el token compartido ni desactivar el proyecto de Vin.

## Evidencia de entrega

Implementación en preparación. Pruebas, solicitudes de integración, despliegues y recepción real pendientes de registrar; este documento por sí solo no acredita activación.

Referencias: [proyectos y separación por dominio](https://posthog.com/docs/settings/projects), [facturación compartida](https://posthog.com/docs/billing/common-questions), [controles de captura](https://posthog.com/docs/privacy/data-collection).
