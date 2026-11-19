# Vista previa de búsqueda por prestación

> Actualización del 19/11/2026: esta experiencia se sustituyó en la nueva implementación para test por el [catálogo normalizado de servicios](./CATALOGO_SERVICIOS.md). La ruta redirige a `/busquedas` y las tarjetas relacionadas ya no aparecen en la portada. Lo siguiente conserva el contexto de la prueba anterior, no el comportamiento nuevo.

Pedido: combinar búsqueda por palabras habituales y exploración por categorías, para revisar exclusivamente en `test` antes de decidir su incorporación a producción.

Ruta: `/busquedas/prestaciones`, enlazada desde Búsquedas únicamente cuando el servidor está en el entorno Railway `test` o en desarrollo local sin un entorno Railway definido. El control se evalúa por petición; producción y entornos desconocidos no habilitan la página. No se cambia la configuración de servicios.

Incluye una muestra editorial de once prestaciones de la [Resolución 428/1999 actualizada](https://www.argentina.gob.ar/normativa/nacional/62835/actualizacion), consultada el 19 de noviembre de 2026. Las categorías son propias de navegación. Las palabras relacionadas no definen equivalencias entre roles profesionales y prestaciones. La selección solo vive en memoria del navegador; no guarda avisos ni filtra publicaciones existentes. No se agregan tarifas, datos personales, APIs ni migraciones.

Interfaz: sugerencias visibles, cinco resultados iniciales y opción de ampliar, filtro por categoría combinable con el texto, recuperación sin coincidencias y resumen de elección. Usa iconos existentes y colores semánticos para ambos temas. Las guías `forms` y `accessibility` de Modern Web Guidance orientaron etiquetas visibles, controles nativos, estado anunciado con demora y gestión del foco al seleccionar. La comprobación de mantenimiento vigente es la registrada en AGENTS.md el 17/11/2026.

Para compilar se excluye `test-results` de TypeScript: contiene artefactos locales ignorados, incluidos guiones de integración temporales con errores ajenos al producto. No se eliminan esos archivos ni se desactiva la comprobación de tipos del código fuente o de `tests`.

Validación local (19/11/2026): 72 pruebas aprobadas, incluidos búsqueda y restricción por entorno; lint, TypeScript y compilación completos. Recorrido en Chrome con configuración aislada de test, en escritorio y 390 × 844, con ambos temas: búsqueda «fono» y «MAI», combinación con categorías, recuperación sin coincidencias, selección y cambio, ampliación de resultados y foco con teclado. Sin desborde horizontal en móvil. El recorrido remoto se verifica tras el despliegue. La revisión no equivale a aprobar el catálogo completo ni imponer el nomenclador a las publicaciones actuales.

Recuperación: revertir el commit de esta vista en `test` o volver al despliegue anterior de ese servicio. No requiere recuperar datos. Una integración futura en producción necesita una decisión explícita sobre catálogo, correspondencias, persistencia y migración de publicaciones.

## Ayuda desde la portada

El usuario probó «fono» en el buscador principal y no recibió ayuda porque la vista previa estaba separada. La portada ahora habilita, bajo el mismo control de entorno por petición, sugerencias visibles debajo del campo desde dos caracteres. Reutiliza la muestra existente y ofrece un enlace que conserva el texto en la vista de categorías. Distingue estas referencias de la disponibilidad profesional; el botón Buscar conserva el envío al directorio y los filtros territoriales. El directorio compacto no cambia.

La portada pasa a renderizarse por petición para evaluar el entorno real. La ayuda también muestra los nombres coincidentes de los nueve servicios ya usados en publicaciones: por ejemplo, «fono» muestra «Fonoaudiología». Reutiliza esa lista y la normalización del catálogo. No realiza consultas a la base ni agrega servicios. Sigue pendiente ampliar las referencias de especialidades, sinónimos y errores ortográficos; actualmente la búsqueda de la muestra ignora tildes y mayúsculas y admite coincidencias parciales, pero no corrige escritura.

Verificación de esta corrección: 72 pruebas, lint y compilación con TypeScript aprobados; comprobación adicional de equivalencia entre «fono» y «FONOAUDIOLOGÍA». Chrome local en escritorio y 390 × 844, claro/oscuro, ayuda inmediata, estado vacío, enlace con teclado y conservación de consulta. El envío normal al directorio conservó texto, provincia y localidad. Con el mismo build y configuración aislada, el servidor iniciado con entorno Railway `production` no entregó ni la ayuda ni el enlace de prueba en la portada. El estado remoto queda registrado en la PR de la corrección.
