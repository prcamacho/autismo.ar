/** Download public official catalogs only. Never connects to a project database. */
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const root = fileURLToPath(new URL("../", import.meta.url));
const sources = [
  "https://apis.datos.gob.ar/georef/api/v2.0/localidades?max=5000",
  "https://apis.datos.gob.ar/georef/api/v2.0/departamentos?max=1000",
  "https://data.buenosaires.gob.ar/dataset/barrios/resource/1c3d185b-fdc9-474b-b41b-9bd960a3806e/download",
];
const provinceIds = {
  "02": "ciudad-autonoma-de-buenos-aires",
  "06": "buenos-aires",
  10: "catamarca",
  14: "cordoba",
  18: "corrientes",
  22: "chaco",
  26: "chubut",
  30: "entre-rios",
  34: "formosa",
  38: "jujuy",
  42: "la-pampa",
  46: "la-rioja",
  50: "mendoza",
  54: "misiones",
  58: "neuquen",
  62: "rio-negro",
  66: "salta",
  70: "san-juan",
  74: "san-luis",
  78: "santa-cruz",
  82: "santa-fe",
  86: "santiago-del-estero",
  90: "tucuman",
  94: "tierra-del-fuego",
};

function text(value, label) {
  if (typeof value !== "string" || !value.trim() || value.length > 160) {
    throw new Error(`Invalid ${label}. Catalog unchanged.`);
  }
  return value.trim();
}

function province(value) {
  const id = provinceIds[value];
  if (!id) throw new Error(`Unknown official province: ${value}`);
  return id;
}

function completeArray(data, key) {
  if (!Array.isArray(data[key]) || data[key].length !== data.total) {
    throw new Error(
      `Incomplete ${key} response. Increase the explicit maximum.`,
    );
  }
  return data[key];
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok)
    throw new Error(`Download failed (${response.status}): ${url}`);
  const body = await response.text();
  return {
    data: JSON.parse(body),
    source: { url, sha256: createHash("sha256").update(body).digest("hex") },
  };
}

const migrationArg = process.argv.indexOf("--migration");
const dateArg = process.argv.indexOf("--date");
const date =
  dateArg < 0
    ? new Date().toISOString().slice(0, 10)
    : process.argv[dateArg + 1];
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? ""))
  throw new Error("Use --date YYYY-MM-DD.");
if (migrationArg < 0 || !process.argv[migrationArg + 1]) {
  throw new Error(
    "Pass --migration supabase/migrations/<new-name>.sql. Existing migrations are never overwritten.",
  );
}
const migrationPath = path.resolve(root, process.argv[migrationArg + 1]);
const migrationRoot = path.resolve(root, "supabase/migrations") + path.sep;
if (
  !migrationPath.startsWith(migrationRoot) ||
  !migrationPath.endsWith(".sql")
) {
  throw new Error("Migration must be a .sql file inside supabase/migrations.");
}
if (
  await stat(migrationPath).then(
    () => true,
    () => false,
  )
) {
  throw new Error(
    "That migration already exists. Choose a new migration name.",
  );
}
// Catch accidental divergence from the existing URL identifiers before downloads.
const geographySource = await readFile(
  path.join(root, "src/lib/geography.ts"),
  "utf8",
);
for (const slug of Object.values(provinceIds)) {
  if (!geographySource.includes(`"${slug}"`))
    throw new Error(`Province mapping is stale: ${slug}`);
}

const [locations, divisions, neighborhoods] = await Promise.all(
  sources.map(download),
);
const departments = completeArray(divisions.data, "departamentos").map((d) => [
  `georef:${text(d.id, "department ID")}`,
  province(d.provincia.id),
  text(d.nombre, "department name"),
]);
const departmentById = new Map(departments.map((d) => [d[0], d]));
const places = completeArray(locations.data, "localidades")
  .filter((place) => place.provincia.id !== "02")
  .map((place) => [
    `georef:${text(place.id, "locality ID")}`,
    province(place.provincia.id),
    `georef:${text(place.departamento.id, "locality department")}`,
    text(place.nombre, "locality name"),
    "locality",
  ]);

