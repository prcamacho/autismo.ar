# Vista previa de búsqueda por prestación

Pedido: combinar búsqueda por palabras habituales y exploración por categorías, para revisar exclusivamente en `test` antes de decidir su incorporación a producción.

Ruta: `/busquedas/prestaciones`, enlazada desde Búsquedas únicamente cuando el servidor está en el entorno Railway `test` o en desarrollo local sin un entorno Railway definido. El control se evalúa por petición; producción y entornos desconocidos no habilitan la página. No se cambia la configuración de servicios.

Incluye una muestra editorial de once prestaciones de la [Resolución 428/1999 actualizada](https://www.argentina.gob.ar/normativa/nacional/62835/actualizacion), consultada el 19 de noviembre de 2026. Las categorías son propias de navegación. Las palabras relacionadas no definen equivalencias entre roles profesionales y prestaciones. La selección solo vive en memoria del navegador; no guarda avisos ni filtra publicaciones existentes. No se agregan tarifas, datos personales, APIs ni migraciones.

Interfaz: sugerencias visibles, cinco resultados iniciales y opción de ampliar, filtro por categoría combinable con el texto, recuperación sin coincidencias y resumen de elección. Usa iconos existentes y colores semánticos para ambos temas. Las guías `forms` y `accessibility` de Modern Web Guidance orientaron etiquetas visibles, controles nativos, estado anunciado con demora y gestión del foco al seleccionar. La comprobación de mantenimiento vigente es la registrada en AGENTS.md el 17/11/2026.

Para compilar se excluye `test-results` de TypeScript: contiene artefactos locales ignorados, incluidos guiones de integración temporales con errores ajenos al producto. No se eliminan esos archivos ni se desactiva la comprobación de tipos del código fuente o de `tests`.

Validación local (19/11/2026): 72 pruebas aprobadas, incluidos búsqueda y restricción por entorno; lint, TypeScript y compilación completos. Recorrido en Chrome con configuración aislada de test, en escritorio y 390 × 844, con ambos temas: búsqueda «fono» y «MAI», combinación con categorías, recuperación sin coincidencias, selección y cambio, ampliación de resultados y foco con teclado. Sin desborde horizontal en móvil. El recorrido remoto se verifica tras el despliegue. La revisión no equivale a aprobar el catálogo completo ni imponer el nomenclador a las publicaciones actuales.

Recuperación: revertir el commit de esta vista en `test` o volver al despliegue anterior de ese servicio. No requiere recuperar datos. Una integración futura en producción necesita una decisión explícita sobre catálogo, correspondencias, persistencia y migración de publicaciones.
