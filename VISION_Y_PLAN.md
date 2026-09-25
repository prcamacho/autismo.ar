# autismo.ar — Visión y plan vivo

> Última actualización: 24 de septiembre de 2026. Este documento orienta el producto y el trabajo de futuras personas e inteligencias artificiales. Es una propuesta evolutiva: las decisiones pueden cambiar y deben actualizarse aquí cuando cambien.

## 1. Para qué existe

Crear una red argentina de información y ayuda para personas autistas y sus familias. Que lo que una familia aprendió con esfuerzo pueda facilitarle el recorrido a otra, desde la infancia hasta la adolescencia y la vida adulta.

La comunidad aporta información, propone correcciones y ayuda a comprobarla, con una dinámica inspirada en las contribuciones de Google Maps. El objetivo es reducir progresivamente la intervención administrativa mediante buenas herramientas y colaboradores confiables. No se presupone que una plataforma comunitaria pueda funcionar sin moderación, especialmente al comenzar.

El proyecto nace sin un directorio propio ni contenido comunitario cargado. Su primer recurso real es la versión beta de la app de Ian, publicada desde un origen autorizado y accesible bajo `/apps/ian/` en el dominio principal.

## 2. Principios que deben guiar las decisiones

- **Utilidad concreta:** encontrar ayuda cerca, entender un trámite o descubrir un recurso debe ser sencillo.
- **Participación con trazabilidad:** saber de dónde viene un dato, cuándo se revisó y qué se corrigió.
- **Todas las edades:** contemplar niños, adolescentes y adultos, así como transiciones entre etapas.
- **Voz propia:** dar participación a personas autistas, además de familiares y profesionales. No hablar siempre en su nombre.
- **Independencia partidaria:** evitar propaganda y disputas partidarias. Informar derechos, organismos y beneficios con fuentes no constituye propaganda.
- **Accesibilidad:** diseño legible y predecible, navegación con teclado, foco visible, contraste suficiente y movimiento reducido.
- **Privacidad por defecto:** no exigir publicar diagnósticos ni información íntima para participar.
- **Honestidad:** distinguir dato corroborado, experiencia personal, contenido pendiente de revisión y anuncio pago.
- **Crecimiento gradual:** habilitar funciones cuando existan condiciones técnicas y humanas para sostenerlas.

## 3. Cómo se organiza la información

### Alcance territorial

Un recurso puede tener alcance nacional, provincial o local. La selección de provincia y localidad ayuda a ordenar lo relevante, pero no debe impedir consultar recursos nacionales ni explorar otras ubicaciones.

Las provincias y localidades serán entidades con identificadores estables. La búsqueda debe admitir localidades homónimas y presentar su provincia. CABA necesita una representación coherente dentro de las jurisdicciones; los barrios u otras subdivisiones se incorporarán si aportan utilidad.

### Una ficha, varias formas de encontrarla

Cada entidad real tiene una ficha canónica. Un centro con varias terapias aparece en múltiples categorías sin duplicarse. Las sedes y sus horarios se modelan por separado cuando corresponda.

Un beneficio nacional tendrá una guía nacional y, si hace falta, instrucciones o contactos locales vinculados. No se copiará toda la guía en cada provincia. Antes de crear fichas se sugerirán posibles coincidencias; deberá existir una forma de proponer la unión de duplicados.

Los recuentos futuros expresarán cuántos profesionales o recursos están **registrados en el sitio** para un lugar. No se presentarán como un censo completo de los servicios disponibles.

## 4. Qué queremos que las personas encuentren

| Área                   | Contenido previsto                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Salud y terapias       | Neurólogos, otros profesionales, centros de terapia, especialidades, sedes, contacto, horarios y modalidades de atención. |
| Educación              | Escuelas, apoyos educativos, orientación y experiencias familiares.                                                       |
| Movilidad              | Transportes, accesibilidad, servicios y orientación sobre beneficios de viaje.                                            |
| Derechos y trámites    | Subsidios, prestaciones, beneficios, viajes y otros apoyos, con fuente, alcance y fecha de revisión.                      |
| Vida cotidiana         | Actividades, apoyos para distintas edades, autonomía y recursos prácticos.                                                |
| Comunidad y contención | Grupos de ayuda, redes de familias y servicios profesionales de apoyo y atención de crisis.                               |
| Hospedaje solidario    | Posible red de alojamiento comunitario para quienes deben trasladarse; requiere un diseño específico antes de activarse.  |
| Biblioteca             | Apps, PDFs, materiales imprimibles, guías, recetas y otros recursos útiles.                                               |
| Emprendimientos        | Espacio para productos y servicios de las familias, con categorías y reglas claras.                                       |
| Historias y redes      | Contenido que las familias y personas autistas quieran compartir desde sus propias redes.                                 |

