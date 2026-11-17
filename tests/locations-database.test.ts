import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import data from "../src/features/locations/catalog-data.json";

test("el catálogo SQL coincide con la selección web y es de solo lectura para visitantes y cuentas", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated;");
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202611170001_locations.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const rows = await db.query<{
      id: string;
      province: string;
      department_id: string;
      name: string;
      kind: string;
    }>(
      "select id,province,department_id,name,kind from public.exchange_places order by id",
    );
    assert.deepEqual(
      rows.rows.map((row) => [
        row.id,
        row.province,
        row.department_id,
        row.name,
        row.kind,
      ]),
      data.places,
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      const count = await db.query<{ total: number }>(
        "select count(*)::integer as total from public.exchange_places",
      );
      assert.equal(count.rows[0].total, data.places.length);
      await assert.rejects(
        db.exec("delete from public.exchange_places where id='caba:1'"),
        /permission denied/,
      );
      await assert.rejects(
        db.exec(
          "update public.exchange_places set name='Falso' where id='caba:1'",
        ),
        /permission denied/,
      );
      await assert.rejects(
        db.exec(
          "insert into public.exchange_places values ('fake','fake','fake','fake','fake','locality')",
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
});
