# Comunidad: implementación y activación

## Estado al 24 de septiembre de 2026

El circuito está implementado en el repositorio. **Todavía no está conectado a una base de producción.** La cuenta de Supabase consultada tiene ocupados los dos proyectos gratuitos activos. No se pausaron proyectos ajenos ni se contrataron planes. Railway y Cloudflare no se modificaron.

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
2. Aplicar `supabase/migrations/202609240001_community.sql` una vez mediante SQL Editor o migraciones. Está destinada a un proyecto nuevo, no a sobrescribir tablas existentes.
3. Habilitar Email Auth. Configurar la plantilla **Magic Link** para mostrar `{{ .Token }}`: la interfaz usa códigos, no callback por enlace. Configurar Site URL `https://autismo.ar` y SMTP autorizado para los participantes. El correo predeterminado de Supabase puede restringir destinatarios; comprobar un envío real.
4. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Railway y `.env.local`. Usar solo la clave publicable, nunca `service_role` ni una clave secreta. Conservar `IAN_APP_ORIGIN`.
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

`npm test` ejecuta la migración en PostgreSQL local mediante PGlite y prueba RLS, permisos, fuentes inválidas, autovalidación, publicación, conflictos, duplicados, historial y privacidad. Los datos sintéticos permanecen en las pruebas. Ejecutar también `npm run lint`, `npm run typecheck` y `npm run build`, y revisar la interfaz en móvil y escritorio.

Antes de abrir el piloto: designar moderadores, revisar privacidad/condiciones y definir atención de pedidos de eliminación, exportación y apelación. No se exige documentación médica. Los correos permanecen en Supabase Auth. Administración puede purgar eventos de límites de `community_check_events` anteriores a 30 días. Respaldar la base y ensayar su restauración según el plan elegido.

Pendientes fuera de esta entrega: experiencias personales, guías con edición de cuerpo completo, mapa geográfico, reputación, recordatorios, archivos, mensajería, pagos, campañas y publicidad. Cada módulo requiere sus propias reglas. La orientación actual organiza búsquedas; no responde consultas médicas o legales ni ofrece atención en vivo.
