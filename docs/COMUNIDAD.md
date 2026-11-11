# Comunidad: implementación y activación

## Estado al 11 de noviembre de 2026

**La base está conectada a producción y el ingreso por código de correo fue comprobado; el piloto completo todavía está pendiente.** El responsable creó una cuenta nueva de Supabase y pidió usarla para autismo.ar. Se creó la organización gratuita `autismo.ar` y el proyecto dedicado `autismo-ar` (`godvlfhhnyzgoklbnwqs`), en `us-east-1`, junto a la región del servidor actual. No se contrataron planes ni se modificaron las bases de VinSalta.

### Conexión comprobada

- Se verificó que el esquema `public` estaba vacío y se aplicaron `202609240001_community.sql` y `202611110001_audit_fixes.sql`, en ese orden y dentro de una transacción, mediante el editor SQL. No volver a ejecutar estas migraciones iniciales. Su aplicación fue manual, no mediante el historial del CLI.
- Las ocho tablas tienen RLS; los roles `anon` y `authenticated` no pueden insertar, actualizar ni borrar directamente. Una consulta ejecutada como `anon` confirmó búsqueda funcional, ausencia de rol moderador, reportes privados inaccesibles y falta de permiso para enviar propuestas.
- Railway tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el servicio existente. No se usa `service_role` ni una clave secreta. Se preparó también `.env.local`, ignorado por Git: apunta a la base real y no debe recibir datos sintéticos.
- Despliegue `a5931a84-56a4-4fca-81e6-b516bed999fc`, estado `SUCCESS`, sobre el commit `a358cfde52ca5f2a5a716698f3afa3a37ee1b53f`. Proyecto Railway `1bf0bb1d-1a08-46d4-8f71-04c6a7aa1d48`, servicio `c1c4cd58-87c6-4912-a2c7-c1cd03001cfe`, entorno `production` (`65aed2e3-5a6f-4938-a85a-025e191189a7`).
- Se comprobó en el navegador el directorio público y la búsqueda «educación»: ambos consultan la base y muestran el estado vacío sin error de conexión. No se crearon fichas sintéticas en producción. Para verificar el correo se creó la cuenta real del responsable, con rol de colaborador/a. Las 13 pruebas locales de PostgreSQL/PGlite aprobaron.
- Se conservó la configuración web de Cloudflare y se añadieron los registros de correo descritos abajo. No se creó otro servicio Railway ni un entorno remoto de pruebas; la separación operativa `test`/producción sigue pendiente.

### Correo comprobado y puesta en marcha pendiente

Email Auth está habilitado, con confirmación de correo y sin ingresos anónimos. Site URL es `https://autismo.ar`. **SMTP propio está activo mediante Resend**: servidor `smtp.resend.com`, puerto `465`, usuario `resend`, remitente `autismo.ar <administracion@autismo.ar>`, elegido por el responsable. El responsable ingresó la clave API en el campo Password de Supabase; no se guardó en Git ni en variables públicas. Configurar el remitente de envío no crea un buzón para recibir respuestas ni una foto de perfil en los clientes de correo.

- Resend verificó `autismo.ar` el 11 de noviembre de 2026 a las 21:59 UTC. El dominio tiene DKIM `resend._domainkey` y CNAME `rsend` y `send` hacia Resend Forge, sin proxy. La recepción está desactivada. No se modificaron los dominios ni las claves de VinSalta.
- La clave dedicada `AUTISMO.AR - Supabase Auth` tiene permiso **Sending access**, limitado al dominio **autismo.ar**. Su alcance se comprobó después de recargar el panel.
- Las plantillas **Confirm sign up** y **Magic link or OTP** muestran `{{ .Token }}` y texto en español. La interfaz espera el código, no un enlace.
- Se solicitó un código desde `https://autismo.ar/cuenta` a la cuenta real del responsable. El correo llegó a la bandeja de entrada el 11 de noviembre de 2026 a las 22:02 UTC, con SPF y DKIM aprobados. El código permitió iniciar sesión y la web mostró el rol **Colaborador/a**, sin aportes ni reportes. Después de cambiar el remitente a `administracion@autismo.ar`, se cerró la sesión y se solicitó otro código: llegó a la bandeja de entrada a las 22:07 UTC con el nuevo remitente y permitió reingresar. Las pruebas validan alta, entrega y reingreso de una cuenta existente; no ensayan el circuito de publicación.
- Se usa la cuenta gratuita existente de Resend: el panel indicaba 3.000 correos mensuales y 100 diarios, compartidos entre sus tres dominios. Supabase indicó un límite de 30 correos por hora al activar SMTP. Las pruebas consumieron dos envíos; no se contrató otro plan.

