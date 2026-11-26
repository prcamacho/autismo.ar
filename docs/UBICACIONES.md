# Ubicaciones de búsquedas y disponibilidad

## Catálogo versionado

El módulo `src/features/locations` incorpora **4.027 ubicaciones** y **529 departamentos/partidos/comunas**, descargados el 17 de noviembre de 2026. Conserva los identificadores provinciales de `src/lib/geography.ts`; no modifica las URLs ni la geografía del directorio existente.

- **GeoRef v2, Gobierno nacional:** localidades y departamentos con ID oficial. Se descartan coordenadas, geometrías y campos que no necesita la búsqueda. [Documentación de descarga](https://www.argentina.gob.ar/georef/descarga-de-la-base-completa).
- **BA Data, Gobierno de la Ciudad:** los **48 barrios** oficiales de CABA y su relación con las 15 comunas. Sustituyen los registros de CABA de GeoRef para evitar listar la ciudad y sus barrios como opciones equivalentes. Fuente [Barrios](https://data.buenosaires.gob.ar/dataset/barrios), licencia indicada por el portal: **CC-BY-2.5-AR**.

`catalog-data.json` guarda la fecha del snapshot, URLs exactas y SHA-256 de cada respuesta descargada. Los nombres se conservan como aparecen en las fuentes. La búsqueda admite tildes y mayúsculas de manera equivalente, sin alterar los nombres oficiales guardados.

Los IDs tienen espacio de nombres: `georef:<id oficial>` para localidades y departamentos, `caba:<id oficial>` para barrios. Una localidad homónima conserva su ID propio, provincia y departamento. PBA ofrece 135 partidos. Las agrupaciones informales como AMBA o «Zona oeste» no se infieren ni se presentan como divisiones oficiales en este catálogo.

## Contrato y límites

- `model.ts` contiene únicamente los tipos `Place`, `Department` y `PlaceSearch`; los componentes de navegador pueden importarlos con `import type`.
- `catalog.ts` contiene los helpers puros `listDepartments(province)`, `searchPlaces({ province, departmentId?, query?, limit? })` y `getPlaces(ids)`. Se utiliza desde código de servidor; **no importar el catálogo completo desde componentes cliente**.
- La consulta de lugares devuelve hasta 50 resultados por defecto, con máximo de 100. Dentro de la provincia y el departamento elegidos, una coincidencia exacta de localidad o barrio aparece primero. Así se puede seleccionar Rosario aunque el texto también coincida con su departamento. Las demás coincidencias conservan el orden alfabético. Un departamento de otra provincia devuelve cero resultados.
- `getPlaces` resuelve exclusivamente IDs conocidos, elimina duplicados y conserva el orden. Un ID inexistente produce error, en lugar de guardar etiquetas aportadas por el navegador.
- La migración `202611170001_locations.sql` crea `exchange_places`, sus índices, RLS, permisos de lectura y datos públicos oficiales. Visitantes y cuentas no pueden modificar el catálogo. La aplicación remota de esa migración debe seguir el flujo de `test` y producción: **tener el archivo no significa que ya se haya aplicado**.

El JSON permite resolver etiquetas sin una consulta remota por cada ficha. La tabla SQL permite validar cobertura mediante claves foráneas y buscar avisos sin duplicarlos por cada zona. Son dos artefactos generados desde la misma descarga, no dos catálogos mantenidos a mano. Los tests comprueban su correspondencia exacta.

## Actualización manual y reproducible

No hay tareas programadas ni llamadas a las fuentes oficiales durante una búsqueda. Para preparar una actualización, desde la raíz del repositorio:

```powershell
node scripts/import-locations.mjs --date AAAA-MM-DD --migration supabase/migrations/AAAAMMDDNNNN_locations_update.sql
```

El script solo descarga datos públicos y escribe archivos locales; no conoce credenciales ni se conecta a la base del proyecto. Usa el endpoint versionado v2 con máximos explícitos, comprueba que la cantidad recibida coincida con el total y rechaza respuestas incompletas, IDs repetidos, relaciones inválidas o jurisdicciones faltantes. Los endpoints `.json` de descarga completa redirigían a HTTP al comprobarlos; se utilizó la consulta HTTPS completa para evitar ese descenso de protocolo.

Antes de escribir, exige un nombre de migración nuevo y rechaza sobrescribir migraciones. Si una nueva fuente elimina IDs existentes, detiene la importación: primero se debe resolver qué ocurrirá con publicaciones que ya los usan. No borrar lugares referenciados ni sustituirlos por semejanza textual. Cambios de límites, nombres o identificación necesitan revisar el diff y los casos afectados antes de aplicar la nueva migración.

Revisar también fecha, fuentes, variación de recuentos, cobertura provincial y barrios. Ejecutar pruebas de ubicaciones y luego las comprobaciones del módulo de publicaciones. Una caída de la fuente no altera el catálogo previamente versionado; la web continúa usando su snapshot.

## Verificación

Las pruebas cubren las 24 jurisdicciones, partidos de PBA, barrios/comunas de CABA, homónimos, búsqueda sin tildes, límites, selecciones duplicadas y rechazo de IDs inventados. Una prueba PostgreSQL/PGlite comprueba correspondencia SQL/JSON y denegación de escrituras tanto como visitante como con cuenta.

No se incorporan domicilios, posición de usuarios, distancias de viaje ni localización automática. La ubicación publicada describe dónde se ofrece o necesita un servicio.
