# Registro de decisiones

## DEC-004 - Modo claro y oscuro como requisito transversal

- **Fecha:** 11 de noviembre de 2026.
- **Estado:** implementado en código; verificaciones automáticas y revisión visual local completadas el 11 de noviembre de 2026. Publicación pendiente.
- **Decisión:** contemplar ambos temas en cada sección y función nueva o modificada. Centralizar colores semánticos y ofrecer un botón de sol/luna en la cabecera, accesible con teclado y visible en móvil.
- **Comportamiento:** el selector es público y no requiere iniciar sesión. Seguir el tema del dispositivo hasta que la persona elija claro u oscuro. Guardar la preferencia solo en el navegador, aplicarla antes del primer pintado y sincronizarla entre pestañas. Si el almacenamiento falla, mantener disponible el cambio durante la navegación actual. Imprimir con fondo claro.
- **Motivo:** permitir una lectura cómoda y coherente, sin destellos claros al cargar el tema oscuro ni componentes que solo se vean correctamente en un tema.
- **Alcance:** paletas, controles, avisos y estados existentes; no agrega dependencias, servicios, datos de cuenta ni consumo de backend. Conservar la identidad del logotipo y el `noindex` vigente.
- **Validación al retomar:** `npm run build` completó la compilación, TypeScript y la generación de las 12 páginas estáticas; `npm run lint`, las 13 pruebas existentes y Prettier sobre los archivos de tema y documentación pasaron. No se reprodujo el error anterior de permisos durante la compilación.
- **Revisión visual:** Chrome local, sin sesión y con Supabase desconectado. Se comprobó el cambio claro/oscuro, la persistencia al navegar y recargar, la sincronización entre dos pestañas, activación por teclado y foco visible. Se revisaron portada, directorio, orientación, biblioteca, comunidad, cuenta, formulario de aporte, proyecto y 404, incluidos campos deshabilitados, selección de categorías y avisos. Vistas de escritorio de 1366 px y móvil de 390 px; también se revisó la cabecera y el proyecto a 320 px sin desbordamiento horizontal. No se observaron errores de consola durante el recorrido.
- **Límites:** no se enviaron aportes ni correos y no se probaron los recorridos privados de moderación. La preferencia del dispositivo, impresión y almacenamiento bloqueado se revisaron en código; no se emularon esos escenarios en esta sesión. El bloqueo inicial de acceso local se resolvió cuando el responsable inició el servidor desde su terminal, sin cambiar permisos ni protecciones.

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
