# Catálogo normalizado de servicios

Implementación inicialmente autorizada el 19/11/2026 para `test`, publicada mediante la [PR #13](https://github.com/prcamacho/autismo.ar/pull/13). Sustituye la ayuda experimental de prestaciones de la portada. La migración `20261119224728_normalized_service_catalog.sql` se aplicó primero a Supabase `hmpqojhurrtujbcakzkv` (registro remoto `20261119230538`). El responsable autorizó la promoción a producción el 21/11/2026; las migraciones productivas, el commit, el despliegue y las comprobaciones resultantes se registran en la [PR #14](https://github.com/prcamacho/autismo.ar/pull/14).

## Buscar y publicar

La portada, Búsquedas y el directorio comparten selector de servicios. Escribir filtra las opciones debajo del campo; seleccionar guarda un identificador, nunca el texto escrito. Se ignoran mayúsculas y tildes, se consultan sinónimos y se sugieren errores próximos con selección explícita. No se promete reconocer cualquier error ortográfico. Flechas, Enter y Escape permiten usar el selector con teclado; los nombres ambiguos muestran varias opciones.

`Busco apoyo` es el modo inicial. Encuentra disponibilidades publicadas y fichas clasificadas del directorio. `Soy profesional` cambia el destino a solicitudes publicadas de personas adultas y familias, visibles únicamente con una cuenta ingresada. Cambiar de modo no cambia permisos ni convierte a una cuenta en profesional acreditado. Ofrecer servicios conserva el requisito de perfil público aprobado.

Las publicaciones usan servicio y rol del catálogo, ubicaciones oficiales, contratación y cobertura cerradas; el servidor genera el título. Las aclaraciones son opcionales. En recursos comunitarios, nombre de la entidad, descripción y fuentes siguen siendo texto; servicios son IDs, obligatorios para profesionales y centros, y las localidades son oficiales. Cobertura es información declarada, sin garantía de aceptación o financiación.

Las categorías generales del directorio (educación, transporte, derechos, etc.) se conservan: un recurso informativo no se fuerza a una especialidad clínica. Las fichas antiguas se conservan y pueden explorarse sin filtro de servicio. Para aparecer en una búsqueda específica deben clasificarse mediante una corrección y revisión. No se infiere una especialidad a partir del texto histórico.

## Lista inicial

Once apoyos y disciplinas: Apoyo a la inclusión escolar; Acompañamiento terapéutico; Psicología; Psicopedagogía; Fonoaudiología; Terapia ocupacional; Kinesiología; Trabajo social; Nutrición (licenciados); Psicomotricidad; Musicoterapia.

Veintidós especialidades médicas: Medicina general y de familia; Clínica médica; Pediatría; Geriatría; Neurología; Neurología infantil; Psiquiatría; Psiquiatría infantojuvenil; Fisiatría; Genética médica; Gastroenterología; Gastroenterología infantil; Endocrinología; Endocrinología infantil; Alergia e inmunología; Cardiología; Dermatología; Neumonología; Oftalmología; Otorrinolaringología; Ortopedia y traumatología; Ginecología.

Son opciones iniciales de navegación, no un catálogo exhaustivo de todas las intervenciones ni una recomendación clínica. Referencia de especialidades: [Resolución 4018/2023, Boletín Oficial](https://www.boletinoficial.gob.ar/detalleAviso/primera/299490/20231130?anexos=1). `src/features/services/seed.ts` y la migración conservan los nombres y aliases iniciales; una prueba comprueba su correspondencia. En ejecución, la fuente es `service_catalog` en la base: los cambios moderados no requieren recompilar el sitio.

Apoyo a la inclusión escolar admite además los roles MAI y AIE como elecciones diferenciadas. No se equiparan automáticamente entre sí ni con AT. Nomenclador de discapacidad, especialidad profesional y cobertura son conceptos separados. La antigua vista `/busquedas/prestaciones` redirige a Búsquedas; no se asignan prestaciones administrativas de forma automática. Una relación futura exige fuente, criterios y revisión específicos.

## Solicitar lo que falta

En la portada, quien busca apoyo puede ir desde el selector a «Directorio por categoría» y abrir una categoría sin elegir una especialidad. En «Soy profesional», el enlace lleva a las solicitudes de apoyo. Ambos recorridos conservan la provincia y la localidad seleccionadas. Al escribir un nombre sin coincidencias aparece «Sugerir un servicio para el catálogo». Si falla la carga del catálogo, se puede reintentar o usar el enlace del modo elegido.

`/catalogo/solicitar` recibe nombre, motivo y fuente opcional; requiere cuenta y participación habilitada. `/catalogo/solicitudes` muestra únicamente los pedidos de la propia cuenta y su respuesta. Desde una publicación incompleta se puede guardar un borrador privado junto con el pedido, aun sin haber elegido un servicio. Al resolverlo, se puede retomar el formulario con la opción aprobada. Su publicación requiere un envío y revisión independientes. Un pedido rechazado conserva su estado y motivo; no publica su borrador.

En `/catalogo/moderar`, moderación puede indicar una opción existente, agregar un sinónimo, incorporar un servicio con fuente o rechazar con explicación. No puede resolver pedidos propios. Hay control de concurrencia, límite de cinco pedidos diarios por cuenta e idempotencia de envíos. No hay avisos por correo: se consulta la respuesta dentro del sitio.

`catalog_requests` usa RLS: acceso de su titular y moderación, sin lectura anónima. La interfaz de moderación muestra nombre, motivo y fuente, no el borrador; el rol de moderación conserva acceso técnico a la fila. Las escrituras directas están revocadas; las RPC validan sesión, participación y, para revisar, rol independiente. La baja de cuenta elimina inmediatamente sus pedidos y borradores; Auth mantiene además una cascada de respaldo. La migración complementaria `20261119232005_catalog_request_account_cleanup.sql` integra este comportamiento con el bloqueo y orden de baja existentes. No se guarda documentación médica ni se pide información de menores.

## Validación, operación y recuperación

- 75 pruebas automáticas aprobadas: aliases y errores próximos, paridad del catálogo, privacidad, idempotencia, revisión propia denegada, incorporación y uso de una opción, validación de roles/coberturas, descubrimiento exacto de recursos, alcance territorial y conservación de fichas sin clasificación.
- Pruebas de integración remotas del módulo Búsquedas aprobadas contra test; cuentas, reportes y fotos sintéticas limpiados. No se invocó entrega de correo.
- Tipos, lint y compilación aislada aprobados. Recorrido local en Chrome, escritorio y 390 × 844, claro/oscuro: sugerencias, teclado, selección obligatoria, errores próximos, ausencia de coincidencias, selección múltiple y preselección territorial. Pedido sintético con borrador, resolución por moderador, recuperación del formulario, envío y publicación revisada visibles en modo profesional. La solicitud de integración registra la comprobación del despliegue final.
- Modern Web Guidance (`forms`, `accessibility`) orientó etiquetas visibles, controles nativos, validación al enviar, foco y anuncios breves con demora. Se usan los colores semánticos y el patrón de combobox con selección manual. La guía de formularios incluida en Next se consultó para las acciones del servidor.
- El asesor de Supabase añade dos avisos informativos de diseño sobre RPC `SECURITY DEFINER` ejecutables por cuentas ingresadas: `catalog_request` y `catalog_review`. Es intencional; validan identidad y permisos internamente, tienen `search_path` vacío y no admiten ejecución anónima. [Criterio del asesor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). No se introducen tablas sin RLS ni permisos de escritura directa.

Si falla la carga del catálogo, se muestra error y reintento; no se reemplaza por resultados vacíos ficticios ni se permite publicar sin clasificación. Los errores de escritura conservan el formulario y registran operación/código sin contenido personal. El catálogo y las solicitudes usan los servicios existentes, sin nuevas instancias, almacenamiento de archivos ni conexiones en tiempo real. Las cuotas continúan compartidas.

Ante una regresión, priorizar corrección hacia adelante. Volver a la aplicación anterior no deshace las reglas de escritura nuevas de la base: podría impedir guardar desde los formularios antiguos. No borrar tablas ni ejecutar una reversión destructiva para recuperar la interfaz; preservar solicitudes y nuevas clasificaciones, revisar compatibilidad y preparar una migración correctiva. Promover a producción requiere autorización y una revisión de los datos históricos antes de aplicar esta migración.
