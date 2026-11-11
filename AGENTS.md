# Guía para trabajar en autismo.ar

Leé [VISION_Y_PLAN.md](./VISION_Y_PLAN.md) antes de modificar el producto. Es la referencia de objetivos, principios, fases y decisiones pendientes. El README contiene las instrucciones de ejecución; comprobá el código para conocer el estado implementado.

Para tareas de desarrollo, leé [la guía de trabajo](./docs/DESARROLLO.md). Antes de intervenir en servicios, despliegues, datos o consumo, leé [la guía de operación](./docs/OPERACION.md). Consultá [las decisiones registradas](./docs/DECISIONES.md) cuando afecten al pedido. Estos documentos tienen alcance en este repositorio; no presuponen cambios en Vin ni en el código independiente de la app de Ian.

- Construimos una red comunitaria argentina para personas autistas de todas las edades y sus familias. La portada combina información general, búsqueda de recursos y ubicación.
- Organizá recursos nacionales, provinciales y locales sin duplicar fichas. Conservá la diferencia entre datos comprobables, experiencias, publicidad y estado de revisión.
- No inventes profesionales, testimonios, estadísticas, teléfonos, beneficios, fuentes ni descargas. La escuela de Ian es independiente y no tiene integración en este repositorio; no restaures su conexión ni ofrezcas archivos o APK sin un pedido explícito.
- No simules cuentas, envíos guardados, validaciones, pagos o soporte de emergencias. Explicá los estados vacíos y funciones todavía pendientes con claridad.
- Base técnica: Next.js, React, TypeScript y CSS propio. PostgreSQL/Supabase son la dirección prevista para el backend; verificá si realmente están conectados antes de afirmarlo.
- Mantené navegación accesible, diseño adaptable a celulares, etiquetas de formularios, foco visible, contraste y respeto por movimiento reducido. Evitá estímulos innecesarios.
- Minimizá datos personales. No expongas información de menores, documentación médica, domicilios familiares ni claves privadas. Validá permisos y entradas en el servidor cuando exista persistencia.
- La reputación no certifica calidad clínica ni se compra. Moderación sensible, campañas familiares, hospedaje y rifas requieren el diseño previo indicado en la visión.
- Preservá cambios ajenos y limitá las modificaciones al pedido. Evitá borrar o reemplazar trabajo existente sin revisar su alcance.
- Ejecutá las verificaciones disponibles y proporcionales al cambio; revisá visualmente las interfaces cuando sea posible. Informá qué comprobaste y cualquier limitación real.
- Actualizá la documentación si cambian decisiones importantes o el estado de una función. Diferenciá lo planificado de lo implementado y de lo que ya está operativo.

## Forma de trabajo acordada

- Antes de programar, resumí el resultado esperado, el alcance y cómo comprobarlo; recomendá modelo y nivel de razonamiento según dificultad, riesgo y consumo. En tareas pequeñas, hacelo en pocas líneas. No afirmes haber cambiado de modelo sin comprobarlo.
- Resolvé ambigüedades menores y reversibles indicando la suposición. Si distintas interpretaciones cambian funciones, datos, costos, privacidad o comportamiento, consultá esa decisión y avanzá con el trabajo independiente. Respetá autorizaciones previas y evitá pedir confirmaciones rutinarias.
- Proponé mejoras adicionales por separado. No incorpores funciones, cambios de reglas ni refactorizaciones ajenas al alcance autorizado.
- Conservá módulos con responsabilidades claras, reutilizá lo existente y centralizá reglas o valores compartidos que puedan cambiar. Validá la configuración; no confundas evitar duplicación con volver configurable todo o agregar abstracciones sin uso concreto.
- Leé y buscá de forma focalizada, evitá volcados completos innecesarios y conservá el contexto útil en la documentación. Optimizá el consumo total hasta obtener un resultado verificado; mantené las mismas exigencias de calidad al cambiar de modelo.
- El flujo acordado es `test` para pruebas y `main` para producción, con entornos separados. Su configuración todavía requiere comprobación. No publiques cambios directos en `main` para eludir ese flujo ni presentes una rama, una prueba local o un dominio como prueba de aislamiento.
- Antes de cambios con impacto en consumo, explicá recursos afectados, cuotas compartidas, posible costo e incertidumbres. No pauses ni reutilices recursos de otro proyecto para resolver un cupo sin autorización.
- Cada cambio debe conservar su motivo y validación en el historial de Git o la solicitud de integración; registrá decisiones importantes y enlazá commits o despliegues reales cuando existan. Nunca inventes identificadores ni declares operativo algo solo por estar documentado.
- En cambios de interfaz o preparación de una entrega, señalá detalles pertinentes: iconos, metadatos, enlaces compartidos, indexación, accesibilidad, móvil y estados de carga, vacío y error. Proponé lo pendiente sin ampliar silenciosamente la tarea.
- Al incorporar funciones críticas, definí su detección de errores y recuperación. Revisá también fallas de navegador, integraciones y resultados incompletos; los logs del servidor por sí solos no prueban cobertura. Protegé datos personales y secretos en los registros.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
