# Registro de decisiones

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
