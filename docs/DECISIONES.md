# Registro de decisiones

## DEC-006 — Entorno de pruebas sin base y con desafío de Cloudflare

- **Fecha:** 12 de noviembre de 2026.
- **Estado:** entorno operativo por HTTPS, con suspensión y reanudación reales comprobadas el 12 de noviembre de 2026. Despliegue `6f7ccc8b-d142-42ee-9051-14ede4243ddd`, commit [ce968d1](https://github.com/prcamacho/autismo.ar/commit/ce968d1312700c1013f4a209edcfab9f0c4d8201). La evidencia, incluidos el proxy y el estado del certificado de Railway, está en [INFRAESTRUCTURA.md](./INFRAESTRUCTURA.md#entorno-test-del-12-de-noviembre-de-2026).
- **Problema:** la rama `test` necesita una dirección propia para revisar cambios antes de promoverlos a `main`, con consumo acotado y sin escribir en la base real.
- **Decisión:** crear un entorno Railway `test` para la web de la rama homónima, publicar `test.autismo.ar` mediante Cloudflare y habilitar suspensión por inactividad. No copiar las variables de Supabase de producción ni crear una base, correo, volúmenes o servicios de Ian para esta etapa. Conservar `noindex, nofollow`.
- **Acceso elegido por el responsable:** usar únicamente Under Attack Mode de Cloudflare, sin Zero Trust/Access ni autenticación adicional. Esta decisión modifica para este entorno la exigencia anterior de acceso restringido: el sitio es público para quien supere el desafío. Under Attack Mode no autentica personas ni garantiza bloquear todo tráfico automatizado; `noindex` tampoco impide entrar. Verificar y documentar por separado cualquier dirección pública del origen que no pase por Cloudflare.
- **Alcance funcional:** comprobar presentación, navegación, formularios sin envío y borradores locales. Cuentas, correos, aportes persistidos y moderación requieren después un backend de pruebas separado. No considerar aislada una futura integración solo por usar la rama o el subdominio de pruebas.
- **Consumo:** la nueva instancia añade RAM, CPU y tráfico al mismo workspace Railway. La suspensión puede reducir el tiempo activo, con demora al reanudar; tráfico externo puede despertarla. El costo final depende del uso y del saldo compartido con otros proyectos. No se autoriza detener otros servicios ni cambiar planes o límites globales para compensarlo.
- **Validación:** rama y despliegue correctos, ausencia de variables Supabase, DNS con proxy, desafío, HTTPS público, `noindex, nofollow`, portada en claro/oscuro y móvil, cuenta sin ingreso y ciclo real de suspensión/reanudación comprobados. Sin errores ni advertencias de consola durante el recorrido. La configuración de producción coincide con la anterior a la intervención. No se probaron todos los formularios ni estados de error, no se enviaron correos o aportes y no se modificó código de producto.
- **Recuperación:** ante un problema, revisar el despliegue y los logs de `test`; recuperar su último despliegue correcto o detener únicamente esa instancia y su publicación si fuera necesario. Este procedimiento no se ensayó mediante una interrupción destructiva.
- **Pendientes:** la creación de `test` no configura por sí misma CI, protecciones de GitHub, alertas de presupuesto ni backend de ensayo. Observar consumo real antes de atribuir un ahorro o un costo mensual a la suspensión.

## DEC-005 — Presentación neutral centrada en el propósito

- **Fecha:** 12 de noviembre de 2026.
- **Estado:** publicado en producción el 12 de noviembre de 2026 y comprobado en el navegador en claro y oscuro, móvil y escritorio. El responsable autorizó la promoción desde `test` para revisar en el dominio público, dado que todavía no existe un entorno público de pruebas.
- **Decisión:** presentar autismo.ar por su propósito —facilitar el acceso a información y recursos sobre autismo en Argentina— sin atribuir su creación a familias ni a organizaciones. Mantener un tono neutral, claro, cálido y sobrio, con las personas autistas como participantes con voz propia y lugar para familias y profesionales.
- **Motivo:** hacer explícito el alcance del espacio para sus distintos públicos y evitar que el origen familiar se perciba como una restricción a la participación. La seriedad debe apoyarse en fuentes, revisión y transparencia, sin sugerir aval institucional ni autoridad clínica.
- **Alcance:** portada, navegación, pie, presentación del proyecto, directorio, comunidad, biblioteca, estado vacío compartido y metadatos. Frase de identidad: “Información que orienta. Una comunidad que conecta.” Descripción principal: “Información y recursos sobre autismo en Argentina.” Se conserva el sentido específico de las iniciativas familiares, las reglas de participación, los estados de disponibilidad, el logotipo y el `noindex`.
- **Continuidad:** pauta incorporada en `AGENTS.md`, `VISION_Y_PLAN.md` y `README.md` para futuros textos, metadatos y estados de interfaz. Es un cambio editorial; no incorpora funciones ni modifica las condiciones de iniciativas futuras.
- **Validación:** lint, las 13 pruebas existentes, compilación de producción con TypeScript y formato de los archivos modificados aprobados. El HTML generado de portada, proyecto, comunidad, biblioteca, orientación y 404 conserva el `noindex` y muestra el pie neutral, sin las antiguas atribuciones familiares. La compilación usó Supabase desconectado. Los estilos y colores semánticos de ambos temas no cambian.
- **Revisión visual:** el bloqueo inicial de Computer Use se resolvió en la sesión de publicación. En `https://autismo.ar` se revisaron portada, proyecto, directorio, comunidad y biblioteca a 1366 px y 390 px, en claro y oscuro: textos, navegación, iconos, campos deshabilitados y estados vacíos visibles. Se comprobó el cambio de tema, su conservación al navegar y recargar, los metadatos neutrales y el `noindex, nofollow`. No se observaron errores de consola durante el recorrido. No se enviaron aportes ni correos y no se probaron los recorridos privados, la recuperación de errores, el foco completo por teclado ni la preferencia inicial del dispositivo.
- **Corrección del desborde móvil (12 de noviembre):** la órbita decorativa `orbit-two` sobresalía unos 7 px a 320 px. Se ajustaron su ancho y posición en el breakpoint móvil para que su caja rotada quede dentro de la ilustración, sin recortar el contenido ni ocultar el desborde de toda la página. Comprobación local en claro y oscuro a 320, 390, 600, 768 y 1366 px: `scrollWidth` coincide con `clientWidth` en todos los casos; a 320 px ambos miden 305 px, descontando la barra vertical. Sin errores de consola durante esa revisión. Lint, compilación con TypeScript y formato aprobados; la solicitud de integración del ajuste registra su publicación y comprobación posterior.
- **Publicación:** [PR 5](https://github.com/prcamacho/autismo.ar/pull/5), commit editorial [274148e](https://github.com/prcamacho/autismo.ar/commit/274148eb71e2343c66d01b68381aea79d1d128e3) y merge [e5ea65d](https://github.com/prcamacho/autismo.ar/commit/e5ea65d8d68d737af826464aac86c251d039397d). Railway publicó ese merge con despliegue `faffbbba-c829-4910-8637-3e17d4c566ff` en estado `SUCCESS`. Se preservaron también las notas locales de seguimiento de DEC-003 y DEC-004 que estaban pendientes de versionar. El resultado y las comprobaciones se registran en la solicitud de integración.

## DEC-004 - Modo claro y oscuro como requisito transversal

- **Fecha:** 11 de noviembre de 2026.
- **Estado:** publicado y verificado en producción el 11 de noviembre de 2026, después de completar verificaciones automáticas y revisión visual local.
- **Decisión:** contemplar ambos temas en cada sección y función nueva o modificada. Centralizar colores semánticos y ofrecer un botón de sol/luna en la cabecera, accesible con teclado y visible en móvil.
- **Comportamiento:** el selector es público y no requiere iniciar sesión. Seguir el tema del dispositivo hasta que la persona elija claro u oscuro. Guardar la preferencia solo en el navegador, aplicarla antes del primer pintado y sincronizarla entre pestañas. Si el almacenamiento falla, mantener disponible el cambio durante la navegación actual. Imprimir con fondo claro.
- **Motivo:** permitir una lectura cómoda y coherente, sin destellos claros al cargar el tema oscuro ni componentes que solo se vean correctamente en un tema.
- **Alcance:** paletas, controles, avisos y estados existentes; no agrega dependencias, servicios, datos de cuenta ni consumo de backend. Conservar la identidad del logotipo y el `noindex` vigente.
- **Validación al retomar:** `npm run build` completó la compilación, TypeScript y la generación de las 12 páginas estáticas; `npm run lint`, las 13 pruebas existentes y Prettier sobre los archivos de tema y documentación pasaron. No se reprodujo el error anterior de permisos durante la compilación.
- **Revisión visual:** Chrome local, sin sesión y con Supabase desconectado. Se comprobó el cambio claro/oscuro, la persistencia al navegar y recargar, la sincronización entre dos pestañas, activación por teclado y foco visible. Se revisaron portada, directorio, orientación, biblioteca, comunidad, cuenta, formulario de aporte, proyecto y 404, incluidos campos deshabilitados, selección de categorías y avisos. Vistas de escritorio de 1366 px y móvil de 390 px; también se revisó la cabecera y el proyecto a 320 px sin desbordamiento horizontal. No se observaron errores de consola durante el recorrido.
- **Límites:** no se enviaron aportes ni correos y no se probaron los recorridos privados de moderación. La preferencia del dispositivo, impresión y almacenamiento bloqueado se revisaron en código; no se emularon esos escenarios en esta sesión. El bloqueo inicial de acceso local se resolvió cuando el responsable inició el servidor desde su terminal, sin cambiar permisos ni protecciones.
- **Publicación:** [PR 4](https://github.com/prcamacho/autismo.ar/pull/4) integrado en `test` y promoción a `main` mediante [PR 3](https://github.com/prcamacho/autismo.ar/pull/3), merge `ed7eec4e7210f23c65f64f0d05050229137c6915`. Railway publicó ese commit con despliegue `a31351b0-5a34-465b-8e2d-373c3253cd3f` en estado `SUCCESS`; ambas ramas quedaron sincronizadas. En https://autismo.ar se verificaron los dos temas sin sesión, persistencia al recargar y navegar, y ausencia de errores de consola durante la comprobación. No hay entorno alojado `test` ni CI configurados: las pruebas previas fueron locales con Supabase desconectado.

## DEC-003 — Retirar el alojamiento de Ian Escuela

- **Fecha:** 11 de noviembre de 2026.
- **Decisión del responsable:** la escuela se usa sin requerir internet; su alojamiento existía para mostrarla en autismo.ar y se pospone ese uso. Se descarta migrarla o crear otro proyecto alojado.
- **Resultado comprobado:** la retirada del código se integró mediante [PR 1](https://github.com/prcamacho/autismo.ar/pull/1), merge `4a4cc5318728a9cd365687b4da3f3c4b6f52b732`. Railway publicó ese commit con despliegue `5b00e4d2-2af6-4d7d-a6db-73e89e366b0a` en estado `SUCCESS` antes de retirar el servicio de la escuela.
- **Alojamiento retirado:** servicio `ian_escuela_autismo` (`e737786b-ee52-446d-90a7-0e33c4137af0`) del proyecto autismo.ar. No tenía volúmenes ni variables configuradas. La consulta posterior lista únicamente el servicio autismo.ar, online, sin operaciones pendientes.
- **Conservación:** el repositorio `prcamacho/ian_escuela_autismo` permanece disponible; no se modificaron archivos, instalación o datos del dispositivo de Ian. No se verificó el funcionamiento offline del dispositivo durante esta tarea ni se creó un alojamiento sustituto.
- **Accesos:** la antigua dirección pública alojada de la escuela deja de estar disponible. Si más adelante se quiere mostrar o reinstalar desde internet, habrá que preparar un nuevo despliegue autorizado.

## DEC-002 — Eliminar la integración de Ian Escuela

- **Fecha:** 11 de noviembre de 2026.
- **Estado:** solicitado por el responsable; eliminación implementada en código local, pendiente de publicación.
- **Decisión:** eliminar la conexión completa de autismo.ar con la escuela, sin conservar código deshabilitado: ficha exclusiva, visor, proxy, manifiesto transformado, utilidades, variable de ejemplo, accesos, estilos exclusivos y pruebas de la función retirada.
- **Motivo:** desarrollar autismo.ar y la escuela de manera independiente y reducir dependencias y mantenimiento innecesarios.
- **Consecuencias:** la biblioteca informa que todavía no hay materiales publicados. Las antiguas rutas tendrán la respuesta 404 normal al publicar. No se detuvo ni modificó el servicio, repositorio, URL independiente o almacenamiento de la escuela. No se modificaron datos del dispositivo de Ian.
- **Trazabilidad:** crear la rama local falló por permisos de escritura en `.git`; el cambio se prepara en la rama remota `test` mediante GitHub. El commit real queda en el historial de esa rama. No se publica directamente en `main` ni se despliega desde esta entrega. Los documentos anteriores conservan observaciones históricas; no son instrucciones para restablecer la integración.
- **Validación:** lint, tipos, ocho pruebas vigentes y build completo aprobados. Se retiraron las tres pruebas que solo verificaban la función eliminada. La generación inicial conservaba un validador de desarrollo obsoleto de Next; se eliminó únicamente ese archivo generado y el build posterior terminó correctamente.

Conservar decisiones que cambian cómo construimos u operamos el proyecto. Los detalles de cada corrección pertenecen a su commit o solicitud de integración; el código y sus versiones se conservan en Git.

Cada entrada debe indicar fecha, estado, problema, decisión, motivos, consecuencias y vínculos reales a implementación o validación. Registrar cambios posteriores como una decisión que sustituye o modifica la anterior, sin borrar su contexto. No incluir conversaciones privadas ni claves.

## DEC-001 — Reglas de desarrollo y operación con IA

- **Fecha:** 10 de noviembre de 2026.
- **Estado:** criterios acordados; adopción documental local preparada. Configuración técnica y publicación pendientes.
- **Problema:** pedidos ambiguos y cambios directos en producción pueden introducir funciones ajenas al objetivo, duplicación de reglas, costos inesperados y fallas que solo se conocen por reportes. Se necesita conservar el motivo y evidencia de los cambios entre conversaciones.
- **Decisión:** mantener instrucciones concisas en [AGENTS.md](../AGENTS.md), procedimientos en [DESARROLLO.md](./DESARROLLO.md) y [OPERACION.md](./OPERACION.md), y conservar la [visión](../VISION_Y_PLAN.md), el [README](../README.md) y la [guía comunitaria](./COMUNIDAD.md) como referencias de producto e implementación.
- **Motivo:** combinar claridad para la IA con verificaciones, historial y controles operativos proporcionales al proyecto.

### Acuerdos

1. Explicitar resultado, alcance y criterio de aceptación antes de programar. Resolver suposiciones menores y consultar ambigüedades con consecuencias materiales, respetando permisos previos.
2. Mantener módulos claros, reutilización y configuración compartida donde corresponda; conservar decisiones particulares con motivo y evitar abstracciones sin necesidad.
3. Recomendar modelo y razonamiento según tarea, riesgo y consumo; evaluar Luna, Sol y Astra sin una escalada obligatoria ni ahorros prometidos. Mantener las exigencias de calidad.
4. Usar `test` y `main` con entornos aislados, verificaciones y un proceso trazable de promoción. Configuración pendiente de comprobar e implementar.
5. Explicar impacto de recursos y costos, incluidas cuotas compartidas, antes de cambios que puedan afectarlos.
6. Conservar motivo y evidencia por cambio; enlazar commits y despliegues reales. Documentar decisiones duraderas y estados operativos comprobados.
7. Proponer detalles pertinentes de interfaz y entrega sin incorporarlos fuera de alcance.
8. Definir monitoreo, recuperación, seguridad y permisos según las funciones activas; comprobar las alertas y restauraciones antes de declararlas disponibles.

### Consecuencias y seguimiento

La documentación reduce dependencias de la memoria del chat, pero no garantiza cumplimiento ni implementa controles. Se debe comprobar su aplicación en una nueva conversación y revisar las pautas con evidencia de uso.

Esta adopción no modifica código de producto, bases, ramas remotas, presupuestos ni servicios; tampoco cambia otros repositorios. El inventario y la separación de entornos son el siguiente trabajo técnico descrito en OPERACION.md.

**Seguimiento del 10 de noviembre:** el [relevamiento inicial](./INFRAESTRUCTURA.md) ya consultó GitHub, Railway y Cloudflare y dejó una propuesta de separación. Supabase y la facturación completa de Railway conservan limitaciones de acceso. No se implementó la propuesta ni se modificó infraestructura.

**Trazabilidad inicial:** todavía no hay commit, solicitud de integración ni despliegue de esta adopción documental. Cuando se integre, registrar aquí o en la solicitud correspondiente los identificadores reales y las verificaciones; no inventarlos ni usar el identificador de un cambio anterior como si correspondiera a este.