Las recetas y materiales cotidianos no se presentarán como tratamientos. No se admitirán promesas de curación ni recomendaciones clínicas sin sustento. Las páginas informativas deben usar lenguaje respetuoso y fuentes verificables.

### Ficha mínima de un servicio

- Nombre, categoría y descripción breve.
- Provincia, localidad, sede o zona de cobertura; dirección pública cuando corresponda.
- Teléfono, sitio o canal de contacto, horarios y modalidad, si se conocen.
- Edades atendidas y datos de accesibilidad, cuando estén informados.
- Fuente de cada dato relevante, fecha de última corroboración e historial de cambios.
- Acciones para sugerir correcciones, confirmar datos y reportar problemas.

Un campo desconocido debe figurar como no informado. Confirmar un teléfono o un horario no certifica la calidad del servicio ni las credenciales profesionales.

## 5. Portada y navegación inicial

La portada combinará información general con acceso práctico a los recursos:

1. Presentación breve de autismo.ar y de su propósito comunitario.
2. Información general de bienvenida y orientación para distintas etapas de la vida, sin intentar diagnosticar ni indicar tratamientos.
3. Buscador con la pregunta **“¿Qué recurso necesitás?”** y selección de provincia y localidad.
4. Accesos a profesionales, centros, educación, transporte, beneficios, comunidad y biblioteca.
5. Explicación breve de cómo aportar y cómo se revisa la información.
6. Espacio para presentar el proyecto de app de Ian y los recursos reales que se incorporen.

La navegación inicial debe ofrecer inicio, directorio, biblioteca, comunidad y participación. Las secciones aún no operativas deben explicar su estado sin simular funciones disponibles.

### Identidad y páginas vacías

La identidad inicial solicitada es una pieza de rompecabezas multicolor con predominio azul. Se usará de forma tranquila, sin animaciones insistentes ni saturación visual. Esta elección podrá revisarse con el responsable del proyecto y la comunidad.

Las páginas vacías tendrán el símbolo y una invitación útil: “Todavía no tenemos recursos en esta localidad. ¿Conocés alguno?”. Cuando todavía no se puedan enviar aportes, la interfaz lo explicará en lugar de simular un envío exitoso.

No se inventarán fichas, reseñas, cifras, testimonios ni descargas para rellenar el diseño. Los datos de demostración, si alguna vez se necesitan en desarrollo, estarán identificados y separados de los datos públicos.

## 6. Participación, validación y reputación

### Flujo previsto

1. Una persona identifica un recurso o propone un cambio.
2. El sistema comprueba campos, posibles duplicados y señales básicas de abuso.
3. El aporte conserva su autoría, fuentes y estado de revisión.
4. Colaboradores independientes corroboran datos concretos.
5. El cambio se publica según su riesgo y las reglas vigentes; queda un historial recuperable.
6. Cualquier persona puede señalar errores, y los conflictos pasan a revisión.

En el primer piloto, cada grupo de datos nuevo o modificado requiere al menos una corroboración de alguien distinto del autor. Se exige una revisión inicial de privacidad y una decisión de moderación para publicar; un desacuerdo pendiente bloquea la publicación. Nadie puede moderar su propio aporte. El número de confirmaciones podrá ajustarse con la experiencia. No basta con una mayoría de votos para establecer la veracidad. Cambios de contacto, identidad, cobro o información sensible requieren mayor cuidado.

### Niveles y reconocimientos

Premiar aportes útiles y corroborados, correcciones válidas y mantenimiento de información. Evitar recompensar simplemente cantidad de publicaciones o popularidad. Los puntos y nombres de niveles todavía no están definidos.

La reputación puede habilitar responsabilidades graduales, pero no otorga autoridad clínica. No se compran niveles, validaciones ni posiciones orgánicas con dinero o publicidad.

### Moderación y prevención del abuso