if (
  !Array.isArray(neighborhoods.data.features) ||
  neighborhoods.data.features.length !== 48
) {
  throw new Error(
    "Expected the 48 official CABA neighborhoods. Review source changes manually.",
  );
}
for (const { properties: barrio } of neighborhoods.data.features) {
  if (!Number.isInteger(barrio.id) || !Number.isInteger(barrio.comuna)) {
    throw new Error("Invalid CABA identifiers.");
  }
  const department = departments.find(
    (d) => d[1] === provinceIds["02"] && d[2] === `Comuna ${barrio.comuna}`,
  );
  if (!department) throw new Error(`Unknown CABA comuna: ${barrio.comuna}`);
  places.push([
    `caba:${barrio.id}`,
    provinceIds["02"],
    department[0],
    text(barrio.nombre, "neighborhood name"),
    "neighborhood",
  ]);
}
for (const place of places) {
  if (departmentById.get(place[2])?.[1] !== place[1]) {
    throw new Error(`Mismatched department for ${place[0]}`);
  }
}
if (
  new Set(places.map((p) => p[0])).size !== places.length ||
  places.length < 3000
) {
  throw new Error("Duplicate IDs or unexpectedly incomplete catalog.");
}
if (new Set(places.map((p) => p[1])).size !== 24)
  throw new Error("Missing jurisdiction.");
departments.sort((a, b) => a[0].localeCompare(b[0]));
places.sort((a, b) => a[0].localeCompare(b[0]));

const catalogPath = path.join(root, "src/features/locations/catalog-data.json");
const previous = await readFile(catalogPath, "utf8").then(
  JSON.parse,
  (error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  },
);
const currentIds = new Set(places.map((place) => place[0]));
if (previous?.places.some((place) => !currentIds.has(place[0]))) {
  throw new Error(
    "The official source removed existing IDs. Resolve existing references explicitly before importing; no files were changed.",
  );
}
const metadata = {
  version: date,
  sources: [locations.source, divisions.source, neighborhoods.source],
};
const catalog = await format(
  JSON.stringify({ ...metadata, departments, places }),
  {
    parser: "json",
  },
);
const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;
const rows = places.map(
  (p) =>
    `(${[p[0], p[1], p[2], departmentById.get(p[2])[2], p[3], p[4]].map(sqlString).join(",")})`,
);
const migration = `-- Generated by scripts/import-locations.mjs on ${date}. Public official data only.
-- Sources and SHA-256 are in src/features/locations/catalog-data.json.
-- Existing IDs are retained on updates so published coverage never silently changes.
create table if not exists public.exchange_places (
  id text primary key,
  province text not null,
  department_id text not null,
  department text not null,
  name text not null,
  kind text not null check (kind in ('locality', 'neighborhood'))
);
alter table public.exchange_places enable row level security;
drop policy if exists exchange_places_read on public.exchange_places;
create policy exchange_places_read on public.exchange_places for select to anon, authenticated using (true);
revoke all on public.exchange_places from anon, authenticated;
grant select on public.exchange_places to anon, authenticated;
create index if not exists exchange_places_area on public.exchange_places (province, department_id);

${Array.from({ length: Math.ceil(rows.length / 250) }, (_, index) => `insert into public.exchange_places(id,province,department_id,department,name,kind) values\n${rows.slice(index * 250, (index + 1) * 250).join(",\n")}\non conflict (id) do update set province=excluded.province,department_id=excluded.department_id,department=excluded.department,name=excluded.name,kind=excluded.kind;`).join("\n\n")}
`;
await mkdir(path.dirname(catalogPath), { recursive: true });
await writeFile(migrationPath, migration, { flag: "wx" });
await writeFile(catalogPath, catalog);
console.log(
  `Prepared ${places.length} places and ${departments.length} departments (${date}).`,
);
console.log(
  "Review the generated diff before applying the migration. No database was modified.",
);