Ante fallos de entrega, revisar primero Auth en Supabase y el envío correspondiente en Resend: distinguir rechazo SMTP, dominio sin verificar, cuota agotada y rechazo del destinatario. Comprobar también la respuesta visible del formulario y la bandeja real; no registrar claves ni códigos. Si se reemplaza una clave, el titular debe actualizar Password en SMTP y volver a comprobar un envío y un ingreso reales.

Falta designar moderadores y ensayar el circuito completo con dos cuentas en un entorno aislado. No se concedieron permisos de moderación durante la prueba de correo.

La recuperación de la configuración consiste en retirar las dos variables públicas nuevas y reconstruir el servicio; eso devuelve el modo de borradores sin eliminar la base. No se sobrescribieron datos previos. Las copias y su restauración deben comprobarse antes de abrir el piloto.

Sin configuración, se puede navegar y descargar/cargar borradores locales. No se simulan cuentas ni envíos. Con configuración, las consultas distinguen una base vacía de una conexión fallida. No se importó ni publicó el chat privado de PADRES TEA: sus necesidades orientaron el producto, pero no constituyen un catálogo comprobado.

## Organización

| Módulo                                | Responsabilidad                                                   |
| ------------------------------------- | ----------------------------------------------------------------- |
| `src/features/orientation`            | Entradas por necesidad, sobre los filtros del mismo directorio    |
| `src/features/resources`              | Contrato de ficha, validación, consultas paginadas y presentación |
| `src/features/community`              | Propuestas, corroboraciones, moderación, reportes y borradores    |
| `src/features/auth`                   | Código de correo y sesión comprobada en servidor                  |
| `src/lib/supabase`                    | Configuración y cliente del servidor, sin `service_role`          |
| `src/lib/catalog.ts` y `geography.ts` | Categorías y jurisdicciones compartidas                           |
| `src/app`                             | Composición de páginas                                            |
| `supabase/migrations`                 | Esquema, permisos y funciones transaccionales                     |

Las fichas tienen ID y URL estables y admiten varias categorías. Su documento se valida en TypeScript y PostgreSQL; propuestas y versiones conservan instantáneas. Corroboraciones, roles y reportes tienen tablas propias. Sedes, cobertura normalizada y localidades oficiales se incorporarán mediante migraciones sin mezclar experiencias o publicidad con estas fichas.

## Reglas del piloto

1. **En moderación:** propuesta con fuente pública y contexto, visible solo para su autor y moderación.
2. **Por corroborar:** moderación revisa privacidad, pertinencia, conflictos de interés y duplicados antes de habilitarla para colaboradores con cuenta.
3. **Datos contrastados:** otra persona corrobora cada grupo nuevo o modificado: identidad, ubicación, contacto/horarios, cobertura, edades y descripción/categorías. La fuente acompaña cada revisión. Eliminar un dato también requiere corroboración.
4. **Publicado:** moderación aprueba si todos los grupos requeridos tienen corroboración y no hay desacuerdos. Puede rechazar con un motivo. Nadie modera ni corrobora su propio aporte. Se necesitan al menos dos personas; quien corrobora puede también moderar si tiene ese rol.
5. **Historial:** publicación e historial se guardan juntos. Una versión desactualizada no puede sobrescribir la ficha. Recuperar datos históricos crea una nueva propuesta contra la versión actual.

No se publica por cantidad de votos. Corroborar no certifica calidad clínica, credenciales ni vigencia permanente. Reputación y publicidad no intervienen en las decisiones.

Las propuestas enviadas son inmutables. Ante un error, se rechazan y se crea otra conservando la explicación. Un desacuerdo puede corregirlo quien lo registró o puede motivar el rechazo. No hay apelaciones automatizadas en este piloto.

## Permisos y límites

- Visitantes: fichas visibles, fuentes, confirmaciones e historial; ninguna identidad de cuenta.
- Colaboradores: sus propuestas y reportes, además de propuestas habilitadas y sus corroboraciones. Los identificadores internos no contienen correos.
- Moderación: revisión inicial, decisiones y reportes. El rol solo se asigna desde administración de la base.
- Escrituras directas revocadas. Las funciones comprueban sesión, rol, autoría, transición, fuentes, tamaños y estructura. El servidor también valida los formularios.
- Diez propuestas y diez reportes diarios por cuenta; cuarenta operaciones de corroboración por hora. Las escrituras se serializan por persona. Los límites de correo dependen además de Supabase Auth y SMTP.
- Los reportes son privados. Moderación puede retirar una ficha y su historial público y cerrar propuestas pendientes asociadas. Se conservan las instantáneas para resolución interna.
- No se puede publicar dos veces la misma identidad normalizada (nombre, alcance, provincia y localidad). El formulario busca posibles coincidencias; los duplicados aproximados exigen criterio humano. Fusión y múltiples sedes quedan pendientes.

