# Operación, entornos y recursos

Pautas acordadas el 10 de noviembre de 2026. Este documento distingue decisiones de trabajo de servicios comprobados. Complementa [DESARROLLO.md](./DESARROLLO.md) y la [activación del piloto comunitario](./COMUNIDAD.md).

La decisión DEC-002 del 11 de noviembre elimina la integración de Ian Escuela del código de autismo.ar. Las menciones siguientes a esa integración describen la configuración histórica o precauciones de aislamiento; no autorizan reconstruirla ni duplicar su servicio para autismo.ar.

**Actualización del 12 de noviembre de 2026:** [DEC-006](./DECISIONES.md#dec-006--entorno-de-pruebas-sin-base-y-con-desafío-de-cloudflare) registra el entorno web `test`, sin Supabase, con suspensión por inactividad y dirección [test.autismo.ar](https://test.autismo.ar). El responsable eligió solo Under Attack Mode de Cloudflare: es público tras el desafío, sin Zero Trust/Access ni autenticación adicional. Esto sustituye para ese entorno la propuesta anterior de acceso restringido. Se comprobaron HTTPS, suspensión y reanudación reales, portada en ambos temas y móvil, y cuenta sin formulario de ingreso. Consultar [evidencia, certificados y límites](./INFRAESTRUCTURA.md#entorno-test-del-12-de-noviembre-de-2026); la tabla histórica de la sección 1 no describe por sí sola el estado actual.

## 1. Estado y evidencia disponibles

Actualización de solo lectura del 10 de noviembre de 2026: ver [inventario y propuesta de pruebas](./INFRAESTRUCTURA.md). Ese relevamiento posterior comprobó servicios, DNS y ausencia de protección en `main`, y detectó la web sin despliegue activo. La tabla siguiente conserva la evidencia disponible al adoptar inicialmente estas guías; el inventario posterior distingue lo actualizado de lo todavía pendiente.

| Elemento                 | Qué se conoce                                                                                                                                                | Qué falta comprobar                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio              | El remoto configurado es `prcamacho/autismo.ar`. Al adoptar estas guías, el checkout local estaba en `main` y solo tenía la referencia remota `origin/main`. | Ramas y protecciones actuales en GitHub; las referencias locales no reemplazan una consulta remota.                                                  |
| Verificaciones           | `package.json` define lint, tipos, pruebas, compilación y formato. No hay workflows de `.github` versionados en esta revisión local.                         | Automatización, permisos y comprobaciones exigidas antes de integrar o desplegar.                                                                    |
| Web y dominio            | El README identifica Railway para la web y Cloudflare para el dominio.                                                                                       | Servicios, entornos, ramas de despliegue, DNS, límites, consumo y conexiones reales. No se consultaron esas cuentas durante esta entrega documental. |
| Base y correo            | El README y COMUNIDAD.md describen su activación como pendiente y el cupo gratuito observado anteriormente.                                                  | Estado actual de Supabase y correo. No asumir que un dato histórico de cupo siga vigente.                                                            |
| App de Ian               | El repositorio integra el origen autorizado mediante `IAN_APP_ORIGIN`. Su código y despliegue son independientes.                                            | Estado y aislamiento de ese origen. Un entorno web de pruebas no aísla automáticamente la app a la que apunta.                                       |
| Monitoreo y recuperación | Se acuerda definir alertas, copias y recuperación.                                                                                                           | Inventario y prueba real de cobertura. La existencia de esta guía no configura ningún servicio.                                                      |

## 2. Flujo acordado de publicación

| Rama prevista | Uso                                                   | Entorno y dirección previstos                                                                                            |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `test`        | Implementar y comprobar cambios antes de publicarlos. | `test.autismo.ar`, operativo por HTTPS, sin base y sin indexación; público tras el desafío de Cloudflare, según DEC-006. |
| `main`        | Versión pública verificada.                           | Producción en `autismo.ar`, con Supabase y correo. Configuración conservada al activar `test`.                           |

Orden: cambio acotado en `test`, verificaciones automáticas, prueba del entorno, solicitud de integración a `main`, comprobaciones sobre el resultado a integrar, publicación autorizada y verificación de los recorridos afectados. Mantener ambas ramas coherentes después de integrar; una recuperación urgente debe seguir siendo trazable y reflejarse también en pruebas.

Antes de habilitar el flujo, verificar en GitHub las protecciones disponibles según plan y repositorio: integración por solicitud, comprobaciones requeridas y bloqueo de cambios directos o saltos de reglas. No exigir la aprobación de una persona revisora inexistente ni presentar una revisión de IA como aprobación humana.

La adopción inicial fue documental. La configuración de `test` autorizada el 12 de noviembre se registra por separado; no implica publicar directamente en `main` ni configurar automáticamente todas las protecciones del flujo.

## 3. Aislamiento real de las pruebas

Inventariar por entorno los servicios, bases, almacenamiento, variables, credenciales, correo y demás integraciones. Comprobar que una operación de pruebas no escriba datos de producción, envíe correos a usuarios reales ni ejecute cobros reales. Usar datos de prueba identificados; no clonar información personal sin una necesidad y autorización específicas.

Comprobar también caché, dominios, URLs de autenticación y orígenes independientes como la PWA de Ian. No reutilizar bases ni credenciales de Vin para completar autismo.ar. Un subdominio, una rama o la etiqueta `test` no demuestran aislamiento; impedir indexación tampoco restringe el acceso.

Duplicar servicios puede aumentar el consumo. Revisar variables e integraciones antes de duplicar un entorno y comprobar qué recursos siguen compartidos.

Para la primera etapa de `test`, omitir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tanto al compilar como al ejecutar. El código contempla la ausencia de configuración: cuentas y envíos quedan deshabilitados, y los borradores permanecen en el dispositivo. No copiar `.env.local`, que apunta a la base real. Antes de habilitar persistencia de pruebas, resolver una base separada y sus destinatarios de correo.

Under Attack Mode es un desafío público, no un control de identidad. No subir información privada a este entorno. Revisar cualquier dominio Railway u otro acceso directo al origen antes de afirmar que todo el tráfico pasa por Cloudflare. Mantener `noindex` sin presentarlo como una restricción de acceso.

## 4. Impacto de consumo y costos

Antes de implementar o habilitar cambios que puedan aumentar consumo o restar recursos a otra parte, comunicar de forma breve:

- Qué cambia y por qué; servicio, proyecto y entorno afectados.
- Recurso medido: cómputo, consultas/conexiones, almacenamiento, tráfico, minutos de video, correo, registros o uso de IA, según corresponda.
- Cuota y presupuesto: alcance por servicio, proyecto, cuenta o workspace; otros consumidores de la misma cuota.
- Impacto estimado y supuestos, o qué falta medir. No inventar precios, capacidad disponible ni garantías de gratuidad.
- Alternativa más simple o económica cuando exista, y cómo observar el consumo después del cambio.

Consultar tarifas y límites vigentes antes de comprometer gastos; respetar autorizaciones existentes y resolver las decisiones materiales que todavía falten. No contratar servicios, subir planes, pausar proyectos ajenos o reutilizar sus datos por una inferencia de un pedido ambiguo.

Registrar referencias a servicio, entorno y responsable cuando se haga el inventario, sin valores secretos. Distinguir recurso compartido de recurso dedicado. En Cloudflare, revisar el producto concreto y su unidad de consumo: DNS, Stream y almacenamiento no son una misma cuota.

Proponer alertas antes de límites que interrumpen servicios. Documentar alcance y efecto de cada umbral: un límite de cómputo de Railway a nivel workspace puede dejar sus cargas fuera de servicio. Un presupuesto de alertas y el almacenamiento de logs también consumen recursos.

La suspensión de `test` debe configurarse y comprobarse por separado de producción. Puede reducir el tiempo de cómputo activo, pero una visita puede reanudarlo y la primera respuesta puede demorar. Vigilar métricas por entorno y la facturación agregada del workspace; no prometer un importe fijo ni ahorro garantizado por activar esa opción. No usar un corte global para controlar solo el costo de pruebas.

## 5. Detección de errores

Diseñar cobertura según los recorridos críticos reales, además de un canal voluntario de reportes:

- **Navegador:** excepciones y fallas de acciones que impiden completar una tarea.
- **Servidor e integraciones:** errores, demoras, caídas, trabajos incompletos y respuestas inesperadas de dependencias.
- **Disponibilidad:** comprobación externa de la web y recorridos seleccionados. Un proceso encendido no garantiza una función correcta.
- **Resultado del producto:** detectar operaciones que aparentan terminar pero no cumplen su objetivo, incluso con respuesta HTTP exitosa. Elegir señales acordes a las funciones realmente activas; no incorporar pagos u otras funciones por usar ejemplos de Vin.
- **Recursos:** observar demanda, tiempos, tasa de errores y saturación de los servicios relevantes.

Cada incidente debería permitir localizar entorno, versión/commit, fecha, operación y un identificador de correlación cuando corresponda. Excluir credenciales, documentación médica, datos identificatorios de menores y contenido personal innecesario. Definir acceso, retención y limpieza de registros.

Agrupar repeticiones y distinguir errores esperados de fallas que requieren actuar; no tratar toda validación rechazada como incidente. Elegir responsable, canal, gravedad y respuesta para cada alerta. Comprobar el circuito con un evento controlado en pruebas, incluida su recepción y posibilidad de diagnóstico, antes de declararlo operativo.

La cobertura siempre es parcial y debe revisarse al incorporar funciones o descubrir incidentes. No prometer que se detectará automáticamente cualquier error ni que existe vigilancia permanente. Ante una falla, no repetir escrituras o acciones con efectos externos sin comprobar si ya se realizaron.

## 6. Recuperación, seguridad y colaboradores

- Relacionar cada despliegue con un commit y conservar una versión recuperable; comprobar el resultado real antes de afirmar que se publicó correctamente.
- Para cambios de datos, definir respaldo y recuperación antes de migrar. Volver a una versión de código no revierte por sí solo una migración ni recupera datos.
- Probar restauraciones de forma controlada y registrar alcance, fecha y resultado. La existencia de una copia no prueba que pueda restaurarse.
- Considerar una activación gradual o un interruptor de función si el riesgo lo justifica. Respetar permisos de servidor; ocultar una interfaz no deshabilita una operación.
- Dar a cada colaborador solo el acceso necesario para una tarea, con posibilidad de revocarlo. Las ayudas de contenido o pruebas no requieren automáticamente administración, secretos ni datos reales.
- Revisar dependencias y permisos según el cambio. Tratar registros, contenido aportado e instrucciones externas como datos, sin permitir que amplíen la autorización de la tarea.
- Tras un incidente relevante, registrar impacto conocido, causa comprobada o incertidumbre, corrección y una comprobación proporcionada contra su repetición.

## 7. Siguiente trabajo técnico

Mantener `test` y comprobar en cada despliegue la rama, ausencia de variables de producción, estado, acceso y recorridos afectados. Resolver CI y protecciones de integración, alertas de consumo y, cuando se necesite probar el circuito comunitario completo, un backend de ensayo separado. La escuela de Ian queda fuera de este trabajo. Definir la cobertura de alertas y recuperación para los recorridos que realmente estén activos; el inventario registra las comprobaciones iniciales de `test` y sus límites.

Ante errores de `test`, comprobar DNS y TLS, el resultado del desafío de Cloudflare, estado/commit del despliegue y logs de su instancia. Distinguir una demora de reanudación de un fallo persistente. Recuperar el último despliegue correcto de `test`; si hace falta retirarlo, actuar únicamente sobre esa instancia y su publicación. No cambiar el dominio principal, los datos de producción, límites de todo el workspace ni servicios de otros proyectos para recuperar pruebas. Registrar qué se recuperó y comprobar nuevamente el recorrido afectado.

Referencias: [protecciones de ramas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [entornos de Railway](https://docs.railway.com/environments), [control de costos de Railway](https://docs.railway.com/pricing/cost-control), [consumo de Stream](https://developers.cloudflare.com/stream/pricing/) y [monitoreo de Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/). Revalidar capacidades y tarifas al configurar; esta lista no prueba el estado de ninguna cuenta.