- Separar datos verificables de experiencias personales; conservar vías de reporte y respuesta.
- Evitar autovalidaciones y considerar conflictos de interés, cuentas falsas y grupos que se confirman entre sí.
- Limitar envíos repetidos, mantener registros de cambios y permitir revertir ediciones perjudiciales.
- Priorizar por riesgo las revisiones humanas; definir referentes locales conforme crezca la comunidad.
- Explicar decisiones de moderación y permitir apelaciones proporcionadas.
- Recordar periódicamente qué información necesita revisión y mostrar su antigüedad.

La automatización podrá detectar duplicados, ordenar reportes y sugerir correcciones. Las decisiones clínicas, acusaciones, conflictos graves y situaciones de crisis no se delegarán a una puntuación automática.

## 7. Privacidad, contenido sensible y confianza

Los perfiles públicos no necesitan mostrar nombre completo, domicilio particular ni documentación médica. El diseño deberá minimizar datos personales, permitir corregirlos o eliminarlos y separar la identidad de una cuenta de su presentación pública.

No se publicarán datos identificatorios de menores, estudios clínicos ni información íntima como condición para acceder a ayuda. El contenido familiar debe respetar el consentimiento y la privacidad de las personas involucradas.

Antes de activar experiencias, campañas, alojamiento o contacto entre particulares se definirán sus medidas específicas de protección, reportes y resolución de incidentes. No habrá mensajería privada ni publicación de domicilios familiares por defecto.

Para contención y prevención del suicidio, comenzar con un acceso claro a servicios profesionales cuyas vías de contacto se hayan verificado. El sitio no promete atención de emergencias, disponibilidad permanente ni seguimiento clínico. No se inventarán teléfonos ni se publicará una lista sin fuente y fecha de revisión.

Los beneficios y trámites deben enlazar fuentes pertinentes y advertir su fecha y jurisdicción. Los requisitos regulatorios y de protección de datos serán revisados antes de lanzar funciones que los necesiten; este documento no sustituye esa revisión.

En biblioteca y redes se compartirán materiales propios, autorizados o con licencias compatibles. Conservar autoría y condiciones de uso; preferir enlaces al original cuando no exista permiso de redistribución. No republicar PDFs ni contenido de terceros por el solo hecho de que estén accesibles en Internet.

## 8. Sostenibilidad y oportunidades para las familias

- **Donaciones al sitio:** sostener infraestructura y operación, con destino y rendición comprensibles.
- **Ayuda económica a familias:** circuito separado, con verificación, consentimiento, trazabilidad y reglas contra el fraude antes de aceptar fondos.
- **Publicidad:** permitir anuncios de familias, profesionales, centros y empresas. Identificarlos claramente y mantenerlos separados de reputación y validación.
- **Emprendimientos:** dar visibilidad a ofertas reales; definir cómo se reportan problemas antes de considerar funciones de comercio.
- **Contenido en redes:** permitir que sus autores presenten enlaces y contenido autorizado, sin copiar automáticamente publicaciones personales.
- **Rifas:** idea pendiente. No implementar cobros, venta de números ni sorteos hasta resolver su viabilidad y requisitos por jurisdicción.

No se asume que el sitio custodiará dinero, procesará pagos para terceros ni garantizará servicios. Cada circuito económico exige una decisión expresa y un diseño específico.

## 9. Tecnología y evolución de arquitectura

### Base elegida

- **TypeScript, React y Next.js** para la aplicación web, sus rutas y la evolución hacia funciones de servidor.
- **CSS propio al comienzo**, con estilos y componentes reutilizables. Tailwind es una alternativa futura, no una dependencia obligatoria.
- **PostgreSQL y Supabase como dirección prevista** para datos, autenticación y archivos cuando se implemente la comunidad.
- Experiencia orientada primero a celulares; listas útiles desde el inicio. Un mapa y funciones PWA pueden sumarse cuando resuelvan necesidades reales.

El repositorio incorpora el primer circuito comunitario: cuentas por código de correo, propuestas, revisión inicial, corroboración por campo, publicación moderada, historial y reportes. La conexión de producción sigue pendiente: la cuenta de Supabase consultada llegó al límite de proyectos gratuitos. Sin configuración se ofrecen borradores locales y se explica ese estado. Nunca incluir claves privadas en el navegador ni en el repositorio. La activación y los límites del piloto están en [docs/COMUNIDAD.md](./docs/COMUNIDAD.md).

### Límites entre partes

Mantener separados el diseño compartido, las páginas, el catálogo de categorías y ubicaciones, los tipos del dominio y el acceso a datos. Empezar con una sola aplicación organizada; no hacen falta microservicios para validar el producto.

