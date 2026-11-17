# Mantenimiento operativo de Búsquedas

Los scripts de `supabase/ops` preparan el disparador del worker sin mezclar extensiones alojadas con las migraciones del producto. Su presencia en Git no demuestra que estén instalados ni que el job esté activo. La activación y sus resultados deben registrarse en la entrega correspondiente.

## Alcance y consumo

Un job de Supabase Cron despacha `POST /api/exchanges/maintenance` una vez por hora, al minuto 17. Son 24 solicitudes diarias, aproximadamente 720 cada 30 días, sobre la base y el servidor existentes; no crea otro servicio Railway. Consume consultas, ejecución y tráfico de esos servicios y comparte sus cuotas. No supone un importe fijo ni garantiza gratuidad. El presupuesto de correo puede permanecer en cero; mantenimiento de cuentas, fotos y conversaciones sigue funcionando.

No habilitar este job permanente en el entorno de ensayo: su web tiene suspensión y desafío de Cloudflare. Las pruebas de ensayo pueden usar invocaciones controladas. El único destino del job versionado es `https://autismo.ar/api/exchanges/maintenance`.

## Instalación y verificación

1. Confirmar el proyecto productivo `godvlfhhnyzgoklbnwqs`, el esquema y el despliegue esperado. Instalar `supabase/ops/exchange-maintenance.sql`: crea el esquema privado `exchange_ops`, historial y funciones; no envía solicitudes ni programa ejecuciones.
2. Guardar en Supabase Vault, con nombre `autismo_exchange_worker_token`, el mismo valor privado de `EXCHANGES_WORKER_TOKEN` configurado en Railway. No escribirlo en Git, el comando del cron ni registros. La creación o rotación del secreto se realiza por el canal administrativo autorizado.
3. Ejecutar `supabase/ops/schedule-exchange-maintenance.sql`. Habilita `pg_cron` y `pg_net` y crea o actualiza **un job desactivado**. Reejecutar el archivo vuelve a dejarlo desactivado.
   Antes de la primera invocación, repetir el preflight de aislamiento de `net` descrito abajo. El token del worker tiene alcance de mantenimiento; nunca usar una clave administrativa de Supabase como token del cron.
4. Invocar manualmente el dispatcher y conservar su `request_id`:

```sql
select exchange_ops.dispatch_maintenance('https://autismo.ar/api/exchanges/maintenance');
```

5. En otra transacción, cuando haya llegado la respuesta, ejecutar la conciliación y consultar el historial. Una llamada manual muy temprana conserva la solicitud pendiente; después de cinco minutos sin respuesta se marca fallida.

```sql
select exchange_ops.collect_maintenance_results();
select request_id, destination, requested_at, completed_at, status, http_status, failure_code, summary
from exchange_ops.maintenance_runs order by id desc limit 10;
```

6. Habilitar únicamente tras observar una ejecución reciente exitosa contra producción:

```sql
select cron.alter_job(jobid, active:=true)
from cron.job
where jobname='autismo-exchange-maintenance-hourly'
  and exists (
    select 1 from exchange_ops.maintenance_runs
    where destination='https://autismo.ar/api/exchanges/maintenance'
      and status='succeeded' and requested_at>now()-interval '15 minutes'
  );
select jobid, jobname, schedule, active from cron.job
where jobname='autismo-exchange-maintenance-hourly';
```

Comprobar luego una ejecución programada real y su respuesta HTTP. El estado exitoso de `cron.job_run_details` solo acredita el despacho SQL, no el resultado del worker. El job concilia la respuesta anterior antes del siguiente despacho; también se puede conciliar manualmente sin generar otra solicitud.

## Aislamiento de pg_net y aviso del Advisor

Auditoría del 17 de noviembre de 2026, antes del primer despacho, en producción y ensayo:

