import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("database search preserves national/provincial scope, accents, ages and pagination", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as 'select null::uuid'; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609240001_community.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const common = {
      description:
        "Orientación sintética para comprobar la búsqueda geográfica.",
      categoryIds: ["comunidad"],
      scope: "national",
      province: "",
      locality: "",
      website: "",
      phone: "",
      hours: "",
      coverage: "",
      ageGroups: ["Adultez"],
    };
    const fixtures = [
      {
        slug: "national",
        data: {
          ...common,
          name: "Guía nacional sintética",
          categoryIds: ["comunidad", "derechos"],
        },
      },
      {
        slug: "provincial",
        data: {
          ...common,
          name: "Red provincial sintética",
          scope: "province",
          province: "buenos-aires",
        },
      },
      {
        slug: "local",
        data: {
          ...common,
          name: "Espacio local sintético",
          scope: "local",
          province: "buenos-aires",
          locality: "Bahía Blanca",
          categoryIds: ["comunidad", "centros"],
        },
      },
      {
        slug: "other-locality",
        data: {
          ...common,
          name: "Espacio otra localidad sintético",
          scope: "local",
          province: "buenos-aires",
          locality: "La Plata",
        },
      },
      {
        slug: "other-province",
        data: {
          ...common,
          name: "Espacio otra provincia sintético",
          scope: "province",
          province: "cordoba",
        },
      },
    ];
    for (const row of fixtures)
      await db.query(
        "insert into public.resources(slug,version,data,source_url) values($1,1,$2,'https://example.org/source')",
        [row.slug, JSON.stringify(row.data)],
      );
    await db.exec("set role anon");
    async function search(
      query = "",
      category = "",
      province = "",
      locality = "",
      age = "",
      page = 1,
    ) {
      return (
        await db.query<{ slug: string }>(
          "select slug from public.community_search($1,$2,$3,$4,$5,$6)",
          [query, category, province, locality, age, page],
        )
      ).rows
        .map((r) => r.slug)
        .sort();
    }
    assert.deepEqual(
      await search("", "comunidad", "buenos-aires", " BAHIA  blanca "),
      ["local", "national", "provincial"],
    );
    assert.deepEqual(await search("", "", "buenos-aires"), [
      "local",
      "national",
      "other-locality",
      "provincial",
    ]);
    assert.deepEqual(await search("ORIENTACION", "derechos", "cordoba"), [
      "national",
    ]);
    assert.deepEqual(await search("", "centros", "cordoba"), []);
    assert.deepEqual(await search("", "", "invalid"), []);
    assert.deepEqual(await search("", "invalid"), []);
    assert.deepEqual(await search("", "", "", "Bahía Blanca"), []);
    assert.deepEqual(await search("", "", "", "", "Infancia"), []);
    assert.equal((await search("", "", "", "", "Adultez")).length, 5);
    await db.exec("reset role");
    for (let i = 0; i < 18; i++)
      await db.query(
        "insert into public.resources(slug,version,data,source_url) values($1,1,$2,'https://example.org/source')",
        [
          `page-${i}`,
          JSON.stringify({
            ...common,
            name: `Recurso sintético paginado ${i}`,
          }),
        ],
      );
    await db.exec("set role anon");
    const first = await search();
    const next = await search("", "", "", "", "", 2);
    assert.equal(first.length, 21, "extra row indicates a next page");
    assert.equal(next.length, 3);
    assert.equal((await search("", "", "", "", "", 3)).length, 0);
  } finally {
    await db.close();
  }
});