Las páginas deben consumir una capa clara de datos que luego pueda conectarse al servidor. Las operaciones de escritura necesitarán validación en servidor, permisos y controles de acceso; ocultar un botón no protege los datos.

Entidades previstas: recursos, categorías, sedes, ubicaciones, cobertura, fuentes, propuestas de cambio, corroboraciones, reportes, perfiles, roles y eventos de reputación. Experiencias, campañas y anuncios se incorporarán como funciones separadas cuando corresponda.

Conservar URLs estables y filtros compartibles. Planificar búsqueda, paginación, índices, copias de seguridad y revisión de acceso al incorporar datos reales, sin construir infraestructura innecesaria antes de tener uso.

## 10. Fases y criterios para avanzar

| Fase               | Entrega                                                                                                        | Criterio para pasar a la siguiente                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0 — Esqueleto      | Portada, navegación, directorio vacío con filtros, biblioteca, comunidad, participación y este plan.           | Se puede recorrer en móvil y teclado; no hay contenido ficticio ni acciones que aparenten guardar datos. |
| 1 — Piloto real    | Datos persistentes, cuentas, aportes, correcciones e historial; primeras fichas en una zona elegida.           | Un pequeño grupo puede aportar y corregir información, con revisión humana y recuperación de cambios.    |
| 2 — Comunidad      | Corroboraciones, reportes, niveles, recordatorios de actualización y referentes locales.                       | Hay controles contra abuso y evidencia de que los datos se mantienen útiles.                             |
| 3 — Más recursos   | Más localidades, biblioteca ampliada, emprendimientos y contenido de autores; experiencias con reglas propias. | Cada sección tiene responsables operativos, fuentes y una forma de atender problemas.                    |
| 4 — Sostenibilidad | Donaciones al sitio y publicidad identificada; evaluar campañas familiares y hospedaje por separado.           | Existen procesos de transparencia, protección y revisión adecuados a cada función.                       |

Las rifas no tienen una fase de activación comprometida. Las etapas pueden ajustarse; ninguna implica publicar automáticamente todas las funciones mencionadas.

### Señales de que el producto funciona

Observar si las personas encuentran recursos útiles, si los contactos siguen vigentes, cuánto tardan las correcciones y qué proporción de aportes necesita intervención. Medir calidad y cobertura real antes que cantidad de cuentas o puntos otorgados.

## 11. Estado inicial y próximos pasos

**Estado actual:** fase 0 publicada y circuito del piloto implementado localmente, pendiente de activar su base, correo y despliegue. Orientación y directorio comparten fichas; las cuentas, propuestas, corroboraciones, historial y reportes tienen código y migración, pero aún no operan en producción. Sin conexión, el formulario descarga/carga borradores en el dispositivo. La localidad sigue siendo texto libre. La beta de Ian conserva su PWA bajo `/apps/ian/`; no se ofrece un APK. No hay fichas comunitarias reales ni pagos. La existencia del código no implica que la función esté operativa.

Próximos pasos concretos:

1. Revisar el esqueleto visual y ajustar las prioridades y el lenguaje con el responsable del proyecto.
2. Elegir una localidad o un grupo pequeño para el piloto, manteniendo la estructura nacional.
3. Probar la versión beta de la app de Ian en distintos dispositivos y mantener actualizados su acceso, presentación y atribuciones.
4. Validar con el grupo las reglas iniciales y los campos ya implementados.
5. Resolver el cupo de Supabase, aplicar la migración y configurar correo, moderadores y despliegue.
6. Cargar las primeras fichas con información verificable y probar corrección, reporte y actualización con familias participantes.

Pendientes de decisión: localidad inicial, responsables de moderación, términos de participación, canales de contacto y presupuesto de la base. Railway aloja la web y Cloudflare gestiona el dominio. Resolver lo pendiente al activar el piloto.

## 12. Cómo mantener este documento

Registrar aquí cambios de visión, prioridades o decisiones de arquitectura que afecten al proyecto. El README explica cómo ejecutar la aplicación; este archivo explica para quién se construye, qué se busca y qué todavía está pendiente.

Toda futura IA debe distinguir entre **visión**, **funcionalidad implementada** y **servicio operativo**. Consultar el código y las comprobaciones actuales antes de afirmar que algo funciona. Si se cambia el alcance, actualizar también esta referencia para que la siguiente colaboración parta del estado real.
