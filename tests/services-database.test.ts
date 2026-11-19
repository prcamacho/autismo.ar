import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";
import { INITIAL_SERVICES } from "../src/features/services/seed";

test("normalized catalog enforces privacy, review, aliases, new services, drafts and classified publications", async () => {
  const db = new PGlite();
  const owner = "ab000000-0000-4000-8000-000000000001",
    other = "ab000000-0000-4000-8000-000000000002",
    moderator = "ab000000-0000-4000-8000-000000000003";
  let counter = 0;
  const nonce = () =>
    `ac000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
  try {
    await db.exec(
      `create schema auth;create role anon;create role authenticated;create role service_role bypassrls;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`,
    );
    await applyMigrations(db);
    for (const id of [owner, other, moderator])
      await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "insert into public.community_members values($1,'moderator')",
      [moderator],
    );
    const seeded = (
      await db.query<{ id: string; name: string }>(
        "select id,name from public.service_catalog order by id",
      )
    ).rows;
    assert.deepEqual(
      seeded,
      INITIAL_SERVICES.map(({ id, name }) => ({ id, name })).sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    );
    // Real structured IDs decide discovery; a word in prose is never a classification.
    const baseResource = {
      name: "Recurso de prueba",
      description:
        "Descripción sintética que menciona fonoaudiología sin clasificarla.",
      categoryIds: ["profesionales"],
      scope: "national",
      province: "",
      locality: "",
      website: "",
      phone: "",
      hours: "",
      coverage: "",
      ageGroups: [],
    };
    const resources = [
      { slug: "legacy", data: baseResource, visible: true },
      {
        slug: "national",
        data: {
          ...baseResource,
          name: "Nacional sintético",
          serviceIds: ["fonoaudiologia"],
        },
        visible: true,
      },
      {
        slug: "province",
        data: {
          ...baseResource,
          name: "Provincial sintético",
          scope: "province",
          province: "salta",
          serviceIds: ["fonoaudiologia"],
        },
        visible: true,
      },
      {
        slug: "local",
        data: {
          ...baseResource,
          name: "Local sintético",
          scope: "local",
          province: "salta",
          locality: "Salta",
          placeId: "georef:66028050",
          serviceIds: ["fonoaudiologia"],
        },
        visible: true,
      },
      {
        slug: "hidden",
        data: {
          ...baseResource,
          name: "Oculto sintético",
          serviceIds: ["fonoaudiologia"],
        },
        visible: false,
      },
    ];
    for (const resource of resources)
      await db.query(
        "insert into public.resources(slug,version,data,source_url,visible) values($1,1,$2::jsonb,'https://example.org/source',$3)",
        [resource.slug, JSON.stringify(resource.data), resource.visible],
      );
    async function as(id: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id ?? "",
      ]);
      await db.exec(`set role ${role}`);
    }
    async function call<T = string>(sql: string, args: unknown[] = []) {
      return (await db.query<{ value: T }>(`select ${sql} as value`, args))
        .rows[0].value;
    }
    for (const id of [owner, other, moderator]) {
      await as(id);
      await call("public.exchange_enroll(true,false)");
    }
    const create = (name: string, n = nonce(), draft: unknown = null) =>
      call(
        "public.catalog_request($1,'Necesitamos clasificar este servicio','',$2,$3::jsonb)",
        [name, n, draft === null ? null : JSON.stringify(draft)],
      );
    const review = (
      id: string,
      decision: string,
      service = "",
      name = "",
      source = "",
    ) =>
      call(
        "public.catalog_review($1,$2,$3,$4,'Apoyos y disciplinas',$5,'Respuesta revisada para esta solicitud')",
        [id, decision, service, name, source],
      );
    await as(null, "anon");
    const discover = async (
      service = "fonoaudiologia",
      province = "",
      place = "",
    ) =>
      (
        await db.query<{ slug: string }>(
          "select slug from public.catalog_search_resources($1,'',$2,$3,'',1)",
          [service, province, place],
        )
      ).rows
        .map((r) => r.slug)
        .sort();
    assert.deepEqual(await discover(), ["local", "national", "province"]);
    assert.deepEqual(
      await discover("fonoaudiologia", "salta", "georef:66028050"),
      ["local", "national", "province"],
    );
    assert.deepEqual(await discover("fonoaudiologia", "buenos-aires"), [
      "national",
    ]);
    assert.deepEqual(await discover("fono"), []);
    assert.deepEqual(
      await discover("fonoaudiologia", "buenos-aires", "georef:66028050"),
      [],
    );
    assert.ok(
      (await discover("")).includes("legacy"),
      "historical unclassified resources remain available when browsing",
    );
    assert.equal(
      (await db.query("select * from public.service_catalog")).rows.length,
      33,
    );
    await assert.rejects(create("Servicio privado"), /permission denied/);
    await assert.rejects(
      db.query("select * from public.catalog_requests"),
      /permission denied/,
    );
    await as(owner);
    const n = nonce();
    const draft = {
      kind: "request",
      description: "Borrador sintético privado",
      days: ["lunes"],
    };
    const request = await create("Terapista del lenguaje", n, draft);
    assert.equal(await create("Terapista del lenguaje", n, draft), request);
    await assert.rejects(create("Nombre diferente", n, draft), /NONCE_REUSED/);
    assert.equal(
      (await db.query("select * from public.catalog_requests")).rows.length,
      1,
    );
    await assert.rejects(
      review(request, "alias", "fonoaudiologia"),
      /MODERATOR_REQUIRED/,
    );
    await as(other);
    assert.equal(
      (await db.query("select * from public.catalog_requests")).rows.length,
      0,
    );
    await as(moderator);
    await review(request, "alias", "fonoaudiologia");
    assert.ok(
      (
        await db.query<{ aliases: string[] }>(
          "select aliases from public.service_catalog where id='fonoaudiologia'",
        )
      ).rows[0].aliases.includes("terapista del lenguaje"),
    );
    await assert.rejects(review(request, "rejected"), /STALE_VERSION/);
    const own = await create("Solicitud propia");
    await assert.rejects(review(own, "rejected"), /SELF_REVIEW/);
    await as(owner);
    const newRequest = await create("Servicio sintético");
    await as(moderator);
    await assert.rejects(
      review(newRequest, "new", "", "Servicio sintético"),
      /SOURCE_REQUIRED/,
    );
    await review(
      newRequest,
      "new",
      "",
      "Servicio sintético",
      "https://example.org/catalog-test",
    );
    const service = (
      await db.query<{ service_id: string }>(
        "select service_id from public.catalog_requests where id=$1",
        [newRequest],
      )
    ).rows[0].service_id;
    await as(owner);
    const place = (
      await db.query<{ id: string }>(
        "select id from public.exchange_places where province='buenos-aires' order by id limit 1",
      )
    ).rows[0].id;
    const data = {
      title: "Un título escrito libremente",
      service,
      role: "Servicio sintético",
      description: "",
      modality: "presencial",
      days: ["lunes"],
      shifts: ["manana"],
      startDate: "",
      availability: "available",
      engagement: "Particular",
      coverage: "Obra social",
      ageGroups: [],
      locationIds: [place],
      receiveRequests: true,
    };
    const save = (d: unknown, n = nonce()) =>
      call("public.exchange_save_listing(null,'request',$1::jsonb,0,$2)", [
        JSON.stringify(d),
        n,
      ]);
    const listing = await save(data);
    const stored = (
      await db.query<{ data: typeof data }>(
        "select data from public.exchange_listings where id=$1",
        [listing],
      )
    ).rows[0].data;
    assert.match(stored.title, /^Busco Servicio sintético · /);
    assert.equal(stored.description, "");
    assert.equal(stored.coverage, "Obra social");
    for (const altered of [
      { service: "medicina" },
      { service: "inventado" },
      { role: "Profesión inventada" },
      { engagement: "Cualquier texto" },
      { coverage: "Cobertura inventada" },
    ])
      await assert.rejects(
        save({ ...data, ...altered }),
        /INVALID_SERVICE|INVALID_INPUT/,
      );
    const retryNonce = nonce();
    assert.equal(await save(data, retryNonce), await save(data, retryNonce));
    await as(null, "anon");
    assert.equal(
      (
        await db.query(
          "select * from public.exchange_search('request',$1,'','',1)",
          [service],
        )
      ).rows.length,
      0,
    );
    await as(owner);
    assert.equal(
      (
        await db.query("select * from public.catalog_requests where id=$1", [
          request,
        ])
      ).rows.length,
      1,
    );
    await call("public.exchange_delete_account()");
    assert.equal(
      (await db.query("select * from public.catalog_requests")).rows.length,
      0,
    );
    await assert.rejects(
      create("Intento después de la baja"),
      /ACCOUNT_DELETING/,
    );
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [owner]);
    assert.equal(
      (
        await db.query(
          "select * from public.catalog_requests where user_id=$1",
          [owner],
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