## Activar en Supabase y Railway

1. Resolver el cupo con el titular y crear un proyecto dedicado. No reutilizar las bases de VinSalta. Si el alta exige una contraseña nueva, la ingresa el titular.
2. Aplicar las migraciones de `supabase/migrations` en orden de nombre, una sola vez cada una. `202609240001_community.sql` crea el esquema en un proyecto nuevo; `202611110001_audit_fixes.sql` corrige validación de URLs y búsqueda por nombres de categorías y agrega un índice para el listado. Si el esquema inicial ya está aplicado, ejecutar solo las migraciones pendientes; no sobrescribir tablas existentes.
3. Habilitar Email Auth. Configurar las plantillas **Confirm sign up** y **Magic link or OTP** para mostrar `{{ .Token }}`: la interfaz usa códigos, no callback por enlace. Configurar Site URL `https://autismo.ar` y SMTP autorizado para los participantes. El correo predeterminado de Supabase puede restringir destinatarios; comprobar un envío y un ingreso reales.
4. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Railway y `.env.local`. Usar solo la clave publicable, nunca `service_role` ni una clave secreta.
5. Crear las cuentas de moderación por el mismo formulario. Desde Auth, el titular obtiene sus IDs y asigna el rol (sustituir el ID):

   ```sql
   insert into public.community_members (user_id, role)
   values ('ID-DE-LA-CUENTA-EXISTENTE', 'moderator')
   on conflict (user_id) do update set role = excluded.role;
   ```

6. Desplegar una nueva compilación con las variables disponibles durante el build. Son públicas; las políticas RLS protegen la base.
7. Conservar el DNS de Cloudflare. No cachear HTML personalizado o rutas de cuenta, aportes, comunidad y directorio ignorando `Cache-Control`. El proxy configurado responde `private, no-store`.
8. Ensayar en un entorno dedicado con dos cuentas: ingreso, aporte, revisión inicial, corroboración, publicación, corrección, reporte y retirada. Verificar también como visitante y como otra cuenta.

Comprobar conexión, correo real y despliegue antes de llamar operativo al piloto. Las pruebas locales no reemplazan esos pasos.

## Verificación y mantenimiento

`npm test` ejecuta todas las migraciones en PostgreSQL local mediante PGlite y prueba RLS, permisos, fuentes inválidas, autovalidación, publicación, conflictos, duplicados, historial y privacidad. Incluye regresiones del reconocimiento de moderadores, consulta exacta de versiones y coherencia de validación entre TypeScript y SQL. Los datos sintéticos permanecen en las pruebas. Ejecutar también `npm run lint`, `npm run typecheck` y `npm run build`, y revisar la interfaz en móvil y escritorio.

El cliente Supabase usa el contrato de las migraciones en `src/lib/supabase/database.types.ts`; mantenerlo actualizado al cambiar el esquema. Un fallo al consultar permisos no convierte silenciosamente a un moderador en colaborador. Si no se puede recuperar una versión histórica, la página bloquea el formulario y permite reintentar. La búsqueda activa es la consulta PostgreSQL; no se conserva un motor paralelo en memoria. Los borradores locales se validan al importar y no se envían automáticamente.

Comprobación del 11 de noviembre de 2026: lint, TypeScript, formato y las 13 pruebas locales aprobados. El build compiló el código y aprobó TypeScript, pero falló al crear directorios de prerenderizado con `EPERM` en el entorno restringido de Windows, también con una salida nueva. El servidor de desarrollo inició, pero la conexión local fue bloqueada por permisos de socket; no se completó la revisión visual. Repetir build completo y recorridos de navegador en un entorno habilitado antes de publicar. Esta comprobación no aplicó migraciones remotas ni activó base, correo o servicios.

Antes de abrir el piloto: designar moderadores, revisar privacidad/condiciones y definir atención de pedidos de eliminación, exportación y apelación. No se exige documentación médica. Los correos permanecen en Supabase Auth. Administración puede purgar eventos de límites de `community_check_events` anteriores a 30 días. Respaldar la base y ensayar su restauración según el plan elegido.

Pendientes fuera de esta entrega: experiencias personales, guías con edición de cuerpo completo, mapa geográfico, reputación, recordatorios, archivos, mensajería, pagos, campañas y publicidad. Cada módulo requiere sus propias reglas. La orientación actual organiza búsquedas; no responde consultas médicas o legales ni ofrece atención en vivo.