- `pg_net` 0.20.4 registra `extnamespace=public` y `extrelocatable=false`. Sus 28 objetos miembros son el esquema `net` y objetos dentro de él; no se encontraron funciones ni tablas de la extensión en `public`. El aviso `extension_in_public` describe ese registro y permanece pendiente; no se lo presenta como una prueba de exposición por la API.
- Los permisos SQL efectivos de `net` sí son amplios: `PUBLIC` tiene acceso a las tablas, secuencia y funciones. Los objetos pertenecen a `supabase_admin`; `postgres` carece de opción de concesión. Tanto el worker de `pg_net` como el job usan `postgres`.
- La API rechazó, en ambos proyectos, GET de tabla con `Accept-Profile: net` y POST de una función de lectura con `Content-Profile: net`: HTTP 406, `PGRST106`, `Invalid schema: net`. La exclusión del esquema es global en PostgREST. Se probó con clave pública/rol `anon`; no se creó una cuenta ni se ensayó una sesión `authenticated` en producción para este control.
- Los diez roles con `LOGIN` son roles estándar de la plataforma. `anon`, `authenticated` y `service_role` tienen `NOLOGIN`. No se encontraron funciones públicas que accedan a `net` ni RPC de SQL arbitrario; la única función pública con SQL dinámico es `rls_auto_enable()`, que devuelve `event_trigger`. Las funciones `exchange_ops` rechazan ejecución de los tres roles API.

Supabase no permite modificar por proyecto los permisos o las políticas de estas tablas. Un `REVOKE` ejecutado como `postgres` puede terminar sin error y sin modificar nada; reinstalar la extensión restituye los permisos originales. No se agregaron revocaciones ineficaces ni se tocaron roles internos. Referencia: [limitación de permisos de pg_net](https://supabase.com/kb/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16).

Vault protege el secreto almacenado, pero `pg_net` guarda la cabecera descifrada en su cola hasta despachar. Cualquier rol con conexión SQL directa puede leerla; la respuesta se conserva al menos durante el TTL. Este límite sigue vigente aunque nuestro historial privado conserve solo contadores. Referencia: [credenciales en la cola de pg_net](https://supabase.com/kb/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net-ad6357).

Antes de activar o después de cambios de versión, API, roles o webhooks: verificar nuevamente que `net` no sea un esquema expuesto, que no existan roles de conexión SQL de terceros y que ningún RPC permita consultar SQL arbitrario o la cola. Inspeccionar solo metadatos; no imprimir cabeceras, cuerpos ni valores de Vault. Si alguno de esos controles falla, mantener el job desactivado y corregir el acceso antes de enviar el token. No otorgar acceso SQL directo a integraciones que solo necesitan la API de datos.

## Detección y recuperación

El historial distingue solicitudes pendientes, exitosas y fallidas. Solo acepta HTTP 200 con el conjunto completo de contadores y sin fallos parciales. Registra HTTP 401/403/503, timeout, error de transporte, respuesta ausente, JSON incompleto, falta de token y errores de despacho mediante códigos acotados. No conserva cuerpos HTTP, cabeceras, secretos ni contenido de conversaciones. El esquema y las funciones no son accesibles a `anon`, `authenticated` ni `service_role`; las revisa administración.

Los registros propios y los del job se eliminan a los 30 días. `pg_net` conserva sus respuestas seis horas por defecto: si el cron se interrumpe durante más tiempo, puede faltar una respuesta; se registra ese límite como fallo y no se inventa un resultado exitoso. No hay un canal externo de alertas configurado por estos scripts: la inspección administrativa del historial sigue siendo necesaria.

Ante HTTP 401, comprobar la coincidencia del token entre Vault y Railway; ante 403, comprobar la protección de Cloudflare; ante 503, revisar configuración y fallos parciales del worker. Una respuesta perdida no demuestra que ninguna operación se haya realizado: comprobar datos y contadores antes de repetir. El cron evita duplicar solicitudes pendientes y serializa el despacho y la conciliación.

Para detener únicamente este mantenimiento sin afectar otros jobs:

```sql
select cron.alter_job(jobid, active:=false) from cron.job
where jobname='autismo-exchange-maintenance-hourly';
```

No deshabilitar las extensiones ni borrar todos los jobs como método de pausa. Para recuperar, corregir la causa, repetir una invocación controlada, observar HTTP 200 válido y volver a habilitar el job. La pausa del worker deja pendientes las bajas de Auth, la limpieza y la conservación; no presentarlas como completadas.

Referencias: [Supabase Cron](https://supabase.com/docs/guides/cron), [programación con Vault](https://supabase.com/docs/guides/functions/schedule-functions) y [pg_net y sus respuestas](https://supabase.com/docs/guides/database/extensions/pg_net).
