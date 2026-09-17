# Guía para trabajar en autismo.ar

Leé [VISION_Y_PLAN.md](./VISION_Y_PLAN.md) antes de modificar el producto. Es la referencia de objetivos, principios, fases y decisiones pendientes. El README contiene las instrucciones de ejecución; comprobá el código para conocer el estado implementado.

- Construimos una red comunitaria argentina para personas autistas de todas las edades y sus familias. La portada combina información general, búsqueda de recursos y ubicación.
- Organizá recursos nacionales, provinciales y locales sin duplicar fichas. Conservá la diferencia entre datos comprobables, experiencias, publicidad y estado de revisión.
- No inventes profesionales, testimonios, estadísticas, teléfonos, beneficios, fuentes ni descargas. La app de Ian usa el origen autorizado configurado en `IAN_APP_ORIGIN`; no ofrezcas otro archivo o APK sin autorización.
- No simules cuentas, envíos guardados, validaciones, pagos o soporte de emergencias. Explicá los estados vacíos y funciones todavía pendientes con claridad.
- Base técnica: Next.js, React, TypeScript y CSS propio. PostgreSQL/Supabase son la dirección prevista para el backend; verificá si realmente están conectados antes de afirmarlo.
- Mantené navegación accesible, diseño adaptable a celulares, etiquetas de formularios, foco visible, contraste y respeto por movimiento reducido. Evitá estímulos innecesarios.
- Minimizá datos personales. No expongas información de menores, documentación médica, domicilios familiares ni claves privadas. Validá permisos y entradas en el servidor cuando exista persistencia.
- La reputación no certifica calidad clínica ni se compra. Moderación sensible, campañas familiares, hospedaje y rifas requieren el diseño previo indicado en la visión.
- Preservá cambios ajenos y limitá las modificaciones al pedido. Evitá borrar o reemplazar trabajo existente sin revisar su alcance.
- Ejecutá las verificaciones disponibles y proporcionales al cambio; revisá visualmente las interfaces cuando sea posible. Informá qué comprobaste y cualquier limitación real.
- Actualizá la documentación si cambian decisiones importantes o el estado de una función. Diferenciá lo planificado de lo implementado y de lo que ya está operativo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
